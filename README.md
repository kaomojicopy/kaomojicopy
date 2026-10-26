# Kaomoji Copy

Static site for GitHub Pages. The pages are generated from data files, so you never edit the generated HTML by hand.

## Where things live
- `data/faces.json`      every face: `[face, category, note, popularity 0-100]` (popularity decides the "Popular" order and the homepage favorites)
- `data/categories.json` one entry per category page. Optional fields: `title`, `description`, `h1`, `intro` (blank line = new paragraph), `faq` (list of `{q, a}`)
- `data/site.json`       `siteUrl` (change this when you get your real address), `year`, `homeTitle`, `homeDescription`, `ogImage`
- `data/lastmod.json`    written by the build. Keeps each page's sitemap date; commit it so dates survive between builds
- `assets/img/og-image.png` social share preview (1200x630). Replace it with your own banner any time
- `templates/`           page layouts and the homepage text (`home.html`)
- `assets/css/style.css` the design. `assets/js/app.js` the behaviour

## After any change
    node build.js

This rewrites `index.html`, `404.html`, `kaomoji/*.html`, `sitemap.xml`, `robots.txt` and `assets/js/data.js`. Commit everything and push.

## Rules for faces.json
- Every face must be unique (favorites are saved by the face itself).
- The category must exist in `categories.json`, or the build stops and tells you which face is wrong.

## Notes
- Open Graph and canonical tags are only written when `siteUrl` is set (they need absolute URLs).
- Dark theme: follows the visitor's system until they press the toggle, then remembers the choice. Colours live as variables at the top of `style.css`.
- Sitemap dates only change for pages whose generated HTML actually changed.
