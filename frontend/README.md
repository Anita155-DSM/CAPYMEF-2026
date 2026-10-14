# CAPYMEF · Frontend

Aplicación web de la **Cámara de Pequeñas y Medianas Empresas de Formosa**: sitio público, área de socios y panel de administración.

**Stack:** React 19 · Vite · Tailwind CSS v4 · React Router 7 · react-hook-form · sonner · dayjs · Leaflet · xlsx (solo `.jsx`, sin TypeScript).

---

## Cómo correrlo

```bash
cd frontend
npm install
npm run dev       # servidor de desarrollo
npm run lint      # revisar el código
npm run build     # compilar para producción
```

Crear `frontend/.env` (no se sube a git):

```
VITE_API_URL=http://localhost:PUERTO/api          # backend (todas las rutas empiezan con /api)
VITE_API_URL_UPLOADS=http://localhost:PUERTO          # base de las imágenes subidas
```

---

## Cómo está organizado

El código se agrupa **por funcionalidad** (`features/`), no por tipo de archivo. Cada feature tiene lo suyo adentro (páginas, componentes, hooks, datos). Lo que usan varias features va a `shared/`.

```
frontend/
├── public/                  Archivos que se sirven tal cual (PDFs de Estatuto y Balances)
├── index.html               HTML base donde React se monta
├── vite.config.js           Configuración de Vite (plugin de React, Tailwind y alias @ → src)
├── jsconfig.json            Para que VS Code entienda el alias @
├── eslint.config.js         Reglas del linter
├── package.json             Dependencias y scripts
└── src/
    ├── main.jsx             Punto de entrada: Router + AuthProvider + App
    ├── App.jsx              Toaster de notificaciones + rutas
    ├── index.css            Tailwind v4, colores (@theme) y animaciones globales
    │
    ├── app/                 Configuración global de la aplicación
    ├── api/                 Cliente HTTP
    ├── services/            Funciones que llaman al backend
    ├── layouts/             Estructura de página (navbar, menú lateral, footer)
    ├── features/            Funcionalidades (landing, noticias, eventos, padron, area-socio)
    ├── shared/              Piezas reutilizables por toda la app
    ├── Pages/               Páginas que todavía no se mudaron a features/
    └── assets/img/          Imágenes y logos
```

### `app/` · configuración global
| Archivo | Qué hace |
|---|---|
| `providers/AuthContext.js` | Crea el contexto de sesión. |
| `providers/AuthProvider.jsx` | Guarda usuario y token, y expone `login`, `logout` y `actualizarUsuario`. Cierra la sesión si el token vence. |
| `router/AppRoutes.jsx` | Define todas las rutas (públicas, de socio y de admin). |
| `router/RequireAuth.jsx` | Protege rutas: exige sesión y, si hace falta, un rol. Si no, redirige a `/login`. |

### `api/` y `services/` · comunicación con el backend
| Archivo | Qué hace |
|---|---|
| `api/client.js` | Único lugar que hace `fetch`. Agrega el token y **siempre devuelve `{ exito, mensaje, data }`** (nunca lanza errores). |
| `services/authServices.js` | Login, registro y recuperación de contraseña. |
| `services/adminServices.js` | Usuarios, altas/bajas y revisión de solicitudes. |
| `services/eventosService.js` | Crear, editar, borrar e inscribirse a eventos. |
| `services/noticiasService.js` | Noticias públicas, de socios y de administración. |

### `layouts/` · estructura de las páginas
| Archivo | Qué hace |
|---|---|
| `MainLayout.jsx` | Menú lateral y contenedor del panel de **admin**. |
| `SocioLayout.jsx` | Menú y contenedor del **área de socios**. |
| `components/Navbar.jsx` | Barra superior para usuarios con sesión. |
| `components/NavbarPublico.jsx` | Barra superior del sitio público. |
| `components/Footer.jsx` | Pie de página. |

### `features/` · funcionalidades

