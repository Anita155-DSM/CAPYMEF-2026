# CAPYMEF-2026

## Especificaciones del proyecto

### Versiones necesarias
- Node.js 18 o superior.
- XAMPP con MySQL/MariaDB activo.
- Base de datos: `capymef_db`.

### Instalación de dependencias
```bash
cd backend
npm install

cd ../frontend
npm install
```

### Variables de entorno
Crear un archivo `backend/.env` a partir de `backend/.env.example` con estas claves:

```env
PORT=3000
DB_USER=
DB_PASSWORD=
DB_HOST=localhost
DB_NAME=capymef_db
DB_DIALECT=mysql
```

### Ejecución local
```bash
cd backend
npm run dev

cd ../frontend
npm run dev
```

Nota: el frontend todavía no está scaffolded; estas instrucciones quedan listas para cuando se cree su proyecto base.
