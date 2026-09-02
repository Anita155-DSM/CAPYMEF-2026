import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import {
  EventosAdmin,
  FinanzasAdmin,
  NoticiasAdmin,
  RegistrosAdmin,
  SociosAdmin,
} from "../Pages/Admin/index.js"; // Importamos el nuevo guardia
import Inicio from "../Pages/Admin/Inicio.jsx";
import { ForgotPassword, Login, Register } from "../Pages/Auth/index.js";
import ResetPassword from "../Pages/Auth/ResetPassword.jsx";
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
import { Autoridades, Balance, Estatuto } from "../Pages/PublicPages/index.js";
import AdminRoutes from "./AdminRoutes.jsx";
import PrivateRoutes from "./PrivateRoutes";

export default function AppRoutes() {
  return (
    <>
      <Routes>
        {/*NO LOGUEADOS */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/autoridades" element={<Autoridades />} />
        <Route path="/balance" element={<Balance />} />
        <Route path="/estatuto" element={<Estatuto />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

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

        {/* ADMINS*/}
        <Route element={<AdminRoutes />}>
          <Route element={<MainLayout />}>
            <Route path="/admin/inicio" element={<Inicio />} />
            <Route path="/admin/noticias" element={<NoticiasAdmin />} />
            <Route path="/admin/eventos" element={<EventosAdmin />} />
            <Route path="/admin/finanzas" element={<FinanzasAdmin />} />
            <Route path="/admin/registros" element={<RegistrosAdmin />} />
            <Route path="/admin/socios" element={<SociosAdmin />} />
          </Route>
        </Route>

        {/* RUTA COMODÍN */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
