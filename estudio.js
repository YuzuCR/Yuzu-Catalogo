/* estudio.js · herramientas de diseño compartidas por la tienda (index.html), el admin (admin.html) y Somnia.
   - Varita mágica (cuentagotas, contiguo/global, sumar/restar, borde, bordes suaves)
   - Estudio Yuzu: editor de capas sobre la prenda
   Necesita mockup.js cargado antes. */
(function () {
  if (document.getElementById('estudio-css')) return;
  var st = document.createElement('style'); st.id = 'estudio-css';
  st.textContent = "  /* Varita m\u00e1gica */\n  .vt-fondo { position: fixed; inset: 0; z-index: 100000; background: rgba(0,0,0,.88); display: flex; align-items: center; justify-content: center; padding: 8px; }\n  .vt-caja { background: #1a1815; color: #ece7db; border: 1px solid #2f2b24; width: 100%; max-width: 1100px; max-height: 98vh; display: flex; flex-direction: column; overflow: hidden; font-size: 13px; }\n  .vt-cab, .vt-barra { display: flex; align-items: center; gap: 8px 14px; flex-wrap: wrap; padding: 8px 12px; border-bottom: 1px solid #2f2b24; }\n  .vt-grupo { display: flex; gap: 6px; flex-wrap: wrap; }\n  .vt-b { background: #232019; color: #ece7db; border: 1px solid #3a352c; padding: 8px 12px; font: inherit; font-size: 12px; cursor: pointer; min-height: 36px; }\n  .vt-b:disabled { opacity: .4; cursor: default; }\n  .vt-pri, .vt-modo.on { background: #c3c24d; color: #111; border-color: #c3c24d; }\n  .vt-camp { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #9a9486; margin: 0; }\n  .vt-camp input[type=range] { width: 110px; padding: 0; accent-color: #c3c24d; }\n  .vt-camp select { width: auto; padding: 5px 6px; font-size: 12px; background: #232019; color: #ece7db; border: 1px solid #3a352c; }\n  .vt-camp b { color: #c3c24d; min-width: 26px; text-align: right; font-weight: 600; }\n  .vt-chk { display: flex; gap: 6px; align-items: center; font-size: 12px; color: #9a9486; cursor: pointer; }\n  .vt-chk input { accent-color: #c3c24d; }\n  .vt-mini { font-size: 12px; color: #9a9486; }\n  .vt-area { overflow: auto; flex: 1; min-height: 180px; background: #0b0a09; padding: 10px; text-align: center; -webkit-overflow-scrolling: touch; }\n  .vt-area canvas { cursor: crosshair; display: inline-block; max-width: none; vertical-align: top; }\n  .vt-gota { display: flex; align-items: center; gap: 6px; margin-left: auto; }\n  .vt-gota i { width: 20px; height: 20px; border: 1px solid #3a352c; display: inline-block; }\n  /* Estudio Yuzu (editor) */\n  .ye-fondo { position: fixed; inset: 0; z-index: 90000; background: rgba(5,5,4,.92); opacity: 0; transition: opacity .25s; font-family: 'Archivo', system-ui, sans-serif; color: #ece7db; }\n  .ye-fondo.on { opacity: 1; } .ye-fondo.saliendo { opacity: 0; }\n  .ye-fondo button { font: inherit; }\n  .ye-app { position: absolute; inset: 0; display: flex; flex-direction: column; transform: scale(.985); transition: transform .35s cubic-bezier(.2,.8,.2,1); }\n  .ye-fondo.on .ye-app { transform: none; }\n  .ye-cab { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-bottom: 1px solid #2a2620; background: #13110f; flex-wrap: wrap; }\n  .ye-marca { display: flex; flex-direction: column; gap: 2px; min-width: 150px; }\n  .ye-marca b { font-family: 'Big Shoulders Display', 'Archivo', sans-serif; font-weight: 800; font-size: 20px; letter-spacing: .06em; text-transform: uppercase; }\n  .ye-marca span { font-size: 11px; color: #9a9486; display: flex; align-items: center; gap: 6px; }\n  .ye-marca span i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }\n  .ye-tabs { display: flex; gap: 4px; background: #1d1a16; padding: 4px; border-radius: 10px; margin: 0 auto; }\n  .ye-tabs button { background: none; border: 0; color: #9a9486; padding: 7px 14px; border-radius: 7px; cursor: pointer; font-size: 13px; }\n  .ye-tabs button.on { background: #c3c24d; color: #111; }\n  .ye-tabs small { font-size: 10px; opacity: .7; }\n  .ye-acc { display: flex; gap: 6px; align-items: center; }\n  .ye-acc button, .ye-sec-b, .ye-pri { background: #232019; color: #ece7db; border: 1px solid #3a352c; padding: 9px 13px; border-radius: 8px; cursor: pointer; font-size: 13px; min-height: 38px; }\n  .ye-acc button:disabled { opacity: .35; cursor: default; }\n  .ye-pri, .ye-acc .ye-pri { background: #c3c24d; color: #111; border-color: #c3c24d; font-weight: 600; }\n  .ye-cuerpo { flex: 1; display: grid; grid-template-columns: 76px 1fr 300px; min-height: 0; }\n  .ye-herr { display: flex; flex-direction: column; gap: 6px; padding: 10px 8px; border-right: 1px solid #2a2620; background: #13110f; }\n  .ye-fondo .ye-h { display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: 1px solid transparent; color: #cfc9bc; padding: 9px 4px; border-radius: 10px; cursor: pointer; font-size: 10px; transition: background .15s, border-color .15s, transform .15s; }\n  .ye-h i { font-style: normal; font-size: 20px; line-height: 1; }\n  .ye-h:hover { background: #1f1c18; border-color: #3a352c; transform: translateY(-1px); }\n  .ye-h.on { border-color: #c3c24d; color: #c3c24d; }\n  .ye-zoom { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 10px; color: #9a9486; }\n  .ye-zoom button { width: 34px; height: 30px; background: #1f1c18; color: #ece7db; border: 1px solid #3a352c; border-radius: 7px; cursor: pointer; }\n  .ye-lienzo { position: relative; min-width: 0; min-height: 0; background: radial-gradient(ellipse at 50% 40%, #24211c 0%, #0c0b0a 75%); perspective: 1400px; overflow: hidden; }\n  .ye-escena { position: absolute; inset: 0; transform-style: preserve-3d; }\n  .ye-escena.gira { animation: yeGira .55s cubic-bezier(.6,0,.3,1); }\n  @keyframes yeGira { 0% { transform: rotateY(0) } 47% { transform: rotateY(90deg) scale(.92); opacity: .4 } 53% { transform: rotateY(-90deg) scale(.92); opacity: .4 } 100% { transform: rotateY(0) } }\n  .ye-escena canvas { width: 100%; height: 100%; display: block; touch-action: none; }\n  .ye-soltar { position: absolute; inset: 14px; border: 2px dashed #c3c24d; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #c3c24d; background: rgba(0,0,0,.55); opacity: 0; pointer-events: none; transition: opacity .15s; }\n  .ye-lienzo.encima .ye-soltar { opacity: 1; }\n  .ye-telas { position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); display: flex; gap: 8px; padding: 8px 12px; background: rgba(15,14,12,.82); border: 1px solid #2a2620; border-radius: 30px; backdrop-filter: blur(8px); }\n  .ye-telas button { width: 24px; height: 24px; border-radius: 50%; border: 2px solid #3a352c; cursor: pointer; transition: transform .15s; }\n  .ye-telas button:hover { transform: scale(1.15); }\n  .ye-telas button.on { border-color: #c3c24d; box-shadow: 0 0 0 2px #111 inset; }\n  .ye-der { border-left: 1px solid #2a2620; background: #13110f; overflow-y: auto; padding: 12px; }\n  .ye-sec { border-bottom: 1px solid #24211c; padding-bottom: 12px; margin-bottom: 12px; }\n  .ye-tit { font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: #9a9486; margin-bottom: 8px; }\n  .ye-fila { display: flex; align-items: center; gap: 6px; margin: 8px 0; font-size: 12px; color: #9a9486; }\n  .ye-fila label { min-width: 52px; }\n  .ye-fila input[type=number] { width: 58px; background: #1d1a16; border: 1px solid #3a352c; color: #ece7db; padding: 5px 6px; border-radius: 6px; font: inherit; }\n  .ye-fila input[type=range] { flex: 1; accent-color: #c3c24d; min-width: 60px; }\n  .ye-fila input[type=color] { width: 30px; height: 26px; border: 1px solid #3a352c; background: none; padding: 0; border-radius: 6px; cursor: pointer; }\n  .ye-btns { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }\n  .ye-btns button { background: #1f1c18; color: #ece7db; border: 1px solid #3a352c; padding: 6px 9px; border-radius: 7px; cursor: pointer; font-size: 12px; }\n  .ye-btns button:hover { border-color: #c3c24d; }\n  .ye-btns button.on { border-color: #c3c24d; color: #c3c24d; }\n  .ye-btns .ye-pri { padding: 8px 12px; }\n  .ye-btns .ye-del:hover { border-color: #ff5f57; color: #ff5f57; }\n  .ye-cal { position: relative; background: #1d1a16; border-radius: 7px; overflow: hidden; height: 28px; margin-bottom: 4px; }\n  .ye-cal i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--c); opacity: .25; transition: width .2s; }\n  .ye-cal span { position: relative; font-size: 11px; line-height: 28px; padding: 0 9px; color: #ece7db; }\n  .ye-cal b { color: var(--c); }\n  .ye-chk { display: flex; gap: 7px; align-items: flex-start; font-size: 12px; color: #cfc9bc; margin: 9px 0 4px; cursor: pointer; }\n  .ye-chk input { accent-color: #c3c24d; margin-top: 2px; }\n  .ye-der textarea { width: 100%; background: #1d1a16; border: 1px solid #3a352c; color: #ece7db; border-radius: 8px; padding: 8px; font: inherit; font-size: 14px; resize: vertical; }\n  .ye-fuentes { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin: 8px 0; }\n  .ye-fuentes button { background: #1d1a16; border: 1px solid #3a352c; color: #ece7db; border-radius: 7px; padding: 8px 4px; cursor: pointer; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n  .ye-fuentes button.on { border-color: #c3c24d; color: #c3c24d; }\n  .ye-capa { display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 8px; border: 1px solid transparent; cursor: pointer; font-size: 12px; }\n  .ye-capa:hover { background: #1b1915; } .ye-capa.on { border-color: #c3c24d; background: #1f1c17; }\n  .ye-th { width: 26px; height: 26px; border-radius: 5px; background: #24211c; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #c3c24d; flex-shrink: 0; }\n  .ye-cn { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n  .ye-capa button { background: none; border: 0; color: #9a9486; cursor: pointer; padding: 2px 3px; font-size: 12px; }\n  .ye-capa button:hover { color: #ece7db; }\n  .ye-vacio { font-size: 13px; color: #cfc9bc; line-height: 1.5; } .ye-vacio span { font-size: 11px; color: #8a8478; }\n  .ye-mini { font-size: 11px; color: #8a8478; }\n  @media (max-width: 820px) {\n    .ye-cab { padding: 8px 10px; gap: 8px; } .ye-marca { min-width: 0; } .ye-marca b { font-size: 16px; }\n    .ye-tabs { order: 3; width: 100%; justify-content: center; } .ye-acc { margin-left: auto; } .ye-acc .ye-pri { padding: 9px 10px; }\n    .ye-cuerpo { grid-template-columns: 1fr; grid-template-rows: 1fr auto auto; }\n    .ye-herr { flex-direction: row; order: 2; border-right: 0; border-top: 1px solid #2a2620; overflow-x: auto; padding: 6px; }\n    .ye-h { min-width: 64px; } .ye-zoom { flex-direction: row; margin: 0 0 0 auto; }\n    .ye-der { order: 3; border-left: 0; border-top: 1px solid #2a2620; max-height: 38vh; }\n    .ye-lienzo { order: 1; min-height: 46vh; } .ye-telas { bottom: 8px; }\n  }\n";
  document.head.appendChild(st);
})();
// ---------- Varita mágica (cuentagotas) ----------
// Misma idea que la varita de Photoshop: tocás un píxel, se toma su color y se selecciona lo que se le parece
// (tolerancia = diferencia máxima por canal, 0-255; "contiguo" = solo lo que está pegado; muestra = promedio de 1, 3×3, 5×5 u 11×11 píxeles;
// bordes suaves = anti-alias; Shift/＋ suma a lo quitado, Alt/− lo restaura). Lo seleccionado queda transparente.
// El resultado se guarda como lista de toques (q.ops) con coordenadas relativas y el color tomado, así se repite igual a cualquier tamaño.
function varitaPeso(d, i, col, tol, soft) {
  if (d[i + 3] <= 8) return 1; // ya es transparente: la selección pasa por encima
  var a = d[i] - col[0], b = d[i + 1] - col[1], g = d[i + 2] - col[2];
  if (a < 0) a = -a; if (b < 0) b = -b; if (g < 0) g = -g;
  var m = a > b ? (a > g ? a : g) : (b > g ? b : g);
  if (m <= tol) return 1;
  if (!soft || m >= tol + soft) return 0;
  return 1 - (m - tol) / soft;
}
function varitaOp(d, W, H, op, mask) {
  var n = W * H, p, i;
  if (op.t === 'clr') { mask.fill(0); return; }
  if (op.t === 'inv') { for (p = 0; p < n; p++) mask[p] = 255 - mask[p]; return; }
  var col = op.c, tol = op.tol, soft = op.suave === false ? 0 : Math.max(4, Math.round(tol * 0.3)), nm = new Uint8Array(n), w;
  if (!op.cont) {
    for (p = 0; p < n; p++) { w = varitaPeso(d, p * 4, col, tol, soft); if (w > 0) nm[p] = Math.round(w * 255); }
  } else {
    var sx = Math.max(0, Math.min(W - 1, Math.floor(op.x * W))), sy = Math.max(0, Math.min(H - 1, Math.floor(op.y * H))), seed = -1, r, dx, dy, xx, yy;
    for (r = 0; r <= 3 && seed < 0; r++) {
      for (dy = -r; dy <= r && seed < 0; dy++) for (dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        xx = sx + dx; yy = sy + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        p = yy * W + xx; if (d[p * 4 + 3] > 8 && varitaPeso(d, p * 4, col, tol, soft) > 0) { seed = p; break; }
      }
    }
    if (seed < 0) return;
    var vis = new Uint8Array(n), pila = new Int32Array(n), top = 0;
    vis[seed] = 1; pila[top++] = seed;
    while (top) {
      p = pila[--top]; w = varitaPeso(d, p * 4, col, tol, soft); if (w <= 0) continue;
      nm[p] = Math.round(w * 255);
      var x0 = p % W, y0 = (p - x0) / W, q2;
      if (x0 > 0) { q2 = p - 1; if (!vis[q2]) { vis[q2] = 1; pila[top++] = q2; } }
      if (x0 < W - 1) { q2 = p + 1; if (!vis[q2]) { vis[q2] = 1; pila[top++] = q2; } }
      if (y0 > 0) { q2 = p - W; if (!vis[q2]) { vis[q2] = 1; pila[top++] = q2; } }
      if (y0 < H - 1) { q2 = p + W; if (!vis[q2]) { vis[q2] = 1; pila[top++] = q2; } }
    }
  }
  if (op.t === 'sub') { for (p = 0; p < n; p++) if (nm[p]) mask[p] = Math.round(mask[p] * (1 - nm[p] / 255)); }
  else { for (p = 0; p < n; p++) if (nm[p] > mask[p]) mask[p] = nm[p]; }
}
function varitaMascara(d, W, H, ops) {
  var mask = new Uint8Array(W * H);
  (ops || []).forEach(function (op) { varitaOp(d, W, H, op, mask); });
  return mask;
}
// Expande (n > 0) o contrae (n < 0) lo seleccionado n píxeles; sirve para comerse el halo de color del borde
function varitaBorde(m, W, H, n) {
  if (!n) return m;
  var dil = n > 0, k = Math.abs(n), tmp = new Uint8Array(W * H), it, x, y, p, v, u;
  for (it = 0; it < k; it++) {
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      p = y * W + x; v = m[p];
      if (x > 0) { u = m[p - 1]; v = dil ? (u > v ? u : v) : (u < v ? u : v); }
      if (x < W - 1) { u = m[p + 1]; v = dil ? (u > v ? u : v) : (u < v ? u : v); }
      tmp[p] = v;
    }
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      p = y * W + x; v = tmp[p];
      if (y > 0) { u = tmp[p - W]; v = dil ? (u > v ? u : v) : (u < v ? u : v); }
      if (y < H - 1) { u = tmp[p + W]; v = dil ? (u > v ? u : v) : (u < v ? u : v); }
      m[p] = v;
    }
  }
  return m;
}
function aplicarVarita(d, W, H, q) {
  var m = varitaMascara(d, W, H, q.ops); if (q.borde) varitaBorde(m, W, H, q.borde);
  for (var p = 0, n = W * H; p < n; p++) if (m[p]) { var i = p * 4; d[i + 3] = Math.round(d[i + 3] * (1 - m[p] / 255)); }
}
function cargarOriginalVarita(x) {
  if (!x) return Promise.reject(new Error('No hay imagen.'));
  if (x instanceof HTMLCanvasElement || (x instanceof HTMLImageElement && x.complete)) return Promise.resolve(x);
  if (typeof Blob !== 'undefined' && x instanceof Blob) {
    if ((x.type === 'application/pdf' || /\.pdf$/i.test(x.name || '')) && typeof pdfACanvas === 'function') return pdfACanvas(x);
    return new Promise(function (ok, mal) {
      var url = URL.createObjectURL(x), im = new Image();
      im.onload = function () { URL.revokeObjectURL(url); ok(im); };
      im.onerror = function () { URL.revokeObjectURL(url); mal(new Error('No pude leer la imagen.')); };
      im.src = url;
    });
  }
  if (typeof x === 'string') return new Promise(function (ok, mal) { var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { ok(im); }; im.onerror = function () { mal(new Error('No pude cargar la imagen.')); }; im.src = x; });
  return Promise.resolve(x);
}
function varitaResumen(q) { var n = q && q.ops ? q.ops.filter(function (o) { return o.t === 'add' || o.t === 'sub'; }).length : 0; return n + (n === 1 ? ' toque' : ' toques'); }

