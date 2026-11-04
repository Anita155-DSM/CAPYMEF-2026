// Variables de entorno SOLO para tests. Cada archivo de test importa este módulo en la PRIMERA
// línea: los imports de ES modules se ejecutan en orden, así que esto corre antes de que se cargue
// config/database.js o authMiddleware.js (que leen process.env al importarse).

// Garantiza que config/database.js elija SQLite en memoria y nunca se conecte a Neon,
// aunque alguien corra los tests con otro NODE_ENV.
process.env.NODE_ENV = 'test';

// Clave falsa para firmar tokens en los tests. No es la del .env: dotenv no pisa variables que
// ya existen, así que los tests no dependen del contenido del .env.
process.env.JWT_SECRET = 'clave-solo-para-tests';
