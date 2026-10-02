/* =====================================================================
   Yuzu — mockup automático (compartido por la tienda y el admin)
   Pone diseños PNG transparentes sobre fotos de prendas lisas
   (images/plantillas/{prenda}-{color}-{vista}.jpg), respetando los
   pliegues y sombras de la tela. Todo corre en el navegador (canvas).
   ===================================================================== */
var YuzuMockup = (function () {
  var RUTA = 'images/plantillas/';
  var VISTAS = ['espalda', 'frente', 'lado'];
  var NOMBRE_VISTA = { espalda: 'Espalda', frente: 'Frente', lado: 'Lado / manga' };
  // Qué diseño va en cada vista
  var DISENO_DE_VISTA = { espalda: 'espalda', frente: 'pecho', lado: 'manga' };

  // cmPx = centímetros por píxel en la foto (aprox., talla L) para mostrar medidas reales
  var PRENDAS = {
    boxy: { nombre: 'Boxy oversize', cmPx: 0.117 },
    sinmangas: { nombre: 'Sin mangas', cmPx: 0.1 },
    mangalarga: { nombre: 'Manga larga', cmPx: 0.1 },
    hoodie: { nombre: 'Hoodie', cmPx: 0.1 }
  };

  // Colores con foto propia. Los que no estén se tiñen a partir de la foto blanca.
  var PLANTILLAS = {
    boxy: ['Blanco', 'Negro'],
    sinmangas: ['Blanco', 'Negro'],
    mangalarga: ['Blanco', 'Negro'],
    hoodie: ['Negro']
  };

  // Zonas de impresión por prenda y vista, en píxeles de la foto (1080 × 1440).
  // El diseño se encaja dentro del recuadro sin deformarse.
  var ZONAS = {
    boxy: {
      espalda: { x: 420, y: 330, w: 240, h: 345, alinear: 'arriba' },
      frente: { x: 627, y: 350, w: 82, h: 90, alinear: 'centro' },
      lado: { x: 580, y: 613, w: 64, h: 70, alinear: 'centro' }
    },
    sinmangas: {
      espalda: { x: 400, y: 300, w: 280, h: 400, alinear: 'arriba' },
      frente: { x: 610, y: 330, w: 80, h: 85, alinear: 'centro' },
      lado: { x: 505, y: 560, w: 70, h: 80, alinear: 'centro' }
    },
    mangalarga: {
      espalda: { x: 400, y: 290, w: 280, h: 400, alinear: 'arriba' },
      frente: { x: 615, y: 330, w: 80, h: 85, alinear: 'centro' },
      lado: { x: 470, y: 520, w: 70, h: 240, alinear: 'centro' }
    },
    hoodie: {
      espalda: { x: 400, y: 480, w: 280, h: 400, alinear: 'arriba' },
      frente: { x: 600, y: 420, w: 85, h: 90, alinear: 'centro' },
      lado: { x: 500, y: 560, w: 80, h: 200, alinear: 'centro' }
    }
  };

  // Colores que ofrece el proveedor para cada prenda (la boxy se define por producto)
  var COLORES_PRENDA = {
    boxy: ['Blanco', 'Negro', 'Crema', 'Café', 'Gris grafito', 'Azul marino', 'Verde musgo'],
    sinmangas: ['Blanco', 'Negro', 'Gris jaspeado', 'Rojo', 'Azul navy', 'Azul royal'],
    mangalarga: ['Blanco', 'Negro', 'Gris jaspeado', 'Rojo', 'Azul navy', 'Amarillo', 'Verde perico'],
    hoodie: ['Negro']
  };

  var HEX = {
    'Blanco': '#f2f0eb', 'Negro': '#1a1a1a', 'Crema': '#efe4cc', 'Café': '#6b4a35',
    'Gris grafito': '#4a4a4a', 'Azul marino': '#1f2f4f', 'Verde musgo': '#55634a',
    'Gris jaspeado': '#b4b4b1', 'Rojo': '#c62828', 'Azul navy': '#1f2a44',
    'Azul royal': '#1e4fb5', 'Amarillo': '#f2c318', 'Verde perico': '#1f9e3a'
  };

  function slug(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function lum(r, g, b) { return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function hexRGB(h) { h = String(h).replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function esOscuro(color) { var c = hexRGB(HEX[color] || '#888888'); return lum(c[0], c[1], c[2]) < 110; }

  // Aplica configuración guardada en data/tienda.json → mockup
  // Logo de Yuzu en el pecho cuando el diseño no trae pecho propio
  var LOGO = { activo: true, claro: null, oscuro: null };
  function logoPara(color) {
    if (!LOGO.activo) return null;
    return esOscuro(color) ? (LOGO.claro || LOGO.oscuro) : (LOGO.oscuro || LOGO.claro);
  }
  function configurar(cfg) {
    if (!cfg) return;
    if (cfg.logoPecho) Object.keys(cfg.logoPecho).forEach(function (k) { LOGO[k] = cfg.logoPecho[k]; });
    if (cfg.zonas) Object.keys(cfg.zonas).forEach(function (p) {
      ZONAS[p] = ZONAS[p] || {};
      Object.keys(cfg.zonas[p]).forEach(function (v) { ZONAS[p][v] = cfg.zonas[p][v]; });
    });
    if (cfg.plantillas) Object.keys(cfg.plantillas).forEach(function (p) { PLANTILLAS[p] = cfg.plantillas[p]; });
  }

  var cache = {};
  function cargar(src) {
    if (!src) return Promise.resolve(null);
    if (cache[src]) return cache[src];
    cache[src] = new Promise(function (ok, mal) {
      var im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = function () { ok(im); };
      im.onerror = function () { delete cache[src]; mal(new Error('No pude cargar ' + src)); };
      im.src = src;
    });
    return cache[src];
  }

  // ¿Qué foto usar para esta prenda/color/vista? → { foto, tinte }
  function fuente(prenda, color, vista) {
    var lista = PLANTILLAS[prenda] || [];
    if (lista.indexOf(color) !== -1) return { foto: RUTA + prenda + '-' + slug(color) + '-' + vista + '.jpg', tinte: null };
    if (lista.indexOf('Blanco') !== -1) return { foto: RUTA + prenda + '-blanco-' + vista + '.jpg', tinte: HEX[color] || null };
    return null;
  }
  function disponible(prenda, color) { return !!fuente(prenda, color, 'espalda'); }

  // Recuadro final de la zona aplicando el ajuste fino del producto
  // aj = { escala, px, py, dy }: px/py = corrimiento en fracción de la zona (sirve igual en todas las prendas); dy = px heredado
  function zonaAjustada(z, aj) {
    aj = aj || {};
    var e = aj.escala || 1, dy = aj.dy || 0;
    var w = z.w * e, h = z.h * e;
    return { x: z.x + (z.w - w) / 2 + (aj.px || 0) * z.w, y: z.y + dy + (aj.py || 0) * z.h + (z.alinear === 'arriba' ? 0 : (z.h - h) / 2), w: w, h: h, alinear: z.alinear };
  }
  // Ajuste de una vista: el propio de la prenda si existe, si no el general
  function ajusteDe(ajuste, prenda, vista) {
    if (!ajuste) return null;
    var pp = ajuste.porPrenda && ajuste.porPrenda[prenda];
    return (pp && pp[vista]) || ajuste[vista] || null;
  }
  function disenoDe(versiones, iVersion, vista, color) {
    var src = archivoDe(versiones, iVersion, vista);
    if (!src && vista === 'frente' && versiones && versiones.length && !(versiones[iVersion] || {}).sinLogo) src = logoPara(color);
    return src;
  }
  // ---------- Posición del diseño ----------
  // Formato nuevo (v2): ajuste = { v: 2, boxy: { espalda: {cx, cy, w}, frente: {...}, lado: {...},
  //   colores: { Blanco: { espalda: {cx, cy, w} } } }, hoodie: {...} }
  // cx/cy = centro del diseño y w = ancho, en píxeles de la foto (1080 × 1440). El alto sale de la proporción del PNG.
  function medidas(img) { return [img.naturalWidth || img.width, img.naturalHeight || img.height]; }
  function aRect(img, p) {
    var m = medidas(img), w = Math.max(4, p.w), h = w * m[1] / m[0];
    return { x: Math.round(p.cx - w / 2), y: Math.round(p.cy - h / 2), w: Math.round(w), h: Math.round(h) };
  }
  function deRect(r) { return { cx: r.x + r.w / 2, cy: r.y + r.h / 2, w: r.w }; }
  function posGuardada(ajuste, prenda, color, vista, sinColor) {
    var pp = ajuste && ajuste[prenda]; if (!pp) return null;
    var c = !sinColor && pp.colores && pp.colores[color] && pp.colores[color][vista];
    return c || pp[vista] || null;
  }
  // De dónde sale la posición: 'color' | 'prenda' | 'boxy' (heredada) | 'inicial'
  function origenPos(ajuste, prenda, color, vista) {
    if (!ajuste || ajuste.v !== 2) return 'inicial';
    var pp = ajuste[prenda];
    if (pp && pp.colores && pp.colores[color] && pp.colores[color][vista]) return 'color';
    if (pp && pp[vista]) return 'prenda';
    if (prenda !== 'boxy' && ajuste.boxy && ajuste.boxy[vista] && ZONAS.boxy && ZONAS.boxy[vista]) return 'boxy';
    return 'inicial';
  }
  // Rectángulo final del diseño en la foto
  function rectDiseno(prenda, color, vista, img, ajuste, sinColor) {
    var z = (ZONAS[prenda] || {})[vista]; if (!z || !img) return null;
    if (ajuste && ajuste.v === 2) {
      var p = posGuardada(ajuste, prenda, color, vista, sinColor);
      if (p) return aRect(img, p);
      if (prenda !== 'boxy' && ajuste.boxy && ajuste.boxy[vista] && ZONAS.boxy[vista]) {
        // Heredar de la boxy, adaptado a la zona de esta prenda
        var zo = ZONAS.boxy[vista], q = ajuste.boxy[vista];
        return aRect(img, { cx: z.x + (q.cx - zo.x) / zo.w * z.w, cy: z.y + (q.cy - zo.y) / zo.h * z.h, w: q.w / zo.w * z.w });
      }
      return encajar(img, z);
    }
    return encajar(img, zonaAjustada(z, ajusteDe(ajuste, prenda, vista)));
  }

  // Rectángulo que ocupa el diseño dentro de la zona (sin deformar)
  function encajar(diseno, z) {
    var dw = diseno.naturalWidth || diseno.width, dh = diseno.naturalHeight || diseno.height;
    var esc = Math.min(z.w / dw, z.h / dh);
    var w = Math.max(1, Math.round(dw * esc)), h = Math.max(1, Math.round(dh * esc));
    return { x: Math.round(z.x + (z.w - w) / 2), y: Math.round(z.alinear === 'arriba' ? z.y : z.y + (z.h - h) / 2), w: w, h: h };
  }

  // foto: Image; tinte: '#hex' | null; capas: [{ img, zona }]
  function componer(foto, tinte, capas) {
    var W = foto.naturalWidth || foto.width, H = foto.naturalHeight || foto.height;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    ctx.drawImage(foto, 0, 0, W, H);
    var base = ctx.getImageData(0, 0, W, H), bd = base.data;
    var orig = new Uint8ClampedArray(bd); // luz original (para pliegues y máscara)
    var fondo = lum(orig[0], orig[1], orig[2]);
    function tela(k) { return clamp((Math.abs(lum(orig[k], orig[k + 1], orig[k + 2]) - fondo) - 12) / 20, 0, 1); }

    // Teñido desde la foto blanca
    if (tinte) {
      var t = hexRGB(tinte);
      for (var k = 0; k < bd.length; k += 4) {
        var m = tela(k); if (!m) continue;
        var L = lum(orig[k], orig[k + 1], orig[k + 2]) / 235;
        for (var c = 0; c < 3; c++) bd[k + c] = orig[k + c] * (1 - m) + clamp(t[c] * L, 0, 255) * m;
      }
    }
    var luzTela = function (k) { return lum(orig[k], orig[k + 1], orig[k + 2]); };
    var oscura = tinte ? esOscuroHex(tinte) : null;

    (capas || []).forEach(function (capa) {
      if (!capa || !capa.img) return;
      var r = capa.rect || encajar(capa.img, capa.zona);
      if (r.w < 1 || r.h < 1) return;
      var tv = document.createElement('canvas'); tv.width = r.w; tv.height = r.h;
      var tctx = tv.getContext('2d'); tctx.imageSmoothingQuality = 'high';
      tctx.drawImage(capa.img, 0, 0, r.w, r.h);
      var dd = tctx.getImageData(0, 0, r.w, r.h).data;

      // Luz de referencia = mediana de la tela bajo el diseño
      var muestras = [];
      for (var y = 0; y < r.h; y += 3) for (var x = 0; x < r.w; x += 3) {
        var X = r.x + x, Y = r.y + y; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        var i = (Y * W + X) * 4; if (tela(i) > 0.5) muestras.push(luzTela(i));
      }
      muestras.sort(function (a, b) { return a - b; });
      var ref = Math.max(12, muestras.length ? muestras[Math.floor(muestras.length / 2)] : 128);
      var osc = oscura !== null ? oscura : ref < 90;
      var fuerza = osc ? 0.55 : 0.9, lo = osc ? 0.72 : 0.55, hi = osc ? 1.35 : 1.12;

      for (var y2 = 0; y2 < r.h; y2++) {
        var Y2 = r.y + y2; if (Y2 < 0 || Y2 >= H) continue;
        for (var x2 = 0; x2 < r.w; x2++) {
          var X2 = r.x + x2; if (X2 < 0 || X2 >= W) continue;
          var j = (y2 * r.w + x2) * 4, a = dd[j + 3] / 255; if (a <= 0) continue;
          var q = (Y2 * W + X2) * 4;
          a *= tela(q) * 0.97; if (a <= 0) continue;
          var f = clamp(luzTela(q) / ref, lo, hi); f = 1 + (f - 1) * fuerza;
          bd[q] = bd[q] * (1 - a) + clamp(dd[j] * f, 0, 255) * a;
          bd[q + 1] = bd[q + 1] * (1 - a) + clamp(dd[j + 1] * f, 0, 255) * a;
          bd[q + 2] = bd[q + 2] * (1 - a) + clamp(dd[j + 2] * f, 0, 255) * a;
        }
      }
    });
    ctx.putImageData(base, 0, 0);
    return cv;
  }
  function esOscuroHex(h) { var c = hexRGB(h); return lum(c[0], c[1], c[2]) < 110; }

  /* ---------- Versiones del diseño ----------
     version = { nombre, espalda, pecho, manga, colores: [telas recomendadas] (vacío = todas) }
     Cada archivo puede ser una ruta (string) o una Image. Si una versión no trae pecho o manga,
     se usa el de la primera versión que lo tenga. */
  function versionesDe(p) {
    if (!p) return [];
    if (p.versiones && p.versiones.length) return p.versiones;
    var d = p.disenos; if (!d) return [];
    var out = [], todos = Object.keys(HEX);
    if (d.espaldaOscura) out.push({ nombre: 'Detalles claros', espalda: d.espaldaOscura, pecho: d.pecho, manga: d.manga, colores: todos.filter(esOscuro) });
    if (d.espaldaClara) out.push({ nombre: 'Detalles oscuros', espalda: d.espaldaClara, pecho: d.pecho, manga: d.manga, colores: todos.filter(function (c) { return !esOscuro(c); }) });
    if (!out.length && (d.pecho || d.manga)) out.push({ nombre: 'Única', pecho: d.pecho, manga: d.manga, colores: [] });
    if (out.length === 1) out[0].colores = [];
    return out;
  }
  function recomendada(versiones, color) {
    for (var i = 0; i < versiones.length; i++) if (versiones[i].colores && versiones[i].colores.indexOf(color) !== -1) return i;
    for (var k = 0; k < versiones.length; k++) if (!versiones[k].colores || !versiones[k].colores.length) return k;
    return 0;
  }
  function recomendadaPara(versiones, i, color) {
    var v = versiones[i]; return !v || !v.colores || !v.colores.length || v.colores.indexOf(color) !== -1;
  }
  function archivoDe(versiones, i, vista) {
    var campo = DISENO_DE_VISTA[vista], v = versiones[i];
    if (v && v[campo]) return v[campo];
    for (var k = 0; k < versiones.length; k++) if (versiones[k][campo] && campo !== 'espalda') return versiones[k][campo];
    return null;
  }

  // Genera una vista → canvas (o null si no hay diseño para esa vista)
  function generar(prenda, color, vista, versiones, iVersion, ajuste) {
    var src = disenoDe(versiones, iVersion, vista, color);
    var f = fuente(prenda, color, vista);
    if (!src || !f) return Promise.resolve(null);
    if (!(ZONAS[prenda] || {})[vista]) return Promise.resolve(null);
    return Promise.all([cargar(f.foto), typeof src === 'string' ? cargar(src) : Promise.resolve(src)]).then(function (r) {
      return componer(r[0], f.tinte, [{ img: r[1], rect: rectDiseno(prenda, color, vista, r[1], ajuste) }]);
    });
  }
  // Solo la prenda (sin diseño), para el editor de posición
  function base(prenda, color, vista) {
    var f = fuente(prenda, color, vista); if (!f) return Promise.resolve(null);
    return cargar(f.foto).then(function (foto) { return componer(foto, f.tinte, []); });
  }
  // Todas las vistas con diseño, en orden espalda → frente → lado
  function generarTodas(prenda, color, versiones, iVersion, ajuste) {
    return Promise.all(VISTAS.map(function (v) { return generar(prenda, color, v, versiones, iVersion, ajuste).catch(function () { return null; }); }))
      .then(function (cvs) { return cvs.filter(Boolean); });
  }

  return {
    RUTA: RUTA, VISTAS: VISTAS, NOMBRE_VISTA: NOMBRE_VISTA, PRENDAS: PRENDAS, PLANTILLAS: PLANTILLAS, ZONAS: ZONAS, HEX: HEX,
    slug: slug, configurar: configurar, cargar: cargar, fuente: fuente, disponible: disponible, esOscuro: esOscuro,
    zonaAjustada: zonaAjustada, encajar: encajar, componer: componer, generar: generar, generarTodas: generarTodas,
    COLORES_PRENDA: COLORES_PRENDA, versionesDe: versionesDe, recomendada: recomendada, recomendadaPara: recomendadaPara, archivoDe: archivoDe, LOGO: LOGO, logoPara: logoPara, ajusteDe: ajusteDe, disenoDe: disenoDe, rectDiseno: rectDiseno, aRect: aRect, deRect: deRect, posGuardada: posGuardada, origenPos: origenPos, base: base, DISENO_DE_VISTA: DISENO_DE_VISTA
  };
})();
