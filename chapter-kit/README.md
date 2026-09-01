# Champions Chapter Publicity Kit

One chapter = one JSON file. Everything else is generated.

## Build a chapter

```bash
cd print-build
node build-chapter-kit.js boulder     # one chapter
node build-chapter-kit.js             # every chapter in chapters/
```

## What comes out

| Output | Purpose |
|---|---|
| `assets/chapter-kit/<slug>-poster.pdf` | 8.5×11 poster, bleed + crop marks. Narthex, bulletin boards, campus. |
| `assets/chapter-kit/<slug>-handouts.pdf` | 2 sheets, letter landscape. Each holds two identical 5.5×8.5 half-sheets — **print, then cut down the dashed centre line.** Sheet 1 = audience A, sheet 2 = audience B (see **Chapter copy**). |
| `assets/chapter-kit/<slug>-social-square.png` | 1080×1080 feed post |
| `assets/chapter-kit/<slug>-social-portrait.png` | 1080×1350 portrait / stories-safe |
| `assets/chapter-kit/qr-<slug>.svg` | QR → the chapter landing page |
| `assets/chapter-kit/thumbs/<slug>/` | Trim-clipped previews for review |
| `<slug>.html` (repo root) | Landing page, served at `champions-network.com/<slug>` |

## Starting a new chapter

1. Copy the closest existing chapter to `chapters/<slug>.json` — `boulder.json` for a
   campus chapter, `st-stephen.json` for a parish one.
2. Upload the venue photo to Cloudinary and put its public ID in `photoId`. Never
   commit the raw photo.
   ```bash
   node print-build/cloudinary-upload.js ~/Downloads/photo.jpeg <slug>-venue
   ```
3. Edit the fields. The ones that matter most:
   - `sessions[]` — a `note` containing the word "parent" gets gold-flagged on the poster.
   - `adultHeadline` / `studentHeadline` — wrap the second half in `*asterisks*` to
     set it in gold. Keep both under ~55 characters or the poster headline runs long.
   - `landingUrl` / `landingUrlDisplay` / `qrFile` — all keyed to the slug.
   - `photoGrade` / `photoPosition` — see below.
   - the copy blocks — see **Chapter copy**.
4. `node build-chapter-kit.js <slug>`
5. Commit and push. Netlify serves `/{slug}` from `<slug>.html` automatically.

## Chapter copy

The templates hold the layout and the Network's standing language. Everything that
describes *this* chapter's people lives in the JSON, because chapters differ more
than they look: Boulder is a campus chapter hosted by students who need neighboring
congregations to fill the room; St. Stephen is a parish chapter inviting the rest of
the Liberty area in. The same prose cannot serve both.

| Field | Feeds |
|---|---|
| `posterColumns[2]` | The poster's two body columns — `{title, paras[]}` each. |
| `audienceA` / `audienceB` | The two handout sheets and the two landing "invitation" cards. `A` also drives the poster and the square social post; `B` drives the portrait post. |
| `audienceIntro` | The "Two invitations, one table" paragraph. Write the venue name out — a `{{token}}` inside a JSON value is **not** re-expanded. |
| `metaAudience` · `audienceNote` · `socialFooter` | The one-line "who this is open to", in three registers: `<meta>` description, inline on the poster/RSVP, and the social footer. |
| `socialPortraitEyebrow` | Eyebrow on the portrait post — usually "<N> <Day> Evenings · Save the Dates". |
| `roleOptions[]` | The RSVP form's "I'm coming as" menu. |

Inside any copy string, `**double asterisks**` set bold. (Single `*asterisks*` mean
gold, and only work in the two headline fields.) Bullets are `{lead, text}` pairs —
`lead` is bolded, `text` follows it.

Each audience block takes `handoutLead` (one paragraph, print) and `landingParas[]`
(the web version, usually the same lead plus one more). `bullets[]` is shared; add
`landingBullets[]` only when the web wording needs to differ.

**Keep the counts honest.** "Eight guided evenings" in `posterColumns` and "Eight
Wednesday Evenings" in `socialPortraitEyebrow` are prose — nothing syncs them to
`sessions[]`. Change the date list, re-read the copy.

## The cinematic look

Venue photos are usually flat, overcast phone snapshots. Two things fix that, and
they are deliberately split:

**1. Colour grade — Cloudinary, via `photoGrade` in the chapter JSON.**
A `/`-separated chain of transforms applied to the delivered image:

```
e_improve:outdoor/e_contrast:22/e_vibrance:38/co_rgb:ff9838,e_colorize:11/e_sharpen:40
```

Warms the light, deepens contrast, lifts saturation, and sharpens. Tune per chapter
— a photo shot at golden hour needs far less than an overcast one. Only one `e_`
effect per `/` component; they stack in order.

**2. Vignette — CSS, not Cloudinary.** Cloudinary's `e_vignette` fades to **white**,
which produces a 1995 soft-focus halo, not cinematic depth. The dark corner vignette
is a `radial-gradient` in the `__scrim` / `::after` layers of `chapter-kit.css` and
`chapter-landing.css`. Leave it there.

**Do not add `c_fill` / `ar_` to `photoGrade`.** Each surface frames the shot with
CSS `object-position`; a Cloudinary aspect crop on top of that double-crops and
slices the top off the building. The builder requests width only.

**3. Framing — optional, via `photoPosition` in the chapter JSON.**
Each surface has an `object-position` default baked into the CSS, tuned for a
building exterior where the subject sits low in the frame. An interior puts the
chancel much higher, so those defaults crop to a blank stretch of wall. Set
`photoPosition` (e.g. `"center 30%"`) to override the print surfaces — poster,
handouts, social — and `photoPositionWeb` for the landing hero, which is nearly the
photo's own aspect ratio and so rarely needs one. Omit both and every surface keeps
its default, which is why Boulder's output is untouched by this knob.

Percentages here are *image* positions: `center 30%` puts the point 30% down the
photo at the same relative spot in the box. Lower the number to reveal more of the
top of the frame.

## The overflow guard

Print boxes are fixed-height, so a paragraph that runs two lines long gets silently
clipped — and a thumbnail will not show it. The build measures every fixed container
(`scrollHeight` vs `clientHeight`, **plus** a padding-aware last-child check, because
`scrollHeight` omits a container's own `padding-bottom`) and **exits non-zero** on
overflow rather than shipping a cropped PDF.

If the build reports overflow, shorten the copy in `chapters/<slug>.json` — that is
where the prose lives — or reduce a fixed height in `chapter-kit.css`. Do not raise
the container height past the trim.

## RSVP

All chapters post to a single Netlify form named `chapter-rsvp`, with hidden `chapter`
and `chapter-slug` fields identifying which one. Submissions land in
**Netlify → Forms → chapter-rsvp**.

> **One-time setup:** add Carly (`Carly@champions-network.com`) as an email notification
> on that form in the Netlify UI. Without it, submissions are stored but nobody is told.

## Files

```
chapter-kit/
  chapters/<slug>.json      chapter data — the only file you edit per chapter
  templates/poster.html     8.5×11 poster
  templates/handouts.html   half-sheets, 2-up, one sheet per audience
  templates/social.html     1080 square + 1080×1350
  templates/landing.html    web landing page
  chapter-kit.css           print styles (poster + handout + social)
  chapter-landing.css       landing page styles
  chapter-landing.js        RSVP submit (works without JS too)
  build/                    generated intermediate HTML — not for editing
print-build/build-chapter-kit.js
```
