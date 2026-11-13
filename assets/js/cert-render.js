/* =====================================================================
   MINDOVA sertifikat chizgichi — kabinet, tekshirish sahifasi va admin
   panel uchun yagona kod.
   - Shablon (tpl) bo‘lmasa: eski standart dizayn (certificate-bg.jpg).
   - Shablon bo‘lsa: admin yuklagan fon rasmi + sozlangan joylashuv.
   Joylashuvlar foizda (%) saqlanadi, shuning uchun istalgan o‘lchamdagi
   rasm bilan ishlaydi.
   ===================================================================== */
(function () {
  "use strict";
  var ML = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  var tDate = function (d) { var x = new Date(d); return !d || isNaN(x) ? "—" : x.getFullYear() + "-yil " + x.getDate() + "-" + ML[x.getMonth()]; };
  var FONT = "Inter,system-ui,sans-serif", SCRIPT = '"Great Vibes",cursive';

  /* Shablonning standart sozlamalari (yangi shablon yaratilganda shu qiymatlar olinadi) */
  var DEFAULTS = {
    name: { y: 47, size: 11.5, color: "#14124a", font: "script" },
    body: { show: true, y: 54.3, color: "#1a1a4a", accent: "#3b2fe0" },
    foot: { show: true, y: 69.9, color: "#1a1a4a" },
    qr: { show: true, pos: "bl", color: "#0b0b24" }
  };
  function merge(cfg) {
    cfg = cfg || {};
    var o = {};
    Object.keys(DEFAULTS).forEach(function (k) { o[k] = Object.assign({}, DEFAULTS[k], cfg[k] || {}); });
    o.bg_url = cfg.bg_url || null;
    return o;
  }

  var imgCache = {};
  function loadImg(src) {
    if (!src) return Promise.resolve(null);
    if (!imgCache[src]) imgCache[src] = new Promise(function (r) {
      var i = new Image(); i.crossOrigin = "anonymous";
      i.onload = function () { r(i); }; i.onerror = function () { r(null); }; i.src = src;
    });
    return imgCache[src];
  }
  function fonts() {
    if (!document.fonts) return Promise.resolve();
    return Promise.all([document.fonts.load("800 24px Inter"), document.fonts.load("500 24px Inter"), document.fonts.load('100px "Great Vibes"')]).catch(function () {});
  }
  function drawQR(x, text, X, Y, size, color) {
    if (!window.qrcode) return false;
    var q = qrcode(0, "M"); q.addData(text); q.make();
    var n = q.getModuleCount(), cs = size / (n + 2);
    x.fillStyle = "#fff"; x.fillRect(X, Y, size, size);
    x.fillStyle = color;
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) x.fillRect(X + cs * (c + 1), Y + cs * (r + 1), Math.ceil(cs), Math.ceil(cs));
    return true;
  }
  function fit(x, t, weight, size, font, max) {
    var s = size;
    do { x.font = weight + " " + s + "px " + font; s -= 2; } while (max && x.measureText(t).width > max && s > 12);
  }
  function verifyUrl(code) { return location.origin + "/verify?code=" + encodeURIComponent(code || ""); }

  /* ---------- eski standart dizayn (o‘zgarishsiz saqlangan) ---------- */
  var CT = { bg: "/certificate-bg.jpg", W: 1536, H: 1024, ink: "#1a1a4a", accent: "#3b2fe0",
    name: { x: 768, y: 482, size: 120, max: 760, color: "#14124a" },
    line1: { x: 768, y: 556, size: 27 }, line2: { x: 768, y: 596, size: 27, max: 780 }, line3: { x: 768, y: 634, size: 27 },
    date: { x: 426, y: 716, size: 21, max: 190 }, place: { x: 755, y: 716, size: 21, max: 180 }, org: { x: 1073, y: 716, size: 21, max: 115 },
    code: { x: 276, y: 880, size: 25, max: 215 }, qr: { x: 120, y: 810, size: 100, color: "#0b0b24" } };
  async function legacy(c, holder) {
    await fonts();
    var bg = await loadImg(CT.bg), k = document.createElement("canvas"); k.width = CT.W; k.height = CT.H; var x = k.getContext("2d");
    if (bg) x.drawImage(bg, 0, 0, CT.W, CT.H); else { x.fillStyle = "#eef0ff"; x.fillRect(0, 0, CT.W, CT.H); }
    var put = function (t, o, font, weight, color, align) { x.textAlign = align || "left"; x.fillStyle = color || CT.ink; fit(x, t, weight, o.size, font, o.max); x.fillText(t, o.x, o.y); };
    put(holder, CT.name, SCRIPT, 400, CT.name.color, "center");
    x.textAlign = "center"; x.fillStyle = CT.ink; x.font = "500 " + CT.line1.size + "px " + FONT; x.fillText("Mindova tomonidan tashkil etilgan", CT.line1.x, CT.line1.y);
    var ev = "“" + (c.event_title || c.title) + "”", tail = " tadbirida faol ishtirok etgani uchun", s = CT.line2.size, w1, w2;
    do { x.font = "800 " + s + "px " + FONT; w1 = x.measureText(ev).width; x.font = "500 " + s + "px " + FONT; w2 = x.measureText(tail).width; s -= 2; } while (w1 + w2 > CT.line2.max && s > 14);
    s += 2; var x0 = CT.line2.x - (w1 + w2) / 2; x.textAlign = "left"; x.fillStyle = CT.accent; x.font = "800 " + s + "px " + FONT; x.fillText(ev, x0, CT.line2.y);
    x.fillStyle = CT.ink; x.font = "500 " + s + "px " + FONT; x.fillText(tail, x0 + w1, CT.line2.y);
    x.textAlign = "center"; x.font = "500 " + CT.line3.size + "px " + FONT; x.fillText("ushbu sertifikat bilan taqdirlanadi.", CT.line3.x, CT.line3.y);
    put(tDate(c.event_date || c.issued_at), CT.date, FONT, 500);
    put(c.event_place || "—", CT.place, FONT, 500);
    put(c.organization || "Mindova", CT.org, FONT, 500);
    put(c.code || "", CT.code, FONT, 800);
    if (window.qrcode) { var q = qrcode(0, "M"); q.addData(location.origin + "/verify?code=" + c.code); q.make(); var n = q.getModuleCount(), cs = CT.qr.size / (n + 2);
      x.fillStyle = CT.qr.color; for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) if (q.isDark(r, cc)) x.fillRect(CT.qr.x + cs * (cc + 1), CT.qr.y + cs * (r + 1), Math.ceil(cs), Math.ceil(cs)); }
    return k;
  }

  /* ---------- admin yuklagan shablon ---------- */
  async function templated(c, holder, cfg) {
    cfg = merge(cfg);
    await fonts();
    var bg = await loadImg(cfg.bg_url);
    if (!bg) return legacy(c, holder);
    var sc = Math.min(1, 2400 / bg.naturalWidth), W = Math.round(bg.naturalWidth * sc), H = Math.round(bg.naturalHeight * sc);
    var k = document.createElement("canvas"); k.width = W; k.height = H; var x = k.getContext("2d");
    x.drawImage(bg, 0, 0, W, H);
    var P = function (v) { return H * v / 100; };
    /* ism */
    x.textAlign = "center"; x.fillStyle = cfg.name.color;
    var nf = cfg.name.font === "sans" ? FONT : SCRIPT, nw = cfg.name.font === "sans" ? 800 : 400;
    fit(x, holder, nw, Math.round(P(cfg.name.size)), nf, W * 0.62);
    x.fillText(holder, W / 2, P(cfg.name.y));
    /* asosiy matn */
    if (cfg.body.show) {
      var fs = Math.round(P(2.65)), lh = P(3.9), y0 = P(cfg.body.y);
      x.fillStyle = cfg.body.color; x.font = "500 " + fs + "px " + FONT; x.fillText("Mindova tomonidan tashkil etilgan", W / 2, y0);
      var ev = "“" + (c.event_title || c.title || "") + "”", tail = " tadbirida faol ishtirok etgani uchun", s = fs, w1, w2;
      do { x.font = "800 " + s + "px " + FONT; w1 = x.measureText(ev).width; x.font = "500 " + s + "px " + FONT; w2 = x.measureText(tail).width; s -= 2; } while (w1 + w2 > W * 0.6 && s > 12);
      s += 2; var x0 = W / 2 - (w1 + w2) / 2; x.textAlign = "left";
      x.fillStyle = cfg.body.accent; x.font = "800 " + s + "px " + FONT; x.fillText(ev, x0, y0 + lh);
      x.fillStyle = cfg.body.color; x.font = "500 " + s + "px " + FONT; x.fillText(tail, x0 + w1, y0 + lh);
      x.textAlign = "center"; x.font = "500 " + fs + "px " + FONT; x.fillText("ushbu sertifikat bilan taqdirlanadi.", W / 2, y0 + lh * 2);
    }
    /* pastki qator: sana · joy · tashkilot */
    if (cfg.foot.show) {
      var line = [tDate(c.event_date || c.issued_at), c.event_place, c.organization || "Mindova"].filter(Boolean).join("   •   ");
      x.textAlign = "center"; x.fillStyle = cfg.foot.color; fit(x, line, 500, Math.round(P(2.1)), FONT, W * 0.7); x.fillText(line, W / 2, P(cfg.foot.y));
    }
    /* QR va kod */
    if (cfg.qr.show) {
      var qs = Math.round(P(10)), m = Math.round(W * 0.055), qy = H - m - qs - P(3.2), qx = cfg.qr.pos === "br" ? W - m - qs : m;
      drawQR(x, verifyUrl(c.code), qx, qy, qs, cfg.qr.color);
      x.textAlign = "center"; x.fillStyle = cfg.qr.color; fit(x, c.code || "", 800, Math.round(P(1.9)), FONT, qs * 1.6);
      x.fillText(c.code || "", qx + qs / 2, qy + qs + P(2.6));
    }
    return k;
  }

  /* c — sertifikat yozuvi, holder — egasining to‘liq ismi, tpl — shablon config (yoki null) */
  async function render(c, holder, tpl) {
    var k = tpl && tpl.bg_url ? await templated(c, holder || "—", tpl) : await legacy(c, holder || "—");
    return k.toDataURL("image/jpeg", 0.93);
  }
  /* Sertifikat uchun qaysi shablon ishlatilishini tanlaydi:
     1) sertifikatga biriktirilgan shablon, 2) faol shablon, 3) eski standart */
  function pick(c, templates) {
    templates = templates || [];
    var own = c && c.template_id && templates.find(function (t) { return t.id === c.template_id && t.config && t.config.bg_url; });
    if (own) return own.config;
    var act = templates.find(function (t) { return t.is_active && t.config && t.config.bg_url; });
    return act ? act.config : null;
  }
  window.MCert = { render: render, pick: pick, DEFAULTS: DEFAULTS, merge: merge };
})();
