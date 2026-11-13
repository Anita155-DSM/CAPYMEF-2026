# Seguridad de las dependencias del backend

**Fecha de la revisión:** 11 de noviembre de 2026 (actualizada el 13 de noviembre de 2026, dos veces: nodemon y Cloudinary 2.x)
**Alcance:** solo el backend (`backend/package.json`). El frontend tiene su propia revisión.
**Herramienta:** `npm audit`, que compara las librerías instaladas contra la base pública de vulnerabilidades conocidas (GitHub Advisory Database).

## Resumen

| | Todas las dependencias | Solo las que van a producción |
|---|---|---|
| **Antes (11/11)** | 9 avisos (2 críticos, 2 altos, 5 moderados) | 4 avisos (2 altos, 2 moderados) |
| **Después del arreglo (11/11)** | 7 avisos (2 críticos, 2 altos, 3 moderados) | 4 avisos (2 altos, 2 moderados) |
| **13/11, sin nodemon** | 7 avisos (2 críticos, 2 altos, 3 moderados) | 4 avisos (2 altos, 2 moderados) |
| **Hoy (13/11), con Cloudinary 2.11.0** | 5 avisos (2 críticos, 3 moderados) | 2 avisos (2 moderados) |

- **Se corrigieron 2 avisos** (minimatch y nodemon) sin cambiar ninguna versión mayor. Después, nodemon se **quitó del proyecto** porque no lo usaba nada (ver abajo).
- **Se corrigieron los 2 avisos altos de producción** (cloudinary y multer-storage-cloudinary): se actualizó Cloudinary a la 2.11.0 y se reemplazó multer-storage-cloudinary por un middleware propio (ver abajo). **Producción ya no tiene ningún aviso alto ni crítico.**
- **Los 5 que quedan** no se pueden corregir sin pasar a una versión mayor de alguna librería. Ninguno afecta al sistema tal como lo usamos:
  - **3 son solo de desarrollo** (las herramientas de tests). No se instalan en el servidor.
  - **2 están en producción** (uuid, dentro de Sequelize). Revisamos el código: la parte vulnerable no la usa nadie.
- **No se usó `npm audit fix --force`.** Ese comando sube versiones mayores sin revisar si el código sigue funcionando. En este proyecto, además, proponía cosas como bajar Sequelize de la versión 6 a la 3.

Después de cada cambio se corrieron todos los tests automáticos del backend: hoy pasan los 1453 (64 archivos).

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
| cloudinary 1.41.3 y multer-storage-cloudinary 4.0.0 | Alta | Producción | En Cloudinary anterior a la 2.7.0, un valor con el carácter `&` podía colar parámetros extra en el pedido a Cloudinary. multer-storage-cloudinary aparecía solo porque usa esa librería, y no tiene ninguna versión para Cloudinary 2.x. | El 13/11 se actualizó **cloudinary a la 2.11.0** y se **quitó multer-storage-cloudinary** (con él se fueron 3 paquetes que solo usaba Cloudinary 1.x: cloudinary-core, core-js y q). Las subidas ahora leen el archivo en memoria con multer y lo suben con `upload_stream` (`middlewares/multer/subirACloudinary.js`). Detalle abajo. |

### Cómo quedó el reemplazo de Cloudinary

