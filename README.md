# Weeks

Your life in weeks — one dot per week, on a single screen, with the past dimmed
and the future bright.

**Live:** https://bulatgab.github.io/lifespan/

Inspired by Wait But Why's [*Your Life in Weeks*](https://waitbutwhy.com/2014/05/life-weeks.html)
and Kurzgesagt's [*What Are You Doing With Your Life?*](https://www.youtube.com/watch?v=MBRqu0YOH14).

## What makes this one different

- **Nothing is stored anywhere.** No server, no account, no cookies, no
  `localStorage`. Every setting — date of birth, expected lifespan, every
  coloured period — is encoded in the page's query string. Bookmark the URL and
  you're done; open it on another device and it's the same.
- **One screen, no scrolling.** The grid picks the densest layout of square
  cells that fits the viewport, so it fills a phone in portrait, a phone in
  landscape, or a 4K monitor without clipping. Rows do *not* correspond to
  years; the point is the gestalt, not the calendar.
- **Custom periods.** Add any number of start/end/colour/label periods — school,
  a job, a relationship, a country — and they paint over the base dots. Leave
  the end empty for something still ongoing.
- **Everything else is under one button.** The grid is the page; a floating
  action button opens the settings sheet.

## URL format

```
?b=1990-01-01&l=80&r=2008-09-01~2013-06-30~ffb340~University&r=2019-03-01~~22c9a8~Germany
```

| key | meaning |
|-----|---------|
| `b` | date of birth, `YYYY-MM-DD` |
| `l` | expected lifespan in years (omitted when it's the default, 80) |
| `r` | one period: `start~end~rrggbb~label`, repeatable; empty `end` = ongoing (until today) |

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

## Licence

MIT — see [LICENSE](LICENSE).
