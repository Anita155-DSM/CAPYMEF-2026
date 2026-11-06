import { useNavigate } from "react-router-dom";
import { FaRightFromBracket } from "react-icons/fa6";
import { useAuth } from "@/app/providers/AuthContext";
import logo from "../assets/img/logo.png";

export default function Profile() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const cerrarSesion = () => {
    logout();
    navigate("/");
  };

  if (!usuario) {
    return <div className="mt-32 text-center text-xl">Cargando perfil...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-100 font-sans pb-12">
      <div className="pt-12 px-6 md:px-12 max-w-5xl mx-auto">
        {/* Tarjeta principal del perfil */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* ========================================= */}
          {/* 1. BANNER                                 */}
          {/* ========================================= */}
          {/* Podés reemplazar el bg-color por un bg-[url('...')] o una etiqueta <img> */}
          <div className="h-48 md:h-64 w-full bg-gradient-to-r from-navy to-primary"></div>

          {/* ========================================= */}
          {/* 2. CABECERA DEL PERFIL (Foto + Info base) */}
          {/* ========================================= */}
          <div className="px-8 pb-8 relative">
            <div className="flex justify-end pt-6">
              <button
                type="button"
                onClick={cerrarSesion}
                className="mt-4 inline-flex items-center gap-2 border border-[#d7e0e5] bg-[#f4f9fc] px-4 py-2 text-sm text-[#17384f] hover:bg-[#e7f2f8]"
              >
                <FaRightFromBracket /> Cerrar sesión
              </button>
            </div>

            {/* Foto de perfil con margen negativo para subirse al banner */}
            <div className="flex justify-between items-end -mt-16 md:-mt-20 mb-4">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-200 rounded-full border-4 border-white shadow-md flex items-center justify-center text-gray-500 overflow-hidden">
                {/* Acá iría tu <img src={...} /> */}
                <img src={logo} className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Nombre, Edad y Género */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {usuario.razonSocial}
              </h1>
            </div>

            {/* ========================================= */}
            {/* 3. BIOGRAFÍA                              */}
            {/* ========================================= */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-navy mb-3">Actividad: </h2>{" "}
              <p>{usuario.actividad}</p>
            </div>

            {/* ========================================= */}
            {/* 4. ENLACES Y CONTACTO (3 apartados)       */}
            {/* ========================================= */}
            <div className="mt-10 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold text-navy mb-5">
                Contacto y Enlaces
              </h2>

              {/* Grid para los 3 bloques */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Apartado 1: Número de teléfono */}
                <a
                  href="tel:+541112345678"
                  className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all group"
                >
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-primary">
                    Teléfono
                  </span>
                  <span className="text-gray-800 font-semibold">
                    {usuario.telefono}
                  </span>
                </a>

                {/* Apartado 2: Correo Electrónico */}
                <a
                  href="mailto:usuario@gmail.com"
                  className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all group"
                >
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-primary">
                    Correo Electrónico
                  </span>
                  <span className="text-gray-800 font-semibold truncate">
                    {usuario.email}
                  </span>
                </a>

                {/* Apartado 3: Sitio Web o LinkedIn */}
                <a
                  href="#"
                  target="_blank"
                  className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all group"
                >
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-primary">
                    Sitio Web
                  </span>
                  <span className="text-gray-800 font-semibold truncate">
                    {usuario.sitioWeb || "No disponible"}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
