"""
yuzu_datos.py · Somnia ↔ datos de Yuzu (sin navegador: solo APIs)

Qué lee y qué escribe:
  · Ventas, pedidos e interesados  → data/ventas.json del repo privado (el mismo que usa el admin)
  · ManyChat                       → "issues" con etiqueta `lead` en el repo privado (los crea ManyChat; ver admin › Más › ManyChat)
  · Tráfico del catálogo           → Google Analytics 4 (Data API)
  · Meta Ads e Instagram           → Graph API de Meta
  · TikTok                         → TikTok for Business API
Cada fuente es opcional: si falta su clave en el .env, el reporte dice «sin conectar» y sigue.

.env de Somnia-Core (solo lo que vayas conectando):
    YUZU_GH_TOKEN=github_pat_...          # token del admin (Yuzu-Catalogo + repo privado: Contents RW; Issues RW para ManyChat)
    YUZU_OWNER=YuzuCR
    YUZU_REPO=Yuzu-Catalogo
    YUZU_PRIVADO=Yuzu-Privado              # opcional: si no, se lee de data/tienda.json
    GA4_PROPERTY_ID=123456789              # Admin de GA4 › Detalles de la propiedad (número, no el G-...)
    GA4_CREDENCIALES=C:\\ruta\\ga4-somnia.json   # cuenta de servicio con rol Lector en la propiedad
    META_TOKEN=EAAG...                     # token de usuario del sistema (ads_read, instagram_basic, instagram_manage_insights, pages_read_engagement)
    META_AD_ACCOUNT=act_1234567890
    IG_USER_ID=1784...                     # cuenta de Instagram profesional conectada a la página
    TIKTOK_TOKEN=act.xxxx                  # TikTok for Business (Accounts API)
    TIKTOK_BUSINESS_ID=xxxx
    TIKTOK_ADS_TOKEN=... / TIKTOK_ADVERTISER_ID=...   # opcional, si pautás en TikTok

Uso por consola:
    python yuzu_datos.py reporte 7
    python yuzu_datos.py interesado "Juan" --contacto 8888-8888 --canal WhatsApp --que "boxy negra" --valor 19500
    python yuzu_datos.py venta "AoT 115" --talla L --color Negro --precio 17500 --canal Instagram
    python yuzu_datos.py manychat
"""
import argparse, base64, datetime as dt, json, os, re, sys, time, unicodedata
import urllib.request, urllib.parse, urllib.error

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

OWNER = os.getenv("YUZU_OWNER", "YuzuCR")
REPO = os.getenv("YUZU_REPO", "Yuzu-Catalogo")
TOKEN = os.getenv("YUZU_GH_TOKEN", "")
COSTO_UNIDAD = 4500 + 3000 + 500  # tela + DTF + empaque (se usa si ventas.json no trae costos)
ESTADOS_INT = ["nuevo", "conversando", "cotizado", "cerrado", "perdido"]


# ---------------- utilidades ----------------
def _http(url, metodo="GET", cuerpo=None, cab=None, timeout=30):
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
    req = urllib.request.Request(url, data=datos, method=metodo, headers={"User-Agent": "Somnia-Yuzu", **(cab or {})})
    if datos is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            t = r.read().decode("utf-8")
            return json.loads(t) if t else {}
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", "ignore")[:300]
        raise RuntimeError(f"{e.code} en {url.split('?')[0]}: {msg}")


def _gh(ruta, metodo="GET", cuerpo=None, raw=False):
    if not TOKEN:
        raise RuntimeError("Falta YUZU_GH_TOKEN en el .env")
    cab = {"Authorization": f"Bearer {TOKEN}", "Accept": "application/vnd.github.raw" if raw else "application/vnd.github+json"}
    url = "https://api.github.com" + ruta
    if raw:
        req = urllib.request.Request(url, headers={"User-Agent": "Somnia-Yuzu", **cab})
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read().decode("utf-8")
    return _http(url, metodo, cuerpo, cab)


def _norm(s):
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def _plata(n):
    return "₡" + f"{int(n or 0):,}".replace(",", " ")


def _hoy():
    return dt.date.today().isoformat()


_PRIV = None
def repo_privado():
    global _PRIV
    if _PRIV is None:
        _PRIV = os.getenv("YUZU_PRIVADO", "")
        if not _PRIV:
            try:
                t = json.loads(_gh(f"/repos/{OWNER}/{REPO}/contents/data/tienda.json", raw=True))
                _PRIV = (t.get("privado") or {}).get("repo", "")
            except Exception:
                _PRIV = ""
    return _PRIV