var VT = null;
function abrirVarita(fuente, qIni, alAplicar) {
  if (VT) return;
  cargarOriginalVarita(fuente).then(function (src) {
    var SW = src.naturalWidth || src.width, SH = src.naturalHeight || src.height, e0 = Math.min(1, 1600 / Math.max(SW, SH)), ow = Math.round(SW * e0), oh = Math.round(SH * e0);
    var oc = document.createElement('canvas'); oc.width = ow; oc.height = oh;
    var octx = oc.getContext('2d'); octx.drawImage(src, 0, 0, ow, oh);
    var od = octx.getImageData(0, 0, ow, oh), out = octx.createImageData(ow, oh);
    var V = VT = {
      ops: ((qIni && qIni.modo === 'varita' && qIni.ops) || []).map(function (o) { return JSON.parse(JSON.stringify(o)); }), redo: [],
      modo: 'add', cont: true, muestra: 1, tol: 32, suave: true, borde: (qIni && qIni.modo === 'varita' && qIni.borde) || 0, ajustar: true, vista: 'res', fondo: 'cuadros', zoom: 1
    };
    V.mask = varitaMascara(od.data, ow, oh, V.ops);
    var el = document.createElement('div'); el.className = 'vt-fondo';
    el.innerHTML = '<div class="vt-caja"><div class="vt-cab"><b>🪄 Varita mágica</b><span class="vt-mini" style="margin:0" id="vtInfo"></span><span style="flex:1"></span><button type="button" class="vt-b" id="vtCancel">Cancelar</button><button type="button" class="vt-b vt-pri" id="vtOk">Aplicar</button></div>' +
      '<div class="vt-barra">' +
      '<div class="vt-grupo"><button type="button" class="vt-b vt-modo on" data-vt-modo="add" title="Shift + clic">＋ Quitar</button><button type="button" class="vt-b vt-modo" data-vt-modo="sub" title="Alt + clic">－ Restaurar</button></div>' +
      '<label class="vt-camp">Tolerancia <b id="vtTolV">32</b><input type="range" id="vtTol" min="0" max="150" step="1" value="32"></label>' +
      '<label class="vt-camp">Muestra <select id="vtMuestra"><option value="1">1 píxel</option><option value="3">Promedio 3×3</option><option value="5">Promedio 5×5</option><option value="11">Promedio 11×11</option></select></label>' +
      '<label class="vt-camp">Borde <b id="vtBordeV">0</b><input type="range" id="vtBorde" min="-6" max="6" step="1" value="0" title="Expande (+) o contrae (−) lo quitado"></label>' +
      '<label class="vt-chk"><input type="checkbox" id="vtCont" checked><span>Contiguo (solo lo pegado)</span></label>' +
      '<label class="vt-chk"><input type="checkbox" id="vtSuave" checked><span>Bordes suaves</span></label>' +
      '<label class="vt-chk"><input type="checkbox" id="vtAjustar" checked><span>La tolerancia ajusta el último toque</span></label>' +
      '</div><div class="vt-barra">' +
      '<div class="vt-grupo"><button type="button" class="vt-b" id="vtUndo">↶ Deshacer</button><button type="button" class="vt-b" id="vtRedo">↷ Rehacer</button><button type="button" class="vt-b" id="vtInv" title="Lo quitado pasa a conservarse y al revés">Invertir</button><button type="button" class="vt-b" id="vtClr">Borrar todo</button></div>' +
      '<label class="vt-camp">Vista <select id="vtVista"><option value="res">Resultado</option><option value="sel">Resaltar lo quitado</option></select></label>' +
      '<label class="vt-camp">Fondo <select id="vtFondo"><option value="cuadros">Cuadros</option><option value="negro">Negro</option><option value="blanco">Blanco</option><option value="verde">Verde</option><option value="rosa">Rosa</option></select></label>' +
      '<label class="vt-camp">Zoom <b id="vtZoomV"></b><input type="range" id="vtZoom" min="10" max="800" step="5"></label>' +
      '<span class="vt-gota"><i id="vtSw"></i><span id="vtHex" class="vt-mini" style="margin:0">—</span></span>' +
      '</div><div class="vt-area" id="vtArea"><canvas id="vtCv"></canvas></div>' +
      '<p class="vt-mini" >Tocá el color que querés quitar (cuentagotas). Con «＋ Quitar» sumás zonas y con «－ Restaurar» devolvés lo que no querías quitar. Si desmarcás «Contiguo», quita ese color en todo el diseño (también por dentro). Para ver mejor, subí el zoom.</p></div>';
    document.body.appendChild(el);
    var $v = function (id) { return el.querySelector('#' + id); }, cv = $v('vtCv'), area = $v('vtArea'), ctx = cv.getContext('2d');
    cv.width = ow; cv.height = oh;
    var rT = null;
    function fondoCss() {
      var f = V.fondo;
      return f === 'negro' ? '#000' : f === 'blanco' ? '#fff' : f === 'verde' ? '#00d26a' : f === 'rosa' ? '#ff4fa3' : 'repeating-conic-gradient(#3a352c 0 25%, #28251f 0 50%) 0 0/16px 16px';
    }
    function aplicarZoom() {
      cv.style.width = Math.round(ow * V.zoom) + 'px'; cv.style.height = Math.round(oh * V.zoom) + 'px';
      cv.style.imageRendering = V.zoom >= 2 ? 'pixelated' : 'auto';
      $v('vtZoom').value = Math.round(V.zoom * 100); $v('vtZoomV').textContent = Math.round(V.zoom * 100) + '%';
    }
    function pintar() {
      var m = V.borde ? varitaBorde(V.mask.slice(), ow, oh, V.borde) : V.mask, s = od.data, o = out.data, n = ow * oh, p, i, k, quitado = 0, total = 0, sel = V.vista === 'sel';
      for (p = 0; p < n; p++) {
        i = p * 4; o[i] = s[i]; o[i + 1] = s[i + 1]; o[i + 2] = s[i + 2]; k = m[p] / 255;
        if (s[i + 3] > 8) { total++; if (k > 0.5) quitado++; }
        if (sel) { o[i + 3] = s[i + 3]; if (k > 0) { o[i] = Math.round(s[i] * (1 - k * 0.65) + 230 * k * 0.65); o[i + 1] = Math.round(s[i + 1] * (1 - k * 0.65) + 40 * k * 0.65); o[i + 2] = Math.round(s[i + 2] * (1 - k * 0.65) + 60 * k * 0.65); } }
        else o[i + 3] = Math.round(s[i + 3] * (1 - k));
      }
      ctx.putImageData(out, 0, 0);
      cv.style.background = sel ? '#111' : fondoCss();
      $v('vtInfo').textContent = varitaResumen({ ops: V.ops }) + (total ? ' · ' + Math.round(quitado * 100 / total) + '% quitado' : '');
      $v('vtUndo').disabled = !V.ops.length; $v('vtRedo').disabled = !V.redo.length;
    }
    function reconstruir() { V.mask = varitaMascara(od.data, ow, oh, V.ops); pintar(); }
    function empujar(op) { V.ops.push(op); V.redo = []; varitaOp(od.data, ow, oh, op, V.mask); pintar(); }
    function pixelDe(ev) {
      var r = cv.getBoundingClientRect(), x = Math.floor((ev.clientX - r.left) / r.width * ow), y = Math.floor((ev.clientY - r.top) / r.height * oh);
      return (x < 0 || y < 0 || x >= ow || y >= oh) ? null : [x, y];
    }
    function muestra(x, y) {
      var rad = (V.muestra - 1) / 2, s = od.data, a = 0, b = 0, g = 0, c = 0, dx, dy, xx, yy, i;
      for (dy = -rad; dy <= rad; dy++) for (dx = -rad; dx <= rad; dx++) {
        xx = x + dx; yy = y + dy; if (xx < 0 || yy < 0 || xx >= ow || yy >= oh) continue;
        i = (yy * ow + xx) * 4; if (s[i + 3] <= 8) continue; a += s[i]; b += s[i + 1]; g += s[i + 2]; c++;
      }
      return c ? [Math.round(a / c), Math.round(b / c), Math.round(g / c)] : null;
    }
    function cerrar() { document.removeEventListener('keydown', tecla, true); clearTimeout(rT); el.remove(); VT = null; }
    function deshacer() { if (!V.ops.length) return; V.redo.push(V.ops.pop()); reconstruir(); }
    function rehacer() { if (!V.redo.length) return; V.ops.push(V.redo.pop()); reconstruir(); }
    function tecla(ev) {
      if ((ev.ctrlKey || ev.metaKey) && /^z$/i.test(ev.key)) { ev.preventDefault(); ev.stopPropagation(); if (ev.shiftKey) rehacer(); else deshacer(); }
      else if ((ev.ctrlKey || ev.metaKey) && /^y$/i.test(ev.key)) { ev.preventDefault(); ev.stopPropagation(); rehacer(); }
      else if (ev.key === 'Escape') { ev.stopPropagation(); cerrar(); }
    }
    document.addEventListener('keydown', tecla, true);
    // Zoom inicial: que entre completa en pantalla
    V.zoom = Math.max(0.1, Math.min(1.5, (Math.min(window.innerWidth * 0.94, 1100) - 24) / ow, (window.innerHeight * 0.55) / oh));
    aplicarZoom(); pintar();
    $v('vtTol').value = V.tol; $v('vtBorde').value = V.borde; $v('vtBordeV').textContent = V.borde;
    cv.addEventListener('mousemove', function (ev) {
      var pt = pixelDe(ev); if (!pt) return; var i = (pt[1] * ow + pt[0]) * 4, s = od.data;
      if (s[i + 3] <= 8) { $v('vtSw').style.background = 'transparent'; $v('vtHex').textContent = 'transparente'; return; }
      $v('vtSw').style.background = 'rgb(' + s[i] + ',' + s[i + 1] + ',' + s[i + 2] + ')';
      $v('vtHex').textContent = '#' + [s[i], s[i + 1], s[i + 2]].map(function (n) { return (n < 16 ? '0' : '') + n.toString(16); }).join('').toUpperCase();
    });
    cv.addEventListener('click', function (ev) {
      var pt = pixelDe(ev); if (!pt) return;
      var col = muestra(pt[0], pt[1]); if (!col) { $v('vtInfo').textContent = 'Ahí ya es transparente: tocá otro punto.'; return; }
      var t = ev.altKey ? 'sub' : ev.shiftKey ? 'add' : V.modo;
      empujar({ t: t, x: (pt[0] + 0.5) / ow, y: (pt[1] + 0.5) / oh, c: col, tol: V.tol, cont: V.cont, suave: V.suave });
    });
    area.addEventListener('wheel', function (ev) {
      if (!ev.ctrlKey) return; ev.preventDefault();
      V.zoom = Math.max(0.1, Math.min(8, V.zoom * (ev.deltaY < 0 ? 1.15 : 1 / 1.15))); aplicarZoom();
    }, { passive: false });
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-vt-modo')) { V.modo = b.getAttribute('data-vt-modo'); Array.prototype.forEach.call(el.querySelectorAll('.vt-modo'), function (x) { var on = x === b; x.classList.toggle('on', on); x.classList.toggle('btn-sec', !on); }); return; }
      if (b.id === 'vtUndo') deshacer(); else if (b.id === 'vtRedo') rehacer();
      else if (b.id === 'vtInv') empujar({ t: 'inv' });
      else if (b.id === 'vtClr') { if (V.ops.length) empujar({ t: 'clr' }); }
      else if (b.id === 'vtCancel') cerrar();
      else if (b.id === 'vtOk') {
        var ops = V.ops.slice(), ultimoClr = -1; ops.forEach(function (o, j) { if (o.t === 'clr') ultimoClr = j; }); ops = ops.slice(ultimoClr + 1);
        var q = ops.length ? { modo: 'varita', tol: V.tol, global: false, ops: ops, borde: V.borde } : { modo: 'ninguno', tol: 40, global: false };
        cerrar(); alAplicar(q);
      }
    });
    el.addEventListener('input', function (ev) {
      var t = ev.target;
      if (t.id === 'vtTol') {
        V.tol = +t.value; $v('vtTolV').textContent = V.tol;
        var u = V.ops[V.ops.length - 1];
        if (V.ajustar && u && (u.t === 'add' || u.t === 'sub')) { u.tol = V.tol; clearTimeout(rT); rT = setTimeout(reconstruir, 70); }
      } else if (t.id === 'vtBorde') { V.borde = +t.value; $v('vtBordeV').textContent = V.borde; clearTimeout(rT); rT = setTimeout(pintar, 70); }
      else if (t.id === 'vtZoom') { V.zoom = +t.value / 100; aplicarZoom(); }
    });
    el.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t.id === 'vtCont') V.cont = t.checked; else if (t.id === 'vtSuave') V.suave = t.checked; else if (t.id === 'vtAjustar') V.ajustar = t.checked;
      else if (t.id === 'vtMuestra') V.muestra = +t.value;
      else if (t.id === 'vtVista') { V.vista = t.value; pintar(); } else if (t.id === 'vtFondo') { V.fondo = t.value; pintar(); }
    });
  }).catch(function (e) { VT = null; alert('No pude abrir la varita: ' + e.message); });
  VT = VT || { cargando: true };
}


