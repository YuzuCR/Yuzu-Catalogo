/* motion.js · capa de movimiento de la tienda (solo index.html; el estudio/portfolio no la usa)
   - Revelado al hacer scroll (en cascada), barra de progreso, paralaje del hero
   - Tarjetas con inclinación 3D y brillo que sigue al puntero; botones magnéticos; cursor propio en escritorio
   - Transición entre vistas (la foto de la tarjeta "crece" hasta la ficha) con View Transitions
   - Vuelo a la bolsa al agregar
   - Escaparate 3D (camiseta que gira, frente/espalda reales) en la banda de personalizado
   - Visor 360° arrastrable en la ficha del producto
   Todo se apaga con "reducir movimiento" del sistema o con ahorro de datos. */
var YuzuMotion = (function () {
  var reducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ahorro = navigator.connection && navigator.connection.saveData;
  var finoPuntero = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var activo = !reducido && !ahorro;
  var html = document.documentElement;

  var css = `
  .mv .mv-r { opacity: 0; transform: translate3d(0, 34px, 0); transition: opacity .9s cubic-bezier(.2,.7,.2,1), transform .9s cubic-bezier(.2,.7,.2,1); transition-delay: var(--mvd, 0ms); }
  .mv .mv-r.mv-in { opacity: 1; transform: none; }
  .mv .card.mv-r { animation: none; }
  .mv .sec-cab h2.mv-in, .mv .banda-pers h2.mv-in { animation: mvTitulo 1.1s cubic-bezier(.7,0,.2,1) both var(--mvd, 0ms); }
  .mv-barra { position: fixed; left: 0; top: 0; height: 2px; width: 100%; background: #c3c24d; transform-origin: 0 50%; transform: scaleX(0); z-index: 9999; pointer-events: none; }
  .mv .hero img { will-change: transform; transform: translate3d(0, var(--hy, 0px), 0) scale(var(--hs, 1.06)); transition: transform .1s linear; }
  .mv .hero-txt { transform: translate3d(0, var(--ty, 0px), 0); opacity: var(--to, 1); }
  .mv .hero h1 { animation: mvTitulo 1.3s cubic-bezier(.7,0,.2,1) both .15s; }
  .mv .hero-txt .dato, .mv .hero-botones { animation: mvSube .9s cubic-bezier(.2,.7,.2,1) both .7s; }
  @keyframes mvTitulo { from { clip-path: inset(0 0 100% 0); transform: translateY(40px); letter-spacing: .06em; } to { clip-path: inset(0 0 -10% 0); transform: none; } }
  @keyframes mvSube { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
  .mv-tilt .card-media { transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(0); transition: transform .5s cubic-bezier(.2,.7,.2,1); transform-style: preserve-3d; }
  .mv-tilt .card:hover .card-media { transition: transform .12s linear; }
  .mv-tilt .card-media::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,.28), transparent 45%); opacity: 0; transition: opacity .3s; mix-blend-mode: soft-light; z-index: 2; }
  .mv-tilt .card:hover .card-media::after { opacity: 1; }
  .mv-tilt .card:hover .card-media { box-shadow: 0 30px 50px -30px rgba(0,0,0,.55); }
  .mv-mag { transition: transform .35s cubic-bezier(.2,.7,.2,1); }
  .mv-cursor { position: fixed; left: 0; top: 0; width: 34px; height: 34px; margin: -17px 0 0 -17px; border: 1px solid #c3c24d; border-radius: 50%; pointer-events: none; z-index: 99999; transition: width .3s cubic-bezier(.2,.7,.2,1), height .3s, margin .3s, background .3s, opacity .3s; display: flex; align-items: center; justify-content: center; font: 600 10px/1 'Space Mono', monospace; letter-spacing: .14em; text-transform: uppercase; color: #111; mix-blend-mode: normal; opacity: 0; }
  .mv-cursor.on { opacity: 1; }
  .mv-cursor.grande { width: 84px; height: 84px; margin: -42px 0 0 -42px; background: #c3c24d; border-color: #c3c24d; }
  .mv-cursor.chico { width: 8px; height: 8px; margin: -4px 0 0 -4px; background: #c3c24d; }
  .mv-vuela { position: fixed; z-index: 99998; pointer-events: none; object-fit: cover; border-radius: 4px; box-shadow: 0 20px 40px rgba(0,0,0,.35); transition: transform .85s cubic-bezier(.6,-0.2,.3,1), opacity .85s; }
  .mv-rebote { animation: mvRebote .6s cubic-bezier(.3,1.6,.4,1); }
  @keyframes mvRebote { 0% { transform: scale(1) } 35% { transform: scale(1.35) } 100% { transform: scale(1) } }
  ::view-transition-old(root), ::view-transition-new(root) { animation-duration: .45s; animation-timing-function: cubic-bezier(.2,.7,.2,1); }
  ::view-transition-old(root) { animation-name: mvVtSale; } ::view-transition-new(root) { animation-name: mvVtEntra; }
  @keyframes mvVtSale { to { opacity: 0; transform: translateY(-14px); } }
  @keyframes mvVtEntra { from { opacity: 0; transform: translateY(18px); } }
  ::view-transition-group(pieza) { animation-duration: .55s; animation-timing-function: cubic-bezier(.2,.7,.2,1); }
  /* Escaparate 3D */
  .mv-esc { position: relative; height: 520px; perspective: 1300px; cursor: grab; user-select: none; touch-action: pan-y; }
  .mv-esc:active { cursor: grabbing; }
  .mv-esc-obj { position: absolute; left: 50%; top: 46%; width: 340px; height: 453px; margin: -226px 0 0 -170px; transform-style: preserve-3d; animation: mvFlota 5s ease-in-out infinite; }
  .mv-esc-giro { position: absolute; inset: 0; transform-style: preserve-3d; }
  .mv-esc-cara { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; background-size: cover; background-position: center; background-repeat: no-repeat; background-size: contain; filter: drop-shadow(0 30px 30px rgba(0,0,0,.35)); }
  .mv-esc-cara.atras { transform: rotateY(180deg); }
  .mv-esc-brillo { display: none; }
  .mv-esc-piso { position: absolute; left: 50%; bottom: 22px; width: 220px; height: 30px; margin-left: -110px; border-radius: 50%; background: radial-gradient(closest-side, rgba(0,0,0,.45), transparent); animation: mvSombra 5s ease-in-out infinite; }
  .mv-esc-etq { position: absolute; left: 0; right: 0; bottom: 0; text-align: center; font: 10px/1.4 'Space Mono', monospace; letter-spacing: .16em; text-transform: uppercase; opacity: .6; }
  @keyframes mvFlota { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }
  @keyframes mvSombra { 0%,100% { transform: scale(1); opacity: .9 } 50% { transform: scale(.86); opacity: .6 } }
  @media (min-width: 900px) { .banda-pers.mv-con-esc { grid-template-columns: 1.1fr .9fr; align-items: center; } .banda-pers.mv-con-esc .mv-esc { grid-row: 1 / span 6; grid-column: 2; } .banda-pers.mv-con-esc > :not(.mv-esc) { grid-column: 1; } }
  @media (max-width: 899px) { .mv-esc { height: 330px; } .mv-esc-obj { width: 200px; height: 267px; margin: -133px 0 0 -100px; } }
  /* Visor 360 */
  .mv-360-btn { position: absolute; left: 12px; bottom: 12px; z-index: 5; background: rgba(10,10,9,.78); color: #f3efe3; border: 1px solid rgba(255,255,255,.18); border-radius: 30px; padding: 9px 14px; font: 600 10px/1 'Space Mono', monospace; letter-spacing: .14em; text-transform: uppercase; cursor: pointer; backdrop-filter: blur(6px); display: flex; gap: 8px; align-items: center; transition: transform .25s, background .25s; }
  .mv-360-btn:hover { transform: translateY(-2px); background: #c3c24d; color: #111; }
  .mv-360-btn i { font-style: normal; display: inline-block; animation: ecGiro360 3s linear infinite; }
  @keyframes ecGiro360 { to { transform: rotate(360deg) } }
  .mv-360 { position: fixed; inset: 0; z-index: 9000; background: radial-gradient(ellipse at 50% 45%, #2a271f, #0b0a09 70%); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: opacity .3s; touch-action: none; user-select: none; }
  .mv-360.on { opacity: 1; }
  .mv-360-esc { perspective: 1500px; width: min(80vw, 62vh); aspect-ratio: 3/4; position: relative; cursor: grab; }
  .mv-360-esc:active { cursor: grabbing; }
  .mv-360-esc img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; transition: opacity .18s; backface-visibility: hidden; }
  .mv-360-pie { color: #cfc9bc; font: 10px/1.6 'Space Mono', monospace; letter-spacing: .16em; text-transform: uppercase; margin-top: 18px; display: flex; gap: 14px; align-items: center; }
  .mv-360-pie b { color: #c3c24d; font-weight: 700; }
  .mv-360.claro .mv-360-pie { color: #333; } .mv-360.claro .mv-360-x { color: #111; border-color: rgba(0,0,0,.25); } .mv-360.claro .mv-360-pista { background: rgba(0,0,0,.15); }
  .mv-360-x { position: absolute; top: 16px; right: 18px; background: none; border: 1px solid rgba(255,255,255,.25); color: #fff; width: 42px; height: 42px; border-radius: 50%; font-size: 18px; cursor: pointer; }
  .mv-360-pista { width: min(70vw, 340px); height: 2px; background: rgba(255,255,255,.15); position: relative; margin-top: 12px; }
  .mv-360-pista i { position: absolute; top: -4px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: #c3c24d; }
  `;
  function inyectarCSS() { var s = document.createElement('style'); s.id = 'motion-css'; s.textContent = css; document.head.appendChild(s); }

  // ---------- Revelado al hacer scroll ----------
  var SEL = '.sec-cab, .sec-cab h2, .banda-pers h2, .banda-pers p, .banda-pers .chips, .drop, .detras, .cita, .resena, .card, .gran-banner, .banner, .ayuda-sec, .plegables, .confianza, .redes-fila';
  var io = null;
  function marcar(raiz) {
    if (!io) return;
    Array.prototype.forEach.call((raiz || document).querySelectorAll(SEL), function (el) {
      if (el.__mv || el.closest('.pers, #bolsa, .cajon, .ye-fondo, .mega, #zoom')) return;
      el.__mv = 1;
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.92 && r.bottom > 0 && document.readyState !== 'loading' && performance.now() > 1500) { el.classList.add('mv-r', 'mv-in'); return; }
      el.classList.add('mv-r'); io.observe(el);
    });
  }
  function iniciarRevelado() {
    io = new IntersectionObserver(function (es) {
      var entran = es.filter(function (e) { return e.isIntersecting; }).sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left; });
      entran.forEach(function (e, i) { e.target.style.setProperty('--mvd', Math.min(i, 8) * 70 + 'ms'); e.target.classList.add('mv-in'); io.unobserve(e.target); setTimeout(function () { e.target.style.removeProperty('--mvd'); }, 1200); });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    marcar(document);
    var t; new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { marcar(document); }, 40); }).observe(document.body, { childList: true, subtree: true });
  }

  // ---------- Scroll: barra de progreso y paralaje del hero ----------
  function iniciarScroll() {
    var barra = document.createElement('div'); barra.className = 'mv-barra'; document.body.appendChild(barra);
    var pend = false;
    function cuadro() {
      pend = false;
      var y = scrollY, max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      barra.style.transform = 'scaleX(' + Math.min(1, y / max) + ')';
      var hero = document.getElementById('hero');
      if (hero && hero.offsetParent && y < hero.offsetHeight * 1.2) {
        var k = y / hero.offsetHeight;
        hero.style.setProperty('--hy', (y * 0.35).toFixed(1) + 'px'); hero.style.setProperty('--hs', (1.06 + k * 0.08).toFixed(3));
        hero.style.setProperty('--ty', (-y * 0.12).toFixed(1) + 'px'); hero.style.setProperty('--to', Math.max(0, 1 - k * 1.3).toFixed(3));
      }
    }
    addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(cuadro); } }, { passive: true });
    cuadro();
  }

  // ---------- Puntero: tarjetas 3D, botones magnéticos, cursor ----------
  function iniciarPuntero() {
    html.classList.add('mv-tilt');
    document.addEventListener('pointermove', function (e) {
      var m = e.target.closest && e.target.closest('.card-media'); if (!m) return;
      var r = m.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      m.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg'); m.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
      m.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); m.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
    }, { passive: true });
    document.addEventListener('pointerout', function (e) {
      var m = e.target.closest && e.target.closest('.card-media'); if (!m || m.contains(e.relatedTarget)) return;
      m.style.setProperty('--rx', '0deg'); m.style.setProperty('--ry', '0deg');
    });
    // Botones magnéticos
    document.addEventListener('pointermove', function (e) {
      var b = e.target.closest && e.target.closest('.btn, .estudio-card, .chip'); if (!b || b.closest('#pers, #bolsa, .ye-fondo, .cajon')) return;
      var r = b.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      b.classList.add('mv-mag'); b.style.transform = 'translate(' + (dx * 0.12).toFixed(1) + 'px,' + (dy * 0.22).toFixed(1) + 'px)';
    }, { passive: true });
    document.addEventListener('pointerout', function (e) {
      var b = e.target.closest && e.target.closest('.mv-mag'); if (!b || b.contains(e.relatedTarget)) return; b.style.transform = '';
    });
    // Cursor propio
    var cur = document.createElement('div'); cur.className = 'mv-cursor'; document.body.appendChild(cur);
    var cx = -100, cy = -100, tx = -100, ty = -100;
    document.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; tx = e.clientX; ty = e.clientY; cur.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerleave', function () { cur.classList.remove('on'); });
    document.addEventListener('pointerover', function (e) {
      var t = e.target; if (!t.closest) return;
      if (t.closest('.ye-fondo, .vt-fondo, .mv-360, input, textarea, select')) { cur.classList.remove('on'); return; }
      var card = t.closest('.card'), pers = t.closest('[data-abrir-pers], .estudio-card, .mv-esc'), link = t.closest('a, button, label, summary');
      cur.classList.toggle('grande', !!(card || pers)); cur.classList.toggle('chico', !card && !pers && !!link);
      cur.textContent = card ? 'Ver' : pers ? (t.closest('.mv-esc') ? 'Girá' : 'Diseñá') : '';
    });
    (function bucle() { cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22; cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)'; requestAnimationFrame(bucle); })();
  }

  // ---------- Transición entre vistas ----------
  var ultimaImg = null;
  document.addEventListener('click', function (e) { var c = e.target.closest && e.target.closest('a.card'); if (c) ultimaImg = c.querySelector('.card-media img.base'); }, true);
  function transicion(fn) {
    if (!activo || !document.startViewTransition) { fn(); return; }
    var origen = ultimaImg && ultimaImg.isConnected && /#\/p\//.test(location.hash) ? ultimaImg : null; ultimaImg = null;
    if (origen) origen.style.viewTransitionName = 'pieza';
    var vt = document.startViewTransition(function () {
      if (origen) origen.style.viewTransitionName = '';
      fn();
      if (!origen) return;
      return new Promise(function (ok) {
        var t0 = performance.now();
        (function mira() { var d = document.querySelector('#galPista img'); if (d && (d.complete || performance.now() - t0 > 350)) { d.style.viewTransitionName = 'pieza'; ok(); } else if (performance.now() - t0 > 450) ok(); else requestAnimationFrame(mira); })();
      });
    });
    vt.finished.finally(function () { var d = document.querySelector('#galPista img'); if (d) d.style.viewTransitionName = ''; });
  }

  // ---------- Vuelo a la bolsa ----------
  function volarABolsa() {
    var src = document.querySelector('#galPista img') || document.querySelector('.galeria img'), dest = document.getElementById('btnBolsa');
    if (!src || !dest) return;
    var a = src.getBoundingClientRect(), b = dest.getBoundingClientRect(), im = document.createElement('img');
    im.src = src.currentSrc || src.src; im.className = 'mv-vuela';
    var w = Math.min(a.width, 260), h = w * (a.height / a.width);
    im.style.cssText = 'left:' + (a.left + (a.width - w) / 2) + 'px;top:' + (a.top + (a.height - h) / 2) + 'px;width:' + w + 'px;height:' + h + 'px';
    document.body.appendChild(im);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      im.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.08) rotate(-12deg)'; im.style.opacity = '.4';
    }); });
    setTimeout(function () { im.remove(); dest.classList.remove('mv-rebote'); void dest.offsetWidth; dest.classList.add('mv-rebote'); }, 860);
  }
  function envolverAgregar() {
    if (typeof window.agregar !== 'function' || window.agregar.__mv) return;
    var orig = window.agregar;
    window.agregar = function () { var r = orig.apply(this, arguments); if (activo) volarABolsa(); return r; };
    window.agregar.__mv = true;
  }

  // ---------- Escaparate 3D (camiseta girando) ----------
  function escaparate() {
    var banda = document.getElementById('bandaPers'); if (!banda || banda.querySelector('.mv-esc') || typeof PRODUCTOS === 'undefined' || !PRODUCTOS.length) return;
    var cand = PRODUCTOS.filter(function (p) { return !p.oculto && typeof esVivo === 'function' && esVivo(p) && YuzuMockup.disponible('boxy', p.portada || 'Negro'); });
    var dest = cand.filter(function (p) { return p.destacado; }); if (dest.length) cand = dest;
    var p = cand[Math.floor(Math.random() * cand.length)]; if (!p || typeof vivoFoto !== 'function') return;
    var color = p.portada || (p.colores || [])[0] || 'Negro';
    Promise.all([vivoFoto(p, color, 'frente', 700), vivoFoto(p, color, 'espalda', 700)]).then(function (u) { return Promise.all(u.map(sinFondo)); }).then(function (u) {
      var esc = document.createElement('div'); esc.className = 'mv-esc mv-r mv-in'; esc.setAttribute('aria-hidden', 'true');
      esc.innerHTML = '<div class="mv-esc-piso"></div><div class="mv-esc-obj"><div class="mv-esc-giro"><div class="mv-esc-cara" style="background-image:url(' + u[0] + ')"><div class="mv-esc-brillo"></div></div><div class="mv-esc-cara atras" style="background-image:url(' + u[1] + ')"><div class="mv-esc-brillo"></div></div></div></div><div class="mv-esc-etq">' + (p.nombre || '') + ' · arrastrá para girar</div>';
      banda.classList.add('mv-con-esc'); banda.appendChild(esc);
      var giro = esc.querySelector('.mv-esc-giro'), brillos = esc.querySelectorAll('.mv-esc-brillo'), ang = -20, vel = 0.25, arr = null, ultimo = 0, visible = true;
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(esc);
      esc.addEventListener('pointerdown', function (e) { arr = { x: e.clientX, a: ang, t: performance.now() }; esc.setPointerCapture(e.pointerId); vel = 0; });
      esc.addEventListener('pointermove', function (e) { if (!arr) return; var na = arr.a + (e.clientX - arr.x) * 0.6, ahora = performance.now(); vel = (na - ang) / Math.max(1, ahora - ultimo) * 16; ultimo = ahora; ang = na; });
      esc.addEventListener('pointerup', function () { arr = null; if (Math.abs(vel) < 0.2) vel = 0.25 * (vel < 0 ? -1 : 1); });
      esc.addEventListener('click', function () { if (Math.abs(vel) < 0.5 && typeof abrirPers === 'function') abrirPers({ estilo: 'propio' }); });
      (function bucle() {
        if (visible) {
          if (!arr) { ang += vel; vel += ((vel < 0 ? -0.25 : 0.25) - vel) * 0.02; }
          giro.style.transform = 'rotateY(' + ang.toFixed(2) + 'deg)';
          var pos = (((ang % 360) + 360) % 360) / 360; Array.prototype.forEach.call(brillos, function (b) { b.style.backgroundPosition = (pos * 260 - 80) + '% 0'; });
        }
        requestAnimationFrame(bucle);
      })();
    }).catch(function () {});
  }

  // Quita el fondo claro liso de la foto de la prenda (relleno desde los bordes) para que la camiseta flote sola
  function sinFondo(url) {
    return new Promise(function (ok) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () {
        try {
          var W = im.naturalWidth, H = im.naturalHeight, c = document.createElement('canvas'); c.width = W; c.height = H;
          var x = c.getContext('2d'); x.drawImage(im, 0, 0); var img = x.getImageData(0, 0, W, H), d = img.data;
          var f = [d[0], d[1], d[2]], vis = new Uint8Array(W * H), pila = new Int32Array(W * H), top = 0;
          if (f[0] + f[1] + f[2] < 600) { ok(url); return; }
          var dif = function (k) { return Math.max(Math.abs(d[k] - f[0]), Math.abs(d[k + 1] - f[1]), Math.abs(d[k + 2] - f[2])); };
          var push = function (q) { if (!vis[q] && dif(q * 4) < 26) { vis[q] = 1; pila[top++] = q; } };
          for (var i = 0; i < W; i++) { push(i); push((H - 1) * W + i); } for (var j = 0; j < H; j++) { push(j * W); push(j * W + W - 1); }
          while (top) { var q = pila[--top], k = q * 4, dd = dif(k); d[k + 3] = dd < 12 ? 0 : Math.round(255 * (dd - 12) / 14); var xx = q % W; if (xx > 0) push(q - 1); if (xx < W - 1) push(q + 1); if (q >= W) push(q - W); if (q < W * (H - 1)) push(q + W); }
          x.putImageData(img, 0, 0); ok(c.toDataURL('image/png'));
        } catch (e) { ok(url); }
      };
      im.onerror = function () { ok(url); }; im.src = url;
    });
  }
  // ---------- Visor 360° en la ficha ----------
  // Fotos: espalda, frente, lado (las que arma mockup.js). Ángulo 0 = frente, 90 = lado, 180 = espalda, 270 = lado espejado.
  function fotos360() {
    if (typeof PR === 'undefined' || !PR || !PR.p || !PR.p.vivo || !PR.fotos || PR.fotos.length < 2) return null;
    var f = PR.fotos.map(function (x) { return typeof x === 'string' ? x : (x && (x.url || x.src)) || ''; }).filter(Boolean);
    if (f.length < 2) return null;
    // con mockups en vivo el orden es espalda, frente, lado
    return { espalda: f[0], frente: f[1] || f[0], lado: f[2] || null };
  }
  function boton360() {
    var g = document.getElementById('galPrincipal'); if (!g || g.querySelector('.mv-360-btn')) return;
    if (!fotos360()) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'mv-360-btn'; b.innerHTML = '<i>↻</i> Ver en 360°';
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); abrir360(); });
    g.appendChild(b);
  }
  function abrir360() {
    var F = fotos360(); if (!F) return;
    var vistas = [{ a: 0, src: F.frente, n: 'Frente' }, { a: 180, src: F.espalda, n: 'Espalda' }];
    if (F.lado) { vistas.push({ a: 90, src: F.lado, n: 'Lado' }); vistas.push({ a: 270, src: F.lado, n: 'Lado', espejo: true }); }
    vistas.sort(function (x, y) { return x.a - y.a; });
    var ov = document.createElement('div'); ov.className = 'mv-360';
    ov.innerHTML = '<button class="mv-360-x" aria-label="Cerrar">✕</button><div class="mv-360-esc">' + vistas.map(function (v, i) { return '<img src="' + v.src + '" data-i="' + i + '" style="opacity:0' + (v.espejo ? ';transform:scaleX(-1)' : '') + '" alt="">'; }).join('') + '</div>' +
      '<div class="mv-360-pie"><span>Arrastrá para girar</span><b data-n></b></div><div class="mv-360-pista"><i></i></div>';
    document.body.appendChild(ov); requestAnimationFrame(function () { ov.classList.add('on'); });
    // el fondo del visor toma el color de fondo de la foto, así la prenda "flota" sin recuadro
    (function () { var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { try { var c = document.createElement('canvas'); c.width = c.height = 1; var x = c.getContext('2d'); x.drawImage(im, 0, 0, 1, 1, 0, 0, 1, 1); var d = x.getImageData(0, 0, 1, 1).data, col = 'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')', luz = d[0] + d[1] + d[2] > 380; ov.style.background = col; ov.style.color = luz ? '#111' : '#fff'; ov.classList.toggle('claro', luz); } catch (e) {} }; im.src = vistas[0].src; })();
    var esc = ov.querySelector('.mv-360-esc'), imgs = esc.querySelectorAll('img'), nom = ov.querySelector('[data-n]'), punto = ov.querySelector('.mv-360-pista i');
    var ang = 0, vel = activo ? 0.6 : 0, arr = null, vivo = true, sector = (vistas.length === 2 ? 180 : 90);
    function pintar() {
      var a = ((ang % 360) + 360) % 360, mejor = 0, d0 = 999;
      vistas.forEach(function (v, i) { var d = Math.abs(((a - v.a + 540) % 360) - 180); if (d < d0) { d0 = d; mejor = i; } });
      var v = vistas[mejor], rel = ((a - v.a + 540) % 360) - 180, lim = sector / 2, giro = rel / lim * 38;
      Array.prototype.forEach.call(imgs, function (im, i) { im.style.opacity = i === mejor ? String(1 - Math.max(0, Math.abs(rel) / lim - 0.75) * 2.2) : '0'; if (i === mejor) im.style.transform = 'rotateY(' + giro.toFixed(1) + 'deg)' + (v.espejo ? ' scaleX(-1)' : ''); });
      nom.textContent = v.n; punto.style.left = (a / 360 * 100) + '%';
    }
    function cerrar() { vivo = false; ov.classList.remove('on'); setTimeout(function () { ov.remove(); }, 300); document.removeEventListener('keydown', tecla); }
    function tecla(e) { if (e.key === 'Escape') cerrar(); if (e.key === 'ArrowLeft') { ang -= sector; vel = 0; } if (e.key === 'ArrowRight') { ang += sector; vel = 0; } }
    document.addEventListener('keydown', tecla);
    ov.querySelector('.mv-360-x').addEventListener('click', cerrar);
    ov.addEventListener('click', function (e) { if (e.target === ov) cerrar(); });
    esc.addEventListener('pointerdown', function (e) { arr = { x: e.clientX, a: ang }; esc.setPointerCapture(e.pointerId); vel = 0; });
    esc.addEventListener('pointermove', function (e) { if (!arr) return; var n = arr.a - (e.clientX - arr.x) * 0.5; vel = n - ang; ang = n; });
    esc.addEventListener('pointerup', function () { arr = null; });
    (function bucle() { if (!vivo) return; if (!arr) { ang += vel; vel *= 0.985; if (Math.abs(vel) < 0.02) { var obj = Math.round(ang / sector) * sector; ang += (obj - ang) * 0.08; vel = 0; } } pintar(); requestAnimationFrame(bucle); })();
  }

  function iniciar() {
    inyectarCSS();
    new MutationObserver(function () { boton360(); }).observe(document.body, { childList: true, subtree: true });
    if (!activo) { html.classList.add('mv-quieto'); envolverAgregar(); return; }
    html.classList.add('mv');
    iniciarRevelado(); iniciarScroll(); if (finoPuntero) iniciarPuntero(); envolverAgregar();
    // Escaparate y visor 360 cuando haya datos / ficha
    var t = setInterval(function () { if (typeof PRODUCTOS !== 'undefined' && PRODUCTOS.length) { clearInterval(t); setTimeout(escaparate, 400); } }, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  return { transicion: transicion, abrir360: abrir360, activo: activo };
})();