# ---------------- ventas.json (mismo archivo que el admin) ----------------
def _ruta_ventas():
    rp = repo_privado()
    return (rp or REPO), "data/ventas.json"


def leer_ventas():
    repo, ruta = _ruta_ventas()
    try:
        meta = _gh(f"/repos/{OWNER}/{repo}/contents/{ruta}")
        sha = meta.get("sha")
        texto = _gh(f"/repos/{OWNER}/{repo}/contents/{ruta}", raw=True)
        return json.loads(texto or "{}"), sha
    except RuntimeError as e:
        if str(e).startswith("404"):
            return {}, None
        raise


def _guardar_ventas(cambiar, mensaje):
    """Lee, aplica `cambiar(datos)` y guarda. Reintenta si el admin guardó justo en medio (409)."""
    repo, ruta = _ruta_ventas()
    for intento in range(4):
        d, sha = leer_ventas()
        for k in ("ventas", "pedidos", "interesados"):
            d.setdefault(k, [])
        res = cambiar(d)
        cuerpo = {"message": f"Somnia: {mensaje}", "content": base64.b64encode(json.dumps(d, ensure_ascii=False, indent=2).encode()).decode()}
        if sha:
            cuerpo["sha"] = sha
        try:
            _gh(f"/repos/{OWNER}/{repo}/contents/{ruta}", "PUT", cuerpo)
            return res
        except RuntimeError as e:
            if not (str(e).startswith("409") or str(e).startswith("422")) or intento == 3:
                raise
            time.sleep(1.5)


def productos():
    return json.loads(_gh(f"/repos/{OWNER}/{REPO}/contents/data/products.json", raw=True))


def _buscar_producto(texto):
    q = _norm(texto)
    if not q:
        return None
    lista = productos()
    exacto = [p for p in lista if _norm(p.get("nombre")) == q]
    if exacto:
        return exacto[0]
    num = re.search(r"\d+", q)
    parcial = [p for p in lista if q in _norm(p.get("nombre")) or (num and num.group() in _norm(p.get("nombre")).split() and _norm(p.get("nombre")).split()[0] in q)]
    return parcial[0] if parcial else None


def anotar_interesado(nombre="", contacto="", canal="WhatsApp", que="", valor=0, seguir=""):
    o = {"id": int(time.time() * 1000), "nombre": nombre, "contacto": contacto, "canal": canal or "WhatsApp", "que": que,
         "valor": int(valor or 0), "estado": "nuevo", "fecha": _hoy(), "origen": "somnia"}
    if seguir:
        o["seguir"] = seguir
    _guardar_ventas(lambda d: d["interesados"].insert(0, o), f"interesado {nombre or contacto}")
    return o


def mover_interesado(quien, estado, nota=""):
    estado = _norm(estado)
    estado = {"compro": "cerrado", "vendido": "cerrado", "cerrada": "cerrado", "perdida": "perdido", "cotizada": "cotizado"}.get(estado, estado)
    if estado not in ESTADOS_INT:
        raise ValueError("Estado: " + ", ".join(ESTADOS_INT))
    q = _norm(quien)

    def cambiar(d):
        for x in d["interesados"]:
            if q and (q in _norm(x.get("nombre")) or q in _norm(x.get("contacto"))):
                x["estado"], x["cambio"] = estado, _hoy()
                if nota:
                    x["nota"] = nota[:200]
                return x
        return None
    x = _guardar_ventas(cambiar, f"{quien} → {estado}")
    if not x:
        raise LookupError(f"No encontré a «{quien}» en Interesados")
    return x


def anotar_venta(producto, talla="L", color="Negro", precio=None, canal="WhatsApp", nota=""):
    p = _buscar_producto(producto)
    d0, _ = leer_ventas()
    c = d0.get("costos") or {}
    costo = (c.get("tela", 4500) + c.get("dtf", 3000) + c.get("empaque", 500)) if c else COSTO_UNIDAD
    if precio is None:
        precio = (p or {}).get("precio") or 0
    v = {"id": int(time.time() * 1000), "productoId": p.get("id") if p else None, "nombre": p.get("nombre") if p else producto,
         "categoria": (p or {}).get("categoria", ""), "talla": talla, "color": color, "precio": int(precio), "costo": costo,
         "canal": canal, "fecha": _hoy(), "nota": (nota + " · anotó Somnia").strip(" ·"), "estado": "pendiente"}
    _guardar_ventas(lambda d: d["ventas"].insert(0, v), f"venta {v['nombre']}")
    return v


