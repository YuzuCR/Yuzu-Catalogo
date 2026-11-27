"""Genera el índice liviano del catálogo a partir de data/products.json (la fuente de verdad).

- data/indice.json      → una entrada corta por pieza visible (lo que necesitan tarjetas, menú, búsqueda y filtros)
- data/series/<x>.json  → el detalle completo de cada serie (la ficha lo pide solo cuando hace falta)
- images/mini/*.webp    → miniatura de la foto de portada de cada pieza (para las tarjetas)

No modifica products.json: el admin y Somnia siguen escribiendo ahí igual que antes.
Lo corre GitHub Actions (.github/workflows/indice.yml) cada vez que cambia products.json.
"""
import json, os, re, sys, unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MINI_ANCHO, MINI_CALIDAD = 480, 72

def slug(s):
    s = unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-') or 'otros'

def fotos_de(p, color):
    m = (p.get('mockups') or {}).get(color)
    if not m: return None
    return [m] if isinstance(m, str) else (list(m) or None)

def foto_base(p):
    pf = p.get('portada') and fotos_de(p, p['portada'])
    if pf: return pf[0], p['portada']
    for c, l in (p.get('mockups') or {}).items():
        l = [l] if isinstance(l, str) else l
        if l: return l[0], c
    im = p.get('imagenes') or []
    return (im[0] if im else ''), None

def miniatura(ruta):
    """images/x/y.jpg → images/mini/y.webp (la crea si falta). Devuelve la ruta o None."""
    if not ruta or ruta.startswith('http'): return None
    origen = os.path.join(RAIZ, ruta)
    if not os.path.isfile(origen): return None
    nombre = os.path.splitext(os.path.basename(ruta))[0] + '.webp'
    destino_rel = 'images/mini/' + nombre
    destino = os.path.join(RAIZ, destino_rel)
    if os.path.isfile(destino) and os.path.getmtime(destino) >= os.path.getmtime(origen):
        return destino_rel
    try:
        from PIL import Image
        im = Image.open(origen)
        im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
        if im.width > MINI_ANCHO:
            im = im.resize((MINI_ANCHO, round(im.height * MINI_ANCHO / im.width)), Image.LANCZOS)
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        im.save(destino, 'WEBP', quality=MINI_CALIDAD, method=6)
        return destino_rel
    except Exception as e:  # una imagen rota no frena el índice
        print('miniatura falló:', ruta, e, file=sys.stderr)
        return None

# Campos que viajan en el índice (lo demás queda en data/series/)
CAMPOS = ['id', 'nombre', 'categoria', 'subcategoria', 'colores', 'precio', 'enDescuento', 'precioDescuento',
          'impresion', 'destacado', 'hasta', 'colecciones', 'prendas', 'vivo']

def main():
    with open(os.path.join(RAIZ, 'data/products.json'), encoding='utf-8') as f:
        productos = json.load(f)
    visibles = [p for p in productos if isinstance(p, dict) and not p.get('oculto')]
    indice, series = [], {}
    for p in visibles:
        sx = slug(p.get('subcategoria') or p.get('categoria') or 'otros')
        series.setdefault(sx, []).append(p)
        e = {k: p[k] for k in CAMPOS if k in p and p[k] not in (None, False, '', [])}
        base, color = foto_base(p)
        mini = miniatura(base)
        if color: e['portada'] = color
        if base: e['mockups'] = {color or '_': [mini or base]}
        if not base and p.get('imagenes'): e['imagenes'] = p['imagenes'][:1]
        e['_ix'] = sx
        indice.append(e)
    destino = os.path.join(RAIZ, 'data/series')
    os.makedirs(destino, exist_ok=True)
    vigentes = set()
    for sx, lista in series.items():
        vigentes.add(sx + '.json')
        with open(os.path.join(destino, sx + '.json'), 'w', encoding='utf-8') as f:
            json.dump(lista, f, ensure_ascii=False, separators=(',', ':'))
    for viejo in os.listdir(destino):  # series que ya no tienen piezas visibles
        if viejo.endswith('.json') and viejo not in vigentes: os.remove(os.path.join(destino, viejo))
    with open(os.path.join(RAIZ, 'data/indice.json'), 'w', encoding='utf-8') as f:
        json.dump({'v': 1, 'origen': len(productos), 'productos': indice}, f, ensure_ascii=False, separators=(',', ':'))
    print(f'{len(indice)} piezas en el índice, {len(series)} series')

if __name__ == '__main__':
    main()
