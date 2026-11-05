# Kaomoji Copy

Static site. The code lives on GitHub and can be deployed on Netlify (see below) or on GitHub Pages. The pages are generated from data files, so you never edit the generated HTML by hand.

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

## Ad placement plan (not installed yet)
No ad code is on the site, and the Privacy Policy says so. When AdSense is added, update `templates/pages/privacy.html` first (ad cookies, how to opt out, consent banner for EU visitors).

Planned slots, so the layout stays clean:
- Homepage: one slot after the "Crowd favorites" grid and its "Show me more" button, and one before the FAQ.
- Collection pages: one slot after the long-form sections (below the faces grid), and one before the FAQ.
- Guides: one slot after the second section.
- Never inside or directly next to the faces grid, copy buttons, hearts, or the generator buttons (accidental clicks).
- No popups, no sticky bars covering content, and nothing above the fold on mobile.
- Reserve a fixed height for each slot so the page does not jump while the ad loads.

## Deploy on Netlify (code stays on GitHub)
1. In Netlify choose Add new site, then Import an existing project, then GitHub, and pick this repository.
2. The settings come from `netlify.toml`, so leave the form as it is: build command `node build.js && node check.js`, publish folder `dist`.
3. Press Deploy. Every `git push` to the main branch deploys again by itself.

How it works:
- Netlify builds the pages itself into `dist/`. Only `dist/` is published, so `data/`, `templates/` and `build.js` are not public.
- The site address (canonical links, sitemap, robots.txt, social cards) is taken from Netlify's `URL` variable. When you add a custom domain and make it the primary domain, the next deploy uses it automatically. To force an address, add an environment variable `SITE_URL` in Netlify (Site configuration, Environment variables).
- If `check.js` finds a problem, the deploy stops and the old version stays live. The log shows which page failed.
- Locally you can test the same thing with: `OUT_DIR=dist SITE_URL=https://example.netlify.app node build.js && OUT_DIR=dist SITE_URL=https://example.netlify.app node check.js`

After the first deploy:
- Turn off GitHub Pages (repo Settings, Pages, unpublish), so there are not two copies of the same site.
- Add the new address as a property in Google Search Console and verify it again (the verification file is tied to the old address), then submit `/sitemap.xml`.
- Update `siteUrl` in `data/site.json` to the new address, so local builds match.
- The Privacy Policy mentions Netlify as the host. Update it again when ads are added.
