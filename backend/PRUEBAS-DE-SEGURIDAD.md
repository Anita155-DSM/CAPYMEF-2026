# Pruebas de seguridad del backend CAPYMEF (para ejecutar con Claude)

> Pegale este archivo completo a Claude en VS Code y pedile: **"Ejecutá las pruebas de PRUEBAS-DE-SEGURIDAD.md siguiendo todas las reglas"**.

## Objetivo

Automatizar el mayor número posible de pruebas de seguridad sobre el backend (Node + Express + Sequelize, rutas bajo `/api`) y devolver **solo lo que salió mal**, para revisarlo después a mano.

## Reglas obligatorias (leelas antes de hacer nada)

1. **Solo contra localhost.** El script debe negarse a correr si la URL base no es `http://localhost:3000` (o `127.0.0.1`). Nunca contra un servidor desplegado.
2. **Sin herramientas nuevas.** Usá solo Node (`fetch`, `node:crypto`, `node:fs`) y el `npm audit` que ya trae npm. No instales dependencias.
3. **Credenciales por variables de entorno**, nunca escritas en archivos ni en el chat: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SOCIO_EMAIL`, `SOCIO_PASSWORD` (un socio de PRUEBA ya aprobado, distinto del admin). Si no las ves en tu entorno, pará y pedime que las cargue; no las inventes ni las busques en el `.env`.
4. **Nunca imprimas ni guardes** tokens, contraseñas, valores del `.env`, claves ni cadenas de conexión. En los informes mostrá solo códigos de estado, nombres de campos y los primeros 200 caracteres del cuerpo de respuesta, **sin tokens**.
5. **No toques datos reales.** Solo modificá o borrá lo que el propio script creó. Para probar rutas de admin con token de socio, usá ids que no existan (por ejemplo `999999` o `00000000-0000-0000-0000-000000000000`). No llames a `/api/cuotas/:id/pagar` con ids reales.
6. **No hagas commits** ni modifiques código de producción. Todo va en `backend/tests-seguridad/` (script `pruebas-seguridad.mjs` e informe `informe.md`). Este informe no se commitea.
7. **Orden:** el grupo 8 bloquea el login por 15 minutos (limitador de intentos), así que va **siempre al final**. Antes de empezar, pedime que reinicie el backend, porque el limitador cuenta cada intento. Al terminar, avisame que lo reinicie de nuevo.
8. Para descubrir las rutas, leé `backend/routes/*.js` y `backend/app.js`; no supongas rutas. Si una ruta que menciono abajo no existe con ese nombre, buscá la equivalente y avisame.

## Cómo clasificar cada resultado

- **OK:** coincide con lo esperado.
- **FALLA:** el comportamiento es inseguro (por ejemplo, un dato privado sin token, un 500 con detalles internos, una ruta de admin accesible para un socio).
- **REVISAR:** distinto a lo esperado, pero no claramente inseguro (por ejemplo, un 400 donde esperaba 404).
- **OMITIDA:** no se pudo ejecutar (falta un dato o una ruta). Explicá por qué.
- **MANUAL:** no se puede automatizar; queda para revisar a mano.

## Pruebas

### Grupo 1: barrido de rutas (automático a partir de `routes/*.js`)

| ID | Qué hacer | Esperado |
|---|---|---|
| 1.1 | Cada ruta con `verificarToken`, **sin** token | 401 |
| 1.2 | Cada ruta con `verificarToken`, con `Authorization: Bearer basura` | 403 |
| 1.3 | Cada ruta con `verificarToken`, con un JWT bien formado firmado con **otra clave** (generalo vos con una clave inventada) | 403 |
| 1.4 | Cada ruta con `verificarToken`, con un JWT de cabecera `{"alg":"none"}` y sin firma | 403 |
| 1.5 | Cada ruta con `verificarAdmin`, con el token del **socio** de prueba | 403 |
| 1.6 | `GET /api/noticias/publicas` sin token | Todas las noticias son `estado: "publicado"` y `visibilidad` `publico` o `todos` (ninguna de solo socios ni borrador) |
| 1.7 | Crear con el admin una noticia en `borrador` y otra de `visibilidad: "socios"`; pedir `GET /api/noticias/:id` de cada una sin token y con token de socio; borrarlas al final | 404 en ambos casos para la de borrador; 404 sin token para la de solo socios |

### Grupo 2: acceso a datos de otros usuarios

Obtené con el admin una cuota y una notificación que NO sean del socio de prueba (si no hay, marcá OMITIDA).

| ID | Qué hacer | Esperado |
|---|---|---|
| 2.1 | Socio: iniciar pago de una cuota ajena (`POST /api/pagos/:id/iniciar`) | 403 |
| 2.2 | Socio: pedir el comprobante de una cuota ajena (`/api/pagos/mis-cuotas/:id/comprobante`) | 404 |
| 2.3 | Socio: marcar como leída una notificación ajena (`PUT /api/notificaciones/:id/leer`) | 404, y la notificación sigue sin leer cuando el admin la consulta |
| 2.4 | Socio: `GET /api/pagos/mis-cuotas` | Todas las cuotas devueltas pertenecen al socio (compará con el listado de admin) |

### Grupo 3: campos de más (mass assignment)

| ID | Qué hacer | Esperado |
|---|---|---|
| 3.1 | Socio: `PUT /api/auth/perfil` con `{"telefono":"1111","rol":"admin","estado":"aprobado","categoria":"activo","email":"otro@x.com"}`; después `GET /api/auth/perfil` | `rol`, `estado`, `categoria` y `email` **no cambian**. Solo puede cambiar `telefono`/`localidad`. Restaurá el teléfono original |

### Grupo 4: entradas maliciosas

| ID | Qué hacer | Esperado |
|---|---|---|
| 4.1 | Login con email `' OR '1'='1` y con `admin'--`; y con un email válido y password `' OR '1'='1` | 400 o 401; **nunca** 200 con token ni 500 |
| 4.2 | `GET /api/noticias/publicas?categoria=' OR 1=1--` | 200 con lista vacía; ningún 500 |
| 4.3 | Admin: buscador de auditoría con `busqueda=' OR 1=1--` | 200; sin 500; no devuelve más registros que sin filtro |
| 4.4 | `GET /api/noticias/publicas?categoria[ne]=x` y login con `{"email":{"$ne":null},"password":{"$ne":null}}` | 200 con lista vacía o 400/401; nunca 500 ni sesión iniciada |
| 4.5 | Login con `email` como array y `password` como objeto | 400 o 401; nunca 500 |
| 4.6 | Enviar JSON mal formado a `/api/auth/login` | 400 sin stack trace en el cuerpo |
| 4.7 | Enviar un cuerpo JSON de 2 MB a `/api/auth/login` | 413 (o 400); nunca 500 |
| 4.8 | `GET /api/noticias/abc` y `PUT /api/noticias/admin/abc` (admin) | Ideal: 400 o 404. **Hallazgo conocido:** hoy da 500; marcalo REVISAR |
| 4.9 | Admin: crear una noticia con título `<script>alert(1)</script>` y borrarla | Sin 500. Marcá además **MANUAL**: revisar cómo la muestra el frontend (XSS) |
| 4.10 | Admin: subir a `POST /api/noticias/admin` como imagen un `.txt`, un `.html`, un `.exe` (unos pocos bytes) y un archivo de 12 MB | 400 o 413 en los cuatro. Si algún archivo fue aceptado, anotá la URL de Cloudinary para borrarla a mano y marcá FALLA |

### Grupo 5: exposición de datos

| ID | Qué hacer | Esperado |
|---|---|---|
| 5.1 | `GET /api/auth/perfil` (socio y admin) | La respuesta no contiene las claves `password`, `resetPasswordToken` ni `resetPasswordExpires` |
| 5.2 | `GET /api/admin/socios` (admin) | Ningún elemento contiene esas tres claves |
| 5.3 | Respuesta del login | No contiene `password` ni hashes |
| 5.4 | Provocar errores (ids inválidos, `page=abc&limit=abc` en el listado de auditoría de admin, cuerpos vacíos) | Ninguna respuesta contiene `Sequelize`, `SQL`, `stack`, rutas de archivos, `node_modules`, ni nombres de tablas. Fijate en especial en el listado de auditoría, que devuelve `error.message` en el 500 |
| 5.5 | Cabeceras de cualquier respuesta | Ideal: sin `X-Powered-By` y con `X-Content-Type-Options: nosniff`. Si faltan, REVISAR |
| 5.6 | Enviar `Origin: http://evil.example` a una ruta de la API | La respuesta no trae `Access-Control-Allow-Origin` con ese origen ni con `*` |
| 5.7 | Tomar la `constanciaUrl` del perfil del admin y un `urlComprobante` de un pago, y pedirlos **sin autenticación** | Hoy probablemente dan 200 (enlaces públicos de Cloudinary). Marcalo REVISAR: es una decisión a tomar, no un error de código |

### Grupo 6: pagos

| ID | Qué hacer | Esperado |
|---|---|---|
| 6.1 | Webhook (`POST` a la ruta pública de pagos) con `topic=payment` e id `999999999`; contar los pagos sin confirmar antes y después | 200; **no** se crea ningún pago |
| 6.2 | Webhook con `topic=merchant_order` | 200 sin ningún cambio |
| 6.3 | Socio: iniciar el pago de una cuota propia que ya esté `pagada` (si no hay, OMITIDA) | 400 |

### Grupo 7: proyecto (no requiere el servidor)

| ID | Qué hacer | Esperado |
|---|---|---|
| 7.1 | `npm audit` en `backend` y en `frontend` | Reportar solo las vulnerabilidades `high` y `critical`, con el nombre del paquete |
| 7.2 | `git ls-files` buscando `.env` | Solo debería aparecer `.env.example`. **Hallazgo conocido:** `frontend/.env` figura en git |
| 7.3 | Buscar en los archivos versionados patrones de secretos (`APP_USR-`, `TEST-`, `postgresql://`, `eyJ`, `api_secret`) | Sin coincidencias. **Mostrá solo archivo y número de línea, nunca el contenido** |
| 7.4 | Largo de `JWT_SECRET` en `backend/.env` | Al menos 32 caracteres. **Mostrá solo el número, nunca el valor** |
| 7.5 | Buscar `console.log` o `console.error` que impriman contraseñas o tokens | Sin coincidencias. Mostrá archivo y línea |

### Grupo 8: al final (bloquea el login 15 minutos)

| ID | Qué hacer | Esperado |
|---|---|---|
| 8.1 | Login con un email inexistente y con el email del socio y una contraseña mal | Mismo mensaje genérico en ambos casos (no revelar cuál era el error) |
| 8.2 | 15 logins fallidos seguidos | En algún momento aparece el bloqueo ("Demasiados intentos") |
| 8.3 | 8 solicitudes a `/api/auth/recuperar-password` con emails **inexistentes** | Respuesta 200 genérica igual en todos, y bloqueo después de unos intentos |
| 8.4 | 30 solicitudes a `PUT /api/auth/restablecer-password/tokenfalso` con una contraseña válida | **Hallazgo conocido:** hoy no tiene límite. Si no bloquea, REVISAR |

## Qué entregar al terminar

1. El informe `backend/tests-seguridad/informe.md` con una tabla completa: ID, esperado, obtenido, resultado.
2. En tu respuesta, **solo una lista de los resultados FALLA, REVISAR, OMITIDA y MANUAL**, cada uno con su ID, el código de estado obtenido y los primeros 200 caracteres de la respuesta (sin tokens ni datos personales).
3. La lista de lo que el script creó (noticias de prueba, archivos aceptados) y si lo borró.
4. El aviso de que hay que reiniciar el backend para limpiar el bloqueo del login.