def traer_manychat():
    """Pasa los contactos que ManyChat dejó como issues `lead` a Interesados y cierra esos issues."""
    rp = repo_privado()
    if not rp:
        raise RuntimeError("No hay repo privado configurado")
    issues = _gh(f"/repos/{OWNER}/{rp}/issues?labels=lead&state=open&per_page=100")
    if not issues:
        return []
    nuevos = []
    for k, it in enumerate(issues):
        d = {}
        try:
            d = json.loads(it.get("body") or "{}")
        except Exception:
            for ln in str(it.get("body") or "").splitlines():
                m = re.match(r"\s*(nombre|contacto|usuario|canal|que|qué|mensaje)\s*:\s*(.*)$", ln, re.I)
                if m:
                    d[_norm(m.group(1))] = m.group(2).strip()
        nuevos.append({"id": int(time.time() * 1000) + k, "issue": it["number"], "nombre": d.get("nombre") or it.get("title", ""),
                       "contacto": d.get("contacto") or d.get("usuario", ""), "canal": d.get("canal", "ManyChat"),
                       "que": d.get("que") or d.get("mensaje") or "", "valor": 0, "estado": "nuevo",
                       "fecha": str(it.get("created_at", ""))[:10] or _hoy(), "origen": "manychat"})

    def cambiar(d):
        ya = {x.get("issue") for x in d["interesados"]}
        add = [n for n in nuevos if n["issue"] not in ya]
        d["interesados"][:0] = add
        return add
    add = _guardar_ventas(cambiar, f"ManyChat {len(nuevos)}")
    for it in issues:
        try:
            _gh(f"/repos/{OWNER}/{rp}/issues/{it['number']}", "PATCH", {"state": "closed"})
        except Exception:
            pass
    return add


def resumen_ventas(dias=7):
    d, _ = leer_ventas()
    ventas, pedidos, ints = d.get("ventas", []), d.get("pedidos", []), d.get("interesados", [])
    desde = (dt.date.today() - dt.timedelta(days=dias - 1)).isoformat()
    rango = [v for v in ventas if str(v.get("fecha", "")) >= desde and v.get("estado") != "cancelado"]
    ingreso = sum(v.get("precio", 0) for v in rango)
    ganancia = ingreso - sum(v.get("costo", COSTO_UNIDAD) for v in rango)
    top = {}
    for v in rango:
        top[v.get("nombre", "?")] = top.get(v.get("nombre", "?"), 0) + 1
    canales = {}
    for v in rango:
        canales[v.get("canal", "?")] = canales.get(v.get("canal", "?"), 0) + 1
    abiertos = [e for e in pedidos if e.get("cierre") == "abierto"]
    producir = [v for v in ventas if v.get("estado") == "pendiente"]
    activos = [x for x in ints if x.get("estado") not in ("cerrado", "perdido")]
    hoy = _hoy()
    por_seguir = [x for x in activos if not x.get("seguir") or x["seguir"] <= hoy]
    nuevos_int = [x for x in ints if str(x.get("fecha", "")) >= desde]
    cerr = [x for x in ints if x.get("estado") in ("cerrado", "perdido") and str(x.get("cambio") or x.get("fecha", "")) >= desde]
    conv = round(100 * sum(1 for x in cerr if x["estado"] == "cerrado") / len(cerr)) if cerr else None
    return {"dias": dias, "vendidas": len(rango), "ingreso": ingreso, "ganancia": ganancia,
            "top": sorted(top.items(), key=lambda x: -x[1])[:5], "canales": canales,
            "pedidos_abiertos": [e.get("pedido") for e in abiertos], "por_producir": len(producir),
            "interesados_activos": len(activos), "por_seguir": [(x.get("nombre") or x.get("contacto"), x.get("canal"), x.get("que", "")) for x in por_seguir][:8],
            "interesados_nuevos": len(nuevos_int), "conversion": conv}


