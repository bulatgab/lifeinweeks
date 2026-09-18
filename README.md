# Life in Weeks

Your life in weeks — one dot per week, on a single screen, with the past dimmed
and the future bright.

**Live:** https://bulatgab.github.io/lifeinweeks/

Inspired by Wait But Why's [*Your Life in Weeks*](https://waitbutwhy.com/2014/05/life-weeks.html)
and Kurzgesagt's [*When This Number Hits 5200, You Will Be Dead*](https://www.youtube.com/watch?v=JXeJANDKwDc)
(originally titled *What Are You Doing With Your Life? The Tail End*).

## What makes this one different

- **Nothing is stored anywhere.** No server, no account, no cookies, no
  `localStorage`. Every setting — date of birth, expected lifespan, every
  coloured period — is encoded in the page's query string. Bookmark the URL and
  you're done; open it on another device and it's the same.
- **One screen, no scrolling.** The grid picks the densest layout of square
  cells that fits the viewport, so it fills a phone in portrait, a phone in
  landscape, or a 4K monitor without clipping. Rows do *not* correspond to
  years; the point is the gestalt, not the calendar.
- **Custom periods and dates.** Add any number of start/end/colour/label
  periods — school, a job, a relationship, a country — and they paint over the
  base dots; tick "Ongoing" for something still running. Single dates — a
  wedding, a loss, a deadline — are drawn as a ring around the week's dot, so
  they stay visible on top of a period.
- **Four themes.** Dusk (vivid, after the Kurzgesagt video), Ink, Slate and
  Paper. Each theme's default period colours were checked all-pairs, on that
  theme's own background, for colour-vision-deficiency and normal-vision
  separation. The picker shows those defaults, then a ring of hues generated
  at one perceptual lightness for the theme, then a free picker — twenty
  swatches in two rows for every theme.
- **Optional "water" (`?c=1|2|3`).** Each region — every period, and the
  past and future too — is flooded with a recessive tint of its own colour:
  the dot colour mixed 55 % toward the theme's background in OKLab, so it
  recedes correctly on dark and light themes alike. Three edge styles:
  *scalloped* (a concave meniscus between the outer dots), *straight* (the
  edge runs tangent to the dots, whose circles form the corners) and
  *filled* (whole cells, so neighbouring regions touch). Scalloped is a
  union of clockwise primitives (a lens per adjacent pair, a square per 2×2
  block). Straight and filled trace each region's actual outline — holes
  included — offset it, and fillet every vertex with `arcTo`, so concave
  corners are rounded as well as convex ones; in the filled style a convex
  corner on one side is exactly the concave corner on the other, so regions
  tile without slivers.
- **Reorderable.** Drag a row's grip (mouse or touch) or press the arrow keys
  on it to reorder periods and dates. Order is paint order.
- **First open.** With no date of birth in the URL the chart shows a sample
  life — a 36-year-old, built relative to today so it never ages, in the
  current theme's colours — behind a welcome dialog with the About text, a
  language switch and "Continue". The sample lives only in the model: the URL
  and the settings form stay empty until you enter your own date.
- **Sharing.** A second, smaller button next to the settings one opens two
  options: copy the link (with a note that anyone opening it sees every date
  and label, because the link *is* the data) or save an image. The image is
  the chart plus the stats and legend rendered off-screen at 2–3×, handed to
  the share sheet on touch devices (on iOS that offers "Save Image") or
  downloaded as a PNG elsewhere. The share button is hidden while the sample
  chart is showing.
- **English and Russian.** Detected from the browser; an explicit choice is
  stored as `?lang=`. The picker is a "translate" icon (in the welcome dialog
  and the sheet header) that drops a two-entry menu styled like the rest of the
  app. Dates, numbers and plurals follow the language.
- **Everything else is under two buttons.** The grid is the page; a floating
  action button opens the settings sheet, a smaller one next to it the share
  options.

## URL format

```
?b=1990-01-01&l=80&t=slate
 &r=2008-09-01~2013-06-30~e6b450~University&r=2019-03-01~~5fb3a1~Germany
 &d=2015-08-22~c1666b~Wedding
```

| key | meaning |
|-----|---------|
| `b` | date of birth, `YYYY-MM-DD` |
| `l` | expected lifespan in years (omitted when it's the default, 80) |
| `t` | theme: `dusk` (default, omitted), `ink`, `slate`, `paper` |
| `r` | one period: `start~end~rrggbb~label`, repeatable; empty `end` = ongoing (until today) |
| `d` | one date: `date~rrggbb~label`, repeatable; drawn as a ring |
| `c` | connect dots: `1` scalloped, `2` straight, `3` filled |
| `lang` | `en` or `ru` (only written when chosen explicitly) |

Dates are entered through three native `<select>`s (day / month / year) rather
than `<input type="date">`: on iOS that gives the wheel picker, elsewhere a
plain dropdown, with no library.

Weeks are counted as whole 7-day blocks from the date of birth, so week *i*
covers days `[7i, 7i+7)`. All date arithmetic is done at UTC midnight, which
sidesteps daylight-saving off-by-ones.

## Running locally

It's three static files. Any static server works; ES modules need `http://`,
not `file://`:

```sh
python3 -m http.server 8080
# then open http://localhost:8080/
```

## Deploying

GitHub Pages serves the `main` branch root directly. `.nojekyll` tells Pages to
skip its Jekyll pass and serve the files verbatim.

## Search engines and link previews

- `index.html` carries the English UI text *in the markup* (the welcome/About
  dialog, the hints, the share explanations), not just in `I18N.en` — crawlers
  and link-preview scrapers that don't run JavaScript only see the file.
  `applyLang()` rewrites it on boot, so **when you change an English string,
  change it in both places.** On the bare URL the welcome dialog is open, so
  its text is what a rendering crawler sees as the page.
- The canonical link is injected by `applyCanonical()` in `app.js`, never written
  in the HTML, and always points at the bare page (plus `?lang=ru` when chosen).
  Google reads it from the rendered DOM; Facebook/LinkedIn scrapers don't run JS,
  so a shared chart keeps linking to its full URL rather than the empty page.
  For the same reason there is no `og:url`.
- `og.png` (2400×1260) is a headless-Chrome screenshot of the app itself with a
  sample life, the floating button hidden. To regenerate after a visual change,
  serve the folder and run:

  ```sh
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
    --hide-scrollbars --window-size=1200,630 --force-device-scale-factor=2 \
    --virtual-time-budget=4000 --screenshot=og.png \
    'http://localhost:8080/?b=1990-06-15&r=1996-09-01~2007-06-30~ffb340~School&r=2007-09-01~2012-06-30~22c9a8~University&r=2012-09-01~2018-03-31~4f9df9~First%20job&r=2018-04-01~~b45309~Berlin&d=2016-08-20~f0f0f5~Wedding'
  ```

  (add `<style>#fab{display:none}</style>` to a scratch copy of `index.html`
  first, or crop the button out.)
- `sitemap.xml` lists the one page; submit it in Google Search Console and Bing
  Webmaster Tools. A `robots.txt` here would be ignored — crawlers only read the
  one at the host root, `https://bulatgab.github.io/robots.txt`, which lives in
  the `bulatgab.github.io` repo and already allows everything.

## Licence

MIT — see [LICENSE](LICENSE).
