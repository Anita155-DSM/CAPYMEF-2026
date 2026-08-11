import { Navigate, Route, Routes } from "react-router-dom";
import AdminNoticias from "../Pages/Admin/AdminNoticias.jsx";
import { Login, Register } from "../Pages/Auth/index.js";
import Home from "../Pages/Home";
import {
  Capacitacion,
  Contacto,
  Eventos,
  Nosotros,
  Noticias,
  Socios,
} from "../Pages/HomePage/index.js";
import Profile from "../Pages/Profile";
import PrivateRoutes from "./PrivateRoutes";
import PublicRoutes from "./PublicRoutes";
import Inicio from "../Pages/Admin/Inicio.jsx";
import MainLayout from "../layouts/MainLayout.jsx";

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
        <Route path="/capacitacion" element={<Capacitacion />} />
        <Route path="/contactos" element={<Contacto />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/socios" element={<Socios />} />
        {/*LAS RUTAS DE ABAJO TIENEN QUE IR PRIVADAS */}
        <Route element={<MainLayout />}>
          <Route path="/admin/inicio" element={<Inicio />} />
          <Route path="/admin/noticias" element={<AdminNoticias />} />
        </Route>
      </Route>

      {/* RUTAS PRIVADAS (Solo usuarios logueados) */}
      <Route element={<PrivateRoutes />}>
        {/* <Route path="/profile" element={<Profile />} /> */}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
