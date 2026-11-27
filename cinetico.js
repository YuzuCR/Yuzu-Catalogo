/* =====================================================================
   Yuzu — capa cinética (solo la tienda; el portafolio no la carga)
   · Historia con scroll: la camiseta 3D cuenta el servicio en 5 capítulos
   · Tipografía cinética: títulos de peso variable que reaccionan al puntero y a la velocidad del scroll
   · Bento de cristal con luz que sigue al cursor
   · Assets cybersigilismo / Y2K generados por código (originales): sigilos, destellos, rejilla
   Nada secuestra el scroll: todo lee la posición nativa y anima con transform/opacity.
   Respeta «reducir movimiento» y el ahorro de datos.
   ===================================================================== */
var YuzuCinetico = (function () {
  var html = document.documentElement;
  var reducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ahorro = navigator.connection && navigator.connection.saveData;
  var fino = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var activo = !reducido && !ahorro;
  var gl3d = activo && window.YuzuPrenda3D && YuzuPrenda3D.soportado();

  // ---------- Generador de sigilos (cybersigilismo): espinas curvas, simétricas, afiladas ----------
  function azar(sem) { var s = sem >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
  function espina(x0, y0, ang, largo, curva, ancho) {
    var dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    var tx = x0 + dx * largo, ty = y0 + dy * largo;
    var mx = x0 + dx * largo * 0.5 + nx * curva * largo, my = y0 + dy * largo * 0.5 + ny * curva * largo;
    var f = function (n) { return n.toFixed(1); };
    return 'M' + f(x0 + nx * ancho) + ' ' + f(y0 + ny * ancho) + 'Q' + f(mx + nx * ancho * 0.45) + ' ' + f(my + ny * ancho * 0.45) + ' ' + f(tx) + ' ' + f(ty) +
      'Q' + f(mx - nx * ancho * 0.45) + ' ' + f(my - ny * ancho * 0.45) + ' ' + f(x0 - nx * ancho) + ' ' + f(y0 - ny * ancho) + 'Z';
  }
  function sigilo(sem, op) {
    op = op || {}; var r = azar(sem), d = '', n = op.puntas || 9, alto = op.alto || 92;
    d += 'M0 ' + (-alto) + 'L2.2 0L0 ' + alto + 'L-2.2 0Z'; // columna
    for (var i = 0; i < n; i++) {
      var y = -alto * 0.85 + (alto * 1.7) * (i + r() * 0.6) / n, sube = r() < 0.5 ? -1 : 1;
      var ang = (sube < 0 ? -1 : 1) * (0.25 + r() * 0.9), largo = 22 + r() * (op.largo || 58), curva = (r() - 0.5) * 0.9, ancho = 1.1 + r() * 2.4;
      d += espina(1, y, ang, largo, curva, ancho);
      if (r() < 0.6) { var t = 0.35 + r() * 0.35, bx = 1 + Math.cos(ang) * largo * t, by = y + Math.sin(ang) * largo * t; d += espina(bx, by, ang + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.7), largo * (0.3 + r() * 0.3), (r() - 0.5) * 0.8, ancho * 0.6); }
    }
    if (op.gancho !== false) { d += espina(0, -alto * 0.15, -0.6, alto * 0.75, 0.35, 2.6); d += espina(0, alto * 0.2, 0.7, alto * 0.6, -0.3, 2.2); }
    var anillo = op.anillo ? '<circle cx="0" cy="0" r="' + (alto * 0.62) + '" fill="none" stroke="currentColor" stroke-width=".6" stroke-dasharray="2 5 30 6"/><circle cx="0" cy="0" r="' + (alto * 0.7) + '" fill="none" stroke="currentColor" stroke-width=".35"/>' : '';
    var vb = op.vb || (-alto - 20) + ' ' + (-alto - 6) + ' ' + (alto * 2 + 40) + ' ' + (alto * 2 + 12);
    return '<svg viewBox="' + vb + '" fill="currentColor" aria-hidden="true" focusable="false">' + anillo + '<path d="' + d + '"/><path d="' + d + '" transform="scale(-1,1)"/></svg>';
  }
  // Separador horizontal: columna acostada con espinas arriba y abajo
  function sigiloLinea(sem) {
    var r = azar(sem), d = 'M-500 0L0 -1.6L500 0L0 1.6Z';
    for (var i = 0; i < 16; i++) {
      var x = 20 + r() * 460, lado = r() < 0.5 ? -1 : 1, ang = lado * (Math.PI / 2) + (r() - 0.5) * 1.6;
      d += espina(x, 0, ang, 8 + r() * 26, (r() - 0.5) * 0.9, 0.7 + r() * 1.2);
    }
    d += espina(0, 0, -Math.PI / 2, 30, 0, 2.4) + espina(0, 0, Math.PI / 2, 18, 0, 1.8);
    return '<svg viewBox="-500 -40 1000 80" preserveAspectRatio="xMidYMid meet" fill="currentColor" aria-hidden="true" focusable="false"><path d="' + d + '"/><path d="' + d + '" transform="scale(-1,1)"/></svg>';
  }
  var DESTELLO = '<svg viewBox="-10 -10 20 20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M0-10C1-2 2-1 10 0C2 1 1 2 0 10C-1 2-2 1-10 0C-2-1-1-2 0-10Z"/></svg>';

  // ---------- Estilos ----------
  var css = `
  html.cn { --cn-neon: var(--yuzu); --cn-vel: 0; }
  /* cabecera de cristal */
  html.cn header.cab { background: color-mix(in srgb, var(--papel) 74%, transparent); -webkit-backdrop-filter: blur(16px) saturate(1.4); backdrop-filter: blur(16px) saturate(1.4); }
  /* botones: brillo neón y barrido */
  html.cn .btn { transition: color .4s, box-shadow .4s, border-color .4s; }
  html.cn .btn:hover { box-shadow: 0 0 0 1px color-mix(in srgb, var(--cn-neon) 70%, transparent), 0 0 26px -6px var(--cn-neon); }
  html.cn .btn::after { content: ''; position: absolute; inset: 0; z-index: 2; pointer-events: none; background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.28) 50%, transparent 65%); transform: translateX(-120%); }
  html.cn .btn:hover::after { transform: translateX(120%); transition: transform .8s cubic-bezier(.2,.7,.2,1); }
  html.cn .chip { transition: border-color .3s, box-shadow .3s, color .3s; }
  html.cn .chip:hover { border-color: var(--cn-neon); box-shadow: 0 0 18px -8px var(--cn-neon); }

  /* tipografía cinética (fuente variable alojada en el repo, solo para estos títulos) */
  @font-face { font-family: 'YZ Shoulders'; src: url(vendor/big-shoulders-display-var.woff2) format('woff2'); font-weight: 100 900; font-display: swap; }
  .cn-k, .cn-palabra, .cn-fila span, .cn-celda .cn-n, .cn-cap h3 { font-family: 'YZ Shoulders', var(--display); }
  .cn-k { display: inline; }
  .cn-k .cn-l { display: inline-block; transform-origin: 50% 85%; will-change: transform; transition: font-weight .35s cubic-bezier(.2,.7,.2,1), transform .35s cubic-bezier(.2,.7,.2,1), color .35s; }
  .cn-k .cn-sp { display: inline-block; width: .28em; }
  .cn-skew { transform: skewX(calc(var(--cn-vel) * -0.35deg)); transition: transform .25s linear; }
  .cn-cromo { background: linear-gradient(180deg, #ffffff 0%, #d9d7cf 30%, #6f6c64 49%, #f4f2ea 54%, #a19d92 78%, #e9e6dc 100%); -webkit-background-clip: text; background-clip: text; color: transparent !important; -webkit-text-fill-color: transparent; }
  .cn-scramble { font-variant-ligatures: none; }

  /* assets */
  .cn-sig { color: var(--cn-neon); pointer-events: none; }
  .cn-sig svg { width: 100%; height: 100%; display: block; }
  .cn-destello { position: absolute; width: 14px; height: 14px; color: var(--cn-neon); pointer-events: none; animation: cnTitila 3.2s ease-in-out infinite; animation-delay: var(--d, 0s); }
  .cn-destello svg { width: 100%; height: 100%; display: block; }
  @keyframes cnTitila { 0%, 100% { opacity: 0; transform: scale(.3) rotate(0); } 45%, 55% { opacity: 1; transform: scale(1) rotate(45deg); } }
  .cn-div { height: 46px; margin: 10px auto 0; max-width: 1100px; color: var(--tinta); opacity: .55; clip-path: inset(0 50% 0 50%); transition: clip-path 1.6s cubic-bezier(.7,0,.2,1); padding: 0 var(--margen); }
  .cn-div.en { clip-path: inset(0 0 0 0); }
  .cn-div svg { width: 100%; height: 100%; }

  /* hero */
  .cn .hero .cn-particulas { position: absolute; inset: 0; z-index: 1; pointer-events: none; mix-blend-mode: screen; }
  .cn .hero .cn-hero-sig { position: absolute; z-index: 1; left: 50%; top: 46%; width: min(70vw, 620px); aspect-ratio: 1; transform: translate(-50%, -50%) rotate(var(--hr, 0deg)) scale(var(--hk, 1)); opacity: .3; color: #c3c24d; mix-blend-mode: screen; }
  .cn .hero img { transform: translate3d(calc(var(--px, 0) * -14px), calc(var(--hy, 0px) + var(--py, 0) * -10px), 0) scale(var(--hs, 1.06)); }
  .cn .hero h1 { text-shadow: 0 0 40px rgba(195,194,77,.15); }

  /* historia con scroll */
  .cn-historia { --papel: #0a0a09; --papel-2: #151412; --tinta: #ece7db; --tinta-2: #8f897c; --linea: rgba(236,231,219,.16); --cn-neon: #c3c24d;
    position: relative; height: 560vh; background: #0a0a09; color: var(--tinta); }
  .cn-pin { position: sticky; top: var(--alto-cab); height: calc(100vh - var(--alto-cab)); height: calc(100svh - var(--alto-cab)); overflow: hidden; }
  .cn-pin::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 55% at 38% 50%, rgba(195,194,77,.10), transparent 70%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(120,140,255,.06), transparent 70%); pointer-events: none; }
  .cn-palabras { position: absolute; inset: 0; display: flex; align-items: center; pointer-events: none; overflow: hidden; }
  .cn-palabra { position: absolute; left: 0; top: 50%; white-space: nowrap; font-family: var(--display); font-weight: 900; font-size: clamp(90px, 21vw, 340px); line-height: .8; letter-spacing: -.02em; color: transparent; -webkit-text-stroke: 1px rgba(236,231,219,.16); transform: translate3d(var(--x, 100vw), -50%, 0); opacity: var(--o, 0); }
  .cn-gran-sig { position: absolute; left: 38%; top: 50%; width: min(78vh, 760px); aspect-ratio: 1; transform: translate(-50%, -50%) rotate(var(--sr, 0deg)) scale(var(--sk, 1)); opacity: .2; }
  .cn-piso { position: absolute; left: -20%; right: -20%; bottom: -8%; height: 46%; transform: perspective(520px) rotateX(64deg); transform-origin: 50% 100%; pointer-events: none;
    background-image: linear-gradient(rgba(195,194,77,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(195,194,77,.22) 1px, transparent 1px); background-size: 64px 64px; background-position: 0 var(--gy, 0px);
    -webkit-mask-image: linear-gradient(to top, #000 10%, transparent 85%); mask-image: linear-gradient(to top, #000 10%, transparent 85%); }
  .cn-prenda { position: absolute; left: 0; top: 0; bottom: 0; width: 66%; }
  .cn-caps { position: absolute; right: max(var(--margen), 5vw); top: 50%; transform: translateY(-50%); width: min(400px, 34vw); }
  .cn-cap { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); opacity: 0; pointer-events: none; }
  .cn-cap.on { opacity: 1; pointer-events: auto; }
  .cn-cap .cn-num { font-family: var(--dato); font-size: 11px; letter-spacing: .2em; color: var(--cn-neon); display: flex; align-items: center; gap: 10px; }
  .cn-cap .cn-num::after { content: ''; height: 1px; flex: 1; background: linear-gradient(90deg, var(--cn-neon), transparent); }
  .cn-cap h3 { font-family: var(--display); font-weight: 800; font-size: clamp(40px, 5.4vw, 86px); line-height: .88; text-transform: uppercase; margin: 4px 0 16px; padding-top: .16em; overflow: hidden; }
  .cn-cap h3 .cn-l { transform: translateY(105%); transition: transform .8s cubic-bezier(.2,.8,.1,1); transition-delay: calc(var(--i) * 28ms); }
  .cn-cap.on h3 .cn-l { transform: none; }
  .cn-cap p { color: var(--tinta-2); font-size: 16px; max-width: 34ch; opacity: 0; transform: translateY(14px); transition: opacity .6s .25s, transform .6s .25s; }
  .cn-cap.on p, .cn-cap.on .cn-extra { opacity: 1; transform: none; }
  .cn-cap .cn-extra { opacity: 0; transform: translateY(14px); transition: opacity .6s .35s, transform .6s .35s; margin-top: 18px; }
  .cn-cap .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .cn-cap .cn-dato { flex-wrap: wrap; font-family: var(--dato); font-size: 12px; letter-spacing: .08em; color: var(--tinta); border: 1px solid var(--linea); background: rgba(255,255,255,.04); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); padding: 10px 14px; display: inline-flex; gap: 10px; align-items: center; }
  .cn-cap .cn-dato b { color: var(--cn-neon); font-weight: 700; }
  .cn-riel { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 18px; align-items: center; }
  .cn-riel i { width: 6px; height: 6px; border: 1px solid rgba(236,231,219,.4); transform: rotate(45deg); transition: all .4s; }
  .cn-riel i.on { background: var(--cn-neon); border-color: var(--cn-neon); box-shadow: 0 0 12px var(--cn-neon); transform: rotate(45deg) scale(1.5); }
  .cn-barra { position: absolute; left: 0; bottom: 0; height: 2px; width: 100%; background: var(--cn-neon); transform-origin: 0 50%; transform: scaleX(var(--p, 0)); box-shadow: 0 0 12px var(--cn-neon); }
  .cn-esquina { position: absolute; font-family: var(--dato); font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: rgba(236,231,219,.45); }
  .cn-esquina.a { left: var(--margen); top: 16px; } .cn-esquina.b { left: var(--margen); bottom: 16px; }
  .cn-historia .cn-destello { color: #e9e6dc; }
  @media (max-width: 820px) {
    .cn-historia { height: 600vh; }
    .cn-prenda { width: 100%; height: 60%; }
    .cn-caps { left: var(--margen); right: var(--margen); width: auto; top: auto; bottom: 26px; transform: none; height: 40%; }
    .cn-cap { top: auto; bottom: 0; transform: none; }
    .cn-cap h3 { font-size: clamp(38px, 11vw, 56px); margin: 2px 0 8px; }
    .cn-cap p { font-size: 14px; }
    .cn-gran-sig { left: 50%; top: 32%; width: 92vw; }
    .cn-riel { right: 8px; top: 30%; gap: 12px; }
    .cn-esquina { display: none; }
  }

  .cn-historia { display: none; } html.cn-ver-historia .cn-historia { display: block; }
  html.cn-en-historia .arriba, html.cn-en-historia .wa-flotante, html.cn-en-historia .cap-teaser { opacity: 0 !important; transform: translateY(16px) !important; pointer-events: none !important; transition: opacity .35s, transform .35s; }
  /* bento */
  .cn-bento-sec { position: relative; overflow: hidden; }
  .cn-bento-sec .cn-malla { position: absolute; inset: -10%; z-index: 0; pointer-events: none; filter: blur(60px); opacity: .55; }
  .cn-bento-sec .cn-malla i { position: absolute; width: 38%; aspect-ratio: 1; border-radius: 50%; background: var(--cn-neon); opacity: .22; animation: cnFlota 18s ease-in-out infinite alternate; }
  .cn-bento-sec .cn-malla i:nth-child(2) { left: 55%; top: 40%; background: #7b8cff; opacity: .12; animation-duration: 23s; }
  .cn-bento-sec .cn-malla i:nth-child(3) { left: 20%; top: 60%; background: #ff5fa2; opacity: .08; animation-duration: 27s; }
  @keyframes cnFlota { to { transform: translate(18%, -12%) scale(1.15); } }
  .cn-bento { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: minmax(170px, auto); gap: 12px; }
  .cn-celda { --mx: 50%; --my: 50%; position: relative; overflow: hidden; padding: 22px; display: flex; flex-direction: column; justify-content: space-between; gap: 14px; isolation: isolate;
    background: color-mix(in srgb, var(--papel-2) 62%, transparent); -webkit-backdrop-filter: blur(18px) saturate(1.3); backdrop-filter: blur(18px) saturate(1.3);
    border: 1px solid var(--linea); transition: transform .5s cubic-bezier(.2,.7,.2,1), border-color .4s; }
  .cn-celda::before { content: ''; position: absolute; inset: 0; z-index: -1; background: radial-gradient(320px circle at var(--mx) var(--my), color-mix(in srgb, var(--cn-neon) 22%, transparent), transparent 60%); opacity: 0; transition: opacity .4s; }
  .cn-celda::after { content: ''; position: absolute; inset: 0; padding: 1px; pointer-events: none; background: radial-gradient(240px circle at var(--mx) var(--my), var(--cn-neon), transparent 65%); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; opacity: 0; transition: opacity .4s; }
  .cn-celda:hover::before, .cn-celda:hover::after { opacity: 1; }
  .cn-celda:hover { transform: translateY(-3px); }
  .cn-celda .cn-sig { position: absolute; right: -14px; top: -10px; width: 92px; height: 92px; opacity: .3; transition: transform .8s cubic-bezier(.2,.7,.2,1), opacity .4s; }
  .cn-celda:hover .cn-sig { transform: rotate(25deg) scale(1.1); opacity: .7; }
  .cn-celda .cn-n { font-family: var(--display); font-weight: 800; font-size: clamp(42px, 5vw, 72px); line-height: .85; letter-spacing: -.01em; }
  .cn-celda .cn-n small { font-size: .42em; font-weight: 600; margin-left: 4px; }
  .cn-celda .cn-t { font-family: var(--dato); font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: var(--tinta-2); }
  .cn-celda p { color: var(--tinta-2); font-size: 14px; margin: 0; max-width: 32ch; }
  .cn-celda.grande { grid-column: span 2; grid-row: span 2; justify-content: flex-end; min-height: 420px; }
  .cn-celda.ancha { grid-column: span 2; }
  .cn-celda.grande .cn-foto { position: absolute; inset: 8px 0 46% 0; z-index: -2; display: grid; place-items: center; perspective: 900px; }

  .cn-celda.grande .cn-foto img { width: auto; height: 100%; max-width: 86%; object-fit: contain; border-radius: 2px; transform: rotateY(var(--ry, -10deg)) rotateX(var(--rx, 4deg)) translateZ(0); transition: transform .6s cubic-bezier(.2,.7,.2,1); filter: drop-shadow(0 30px 40px rgba(0,0,0,.35)); }
  .cn-celda.grande h3 { font-family: var(--display); font-weight: 800; font-size: clamp(34px, 3.6vw, 54px); line-height: .9; text-transform: uppercase; margin: 0; }
  .cn-celda.grande::marker { content: none; }
  .cn-celda .cn-flecha { font-family: var(--dato); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; display: inline-flex; gap: 8px; align-items: center; }
  .cn-celda .cn-flecha::after { content: '→'; transition: transform .3s; } .cn-celda:hover .cn-flecha::after { transform: translateX(5px); }
  .cn-celda a.cn-tapa, .cn-celda button.cn-tapa { position: absolute; inset: 0; z-index: 3; background: none; border: 0; cursor: pointer; }
  @media (max-width: 820px) { .cn-bento { grid-template-columns: repeat(2, 1fr); grid-auto-rows: minmax(150px, auto); } .cn-celda.grande { min-height: 400px; } .cn-celda { padding: 16px; } }

  /* cinta cinética */
  .cn-cinta { overflow: hidden; padding: 28px 0; border-top: 1px solid var(--linea); border-bottom: 1px solid var(--linea); }
  .cn-fila { display: flex; white-space: nowrap; will-change: transform; }
  .cn-fila span { font-family: var(--display); font-weight: 900; font-size: clamp(54px, 10vw, 150px); line-height: .95; text-transform: uppercase; padding-right: .3em; display: inline-flex; align-items: center; gap: .3em; }
  .cn-fila.hueca span { color: transparent; -webkit-text-stroke: 1px var(--tinta); }
  .cn-fila span i { display: inline-block; width: .32em; height: .32em; color: var(--cn-neon); }
  .cn-fila span i svg { width: 100%; height: 100%; display: block; }
  .marquesina.bloque { transform: skewX(calc(var(--cn-vel) * -0.25deg)); }
  `;

  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function suavizar(t) { return t * t * (3 - 2 * t); }

  // ---------- Tipografía cinética ----------
  function partir(el) {
    if (el.querySelector(':scope > .cn-k')) return;
    var txt = el.innerHTML;
    var tmp = document.createElement('div'); tmp.innerHTML = txt; var i = 0, out = '';
    (function rec(n) {
      Array.prototype.forEach.call(n.childNodes, function (c) {
        if (c.nodeType === 3) { c.textContent.split('').forEach(function (ch) { out += ch === ' ' ? '<span class="cn-sp"> </span>' : '<span class="cn-l" style="--i:' + (i++) + '">' + ch.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>'; }); }
        else if (c.nodeName === 'BR') out += '<br>';
        else rec(c);
      });
    })(tmp);
    el.innerHTML = '<span class="cn-k" aria-hidden="true">' + out + '</span><span class="sr">' + tmp.textContent + '</span>';
    el.setAttribute('data-cn', '1'); el.classList.add('cn-skew');
  }
  var SEL_T = '.sec-cab h2, .drop h2, .gran-banner h2, .detras h2, .cn-bento-sec h2';
  function titulos() { Array.prototype.forEach.call(document.querySelectorAll(SEL_T), function (h) { if (h.textContent.trim() && !h.closest('.vista:not(.activa)')) partir(h); }); }
  var ptr = { x: -9999, y: -9999, pend: false };
  function iniciarPuntero() {
    addEventListener('pointermove', function (e) { ptr.x = e.clientX; ptr.y = e.clientY; if (!ptr.pend) { ptr.pend = true; requestAnimationFrame(pesar); } }, { passive: true });
  }
  var visibles = [];
  function pesar() {
    ptr.pend = false;
    visibles.forEach(function (h) {
      var r = h.getBoundingClientRect(); if (ptr.y < r.top - 160 || ptr.y > r.bottom + 160) { if (h.__cnTocado) { h.__cnTocado = false; h.querySelectorAll('.cn-l').forEach(function (l) { l.style.fontWeight = ''; l.style.transform = ''; }); } return; }
      h.__cnTocado = true;
      h.querySelectorAll('.cn-l').forEach(function (l) {
        var b = l.getBoundingClientRect(), dx = ptr.x - (b.left + b.width / 2), dy = ptr.y - (b.top + b.height / 2), d = Math.sqrt(dx * dx + dy * dy), f = Math.max(0, 1 - d / 170);
        f = f * f;
        l.style.fontWeight = Math.round(800 - f * 650);
        l.style.transform = f > 0.01 ? 'scaleY(' + (1 + f * 0.22).toFixed(3) + ') translateY(' + (-f * 6).toFixed(1) + 'px)' : '';
      });
    });
  }
  var ioT = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { var i = visibles.indexOf(e.target); if (e.isIntersecting && i < 0) visibles.push(e.target); if (!e.isIntersecting && i >= 0) visibles.splice(i, 1); }); }) : null;
  function observarTitulos() { if (!ioT) return; Array.prototype.forEach.call(document.querySelectorAll('[data-cn]'), function (h) { if (!h.__cnObs) { h.__cnObs = 1; ioT.observe(h); } }); }

  // Descifrado tipo terminal para el título del hero
  function descifrar(el) {
    var final = el.textContent, cs = '█▓▒░#%&@$<>/\\|+*01', t0 = performance.now(), dur = 1100;
    if (!final.trim() || el.__cnDes === final || el.children.length) return; el.__cnDes = final; el.classList.add('cn-scramble');
    (function paso() {
      var k = Math.min(1, (performance.now() - t0) / dur), n = Math.floor(final.length * k), s = '';
      for (var i = 0; i < final.length; i++) s += i < n || final[i] === ' ' || final[i] === '\n' ? final[i] : cs[(Math.random() * cs.length) | 0];
      el.firstChild && el.childNodes.length === 1 && el.firstChild.nodeType === 3 ? (el.firstChild.nodeValue = s) : (el.textContent = s);
      if (k < 1) requestAnimationFrame(paso); else { el.textContent = final; el.__cnDes = final; }
    })();
  }

  // ---------- Velocidad del scroll (cinta, skew) ----------
  var vel = 0, ultY = scrollY, ultT = performance.now();
  function medirVel() {
    var ahora = performance.now(), dy = scrollY - ultY, dt = Math.max(8, ahora - ultT);
    vel += ((dy / dt * 16) - vel) * 0.25; ultY = scrollY; ultT = ahora;
  }

  // ---------- Hero: partículas, sigilo, destellos, paralaje del cursor ----------
  function hero() {
    var h = $('hero'); if (!h || h.__cn) return; h.__cn = 1;
    var tt = $('heroTit'); if (tt) tt.classList.add('cn-cromo');
    var sg = document.createElement('div'); sg.className = 'cn-sig cn-hero-sig'; sg.innerHTML = sigilo(777, { puntas: 11, anillo: true }); h.appendChild(sg);
    [[12, 22, 0], [82, 18, 1.2], [70, 70, 2.1], [24, 64, .6]].forEach(function (p) { var d = document.createElement('i'); d.className = 'cn-destello'; d.style.cssText = 'left:' + p[0] + '%;top:' + p[1] + '%;--d:' + p[2] + 's;z-index:2;color:#e9e6dc'; d.innerHTML = DESTELLO; h.appendChild(d); });
    var cv = document.createElement('canvas'); cv.className = 'cn-particulas'; h.appendChild(cv);
    var ctx = cv.getContext('2d'), P = [], W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1), mx = -1e4, my = -1e4, vis = true;
    function medir() { W = h.clientWidth; H = h.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    medir(); addEventListener('resize', medir);
    for (var i = 0; i < (W < 700 ? 40 : 80); i++) P.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: -.1 - Math.random() * .35, r: .5 + Math.random() * 1.6, a: .2 + Math.random() * .6 });
    h.addEventListener('pointermove', function (e) { var r = h.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; h.style.setProperty('--px', ((mx / r.width) - .5).toFixed(3)); h.style.setProperty('--py', ((my / r.height) - .5).toFixed(3)); });
    h.addEventListener('pointerleave', function () { mx = my = -1e4; h.style.setProperty('--px', 0); h.style.setProperty('--py', 0); });
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) bucle(); }).observe(h);
    var corriendo = false;
    function bucle() {
      if (corriendo) return; corriendo = true;
      (function cuadro() {
        if (!vis || document.hidden) { corriendo = false; return; }
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < P.length; i++) {
          var p = P[i], dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
          if (d2 < 14400) { var f = (1 - d2 / 14400) * 1.6; p.x += dx / Math.sqrt(d2 + 1) * f; p.y += dy / Math.sqrt(d2 + 1) * f; }
          p.x += p.vx; p.y += p.vy; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; } if (p.x < -5) p.x = W + 5; if (p.x > W + 5) p.x = -5;
          ctx.globalAlpha = p.a; ctx.fillStyle = i % 7 ? '#e9e6dc' : '#c3c24d';
          if (i % 11 === 0) { ctx.fillRect(p.x - p.r * 2, p.y, p.r * 4, .6); ctx.fillRect(p.x, p.y - p.r * 2, .6, p.r * 4); } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
        }
        ctx.globalAlpha = 1; requestAnimationFrame(cuadro);
      })();
    }
    bucle();
  }

  // ---------- Historia con scroll ----------
  var H = null;
  function historia() {
    if (!gl3d || $('cnHistoria') || typeof VISIBLES === 'undefined' || !VISIBLES.length) return;
    var cand = VISIBLES.filter(function (p) { return typeof esVivo === 'function' && esVivo(p) && YuzuMockup.disponible('boxy', p.portada || 'Negro'); });
    // Modo índice: las piezas todavía no traen sus versiones → se pide el detalle de una pieza «vivo» y se reintenta
    if (!cand.length && window.yuzuAsegurarDetalle && !historia.pidiendo) {
      var v = VISIBLES.filter(function (p) { return p.vivo && !p._full; });
      if (v.length) { historia.pidiendo = true; window.yuzuAsegurarDetalle(v[Math.floor(Math.random() * v.length)]).then(function () { historia.pidiendo = false; if (/^#\/taller\/historia/.test(location.hash)) { historia(); var hs = $('cnHistoria'); if (hs) hs.scrollIntoView({ block: 'start' }); } }); return; }
    }
    var dest = cand.filter(function (p) { return p.destacado; }); if (dest.length) cand = dest;
    var p = cand[Math.floor(Math.random() * cand.length)]; if (!p) return;
    var color = p.portada || (p.colores || [])[0] || 'Negro', n = VISIBLES.length;
    var caps = [
      ['01 · El archivo', 'El archivo', n + ' diseños listos para imprimir, o subí el tuyo. Cada pieza se hace cuando la pedís.', '<span class="cn-dato">' + DESTELLO.replace('<svg', '<svg style="width:12px;height:12px;color:var(--cn-neon)"') + ' <b>' + n + '</b> diseños en vivo</span>'],
      ['02 · Tu talla', 'Tu talla', 'Mirala en 3D y cambiá de talla: la prenda crece, el diseño mantiene su tamaño real en centímetros.', '<span class="cn-dato" data-cn-talla>Talla <b>L</b> · 61 × 74 cm</span>'],
      ['03 · Impresión DTF', 'Impresión', 'Algodón 100 % de 190 g. La impresión DTF aguanta entre 100 y 120 lavadas sin agrietarse.', '<span class="cn-dato" data-cn-dis>Diseño · <b>—</b></span>'],
      ['04 · A tu puerta', 'A tu puerta', 'Producimos los miércoles y llega en una semana. El envío ya está incluido, a cualquier parte de Costa Rica.', ''],
      ['05 · Tu turno', 'Armá la tuya', 'Subí tu diseño o contame tu idea. Te mando el mockup final antes de imprimir.', '<div class="chips"><button class="chip" data-abrir-pers="propio">Tengo mi diseño</button><button class="chip" data-abrir-pers="idea">Tengo una idea</button><button class="chip" data-abrir-pers="uniformes">Uniformes</button></div><button class="btn" data-abrir-pers="propio">Armá tu personalizada</button>']
    ];
    var palabras = ['ARCHIVO', 'TU TALLA', 'DTF · 190 G', 'SAN JOSÉ → CR', 'TU TURNO'];
    var sec = document.createElement('section'); sec.className = 'cn-historia'; sec.id = 'cnHistoria'; sec.setAttribute('aria-label', 'Cómo funciona Yuzu');
    sec.innerHTML = '<div class="cn-pin">' +
      '<div class="cn-palabras" aria-hidden="true">' + palabras.map(function (w) { return '<span class="cn-palabra">' + w + '</span>'; }).join('') + '</div>' +
      '<div class="cn-sig cn-gran-sig">' + sigilo(4242, { puntas: 13, anillo: true, largo: 66 }) + '</div>' +
      '<div class="cn-piso" aria-hidden="true"></div>' +
      '<div class="cn-prenda"></div>' +
      '<div class="cn-caps">' + caps.map(function (c, i) { return '<article class="cn-cap" data-i="' + i + '"><span class="cn-num">' + c[0] + '</span><h3>' + c[1] + '</h3><p>' + c[2] + '</p>' + (c[3] ? '<div class="cn-extra">' + c[3] + '</div>' : '') + '</article>'; }).join('') + '</div>' +
      '<div class="cn-riel" aria-hidden="true">' + caps.map(function () { return '<i></i>'; }).join('') + '</div>' +
      '<span class="cn-esquina a">Yuzu · taller · San José</span><span class="cn-esquina b" data-cn-prod>' + (p.nombre || '') + '</span>' +
      [[8, 18, 0], [60, 12, 1.4], [88, 64, .7], [46, 84, 2.2]].map(function (q) { return '<i class="cn-destello" style="left:' + q[0] + '%;top:' + q[1] + '%;--d:' + q[2] + 's"></i>'; }).join('') +
      '<div class="cn-barra"></div></div>';
    sec.querySelectorAll('.cn-destello').forEach(function (d) { d.innerHTML = DESTELLO; });
    // La historia vive en «El taller» (#/taller/historia), después de la sección del taller; ya no ocupa 6 pantallas de la home
    var det = $('detras'); det.parentNode.insertBefore(sec, det.nextSibling);
    var banda = null;
    sec.querySelectorAll('.cn-cap h3').forEach(function (h) { partir(h); h.classList.remove('cn-skew'); });
    var el = { pal: sec.querySelectorAll('.cn-palabra'), caps: sec.querySelectorAll('.cn-cap'), riel: sec.querySelectorAll('.cn-riel i'), pin: sec.querySelector('.cn-pin'),
      sig: sec.querySelector('.cn-gran-sig'), piso: sec.querySelector('.cn-piso'), talla: sec.querySelector('[data-cn-talla]'), dis: sec.querySelector('[data-cn-dis]') };
    H = { sec: sec, el: el, visor: null, cap: -1, talla: 'L', vis: false };
    var vs = YuzuMockup.versionesDe(p);
    YuzuPrenda3D.montar(sec.querySelector('.cn-prenda'), { prenda: 'boxy', color: color, versiones: vs, iVersion: YuzuMockup.recomendada(vs, color), ajuste: p.ajuste }, { talla: 'L', externo: true, angulo: 0 }).then(function (v) {
      H.visor = v; actualizarTalla();
      var lanzar = window.requestIdleCallback || function (f) { setTimeout(f, 1200); };
      lanzar(function () { v.precargar(['S', 'M', 'XL']); });
      cuadroHistoria(true);
    }).catch(function () { sec.remove(); if (banda) banda.classList.remove('oculto'); H = null; });
    new IntersectionObserver(function (es) { H && (H.vis = es[0].isIntersecting); }, { rootMargin: '100px' }).observe(sec);
    // botones flotantes: se esconden mientras la historia ocupa la pantalla
    new IntersectionObserver(function (es) { html.classList.toggle('cn-en-historia', es[0].isIntersecting); }, { threshold: 0.5 }).observe(sec.querySelector('.cn-pin'));
  }
  function actualizarTalla() {
    if (!H || !H.visor) return;
    var m = H.visor.medida(), d = H.visor.diseno().filter(function (x) { return x.pz === 'espalda'; })[0];
    if (H.el.talla) H.el.talla.innerHTML = 'Talla <b>' + H.visor.tallaActual() + '</b> · ' + m[0] + ' × ' + m[1] + ' cm';
    if (H.el.dis && d) H.el.dis.innerHTML = 'Diseño · <b>' + d.cm[0].toFixed(0) + ' × ' + d.cm[1].toFixed(0) + ' cm</b> en todas las tallas';
  }
  function cuadroHistoria(forzar) {
    if (!H || (!H.vis && !forzar)) return;
    var r = H.sec.getBoundingClientRect(), alto = H.el.pin.offsetHeight, total = H.sec.offsetHeight - alto;
    if (r.bottom < innerHeight * 0.5 || r.top > innerHeight * 0.5) html.classList.remove('cn-en-historia');
    var p = clamp(-r.top / Math.max(1, total), 0, 1), nC = H.el.caps.length, f = p * nC, c = Math.min(nC - 1, Math.floor(f)), loc = f - c;
    H.sec.style.setProperty('--p', p.toFixed(4));
    H.el.pin.querySelector('.cn-barra').style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (c !== H.cap) {
      H.cap = c;
      H.el.caps.forEach(function (x, i) { x.classList.toggle('on', i === c); });
      H.el.riel.forEach(function (x, i) { x.classList.toggle('on', i <= c); });
      var dentro = r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5; html.classList.toggle('cn-en-historia', dentro);
    }
    H.el.pal.forEach(function (w, i) {
      var t = f - i, o = t > -0.15 && t < 1.15 ? Math.min(1, Math.min(t + 0.15, 1.15 - t) * 4) : 0;
      w.style.setProperty('--o', o.toFixed(3)); w.style.setProperty('--x', ((1 - (t + 0.15) / 1.3) * 100 - 30).toFixed(2) + 'vw');
    });
    H.el.sig.style.setProperty('--sr', (p * 140).toFixed(2) + 'deg'); H.el.sig.style.setProperty('--sk', (0.9 + Math.sin(p * Math.PI) * 0.25).toFixed(3));
    H.el.piso.style.setProperty('--gy', (p * 1600).toFixed(1) + 'px');
    var v = H.visor; if (!v) return;
    var movil = innerWidth < 820, e = suavizar(clamp(loc, 0, 1));
    if (c === 0) { v.angulo(-0.5 + e * 1.1); v.acercar(1); v.mirar(0); v.ladear(0); }
    else if (c === 1) {
      v.angulo(0.6 + Math.min(1, loc * 2.2) * (Math.PI - 0.6)); v.acercar(1); v.mirar(0);
      var t = loc < 0.3 ? 'S' : loc < 0.5 ? 'M' : loc < 0.72 ? 'L' : 'XL';
      if (t !== H.talla) { H.talla = t; v.talla(t).then(actualizarTalla); }
    }
    else if (c === 2) { if (H.talla !== 'L') { H.talla = 'L'; v.talla('L').then(actualizarTalla); } v.angulo(Math.PI + Math.sin(loc * Math.PI) * 0.35); v.acercar(1 + Math.sin(Math.min(1, loc * 1.4) * Math.PI / 2) * (movil ? 0.9 : 1.15)); v.mirar(Math.sin(Math.min(1, loc * 1.4) * Math.PI / 2) * v.alto() * 0.16); }
    else if (c === 3) { v.angulo(Math.PI + e * Math.PI * 2); v.acercar(1 - Math.sin(e * Math.PI) * 0.12); v.mirar(0); }
    else { v.angulo(Math.PI - 0.35 + e * 0.35); v.acercar(1.02); v.mirar(0); }
  }

  // Quita el fondo liso de la foto (relleno desde los bordes) para que la prenda flote en la tarjeta de cristal
  function recortarFondo(url) {
    return new Promise(function (ok) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () {
        try {
          var c = document.createElement('canvas'), w = c.width = im.naturalWidth, h = c.height = im.naturalHeight, x = c.getContext('2d'); x.drawImage(im, 0, 0);
          var d = x.getImageData(0, 0, w, h), a = d.data, f0 = [a[0], a[1], a[2]], vis = new Uint8Array(w * h), pila = [];
          function sem(i) { if (vis[i]) return; var k = i * 4; if (Math.abs(a[k] - f0[0]) + Math.abs(a[k + 1] - f0[1]) + Math.abs(a[k + 2] - f0[2]) > 60) return; vis[i] = 1; pila.push(i); }
          for (var i = 0; i < w; i++) { sem(i); sem((h - 1) * w + i); } for (var j = 0; j < h; j++) { sem(j * w); sem(j * w + w - 1); }
          while (pila.length) { var q = pila.pop(), qx = q % w; a[q * 4 + 3] = 0; if (qx > 0) sem(q - 1); if (qx < w - 1) sem(q + 1); if (q >= w) sem(q - w); if (q < w * (h - 1)) sem(q + w); }
          x.putImageData(d, 0, 0); ok(c.toDataURL('image/png'));
        } catch (e) { ok(url); }
      };
      im.onerror = function () { ok(url); }; im.src = url;
    });
  }

  // ---------- Bento ----------
  function bento() {
    if ($('cnBento') || typeof VISIBLES === 'undefined' || !VISIBLES.length) return;
    var dest = $('secDestacados'); if (!dest) return;
    var n = VISIBLES.length, min = Math.min.apply(null, VISIBLES.map(function (p) { return typeof precioVigente === 'function' ? precioVigente(p) : p.precio || 0; }).filter(Boolean));
    var vivos = VISIBLES.filter(function (p) { return typeof esVivo === 'function' && esVivo(p); }), pf = vivos[Math.floor(Math.random() * vivos.length)];
    var s = document.createElement('section'); s.className = 'seccion envoltura cn-bento-sec'; s.id = 'cnBento';
    var sig = function (k) { return '<div class="cn-sig">' + sigilo(k, { puntas: 6, alto: 60, largo: 40, gancho: false }) + '</div>'; };
    s.innerHTML = '<div class="cn-malla" aria-hidden="true"><i></i><i></i><i></i></div>' +
      '<div class="sec-cab" style="position:relative;z-index:1"><div><span class="dato">Por qué Yuzu</span><h2>Hecho a pedido</h2></div></div>' +
      '<div class="cn-bento">' +
      '<div class="cn-celda grande" data-cn-tilt>' + (pf ? '<div class="cn-foto"><img alt="" data-cn-foto></div>' : '') + sig(11) +
        '<span class="cn-t">Probalo en 3D</span><h3>Tu diseño,<br>en tu talla</h3><span class="cn-flecha">Girar la prenda</span>' + (pf ? '<button class="cn-tapa" type="button" data-cn-3d aria-label="Ver ' + String(pf.nombre).replace(/"/g, '') + ' en 3D"></button>' : '') + '</div>' +
      '<div class="cn-celda">' + sig(12) + '<span class="cn-t">En el archivo</span><div class="cn-n" data-cn-contar="' + n + '">0</div><span class="cn-flecha">Ver diseños</span><a class="cn-tapa" href="#/c/todo" aria-label="Ver el catálogo"></a></div>' +
      '<div class="cn-celda">' + sig(13) + '<span class="cn-t">Algodón 100 %</span><div class="cn-n">190<small>g</small></div><p>Corte boxy oversize.</p></div>' +
      '<div class="cn-celda">' + sig(14) + '<span class="cn-t">Impresión DTF</span><div class="cn-n">100–120</div><p>lavadas sin agrietarse.</p></div>' +
      '<div class="cn-celda">' + sig(15) + '<span class="cn-t">Producción</span><div class="cn-n" style="font-size:clamp(34px,3.6vw,52px)">Miércoles</div><p>Llega en una semana.</p></div>' +
      '<div class="cn-celda ancha">' + sig(16) + '<span class="cn-t">Envío incluido</span><div class="cn-n" style="font-size:clamp(34px,4vw,60px)">Todo Costa Rica</div><p>El precio que ves es el que pagás.</p></div>' +
      '<div class="cn-celda ancha">' + sig(17) + '<span class="cn-t">Del archivo</span><div class="cn-n">' + (min ? plata(min) : '') + '</div><p>Desde. Diseño, impresión y empaque en el mismo cuarto en San José.</p><a class="cn-tapa" href="estudio.html" aria-label="Ver el estudio"></a></div>' +
      '</div>';
    dest.parentNode.insertBefore(s, dest.nextSibling);
    partir(s.querySelector('h2'));
    if (pf) vivoFoto(pf, pf.portada || 'Negro', 'espalda', 700).then(recortarFondo).then(function (u) { var im = s.querySelector('[data-cn-foto]'); if (im) im.src = u; }).catch(function () {});
    var b3 = s.querySelector('[data-cn-3d]');
    if (b3) b3.addEventListener('click', function () {
      var c = pf.portada || 'Negro', vs = YuzuMockup.versionesDe(pf);
      if (window.YuzuPrenda3D && YuzuPrenda3D.soportado()) { if (typeof evento === 'function') evento('ver_3d', { item_id: String(pf.id), origen: 'bento' }); YuzuPrenda3D.abrir({ prenda: 'boxy', color: c, versiones: vs, iVersion: YuzuMockup.recomendada(vs, c), ajuste: pf.ajuste }, { titulo: pf.nombre, vista: 'espalda' }); }
      else location.hash = '#/p/' + pf.id;
    });
    // luz que sigue al cursor + inclinación de la foto
    s.addEventListener('pointermove', function (e) {
      var c = e.target.closest('.cn-celda'); if (!c) return; var r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
      if (c.hasAttribute('data-cn-tilt')) { c.style.setProperty('--ry', ((x / r.width - .5) * 26).toFixed(1) + 'deg'); c.style.setProperty('--rx', ((.5 - y / r.height) * 14).toFixed(1) + 'deg'); }
    });
    // contador que sube al entrar en pantalla
    var cnt = s.querySelector('[data-cn-contar]');
    new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting) return; o.disconnect(); var fin = +cnt.getAttribute('data-cn-contar'), t0 = performance.now();
      if (!activo) { cnt.textContent = fin; return; }
      (function paso() { var k = Math.min(1, (performance.now() - t0) / 1400); cnt.textContent = Math.round(fin * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(paso); })();
    }, { threshold: .4 }).observe(cnt);
  }

  // ---------- Cinta cinética (velocidad del scroll) ----------
  var CINTA = null;
  function cinta() {
    if ($('cnCinta')) return; var muro = $('secMuro'); if (!muro) return;
    var palabras = ['Archivo', 'Anime', 'Streetwear', 'Hecho a pedido', 'San José', 'DTF', 'Boxy'];
    var fila = function () { var t = palabras.map(function (w) { return '<span>' + w + '<i>' + DESTELLO + '</i></span>'; }).join(''); return t + t + t; };
    var c = document.createElement('div'); c.className = 'cn-cinta'; c.id = 'cnCinta'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<div class="cn-fila">' + fila() + '</div><div class="cn-fila hueca">' + fila() + '</div>';
    muro.parentNode.insertBefore(c, muro);
    var f = c.querySelectorAll('.cn-fila');
    CINTA = { el: c, f: f, x: [0, 0], vis: false, dir: 1 };
    new IntersectionObserver(function (es) { CINTA.vis = es[0].isIntersecting; }).observe(c);
  }
  function cuadroCinta() {
    if (!CINTA || !CINTA.vis) return;
    if (Math.abs(vel) > 0.5) CINTA.dir = vel > 0 ? 1 : -1;
    var base = 0.6 * CINTA.dir, extra = vel * 0.6;
    for (var i = 0; i < 2; i++) {
      var w = CINTA.f[i].scrollWidth / 3, s = i ? -1 : 1;
      CINTA.x[i] = (CINTA.x[i] - (base + extra) * s) % w; if (CINTA.x[i] > 0) CINTA.x[i] -= w;
      CINTA.f[i].style.transform = 'translate3d(' + CINTA.x[i].toFixed(1) + 'px,0,0) skewX(' + clamp(-vel * 0.6, -12, 12).toFixed(2) + 'deg)';
    }
  }

  // ---------- Separadores sigilo ----------
  function separadores() {
    [['secDrop', 101], ['detras', 202], ['secBanners', 303]].forEach(function (x) {
      var s = $(x[0]); if (!s || s.previousElementSibling && s.previousElementSibling.classList.contains('cn-div')) return;
      var d = document.createElement('div'); d.className = 'cn-div'; d.innerHTML = sigiloLinea(x[1]); s.parentNode.insertBefore(d, s);
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { d.classList.add('en'); o.disconnect(); } }, { threshold: .5 }).observe(d); else d.classList.add('en');
    });
  }

  // ---------- Bucle general (solo trabaja mientras hay algo que mover) ----------
  var corriendo = false, quieto = 0;
  function bucle() {
    if (corriendo) return; corriendo = true; quieto = 0;
    (function cuadro() {
      medirVel();
      html.style.setProperty('--cn-vel', clamp(vel, -40, 40).toFixed(2));
      cuadroHistoria(); cuadroCinta();
      var h = $('hero'); if (h && h.__cn && scrollY < innerHeight * 1.2) { h.style.setProperty('--hr', (scrollY * 0.06).toFixed(2) + 'deg'); h.style.setProperty('--hk', (1 + scrollY / innerHeight * 0.3).toFixed(3)); }
      quieto = Math.abs(vel) < 0.05 ? quieto + 1 : 0;
      if (quieto > 90 && !(CINTA && CINTA.vis)) { corriendo = false; html.style.setProperty('--cn-vel', 0); return; }
      requestAnimationFrame(cuadro);
    })();
  }

  function enInicio() { var v = $('vInicio'); return v && v.classList.contains('activa'); }
  function enHistoria() { return /^#\/taller\/historia/.test(location.hash); }
  function montarInicio() {
    html.classList.toggle('cn-ver-historia', enHistoria());
    if (!enInicio()) return;
    // Home liviana: sin historia 3D, bento ni cinta (three.js solo se carga al pedir la historia o «Ver en 3D»)
    if (activo) { hero(); var t = $('heroTit'); if (t) descifrar(t); }
    if (activo && enHistoria()) { historia(); var hs = $('cnHistoria'); if (hs) setTimeout(function () { hs.scrollIntoView({ behavior: 'auto', block: 'start' }); }, 60); }
    titulos(); observarTitulos(); bucle();
  }

  function iniciar() {
    var s = document.createElement('style'); s.id = 'cinetico-css'; s.textContent = css; document.head.appendChild(s);
    html.classList.add('cn');
    if (activo && fino) iniciarPuntero();
    addEventListener('scroll', bucle, { passive: true });
    var esperar = setInterval(function () { if (typeof VISIBLES !== 'undefined' && VISIBLES.length) { clearInterval(esperar); montarInicio(); } }, 250);
    addEventListener('hashchange', function () { setTimeout(function () { montarInicio(); titulos(); observarTitulos(); if (H) cuadroHistoria(true); }, 120); });
    var mt; new MutationObserver(function () { clearTimeout(mt); mt = setTimeout(function () { titulos(); observarTitulos(); }, 200); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();

  return { estado: function () { return H; }, historia: gl3d, sigilo: sigilo, sigiloLinea: sigiloLinea, destello: DESTELLO, activo: activo };
})();
