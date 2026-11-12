/* =====================================================================
   MINDOVA UI layer — lightweight motion & feedback helpers (no deps).
   Exposes window.MUI = { toast, confirm, reveal, counters, esc }.
   Safe to load on any page; every feature is opt-in via classes/attrs.
   ===================================================================== */
(function () {
  "use strict";
  var d = document, root = d.documentElement;
  root.classList.add("m-js");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- scroll reveal ---------- */
  var io = null;
  function reveal(scope) {
    var els = (scope || d).querySelectorAll("[data-reveal]:not(.is-in)");
    if (!("IntersectionObserver" in window) || reduce) {
      els.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    }
    els.forEach(function (n) {
      // automatic stagger for siblings inside [data-stagger]
      var p = n.parentElement;
      if (p && p.hasAttribute("data-stagger") && !n.style.getPropertyValue("--rd")) {
        var i = Array.prototype.indexOf.call(p.children, n);
        n.style.setProperty("--rd", Math.min(i, 8) * 0.07 + "s");
      }
      io.observe(n);
    });
  }

  /* ---------- animated counters: <b data-count="1200" data-suffix="+"> ---------- */
  function counters(scope) {
    var els = (scope || d).querySelectorAll("[data-count]:not([data-counted])");
    function run(el) {
      el.setAttribute("data-counted", "1");
      var to = parseFloat(el.getAttribute("data-count")) || 0, suf = el.getAttribute("data-suffix") || "";
      if (reduce) { el.textContent = fmt(to) + suf; return; }
      var t0 = performance.now(), dur = 1400;
      (function step(t) {
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
        el.textContent = fmt(Math.round(to * e)) + suf;
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }
    function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { run(e.target); o.unobserve(e.target); } });
    }, { threshold: 0.4 });
    els.forEach(function (n) { o.observe(n); });
  }

  /* ---------- ripple on buttons ---------- */
  d.addEventListener("pointerdown", function (ev) {
    if (reduce) return;
    var b = ev.target.closest && ev.target.closest(".btn,.m-press");
    if (!b || b.disabled || b.hasAttribute("data-no-ripple")) return;
    var r = b.getBoundingClientRect(), s = d.createElement("span");
    s.className = "m-ripple";
    s.style.left = ev.clientX - r.left + "px";
    s.style.top = ev.clientY - r.top + "px";
    b.appendChild(s);
    setTimeout(function () { s.remove(); }, 650);
  }, { passive: true });

  /* ---------- toasts ---------- */
  var box = null;
  function toast(msg, type, ms) {
    if (!box) { box = d.createElement("div"); box.className = "m-toasts"; box.setAttribute("role", "status"); box.setAttribute("aria-live", "polite"); d.body.appendChild(box); }
    var t = d.createElement("div");
    type = type || "info";
    t.className = "m-toast " + type;
    t.innerHTML = '<span class="ic">' + (type === "ok" ? "✓" : type === "err" ? "!" : "i") + '</span><span class="tx"></span><button class="x" type="button" aria-label="Yopish">✕</button>';
    t.querySelector(".tx").textContent = msg;
    box.appendChild(t);
    function close() { t.classList.add("out"); setTimeout(function () { t.remove(); }, 260); }
    t.querySelector(".x").onclick = close;
    setTimeout(close, ms || (type === "err" ? 7000 : 4200));
    while (box.children.length > 4) box.firstChild.remove();
    return close;
  }

  /* ---------- confirm dialog: returns Promise<boolean> ----------
     MUI.confirm({title, text, ok, cancel, danger, typeToConfirm}) */
  function confirmDlg(o) {
    if (typeof o === "string") o = { text: o };
    o = o || {};
    return new Promise(function (resolve) {
      var bg = d.createElement("div");
      bg.className = "m-dlg-bg";
      var icon = o.danger
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';
      bg.innerHTML = '<div class="m-dlg' + (o.danger ? " danger" : "") + '" role="alertdialog" aria-modal="true">' +
        '<div class="ico">' + icon + '</div><h3></h3><p></p>' +
        (o.typeToConfirm ? '<div class="typein"><label></label><input autocomplete="off" spellcheck="false"></div>' : "") +
        '<div class="acts"><button type="button" class="no"></button><button type="button" class="yes"></button></div></div>';
      bg.querySelector("h3").textContent = o.title || (o.danger ? "Ishonchingiz komilmi?" : "Tasdiqlang");
      bg.querySelector("p").textContent = o.text || "";
      var yes = bg.querySelector(".yes"), no = bg.querySelector(".no");
      yes.textContent = o.ok || (o.danger ? "Ha, o‘chirish" : "Tasdiqlash");
      no.textContent = o.cancel || "Bekor qilish";
      var inp = bg.querySelector(".typein input");
      if (inp) {
        bg.querySelector(".typein label").textContent = "Tasdiqlash uchun «" + o.typeToConfirm + "» deb yozing";
        yes.disabled = true;
        inp.oninput = function () { yes.disabled = inp.value.trim() !== String(o.typeToConfirm); };
      }
      function done(v) { d.removeEventListener("keydown", key); bg.remove(); resolve(v); }
      function key(e) { if (e.key === "Escape") done(false); if (e.key === "Enter" && !yes.disabled) done(true); }
      yes.onclick = function () { done(true); };
      no.onclick = function () { done(false); };
      bg.addEventListener("click", function (e) { if (e.target === bg) done(false); });
      d.addEventListener("keydown", key);
      d.body.appendChild(bg);
      (inp || no).focus();
    });
  }

  /* ---------- Esc closes the top-most open legacy modal ---------- */
  d.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || d.querySelector(".m-dlg-bg")) return;
    var open = d.querySelectorAll(".modal-backdrop.open");
    var m = open[open.length - 1];
    if (!m) return;
    var x = m.querySelector(".modal-close:not([hidden])");
    if (x) x.click(); else if (m.id === "lb") m.classList.remove("open");
  });

  function init() { reveal(); counters(); }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", init); else init();

  window.MUI = { toast: toast, confirm: confirmDlg, reveal: reveal, counters: counters, esc: esc };
})();
