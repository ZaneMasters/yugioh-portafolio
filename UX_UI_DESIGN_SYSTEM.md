# Yu-Gi-Oh! Portfolio - UX/UI Design System & Architecture

Este documento detalla los lineamientos visuales, la estructura de la aplicación, los componentes y las decisiones de diseño técnico (UX/UI) implementadas en el frontend. Su propósito es servir como mapa de navegación y guía de auditoría para otros modelos de IA o desarrolladores.

---

## 1. Mapa de la Aplicación (Rutas y Páginas)

La aplicación está dividida en tres grandes áreas con un total de **8 páginas funcionales**, gestionadas a través de `React Router` con *Lazy Loading* para optimizar la carga.

### 🌍 Área Pública (Accesible para todos)
1. **Landing Page (`/`):** 
   - Página de inicio introductoria (`HomePage.jsx`). 
   - Explica el propósito del aplicativo e incluye un campo de búsqueda para ingresar a un portafolio específico si se conoce el "slug" (URL del usuario).
2. **Portafolio Público (`/portfolio/:slug`):** 
   - El corazón de la aplicación (`PortfolioPage.jsx`). 
   - Muestra el inventario y la wishlist de un coleccionista específico. Utiliza pestañas (tabs), panel de filtros y la grilla de cartas virtualizada.

### 🔐 Autenticación
3. **Login (`/login`):** 
   - Página de acceso para administradores (`LoginPage.jsx`). Formulario limpio centralizado.
4. **Recuperar Contraseña (`/recover-password`):** 
   - Interfaz para solicitar el correo de reseteo de Firebase (`RecoverPasswordPage.jsx`).

### ⚙️ Panel de Administración (Rutas Protegidas bajo `/admin`)
Envueltas en un `AdminLayout.jsx` que proporciona una barra lateral de navegación (Sidebar).
5. **Buscador (`/admin/search`):** 
   - Conectada a la API de YGOProdeck (`SearchPage.jsx`). 
   - Búsqueda en tiempo real para añadir cartas al inventario o a la wishlist.
6. **Gestor de Inventario (`/admin/inventory`):** 
   - Interfaz densa (`InventoryPage.jsx`) con tablas editables (`EditableRow`). 
   - Permite modificar cantidad, rareza y condición de las cartas, además de gestionar las Colecciones/Carpetas.
7. **Perfil Público (`/admin/profile`):** 
   - Configuración de cuenta (`ProfilePage.jsx`), específicamente para cambiar el `slug` (la URL pública del usuario).
8. **Cambiar Contraseña (`/admin/change-password`):** 
   - Formulario de seguridad interno (`ChangePasswordPage.jsx`).

---

## 2. Ecosistema de Componentes (Carpetas Clave)

Todos los componentes reutilizables viven en `frontend/src/components/`:

- **`/cards/`:**
  - `CardGrid.jsx`: El motor de renderizado virtualizado.
  - `CardItem.jsx`: El bloque individual de cada carta con animaciones responsivas.
  - `CardDetailModal.jsx`: El modal premium con efecto de brillo (glow) que se abre al hacer clic.
- **`/filters/`:**
  - `FiltersPanel.jsx`: Contiene los inputs de búsqueda por nombre, arquetipo y el dropdown selector de colecciones.
- **`/ui/`:** Componentes base genéricos.
  - `Select.jsx`: Dropdown personalizado que usa React Portals para escapar del DOM.
  - `ConfirmDeleteModal.jsx`: Modal destructivo estándar.
  - `Badge.jsx`: Píldoras de colores para indicar condiciones o rarezas.
- **`/layout/`:**
  - `Navbar.jsx`: Barra de navegación superior (Sticky y Glassmorphism).
  - `Sidebar.jsx`: Navegación vertical para el panel de administración.

---

## 3. Identidad Visual y Estética (Vibe)

