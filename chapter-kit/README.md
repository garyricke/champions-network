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
| `assets/chapter-kit/<slug>-handouts.pdf` | 2 sheets, letter landscape. Each holds two identical 5.5×8.5 half-sheets — **print, then cut down the dashed centre line.** Sheet 1 = adult / neighboring congregations. Sheet 2 = students. |
| `assets/chapter-kit/<slug>-social-square.png` | 1080×1080 feed post |
| `assets/chapter-kit/<slug>-social-portrait.png` | 1080×1350 portrait / stories-safe |
| `assets/chapter-kit/qr-<slug>.svg` | QR → the chapter landing page |
| `assets/chapter-kit/thumbs/<slug>/` | Trim-clipped previews for review |
| `<slug>.html` (repo root) | Landing page, served at `champions-network.com/<slug>` |

## Starting a new chapter

1. Copy `chapters/boulder.json` to `chapters/<slug>.json`.
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
   - `photoGrade` — see below.
4. `node build-chapter-kit.js <slug>`
5. Commit and push. Netlify serves `/{slug}` from `<slug>.html` automatically.

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

## The overflow guard

Print boxes are fixed-height, so a paragraph that runs two lines long gets silently
clipped — and a thumbnail will not show it. The build measures every fixed container
(`scrollHeight` vs `clientHeight`, **plus** a padding-aware last-child check, because
`scrollHeight` omits a container's own `padding-bottom`) and **exits non-zero** on
overflow rather than shipping a cropped PDF.

If the build reports overflow, shorten the copy in `templates/` or reduce a fixed
height in `chapter-kit.css`. Do not raise the container height past the trim.

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
  templates/handouts.html   half-sheets, 2-up, adult + student
  templates/social.html     1080 square + 1080×1350
  templates/landing.html    web landing page
  chapter-kit.css           print styles (poster + handout + social)
  chapter-landing.css       landing page styles
  chapter-landing.js        RSVP submit (works without JS too)
  build/                    generated intermediate HTML — not for editing
print-build/build-chapter-kit.js
```
