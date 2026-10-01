import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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
import { Noticias } from "../Pages/HomePage/index.js";
import Profile from "../Pages/Profile";
import AdminRoutes from "./AdminRoutes.jsx";
import PrivateRoutes from "./PrivateRoutes";
import {
  InicioSocio,
  EventosSocio,
  NoticiasSocio,
  EmpresaSocio,
  PagosSocio,
  ConfiguracionSocio,
  ResultadoPago,
} from "../Pages/Socios/index.js";
import SocioLayout from "../layouts/SocioLayout.jsx";
import SocioRoutes from "./SocioRoutes.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/*NO LOGUEADOS */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/*LOGUEADOS*/}
        <Route element={<PrivateRoutes />}>
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/*SOCIOS */}
        <Route element={<SocioRoutes />}>
          <Route element={<SocioLayout />}>
            <Route path="/socios">
              <Route index element={<InicioSocio />} />
              <Route path="eventos" element={<EventosSocio />} />
              <Route path="noticias" element={<NoticiasSocio />} />
              <Route path="empresa" element={<EmpresaSocio />} />
              <Route path="pagos" element={<PagosSocio />} />
              <Route path="configuracion" element={<ConfiguracionSocio />} />
            </Route>
            {/* Vuelta desde Mercado Pago (back_urls del backend) */}
            <Route path="/pago-exitoso" element={<ResultadoPago tipo="exitoso" />} />
            <Route path="/pago-fallido" element={<ResultadoPago tipo="fallido" />} />
            <Route path="/pago-pendiente" element={<ResultadoPago tipo="pendiente" />} />
          </Route>
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
