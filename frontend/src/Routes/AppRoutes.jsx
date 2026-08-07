import { Navigate, Route, Routes } from "react-router-dom";
import Home from "../Pages/Home";
import Login from "../Pages/Login";
import Profile from "../Pages/Profile"; // Corregí la R mayúscula
import Register from "../Pages/Register";
import PrivateRoutes from "./PrivateRoutes";
import PublicRoutes from "./PublicRoutes"; // Corregí la O mayúscula
import {Capacitacion,Contacto,Eventos,Nosotros,Noticias,Socios} from "../Pages/HomePage/index.js"

export default function AppRoutes() {
  return (
    <Routes>
      {/* RUTA PRINCIPAL */}
      <Route path="/" element={<Home />} />
      {/* Opcional: Si querés que /home también funcione, descomentá la línea de abajo */}
      {/* <Route path="/home" element={<Home />} /> */}

      {/* RUTAS PÚBLICAS (Login / Register) */}
      <Route element={<PublicRoutes />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/Capacitacion" element={<Capacitacion />} />
        <Route path="/Contactos" element={<Contacto />} />
        <Route path="/Eventos" element={<Eventos />} />
        <Route path="/Nosotros" element={<Nosotros />} />
        <Route path="/Noticias" element={<Noticias />} />
        <Route path="/Socios" element={<Socios />} />
      </Route>

      {/* RUTAS PRIVADAS (Solo usuarios logueados) */}
      <Route element={<PrivateRoutes />}>
        {/* <Route path="/profile" element={<Profile />} /> */}
      </Route>

      {/* RUTA SALVAVIDAS: Solo se pone una vez y al final */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
