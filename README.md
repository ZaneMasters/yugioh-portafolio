# 🃏 Yu-Gi-Oh! Inventory API

Backend REST para gestionar un inventario personal de cartas Yu-Gi-Oh!, integrado con la API pública de [YGOProdeck](https://db.ygoprodeck.com/api/v7/) y Firebase Firestore como base de datos.

---

## 🚀 Stack tecnológico

| Tecnología | Uso |
|---|---|
| **Node.js + Express** | Servidor HTTP y routing |
| **Firebase Admin SDK** | Autenticación y acceso a Firestore |
| **Firestore** | Base de datos NoSQL en la nube |
| **Axios** | Consumo de la API externa de YGOProdeck |
| **Zod** | Validación de schemas de entrada |
| **Winston + Morgan** | Logging estructurado y HTTP logs |
| **LRU Cache** | Caché en memoria para reducir llamadas externas |
| **Nodemon** | Recarga automática en desarrollo |

---

## 📁 Estructura del proyecto

```
API/
├── index.js                        # Entry point — arranca el servidor
├── firebase-credentials.json       # ⚠️ NO subir a Git
├── .env                            # Variables de entorno
├── .env.example                    # Plantilla de variables
└── src/
    ├── app.js                      # Configuración de Express
    ├── config/
    │   └── firebase.js             # Inicialización Firebase Admin SDK
    ├── controllers/
    │   ├── cardController.js       # Controladores del inventario
    │   └── externalController.js  # Controladores API externa
    ├── services/
    │   ├── cardService.js          # Lógica de negocio del inventario
    │   └── ygoService.js           # Integración con YGOProdeck
    ├── repositories/
    │   └── cardRepository.js       # Acceso a datos Firestore
    ├── routes/
    │   ├── cardRoutes.js           # Rutas /api/v1/cards
    │   └── externalRoutes.js       # Rutas /api/v1/external
    ├── middlewares/
    │   ├── authMiddleware.js       # Verificación Firebase ID Token
    │   ├── validate.js             # Validación con Zod
    │   └── errorHandler.js        # Manejo centralizado de errores
    ├── dtos/
    │   ├── createCardDto.js        # Schema de creación
    │   └── updateCardDto.js        # Schema de actualización
    └── utils/
        ├── cache.js                # LRU Cache en memoria
        ├── logger.js               # Instancia de Winston
        └── AppError.js             # Clase de error operacional
```

---

## ⚙️ Variables de entorno

Crea un archivo `.env` en la raíz basado en `.env.example`:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
FIREBASE_PROJECT_ID=yugioh-8fc03

# API Externa
YGO_API_BASE_URL=https://db.ygoprodeck.com/api/v7

# Caché en memoria
CACHE_TTL_SECONDS=300
CACHE_MAX_SIZE=200

# Logging
LOG_LEVEL=info
```

---

## 🔑 Configuración de Firebase

### 1. Obtener credenciales del Admin SDK

1. Ve a [Firebase Console](https://console.firebase.google.com/) → **Configuración del proyecto** (⚙️)
2. Pestaña **"Cuentas de servicio"**
3. Selecciona **Node.js** → **"Generar nueva clave privada"**
4. Renombra el archivo descargado a `firebase-credentials.json`
5. Colócalo en la raíz del proyecto (`API/`)

### 2. Habilitar Email/Password en Firebase Auth

1. Ve a **Authentication** → **Sign-in method**
2. Habilita **"Correo electrónico/Contraseña"**

### 3. Crear usuario administrador

1. Ve a **Authentication** → **Users**
2. **"Agregar usuario"** → ingresa tu email y contraseña

---

## 🚀 Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Desarrollo (con recarga automática)
npm run dev

# Producción
npm start
```

El servidor arranca en `http://localhost:3000`

---

## 📡 Endpoints

### Inventario — `/api/v1/cards`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/cards` | Listar inventario (filtros: `name`, `type`, `archetype`) | 🌍 Público |
| `GET` | `/api/v1/cards/:id` | Obtener carta por ID de Firestore | 🌍 Público |
| `POST` | `/api/v1/cards` | Registrar carta (busca en YGOProdeck, evita duplicados) | 🔒 Privado |
| `PUT` | `/api/v1/cards/:id` | Actualizar `quantity` y/o `condition` | 🔒 Privado |
| `DELETE` | `/api/v1/cards/:id` | Eliminar carta del inventario | 🔒 Privado |

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

| Valor | Descripción |
|---|---|
| `new` | Nueva |
| `near_mint` | Near Mint |
| `lightly_played` | Lightly Played |
| `moderately_played` | Moderately Played |
| `heavily_played` | Heavily Played |
| `damaged` | Dañada |

---

## 🧪 Testing con Postman

Importa el archivo `yugioh-inventory-api.postman_collection.json` incluido en el proyecto.

La colección incluye variables automáticas que capturan el `cardId` de Firestore entre peticiones para facilitar el flujo completo: `POST → GET → PUT → DELETE`.

---

## 🛡️ Seguridad

- `firebase-credentials.json` está en `.gitignore` — **nunca lo subas a Git**
- Los tokens JWT de Firebase expiran cada hora y se renuevan automáticamente
- La caché LRU reduce llamadas a la API externa y mejora tiempos de respuesta
- Todos los inputs son validados con Zod antes de llegar al controlador

---

## 📋 .gitignore recomendado

```
node_modules/
.env
firebase-credentials.json
dist/
*.log
```

---

## 🚀 Despliegue CI/CD (GitHub Actions + Firebase)

El proyecto está configurado para desplegarse automáticamente a Firebase (Hosting para el frontend, Cloud Functions para el backend) en cada push a la rama `main` mediante GitHub Actions.

### 1. Requisitos Previos en Firebase

1. Asegúrate de que el plan de tu proyecto en Firebase sea **Blaze (pago por uso)**. Es estrictamente necesario para que Cloud Functions pueda hacer peticiones externas (a YGOProdeck). El nivel gratuito de este plan es más que suficiente para no tener cargos reales.
2. Tu archivo `firebase.json` en la raíz está configurado para subir el frontend (`frontend/dist`) y redirigir las peticiones `/api/**` a tu Cloud Function (`api`).

### 2. Configurar Secretos en GitHub

Para que GitHub Actions tenga permisos para subir tu código a Firebase necesita una clave de autenticación. Usaremos el archivo `firebase-credentials.json` que descargaste previamente.

1. Entra a tu repositorio en **GitHub**.
2. Ve a la pestaña **Settings** (Configuración).
3. En la barra lateral izquierda ve a **Secrets and variables** → **Actions**.
4. Haz clic en el botón verde **"New repository secret"**.
5. Llena los datos exactamente así:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Secret:** Abre en tu PC tu archivo `firebase-credentials.json` y copia/pega **ABSOLUTAMENTE TODO** el contenido (abre la llave `{` y cierra con la llave `}`).
6. Clic en **Add secret**.

### 3. Flujo de Trabajo (Deploy)

Asegúrate de ejecutar estos comandos en la raíz correcta de tu proyecto (dentro de la carpeta `API/`):

```bash
# 1. Agrega tus cambios
git add .

# 2. Crea un commit
git commit -m "feat: nueva funcionalidad"

# 3. Empuja los cambios a GitHub (esto detona el despliegue automático)
git push origin main
```

Puedes ir a la pestaña **Actions** en tu repositorio para ver el progreso del pipeline. El archivo orquestador vive en `.github/workflows/firebase-deploy.yml`.

> **Nota para Entornos de Producción:** Cloud Functions usará automáticamente **Application Default Credentials** provistas por el entorno de Google. No subir nunca `firebase-credentials.json` a GitHub.
