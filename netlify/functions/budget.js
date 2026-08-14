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

// The budget only covers Mar 1 2026 onward — nothing before March is
// fetched or counted. Cap the end at the retainer close so post-Aug work
// can't sneak in either. (Both inside Clockify's 1-year report window.)
function rangeStart() { return RETAINER.start + 'T00:00:00.000Z'; }
function rangeEnd() {
  const now = new Date().toISOString();
  const end = RETAINER.end + 'T00:00:00.000Z';
  return now < end ? now : end;
}

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

// Clockify occasionally takes tens of seconds to answer. Netlify kills the
// function long before that, so every call gets its own deadline and we fail
// fast with a usable message instead of hanging until the platform 502s.
const CALL_TIMEOUT_MS = 7000;

async function withTimeout(url, opts, label) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CALL_TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`Clockify timed out on ${label}`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// A cold container has no memo to fall back on, and Clockify stalls just often
// enough that one unlucky call would 502 the panel. The happy path is ~1.2s, so
// a single retry fits comfortably inside the platform's time budget.
async function api(path, key) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await withTimeout(BASE_URL + path, { headers: { 'X-Api-Key': key } }, path);
      if (!res.ok) throw new Error(`Clockify ${res.status} on ${path}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

// Warm-container memo. The figures move a few times a day at most, so serving
// a recent copy is both faster and kinder to Clockify's rate limits. Kept as
// last-good too: if Clockify is down, stale numbers beat "Unavailable".
const TTL_MS = 5 * 60 * 1000;
let memo = null; // { at: epochMs, payload: object }

exports.handler = async function () {
  const key = process.env.CLOCKIFY_API_KEY;
  const headers = {
    'Content-Type': 'application/json',
    // Browser holds 5 min; the CDN holds 10 and may serve a stale copy for a
    // day while it refetches, so a Clockify blip never reaches the page.
    'Cache-Control': 'public, max-age=300',
    'Netlify-CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
  };
  if (!key) return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'CLOCKIFY_API_KEY not configured' }) };

  if (memo && Date.now() - memo.at < TTL_MS) {
    return { statusCode: 200, headers, body: JSON.stringify({ ...memo.payload, cached: true }) };
  }

  const startedAt = Date.now();

  try {
    const workspaces = await api('/workspaces', key);
    if (!workspaces.length) return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'No workspaces' }) };
    const wid = workspaces[0].id;

    // Find the two target projects. We only ever use id and name, so do NOT ask
    // for hydrated projects — that expands memberships, tasks and estimates for
    // every project in the workspace and was taking long enough to blow the
    // function's time budget. Bigger pages, and stop as soon as both are found.
    const wanted = TARGET_PROJECTS.map(norm);
    let all = [], page = 1;
    while (page <= 10) {
      const ps = await api(`/workspaces/${wid}/projects?page=${page}&page-size=200&archived=false`, key);
      if (!ps || ps.length === 0) break;
      all = all.concat(ps);
      if (all.filter((p) => wanted.includes(norm(p.name))).length >= TARGET_PROJECTS.length) break;
      if (ps.length < 200) break;
      page++;
    }
    const matched = all.filter((p) => wanted.includes(norm(p.name)));
    const idToName = {};
    matched.forEach((p) => { idToName[p.id] = p.name; });
    const ids = matched.map((p) => p.id);
    const foundNames = matched.map((p) => norm(p.name));
    const missing = TARGET_PROJECTS.filter((t) => !foundNames.includes(norm(t)));

    // pull every time entry for those projects (1-yr window) via detailed report
    let entries = [], rpage = 1;
    while (ids.length && rpage <= 10) {
      const res = await withTimeout(`${REPORTS_URL}/workspaces/${wid}/reports/detailed`, {
        method: 'POST',
        headers: { 'X-Api-Key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRangeStart: rangeStart(),
          dateRangeEnd: rangeEnd(),
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

    // aggregate — everything here is already Mar 1 2026 onward. We still
    // guard with inRetainer() so no stray pre-March entry can slip in.
    const months = {}; // key -> hours
    const proj = {};   // name -> { hours, count, first, last }
    TARGET_PROJECTS.forEach((n) => { proj[n] = { name: n, hours: 0, count: 0, first: null, last: null }; });
    const recent = [];
    let usedHours = 0;

    entries.forEach((e) => {
      const start = e.timeInterval && e.timeInterval.start;
      const day = start ? start.slice(0, 10) : null;
      if (!day || !inRetainer(day)) return; // hard exclude anything before Mar 1
      const hrs = durHours(e.timeInterval && e.timeInterval.duration);
      const name = idToName[e.projectId] || e.projectName || 'Unknown';

      usedHours += hrs;
      months[day.slice(0, 7)] = (months[day.slice(0, 7)] || 0) + hrs;
      if (proj[name]) {
        proj[name].hours += hrs;
        proj[name].count += 1;
        if (!proj[name].first || day < proj[name].first) proj[name].first = day;
        if (!proj[name].last || day > proj[name].last) proj[name].last = day;
      }
      recent.push({ start, day, project: name, desc: e.description || '(no description)', hours: +hrs.toFixed(2) });
    });

    const monthList = Object.keys(months).sort().map((k) => ({
      key: k, label: monthLabel(k), hours: +months[k].toFixed(2), dollars: Math.round(months[k] * 100),
    }));

    const projects = TARGET_PROJECTS.map((n) => ({
      name: n,
      inHours: +proj[n].hours.toFixed(2),
      inDollars: Math.round(proj[n].hours * 100),
      count: proj[n].count,
      first: proj[n].first,
      last: proj[n].last,
    }));

    recent.sort((a, b) => (b.start || '').localeCompare(a.start || ''));
    const recentTop = recent.slice(0, 15).map((r) => ({
      date: r.day || '—', project: r.project, desc: r.desc, hours: r.hours,
    }));

    const payload = {
      ok: true,
      rate: 100,
      retainer: RETAINER,
      usedHours: +usedHours.toFixed(2),   // in-period only (Mar 1 →)
      projects,
      months: monthList,
      recent: recentTop,
      entryCount: recent.length,
      missing,
      generatedAt: new Date().toISOString(),
      elapsedMs: Date.now() - startedAt,
    };
    memo = { at: Date.now(), payload };

    return { statusCode: 200, headers, body: JSON.stringify(payload) };
  } catch (err) {
    // Clockify slow or down. Numbers from an hour ago are far more use to the
    // page than an error, so serve the last good copy and say it's stale.
    if (memo) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...memo.payload,
          stale: true,
          staleSince: new Date(memo.at).toISOString(),
          error: String(err.message || err),
        }),
      };
    }
    return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: String(err.message || err) }) };
  }
};