**`landing/`** · página de inicio pública (`/`)
| Archivo | Qué hace |
|---|---|
| `pages/LandingPage.jsx` | Arma el Home con sus seis secciones. |
| `components/HeroSection.jsx` | Portada con carrusel y botón "Quiero asociarme". |
| `components/ComoAsociarseModal.jsx` | Ventana con los pasos para asociarse y el contacto. |
| `components/NovedadesSection.jsx` | Últimas tres noticias. |
| `components/NoticiaHomeCard.jsx` | Tarjeta de noticia del Home. |
| `components/NosotrosSection.jsx` | Historia y Comisión Directiva. |
| `components/TarjetaAutoridad.jsx` | Tarjeta de un integrante de la comisión. |
| `components/BeneficiosSection.jsx` | Categorías de socio (Padrino, Activo, Adherente). |
| `components/InformacionSection.jsx` | Descarga de Estatuto y Balances. |
| `components/VinculacionSection.jsx` | Logos y enlaces de CAME, ATP y ARCA. |
| `data/hero.js` | Imágenes del carrusel y su encuadre. |
| `data/autoridades.js` | Integrantes de la Comisión Directiva (**editar acá para cambiarlos**). |
| `data/historia.js` | Párrafos de "Sobre CAPyMEF". |
| `data/categorias.jsx` | Textos e íconos de las categorías de socio. |
| `data/documentos.jsx` | Estatuto y Balances (títulos y archivos). |
| `data/aliados.js` | Organismos de vinculación institucional. |
| `data/contacto.js` | Dirección, teléfono, correo y mapa. |
| `hooks/useCarrusel.js` | Cambia de imagen cada cierto tiempo. |
| `hooks/useReveal.js` | Anima las secciones al aparecer al hacer scroll. |

**`noticias/`**
| Archivo | Qué hace |
|---|---|
| `components/NoticiaCard.jsx` | Tarjeta de noticia (listados). |
| `components/NoticiaModal.jsx` | Ventana con la noticia completa. |
| `components/EditarNoticiaModal.jsx` | Edición y baja de una noticia (admin). |
| `hooks/useNoticiasPublicas.js` | Carga las noticias públicas. |

**`eventos/`** · gestión de eventos (admin)
| Archivo | Qué hace |
|---|---|
| `components/EventoFormModal.jsx` | Formulario para crear, editar y eliminar eventos. |
| `components/MapaUbicacion.jsx` | Mapa clickeable para elegir el lugar (se carga recién al usarlo). |
| `utils/resumenHorario.js` | Arma el texto "Viernes 5, 9:00 am hasta…". |

**`padron/`** · socios y solicitudes (admin)
| Archivo | Qué hace |
|---|---|
| `pages/PadronPage.jsx` | Padrón de socios con filtros, edición y exportación a Excel. |
| `pages/SolicitudesPage.jsx` | Solicitudes de registro pendientes. |
| `components/BuscadorSocios.jsx` | Búsqueda y filtros por categoría, rubro y localidad. |
| `components/TablaSocios.jsx` | Tabla reutilizable (recibe las columnas). |
| `components/EditarSocioModal.jsx` | Edición de datos y baja de un socio. |
| `components/RevisarSolicitudModal.jsx` | Revisión de una solicitud: aprobar o rechazar. |
| `components/VisorConstancia.jsx` | Muestra la constancia (PDF o imagen). |
| `hooks/useBuscador.js` | Lógica de búsqueda y filtros. |
| `hooks/useUsuarios.js` | Carga la lista de usuarios. |
| `utils/exportarPadron.js` | Genera el archivo Excel (carga `xlsx` solo al exportar). |

**`area-socio/`** · área privada del socio (`/socios`)
| Archivo | Qué hace |
|---|---|
| `pages/InicioSocioPage.jsx` | Resumen: próximo evento, últimas noticias y pagos. |
| `pages/EventosSocioPage.jsx` | Calendario de eventos e inscripción. |
| `pages/NoticiasSocioPage.jsx` | Noticias para socios. |
| `pages/PagosSocioPage.jsx` | Pagos (en construcción). |
| `pages/EmpresaSocioPage.jsx` | Datos de la empresa (en construcción). |
| `components/CalendarioEventos.jsx` | Grilla mensual con los eventos. |
| `components/ProximoEventoCard.jsx` | Tarjeta del próximo evento. |
| `components/EventoDetalleModal.jsx` | Detalle de un evento y botón de inscripción. |
| `hooks/useEventosSocio.js` | Carga de eventos, mes visible e inscripción. |

