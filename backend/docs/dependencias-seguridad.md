# Seguridad de las dependencias del backend

**Fecha de la revisión:** 11 de noviembre de 2026 (actualizada el 13 de noviembre de 2026)
**Alcance:** solo el backend (`backend/package.json`). El frontend tiene su propia revisión.
**Herramienta:** `npm audit`, que compara las librerías instaladas contra la base pública de vulnerabilidades conocidas (GitHub Advisory Database).

## Resumen

| | Todas las dependencias | Solo las que van a producción |
|---|---|---|
| **Antes (11/11)** | 9 avisos (2 críticos, 2 altos, 5 moderados) | 4 avisos (2 altos, 2 moderados) |
| **Después del arreglo (11/11)** | 7 avisos (2 críticos, 2 altos, 3 moderados) | 4 avisos (2 altos, 2 moderados) |
| **Hoy (13/11), sin nodemon** | 7 avisos (2 críticos, 2 altos, 3 moderados) | 4 avisos (2 altos, 2 moderados) |

- **Se corrigieron 2 avisos** (minimatch y nodemon) sin cambiar ninguna versión mayor. Después, nodemon se **quitó del proyecto** porque no lo usaba nada (ver abajo).
- **Los 7 que quedan** no se pueden corregir sin pasar a una versión mayor de alguna librería. Ninguno afecta al sistema tal como lo usamos:
  - **3 son solo de desarrollo** (las herramientas de tests). No se instalan en el servidor.
  - **4 están en producción.** Revisamos el código: la parte vulnerable de esas librerías no recibe datos que pueda controlar un usuario.
- **No se usó `npm audit fix --force`.** Ese comando sube versiones mayores sin revisar si el código sigue funcionando. En este proyecto, además, proponía cosas como bajar Sequelize de la versión 6 a la 3.

Después de cada cambio se corrieron todos los tests automáticos del backend: hoy pasan los 1350 (60 archivos).

## Qué significa cada columna

- **Severidad:** la que asigna el aviso público (crítica, alta, moderada). Mide el peor caso posible en cualquier proyecto, no en el nuestro.
- **Producción / desarrollo:**
  - Una dependencia de **producción** se instala en el servidor y forma parte del sistema que usan los socios.
  - Una de **desarrollo** solo se usa en la computadora de quien programa (por ejemplo, para correr los tests). No se instala en el servidor.
- **¿Nos afecta?:** si nuestro código usa la parte vulnerable de la librería con datos que pueda controlar un atacante.

## Lo que se corrigió

| Paquete | Severidad | Tipo | Qué era | Qué se hizo |
|---|---|---|---|---|
| minimatch (dentro de nodemon) | Moderada | Desarrollo | Un patrón de búsqueda de archivos armado a propósito podía hacer que el programa se trabe (denegación de servicio). | El 11/11 se pasó **nodemon de 3.1.14 a 3.1.11**, que trae una minimatch sin el problema. El 13/11 se **quitó nodemon** del proyecto. |
| nodemon (herramienta de recarga automática) | — | Desarrollo | No lo usaba nada: ni los scripts (`npm run dev` y `npm start` ejecutan `node app.js`), ni archivos de configuración, ni el README. | Se desinstaló (`npm uninstall nodemon`). Con él se fueron 26 paquetes, todos de desarrollo; ninguna dependencia de producción cambió. Una herramienta que no se usa no puede tener vulnerabilidades que nos afecten. |

## Lo que queda, y por qué es aceptable

### 1. cloudinary 1.41.3 y multer-storage-cloudinary 4.0.0

**Severidad alta. Producción.**

**Qué es:** en las versiones de Cloudinary anteriores a la 2.7.0, si un valor que se le pasa a la librería contiene el carácter `&`, se pueden colar parámetros extra en el pedido que se manda a Cloudinary. multer-storage-cloudinary aparece en la lista solo porque usa esa misma librería.

**¿Nos afecta? No.** El problema solo existe si un dato del usuario termina dentro de esos parámetros. Revisamos todos los usos:

- **Subidas de archivos** (constancia del registro, comprobantes de gastos, imágenes de noticias y eventos): los parámetros son fijos en el código (carpeta, formatos permitidos, tipo de archivo). El nombre del archivo en Cloudinary lo genera Cloudinary; el nombre original que manda el usuario no se usa como parámetro.
- **Comprobantes de pago en PDF:** la carpeta es fija y el nombre es el identificador interno del pago (`comprobante-<UUID>`).
- **Borrado de imágenes:** el identificador se obtiene de la dirección que **Cloudinary** nos devolvió al subir el archivo. Ninguna ruta acepta esa dirección desde el formulario.