// ============================================================
// ESTUDIO YUZU · editor de diseño sobre la prenda (tienda, admin y Somnia)
// Capas (imagen y texto), mover/escalar/rotar con guías magnéticas, medidas en cm,
// calidad de impresión en vivo, varita, contorno tipo sticker, umbral a 1 color,
// deshacer/rehacer, zoom, cambio de color de tela y de pieza con giro 3D.
// Coordenadas de las capas = píxeles de la foto de la prenda (1080 × 1440), igual que mockup.js.
// ============================================================
var YuzuEstudio = (function () {
  var DPI_EXPORT = 150, LADO_MAX_CAPA = 3000, EXPORT_MAX = 4200;
  var FUENTES = [
    ['Big Shoulders Display', 'Big Shoulders', 800], ['Archivo', 'Archivo', 600], ['Space Mono', 'Space Mono', 700],
    ['Anton', 'Anton', 400], ['Bebas Neue', 'Bebas Neue', 400], ['Permanent Marker', 'Marcador', 400],
    ['UnifrakturMaguntia', 'Gótica', 400], ['Rubik Glitch', 'Glitch', 400], ['Noto Sans JP', 'Japonés', 900], ['Pacifico', 'Script', 400]
  ];
  var NOMBRE_PZ = { espalda: 'Espalda', frente: 'Pecho', pechoGrande: 'Frente grande', lado: 'Manga', costado: 'Costado', nuca: 'Nuca' };
  var fuentesCargadas = false;
  function cargarFuentes() {
    if (fuentesCargadas) return; fuentesCargadas = true;
    var l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?' + FUENTES.map(function (f) { return 'family=' + f[0].replace(/ /g, '+') + ':wght@' + f[2]; }).join('&') + '&display=swap';
    document.head.appendChild(l);
  }
  function el(h) { var d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstChild; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lienzo(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function aCanvas(im, max) {
    var W = im.naturalWidth || im.width, H = im.naturalHeight || im.height, e = Math.min(1, (max || LADO_MAX_CAPA) / Math.max(W, H));
    var c = lienzo(W * e, H * e), x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, c.width, c.height); return c;
  }
  function recortar(c) {
    var W = c.width, H = c.height, d = c.getContext('2d').getImageData(0, 0, W, H).data, x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (var y = 0; y < H; y++) for (var i = 0; i < W; i++) if (d[(y * W + i) * 4 + 3] > 8) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return null;
    if (x0 === 0 && y0 === 0 && x1 === W - 1 && y1 === H - 1) return c;
    var o = lienzo(x1 - x0 + 1, y1 - y0 + 1); o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height); return o;
  }
  function hexRGB(h) { h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }

  // ---------- Efectos de una capa de imagen (se aplican en orden: varita → umbral → contorno) ----------
  function umbral(c, u) {
    var x = c.getContext('2d'), img = x.getImageData(0, 0, c.width, c.height), d = img.data, col = hexRGB(u.color), n = u.nivel, inv = !!u.invertir;
    for (var i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 10) continue;
      var L = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2], on = inv ? L > n : L < n;
      if (on) { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; } else d[i + 3] = 0;
    }
    x.putImageData(img, 0, 0); return c;
  }
  function contorno(c, k) {
    var px = Math.max(1, Math.round(k.px * Math.max(c.width, c.height) / 1000)), pad = px + 2;
    var o = lienzo(c.width + pad * 2, c.height + pad * 2), x = o.getContext('2d');
    var sil = lienzo(c.width, c.height), sx = sil.getContext('2d'); sx.drawImage(c, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = k.color; sx.fillRect(0, 0, c.width, c.height);
    var pasos = Math.max(16, Math.min(48, px * 2));
    for (var a = 0; a < pasos; a++) { var t = a / pasos * Math.PI * 2; x.drawImage(sil, pad + Math.cos(t) * px, pad + Math.sin(t) * px); }
    x.drawImage(sil, pad, pad);
    x.drawImage(c, pad, pad); return o;
  }
  function procesarImg(capa) {
    var c = lienzo(capa.orig.width, capa.orig.height); c.getContext('2d').drawImage(capa.orig, 0, 0);
    if (capa.q && capa.q.modo === 'varita' && typeof aplicarVarita === 'function') {
      var x = c.getContext('2d'), img = x.getImageData(0, 0, c.width, c.height); aplicarVarita(img.data, c.width, c.height, capa.q); x.putImageData(img, 0, 0);
    }
    if (capa.umbral) umbral(c, capa.umbral);
    var r = recortar(c) || lienzo(2, 2);
    if (capa.contorno && capa.contorno.px > 0) r = contorno(r, capa.contorno);
    capa.src = r;
  }
  function procesarTexto(capa) {
    var t = capa.texto, lineas = String(t.txt || ' ').split('\n'), tam = 220, fam = '"' + t.fuente + '"';
    var peso = (FUENTES.filter(function (f) { return f[0] === t.fuente; })[0] || [0, 0, 700])[2];
    var m = lienzo(10, 10).getContext('2d'); m.font = peso + ' ' + tam + 'px ' + fam;
    var esp = (t.espaciado || 0) * tam / 100, ancho = 0;
    lineas.forEach(function (l) { var w = m.measureText(l).width + esp * Math.max(0, l.length - 1); if (w > ancho) ancho = w; });
    var alto = tam * 1.15 * lineas.length, b = t.borde > 0 ? Math.round(t.borde * tam / 40) : 0, pad = b + 20;
    var c = lienzo(ancho + pad * 2, alto + pad * 2), x = c.getContext('2d');
    x.font = peso + ' ' + tam + 'px ' + fam; x.textBaseline = 'top'; x.lineJoin = 'round';
    lineas.forEach(function (l, i) {
      var w = m.measureText(l).width + esp * Math.max(0, l.length - 1), x0 = pad + (t.alinear === 'izq' ? 0 : t.alinear === 'der' ? ancho - w : (ancho - w) / 2), y0 = pad + i * tam * 1.15;
      var dibujar = function (fn) { if (!esp) { fn(l, x0, y0); return; } var xx = x0; for (var j = 0; j < l.length; j++) { fn(l[j], xx, y0); xx += m.measureText(l[j]).width + esp; } };
      if (b) { x.strokeStyle = t.colorBorde || '#000'; x.lineWidth = b * 2; dibujar(function (s, a, y) { x.strokeText(s, a, y); }); }
      x.fillStyle = t.color; dibujar(function (s, a, y) { x.fillText(s, a, y); });
    });
    capa.src = recortar(c) || lienzo(2, 2);
  }
  function procesar(capa) { if (capa.tipo === 'texto') procesarTexto(capa); else procesarImg(capa); }

  // ---------- Estado del editor ----------
  var E = null, uid = 1;
  function tabla() { return E.tablas[E.pz]; }
  function capaSel() { var t = tabla(); return t.capas.filter(function (c) { return c.id === E.sel; })[0] || null; }
  function cmPx() { return ((YuzuMockup.PRENDAS[E.prenda] || {}).cmPx) || 0.117; }
  function limites() { return YuzuMockup.limitesPieza(E.prenda, E.pz); }
  function asp(capa) { return capa.src.height / capa.src.width; }
  function serial() {
    var o = {}; Object.keys(E.tablas).forEach(function (pz) {
      var cp = function (v) { return v ? JSON.parse(JSON.stringify(v)) : v; };
      o[pz] = E.tablas[pz].capas.map(function (c) { return { id: c.id, tipo: c.tipo, nombre: c.nombre, cx: c.cx, cy: c.cy, w: c.w, rot: c.rot, opac: c.opac, oculto: c.oculto, bloqueado: c.bloqueado, voltear: c.voltear, q: cp(c.q), umbral: cp(c.umbral), contorno: cp(c.contorno), texto: cp(c.texto), orig: c.orig }; });
    }); return o;
  }
  function restaurar(o) {
    Object.keys(o).forEach(function (pz) {
      var prev = {}; (E.tablas[pz] ? E.tablas[pz].capas : []).forEach(function (c) { prev[c.id] = c; });
      E.tablas[pz] = { capas: o[pz].map(function (s) {
        var c = {}; Object.keys(s).forEach(function (k) { c[k] = s[k] && typeof s[k] === 'object' && k !== 'orig' ? JSON.parse(JSON.stringify(s[k])) : s[k]; });
        var p = prev[c.id]; c.src = p && p.firma === firma(c) ? p.src : null; if (!c.src) procesar(c); c.firma = firma(c); return c;
      }) };
    });
  }
  function firma(c) { return JSON.stringify([c.q, c.umbral, c.contorno, c.texto]); }
  function guardarHist() { E.hist.push(serial()); if (E.hist.length > 80) E.hist.shift(); E.fut = []; botonesHist(); }
  function deshacer() { if (!E.hist.length) return; E.fut.push(serial()); restaurar(E.hist.pop()); validarSel(); todo(); }
  function rehacer() { if (!E.fut.length) return; E.hist.push(serial()); restaurar(E.fut.pop()); validarSel(); todo(); }
  function validarSel() { if (!capaSel()) E.sel = null; }

  function nuevaCapaImg(fuente, nombre, pz) {
    return cargarOriginalVarita(fuente).then(function (im) {
      var orig = aCanvas(im), c = { id: uid++, tipo: 'img', nombre: nombre || 'Imagen', orig: orig, rot: 0, opac: 1, oculto: false, bloqueado: false, voltear: false, q: null, umbral: null, contorno: null };
      procesar(c); c.firma = firma(c);
      var L = YuzuMockup.limitesPieza(E.prenda, pz || E.pz), z = L.zona, a = asp(c);
      c.w = Math.min(z.w, z.h / a); c.cx = z.x + z.w / 2; c.cy = (z.alinear === 'arriba' ? z.y + c.w * a / 2 : z.y + z.h / 2);
      return c;
    });
  }
  function nuevaCapaTexto(txt) {
    var z = limites().zona, c = { id: uid++, tipo: 'texto', nombre: 'Texto', rot: 0, opac: 1, oculto: false, bloqueado: false, voltear: false,
      texto: { txt: txt || 'TU TEXTO', fuente: 'Big Shoulders Display', color: E.oscura ? '#ffffff' : '#111111', borde: 0, colorBorde: E.oscura ? '#000000' : '#ffffff', espaciado: 0, alinear: 'centro' } };
    procesar(c); c.firma = firma(c); c.w = z.w * 0.8; c.cx = z.x + z.w / 2; c.cy = z.y + z.h * 0.18; return c;
  }

  // ---------- Geometría de pantalla ----------
  function vistaArea() {
    var L = limites(), r = L.region, m = Math.max(r.w, r.h) * 0.22;
    return { x: r.x - m, y: r.y - m, w: r.w + m * 2, h: r.h + m * 2 };
  }
  function escala() {
    var a = vistaArea(), cw = E.cv.clientWidth, ch = E.cv.clientHeight;
    return Math.min(cw / a.w, ch / a.h) * E.zoom;
  }
  function aPantalla(px, py) {
    var a = vistaArea(), s = escala(), cw = E.cv.clientWidth, ch = E.cv.clientHeight;
    return [cw / 2 + (px - (a.x + a.w / 2)) * s + E.pan[0], ch / 2 + (py - (a.y + a.h / 2)) * s + E.pan[1]];
  }
  function aFoto(sx, sy) {
    var a = vistaArea(), s = escala(), cw = E.cv.clientWidth, ch = E.cv.clientHeight;
    return [(sx - cw / 2 - E.pan[0]) / s + a.x + a.w / 2, (sy - ch / 2 - E.pan[1]) / s + a.y + a.h / 2];
  }
  function esquinas(c) {
    var w = c.w, h = c.w * asp(c), r = c.rot * Math.PI / 180, co = Math.cos(r), si = Math.sin(r);
    return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(function (p) { return [c.cx + p[0] * co - p[1] * si, c.cy + p[0] * si + p[1] * co]; });
  }
  function dentro(c, px, py) {
    var r = -c.rot * Math.PI / 180, dx = px - c.cx, dy = py - c.cy, x = dx * Math.cos(r) - dy * Math.sin(r), y = dx * Math.sin(r) + dy * Math.cos(r);
    return Math.abs(x) <= c.w / 2 && Math.abs(y) <= c.w * asp(c) / 2;
  }
  function dpiDe(c) {
    if (c.tipo === 'texto') return 999;
    var anchoCm = c.w * cmPx(), pxFuente = c.src.width; return anchoCm > 0 ? Math.round(pxFuente / (anchoCm / 2.54)) : 0;
  }
  function calidad(dpi) {
    return dpi >= 150 ? { t: 'Excelente', c: '#4fd18b', n: 3 } : dpi >= 100 ? { t: 'Buena', c: '#c3c24d', n: 2 } : dpi >= 70 ? { t: 'Aceptable', c: '#f0a640', n: 1 } : { t: 'Baja: se verá pixelada', c: '#ff5f57', n: 0 };
  }

  // ---------- Dibujo ----------
  function pintar() {
    if (!E) return;
    var cv = E.cv, dpr = window.devicePixelRatio || 1, cw = cv.clientWidth, ch = cv.clientHeight;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    var x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, cw, ch);
    var s = escala(), o = aPantalla(0, 0);
    x.save(); x.translate(o[0], o[1]); x.scale(s, s);
    if (E.foto) { x.imageSmoothingQuality = 'high'; x.drawImage(E.foto, 0, 0); }
    tabla().capas.forEach(function (c) {
      if (c.oculto) return;
      x.save(); x.globalAlpha = c.opac; x.translate(c.cx, c.cy); x.rotate(c.rot * Math.PI / 180); if (c.voltear) x.scale(-1, 1);
      var h = c.w * asp(c); x.drawImage(c.src, -c.w / 2, -h / 2, c.w, h); x.restore();
    });
    // Textura de la tela encima (que el diseño se vea "impreso", no pegado)
    if (E.foto && E.textura) { x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.35; x.drawImage(E.textura, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
    x.restore();
    if (!E.limpio) {
      var L = limites(), z = L.zona, r = L.region, pz = function (rx, ry) { return aPantalla(rx, ry); };
      var a = pz(r.x, r.y), b = pz(r.x + r.w, r.y + r.h), za = pz(z.x, z.y), zb = pz(z.x + z.w, z.y + z.h);
      x.save(); x.setLineDash([3, 5]); x.strokeStyle = 'rgba(195,194,77,.45)'; x.lineWidth = 1; x.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
      x.setLineDash([8, 6]); x.strokeStyle = 'rgba(255,255,255,.55)'; x.strokeRect(za[0], za[1], zb[0] - za[0], zb[1] - za[1]); x.setLineDash([]);
      x.fillStyle = 'rgba(255,255,255,.7)'; x.font = '10px system-ui, sans-serif';
      x.fillText('Área de impresión · ' + Math.round(z.w * cmPx()) + ' × ' + Math.round(z.h * cmPx()) + ' cm', za[0], za[1] - 6);
      // reglas en cm sobre el área
      x.strokeStyle = 'rgba(255,255,255,.35)'; x.fillStyle = 'rgba(255,255,255,.45)'; x.font = '9px system-ui, sans-serif';
      for (var cm = 0; cm <= z.w * cmPx() + 0.01; cm += 1) {
        var px = z.x + cm / cmPx(), p = pz(px, z.y + z.h); x.beginPath(); x.moveTo(p[0], p[1] + 2); x.lineTo(p[0], p[1] + (cm % 5 ? 5 : 10)); x.stroke();
        if (cm % 5 === 0) x.fillText(String(cm), p[0] - 3, p[1] + 20);
      }
      for (cm = 0; cm <= z.h * cmPx() + 0.01; cm += 1) {
        var py = z.y + cm / cmPx(), q = pz(z.x, py); x.beginPath(); x.moveTo(q[0] - 2, q[1]); x.lineTo(q[0] - (cm % 5 ? 5 : 10), q[1]); x.stroke();
        if (cm % 5 === 0) x.fillText(String(cm), q[0] - 24, q[1] + 3);
      }
      (E.guias || []).forEach(function (g) {
        x.strokeStyle = '#ff4fa3'; x.lineWidth = 1; x.beginPath();
        if (g.v != null) { var gv = pz(g.v, 0); x.moveTo(gv[0], 0); x.lineTo(gv[0], ch); } else { var gh = pz(0, g.h); x.moveTo(0, gh[1]); x.lineTo(cw, gh[1]); }
        x.stroke();
      });
      var sel = capaSel();
      if (sel && !sel.oculto) {
        var es = esquinas(sel).map(function (p) { return pz(p[0], p[1]); });
        x.strokeStyle = '#c3c24d'; x.lineWidth = 1.5; x.beginPath(); es.forEach(function (p, i) { if (i) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); }); x.closePath(); x.stroke();
        if (!sel.bloqueado) {
          es.forEach(function (p) { x.fillStyle = '#c3c24d'; x.strokeStyle = '#111'; x.fillRect(p[0] - 6, p[1] - 6, 12, 12); x.strokeRect(p[0] - 6, p[1] - 6, 12, 12); });
          var rh = asaRot(sel); x.beginPath(); x.moveTo((es[0][0] + es[1][0]) / 2, (es[0][1] + es[1][1]) / 2); x.lineTo(rh[0], rh[1]); x.stroke();
          x.beginPath(); x.arc(rh[0], rh[1], 8, 0, Math.PI * 2); x.fillStyle = '#c3c24d'; x.fill(); x.stroke();
        }
        var cmW = sel.w * cmPx(), cmH = sel.w * asp(sel) * cmPx(), cen = pz(sel.cx, sel.cy), etq = cmW.toFixed(1) + ' × ' + cmH.toFixed(1) + ' cm' + (sel.rot ? ' · ' + Math.round(sel.rot) + '°' : '');
        x.font = '600 11px system-ui, sans-serif'; var tw = x.measureText(etq).width + 14, bot = Math.max(es[0][1], es[1][1], es[2][1], es[3][1]) + 14;
        x.fillStyle = 'rgba(0,0,0,.78)'; x.fillRect(cen[0] - tw / 2, bot, tw, 20); x.fillStyle = '#c3c24d'; x.fillText(etq, cen[0] - tw / 2 + 7, bot + 14);
      }
    }
  }
  function asaRot(c) {
    var es = esquinas(c).map(function (p) { return aPantalla(p[0], p[1]); }), mx = (es[0][0] + es[1][0]) / 2, my = (es[0][1] + es[1][1]) / 2;
    var r = c.rot * Math.PI / 180; return [mx + Math.sin(r) * 28, my - Math.cos(r) * 28];
  }

  // ---------- Panel ----------
  function htmlPanel() {
    var c = capaSel(), h = '';
    if (!c) return '<div class="ye-vacio"><b>Tocá una capa</b> para editarla, o agregá una imagen o un texto.<br><br><span>Atajos: arrastrá para mover · esquinas para escalar · círculo para rotar (Shift = de 15 en 15°) · flechas para mover fino · Supr para borrar · Ctrl+D duplica · Ctrl+Z deshace · rueda + Ctrl para zoom.</span></div>';
    var dpi = dpiDe(c), q = calidad(dpi);
    h += '<div class="ye-sec"><div class="ye-tit">' + (c.tipo === 'texto' ? 'Texto' : 'Imagen') + '</div>';
    if (c.tipo !== 'texto') h += '<div class="ye-cal" style="--c:' + q.c + '"><i style="width:' + Math.min(100, dpi / 1.8) + '%"></i><span>Calidad: <b>' + q.t + '</b> · ' + dpi + ' dpi</span></div>';
    h += '<div class="ye-fila"><label>Ancho</label><input type="number" step="0.5" min="1" data-ye="anchoCm" value="' + (c.w * cmPx()).toFixed(1) + '"><span>cm</span><label>Giro</label><input type="number" step="1" data-ye="rot" value="' + Math.round(c.rot) + '"><span>°</span></div>';
    h += '<div class="ye-fila"><label>Opacidad</label><input type="range" min="10" max="100" data-ye="opac" value="' + Math.round(c.opac * 100) + '"></div>';
    h += '<div class="ye-btns"><button data-ye-a="centrarH" title="Centrar a lo ancho">⇔ Centrar</button><button data-ye-a="arriba" title="Pegar arriba del área">⤒ Arriba</button><button data-ye-a="llenar" title="Ocupar todo el ancho del área">↔ Llenar</button><button data-ye-a="voltear">⇋ Espejo</button><button data-ye-a="dup">⧉ Duplicar</button><button data-ye-a="borrar" class="ye-del">✕ Borrar</button></div></div>';
    if (c.tipo === 'texto') {
      var t = c.texto;
      h += '<div class="ye-sec"><textarea data-ye="txt" rows="2">' + esc(t.txt) + '</textarea>' +
        '<div class="ye-fuentes">' + FUENTES.map(function (f) { return '<button data-ye-fuente="' + esc(f[0]) + '" class="' + (t.fuente === f[0] ? 'on' : '') + '" style="font-family:\'' + esc(f[0]) + '\';font-weight:' + f[2] + '">' + esc(f[1]) + '</button>'; }).join('') + '</div>' +
        '<div class="ye-fila"><label>Color</label><input type="color" data-ye="color" value="' + t.color + '"><label>Borde</label><input type="range" min="0" max="10" data-ye="borde" value="' + t.borde + '"><input type="color" data-ye="colorBorde" value="' + t.colorBorde + '"></div>' +
        '<div class="ye-fila"><label>Espaciado</label><input type="range" min="-10" max="60" data-ye="espaciado" value="' + (t.espaciado || 0) + '"></div>' +
        '<div class="ye-btns">' + [['izq', '⟸'], ['centro', '≡'], ['der', '⟹']].map(function (a) { return '<button data-ye-alin="' + a[0] + '" class="' + (t.alinear === a[0] ? 'on' : '') + '">' + a[1] + '</button>'; }).join('') + '</div></div>';
    } else {
      var u = c.umbral, k = c.contorno;
      h += '<div class="ye-sec"><div class="ye-tit">Fondo y color</div><div class="ye-btns"><button data-ye-a="varita" class="ye-pri">🪄 Varita mágica' + (c.q ? ' · ' + varitaResumen(c.q) : '') + '</button>' + (c.q ? '<button data-ye-a="sinVarita">Deshacer varita</button>' : '') + '</div>' +
        '<label class="ye-chk"><input type="checkbox" data-ye="umbralOn"' + (u ? ' checked' : '') + '><span>Pasar a un solo color (ideal para logos y siluetas)</span></label>' +
        (u ? '<div class="ye-fila"><label>Corte</label><input type="range" min="10" max="245" data-ye="umbralNivel" value="' + u.nivel + '"><input type="color" data-ye="umbralColor" value="' + u.color + '"></div><label class="ye-chk"><input type="checkbox" data-ye="umbralInv"' + (u.invertir ? ' checked' : '') + '><span>Usar las partes claras</span></label>' : '') +
        '</div><div class="ye-sec"><div class="ye-tit">Contorno (efecto sticker)</div><div class="ye-fila"><label>Grosor</label><input type="range" min="0" max="40" data-ye="contornoPx" value="' + (k ? k.px : 0) + '"><input type="color" data-ye="contornoColor" value="' + (k ? k.color : '#ffffff') + '"></div></div>';
    }
    return h;
  }
  function htmlCapas() {
    var l = tabla().capas.slice().reverse();
    if (!l.length) return '<p class="ye-mini">Sin capas en ' + (NOMBRE_PZ[E.pz] || E.pz).toLowerCase() + '.</p>';
    return l.map(function (c) {
      return '<div class="ye-capa' + (c.id === E.sel ? ' on' : '') + '" data-ye-capa="' + c.id + '"><span class="ye-th">' + (c.tipo === 'texto' ? 'T' : '▣') + '</span><span class="ye-cn">' + esc(c.tipo === 'texto' ? (c.texto.txt || 'Texto').slice(0, 18) : c.nombre) + '</span>' +
        '<button data-ye-c="ojo" title="Mostrar / ocultar">' + (c.oculto ? '◌' : '◉') + '</button><button data-ye-c="lock" title="Bloquear">' + (c.bloqueado ? '🔒' : '🔓') + '</button><button data-ye-c="sube" title="Subir">↑</button><button data-ye-c="baja" title="Bajar">↓</button></div>';
    }).join('');
  }
  function resumenCalidad() {
    var malas = 0, min = 999; Object.keys(E.tablas).forEach(function (pz) { E.tablas[pz].capas.forEach(function (c) { if (c.oculto || c.tipo === 'texto') return; var d = dpiDe(c); if (d < min) min = d; if (d < 70) malas++; }); });
    var q = calidad(min === 999 ? 300 : min);
    E.ui.querySelector('[data-ye-calglobal]').innerHTML = '<i style="background:' + q.c + '"></i>' + (min === 999 ? 'Sin imágenes' : 'Impresión: ' + q.t.split(':')[0]);
  }
  function botonesHist() { if (!E) return; E.ui.querySelector('[data-ye-h="undo"]').disabled = !E.hist.length; E.ui.querySelector('[data-ye-h="redo"]').disabled = !E.fut.length; }
  function todo() { pintar(); E.ui.querySelector('.ye-panel').innerHTML = htmlPanel(); E.ui.querySelector('.ye-capas').innerHTML = htmlCapas(); resumenCalidad(); botonesHist(); }
  function suave() { pintar(); var p = E.ui.querySelector('[data-ye="anchoCm"]'), c = capaSel(); if (p && c && document.activeElement !== p) p.value = (c.w * cmPx()).toFixed(1); var r = E.ui.querySelector('[data-ye="rot"]'); if (r && c && document.activeElement !== r) r.value = Math.round(c.rot); var cal = E.ui.querySelector('.ye-cal'); if (cal && c) { var d = dpiDe(c), q = calidad(d); cal.style.setProperty('--c', q.c); cal.querySelector('i').style.width = Math.min(100, d / 1.8) + '%'; cal.querySelector('span').innerHTML = 'Calidad: <b>' + q.t + '</b> · ' + d + ' dpi'; } }

  // ---------- Fondo (foto de la prenda) ----------
  function cargarFoto(sinGiro) {
    var vista = YuzuMockup.FOTO_DE[E.pz] || 'espalda', tok = ++E.tokFoto;
    E.oscura = YuzuMockup.esOscuro(E.color);
    return YuzuMockup.base(E.prenda, E.color, vista).then(function (cv) {
      if (tok !== E.tokFoto) return;
      E.foto = cv; E.textura = null;
      try { // textura: la luz de la tela normalizada a gris claro, para multiplicar sobre el diseño
        var t = lienzo(cv.width, cv.height), x = t.getContext('2d'); x.drawImage(cv, 0, 0);
        var img = x.getImageData(0, 0, t.width, t.height), d = img.data, suma = 0, n = 0, L = limites().zona;
        for (var yy = Math.round(L.y); yy < L.y + L.h; yy += 4) for (var xx = Math.round(L.x); xx < L.x + L.w; xx += 4) { var k = (yy * t.width + xx) * 4; suma += d[k] * .3 + d[k + 1] * .59 + d[k + 2] * .11; n++; }
        var med = n ? suma / n : 128;
        for (var i = 0; i < d.length; i += 4) { var l = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11, v = clamp(255 - (med - l) * 2.2, 0, 255); d[i] = d[i + 1] = d[i + 2] = v; }
        x.putImageData(img, 0, 0); E.textura = t;
      } catch (e) {}
      pintar();
    }).catch(function () { E.foto = null; pintar(); });
  }
  function cambiarPieza(pz) {
    if (pz === E.pz || !E) return;
    var esc2 = E.ui.querySelector('.ye-escena');
    esc2.classList.remove('gira'); void esc2.offsetWidth; esc2.classList.add('gira');
    setTimeout(function () { E.pz = pz; E.sel = null; E.pan = [0, 0]; cargarFoto(); todo(); pintarTabs(); }, 260);
  }
  function pintarTabs() {
    E.ui.querySelector('.ye-tabs').innerHTML = E.piezas.map(function (pz) { var n = E.tablas[pz].capas.length; return '<button data-ye-pz="' + pz + '" class="' + (pz === E.pz ? 'on' : '') + '">' + (NOMBRE_PZ[pz] || pz) + (n ? ' <small>' + n + '</small>' : '') + '</button>'; }).join('');
  }

  // ---------- Interacción ----------
  var arr = null, punteros = {};
  function hit(px, py) { var l = tabla().capas; for (var i = l.length - 1; i >= 0; i--) if (!l[i].oculto && dentro(l[i], px, py)) return l[i]; return null; }
  function iman(c) {
    E.guias = []; var z = limites().zona, s = escala(), umb = 7 / s, h = c.w * asp(c), cxz = z.x + z.w / 2, cyz = z.y + z.h / 2;
    if (Math.abs(c.cx - cxz) < umb) { c.cx = cxz; E.guias.push({ v: cxz }); }
    if (!c.rot) {
      if (Math.abs(c.cy - h / 2 - z.y) < umb) { c.cy = z.y + h / 2; E.guias.push({ h: z.y }); }
      else if (Math.abs(c.cy - cyz) < umb) { c.cy = cyz; E.guias.push({ h: cyz }); }
      if (Math.abs(c.cx - c.w / 2 - z.x) < umb) { c.cx = z.x + c.w / 2; E.guias.push({ v: z.x }); }
      if (Math.abs(c.cx + c.w / 2 - z.x - z.w) < umb) { c.cx = z.x + z.w - c.w / 2; E.guias.push({ v: z.x + z.w }); }
    }
    // otras capas: alinear centros
    tabla().capas.forEach(function (o) { if (o === c || o.oculto) return; if (Math.abs(c.cx - o.cx) < umb && !E.guias.some(function (g) { return g.v != null; })) { c.cx = o.cx; E.guias.push({ v: o.cx }); } });
  }
  function abajo(ev) {
    if (!E) return;
    E.cv.setPointerCapture(ev.pointerId); punteros[ev.pointerId] = [ev.offsetX, ev.offsetY];
    var ids = Object.keys(punteros), sel = capaSel();
    if (ids.length === 2) { // pellizco: escalar y rotar la capa (o hacer zoom si no hay capa)
      var a = punteros[ids[0]], b = punteros[ids[1]];
      arr = { tipo: 'pellizco', d0: Math.hypot(b[0] - a[0], b[1] - a[1]), a0: Math.atan2(b[1] - a[1], b[0] - a[0]), w0: sel ? sel.w : 0, r0: sel ? sel.rot : 0, z0: E.zoom, capa: sel && !sel.bloqueado ? sel : null };
      return;
    }
    var p = aFoto(ev.offsetX, ev.offsetY);
    if (sel && !sel.bloqueado) {
      var rh = asaRot(sel);
      if (Math.hypot(ev.offsetX - rh[0], ev.offsetY - rh[1]) < 14) { guardarHist(); arr = { tipo: 'rot', capa: sel }; return; }
      var es = esquinas(sel).map(function (q) { return aPantalla(q[0], q[1]); });
      for (var i = 0; i < 4; i++) if (Math.hypot(ev.offsetX - es[i][0], ev.offsetY - es[i][1]) < 14) { guardarHist(); arr = { tipo: 'esc', capa: sel, d0: Math.hypot(p[0] - sel.cx, p[1] - sel.cy), w0: sel.w }; return; }
    }
    var c = hit(p[0], p[1]);
    if (c) {
      if (E.sel !== c.id) { E.sel = c.id; todo(); }
      if (!c.bloqueado) { guardarHist(); arr = { tipo: 'mover', capa: c, dx: p[0] - c.cx, dy: p[1] - c.cy }; }
      return;
    }
    if (E.sel) { E.sel = null; todo(); }
    arr = { tipo: 'pan', x0: ev.offsetX, y0: ev.offsetY, p0: E.pan.slice() };
  }
  function mover(ev) {
    if (!E) return;
    if (punteros[ev.pointerId]) punteros[ev.pointerId] = [ev.offsetX, ev.offsetY];
    if (!arr) { // cursor según lo que hay debajo
      var sel = capaSel(), cur = 'default', p0 = aFoto(ev.offsetX, ev.offsetY);
      if (sel && !sel.bloqueado) { var rh = asaRot(sel); if (Math.hypot(ev.offsetX - rh[0], ev.offsetY - rh[1]) < 14) cur = 'grab'; else if (esquinas(sel).some(function (q) { var s = aPantalla(q[0], q[1]); return Math.hypot(ev.offsetX - s[0], ev.offsetY - s[1]) < 14; })) cur = 'nwse-resize'; }
      if (cur === 'default' && hit(p0[0], p0[1])) cur = 'move';
      E.cv.style.cursor = cur; return;
    }
    var p = aFoto(ev.offsetX, ev.offsetY), c = arr.capa, L = limites();
    if (arr.tipo === 'pellizco') {
      var ids = Object.keys(punteros); if (ids.length < 2) return; var a = punteros[ids[0]], b = punteros[ids[1]], d = Math.hypot(b[0] - a[0], b[1] - a[1]), an = Math.atan2(b[1] - a[1], b[0] - a[0]);
      if (c) { c.w = clamp(arr.w0 * d / arr.d0, 8, L.region.w * 1.4); c.rot = arr.r0 + (an - arr.a0) * 180 / Math.PI; }
      else E.zoom = clamp(arr.z0 * d / arr.d0, 0.5, 6);
    } else if (arr.tipo === 'mover') { c.cx = p[0] - arr.dx; c.cy = p[1] - arr.dy; iman(c); }
    else if (arr.tipo === 'esc') { c.w = clamp(arr.w0 * Math.hypot(p[0] - c.cx, p[1] - c.cy) / Math.max(1, arr.d0), 8, L.region.w * 1.4); var z = L.zona; E.guias = []; if (Math.abs(c.w - z.w) < 6 / escala()) { c.w = z.w; E.guias.push({ v: z.x }, { v: z.x + z.w }); } }
    else if (arr.tipo === 'rot') { var r = Math.atan2(p[1] - c.cy, p[0] - c.cx) * 180 / Math.PI + 90; if (ev.shiftKey) r = Math.round(r / 15) * 15; else if (Math.abs(((r % 90) + 90) % 90) < 3 || Math.abs(((r % 90) + 90) % 90) > 87) r = Math.round(r / 90) * 90; c.rot = ((r + 540) % 360) - 180; }
    else if (arr.tipo === 'pan') { E.pan = [arr.p0[0] + ev.offsetX - arr.x0, arr.p0[1] + ev.offsetY - arr.y0]; }
    suave();
  }
  function arriba(ev) { delete punteros[ev.pointerId]; if (!E) return; if (arr && arr.tipo !== 'pan') { E.guias = []; todo(); } arr = Object.keys(punteros).length ? arr : null; if (!arr) E.guias = []; pintar(); }
  function rueda(ev) {
    if (!E) return; ev.preventDefault();
    var sel = capaSel();
    if (!ev.ctrlKey && !ev.metaKey && sel && !sel.bloqueado && ev.altKey) { sel.w = clamp(sel.w * (ev.deltaY < 0 ? 1.04 : 1 / 1.04), 8, limites().region.w * 1.4); suave(); return; }
    var antes = aFoto(ev.offsetX, ev.offsetY); E.zoom = clamp(E.zoom * (ev.deltaY < 0 ? 1.12 : 1 / 1.12), 0.5, 6);
    var desp = aPantalla(antes[0], antes[1]); E.pan[0] += ev.offsetX - desp[0]; E.pan[1] += ev.offsetY - desp[1]; pintar(); zoomTxt();
  }
  function zoomTxt() { var z = E.ui.querySelector('[data-ye-zoomv]'); if (z) z.textContent = Math.round(E.zoom * 100) + '%'; }
  function tecla(ev) {
    if (!E || document.querySelector('.vt-fondo')) return;
    var t = ev.target, escribiendo = t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && t.type !== 'range' && t.type !== 'checkbox';
    if ((ev.ctrlKey || ev.metaKey) && /^z$/i.test(ev.key) && !escribiendo) { ev.preventDefault(); if (ev.shiftKey) rehacer(); else deshacer(); return; }
    if ((ev.ctrlKey || ev.metaKey) && /^y$/i.test(ev.key) && !escribiendo) { ev.preventDefault(); rehacer(); return; }
    if (ev.key === 'Escape') { ev.preventDefault(); if (E.sel) { E.sel = null; todo(); } return; }
    if (escribiendo) return;
    var c = capaSel(); if (!c) return;
    if ((ev.ctrlKey || ev.metaKey) && /^d$/i.test(ev.key)) { ev.preventDefault(); accion('dup'); return; }
    if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); accion('borrar'); return; }
    var paso = (ev.shiftKey ? 10 : 1) / escala(), m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
    if (m && !c.bloqueado) { ev.preventDefault(); if (!E.flechas) { guardarHist(); E.flechas = true; clearTimeout(E.flT); } E.flT = setTimeout(function () { E.flechas = false; }, 600); c.cx += m[0] * paso; c.cy += m[1] * paso; suave(); }
  }

  // ---------- Acciones del panel ----------
  function reprocesar(c) { var r = c.src && c.w ? c.w / c.src.width : 0; procesar(c); c.firma = firma(c); if (r) c.w = r * c.src.width; }
  function accion(a) {
    var c = capaSel(), t = tabla(), z = limites().zona; if (!c && a !== 'texto') return;
    if (a === 'varita') {
      abrirVarita(c.orig, c.q, function (q) { guardarHist(); c.q = q.modo === 'varita' ? q : null; reprocesar(c); todo(); });
      return;
    }
    guardarHist();
    if (a === 'sinVarita') { c.q = null; reprocesar(c); }
    else if (a === 'centrarH') c.cx = z.x + z.w / 2;
    else if (a === 'arriba') c.cy = z.y + c.w * asp(c) / 2;
    else if (a === 'llenar') { c.rot = 0; c.w = Math.min(z.w, z.h / asp(c)); c.cx = z.x + z.w / 2; c.cy = z.y + c.w * asp(c) / 2; }
    else if (a === 'voltear') c.voltear = !c.voltear;
    else if (a === 'dup') { var n = {}; Object.keys(c).forEach(function (k) { n[k] = c[k] && typeof c[k] === 'object' && k !== 'orig' && k !== 'src' ? JSON.parse(JSON.stringify(c[k])) : c[k]; }); n.id = uid++; n.cx += 12; n.cy += 12; t.capas.push(n); E.sel = n.id; }
    else if (a === 'borrar') { t.capas.splice(t.capas.indexOf(c), 1); E.sel = null; }
    todo(); pintarTabs();
  }
  function cambio(ev, final) {
    var t = ev.target, k = t.getAttribute('data-ye'), c = capaSel(); if (!k || !c) return;
    if (final === false && E._editando !== c.id + k) { guardarHist(); E._editando = c.id + k; }
    var v = t.type === 'checkbox' ? t.checked : t.value, re = false;
    if (k === 'anchoCm') { var w = parseFloat(v) / cmPx(); if (w > 2) c.w = w; }
    else if (k === 'rot') c.rot = parseFloat(v) || 0;
    else if (k === 'opac') c.opac = (+v) / 100;
    else if (k === 'txt') { c.texto.txt = v; re = true; }
    else if (k === 'color' || k === 'colorBorde') { c.texto[k] = v; re = true; }
    else if (k === 'borde' || k === 'espaciado') { c.texto[k] = +v; re = true; }
    else if (k === 'umbralOn') { c.umbral = v ? { nivel: 128, color: E.oscura ? '#ffffff' : '#111111', invertir: false } : null; re = true; }
    else if (k === 'umbralNivel') { c.umbral.nivel = +v; re = true; }
    else if (k === 'umbralColor') { c.umbral.color = v; re = true; }
    else if (k === 'umbralInv') { c.umbral.invertir = v; re = true; }
    else if (k === 'contornoPx') { c.contorno = +v ? { px: +v, color: (c.contorno || {}).color || (E.oscura ? '#ffffff' : '#000000') } : null; re = true; }
    else if (k === 'contornoColor') { c.contorno = { px: (c.contorno || { px: 8 }).px, color: v }; re = true; }
    if (re) {
      clearTimeout(E.reT); E.reT = setTimeout(function () {
        if (!E) return; reprocesar(c); pintar(); resumenCalidad();
        if (final !== false || k === 'umbralOn' || k === 'umbralInv' || k === 'contornoPx') { if (k !== 'txt') E.ui.querySelector('.ye-panel').innerHTML = htmlPanel(); }
        E.ui.querySelector('.ye-capas').innerHTML = htmlCapas();
      }, c.tipo === 'texto' ? 50 : 90);
    } else suave();
    if (final !== false) E._editando = null;
  }

  // ---------- Exportar ----------
  function exportarPieza(pz) {
    var capas = E.tablas[pz].capas.filter(function (c) { return !c.oculto; }); if (!capas.length) return null;
    var cp = (YuzuMockup.PRENDAS[E.prenda] || {}).cmPx || 0.117, F = DPI_EXPORT / 2.54 * cp;
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    capas.forEach(function (c) { esquinasDe(c).forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }); });
    var R = YuzuMockup.limitesPieza(E.prenda, pz).region; x0 = Math.max(x0, R.x - R.w * 0.2); y0 = Math.max(y0, R.y - R.h * 0.2); x1 = Math.min(x1, R.x + R.w * 1.2); y1 = Math.min(y1, R.y + R.h * 1.2);
    if (x1 <= x0 || y1 <= y0) return null;
    F = Math.min(F, EXPORT_MAX / Math.max(x1 - x0, y1 - y0));
    var out = lienzo((x1 - x0) * F, (y1 - y0) * F), x = out.getContext('2d'); x.imageSmoothingQuality = 'high';
    capas.forEach(function (c) {
      x.save(); x.globalAlpha = c.opac; x.translate((c.cx - x0) * F, (c.cy - y0) * F); x.rotate(c.rot * Math.PI / 180); if (c.voltear) x.scale(-1, 1);
      var h = c.w * c.src.height / c.src.width; x.drawImage(c.src, -c.w * F / 2, -h * F / 2, c.w * F, h * F); x.restore();
    });
    var rc = recortar(out); if (!rc) return null;
    // el recorte cambia el rectángulo: recalcular en píxeles de foto
    var dx = 0, dy = 0; if (rc !== out) { var d = out.getContext('2d').getImageData(0, 0, out.width, out.height).data, mx = out.width, my = out.height; for (var yy = 0; yy < out.height; yy++) for (var xx = 0; xx < out.width; xx++) if (d[(yy * out.width + xx) * 4 + 3] > 8) { if (xx < mx) mx = xx; if (yy < my) my = yy; } dx = mx; dy = my; }
    var rect = { x: x0 + dx / F, y: y0 + dy / F, w: rc.width / F, h: rc.height / F };
    var minDpi = 999; capas.forEach(function (c) { if (c.tipo !== 'texto') { var dd = Math.round(c.src.width / (c.w * cp / 2.54)); if (dd < minDpi) minDpi = dd; } });
    return { canvas: rc, rect: rect, pos: YuzuMockup.posDeRect(E.prenda, pz, rect), centro: { cx: rect.x + rect.w / 2, cy: rect.y + rect.h / 2, w: rect.w }, dpi: minDpi === 999 ? null : minDpi, cm: [rect.w * cp, rect.h * cp] };
  }
  function esquinasDe(c) { var w = c.w, h = c.w * c.src.height / c.src.width, r = c.rot * Math.PI / 180, co = Math.cos(r), si = Math.sin(r); return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(function (p) { return [c.cx + p[0] * co - p[1] * si, c.cy + p[0] * si + p[1] * co]; }); }

  // ---------- Abrir / cerrar ----------
  function cerrar() {
    if (!E) return;
    document.removeEventListener('keydown', tecla, true); window.removeEventListener('resize', pintar);
    E.ui.classList.add('saliendo'); var u = E.ui; setTimeout(function () { u.remove(); }, 260);
    document.documentElement.style.overflow = E.ovf || ''; E = null;
  }
  /* opciones: { prenda, color, colores:[nombres], piezas:['espalda','frente'], pieza, capas:{pz:[{fuente,nombre}]}, estado (de una edición anterior),
                titulo, textoAplicar, permitirTexto, alAplicar(res), alCancelar() }
     res = { prenda, color, piezas: { pz: {canvas, rect, pos, centro, dpi, cm} | null }, estado } */
  function abrir(op) {
    if (E) return Promise.resolve();
    op = op || {}; cargarFuentes();
    var piezas = op.piezas && op.piezas.length ? op.piezas : ['espalda'];
    E = { prenda: op.prenda || 'boxy', color: op.color || 'Negro', colores: op.colores || [], piezas: piezas, pz: op.pieza && piezas.indexOf(op.pieza) !== -1 ? op.pieza : piezas[0], tablas: {}, sel: null, zoom: 1, pan: [0, 0], hist: [], fut: [], guias: [], tokFoto: 0, op: op, limpio: false };
    piezas.forEach(function (pz) { E.tablas[pz] = { capas: [] }; });
    var ui = E.ui = el('<div class="ye-fondo"><div class="ye-app">' +
      '<header class="ye-cab"><div class="ye-marca"><b>' + esc(op.titulo || 'Estudio Yuzu') + '</b><span data-ye-calglobal></span></div>' +
        '<div class="ye-tabs"></div>' +
        '<div class="ye-acc"><button data-ye-h="undo" title="Deshacer (Ctrl+Z)">↶</button><button data-ye-h="redo" title="Rehacer (Ctrl+Y)">↷</button>' +
        '<button data-ye-x="cancelar" class="ye-sec-b">Cancelar</button><button data-ye-x="aplicar" class="ye-pri">' + esc(op.textoAplicar || 'Listo, usar este diseño') + '</button></div></header>' +
      '<div class="ye-cuerpo">' +
        '<aside class="ye-herr">' +
          '<label class="ye-h" title="Subir imagen (PNG, JPG, WEBP)"><input type="file" accept="image/png,image/jpeg,image/webp,application/pdf,.pdf" multiple hidden data-ye-subir><i>⬆</i><span>Imagen</span></label>' +
          (op.permitirTexto === false ? '' : '<button class="ye-h" data-ye-t="texto"><i>T</i><span>Texto</span></button>') +
          '<button class="ye-h" data-ye-t="varita"><i>🪄</i><span>Varita</span></button>' +
          '<button class="ye-h" data-ye-t="limpio"><i>◐</i><span>Vista limpia</span></button>' +
          '<div class="ye-zoom"><button data-ye-z="1.2">＋</button><span data-ye-zoomv>100%</span><button data-ye-z="0.833">－</button><button data-ye-z="0" title="Ajustar">⤢</button></div>' +
        '</aside>' +
        '<main class="ye-lienzo"><div class="ye-escena"><canvas></canvas></div><div class="ye-soltar">Soltá tu imagen acá</div>' +
          (E.colores.length ? '<div class="ye-telas">' + E.colores.map(function (c) { return '<button data-ye-tela="' + esc(c) + '" title="' + esc(c) + '" class="' + (c === E.color ? 'on' : '') + '" style="background:' + (YuzuMockup.HEX[c] || '#888') + '"></button>'; }).join('') + '</div>' : '') +
        '</main>' +
        '<aside class="ye-der"><div class="ye-panel"></div><div class="ye-tit" style="margin-top:14px">Capas</div><div class="ye-capas"></div></aside>' +
      '</div></div></div>');
    document.body.appendChild(ui);
    E.ovf = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
    E.cv = ui.querySelector('canvas');
    E.cv.addEventListener('pointerdown', abajo); E.cv.addEventListener('pointermove', mover); E.cv.addEventListener('pointerup', arriba); E.cv.addEventListener('pointercancel', arriba);
    E.cv.addEventListener('wheel', rueda, { passive: false });
    E.cv.addEventListener('dblclick', function (ev) { var p = aFoto(ev.offsetX, ev.offsetY), c = hit(p[0], p[1]); if (c && c.tipo === 'texto') { var ta = ui.querySelector('[data-ye="txt"]'); if (ta) { ta.focus(); ta.select(); } } else if (c) accion('varita'); });
    document.addEventListener('keydown', tecla, true); window.addEventListener('resize', pintar);
    ui.addEventListener('click', function (ev) {
      var b = ev.target.closest('button,[data-ye-capa]'); if (!b || !E) return;
      if (b.hasAttribute('data-ye-x')) { if (b.getAttribute('data-ye-x') === 'cancelar') { if (E.hist.length && !confirm('¿Salir sin usar los cambios?')) return; var f = op.alCancelar; cerrar(); if (f) f(); return; } aplicar(); return; }
      if (b.hasAttribute('data-ye-h')) { if (b.getAttribute('data-ye-h') === 'undo') deshacer(); else rehacer(); return; }
      if (b.hasAttribute('data-ye-pz')) { cambiarPieza(b.getAttribute('data-ye-pz')); return; }
      if (b.hasAttribute('data-ye-tela')) { E.color = b.getAttribute('data-ye-tela'); Array.prototype.forEach.call(ui.querySelectorAll('[data-ye-tela]'), function (x) { x.classList.toggle('on', x === b); }); cargarFoto(); return; }
      if (b.hasAttribute('data-ye-z')) { var f2 = +b.getAttribute('data-ye-z'); if (!f2) { E.zoom = 1; E.pan = [0, 0]; } else E.zoom = clamp(E.zoom * f2, 0.5, 6); pintar(); zoomTxt(); return; }
      if (b.hasAttribute('data-ye-t')) {
        var tt = b.getAttribute('data-ye-t');
        if (tt === 'texto') { guardarHist(); var c = nuevaCapaTexto(); tabla().capas.push(c); E.sel = c.id; todo(); pintarTabs(); setTimeout(function () { var ta = ui.querySelector('[data-ye="txt"]'); if (ta) { ta.focus(); ta.select(); } }, 30); }
        else if (tt === 'varita') { var s = capaSel() || tabla().capas.filter(function (x) { return x.tipo === 'img'; }).slice(-1)[0]; if (!s) { alert('Primero subí una imagen.'); return; } E.sel = s.id; todo(); accion('varita'); }
        else if (tt === 'limpio') { E.limpio = !E.limpio; b.classList.toggle('on', E.limpio); pintar(); }
        return;
      }
      if (b.hasAttribute('data-ye-a')) { accion(b.getAttribute('data-ye-a')); return; }
      if (b.hasAttribute('data-ye-fuente')) { var c2 = capaSel(); guardarHist(); c2.texto.fuente = b.getAttribute('data-ye-fuente'); (document.fonts ? document.fonts.load('700 40px "' + c2.texto.fuente + '"') : Promise.resolve()).then(function () { reprocesar(c2); todo(); }); return; }
      if (b.hasAttribute('data-ye-alin')) { var c3 = capaSel(); guardarHist(); c3.texto.alinear = b.getAttribute('data-ye-alin'); reprocesar(c3); todo(); return; }
      var fila = ev.target.closest('[data-ye-capa]');
      if (fila) {
        var id = +fila.getAttribute('data-ye-capa'), cc = tabla().capas.filter(function (x) { return x.id === id; })[0], acc = ev.target.closest('[data-ye-c]');
        if (acc && cc) {
          guardarHist(); var l = tabla().capas, i = l.indexOf(cc), a = acc.getAttribute('data-ye-c');
          if (a === 'ojo') cc.oculto = !cc.oculto; else if (a === 'lock') cc.bloqueado = !cc.bloqueado;
          else if (a === 'sube' && i < l.length - 1) { l.splice(i, 1); l.splice(i + 1, 0, cc); } else if (a === 'baja' && i > 0) { l.splice(i, 1); l.splice(i - 1, 0, cc); }
        }
        E.sel = id; todo();
      }
    });
    ui.addEventListener('input', function (ev) { if (ev.target.type === 'range' || ev.target.tagName === 'TEXTAREA' || ev.target.type === 'number' || ev.target.type === 'color') cambio(ev, false); });
    ui.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t.hasAttribute('data-ye-subir')) { agregarArchivos(t.files); t.value = ''; return; }
      cambio(ev, true);
    });
    var lz = ui.querySelector('.ye-lienzo');
    lz.addEventListener('dragover', function (ev) { ev.preventDefault(); lz.classList.add('encima'); });
    lz.addEventListener('dragleave', function (ev) { if (!lz.contains(ev.relatedTarget)) lz.classList.remove('encima'); });
    lz.addEventListener('drop', function (ev) { ev.preventDefault(); lz.classList.remove('encima'); if (ev.dataTransfer.files.length) agregarArchivos(ev.dataTransfer.files); });
    document.addEventListener('paste', pegar);

    pintarTabs(); todo(); zoomTxt();
    requestAnimationFrame(function () { ui.classList.add('on'); });
    var cargas = [];
    if (op.estado) { restaurarEstado(op.estado); }
    else Object.keys(op.capas || {}).forEach(function (pz) {
      if (!E.tablas[pz]) return;
      (op.capas[pz] || []).forEach(function (cfg) {
        cargas.push(nuevaCapaImg(cfg.fuente, cfg.nombre, pz).then(function (c) {
          if (!E) return;
          if (cfg.rect) { c.w = cfg.rect.w; c.cx = cfg.rect.x + cfg.rect.w / 2; c.cy = cfg.rect.y + cfg.rect.h / 2; }
          if (cfg.q && cfg.q.modo === 'varita') { c.q = cfg.q; reprocesar(c); }
          E.tablas[pz].capas.push(c); if (pz === E.pz && !E.sel) E.sel = c.id;
        }).catch(function (e) { alert(e.message); }));
      });
    });
    return Promise.all([cargarFoto()].concat(cargas)).then(function () { if (E) { todo(); pintarTabs(); } });
  }
  function restaurarEstado(st) {
    E.color = st.color || E.color;
    Object.keys(st.tablas || {}).forEach(function (pz) { if (!E.tablas[pz]) return; E.tablas[pz].capas = st.tablas[pz].map(function (c) { var n = {}; Object.keys(c).forEach(function (k) { n[k] = c[k]; }); n.id = uid++; if (!n.src) procesar(n); n.firma = firma(n); return n; }); });
    var l = E.tablas[E.pz].capas; if (l.length) E.sel = l[l.length - 1].id;
  }
  function pegar(ev) {
    if (!E) { document.removeEventListener('paste', pegar); return; }
    var it = ev.clipboardData && ev.clipboardData.files; if (it && it.length) { ev.preventDefault(); agregarArchivos(it); }
  }
  function agregarArchivos(files) {
    var l = Array.prototype.slice.call(files || []).filter(function (f) { return /^image\//.test(f.type) || /\.(png|jpe?g|webp|pdf)$/i.test(f.name); });
    if (!l.length) return;
    var pz = E.pz; guardarHist();
    var cad = Promise.resolve();
    l.forEach(function (f) { cad = cad.then(function () { return nuevaCapaImg(f, f.name.replace(/\.[a-z0-9]+$/i, ''), pz).then(function (c) { if (!E) return; E.tablas[pz].capas.push(c); E.sel = c.id; todo(); pintarTabs(); }); }); });
    cad.catch(function (e) { alert(e.message); });
  }
  function aplicar() {
    var res = { prenda: E.prenda, color: E.color, piezas: {}, estado: estadoActual() };
    E.piezas.forEach(function (pz) { res.piezas[pz] = exportarPieza(pz); });
    var f = E.op.alAplicar; cerrar(); if (f) f(res);
  }
  function estadoActual() { var t = {}; Object.keys(E.tablas).forEach(function (pz) { t[pz] = E.tablas[pz].capas.map(function (c) { var n = {}; Object.keys(c).forEach(function (k) { n[k] = c[k]; }); return n; }); }); return { color: E.color, tablas: t }; }
  // Convierte un canvas en File PNG (para el admin, que trabaja con archivos)
  function aArchivo(canvas, nombre) { return new Promise(function (ok) { canvas.toBlob(function (b) { ok(new File([b], (nombre || 'diseno') + '.png', { type: 'image/png' })); }, 'image/png'); }); }

  return { abrir: abrir, cerrar: cerrar, aArchivo: aArchivo, FUENTES: FUENTES, abierto: function () { return !!E; } };
})();
