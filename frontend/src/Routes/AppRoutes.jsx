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
import AdminRoutes from "./AdminRoutes"; // Importamos el nuevo guardia
import Inicio from "../Pages/Admin/Inicio.jsx";
import MainLayout from "../layouts/MainLayout.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/*NO LOGUEADOS */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/*LOGUEADOS*/}
      <Route element={<PrivateRoutes />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/capacitacion" element={<Capacitacion />} />
        <Route path="/contactos" element={<Contacto />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/socios" element={<Socios />} />
      </Route>

      {/*ADMINS*/}
      <Route element={<AdminRoutes />}>
        <Route element={<MainLayout />}>
          <Route path="/admin/inicio" element={<Inicio />} />
          <Route path="/admin/noticias" element={<AdminNoticias />} />
        </Route>
      </Route>

      {/* RUTA COMODÍN */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
