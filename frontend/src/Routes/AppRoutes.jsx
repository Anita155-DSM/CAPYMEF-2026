import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import { EventosAdmin, FinanzasAdmin, NoticiasAdmin, RegistrosAdmin, SociosAdmin, } from "../Pages/Admin/index.js"; // Importamos el nuevo guardia
import Inicio from "../Pages/Admin/Inicio.jsx";
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
import { Autoridades, Balance, Estatuto } from "../Pages/PublicPages/index.js";
import AdminRoutes from "./AdminRoutes.jsx";
import PrivateRoutes from "./PrivateRoutes";
import { Navbar, NavbarPublico } from "../Components/index.js"

export default function AppRoutes() {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const rutasSinNavbar = ["/login", "/register"];
  const mostrarNavbar = !rutasSinNavbar.includes(location.pathname);
  return (
    <>

      {mostrarNavbar && token ? <Navbar /> : <NavbarPublico />}
      <Routes>
        {/*NO LOGUEADOS */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/autoridades" element={<Autoridades />} />
        <Route path="/balance" element={<Balance />} />
        <Route path="/estatuto" element={<Estatuto />} />

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
