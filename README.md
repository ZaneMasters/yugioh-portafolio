# 🃏 Yu-Gi-Oh! Portfolio & Inventory App

Plataforma Full Stack diseñada para gestionar y compartir públicamente tu colección personal de cartas de Yu-Gi-Oh! y tu *Wishlist*. Se integra con la API pública de [YGOProdeck](https://db.ygoprodeck.com/api/v7/) para los datos de las cartas y utiliza Firebase (Firestore, Auth, Cloud Run Functions, Hosting) para toda su infraestructura en la nube.

---

## 🚀 Stack Tecnológico

**Frontend (React / Vite)**
- **Vite (v8 + Rolldown)**: Bundler ultra rápido con *Code Splitting* (`manualChunks`).
- **React 19 + React Router**: Navegación SPA con *Lazy Loading* y `Suspense`.
- **TailwindCSS + Framer Motion**: Estilos modernos, diseño *Glassmorphism* y micro-interacciones.
- **Lucide React & React Hot Toast**: Iconos y notificaciones.

**Backend (Node.js / Express)**
- **Firebase Admin SDK**: Autenticación, validación de JWT y acceso a Firestore.
- **Express + Firebase Cloud Functions v2 (Cloud Run)**: API Serverless.
- **Zod**: Validación estricta de schemas.
- **LRU Cache & Caché en Memoria**: Minimiza llamadas externas y consultas a la base de datos para la resolución de perfiles (slugs).

---

## 📁 Estructura del Monorepo

```
/
├── .github/workflows/
│   └── firebase-deploy.yml         # Pipeline CI/CD inteligente (Frontend / Backend)
├── frontend/                       # Aplicación React + Vite
│   ├── src/
│   │   ├── components/             # UI Reutilizable
│   │   ├── context/                # AuthContext (Estado global)
│   │   ├── pages/                  # Vistas (Admin, Público, Login)
│   │   └── routes/                 # AppRouter (Lazy Loading)
│   └── vite.config.js              # Configuración de compilación optimizada
├── src/                            # Backend Node.js
│   ├── controllers/                # Controladores (ej. cardController)
│   ├── services/                   # Lógica de negocio e integración con YGOProdeck
│   ├── repositories/               # Abstracción de base de datos (Firestore)
│   ├── utils/                      # Caching (slugToUid), Logger, ErrorHandler
│   ├── dtos/                       # Schemas de validación (Zod)
│   └── app.js                      # Configuración de Express
├── index.js                        # Entry point (Server local y exportación Functions)
├── firebase.json                   # Reglas de Hosting y redirecciones API
└── package.json                    # Dependencias del backend y scripts globales
```

---

## ⚡ Optimizaciones Clave Implementadas

1. **Lazy Loading en Frontend**: Usamos `React.lazy()` en el enrutador. Un visitante público no descarga el código del panel de administración ni la interfaz gráfica del administrador, ahorrando más del 70% del ancho de banda inicial.
2. **Code Splitting (Chunks Manuales)**: Las librerías pesadas (React, Firebase, Framer) se empaquetan en archivos separados. Si haces un pequeño cambio visual, los visitantes mantienen el código de las librerías cacheadas en sus navegadores.
3. **Smart CI/CD (GitHub Actions)**: El pipeline de despliegue utiliza `dorny/paths-filter`. **Si solo cambias código de React, solo se despliega Firebase Hosting**, evitando despliegues innecesarios del Backend y ahorrando costos.
4. **Caché CDN y Backend**: Las rutas públicas de portafolio usan cabeceras `Cache-Control` agresivas (120 segundos) que actúan directamente en la red de Firebase Hosting (Edge). Además, un caché en memoria en el backend evita consultas redundantes a Firestore al traducir slugs a UIDs.

---

## 🔑 Configuración de Firebase

### 1. Obtener credenciales del Admin SDK
1. Ve a [Firebase Console](https://console.firebase.google.com/) → **Configuración del proyecto** (⚙️)
2. Pestaña **"Cuentas de servicio"**
3. Selecciona **Node.js** → **"Generar nueva clave privada"**
4. Renombra el archivo descargado a `firebase-credentials.json` y colócalo en la raíz del proyecto.

### 2. Habilitar Email/Password en Firebase Auth
1. Ve a **Authentication** → **Sign-in method**
2. Habilita **"Correo electrónico/Contraseña"**

### 3. Crear usuario administrador
1. Ve a **Authentication** → **Users**
2. **"Agregar usuario"** → ingresa tu email y contraseña.

---

## ⚙️ Variables de Entorno

Crea un archivo `.env` en la raíz (basado en `.env.example`):
```env
PORT=3000
NODE_ENV=development
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
FIREBASE_PROJECT_ID=tu-proyecto-id
YGO_API_BASE_URL=https://db.ygoprodeck.com/api/v7
CACHE_TTL_SECONDS=300
CACHE_MAX_SIZE=200
LOG_LEVEL=info
```

Crea un archivo `.env` dentro de la carpeta `frontend/`:
```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto
VITE_FIREBASE_APP_ID=tu_app_id
```

---

## 🚀 Instalación y Ejecución Local

Necesitarás dos terminales corriendo simultáneamente.

1. **Instalar Dependencias**:
```bash
npm install # En la raíz (Backend)
cd frontend && npm install # En la carpeta frontend
```

2. **Arrancar el Servidor Local**:
```bash
npm run dev # En la raíz (Puerto 3000)
cd frontend && npm run dev # En la carpeta frontend (Puerto 5173 proxy)
```

---

## 📡 Endpoints (Backend REST API)

### Inventario — `/api/v1/cards`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/cards` | Listar inventario (filtros: `name`, `type`, `archetype`) | 🔒 Privado |
| `GET` | `/api/v1/cards/:id` | Obtener carta por ID de Firestore | 🌍 Público |
| `POST` | `/api/v1/cards` | Registrar carta (busca en YGOProdeck, evita duplicados) | 🔒 Privado |
| `PUT` | `/api/v1/cards/:id` | Actualizar `quantity` y/o `condition` | 🔒 Privado |
| `DELETE` | `/api/v1/cards/:id` | Eliminar carta del inventario | 🔒 Privado |

### API Externa — `/api/v1/external`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/external/cards?name=xxx` | Buscar cartas en YGOProdeck | 🌍 Público |
| `GET` | `/api/v1/external/cards/:id` | Obtener carta por ID numérico | 🌍 Público |

### Portafolio Público — `/api/v1/portfolio`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/portfolio/:slug/cards` | Obtener las cartas de un coleccionista usando su slug | 🌍 Público |

### Sistema

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Verificar estado del servidor |

---

## 🔐 Autenticación

Las rutas privadas (`POST`, `PUT`, `DELETE`) requieren un Firebase ID Token en el header:

```http
Authorization: Bearer <firebase-id-token>
```

El token se obtiene automáticamente desde el frontend con Firebase Auth SDK.

---

## 📦 Campos de una carta en Firestore

```json
{
  "id": "firestore-document-id",
  "cardId": 46986414,
  "name": "Dark Magician",
  "type": "Normal Monster",
  "race": "Spellcaster",
  "attribute": "DARK",
  "archetype": "Dark Magician",
  "frameType": "normal",
  "level": 7,
  "atk": 2500,
  "def": 2100,
  "image": "https://images.ygoprodeck.com/images/cards/46986414.jpg",
  "condition": "near_mint",
  "quantity": 2,
  "createdAt": "2026-04-13T23:42:52.022Z",
  "updatedAt": "2026-04-13T23:42:52.022Z"
}
```

### Condiciones válidas
- `new` (Nueva)
- `near_mint` (Near Mint)
- `lightly_played` (Lightly Played)
- `moderately_played` (Moderately Played)
- `heavily_played` (Heavily Played)
- `damaged` (Dañada)

---

## 🧪 Testing con Postman

Importa el archivo `yugioh-inventory-api.postman_collection.json` incluido en el proyecto.
La colección incluye variables automáticas que capturan el `cardId` de Firestore entre peticiones para facilitar el flujo completo: `POST → GET → PUT → DELETE`.

---

## 🛡️ Seguridad y Consideraciones

- `firebase-credentials.json` está en `.gitignore` — **nunca lo subas a Git**.
- Los tokens JWT de Firebase expiran cada hora y se renuevan automáticamente.
- La caché LRU reduce llamadas a la API externa y mejora tiempos de respuesta.
- Todos los inputs son validados con Zod antes de llegar al controlador.

---

## 🚀 Despliegue CI/CD (GitHub Actions + Firebase)

El proyecto está configurado para desplegarse automáticamente a Firebase en cada push a la rama `main`.

1. **Configurar Secretos en GitHub**: Ve a Settings → Secrets and variables → Actions y agrega `FIREBASE_SERVICE_ACCOUNT_KEY` (contenido completo de tu JSON). Agrega también los secretos del frontend (`VITE_FIREBASE_API_KEY`, etc.) y `BACKEND_FIREBASE_API_KEY`.
2. Asegúrate de tener el plan **Blaze (pago por uso)** en Firebase (requerido para funciones Node 22+).
3. **Flujo Inteligente**: Gracias al uso de `dorny/paths-filter`, el backend (Cloud Functions) solo se redesplegará si realizas modificaciones dentro de `src/`, el `package.json` raíz o el propio `firebase.json`. Modificaciones exclusivas del `frontend/` desplegarán únicamente el *Hosting*.