# ---------------- Google Analytics 4 ----------------
def trafico(dias=7):
    pid, cred = os.getenv("GA4_PROPERTY_ID"), os.getenv("GA4_CREDENCIALES")
    if not pid or not cred:
        return None
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric, FilterExpression, Filter
    cli = BetaAnalyticsDataClient.from_service_account_file(cred)
    rango = [DateRange(start_date=f"{dias}daysAgo", end_date="today")]
    prop = f"properties/{pid}"

    def rep(dims, mets, lim=10, filtro=None):
        r = cli.run_report(RunReportRequest(property=prop, date_ranges=rango, dimensions=[Dimension(name=x) for x in dims],
                                            metrics=[Metric(name=x) for x in mets], limit=lim, dimension_filter=filtro))
        return [([d.value for d in row.dimension_values], [m.value for m in row.metric_values]) for row in r.rows]
    tot = rep([], ["sessions", "totalUsers", "newUsers", "screenPageViews", "averageSessionDuration"], 1)
    fuentes = rep(["sessionSourceMedium"], ["sessions"], 6)
    ev_lista = ["view_item", "add_to_cart", "begin_checkout", "personalizado_abrir", "subir_diseno_pers", "personalizado_enviar", "ver_3d", "estudio_abrir", "sign_up"]
    ev = rep(["eventName"], ["eventCount"], 50, FilterExpression(filter=Filter(field_name="eventName", in_list_filter=Filter.InListFilter(values=ev_lista))))
    items = rep(["pagePath"], ["screenPageViews"], 6)
    t = tot[0][1] if tot else ["0"] * 5
    return {"sesiones": int(t[0]), "usuarios": int(t[1]), "nuevos": int(t[2]), "vistas": int(t[3]), "duracion_s": round(float(t[4])),
            "fuentes": [(d[0], int(m[0])) for d, m in fuentes], "eventos": {d[0]: int(m[0]) for d, m in ev},
            "paginas": [(d[0], int(m[0])) for d, m in items]}


# ---------------- Meta (Ads + Instagram) ----------------
GRAPH = "https://graph.facebook.com/v21.0"


def meta_ads(dias=7):
    tok, cuenta = os.getenv("META_TOKEN"), os.getenv("META_AD_ACCOUNT")
    if not tok or not cuenta:
        return None
    preset = {1: "today", 7: "last_7d", 14: "last_14d", 30: "last_30d"}.get(dias, "last_7d")
    q = urllib.parse.urlencode({"access_token": tok, "date_preset": preset, "level": "campaign", "limit": 20,
                                "fields": "campaign_name,spend,impressions,reach,clicks,ctr,cpc,actions"})
    r = _http(f"{GRAPH}/{cuenta}/insights?{q}").get("data", [])
    camp = []
    for c in r:
        acc = {a["action_type"]: int(float(a["value"])) for a in c.get("actions", [])}
        msj = acc.get("onsite_conversion.messaging_conversation_started_7d", 0)
        camp.append({"nombre": c.get("campaign_name"), "gasto": float(c.get("spend", 0)), "alcance": int(c.get("reach", 0)),
                     "clics": int(c.get("clicks", 0)), "ctr": float(c.get("ctr", 0)), "mensajes": msj,
                     "visitas": acc.get("landing_page_view", 0)})
    gasto = sum(c["gasto"] for c in camp)
    msj = sum(c["mensajes"] for c in camp)
    return {"gasto": gasto, "mensajes": msj, "costo_mensaje": (gasto / msj) if msj else None, "campanas": sorted(camp, key=lambda c: -c["gasto"])}


def instagram(dias=7):
    tok, ig = os.getenv("META_TOKEN"), os.getenv("IG_USER_ID")
    if not tok or not ig:
        return None
    perfil = _http(f"{GRAPH}/{ig}?" + urllib.parse.urlencode({"access_token": tok, "fields": "username,followers_count,media_count"}))
    hasta = int(time.time())
    desde = hasta - dias * 86400
    met = {}
    for m in ("reach", "accounts_engaged", "total_interactions", "profile_links_taps", "views"):
        try:
            r = _http(f"{GRAPH}/{ig}/insights?" + urllib.parse.urlencode({"access_token": tok, "metric": m, "period": "day", "metric_type": "total_value", "since": desde, "until": hasta}))
            for x in r.get("data", []):
                met[m] = (x.get("total_value") or {}).get("value", 0)
        except Exception:
            pass
    medios = _http(f"{GRAPH}/{ig}/media?" + urllib.parse.urlencode({"access_token": tok, "limit": 12, "fields": "caption,media_type,timestamp,like_count,comments_count,permalink"})).get("data", [])
    recientes = [m for m in medios if m.get("timestamp", "")[:10] >= (dt.date.today() - dt.timedelta(days=dias)).isoformat()]
    mejor = max(recientes or medios[:3] or [{}], key=lambda m: m.get("like_count", 0) + 3 * m.get("comments_count", 0))
    return {"usuario": perfil.get("username"), "seguidores": perfil.get("followers_count"), "metricas": met,
            "publicaciones": len(recientes), "mejor": {"texto": (mejor.get("caption") or "")[:60], "likes": mejor.get("like_count", 0),
                                                       "comentarios": mejor.get("comments_count", 0), "link": mejor.get("permalink")} if mejor else None}


