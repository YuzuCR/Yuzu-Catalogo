"""
yuzu_subir.py · Somnia ↔ catálogo de Yuzu
Somnia usa el mismo admin del catálogo (admin.html) en un navegador invisible, así reutiliza
mockups, varita, numeración por archivo y todo lo demás sin reescribir nada en Python.

Instalar una vez (en el entorno de Somnia-Core):
    pip install playwright python-dotenv
    python -m playwright install chromium

.env de Somnia-Core:
    YUZU_GH_TOKEN=github_pat_...        # el mismo token fino que usás en el admin (solo Yuzu-Catalogo, Contents: read/write)
    YUZU_OWNER=YuzuCR
    YUZU_REPO=Yuzu-Catalogo
    YUZU_ADMIN_URL=https://yuzucr.github.io/Yuzu-Catalogo/admin.html

Uso por consola:
    python yuzu_subir.py subir "C:\\Diseños\\AoT" --categoria Anime --serie Titanes --precio 17500 --colecciones "Manga"
    python yuzu_subir.py publicar 1732040000001 1732040000002
    python yuzu_subir.py listar --serie Titanes --ocultos

Uso desde Somnia (core_orchestrator):
    from yuzu_subir import subir_lote, publicar, listar, resumen_telegram
    r = subir_lote(carpeta, categoria="Anime", serie="Titanes", precio=17500)     # sube OCULTO
    texto, fotos = resumen_telegram(r)   # mandar al dueño; al responder "aprobado" →
    publicar([x["id"] for x in r["items"] if x["estado"] == "ok"])

Regla de permisos (mapa de SOMN.IA): subir oculto = "confirma"; publicar = "aprobación explícita".
"""
import argparse, glob, json, os, sys

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

from playwright.sync_api import sync_playwright

OWNER = os.getenv("YUZU_OWNER", "YuzuCR")
REPO = os.getenv("YUZU_REPO", "Yuzu-Catalogo")
TOKEN = os.getenv("YUZU_GH_TOKEN", "")
ADMIN = os.getenv("YUZU_ADMIN_URL", "https://yuzucr.github.io/Yuzu-Catalogo/admin.html")
EXT = (".png", ".pdf")


class _Admin:
    """Abre el admin con el token ya puesto y espera a que cargue."""

    def __init__(self, visible=False, url=None, rutas=None):
        self.visible, self.url, self.rutas = visible, url or ADMIN, rutas

    def __enter__(self):
        if not TOKEN and not self.rutas:
            raise RuntimeError("Falta YUZU_GH_TOKEN en el .env de Somnia-Core")
        self._pw = sync_playwright().start()
        self.nav = self._pw.chromium.launch(headless=not self.visible)
        self.ctx = self.nav.new_context(viewport={"width": 1400, "height": 900})
        cfg = json.dumps({"yuzu_owner": OWNER, "yuzu_repo": REPO, "yuzu_token": TOKEN or "simulado"})
        self.ctx.add_init_script(f"(function(c){{for(var k in c)localStorage.setItem(k,c[k]);}})({cfg});")
        if self.rutas:
            self.rutas(self.ctx)
        self.pg = self.ctx.new_page()
        self.errores = []
        self.pg.on("pageerror", lambda e: self.errores.append(str(e)))
        self.pg.goto(self.url, wait_until="domcontentloaded")
        self.pg.wait_for_function("window.YuzuAPI && window.YuzuMockup", timeout=60000)
        self.pg.evaluate("YuzuAPI.listo()")
        return self

    def __exit__(self, *a):
        try:
            self.nav.close()
        finally:
            self._pw.stop()


def archivos_de(carpeta, patron=None):
    if os.path.isfile(carpeta):
        return [os.path.abspath(carpeta)]
    l = [os.path.join(carpeta, f) for f in os.listdir(carpeta) if f.lower().endswith(EXT)]
    if patron:
        l = [f for f in l if glob.fnmatch.fnmatch(os.path.basename(f), patron)]
    return sorted(os.path.abspath(f) for f in l)


