/* Quality check for the generated site. Run after the build:  node check.js
   Uses the same address as build.js (SITE_URL env var, else data/site.json). No dependencies. Exits with 1 if anything fails. */
const fs = require("fs"), path = require("path");
const root = __dirname;
const site = JSON.parse(fs.readFileSync(path.join(root, "data/site.json"), "utf8"));
const base = String(process.env.SITE_URL || site.siteUrl || "").trim().replace(/\/+$/, "");
const fails = [], warns = [];
const fail = m => fails.push(m), warn = m => warns.push(m);
if (!base) { console.error("No siteUrl set (data/site.json or SITE_URL)."); process.exit(1); }
const baseUrl = new URL(base), basePath = baseUrl.pathname.replace(/\/?$/, "/");
const unesc = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (["templates", "node_modules", ".git", "backup"].includes(e.name) ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]);
const htmlFiles = walk(root).filter(f => f.endsWith(".html")).map(f => path.relative(root, f).split(path.sep).join("/"));
const urlFor = rel => base + "/" + (rel === "index.html" ? "" : rel);
const titles = {}, descs = {}, own = new Set();
const ALLOWED_HOSTS = new Set([baseUrl.host, "fonts.googleapis.com", "fonts.gstatic.com", "schema.org", "www.w3.org", "github.com"]);

htmlFiles.forEach(rel => {
  const h = fs.readFileSync(path.join(root, rel), "utf8");
  const is404 = rel === "404.html";
  const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!title) fail(rel + ": missing <title>"); else { (titles[title] = titles[title] || []).push(rel); if (title.length > 65) warn(rel + ": title is " + title.length + " characters (long)"); }
  if (!is404) {
    if (!desc) fail(rel + ": missing meta description"); else { (descs[desc] = descs[desc] || []).push(rel); if (desc.length < 70 || desc.length > 160) warn(rel + ": description is " + desc.length + " characters"); }
    const canon = (h.match(/rel="canonical" href="([^"]*)"/) || [])[1];
    if (canon !== urlFor(rel)) fail(rel + ": canonical is " + canon + ", expected " + urlFor(rel));
    const ogu = (h.match(/property="og:url" content="([^"]*)"/) || [])[1];
    if (ogu !== urlFor(rel)) fail(rel + ": og:url is " + ogu + ", expected " + urlFor(rel));
    const ogi = (h.match(/property="og:image" content="([^"]*)"/) || [])[1];
    if (!ogi || !ogi.startsWith(base + "/")) fail(rel + ": og:image missing or not on " + base);
    else if (!fs.existsSync(path.join(root, ogi.slice(base.length + 1)))) fail(rel + ": og:image file does not exist: " + ogi);
    own.add(rel);
  } else if (!/noindex/.test(h)) fail("404.html: should be noindex");
  const h1s = (h.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) fail(rel + ": has " + h1s + " <h1> (expected 1)");
  /* internal links and assets */
  const dir = path.posix.dirname(rel);
  for (const m of h.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let u = unesc(m[1]), siteRel = false;
    if (/^(mailto:|tel:|javascript:|data:)/.test(u) || u.startsWith("#")) continue;
    if (/^https?:\/\//.test(u)) {
      let x; try { x = new URL(u); } catch (e) { fail(rel + ": bad URL " + u); continue; }
      if (!ALLOWED_HOSTS.has(x.host)) warn(rel + ": links to external host " + x.host);
      if (x.host === baseUrl.host && x.pathname.startsWith(basePath)) { u = x.pathname.slice(basePath.length); siteRel = true; }
      else continue;
    }
    u = u.split("#")[0].split("?")[0];
    if (!u) continue;
    let target;
    if (siteRel) target = u;
    else if (u.startsWith("/")) { /* root-absolute links (used on the 404 page) must start with the site's base path */
      if (basePath !== "/" && !u.startsWith(basePath)) { fail(rel + ": root link outside the site path: " + m[1]); continue; }
      target = u.slice(basePath.length);
    } else target = path.posix.normalize(path.posix.join(dir, u));
    if (target === "" || target.endsWith("/")) target += "index.html";
    if (!fs.existsSync(path.join(root, target))) fail(rel + ": broken link/asset " + m[1]);
  }
  /* FAQ structured data must match the visible questions */
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j; try { j = JSON.parse(m[1]); } catch (e) { fail(rel + ": invalid JSON-LD"); continue; }
    if (j["@type"] === "FAQPage") {
      const ld = j.mainEntity.map(q => q.name + "||" + q.acceptedAnswer.text);
      const vis = [...h.matchAll(/<details[^>]*><summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map(x => unesc(x[1]) + "||" + unesc(x[2]));
      if (JSON.stringify(ld) !== JSON.stringify(vis)) fail(rel + ": FAQ structured data does not match the visible FAQ");
    }
  }
});
Object.entries(titles).forEach(([t, f]) => f.length > 1 && fail("Duplicate title \"" + t + "\" on: " + f.join(", ")));
Object.entries(descs).forEach(([t, f]) => f.length > 1 && fail("Duplicate description on: " + f.join(", ")));

/* sitemap + robots */
const sm = fs.existsSync(path.join(root, "sitemap.xml")) ? fs.readFileSync(path.join(root, "sitemap.xml"), "utf8") : "";
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => unesc(m[1]));
const expected = [...own].map(urlFor);
expected.filter(u => !locs.includes(u)).forEach(u => fail("sitemap.xml is missing " + u));
locs.filter(u => !expected.includes(u)).forEach(u => fail("sitemap.xml lists a page that is not indexable/generated: " + u));
const robots = fs.existsSync(path.join(root, "robots.txt")) ? fs.readFileSync(path.join(root, "robots.txt"), "utf8") : "";
if (!robots.includes("Sitemap: " + base + "/sitemap.xml")) fail("robots.txt does not point to " + base + "/sitemap.xml");

/* any other copy of this site's address left in generated files? */
const stray = new Set();
walk(root).filter(f => /\.(html|xml|txt|js|json)$/.test(f) && !/data[\\/](site|lastmod)\.json$/.test(f)).forEach(f => {
  const t = fs.readFileSync(f, "utf8");
  for (const m of t.matchAll(/https?:\/\/([a-z0-9.-]+\.github\.io)/gi)) if (m[1] !== baseUrl.host) stray.add(path.relative(root, f) + " -> " + m[1]);
});
stray.forEach(s => fail("Address from a different site found: " + s));

console.log("Checked " + htmlFiles.length + " HTML files against " + base);
warns.forEach(w => console.log("  warning: " + w));
if (fails.length) { fails.forEach(f => console.log("  FAIL: " + f)); console.log(fails.length + " problem(s) found."); process.exit(1); }
console.log("All checks passed.");