# ---------------- TikTok ----------------
def tiktok(dias=7):
    tok, bid = os.getenv("TIKTOK_TOKEN"), os.getenv("TIKTOK_BUSINESS_ID")
    if not tok or not bid:
        return None
    hasta = dt.date.today() - dt.timedelta(days=1)
    desde = hasta - dt.timedelta(days=dias - 1)
    q = urllib.parse.urlencode({"business_id": bid, "start_date": desde.isoformat(), "end_date": hasta.isoformat(),
                                "fields": json.dumps(["followers_count", "profile_views", "video_views", "likes", "comments", "shares"])})
    r = _http(f"https://business-api.tiktok.com/open_api/v1.3/business/get/?{q}", cab={"Access-Token": tok})
    if r.get("code") not in (0, None):
        raise RuntimeError(r.get("message", "TikTok respondió con error"))
    filas = (r.get("data") or {}).get("metrics", [])
    suma = lambda k: sum(int(f.get(k) or 0) for f in filas)
    seg = int(filas[-1].get("followers_count") or 0) if filas else None
    out = {"seguidores": seg, "vistas_videos": suma("video_views"), "visitas_perfil": suma("profile_views"),
           "likes": suma("likes"), "comentarios": suma("comments"), "compartidos": suma("shares")}
    atok, adv = os.getenv("TIKTOK_ADS_TOKEN"), os.getenv("TIKTOK_ADVERTISER_ID")
    if atok and adv:
        q = urllib.parse.urlencode({"advertiser_id": adv, "report_type": "BASIC", "data_level": "AUCTION_ADVERTISER",
                                    "dimensions": json.dumps(["advertiser_id"]), "metrics": json.dumps(["spend", "impressions", "clicks", "ctr"]),
                                    "start_date": desde.isoformat(), "end_date": hasta.isoformat()})
        a = _http(f"https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?{q}", cab={"Access-Token": atok})
        m = ((a.get("data") or {}).get("list") or [{}])[0].get("metrics", {})
        out["ads"] = {"gasto": float(m.get("spend", 0)), "impresiones": int(float(m.get("impressions", 0))), "clics": int(float(m.get("clicks", 0)))}
    return out


# ---------------- Reporte para Somnia ----------------
def _seguro(f, *a):
    try:
        return f(*a), None
    except ImportError as e:
        return None, f"falta instalar una librería ({e.name})"
    except Exception as e:
        return None, str(e)[:120]


