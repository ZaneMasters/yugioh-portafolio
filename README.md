# 🃏 Yu-Gi-Oh! Portfolio & Inventory App

Plataforma Full Stack diseñada para gestionar y compartir públicamente tu colección personal de cartas de Yu-Gi-Oh!, tu *Wishlist* y tus *Colecciones*. Se integra con la API pública de [YGOProdeck](https://db.ygoprodeck.com/api/v7/) para los datos de las cartas y utiliza Firebase (Firestore, Auth, Cloud Run Functions, Hosting) para toda su infraestructura en la nube.

---

## 🚀 Stack Tecnológico

**Frontend (React / Vite)**
- **Vite (v8 + Rolldown)**: Bundler ultra rápido con *Code Splitting* (`manualChunks`).
- **React 19 + React Router v7**: Navegación SPA con *Lazy Loading* y `Suspense`.
- **TailwindCSS + Framer Motion**: Estilos modernos, diseño *Glassmorphism* y micro-interacciones.
- **TanStack Query (React Query)**: Fetching, caché y sincronización de datos del servidor con `useInfiniteQuery` para paginación cursor-based.
- **React Helmet Async**: SEO dinámico con `<title>` y meta tags Open Graph por página.
- **Lucide React & React Hot Toast**: Iconos y notificaciones.

**Backend (Node.js / Express)**
- **Firebase Admin SDK**: Autenticación, validación de JWT y acceso a Firestore.
- **Express + Firebase Cloud Functions v2 (Cloud Run)**: API Serverless.
- **Zod**: Validación estricta de schemas.
- **LRU Cache & Caché en Memoria**: Minimiza llamadas externas y consultas a la base de datos para la resolución de perfiles (slugs).

---

## ✨ Features Principales

### 🗂️ Inventario de Cartas
- Registro de cartas buscando directamente en la base de datos de YGOProdeck (sin escribir los datos manualmente).
- Evita duplicados en el inventario automáticamente.
- Edición inline de `quantity`, `condition` y `rarity` directamente en la tabla.
- Filtros por nombre, tipo y arquetipo con debounce para no saturar la API.
- Paginación virtual con **IntersectionObserver** (carga 20 cartas adicionales por scroll).

### 📋 Wishlist
- Lista de cartas deseadas independiente del inventario.
- Soporta los mismos filtros (nombre, tipo, arquetipo) que el inventario.
- Visible públicamente en el portafolio del coleccionista bajo la pestaña "Wishlist".

### 📁 Colecciones (Folders)
- Agrupa las cartas del inventario en colecciones personalizadas (ej: "Mazo Dragones", "Para vender").
- CRUD completo: crear, renombrar y eliminar colecciones.
- Las colecciones son públicas y visibles en el portafolio bajo el filtro de carpeta.
- Al hacer clic en una colección se filtra automáticamente el inventario.

### 👤 Perfil y URL Pública
- Cada usuario configura un **slug único** (ej: `angel`) que define su URL pública: `/portfolio/angel`.
- El slug soporta solo letras minúsculas, números y guiones.
- Cambio de contraseña desde el panel de configuración.
- Recuperación de contraseña vía email.

### 🌐 Portafolio Público
- Vista pública en `/portfolio/:slug` con SEO completo (Open Graph, Twitter Card).
- Muestra el contador total de cartas (`X cartas en la colección`).
- Tabs para alternar entre **Colección** y **Wishlist**.
- Filtros por nombre, tipo, arquetipo y colección.
- **Paginación infinita** cursor-based con scroll (`IntersectionObserver` + `useInfiniteQuery`).
- Página de error amigable si el slug no existe.

### 🔍 Buscador de Cartas (Admin)
- Búsqueda en tiempo real contra la API de YGOProdeck.
- Vista previa de la carta antes de agregarla al inventario o la wishlist.
- Muestra ATK, DEF, Nivel, Tipo, Atributo, Arquetipo y descripción.

### 🃏 Modal de Detalle de Carta
- Modal premium con glow dinámico según el tipo de carta (Normal, Effect, Fusion, etc.).
- Muestra imagen, stats, rareza/condición y descripción completa.
- Diseño completamente responsivo: columnas en desktop, apilado en mobile.
- Animaciones con Framer Motion.

---

## 📁 Estructura del Monorepo

```
/
├── .github/workflows/
│   └── firebase-deploy.yml         # Pipeline CI/CD inteligente (Frontend / Backend)
├── frontend/                       # Aplicación React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── cards/              # CardGrid, CardItem, CardDetailModal, CardSearchResult
│   │   │   ├── filters/            # FiltersPanel (nombre, tipo, arquetipo, carpeta)
│   │   │   ├── folders/            # FoldersPanel (CRUD de colecciones)
│   │   │   ├── inventory/          # InventoryTable + EditableRow (edición inline)
│   │   │   ├── layout/             # Navbar, AdminLayout
│   │   │   └── ui/                 # Badge, Button, Input, Select, Skeleton, etc.
│   │   ├── context/                # AuthContext (estado global de autenticación)
│   │   ├── hooks/                  # useCards, useWishlist, useFolders, usePortfolio, usePublicFolders, useSearchCards, useDebounce
│   │   ├── lib/                    # queryKeys (TanStack Query)
│   │   ├── pages/
│   │   │   ├── admin/              # InventoryPage, SearchPage, ProfilePage, ChangePasswordPage
│   │   │   ├── auth/               # LoginPage
│   │   │   └── public/             # PortfolioPage, GalleryPage
│   │   ├── routes/                 # AppRouter (Lazy Loading + ProtectedRoute)
│   │   ├── services/               # authService, cardService, wishlistService, folderService
│   │   └── utils/                  # constants (tipos, condiciones, rarezas, colores)
│   └── vite.config.js              # Code Splitting optimizado
├── src/                            # Backend Node.js
│   ├── controllers/                # cardController, wishlistController, folderController, authController
│   ├── services/                   # Lógica de negocio e integración con YGOProdeck
│   ├── repositories/               # Abstracción de Firestore (cardRepository, wishlistRepository, folderRepository)
│   ├── middlewares/                # authMiddleware, validate (Zod)
│   ├── utils/                      # slugToUidCache (LRU), logger, errorHandler
│   ├── dtos/                       # Schemas de validación Zod (createCard, updateCard)
│   └── app.js                      # Configuración de Express y rutas
├── index.js                        # Entry point (servidor local y exportación Functions)
├── firebase.json                   # Reglas de Hosting y redirecciones API
└── package.json                    # Dependencias del backend y scripts globales
```

---

## ⚡ Optimizaciones Clave Implementadas

1. **Lazy Loading en Frontend**: Usamos `React.lazy()` en el enrutador. Un visitante público no descarga el código del panel de administración, ahorrando más del 70% del ancho de banda inicial.
2. **Code Splitting (Chunks Manuales)**: Las librerías pesadas (React, Firebase, Framer Motion, TanStack Query) se empaquetan en archivos separados y permanecen cacheadas en el navegador entre deploys.
3. **Smart CI/CD (GitHub Actions)**: El pipeline utiliza `dorny/paths-filter`. **Si solo cambias código de React, solo se despliega Firebase Hosting**, evitando redespliegues innecesarios del Backend.
4. **Caché CDN y Backend**: Las rutas públicas de portafolio usan `Cache-Control` agresivas que actúan directamente en la red de Firebase Hosting. Un caché LRU en memoria evita consultas redundantes a Firestore al resolver slugs a UIDs.
5. **Paginación Cursor-Based**: El portafolio público usa `useInfiniteQuery` de TanStack Query con cursores de Firestore, evitando cargar toda la colección de golpe. El scroll activa `IntersectionObserver` para cargar el siguiente bloque de 20 cartas.
6. **TanStack Query**: Toda la capa de fetching del frontend está gestionada por React Query, con invalidación de caché inteligente tras mutaciones (crear, editar, eliminar carta).
7. **Debounce en Filtros**: Los campos de texto usan un hook `useDebounce` de 400ms para evitar requests en cada keystroke.

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
npm install              # En la raíz (Backend)
cd frontend && npm install   # En la carpeta frontend
```

2. **Arrancar el Servidor Local**:
```bash
npm run dev              # En la raíz (Puerto 3000)
cd frontend && npm run dev   # En la carpeta frontend (Puerto 5173 proxy)
```

---

## 📡 Endpoints (Backend REST API)

### Inventario — `/api/v1/cards`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/cards` | Listar inventario (filtros: `name`, `type`, `archetype`, `folderId`) | 🔒 Privado |
| `GET` | `/api/v1/cards/:id` | Obtener carta por ID de Firestore | 🌍 Público |
| `POST` | `/api/v1/cards` | Registrar carta (busca en YGOProdeck, evita duplicados) | 🔒 Privado |
| `PUT` | `/api/v1/cards/:id` | Actualizar `quantity`, `condition` y/o `rarity` | 🔒 Privado |
| `DELETE` | `/api/v1/cards/:id` | Eliminar carta del inventario | 🔒 Privado |

### Wishlist — `/api/v1/wishlist`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/wishlist` | Listar wishlist (filtros: `name`, `type`, `archetype`) | 🔒 Privado |
| `POST` | `/api/v1/wishlist` | Agregar carta a la wishlist | 🔒 Privado |
| `PUT` | `/api/v1/wishlist/:id` | Actualizar carta de la wishlist | 🔒 Privado |
| `DELETE` | `/api/v1/wishlist/:id` | Eliminar carta de la wishlist | 🔒 Privado |
| `GET` | `/api/v1/wishlist/public/:slug` | Ver wishlist pública de un coleccionista | 🌍 Público |

### Colecciones (Folders) — `/api/v1/folders`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/folders` | Listar todas las colecciones del usuario | 🔒 Privado |
| `POST` | `/api/v1/folders` | Crear nueva colección | 🔒 Privado |
| `PUT` | `/api/v1/folders/:id` | Renombrar colección | 🔒 Privado |
| `DELETE` | `/api/v1/folders/:id` | Eliminar colección | 🔒 Privado |
| `GET` | `/api/v1/folders/portfolio/:slug` | Ver colecciones públicas de un coleccionista | 🌍 Público |

### Portafolio Público — `/api/v1/cards`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/cards/portfolio/:slug/cards` | Colección pública de un coleccionista (paginación cursor) | 🌍 Público |

### Autenticación — `/api/v1/auth`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/auth/profile` | Obtener perfil (slug, email) | 🔒 Privado |
| `PUT` | `/api/v1/auth/profile` | Actualizar slug del perfil | 🔒 Privado |
| `POST` | `/api/v1/auth/change-password` | Cambiar contraseña | 🔒 Privado |
| `POST` | `/api/v1/auth/recover-password` | Enviar email de recuperación | 🌍 Público |

### API Externa — `/api/v1/external`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/external/cards?name=xxx` | Buscar cartas en YGOProdeck | 🌍 Público |
| `GET` | `/api/v1/external/cards/:id` | Obtener carta por ID numérico | 🌍 Público |

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

### Inventario (`cards`)
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
  "desc": "The ultimate wizard in terms of attack and defense.",
  "image": "https://images.ygoprodeck.com/images/cards/46986414.jpg",
  "condition": "near_mint",
  "rarity": "Ultra Rare",
  "quantity": 2,
  "folderId": "folder-doc-id-or-null",
  "createdAt": "2026-04-13T23:42:52.022Z",
  "updatedAt": "2026-04-13T23:42:52.022Z"
}
```

### Wishlist (`wishlist`)
```json
{
  "id": "firestore-document-id",
  "cardId": 46986414,
  "name": "Dark Magician",
  "type": "Normal Monster",
  "image": "https://images.ygoprodeck.com/images/cards/46986414.jpg",
  "condition": "near_mint",
  "quantity": 1,
  "createdAt": "2026-05-01T10:00:00.000Z"
}
```

### Colecciones (`folders`)
```json
{
  "id": "firestore-document-id",
  "name": "Mazo Principal",
  "createdAt": "2026-05-10T08:00:00.000Z"
}
```

### Condiciones válidas
- `new` (Nueva)
- `near_mint` (Near Mint)
- `lightly_played` (Lightly Played)
- `moderately_played` (Moderately Played)
- `heavily_played` (Heavily Played)
- `damaged` (Dañada)

### Rarezas válidas
- `Common`, `Rare`, `Super Rare`, `Ultra Rare`, `Secret Rare`
- `Ultimate Rare`, `Ghost Rare`, `Starlight Rare`
- `Quarter Century Secret Rare`, `Gold Rare`

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
- La paginación del portafolio público es cursor-based: nunca se expone el total de documentos al cliente ni se descargan todos los registros de Firestore en una sola query.

---

## 🚀 Despliegue CI/CD (GitHub Actions + Firebase)

El proyecto está configurado para desplegarse automáticamente a Firebase en cada push a la rama `main`.

1. **Configurar Secretos en GitHub**: Ve a Settings → Secrets and variables → Actions y agrega `FIREBASE_SERVICE_ACCOUNT_KEY` (contenido completo de tu JSON). Agrega también los secretos del frontend (`VITE_FIREBASE_API_KEY`, etc.) y `BACKEND_FIREBASE_API_KEY`.
2. Asegúrate de tener el plan **Blaze (pago por uso)** en Firebase (requerido para funciones Node 22+).
3. **Flujo Inteligente**: Gracias al uso de `dorny/paths-filter`, el backend (Cloud Functions) solo se redesplegará si realizas modificaciones dentro de `src/`, el `package.json` raíz o el propio `firebase.json`. Modificaciones exclusivas del `frontend/` desplegarán únicamente el *Hosting*.