**Por qué no se actualizó:** la corrección está en Cloudinary 2.x, una versión mayor nueva. multer-storage-cloudinary, la pieza que conecta las subidas con Cloudinary, no tiene ninguna versión compatible con Cloudinary 2.x: su última versión, la 4.0.0, solo funciona con la 1.x. Actualizar implica reemplazar esa pieza, como se explica abajo.

**Plan para corregirlo:**
1. Cambiar el almacenamiento de los tres archivos de subida a almacenamiento en memoria de multer, y subir el archivo a Cloudinary con `upload_stream`. Es el mismo método que ya usamos para los comprobantes de pago.
2. Actualizar `cloudinary` a la versión 2.x y quitar `multer-storage-cloudinary`.

Archivos que se tocarían:
- `middlewares/multer/multerCloudinary.js`, `multerNoticias.js` y `multerEventos.js`
- `services/cloudinary.service.js`
- los controladores que leen el archivo subido: registro de socios, gastos, noticias y eventos
- los tests de esas rutas

**Riesgo:** medio. Afecta todas las subidas de archivos del sistema, y hay que probarlo a mano contra una cuenta real de Cloudinary.

### 2. uuid 8.3.2 (dentro de Sequelize 6.37.8)

**Severidad moderada. Producción.**

**Qué es:** las funciones `v3`, `v5` y `v6` de uuid no controlan bien los límites cuando se les pasa un espacio de memoria (buffer) para escribir el resultado.

**¿Nos afecta? No.** uuid no lo usa nuestro código: lo usa Sequelize, la librería de base de datos. Revisamos el código de Sequelize: solo llama a `v1` y `v4`, y nunca con un buffer.

**Por qué no se actualizó:**
- La última versión de Sequelize 6 (6.37.8, la que tenemos) todavía pide uuid 8.
- La "solución" que propone `npm audit` es bajar a Sequelize 3.30.0, una versión de hace años que rompería todo el proyecto.
- Forzar uuid 11 por encima de lo que pide Sequelize también es un cambio mayor que Sequelize no probó.

**Plan:** seguirlo hasta que Sequelize publique una versión 6 con uuid actualizado, y actualizar entonces (sería un cambio menor).

### 3. vitest 3.2.7, @vitest/mocker y tinypool

**Severidad crítica y moderada. Solo desarrollo.**

**Qué son:** vitest es la herramienta con la que corremos los tests automáticos, y @vitest/mocker y tinypool son piezas internas suyas. Los avisos describen ataques que necesitan que alguien interactúe con vitest mientras se ejecuta: registrar módulos falsos, leer archivos a través del sistema que reemplaza módulos en los tests, o manipular las opciones de sus procesos internos.

**¿Nos afecta? No, por tres motivos:**
1. **No llega al servidor.** Son dependencias de desarrollo: una instalación de producción (`npm ci --omit=dev`) no las instala, y el código del sistema (`app.js` y lo que carga) nunca las importa.
2. **No queda escuchando conexiones.** Los tests se corren con `vitest run`, que ejecuta los tests propios del proyecto en la computadora de quien programa y termina. No usamos el modo con interfaz web ni el modo navegador.
3. **No recibe datos de nadie más.** Lo que vitest ejecuta son nuestros propios archivos de test.

**Por qué no se actualizó:** la corrección está en vitest 4 o 5, versiones mayores que pueden cambiar la configuración y la forma de simular módulos que usan nuestros 60 archivos de test.

**Plan:** después de la entrega, actualizar vitest en una rama aparte, correr los 1350 tests y ajustar lo que haga falta. Probaríamos primero la 4.1.12, que es el salto más chico.

## Recomendaciones

1. **En el servidor, instalar solo las dependencias de producción** (`npm ci --omit=dev`). Así ninguna herramienta de desarrollo llega a producción.
2. **Cloudinary:** hacer el reemplazo descrito arriba después de la entrega, con pruebas manuales de cada subida. Es el único aviso de producción con un arreglo concreto disponible.
3. **nodemon:** ya se quitó (13/11). Si algún día se quiere recarga automática en desarrollo, Node la trae incorporada: `node --watch app.js`, sin instalar nada.
4. **Repetir `npm audit`** antes de cada entrega y actualizar este documento.
