(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var KEY = "kaomoji-copy-favorites", THEME_KEY = "kaomoji-copy-theme", favs = new Set();
  try { favs = new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch (e) {}
  function saveFavs() { try { localStorage.setItem(KEY, JSON.stringify(Array.from(favs))); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---------- theme: follows the system until the visitor picks one ---------- */
  var root = document.documentElement, themeBtn = $("#theme-toggle");
  function applyTheme(t, persist) {
    root.setAttribute("data-theme", t);
    if (persist) { try { localStorage.setItem(THEME_KEY, t); } catch (e) {} }
    if (themeBtn) {
      var dark = t === "dark";
      themeBtn.textContent = dark ? "☀" : "☾";
      themeBtn.setAttribute("aria-pressed", dark);
      themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    }
  }
  applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light", false);
  if (themeBtn) themeBtn.addEventListener("click", function () { applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true); });
  if (window.matchMedia) {
    var mq = matchMedia("(prefers-color-scheme: dark)");
    var follow = function (e) {
      var saved = null; try { saved = localStorage.getItem(THEME_KEY); } catch (x) {}
      if (!saved) applyTheme(e.matches ? "dark" : "light", false);
    };
    if (mq.addEventListener) mq.addEventListener("change", follow);
  }

  /* ---------- feedback: toast (visual) + live region (screen readers) ---------- */
  var tt, at;
  function toast(msg) {
    var el = $("#toast"); if (!el) return;
    el.textContent = "";
    var s = document.createElement("span"); s.textContent = "✓";
    el.appendChild(s); el.appendChild(document.createTextNode(" " + msg));
    el.classList.add("show"); clearTimeout(tt);
    tt = setTimeout(function () { el.classList.remove("show"); }, 1800);
  }
  function announce(msg) {
    var a = $("#announcer"); if (!a) return;
    a.textContent = ""; clearTimeout(at);
    at = setTimeout(function () { a.textContent = msg; }, 60);
  }
  function flash(card) {
    if (!card) return;
    var tag = card.querySelector(".card-copy");
    clearTimeout(card._t);
    card.classList.remove("copied"); void card.offsetWidth; card.classList.add("copied");
    if (tag) tag.textContent = "copied ✓";
    card._t = setTimeout(function () { card.classList.remove("copied"); if (tag) tag.textContent = "copy ↗"; }, 1300);
  }
  function copy(text, card) {
    function ok() { toast("Copied to clipboard!"); announce("Copied " + text + " to clipboard"); flash(card); }
    function old() { /* fallback for older browsers and non-HTTPS pages */
      var a = document.createElement("textarea");
      a.value = text; a.setAttribute("readonly", ""); a.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      document.body.appendChild(a); a.select(); a.setSelectionRange(0, text.length);
      var done = false;
      try { done = document.execCommand("copy"); } catch (e) {}
      a.remove();
      if (done) ok(); else { toast("Select and copy: " + text); announce("Copy failed. Select the face and copy it by hand."); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, old); else old();
  }

  /* ---------- favorites ---------- */
  function paintFavs() {
    $$("[data-favorite]").forEach(function (b) {
      var on = favs.has(b.dataset.favorite);
      b.classList.toggle("is-favorite", on);
      b.textContent = on ? "♥" : "♡";
      b.setAttribute("aria-pressed", on);
      b.setAttribute("aria-label", (on ? "Remove " : "Add ") + b.dataset.favorite + (on ? " from" : " to") + " favorites");
    });
    var c = $("#favorite-count"); if (c) c.textContent = favs.size;
  }
  var onFavChange = function () {};

  /* one click listener for every card on the page (event delegation) */
  document.addEventListener("click", function (e) {
    var f = e.target.closest("[data-favorite]");
    if (f) {
      var t = f.dataset.favorite, had = favs.has(t);
      if (had) favs.delete(t); else favs.add(t);
      saveFavs(); onFavChange(); paintFavs();
      announce((had ? "Removed " : "Added ") + t + (had ? " from" : " to") + " favorites");
      return;
    }
    var c = e.target.closest("[data-copy]");
    if (c) copy(c.dataset.copy, c.closest(".kaomoji-card"));
  });

  /* ---------- mobile menu ---------- */
  var toggle = $("#menu-toggle"), nav = $("#main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); } });
  }

  var grid = $("#kaomoji-grid");

  /* ---------- category pages: instant filter ---------- */
  var filter = $("#filter");
  if (filter && grid) {
    var cards = $$(".kaomoji-card"), ft;
    filter.addEventListener("input", function () {
      var q = filter.value.trim().toLowerCase(), n = 0;
      cards.forEach(function (c) {
        var show = !q || c.dataset.text.indexOf(q) > -1;
        c.hidden = !show; if (show) n++;
      });
      $("#shown").textContent = n;
      $("#nomatch").classList.toggle("hidden", n > 0);
      clearTimeout(ft); ft = setTimeout(function () { announce(n + (n === 1 ? " face" : " faces") + " shown"); }, 400);
    });
  }

  /* ---------- homepage ---------- */
  if (grid && grid.dataset.page === "home" && window.KAO) {
    var L = window.KAO_LABELS, KW = window.KAO_KEYWORDS;
    var faces = window.KAO.map(function (f, i) { return { t: f[0], c: f[1], n: f[2], p: f[3], i: i }; });
    var mood = "all", term = "", sort = "popular", visible = 12, input = $("#search-input"), st;

    var card = function (f) {
      return '<article class="kaomoji-card"><button class="favorite-btn" type="button" data-favorite="' + esc(f.t) + '">♡</button>' +
        '<button class="kaomoji-face" type="button" data-copy="' + esc(f.t) + '" aria-label="Copy ' + esc(f.t) + '">' + esc(f.t) + '</button>' +
        '<span class="card-tag">' + esc(f.n) + '</span><span class="card-copy" aria-hidden="true">copy ↗</span></article>';
    };
    var list = function () {
      var words = term ? term.split(/\s+/) : [];
      var r = faces.filter(function (f) {
        if (mood !== "all" && f.c !== mood) return false;
        var hay = (f.t + " " + f.n + " " + L[f.c] + " " + f.c + " " + (KW[f.c] || "")).toLowerCase();
        return words.every(function (w) { return hay.indexOf(w) > -1; });
      });
      if (sort === "az") r.sort(function (a, b) { return a.n.localeCompare(b.n); });
      else if (sort === "new") r.sort(function (a, b) { return b.i - a.i; });
      else r.sort(function (a, b) { return b.p - a.p || a.i - b.i; });
      return r;
    };
    var renderFavs = function () {
      var r = faces.filter(function (f) { return favs.has(f.t); });
      $("#favorites-grid").innerHTML = r.map(card).join("");
      $("#favorites-empty").classList.toggle("hidden", r.length > 0);
    };
    var render = function (say) {
      var r = list();
      $("#results-title").innerHTML = (term ? "Search results" : mood === "all" ? "Crowd favorites" : esc(L[mood]) + " faces") + ' <span class="heading-doodle">✳</span>';
      $("#results-subtitle").textContent = term ? "Little faces matching “" + term + "”." : "Little expressions, ready to copy and make your own.";
      $("#result-count").textContent = r.length + " little face" + (r.length === 1 ? "" : "s");
      grid.innerHTML = r.slice(0, visible).map(card).join("");
      $("#empty-state").classList.toggle("hidden", r.length !== 0);
      $("#load-more").classList.toggle("hidden", r.length <= visible);
      var fl = $("#full-link");
      if (mood !== "all" && !term) { fl.href = "kaomoji/" + mood + ".html"; fl.textContent = "Open the full " + L[mood].toLowerCase() + " page ↗"; fl.classList.remove("hidden"); }
      else fl.classList.add("hidden");
      renderFavs(); paintFavs();
      if (say) { clearTimeout(st); st = setTimeout(function () { announce(r.length + (r.length === 1 ? " face" : " faces") + " found"); }, 400); }
    };
    onFavChange = renderFavs;
    var chooseMood = function (m) {
      mood = m; visible = 12;
      $$(".side-link").forEach(function (b) { b.classList.toggle("active", b.dataset.mood === m); });
      $$(".mood-card").forEach(function (b) { b.classList.toggle("selected", b.dataset.mood === m); });
      render(true);
    };
    var reset = function () { input.value = ""; term = ""; chooseMood("all"); };

    input.addEventListener("input", function () { term = input.value.trim().toLowerCase(); visible = 12; render(true); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") $("#explore").scrollIntoView(); });
    $("#sort-select").addEventListener("change", function (e) { sort = e.target.value; render(); });
    $$(".mood-card, .side-link").forEach(function (b) { b.addEventListener("click", function () { chooseMood(b.dataset.mood); }); });
    $("#clear-filters").addEventListener("click", reset);
    $("#reset-search").addEventListener("click", reset);
    $("#load-more").addEventListener("click", function () { visible += 12; render(); });
    $("#surprise-me").addEventListener("click", function () {
      var f = faces[Math.floor(Math.random() * faces.length)];
      $("#surprise-face").textContent = f.t; copy(f.t);
    });
    render();
  } else { paintFavs(); }
})();