- **Estilo:** *Premium Dark Mode* con *Glassmorphism*.
- **Concepto:** Una mezcla entre un exhibidor de cartas físicas de alta gama y una interfaz digital mística.
- **Fondo General:** Usa una imagen de fondo fija (`background.jpg`) oscurecida con un pseudo-elemento (`rgba(13, 15, 26, 0.82)`) y un gradiente radial sutil en tonos dorados.

---

## 4. Paleta de Colores

### Colores Base
- **Superficies:** Fondos ultra oscuros (`#0d0f1a`, `#111827`, `#1a2235`).
- **Texto:** Principal en `slate-100` (`#f1f5f9`), secundario en `slate-400`/`slate-500` para reducir fatiga visual.
- **Bordes:** Muy tenues usando blanco con baja opacidad (`border-white/5` a `border-white/10`).

### Colores de Acento
- **Acento Primario (Premium):** Tonos Dorados/Ámbar (`#f59e0b`, `amber-400`). Usados para CTAs y títulos épicos (`.text-gradient`).
- **Acento Secundario (Admin):** Tonos Púrpura (`#8b5cf6`, `purple-500`). Diferencia visualmente las rutas de administración de las rutas públicas.

### Sistema de Colores Dinámicos (Según Tipo de Carta)
Los marcos de las cartas y modales aplican brillos según el *Frame Type*:
- **Normal:** Amarillo (`#ca8a04`)
- **Effect:** Naranja (`#ea580c`)
- **Ritual:** Azul (`#3b82f6`)
- **Fusion:** Púrpura (`#a855f7`)
- **Synchro:** Plata/Slate (`#94a3b8`)
- **XYZ:** Gris/Negro (`#6b7280`)
- **Link:** Azul Cielo (`#0ea5e9`)
- **Spell:** Verde Teal (`#10b981`)
- **Trap:** Rosa/Rojo (`#f43f5e`)

---

## 5. Tipografía (Web Fonts)

Jerarquía de 4 tipografías para emular la estética de un TCG de rol:
1. **Display (`Cinzel Decorative`):** Épica. Se usa exclusivamente para los `<h1>` principales.
2. **Heading (`Cinzel`):** Variante más legible para títulos de secciones, modales y etiquetas en el Sidebar.
3. **Sans / Body (`Rajdhani`, Inter):** Tipografía angular (peso 500). Usada para la lectura general, botones y descripciones.
4. **Mono (`Share Tech Mono`):** Fuente monoespaciada para estadísticas duras (ATK/DEF, Niveles, Cantidades).

---

## 6. Jerarquía de Capas (Z-Index)

Para evitar la superposición de elementos, el sistema de capas está estrictamente definido:
- `z-[0]`: Overlay oscuro del fondo general.
- `z-[1]`: Contenido principal (body).
- `z-[20]`: Panel de filtros (`FiltersPanel`). Se desliza por debajo del Navbar al hacer scroll.
- `z-[30]`: `Navbar` superior con posicionamiento `sticky`.
- `z-[50]`: Backdrops y contenedores de Modales (`CardDetailModal`).
- `z-[9999]`: Elementos generados por Portals (Menús desplegables del `Select`, notificaciones).

---

## 7. Animaciones, Micro-interacciones y UX Técnico

Implementadas con `framer-motion` y virtualización nativa:
- **Hover en Cartas:** Elevación en el eje Y (`y: -4px`), resplandor sutil (`box-shadow` dinámico) y zoom suave en la ilustración (`scale: 1.05`).
- **Tap (Clic):** Botones e inputs se reducen ligerísimamente (`scale: 0.95`) para dar feedback táctil.
- **Entradas (Mounting):** Fade in y slide up (`opacity: 0, y: 16` a `opacity: 1, y: 0`).
- **Virtualización de Listas (`@tanstack/react-virtual`):** La grilla de cartas soporta scroll infinito con miles de elementos reciclando Nodos DOM para no saturar la GPU.
- **Opt-out de Animaciones:** Las animaciones pesadas de entrada en las cartas se desactivan automáticamente al hacer scroll rápido.
- **Control de Scroll (`scrollLock`):** Al abrir un modal, se bloquea el scroll del `<body>` mediante un contador utilitario robusto.
