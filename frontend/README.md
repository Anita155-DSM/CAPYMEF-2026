src/
├── assets/
│   └── img/ 
│
├── Components/ 
│   ├── Card.jsx
│   ├── Footer.jsx
│   ├── Loading.jsx
│   └── Navbar.jsx
│
├── Hooks/
│   └── useForm.js
│
├── layouts/ (¡NUEVA CARPETA!)
│   └── MainLayout.jsx (¡NUEVO ARCHIVO!)
│
├── Pages/
│   ├── Auth/ (¡NUEVA CARPETA!)
│   │   ├── Login.jsx (MOVIDO acá)
│   │   ├── Register.jsx (MOVIDO acá)
│   │   └── index.js (¡NUEVO ARCHIVO! El barril de autenticación)
│   │
│   ├── HomePage/
│   │   ├── Capacitacion.jsx
│   │   ├── Contacto.jsx
│   │   ├── Eventos.jsx
│   │   ├── index.js 
│   │   ├── Nosotros.jsx
│   │   ├── Noticias.jsx
│   │   └── Socios.jsx
│   │
│   ├── Home.jsx 
│   └── Profile.jsx 
│
├── Routes/
│   ├── AppRoutes.jsx
│   ├── PrivateRoutes.jsx
│   └── PublicRoutes.jsx
│
└── services/ (¡NUEVA CARPETA!)
    └── authService.js (¡NUEVO ARCHIVO!)


    git checkout origin/develop-ana -- backend/