### `shared/` · reutilizable
| Archivo | Qué hace |
|---|---|
| `ui/Button.jsx` | Botón con variantes y tamaños. |
| `ui/Loading.jsx` | Indicador de carga. |
| `ui/ModalShell.jsx` | Marco común de los modales de formulario. |
| `ui/ConfirmDialog.jsx` | Diálogo de confirmación (reemplaza a `window.confirm`). |
| `ui/Campo.jsx` | Etiqueta + control de formulario. |
| `ui/estilos.js` | Clases de inputs y botones de formularios. |
| `ui/EnConstruccion.jsx` | Cartel para secciones sin terminar. |
| `hooks/useBloquearScroll.js` | Bloquea el scroll mientras hay un modal abierto. |
| `utils/cn.js` | Une clases de Tailwind sin conflictos. |
| `utils/fechas.js` | dayjs configurado en español y `formatearFecha`. |
| `utils/imagenes.js` | Arma la URL correcta de una imagen subida. |

### `Pages/` · pendientes de mudar
Páginas que todavía no están dentro de `features/`. Los archivos `index.js` solo reexportan para que `AppRoutes.jsx` no cambie.

| Archivo | Qué hace |
|---|---|
| `Auth/Login.jsx` | Inicio de sesión (vuelve a donde querías entrar). |
| `Auth/Register.jsx` | Registro de socio con documentación. |
| `Auth/ForgotPassword.jsx` | Pide el correo de recuperación. |
| `Auth/ResetPassword.jsx` | Define la nueva contraseña. |
| `Auth/index.js` | Reexporta las páginas de Auth. |
| `Profile.jsx` | Perfil del usuario. |
| `HomePage/Noticias.jsx` | Listado público de noticias (`/noticias`). |
| `HomePage/index.js` | Reexporta Noticias. |
| `Admin/Inicio.jsx` | Inicio del panel de administración. |
| `Admin/Noticias.jsx` | Lista y creación de noticias. |
| `Admin/Eventos.jsx` | Calendario y gestión de eventos. |
| `Admin/Finanzas.jsx` | Finanzas (en construcción). |
| `Admin/Hooks/useNoticiasLogic.js` | Lógica del formulario y la lista de noticias. |
| `Admin/index.js` | Reexporta las páginas de admin (Padrón y Solicitudes salen de `features/padron`). |
| `Socios/index.js` | Reexporta las páginas de `features/area-socio`. |

---

## Rutas

| Ruta | Quién entra | Página |
|---|---|---|
| `/` | Todos | Landing |
| `/noticias` | Todos | Noticias públicas |
| `/login`, `/register`, `/forgot-password`, `/reset-password/:token` | Todos | Autenticación |
| `/profile` | Con sesión | Perfil |
| `/socios`, `/socios/eventos`, `/socios/noticias`, `/socios/empresa`, `/socios/pagos` | Con sesión | Área de socios |
| `/admin/inicio`, `noticias`, `eventos`, `finanzas`, `registros`, `socios` | Solo admin | Panel de administración |

---

## Reglas para seguir ordenado

1. **Una funcionalidad nueva = una carpeta en `features/`** con `pages/`, `components/`, `hooks/` y `data/` según necesite.
2. Si algo lo usan **dos o más features**, va a `shared/`.
3. **Imports con `@`**: `import X from "@/shared/ui/Loading"` (nada de `../../../`).
4. **Un componente = un archivo**, idealmente de menos de 150 líneas. Si crece, se divide.
5. Los **textos y listas fijas** (autoridades, aliados, categorías) van en `data/`, no dentro del JSX.
6. **Toda llamada al backend** pasa por `services/` y `api/client.js`. Como `api()` nunca lanza errores, se revisa `result.exito` (no hace falta `try/catch`).
7. **Colores:** usar los del tema (`bg-primary`, `text-navy`, `bg-surface`), nunca `bg-[-primary]`.
8. Las librerías pesadas (mapa, Excel) se cargan **bajo demanda** (`lazy` / `import()`).
9. Los nombres de carpetas van en **minúscula** para evitar problemas entre Windows y Linux.
