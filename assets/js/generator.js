(function () {
  "use strict";
  var P = window.KAO_PARTS, $ = function (s) { return document.querySelector(s); };
  if (!P || !$("#gen-controls")) return;
  var groups = [["Frame", "frames"], ["Eyes", "eyes"], ["Mouth", "mouths"], ["Cheeks", "cheeks"], ["Arms", "arms"], ["Extra", "extras"]];
  var DECOR = ["cheeks", "arms", "extras"], CORE = ["frames", "eyes", "mouths"];
  function find(key, val) { var l = P[key], s = JSON.stringify(val); for (var i = 0; i < l.length; i++) if (JSON.stringify(l[i]) === s) return i; return 0; }
  var DEF = { frames: find("frames", ["(", ")"]), eyes: find("eyes", ["◕", "◕"]), mouths: find("mouths", "ω"), cheeks: 0, arms: 0, extras: 0 };
  var sel = Object.assign({}, DEF);
  function build() {
    var fr = P.frames[sel.frames], ey = P.eyes[sel.eyes], ch = P.cheeks[sel.cheeks], ar = P.arms[sel.arms];
    return ar[0] + fr[0] + ch[0] + ey[0] + P.mouths[sel.mouths] + ey[1] + ch[1] + fr[1] + ar[1] + P.extras[sel.extras];
  }
  function label(v) { var t = Array.isArray(v) ? v.join(" ").trim() : String(v).trim(); return t === "" ? "None" : t; }
  function say(m) { var a = $("#announcer"); if (a) { a.textContent = ""; setTimeout(function () { a.textContent = m; }, 60); } }
  var copyBtn = $("#gen-copy"), favBtn = $("#gen-fav"), faceEl = $("#gen-face"), status = $("#gen-status");
  function updateStatus() {
    var face = build().trim();
    if (!face) status.textContent = "Choose some parts to build a face.";
    else status.textContent = window.KC && window.KC.isFav(face) ? "Saved in your favorites ♥" : "Tap ♡ to save this face.";
  }
  function paint() {
    var raw = build(), face = raw.trim(), empty = face === "";
    faceEl.textContent = empty ? "" : raw;
    copyBtn.disabled = empty; copyBtn.dataset.copy = empty ? "" : raw;
    if (empty) { favBtn.removeAttribute("data-favorite"); favBtn.disabled = true; favBtn.textContent = "♡"; favBtn.setAttribute("aria-pressed", "false"); favBtn.setAttribute("aria-label", "Add to favorites"); }
    else { favBtn.disabled = false; favBtn.dataset.favorite = raw; }
    document.querySelectorAll(".gen-opt").forEach(function (b) { b.setAttribute("aria-pressed", sel[b.dataset.group] === +b.dataset.index); });
    if (window.KC) window.KC.paint();
    updateStatus();
  }
  var root = $("#gen-controls");
  groups.forEach(function (g) {
    var fs = document.createElement("fieldset"); fs.className = "gen-group";
    var lg = document.createElement("legend"); lg.textContent = g[0]; fs.appendChild(lg);
    var box = document.createElement("div"); box.className = "gen-opts";
    P[g[1]].forEach(function (v, i) {
      var b = document.createElement("button"), t = label(v);
      b.type = "button"; b.className = "gen-opt" + (t === "None" ? " none" : ""); b.dataset.group = g[1]; b.dataset.index = i;
      b.textContent = t; b.setAttribute("aria-label", g[0] + ": " + t);
      b.addEventListener("click", function () { sel[g[1]] = i; paint(); });
      box.appendChild(b);
    });
    fs.appendChild(box); root.appendChild(fs);
  });
  $("#gen-random-parts").addEventListener("click", function () {
    groups.forEach(function (g) { var n = P[g[1]].length, core = CORE.indexOf(g[1]) > -1; sel[g[1]] = core ? 1 + Math.floor(Math.random() * (n - 1)) : Math.floor(Math.random() * n); });
    paint(); say("New face: " + build());
  });
  $("#gen-remove-decor").addEventListener("click", function () { DECOR.forEach(function (k) { sel[k] = 0; }); paint(); say("Decoration removed"); });
  $("#gen-clear").addEventListener("click", function () { groups.forEach(function (g) { sel[g[1]] = 0; }); paint(); say("All parts cleared"); });
  $("#gen-reset").addEventListener("click", function () { sel = Object.assign({}, DEF); paint(); say("Reset to the default face"); });
  $("#gen-random-lib").addEventListener("click", function () {
    var L = window.KAO || []; if (!L.length) return;
    var f = L[Math.floor(Math.random() * L.length)][0];
    $("#gen-lib-face").textContent = f; var c = $("#gen-lib-copy"); c.dataset.copy = f; c.hidden = false;
  });
  document.addEventListener("kc:favchange", updateStatus);
  paint();
})();
