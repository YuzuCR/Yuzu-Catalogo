/* =====================================================================
   Yuzu — prenda en 3D (Three.js, compartido por la tienda y el admin)
   La camiseta se modela a partir de la silueta de las fotos de plantilla
   (images/plantillas/{prenda}-negro-{frente|espalda}.jpg) y se "infla"
   para darle volumen. Como textura lleva el mockup real (con sus pliegues).
   Al cambiar de talla la prenda crece o se achica y el diseño conserva su
   tamaño impreso en cm (la lámina DTF no cambia), igual que en la vida real.
   Uso:
     YuzuPrenda3D.montar(div, cfg, { talla: 'L', giro: true })  → Promise<visor>
     YuzuPrenda3D.abrir(cfg, { talla: 'M', titulo: 'Nombre' })     → visor a pantalla completa
     cfg = { prenda, color, versiones, iVersion, ajuste, opc }    (lo mismo que YuzuMockup.generar)
   ===================================================================== */
var YuzuPrenda3D = (function () {
  var BASE = ((document.currentScript && document.currentScript.src) || location.href).replace(/[^\/]*$/, '');
  var URL_THREE = BASE + 'vendor/three.module.min.js';
  var W = 1080, H = 1440, ESC = 4;              // fotos 1080×1440, máscara a 1/4
  var PASO = 2;                                 // malla: 1 vértice cada 2 celdas de máscara (8 px de foto)

  // Medidas en plano (ancho de pecho × largo, cm). La foto de plantilla es la talla de referencia.
  var TALLAS = {
    boxy: { S: [51, 66], M: [56, 71], L: [61, 74], XL: [66, 76] },
    unisex: { XS: [41, 61], S: [46, 69], M: [51, 71], L: [56, 74], XL: [61, 76], '2XL': [66, 79], '3XL': [71, 81] }
  };
  var REF = 'L';
  function tablaDe(prenda) {
    if (prenda === 'boxy') return (typeof MEDIDAS !== 'undefined' && MEDIDAS.L) ? MEDIDAS : TALLAS.boxy;
    return (typeof MEDIDAS_UNISEX !== 'undefined' && MEDIDAS_UNISEX.L) ? MEDIDAS_UNISEX : TALLAS.unisex;
  }
  function escalaTalla(prenda, talla) {
    var t = tablaDe(prenda), r = t[REF], m = t[talla] || r;
    return { sx: m[0] / r[0], sy: m[1] / r[1], cm: m };
  }

  var T = null;
  function three() { return T || (T = import(URL_THREE)); }
  function soportado() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
  }
  function cmPx(prenda) { return (YuzuMockup.PRENDAS[prenda] || {}).cmPx || 0.1; }

  // ---------- Silueta: máscara, distancia con signo y malla ----------
  var SIL = {};
  function silueta(prenda) {
    if (SIL[prenda]) return SIL[prenda];
    var r = YuzuMockup.RUTA + prenda + '-negro-';
    return (SIL[prenda] = Promise.all([YuzuMockup.cargar(r + 'frente.jpg'), YuzuMockup.cargar(r + 'espalda.jpg')]).then(function (im) {
      var mw = W / ESC, mh = H / ESC, n = mw * mh;
      var cv = document.createElement('canvas'); cv.width = mw; cv.height = mh;
      var x = cv.getContext('2d', { willReadFrequently: true });
      function mascara(img, espejo) {
        x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, mw, mh);
        if (espejo) { x.translate(mw, 0); x.scale(-1, 1); }
        x.drawImage(img, 0, 0, mw, mh);
        var d = x.getImageData(0, 0, mw, mh).data, claro = new Uint8Array(n), fondo = new Uint8Array(n), pila = [];
        for (var i = 0; i < n; i++) claro[i] = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11) > 185 ? 1 : 0;
        function sem(i) { if (claro[i] && !fondo[i]) { fondo[i] = 1; pila.push(i); } }
        for (var a = 0; a < mw; a++) { sem(a); sem(n - mw + a); }
        for (var b = 0; b < mh; b++) { sem(b * mw); sem(b * mw + mw - 1); }
        while (pila.length) { var k = pila.pop(), cx = k % mw; if (cx > 0) sem(k - 1); if (cx < mw - 1) sem(k + 1); if (k >= mw) sem(k - mw); if (k < n - mw) sem(k + mw); }
        var m = new Uint8Array(n); for (var j = 0; j < n; j++) m[j] = fondo[j] ? 0 : 1;
        return m;
      }
      var mf = mascara(im[0], false), mb = mascara(im[1], false), mbE = mascara(im[1], true), u = new Uint8Array(n);
      for (var i = 0; i < n; i++) u[i] = mf[i] || mbE[i] ? 1 : 0;
      var sd = distancia(u, mw, mh);
      for (var p = 0; p < 3; p++) sd = suavizar(sd, mw, mh);
      var y0 = mh, y1 = 0; for (var q = 0; q < n; q++) if (u[q]) { var yy = (q / mw) | 0; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
      return { mw: mw, mh: mh, sd: sd, cuello: y0 * ESC, abajo: y1 * ESC, alfa: { frente: alfaCanvas(erosionar(mf, mw, mh), mw, mh), espalda: alfaCanvas(erosionar(mb, mw, mh), mw, mh) } };
    }));
  }
  // Distancia (chaflán 3-4) adentro positiva, afuera negativa, en celdas de máscara
  function distancia(m, w, h) {
    function dt(dentro) {
      var INF = 1e9, d = new Float32Array(w * h);
      for (var i = 0; i < w * h; i++) d[i] = (m[i] === (dentro ? 1 : 0)) ? INF : 0;
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var k = y * w + x, v = d[k]; if (!v) continue;
        if (x > 0) v = Math.min(v, d[k - 1] + 3);
        if (y > 0) { v = Math.min(v, d[k - w] + 3); if (x > 0) v = Math.min(v, d[k - w - 1] + 4); if (x < w - 1) v = Math.min(v, d[k - w + 1] + 4); }
        d[k] = v;
      }
      for (var y2 = h - 1; y2 >= 0; y2--) for (var x2 = w - 1; x2 >= 0; x2--) {
        var k2 = y2 * w + x2, v2 = d[k2]; if (!v2) continue;
        if (x2 < w - 1) v2 = Math.min(v2, d[k2 + 1] + 3);
        if (y2 < h - 1) { v2 = Math.min(v2, d[k2 + w] + 3); if (x2 < w - 1) v2 = Math.min(v2, d[k2 + w + 1] + 4); if (x2 > 0) v2 = Math.min(v2, d[k2 + w - 1] + 4); }
        d[k2] = v2;
      }
      return d;
    }
    var a = dt(true), b = dt(false), s = new Float32Array(w * h);
    for (var i = 0; i < w * h; i++) s[i] = m[i] ? (a[i] / 3 - 0.5) : -(b[i] / 3 - 0.5);
    return s;
  }
  function suavizar(s, w, h) {
    var o = new Float32Array(w * h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var t = 0, c = 0;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; t += s[Y * w + X]; c++; }
      o[y * w + x] = t / c;
    }
    return o;
  }
  function erosionar(m, w, h) {
    var o = new Uint8Array(w * h);
    for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++) { var k = y * w + x; o[k] = m[k] && m[k - 1] && m[k + 1] && m[k - w] && m[k + w] ? 1 : 0; }
    return o;
  }
  function alfaCanvas(m, w, h) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'), d = x.createImageData(w, h);
    for (var i = 0; i < w * h; i++) { d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = 255; d.data[i * 4 + 3] = m[i] ? 255 : 0; }
    x.putImageData(d, 0, 0); return c;
  }

  // Malla de una cara (frente o espalda) en cm, centrada
  function malla(THREE, S, prenda, cara) {
    var mw = S.mw, mh = S.mh, sd = S.sd, cp = cmPx(prenda), cmCelda = ESC * cp;
    var nx = Math.floor((mw - 1) / PASO) + 1, ny = Math.floor((mh - 1) / PASO) + 1;
    var R = 11, PROF = prenda === 'hoodie' ? 12 : 9.5;
    function s(x, y) { x = Math.max(0, Math.min(mw - 1.001, x)); y = Math.max(0, Math.min(mh - 1.001, y)); var x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, k = y0 * mw + x0; return sd[k] * (1 - fx) * (1 - fy) + sd[k + 1] * fx * (1 - fy) + sd[k + mw] * (1 - fx) * fy + sd[k + mw + 1] * fx * fy; }
    var cy = (S.cuello + S.abajo) / 2;
    var pos = [], uv = [], idx = [], mapa = new Int32Array(nx * ny).fill(-1), dentro = new Uint8Array(nx * ny);
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) dentro[j * nx + i] = s(i * PASO, j * PASO) > 0 ? 1 : 0;
    function vert(i, j) {
      var k = j * nx + i; if (mapa[k] >= 0) return mapa[k];
      var x = i * PASO, y = j * PASO, v = s(x, y);
      if (v < 0.35) { // se lleva al borde exacto siguiendo el gradiente
        for (var it = 0; it < 3; it++) { var gx = s(x + 0.5, y) - s(x - 0.5, y), gy = s(x, y + 0.5) - s(x, y - 0.5), g = Math.hypot(gx, gy) || 1; v = s(x, y); x += gx / g * -v; y += gy / g * -v; }
        v = 0;
      }
      var px = (x + 0.5) * ESC, py = (y + 0.5) * ESC, d = Math.max(0, v) * cmCelda, t = Math.min(1, d / R);
      var z = PROF * Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t)));
      z *= 1 - 0.18 * Math.max(0, (py - S.cuello) / (S.abajo - S.cuello) - 0.75) / 0.25; // el ruedo se aplana un poco
      pos.push((px - W / 2) * cp, (cy - py) * cp, cara === 'frente' ? z : -z);
      uv.push(cara === 'frente' ? px / W : 1 - px / W, 1 - py / H);
      return (mapa[k] = pos.length / 3 - 1);
    }
    for (var j2 = 0; j2 < ny - 1; j2++) for (var i2 = 0; i2 < nx - 1; i2++) {
      var a = j2 * nx + i2; if (!(dentro[a] || dentro[a + 1] || dentro[a + nx] || dentro[a + nx + 1])) continue;
      var v00 = vert(i2, j2), v10 = vert(i2 + 1, j2), v01 = vert(i2, j2 + 1), v11 = vert(i2 + 1, j2 + 1);
      if (cara === 'frente') idx.push(v00, v01, v10, v10, v01, v11); else idx.push(v00, v10, v01, v10, v11, v01);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  // ---------- Texturas: mockup real, con el diseño a su tamaño en cm para la talla ----------
  function textura(cfg, vista, talla, S) {
    var prenda = cfg.prenda || 'boxy', color = cfg.color || 'Negro', f = YuzuMockup.fuente(prenda, color, vista);
    if (!f) return Promise.reject(new Error('Sin foto de ' + vista));
    var piezas = cfg.versiones && cfg.versiones.length ? YuzuMockup.piezasActivas(prenda, color, vista, cfg.versiones, cfg.iVersion || 0, cfg.opc) : [];
    return Promise.all([YuzuMockup.cargar(f.foto)].concat(piezas.map(function (it) { return typeof it.src === 'string' ? YuzuMockup.cargar(it.src) : Promise.resolve(it.src); }))).then(function (r) {
      var e = escalaTalla(prenda, talla), info = [];
      var capas = piezas.map(function (it, k) {
        var rc = YuzuMockup.rectPieza(prenda, color, it.pz, r[k + 1], cfg.ajuste, cfg.opc); if (!rc) return null;
        var cx = rc.x + rc.w / 2, w = rc.w / e.sx, h = rc.h / e.sx;
        var x = W / 2 + (cx - W / 2) / e.sx - w / 2, y = S.cuello + (rc.y - S.cuello) / e.sy;
        info.push({ pz: it.pz, cm: [rc.w * cmPx(prenda), rc.h * cmPx(prenda)] });
        return { pz: it.pz, img: r[k + 1], rect: { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }, rot: ((YuzuMockup.ZONAS[prenda] || {})[it.pz] || {}).rot || 0 };
      }).filter(Boolean);
      var cv = YuzuMockup.componer(r[0], f.tinte, capas);
      return { canvas: sangrar(cv, S.alfa[vista], YuzuMockup.HEX[color] || '#888'), info: info };
    });
  }
  // Quita el fondo de la foto y estira el borde de la tela hacia afuera (así la costura no muestra blanco)
  function sangrar(cv, alfa, hex) {
    var o = document.createElement('canvas'); o.width = W; o.height = H;
    var g = o.getContext('2d'); g.imageSmoothingEnabled = true;
    g.drawImage(alfa, 0, 0, W, H); g.globalCompositeOperation = 'source-in'; g.drawImage(cv, 0, 0);
    var tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; var tg = tmp.getContext('2d');
    [4, 8, 16, 32, 64].forEach(function (r) {
      tg.clearRect(0, 0, W, H); tg.drawImage(o, 0, 0);
      g.globalCompositeOperation = 'destination-over';
      for (var a = 0; a < 8; a++) { var an = a * Math.PI / 4; g.drawImage(tmp, Math.round(Math.cos(an) * r), Math.round(Math.sin(an) * r)); }
    });
    g.fillStyle = hex; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
    return o;
  }

  // ---------- Visor ----------
  var CSS = '.y3d{position:relative;width:100%;height:100%;touch-action:pan-y;cursor:grab;-webkit-user-select:none;user-select:none}.y3d.agarrado{cursor:grabbing}.y3d canvas{display:block;width:100%!important;height:100%!important}' +
    '.y3d-sombra{position:absolute;left:50%;bottom:4%;width:56%;height:7%;transform:translateX(-50%);background:radial-gradient(ellipse at center,rgba(0,0,0,.38),transparent 70%);filter:blur(4px);pointer-events:none}' +
    '.y3d-carga{position:absolute;inset:0;display:grid;place-items:center;font:12px/1.4 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;opacity:.6;pointer-events:none}' +
    '.y3d-modal{position:fixed;inset:0;z-index:9500;background:radial-gradient(ellipse at 50% 42%,#2b2822,#0b0a09 72%);color:#f2f0eb;display:flex;flex-direction:column;opacity:0;transition:opacity .3s}.y3d-modal.on{opacity:1}' +
    '.y3d-modal .y3d{flex:1;touch-action:none}.y3d-cab{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;gap:12px}.y3d-cab b{font:600 15px/1.2 system-ui,sans-serif}.y3d-x{width:40px;height:40px;border:1px solid rgba(255,255,255,.25);background:none;color:inherit;font-size:18px;cursor:pointer}' +
    '.y3d-pie{padding:12px 18px 20px;display:flex;flex-direction:column;gap:10px;align-items:center}.y3d-tallas{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}.y3d-tallas button{min-width:46px;padding:9px 0;border:1px solid rgba(255,255,255,.28);background:none;color:inherit;font:12px ui-monospace,monospace;cursor:pointer;transition:background .2s,color .2s}.y3d-tallas button.on{background:#c3c24d;border-color:#c3c24d;color:#111}' +
    '.y3d-dato{font:11px/1.5 ui-monospace,monospace;letter-spacing:.06em;opacity:.75;text-align:center}.y3d-vistas{display:flex;gap:6px}.y3d-vistas button{padding:7px 12px;border:1px solid rgba(255,255,255,.2);background:none;color:inherit;font:11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.1em;cursor:pointer}';
  function estilos() { if (document.getElementById('y3d-css')) return; var s = document.createElement('style'); s.id = 'y3d-css'; s.textContent = CSS; document.head.appendChild(s); }

  function montar(cont, cfg, op) {
    op = op || {}; estilos();
    if (!soportado()) return Promise.reject(new Error('Este navegador no tiene WebGL'));
    var raiz = document.createElement('div'); raiz.className = 'y3d';
    raiz.innerHTML = '<div class="y3d-sombra"></div><div class="y3d-carga">Armando la prenda…</div>';
    cont.appendChild(raiz);
    if (op.modal) raiz.style.touchAction = 'none';
    var prenda = (cfg.prenda = cfg.prenda || 'boxy');
    return Promise.all([three(), silueta(prenda)]).then(function (r) {
      var THREE = r[0], S = r[1];
      var ren = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, op.modal ? 2 : 1.5));
      ren.outputColorSpace = THREE.SRGBColorSpace;
      raiz.insertBefore(ren.domElement, raiz.firstChild);
      var escena = new THREE.Scene(), cam = new THREE.PerspectiveCamera(28, 1, 10, 2000);
      escena.add(new THREE.HemisphereLight(0xffffff, 0x9a9488, 2.1));
      var sol = new THREE.DirectionalLight(0xffffff, 1.15); sol.position.set(60, 120, 160); escena.add(sol);
      var contra = new THREE.DirectionalLight(0xfff1d6, 0.9); contra.position.set(-140, 60, -120); escena.add(contra);
      var grupo = new THREE.Group(); escena.add(grupo);
      var cuerpo = new THREE.Group(); grupo.add(cuerpo);
      var gF = malla(THREE, S, prenda, 'frente'), gB = malla(THREE, S, prenda, 'espalda');
      function mat() { return new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.93, metalness: 0 }); }
      var mF = mat(), mB = mat();
      cuerpo.add(new THREE.Mesh(gF, mF), new THREE.Mesh(gB, mB));
      var altoCm = (S.abajo - S.cuello) * cmPx(prenda);
      var estado = { talla: op.talla || REF, cfg: cfg, ang: op.angulo != null ? op.angulo : -0.5, vel: op.giro === false ? 0 : 0.006, arr: null, zoom: 1, vivo: true, visible: true, info: [], tok: 0 };

      function tamano() {
        var w = raiz.clientWidth || 300, h = raiz.clientHeight || 400;
        ren.setSize(w, h, false); cam.aspect = w / h;
        var dist = (altoCm * 1.32) / (2 * Math.tan(cam.fov * Math.PI / 360)) / Math.min(1, cam.aspect / 0.62);
        cam.position.set(0, altoCm * 0.06, dist / estado.zoom); cam.lookAt(0, -altoCm * 0.02, 0); cam.updateProjectionMatrix();
      }
      function aplicarTalla() {
        var e = escalaTalla(prenda, estado.talla); cuerpo.scale.set(e.sx, e.sy, e.sx);
        var tok = ++estado.tok;
        return Promise.all([textura(estado.cfg, 'frente', estado.talla, S), textura(estado.cfg, 'espalda', estado.talla, S)]).then(function (t) {
          if (tok !== estado.tok || !estado.vivo) return;
          [[mF, t[0].canvas], [mB, t[1].canvas]].forEach(function (p) {
            var tx = new THREE.CanvasTexture(p[1]); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = Math.min(8, ren.capabilities.getMaxAnisotropy());
            if (p[0].map) p[0].map.dispose(); p[0].map = tx; p[0].needsUpdate = true;
          });
          estado.info = t[0].info.concat(t[1].info);
          var c = raiz.querySelector('.y3d-carga'); if (c) c.remove();
          if (op.alCambiar) op.alCambiar(visor);
        });
      }
      // Arrastre: solo horizontal; el vertical sigue siendo scroll de la página
      var ultimoX = 0, ultimoT = 0, movio = false;
      raiz.addEventListener('pointerdown', function (e) { estado.arr = { x: e.clientX, y: e.clientY, a: estado.ang, id: e.pointerId }; ultimoX = e.clientX; ultimoT = performance.now(); movio = false; });
      raiz.addEventListener('pointermove', function (e) {
        var A = estado.arr; if (!A || A.id !== e.pointerId) return;
        var dx = e.clientX - A.x, dy = e.clientY - A.y;
        if (!movio) { if (Math.abs(dx) < 6) return; if (!op.modal && Math.abs(dy) > Math.abs(dx)) { estado.arr = null; return; } movio = true; raiz.classList.add('agarrado'); try { raiz.setPointerCapture(e.pointerId); } catch (er) {} }
        var ahora = performance.now(); estado.vel = (e.clientX - ultimoX) * 0.009 / Math.max(1, (ahora - ultimoT) / 16); ultimoX = e.clientX; ultimoT = ahora;
        estado.ang = A.a + dx * 0.009;
      });
      function soltar() { if (!estado.arr) return; estado.arr = null; raiz.classList.remove('agarrado'); if (Math.abs(estado.vel) < 0.002 && op.giro !== false) estado.vel = 0.006 * (estado.vel < 0 ? -1 : 1); }
      raiz.addEventListener('pointerup', soltar); raiz.addEventListener('pointercancel', soltar);
      raiz.addEventListener('click', function (e) { if (movio) { e.stopPropagation(); e.preventDefault(); movio = false; return; } if (op.alTocar) op.alTocar(); });
      if (op.modal) raiz.addEventListener('wheel', function (e) { e.preventDefault(); estado.zoom = Math.max(0.8, Math.min(2.6, estado.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))); tamano(); }, { passive: false });

      var io = new IntersectionObserver(function (es) { estado.visible = es[0].isIntersecting; if (estado.visible) bucle(); }, { rootMargin: '80px' });
      io.observe(raiz);
      var ro = window.ResizeObserver ? new ResizeObserver(tamano) : null; if (ro) ro.observe(raiz); else addEventListener('resize', tamano);
      var corriendo = false;
      function bucle() {
        if (corriendo) return; corriendo = true;
        (function cuadro() {
          if (!estado.vivo || !estado.visible || document.hidden) { corriendo = false; return; }
          if (!estado.arr) { estado.ang += estado.vel; if (op.giro !== false) estado.vel += ((estado.vel < 0 ? -0.006 : 0.006) - estado.vel) * 0.02; else estado.vel *= 0.95; }
          grupo.rotation.y = estado.ang; grupo.rotation.x = 0.06 + Math.sin(performance.now() / 1800) * 0.015; grupo.position.y = Math.sin(performance.now() / 1400) * 0.8;
          ren.render(escena, cam); requestAnimationFrame(cuadro);
        })();
      }
      document.addEventListener('visibilitychange', function () { if (!document.hidden) bucle(); });

      var visor = {
        talla: function (t) { if (t && t !== estado.talla) { estado.talla = t; return aplicarTalla(); } return Promise.resolve(); },
        tallaActual: function () { return estado.talla; },
        tallas: function () { return Object.keys(tablaDe(prenda)); },
        medida: function () { return escalaTalla(prenda, estado.talla).cm; },
        diseno: function () { return estado.info; },
        config: function (c) { estado.cfg = c; c.prenda = prenda; return aplicarTalla(); },
        girarA: function (vista) { estado.vel = 0; var obj = vista === 'espalda' ? Math.PI : 0, k = Math.round((estado.ang - obj) / (2 * Math.PI)); estado.ang = obj + k * 2 * Math.PI; },
        captura: function () { ren.render(escena, cam); return ren.domElement.toDataURL('image/png'); },
        destruir: function () { estado.vivo = false; io.disconnect(); if (ro) ro.disconnect(); [gF, gB].forEach(function (g) { g.dispose(); }); [mF, mB].forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); ren.dispose(); raiz.remove(); },
        elemento: raiz
      };
      tamano();
      return aplicarTalla().then(function () { bucle(); return visor; });
    }).catch(function (e) { raiz.remove(); throw e; });
  }

  // Visor a pantalla completa: tallas, frente/espalda, medidas reales
  function abrir(cfg, op) {
    op = op || {}; estilos();
    var ov = document.createElement('div'); ov.className = 'y3d-modal';
    ov.innerHTML = '<div class="y3d-cab"><b>' + (op.titulo ? String(op.titulo).replace(/</g, '&lt;') : 'Tu prenda en 3D') + '</b><button class="y3d-x" aria-label="Cerrar">✕</button></div><div class="y3d-lugar" style="flex:1;display:flex"></div>' +
      '<div class="y3d-pie"><div class="y3d-vistas"><button data-v="frente">Frente</button><button data-v="espalda">Espalda</button></div><div class="y3d-tallas"></div><div class="y3d-dato"></div><div class="y3d-dato" style="opacity:.5">Arrastrá para girar · rueda para acercar</div></div>';
    document.body.appendChild(ov); requestAnimationFrame(function () { ov.classList.add('on'); });
    var visor = null, vivo = true;
    function cerrar() { vivo = false; ov.classList.remove('on'); document.removeEventListener('keydown', tecla); setTimeout(function () { if (visor) visor.destruir(); ov.remove(); if (op.alCerrar) op.alCerrar(visor ? visor.tallaActual() : null); }, 300); }
    function tecla(e) { if (e.key === 'Escape') cerrar(); }
    document.addEventListener('keydown', tecla);
    ov.querySelector('.y3d-x').onclick = cerrar;
    function dato() {
      if (!visor) return;
      var m = visor.medida(), d = visor.diseno().filter(function (x) { return x.pz === 'espalda' || x.pz === 'pechoGrande'; })[0] || visor.diseno()[0];
      ov.querySelector('.y3d-dato').textContent = 'Talla ' + visor.tallaActual() + ': ' + m[0] + ' × ' + m[1] + ' cm' + (d ? ' · diseño ' + d.cm[0].toFixed(0) + ' × ' + d.cm[1].toFixed(0) + ' cm (igual en todas las tallas)' : '');
      Array.prototype.forEach.call(ov.querySelectorAll('.y3d-tallas button'), function (b) { b.classList.toggle('on', b.getAttribute('data-t') === visor.tallaActual()); });
    }
    montar(ov.querySelector('.y3d-lugar'), cfg, { talla: op.talla, modal: true, angulo: op.vista === 'espalda' ? Math.PI : 0, giro: false, alCambiar: dato }).then(function (v) {
      if (!vivo) { v.destruir(); return; }
      visor = v;
      ov.querySelector('.y3d-tallas').innerHTML = v.tallas().map(function (t) { return '<button data-t="' + t + '">' + t + '</button>'; }).join('');
      ov.querySelector('.y3d-tallas').onclick = function (e) { var b = e.target.closest('[data-t]'); if (b) v.talla(b.getAttribute('data-t')).then(dato); };
      ov.querySelector('.y3d-vistas').onclick = function (e) { var b = e.target.closest('[data-v]'); if (b) v.girarA(b.getAttribute('data-v')); };
      dato();
    }).catch(function (e) { ov.querySelector('.y3d-lugar').innerHTML = '<p style="margin:auto;opacity:.7">No se pudo mostrar en 3D: ' + e.message + '</p>'; });
    return { cerrar: cerrar };
  }

  return { montar: montar, abrir: abrir, soportado: soportado, TALLAS: TALLAS, escalaTalla: escalaTalla, precargar: function () { return three(); } };
})();