def subir_lote(carpeta, categoria, serie=None, precio=None, colecciones=None, oculto=True,
               impresion="espalda", num_modo="archivo", prefijo=None, quitar=None, portada=None,
               patron=None, visible=False, _rutas=None, _url=None):
    """Sube todos los PNG/PDF de la carpeta como productos (ocultos por defecto). Devuelve el resultado del admin."""
    files = archivos_de(carpeta, patron)
    if not files:
        return {"subidos": 0, "errores": 0, "items": [], "aviso": "No hay PNG ni PDF en " + carpeta}
    op = {"categoria": categoria, "subcategoria": serie, "oculto": oculto, "impresion": impresion, "numModo": num_modo}
    if precio is not None:
        op["precio"] = int(precio)
    if colecciones:
        op["colecciones"] = colecciones
    if prefijo:
        op["prefijo"] = prefijo
    if quitar:
        op["quitar"] = {"modo": quitar, "tol": 40, "global": False}
    if portada:
        op["portada"] = portada
    with _Admin(visible, _url, _rutas) as a:
        a.pg.evaluate("o => YuzuAPI.prepararLote(o)", op)
        a.pg.set_input_files("#subArchivos", files)
        a.pg.wait_for_function(f"YuzuAPI.tarjetas().length >= {len(files)}", timeout=120000)
        r = a.pg.evaluate("YuzuAPI.subirPreparado()")
        r["archivos"] = len(files)
        if a.errores:
            r["errores_js"] = a.errores
        return r


def publicar(ids, visible=True, _rutas=None, _url=None):
    """Muestra (o oculta con visible=False) los productos con esos ids."""
    with _Admin(False, _url, _rutas) as a:
        return a.pg.evaluate("([ids, v]) => YuzuAPI.publicar(ids, v)", [list(ids), visible])


def listar(categoria=None, serie=None, ocultos=None, buscar=None, _rutas=None, _url=None):
    with _Admin(False, _url, _rutas) as a:
        return a.pg.evaluate("f => YuzuAPI.productos(f)", {"categoria": categoria, "subcategoria": serie, "oculto": ocultos, "buscar": buscar})


def resumen_telegram(r, max_fotos=10):
    """Texto + lista de URLs de portada para mandar por Telegram y pedir aprobación."""
    ok = [x for x in r.get("items", []) if x.get("estado") == "ok"]
    mal = [x for x in r.get("items", []) if x.get("estado") == "err"]
    t = f"Yuzu · subí {len(ok)} diseño(s) OCULTOS"
    if ok:
        t += f": {ok[0]['nombre']}" + (f" … {ok[-1]['nombre']}" if len(ok) > 1 else "")
    if mal:
        t += f"\n⚠ {len(mal)} con error: " + "; ".join(f"{x['archivo']}: {x['msg']}" for x in mal[:5])
    t += "\n¿Los publico? Respondé «aprobado» o decime cuáles no."
    return t, [x["portada"] for x in ok if x.get("portada")][:max_fotos]


def _cli():
    ap = argparse.ArgumentParser(description="Somnia ↔ catálogo Yuzu")
    sp = ap.add_subparsers(dest="cmd", required=True)
    s = sp.add_parser("subir"); s.add_argument("carpeta"); s.add_argument("--categoria", required=True); s.add_argument("--serie")
    s.add_argument("--precio", type=int); s.add_argument("--colecciones"); s.add_argument("--publicar", action="store_true")
    s.add_argument("--pecho", action="store_true"); s.add_argument("--numerar", choices=["archivo", "serie"], default="archivo")
    s.add_argument("--prefijo"); s.add_argument("--quitar", choices=["negro", "blanco", "esquina"]); s.add_argument("--portada")
    s.add_argument("--patron"); s.add_argument("--ver", action="store_true", help="mostrar el navegador")
    p = sp.add_parser("publicar"); p.add_argument("ids", nargs="+"); p.add_argument("--ocultar", action="store_true")
    l = sp.add_parser("listar"); l.add_argument("--categoria"); l.add_argument("--serie"); l.add_argument("--ocultos", action="store_true"); l.add_argument("--buscar")
    a = ap.parse_args()
    if a.cmd == "subir":
        r = subir_lote(a.carpeta, a.categoria, a.serie, a.precio, a.colecciones, oculto=not a.publicar, impresion="pecho" if a.pecho else "espalda",
                       num_modo=a.numerar, prefijo=a.prefijo, quitar=a.quitar, portada=a.portada, patron=a.patron, visible=a.ver)
    elif a.cmd == "publicar":
        r = publicar([int(x) for x in a.ids], visible=not a.ocultar)
    else:
        r = listar(a.categoria, a.serie, True if a.ocultos else None, a.buscar)
    print(json.dumps(r, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    _cli()
