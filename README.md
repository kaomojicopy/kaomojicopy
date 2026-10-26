# Kaomoji Copy

Static site for GitHub Pages. The pages are generated from data files, so you never edit the generated HTML by hand.

## Where things live
- `data/faces.json`      every face: `[face, category, note, popularity 0-100]` (popularity decides the "Popular" order and the homepage favorites)
- `data/categories.json` one entry per category page. Fields: `label`, `keywords` (extra search words), `title`, `description`, `intro` (blank line = new paragraph), `faq` (list of `{q, a}`)
- `data/site.json`       `siteUrl` (the one place for the production address), `name`, `year`, `homeTitle`, `homeDescription`, `ogImage`, `contactEmail` (shown on the Contact page when filled in), `githubRepo`
- `data/home.json`       the homepage FAQ (also written as FAQ structured data, so it always matches the page)
- `data/lastmod.json`    written by the build. Keeps each page's sitemap date; commit it so dates survive between builds
- `assets/img/og-image.png` social share preview (1200x630). Replace it with your own banner any time
- `templates/`           page layouts and the homepage text (`home.html`); `templates/pages/` holds the About, Contact, Privacy and Terms text
- `assets/css/style.css` the design. `assets/js/app.js` the behaviour

## After any change
    node build.js

This rewrites `index.html`, `404.html`, `about.html`, `contact.html`, `privacy.html`, `terms.html`, `kaomoji/*.html`, `sitemap.xml`, `robots.txt` and `assets/js/data.js`. Then run the checker:

    node check.js

It verifies canonical and og tags, unique titles and descriptions, one H1 per page, internal links, the sitemap, robots.txt, and that FAQ structured data matches the visible FAQ. Commit everything and push.

## Changing the address (domain or subdomain)
Edit `siteUrl` in `data/site.json`, or override it for one build without editing any file:

    SITE_URL=https://kaomoji.example.com node build.js
    SITE_URL=https://kaomoji.example.com node check.js

Every canonical, og tag, sitemap entry and the robots.txt sitemap line is generated from that one value. Use the same value for both commands.

## Rules for faces.json
- Every face must be unique (favorites are saved by the face itself).
- The category must exist in `categories.json`, or the build stops and tells you which face is wrong.

## Notes
- Open Graph and canonical tags are only written when `siteUrl` is set (they need absolute URLs).
- Dark theme: follows the visitor's system until they press the toggle, then remembers the choice. Colours live as variables at the top of `style.css`.
- Sitemap dates only change for pages whose generated HTML actually changed.
