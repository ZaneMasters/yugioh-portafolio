# 🃏 Yu-Gi-Oh! Inventory — Frontend

Aplicación React para gestionar y visualizar un inventario personal de cartas Yu-Gi-Oh!. Incluye una galería pública y un panel de administración privado.

---

## 🚀 Stack tecnológico

| Tecnología | Uso |
|---|---|
| **React 18 + Vite** | Framework y bundler |
| **Tailwind CSS v4** | Estilos utilitarios |
| **React Router DOM v6** | Navegación y rutas anidadas |
| **Zustand** | Estado global del inventario |
| **Firebase SDK** | Autenticación Email/Password |
| **Axios** | Comunicación con el backend |
| **Framer Motion** | Animaciones y transiciones |
| **React Hot Toast** | Notificaciones |
| **Lucide React** | Íconos |

---

## 📁 Estructura del proyecto

```
frontend/
├── index.html
├── vite.config.js              # Proxy /api → backend :3000
├── .env                        # Variables de entorno
├── .env.example                # Plantilla
└── src/
    ├── main.jsx                # Entry point con Toaster
    ├── App.jsx                 # Renderiza AppRouter
    ├── index.css               # Design system (tokens, glass, glow)
    ├── config/
    │   └── firebase.js         # Inicialización Firebase Client SDK
    ├── context/
    │   └── AuthContext.jsx     # Estado de autenticación global
    ├── routes/
    │   └── AppRouter.jsx       # Definición de rutas públicas y privadas
    ├── store/
    │   └── useInventoryStore.js # Zustand store del inventario
    ├── services/
    │   ├── api.js              # Instancia Axios con token automático
    │   ├── cardService.js      # CRUD del inventario
    │   └── externalService.js  # Búsqueda en API externa
    ├── hooks/
    │   ├── useCards.js         # Hook CRUD con feedback y Zustand
    │   ├── useSearchCards.js   # Hook de búsqueda externa
    │   └── useDebounce.js      # Delay en inputs de búsqueda
    ├── components/
    │   ├── ui/
    │   │   ├── Button.jsx          # 5 variantes, 4 tamaños, loading
    │   │   ├── Input.jsx           # Input y SearchInput con icono
    │   │   ├── Select.jsx          # Select estilizado
    │   │   ├── Badge.jsx           # Pill de condición coloreada
    │   │   ├── Skeleton.jsx        # Loaders animados
    │   │   └── EmptyState.jsx      # Estado vacío con CTA
    │   ├── layout/
    │   │   ├── Navbar.jsx          # Top bar galería pública
    │   │   ├── Sidebar.jsx         # Sidebar admin con logout
    │   │   └── ProtectedRoute.jsx  # Guard de rutas privadas
    │   ├── cards/
    │   │   ├── CardItem.jsx        # Card de galería con stats
    │   │   ├── CardGrid.jsx        # Grid responsive con skeleton
    │   │   └── CardSearchResult.jsx # Resultado de búsqueda + botón agregar
    │   ├── inventory/
    │   │   ├── InventoryTable.jsx  # Tabla editable
    │   │   └── EditableRow.jsx     # Fila con edición inline
    │   └── filters/
    │       └── FiltersPanel.jsx    # Filtros name/type/archetype
    ├── pages/
    │   ├── auth/
    │   │   └── LoginPage.jsx       # Formulario email + contraseña
    │   ├── public/
    │   │   └── GalleryPage.jsx     # Galería pública con filtros
    │   └── admin/
    │       ├── AdminLayout.jsx     # Layout con sidebar + Outlet
    │       ├── SearchPage.jsx      # Buscador + agregar al inventario
    │       └── InventoryPage.jsx   # Tabla editable del inventario
    └── utils/
        └── constants.js            # Condiciones, tipos, colores
```

---

## ⚙️ Variables de entorno

Crea `.env` en la carpeta `frontend/` basado en `.env.example`:

```env
# URL del backend (el proxy de Vite lo gestiona en desarrollo)
VITE_API_URL=/api/v1

# Firebase Client SDK
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_APP_ID=1:xxx:web:xxx
```

> ⚠️ Las variables `VITE_*` se incluyen en el bundle final. **Nunca pongas secretos aquí** — usa el backend para la lógica sensible.

---

## 🚀 Instalación y ejecución

```bash
# Desde la carpeta frontend/
npm install

# Desarrollo
npm run dev
# → http://localhost:5173

# Build de producción
npm run build
```

> El proxy de Vite redirige `/api/*` → `http://localhost:3000` automáticamente en desarrollo. **El backend debe estar corriendo en el puerto 3000.**

---

## 🔐 Autenticación

Usa **Firebase Email/Password Authentication**:

1. El usuario ingresa email + contraseña en `/login`
2. Firebase verifica las credenciales en su servidor (contraseña hasheada con bcrypt)
3. Firebase devuelve un **JWT firmado** (ID Token, expira en 1 hora)
4. Axios intercepta cada petición e inyecta `Authorization: Bearer <token>`
5. El backend verifica el token con Firebase Admin SDK

### Configurar usuario administrador

1. [Firebase Console](https://console.firebase.google.com/) → **Authentication** → **Sign-in method** → habilitar **"Correo electrónico/Contraseña"**
2. **Authentication** → **Users** → **"Agregar usuario"**
3. Ingresa el email y contraseña que usarás para el panel admin

---

## 🗺️ Rutas de la aplicación

| URL | Vista | Acceso |
|---|---|---|
| `/` | Galería pública de cartas | 🌍 Público |
| `/login` | Formulario de inicio de sesión | 🌍 Público |
| `/admin/search` | Buscador de cartas + agregar al inventario | 🔒 Privado |
| `/admin/inventory` | Tabla editable del inventario | 🔒 Privado |

---

## 🎨 Design System

### Paleta de colores

| Token | Color | Uso |
|---|---|---|
| Dorado | `#f59e0b` | Botones primarios, active states, brand |
| Violeta | `#8b5cf6` | Arquetipos, admin accent |
| Superficie | `#111827` | Fondo de cards y sidebar |
| Base | `#0d0f1a` | Fondo general de la app |

### Utilidades CSS personalizadas

```css
.glass       /* Glassmorphism: blur + borde semitransparente */
.card-glow   /* Sombra dorada al hover en cards */
.text-gradient  /* Gradiente dorado→violeta en texto */
```

### Gradientes por tipo de carta

Cada tipo de carta (Normal, Spell, Trap, Fusion, Synchro, etc.) tiene un gradiente de fondo único definido en `utils/constants.js → FRAME_TYPE_COLORS`.

---

## ✨ Features de UX

| Feature | Implementación |
|---|---|
| **Debounce** | 400-500ms en todos los inputs de búsqueda |
| **Skeleton loaders** | 8 cards en galería, 5 filas en tabla |
| **AnimatePresence** | Entrada/salida animada con Framer Motion |
| **Edición inline** | Cantidad y condición sin modales |
| **Confirm delete** | Confirmación antes de eliminar |
| **Token automático** | Axios interceptor inyecta Bearer en cada request |
| **Sesión persistente** | Firebase mantiene la sesión entre recargas |
| **Responsive** | Sidebar en desktop, tab bar en móvil |

---

## 🧩 Estado global (Zustand)

```js
useInventoryStore → { cards, loading, setCards, setLoading }
```

El hook `useCards` orquesta todas las operaciones CRUD:
- Actualiza el store tras cada mutación
- Muestra toasts de éxito/error
- Maneja los estados de carga individuales

---

## 📋 .gitignore recomendado

```
node_modules/
dist/
.env
*.log
```
