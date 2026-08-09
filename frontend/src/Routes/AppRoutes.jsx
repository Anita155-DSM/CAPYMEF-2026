import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../Pages/Auth/Login.jsx";
import Register from "../Pages/Auth/Register.jsx";
import Home from "../Pages/Home";
import { Capacitacion, Contacto, Eventos, Nosotros, Noticias, Socios } from "../Pages/HomePage/index.js";
import Profile from "../Pages/Profile"; 
import PrivateRoutes from "./PrivateRoutes";
import PublicRoutes from "./PublicRoutes";
import AdminNoticias from "../Pages/Admin/AdminNoticias.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* RUTA PRINCIPAL */}
      <Route path="/" element={<Home />} />

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
        <Route path="/AdminNoticias" element={<AdminNoticias />} />
      </Route>

      {/* RUTAS PRIVADAS (Solo usuarios logueados) */}
      <Route element={<PrivateRoutes />}>
        {/* <Route path="/profile" element={<Profile />} /> */}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
