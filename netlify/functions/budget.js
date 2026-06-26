/* ============================================================
   Clockify budget proxy — Champions Network
   Holds the API key server-side (Netlify env: CLOCKIFY_API_KEY).
   Returns computed hours ONLY — the key is never exposed.

   Budget basis: $6,000 maintenance retainer (Invoice 03043702),
   Mar 1 – Aug 31 2026, @ $100/hr = 60 hours, across the two
   projects "LCRL Champions Network" + "LCRL Pod-2" combined.

   The meter tracks IN-PERIOD hours (Mar 1 2026 →). Work before
   the retainer (e.g. Oct/Nov 2025) is reported but flagged, not
   counted against this budget.
   ============================================================ */
'use strict';

const BASE_URL = 'https://api.clockify.me/api/v1';
const REPORTS_URL = 'https://reports.api.clockify.me/v1';
const TARGET_PROJECTS = ['LCRL Champions Network', 'LCRL Pod-2'];

const RETAINER = { start: '2026-03-01', end: '2026-09-01', hours: 60, dollars: 6000 }; // end exclusive

// Clockify caps the detailed report at a 1-year range; entries on these
// projects begin Oct 2025, so a rolling 1-year window captures them all.
function rangeStart() { return new Date(Date.now() - 364 * 864e5).toISOString(); }

// Detailed-report entries carry duration as NUMERIC SECONDS. Handle both
// that and the ISO-8601 string form the projects endpoint uses → hours.
function durHours(d) {
  if (typeof d === 'number') return d / 3600;
  if (typeof d === 'string') {
    const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
    if (!m) return 0;
    return parseInt(m[1] || '0', 10) + parseInt(m[2] || '0', 10) / 60 + parseFloat(m[3] || '0') / 3600;
  }
  return 0;
}
function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function monthLabel(key) { const [y, m] = key.split('-'); return MONTHS[+m - 1] + ' ' + y; }
function inRetainer(dateStr) { return dateStr >= RETAINER.start && dateStr < RETAINER.end; }

async function api(path, key) {
  const res = await fetch(BASE_URL + path, { headers: { 'X-Api-Key': key } });
  if (!res.ok) throw new Error(`Clockify ${res.status} on ${path}`);
  return res.json();
}

exports.handler = async function () {
  const key = process.env.CLOCKIFY_API_KEY;
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' };
  if (!key) return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'CLOCKIFY_API_KEY not configured' }) };

  try {
    const workspaces = await api('/workspaces', key);
    if (!workspaces.length) return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'No workspaces' }) };
    const wid = workspaces[0].id;

    // find the two target projects
    let all = [], page = 1;
    while (true) {
      const ps = await api(`/workspaces/${wid}/projects?page=${page}&page-size=50&hydrated=true`, key);
      if (!ps || ps.length === 0) break;
      all = all.concat(ps);
      if (ps.length < 50) break;
      page++;
    }
    const wanted = TARGET_PROJECTS.map(norm);
    const matched = all.filter((p) => wanted.includes(norm(p.name)));
    const idToName = {};
    matched.forEach((p) => { idToName[p.id] = p.name; });
    const ids = matched.map((p) => p.id);
    const foundNames = matched.map((p) => norm(p.name));
    const missing = TARGET_PROJECTS.filter((t) => !foundNames.includes(norm(t)));

    // pull every time entry for those projects (1-yr window) via detailed report
    let entries = [], rpage = 1;
    while (ids.length) {
      const res = await fetch(`${REPORTS_URL}/workspaces/${wid}/reports/detailed`, {
        method: 'POST',
        headers: { 'X-Api-Key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRangeStart: rangeStart(),
          dateRangeEnd: new Date().toISOString(),
          detailedFilter: { page: rpage, pageSize: 1000 },
          exportType: 'JSON',
          projects: { ids },
        }),
      });
      if (!res.ok) break;
      const data = await res.json();
      const te = (data && data.timeentries) || [];
      if (te.length === 0) break;
      entries = entries.concat(te);
      if (te.length < 1000) break;
      rpage++;
    }

    // aggregate
    const months = {}; // key -> hours
    const proj = {};   // name -> { inHours, allHours, count, first, last }
    TARGET_PROJECTS.forEach((n) => { proj[n] = { name: n, inHours: 0, allHours: 0, count: 0, first: null, last: null }; });
    const recent = [];
    let inPeriodHours = 0, allTrackedHours = 0;

    entries.forEach((e) => {
      const start = e.timeInterval && e.timeInterval.start;
      const hrs = durHours(e.timeInterval && e.timeInterval.duration);
      const name = idToName[e.projectId] || e.projectName || 'Unknown';
      const day = start ? start.slice(0, 10) : null;
      allTrackedHours += hrs;
      if (proj[name]) { proj[name].allHours += hrs; proj[name].count += 1; }
      if (day) {
        const mk = day.slice(0, 7);
        months[mk] = (months[mk] || 0) + hrs;
        if (proj[name]) {
          if (!proj[name].first || day < proj[name].first) proj[name].first = day;
          if (!proj[name].last || day > proj[name].last) proj[name].last = day;
        }
        if (inRetainer(day)) {
          inPeriodHours += hrs;
          if (proj[name]) proj[name].inHours += hrs;
        }
      }
      recent.push({ start, day, project: name, desc: e.description || '(no description)', hours: +hrs.toFixed(2) });
    });

    const monthList = Object.keys(months).sort().map((k) => ({
      key: k, label: monthLabel(k), hours: +months[k].toFixed(2),
      dollars: Math.round(months[k] * 100), inRetainer: (k >= RETAINER.start.slice(0, 7) && k < RETAINER.end.slice(0, 7)),
    }));

    const projects = TARGET_PROJECTS.map((n) => ({
      name: n,
      inHours: +proj[n].inHours.toFixed(2),
      allHours: +proj[n].allHours.toFixed(2),
      inDollars: Math.round(proj[n].inHours * 100),
      count: proj[n].count,
      first: proj[n].first,
      last: proj[n].last,
    }));

    recent.sort((a, b) => (b.start || '').localeCompare(a.start || ''));
    const recentTop = recent.slice(0, 15).map((r) => ({
      date: r.day || '—', project: r.project, desc: r.desc, hours: r.hours, inRetainer: r.day ? inRetainer(r.day) : false,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        rate: 100,
        retainer: RETAINER,
        usedHours: +inPeriodHours.toFixed(2),     // drives the meter (in-period)
        allTrackedHours: +allTrackedHours.toFixed(2),
        preRetainerHours: +(allTrackedHours - inPeriodHours).toFixed(2),
        projects,
        months: monthList,
        recent: recentTop,
        entryCount: entries.length,
        missing,
        generatedAt: new Date().toISOString(),
      }),
    };
  } catch (err) {
    return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: String(err.message || err) }) };
  }
};