def reporte(dias=7, voz=False):
    """Texto corto con todo lo de Yuzu. voz=True lo deja más corto para leerlo en voz alta."""
    L = [f"Yuzu · últimos {dias} días"]
    falta = []
    try:
        nuevos = traer_manychat()
        if nuevos:
            L.append(f"ManyChat: {len(nuevos)} contacto(s) nuevo(s) pasados a Interesados.")
    except Exception:
        pass
    v, err = _seguro(resumen_ventas, dias)
    if v:
        L.append(f"Ventas: {v['vendidas']} prenda(s), {_plata(v['ingreso'])}, ganancia {_plata(v['ganancia'])}.")
        if v["top"] and not voz:
            L.append("  Más vendidas: " + ", ".join(f"{n} ({c})" for n, c in v["top"][:3]))
        if v["pedidos_abiertos"]:
            L.append(f"Pedidos por cerrar: {len(v['pedidos_abiertos'])} ({', '.join(v['pedidos_abiertos'][:4])}).")
        if v["por_producir"]:
            L.append(f"Por producir: {v['por_producir']} pieza(s).")
        L.append(f"Interesados: {v['interesados_nuevos']} nuevos, {v['interesados_activos']} activos"
                 + (f", conversión {v['conversion']}%" if v["conversion"] is not None else "") + ".")
        if v["por_seguir"]:
            L.append("  Escribirles hoy: " + "; ".join(f"{n} ({c}{': ' + q[:30] if q and not voz else ''})" for n, c, q in v["por_seguir"][:5 if not voz else 3]))
    else:
        L.append(f"Ventas: no pude leer ({err}).")
    t, err = _seguro(trafico, dias)
    if t:
        e = t["eventos"]
        L.append(f"Catálogo: {t['sesiones']} visitas, {t['usuarios']} personas ({t['nuevos']} nuevas).")
        emb = [("vieron producto", "view_item"), ("a la bolsa", "add_to_cart"), ("fueron a WhatsApp", "begin_checkout"),
               ("abrieron personalizada", "personalizado_abrir"), ("enviaron personalizada", "personalizado_enviar"), ("vieron en 3D", "ver_3d")]
        L.append("  Embudo: " + ", ".join(f"{e.get(k, 0)} {n}" for n, k in emb if e.get(k)))
        if not voz and t["fuentes"]:
            L.append("  Vienen de: " + ", ".join(f"{s} ({n})" for s, n in t["fuentes"][:4]))
    else:
        if err:
            L.append("Catálogo (GA4): " + err + ".")
        else:
            falta.append("Google Analytics")
    m, err = _seguro(meta_ads, dias)
    if m:
        cpm = f", {_plata(m['costo_mensaje'])} por conversación" if m["costo_mensaje"] else ""
        L.append(f"Meta Ads: gastaste ${m['gasto']:.2f}, {m['mensajes']} conversaciones{cpm}.")
        if not voz and m["campanas"]:
            c = m["campanas"][0]
            L.append(f"  Campaña principal: {c['nombre']} · {c['clics']} clics · CTR {c['ctr']:.2f}%")
    elif err:
        L.append("Meta Ads: " + err + ".")
    else:
        falta.append("Meta Ads")
    ig, err = _seguro(instagram, dias)
    if ig:
        mt = ig["metricas"]
        L.append(f"Instagram @{ig['usuario']}: {ig['seguidores']} seguidores, alcance {mt.get('reach', '?')}, {mt.get('total_interactions', '?')} interacciones, {ig['publicaciones']} publicaciones.")
        if not voz and ig.get("mejor") and ig["mejor"].get("likes"):
            L.append(f"  Mejor post: «{ig['mejor']['texto']}» · {ig['mejor']['likes']} likes")
    elif err:
        L.append("Instagram: " + err + ".")
    else:
        falta.append("Instagram")
    tk, err = _seguro(tiktok, dias)
    if tk:
        L.append(f"TikTok: {tk['seguidores']} seguidores, {tk['vistas_videos']} vistas, {tk['visitas_perfil']} visitas al perfil.")
        if tk.get("ads"):
            L.append(f"  TikTok Ads: ${tk['ads']['gasto']:.2f}, {tk['ads']['clics']} clics.")
    elif err:
        L.append("TikTok: " + err + ".")
    else:
        falta.append("TikTok")
    if falta and not voz:
        L.append("Sin conectar: " + ", ".join(falta) + " (claves en el .env).")
    return "\n".join(L)


def _cli():
    ap = argparse.ArgumentParser(description="Somnia ↔ datos de Yuzu")
    sp = ap.add_subparsers(dest="cmd", required=True)
    r = sp.add_parser("reporte"); r.add_argument("dias", nargs="?", type=int, default=7)
    i = sp.add_parser("interesado"); i.add_argument("nombre"); i.add_argument("--contacto", default=""); i.add_argument("--canal", default="WhatsApp"); i.add_argument("--que", default=""); i.add_argument("--valor", type=int, default=0); i.add_argument("--seguir", default="")
    m = sp.add_parser("mover"); m.add_argument("quien"); m.add_argument("estado"); m.add_argument("--nota", default="")
    v = sp.add_parser("venta"); v.add_argument("producto"); v.add_argument("--talla", default="L"); v.add_argument("--color", default="Negro"); v.add_argument("--precio", type=int); v.add_argument("--canal", default="WhatsApp")
    sp.add_parser("manychat")
    a = ap.parse_args()
    if a.cmd == "reporte":
        print(reporte(a.dias))
    elif a.cmd == "interesado":
        print(json.dumps(anotar_interesado(a.nombre, a.contacto, a.canal, a.que, a.valor, a.seguir), ensure_ascii=False))
    elif a.cmd == "mover":
        print(json.dumps(mover_interesado(a.quien, a.estado, a.nota), ensure_ascii=False))
    elif a.cmd == "venta":
        print(json.dumps(anotar_venta(a.producto, a.talla, a.color, a.precio, a.canal), ensure_ascii=False))
    elif a.cmd == "manychat":
        print(f"{len(traer_manychat())} nuevo(s)")


if __name__ == "__main__":
    if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    _cli()
