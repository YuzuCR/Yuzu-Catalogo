# Archivo: core_yuzu.py
# Puente Somnia → catálogo de Yuzu (usa yuzu_subir.py, que maneja el admin en un navegador invisible).
# Paso 1: "sube los diseños de la carpeta AoT a Anime, serie Titanes, 17500" → sube OCULTOS y avisa.
# Paso 2: "aprobado, publícalos" → los hace visibles. El paso 2 nunca corre solo (aprobación explícita).
# Además (yuzu_datos.py, sin navegador): reporte de ventas/tráfico/redes, anotar interesados y ventas, traer ManyChat.
# Permisos: leer y reportar = automático; anotar interesado/venta = confirma (lo anota y te lo dice); publicar = aprobación.

import os
import threading
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Dónde buscar una carpeta dicha solo por nombre ("AoT")
BASES = [Path(p) for p in os.getenv("YUZU_DISENOS", "").split(os.pathsep) if p] + [
    Path.home() / "OneDrive" / "Desktop" / "Escritorio" / "Mockups",
    Path.home() / "OneDrive" / "Desktop" / "Escritorio",
    Path.home() / "Desktop",
    Path.home() / "Downloads",
]


def _carpeta(texto: str):
    if not texto:
        return None
    p = Path(texto.strip().strip('"'))
    if p.exists():
        return p
    for b in BASES:
        c = b / texto.strip()
        if c.exists():
            return c
        if b.exists():
            for d in b.iterdir():
                if d.is_dir() and d.name.lower() == texto.strip().lower():
                    return d
    return None


class CatalogoAgent:
    def __init__(self, notificar=None):
        try:
            import yuzu_subir  # necesita playwright; sin él solo funcionan los datos
            self.ys = yuzu_subir
        except Exception as e:
            logger.warning(f"Subida de diseños desactivada: {e}")
            self.ys = None
        import yuzu_datos
        self.yd = yuzu_datos
        self.notificar = notificar or (lambda t: logger.info(t))
        self.pendientes: list = []   # ids subidos ocultos, esperando aprobación
        self.ocupado = False

    def execute(self, params: dict) -> str:
        action = params.get("action", "subir")
        if action == "reporte":
            return self._reporte(params)
        if action == "interesado":
            return self._interesado(params)
        if action == "mover":
            return self._mover(params)
        if action == "venta":
            return self._venta(params)
        if action == "manychat":
            try:
                n = self.yd.traer_manychat()
            except Exception as e:
                return f"No pude leer ManyChat: {e}"
            return f"{len(n)} contacto(s) nuevo(s) de ManyChat: " + ", ".join(x['nombre'] or x['contacto'] for x in n[:5]) if n else "No hay contactos nuevos en ManyChat."
        if self.ys is None:
            return "Para subir diseños falta instalar playwright en el entorno de Somnia."
        if action == "publicar":
            return self._publicar()
        if action == "listar":
            return self._listar(params)
        return self._subir(params)

    def _reporte(self, p: dict) -> str:
        try:
            dias = int(p.get("dias") or 7)
        except (TypeError, ValueError):
            dias = 7
        voz = p.get("canal") == "voz"
        # Reunir varias APIs tarda: de fondo, y avisa al terminar
        def fondo():
            try:
                self.notificar(self.yd.reporte(dias, voz=voz))
            except Exception as e:
                self.notificar(f"No pude armar el reporte de Yuzu: {e}")
        threading.Thread(target=fondo, daemon=True).start()
        return f"Armando el reporte de Yuzu de los últimos {dias} días. Te lo paso en un momento."

    def _interesado(self, p: dict) -> str:
        nombre, contacto = (p.get("nombre") or "").strip(), (p.get("contacto") or "").strip()
        if not nombre and not contacto:
            return "¿Cómo se llama o cuál es su contacto?"
        try:
            o = self.yd.anotar_interesado(nombre, contacto, p.get("canal") or "WhatsApp", p.get("que") or p.get("query") or "", p.get("valor") or 0, p.get("seguir") or "")
        except Exception as e:
            return f"No pude anotarlo: {e}"
        return f"Anotado en Interesados: {o['nombre'] or o['contacto']} ({o['canal']})" + (f", quiere {o['que']}" if o['que'] else "") + "."

    def _mover(self, p: dict) -> str:
        try:
            x = self.yd.mover_interesado(p.get("nombre") or p.get("query") or "", p.get("estado") or "", p.get("nota") or "")
        except Exception as e:
            return str(e)
        return f"{x.get('nombre') or x.get('contacto')} quedó como {x['estado']}."

    def _venta(self, p: dict) -> str:
        prod = p.get("producto") or p.get("query")
        if not prod:
            return "¿Qué diseño se vendió?"
        try:
            v = self.yd.anotar_venta(prod, p.get("talla") or "L", p.get("color") or "Negro", p.get("precio"), p.get("canal") or "WhatsApp")
        except Exception as e:
            return f"No pude anotar la venta: {e}"
        return f"Venta anotada: {v['nombre']} talla {v['talla']} {v['color']}, ₡{v['precio']:,} por {v['canal']}. Quedó pendiente de producir.".replace(",", " ")

    def _subir(self, p: dict) -> str:
        if self.ocupado:
            return "Ya estoy subiendo un lote. Te aviso cuando termine."
        carpeta = _carpeta(p.get("carpeta") or p.get("query", ""))
        if not carpeta:
            return "No encuentro esa carpeta. Dime la ruta completa o el nombre exacto."
        categoria = p.get("categoria")
        if not categoria:
            return "¿En qué categoría los subo? (por ejemplo Anime)"
        self.ocupado = True

        def fondo():
            try:
                r = self.ys.subir_lote(str(carpeta), categoria=categoria, serie=p.get("serie"),
                                       precio=p.get("precio"), colecciones=p.get("colecciones"))
                texto, _fotos = self.ys.resumen_telegram(r)
                self.pendientes = [x["id"] for x in r.get("items", []) if x.get("estado") == "ok"]
                self.notificar(texto if self.pendientes else (r.get("aviso") or texto))
            except Exception as e:
                self.notificar(f"No pude subir el lote: {e}")
            finally:
                self.ocupado = False

        threading.Thread(target=fondo, daemon=True).start()
        return f"Subiendo la carpeta {carpeta.name} al catálogo, ocultos. Te aviso cuando termine."

    def _publicar(self) -> str:
        if not self.pendientes:
            return "No hay ningún lote esperando aprobación."
        ids, self.pendientes = self.pendientes, []

        def fondo():
            try:
                r = self.ys.publicar(ids, True)
                self.notificar(f"Publicados {r.get('cambiados', len(ids))} diseño(s) en el catálogo.")
            except Exception as e:
                self.pendientes = ids
                self.notificar(f"No pude publicar: {e}")

        threading.Thread(target=fondo, daemon=True).start()
        return f"Publicando {len(ids)} diseño(s). Te aviso."

    def _listar(self, p: dict) -> str:
        try:
            l = self.ys.listar(categoria=p.get("categoria"), serie=p.get("serie"), ocultos=p.get("ocultos"), buscar=p.get("query") or None)
        except Exception as e:
            return f"No pude leer el catálogo: {e}"
        return f"Hay {len(l)} producto(s)." if l else "No hay productos con ese filtro."
