# Somnia ↔ Yuzu: qué conectar y cómo

Todo va en el `.env` de Somnia-Core. Cada fuente es opcional: lo que no esté conectado aparece en el reporte como «Sin conectar».

Probá cada paso con:

```
python yuzu_datos.py reporte 7
```

## 1. Ventas, pedidos e interesados (lo primero)

```
YUZU_GH_TOKEN=github_pat_...
```

Usá el mismo token del admin. En GitHub, dale acceso a **Yuzu-Catalogo** y al **repo privado**, con permisos *Contents: Read and write* e *Issues: Read and write*.

Con esto Somnia lee y anota en el mismo archivo que el admin. El admin junta lo de los dos al guardar, así ninguno pisa lo que anotó el otro.

## 2. ManyChat (Instagram, Messenger y WhatsApp si lo pasás por ManyChat)

Seguí el admin › Más › ManyChat. Ahí está lo que tenés que pegar en la acción External Request del flujo.

Cada contacto queda guardado como un "issue" (una nota) con la etiqueta `lead` en el repo privado. Somnia y el botón «Traer de ManyChat» los pasan a Interesados.

## 3. Tráfico del catálogo (Google Analytics 4)

1. En console.cloud.google.com, creá un proyecto y activá **Google Analytics Data API**.
2. En IAM › Cuentas de servicio, creá una, entrá a Claves y bajá un JSON.
3. En GA4 › Administrar › Acceso a la propiedad, agregá el correo de esa cuenta de servicio como **Lector**.
4. Corré `pip install google-analytics-data`.
5. Completá el `.env`:

```
GA4_PROPERTY_ID=123456789          (GA4 › Administrar › Detalles de la propiedad; no es el G-ZRDRT4NEQ3)
GA4_CREDENCIALES=C:\ruta\al\archivo.json
```

El reporte trae visitas, de dónde vienen y el embudo: vieron producto → bolsa → WhatsApp, personalizada abierta → enviada, vistas en 3D.

## 4. Meta Ads + Instagram

1. Entrá a business.facebook.com › Configuración › Usuarios del sistema y creá uno (rol Administrador).
2. Asignale tu cuenta publicitaria, la página y la cuenta de Instagram.
3. Generá un token con estos permisos: `ads_read`, `instagram_basic`, `instagram_manage_insights`, `pages_read_engagement`. Ese token no vence.
4. Completá el `.env`:

```
META_TOKEN=EAAG...
META_AD_ACCOUNT=act_1234567890
IG_USER_ID=1784...                 (Graph API Explorer: /me/accounts → página → instagram_business_account)
```

## 5. TikTok

1. Entrá a business-api.tiktok.com y creá una app de desarrollador con el alcance *TikTok Accounts* (y *Ads* si pautás). La aprobación tarda unos días.
2. Autorizá tu cuenta y completá el `.env`:

```
TIKTOK_TOKEN=act.xxxx
TIKTOK_BUSINESS_ID=xxxx
TIKTOK_ADS_TOKEN= / TIKTOK_ADVERTISER_ID=    (opcionales)
```

## WhatsApp Business

La app normal de WhatsApp Business no tiene API, así que hay dos caminos:

- **Pedidos de la tienda:** pegalos en admin › Pedidos › Bandeja, como siempre.
- **Conversaciones:** si conectás WhatsApp a ManyChat, entran solas por el punto 2.

## Qué le podés decir a Somnia

- «¿Cómo va Yuzu esta semana?» · «Reporte de Yuzu de 30 días».
- «Anotá a Juan, 8888-8888, por WhatsApp, quiere una boxy negra personalizada».
- «Juan ya compró» · «María se perdió, dijo que muy caro».
- «Vendí la AoT 115, talla L, negra, por Instagram».
- «Traé lo de ManyChat».
- «Subí la carpeta AoT a Anime, serie Titanes, 17500» → ella responde → «Aprobado».

Permisos: leer y reportar es automático. Anotar lo hace y te avisa. Publicar diseños siempre espera tu «aprobado».
