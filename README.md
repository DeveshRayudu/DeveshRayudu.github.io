# Devesh Rayudu | Portfolio

A static portfolio site (HTML, CSS and vanilla JavaScript, no build step).
Projects and the contribution calendar come from GitHub, so new repositories
appear on their own.

## Structure

```
index.html            Page content (sections, pipelines, markup)
css/
  tokens.css          Colours, dark theme, safe-area insets
  base.css            Reset, typography, global defaults
  layout.css          Nav, hero, sections, timeline, footer
  components.css      Buttons, chips, cards, dialog, README styles
  pipelines.css       Pipeline tabs and the animated step flow
  activity.css        Month-by-month GitHub calendar
js/
  utils.js            Shared helpers, reveal-on-scroll, count-up
  readme.js           README summary and Markdown rendering
  github.js           Live GitHub requests
  activity.js         Contribution calendar
  pipelines.js        Pipeline tabs and run animation
  projects.js         Project cards, filters, search, dialog, start-up
  ui.js               Hero typing line, theme toggle
data/
  snapshot.js         Fallback copy of the GitHub data
assets/images/        Profile photo, favicon
scripts/
  update_snapshot.py  Refreshes data/snapshot.js
```

Script order in `index.html` matters: later files use helpers from earlier ones.

## Run locally

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8000
```

## Deploy on GitHub Pages

1. Create a repo named `DeveshRayudu.github.io` and push this folder to it.
2. In the repo, go to Settings > Pages and deploy from the `main` branch root.

When hosted this way the page reads your repos, READMEs and contribution
calendar live. A repo only gets its own project card once it has a real README.

## Keeping it up to date

- **Projects:** push a repo with a README. Nothing else to do.
- **Fallback snapshot:** run `python scripts/update_snapshot.py` now and then.
- **Pipelines:** edit the `#pipelines` section in `index.html`. Each project is
  one `<div class="pipe">` plus a tab button; to link a GitHub repo to its
  pipeline, add it to the `PF` map in `js/pipelines.js`.
- **Colours:** change the values in `css/tokens.css`.

## Notes

- The calendar uses a free third-party API (github-contributions-api.jogruber.de)
  for live data and falls back to the snapshot if it is unavailable.
- Fonts (Plus Jakarta Sans, Inter) load from Google Fonts.
