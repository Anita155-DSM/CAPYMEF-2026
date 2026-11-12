import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthContext";
import RequireAuth from "./RequireAuth.jsx";

import MainLayout from "@/layouts/MainLayout.jsx";
import SocioLayout from "@/layouts/SocioLayout.jsx";

import Home from "@/features/landing/pages/LandingPage";
import { Noticias } from "@/Pages/HomePage/index.js";
import { ForgotPassword, Login, Register, ResetPassword } from "@/Pages/Auth/index.js";
import {
  InicioAdmin,
  EventosAdmin,
  FinanzasAdmin,
  NoticiasAdmin,
  RegistrosAdmin,
  SociosAdmin,
} from "@/Pages/Admin/index.js";
import {
  InicioSocio,
  EventosSocio,
  NoticiasSocio,
  EmpresaSocio,
  PagosSocio,
  ResultadoPago,
} from "@/Pages/Socios/index.js";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * Si el usuario ya inició sesión, no debe ver la landing ni las pantallas de login:
 * se lo redirige automáticamente a su panel (/socios o /admin/inicio) hasta que cierre sesión.
 */
function SoloInvitado() {
  const { usuario } = useAuth();
  if (usuario) {
    return <Navigate to={usuario.rol === "admin" ? "/admin/inicio" : "/socios"} replace />;
  }
  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* PÚBLICAS (solo accesibles cuando NO hay sesión iniciada) */}
        <Route element={<SoloInvitado />}>
          <Route path="/" element={<Home />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* /profile ya no existe como página propia: redirigimos a Mi empresa */}
        <Route path="/profile" element={<Navigate to="/socios/empresa" replace />} />

        {/* SOCIOS (el admin también entra, por el link "VISTA SOCIO") */}
        <Route element={<RequireAuth roles={["socio", "admin"]} />}>
          <Route element={<SocioLayout />}>
            <Route path="/socios">
              <Route index element={<InicioSocio />} />
              <Route path="eventos" element={<EventosSocio />} />
              <Route path="noticias" element={<NoticiasSocio />} />
              <Route path="empresa" element={<EmpresaSocio />} />
              <Route path="pagos" element={<PagosSocio />} />
            </Route>

            {/* Mercado Pago vuelve a estas rutas (back_urls del backend) */}
            <Route path="/pago-exitoso" element={<ResultadoPago tipo="exitoso" />} />
            <Route path="/pago-pendiente" element={<ResultadoPago tipo="pendiente" />} />
            <Route path="/pago-fallido" element={<ResultadoPago tipo="fallido" />} />
          </Route>
        </Route>

        {/* ADMIN */}
        <Route element={<RequireAuth roles={["admin"]} />}>
          <Route path="/admin" element={<MainLayout />}>
            <Route index element={<Navigate to="inicio" replace />} />
            <Route path="inicio" element={<InicioAdmin />} />
            <Route path="noticias" element={<NoticiasAdmin />} />
            <Route path="eventos" element={<EventosAdmin />} />
            <Route path="finanzas" element={<FinanzasAdmin />} />
            <Route path="registros" element={<RegistrosAdmin />} />
            <Route path="socios" element={<SociosAdmin />} />
          </Route>
        </Route>

        {/* CUALQUIER OTRA URL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