- **Qué cambió en Cloudinary 2.x que nos toque:** nada de lo que usamos. Las funciones `uploader.upload_stream`, `uploader.destroy` y `utils.private_download_url` tienen el mismo nombre, los mismos parámetros y el mismo comportamiento. Los cambios grandes de la 2.0 (direcciones `https` por defecto, datos de uso agregados a las direcciones que arma `cloudinary.url()`, sin soporte para Node 6 y 8) no nos afectan: guardamos la dirección segura que devuelve Cloudinary al subir, no usamos `cloudinary.url()` y el servidor usa Node 24. La 2.9 cambió las promesas internas por las nativas de Node, sin cambio visible.
- **Qué se mantuvo igual:** las mismas carpetas, los archivos privados (constancias y comprobantes de gastos) y públicos (imágenes de noticias y eventos), los mismos formatos permitidos y el mismo tope de 5 MB, los mismos nombres de campo del formulario, y los mismos datos del archivo para los controladores, que no cambiaron.
- **Qué mejoró:** un archivo de más de 5 MB o con un formato no permitido se corta **antes** de llegar a Cloudinary. Antes, con el tope, una parte del archivo ya podía haber llegado a subirse y había que borrarla.
- **Si Cloudinary falla al guardar el archivo,** el usuario recibe un error 502 ("No se pudo guardar el archivo. Probá de nuevo en unos minutos.") y no se crea el registro, el gasto, la noticia ni el evento.
- **Verificado contra la cuenta real de Cloudinary** (13/11): una constancia en PDF y un comprobante de gasto como imagen se subieron como privados, una imagen de noticia como pública, las direcciones temporales funcionaron y los tres archivos de prueba se borraron.

## Lo que queda, y por qué es aceptable


### 1. uuid 8.3.2 (dentro de Sequelize 6.37.8)

**Severidad moderada. Producción.**

**Qué es:** las funciones `v3`, `v5` y `v6` de uuid no controlan bien los límites cuando se les pasa un espacio de memoria (buffer) para escribir el resultado.

**¿Nos afecta? No.** uuid no lo usa nuestro código: lo usa Sequelize, la librería de base de datos. Revisamos el código de Sequelize: solo llama a `v1` y `v4`, y nunca con un buffer.

**Por qué no se actualizó:**
- La última versión de Sequelize 6 (6.37.8, la que tenemos) todavía pide uuid 8.
- La "solución" que propone `npm audit` es bajar a Sequelize 3.30.0, una versión de hace años que rompería todo el proyecto.
- Forzar uuid 11 por encima de lo que pide Sequelize también es un cambio mayor que Sequelize no probó.

**Plan:** seguirlo hasta que Sequelize publique una versión 6 con uuid actualizado, y actualizar entonces (sería un cambio menor).

### 2. vitest 3.2.7, @vitest/mocker y tinypool

**Severidad crítica y moderada. Solo desarrollo.**

**Qué son:** vitest es la herramienta con la que corremos los tests automáticos, y @vitest/mocker y tinypool son piezas internas suyas. Los avisos describen ataques que necesitan que alguien interactúe con vitest mientras se ejecuta: registrar módulos falsos, leer archivos a través del sistema que reemplaza módulos en los tests, o manipular las opciones de sus procesos internos.

**¿Nos afecta? No, por tres motivos:**
1. **No llega al servidor.** Son dependencias de desarrollo: una instalación de producción (`npm ci --omit=dev`) no las instala, y el código del sistema (`app.js` y lo que carga) nunca las importa.
2. **No queda escuchando conexiones.** Los tests se corren con `vitest run`, que ejecuta los tests propios del proyecto en la computadora de quien programa y termina. No usamos el modo con interfaz web ni el modo navegador.
3. **No recibe datos de nadie más.** Lo que vitest ejecuta son nuestros propios archivos de test.

**Por qué no se actualizó:** la corrección está en vitest 4 o 5, versiones mayores que pueden cambiar la configuración y la forma de simular módulos que usan nuestros 64 archivos de test.

**Plan:** después de la entrega, actualizar vitest en una rama aparte, correr los 1453 tests y ajustar lo que haga falta. Probaríamos primero la 4.1.12, que es el salto más chico.

## Recomendaciones

1. **En el servidor, instalar solo las dependencias de producción** (`npm ci --omit=dev`). Así ninguna herramienta de desarrollo llega a producción.
2. **Cloudinary:** ya se actualizó (13/11). Falta la prueba manual de cada subida desde la aplicación: registro con constancia, gasto con ticket, noticia y evento con imagen (alta y edición), y pago de una cuota con descarga del comprobante.
3. **nodemon:** ya se quitó (13/11). Si algún día se quiere recarga automática en desarrollo, Node la trae incorporada: `node --watch app.js`, sin instalar nada.
4. **Repetir `npm audit`** antes de cada entrega y actualizar este documento.
