import { useState, useEffect } from "react";
import Navbar from "../Components/Navbar.jsx";
import Loading from "../Components/Loading.jsx";

export default function Profile() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const usuarioString = localStorage.getItem("usuario")

    if (usuarioString) {
      setUsuario(JSON.parse(usuarioString))
    }
  }, [])

  if (!usuario) {
    return <div className="mt-32 text-center text-xl">Cargando perfil...</div>;
    <Loading />
  }


  return (
    <main className="min-h-screen bg-gray-100 font-sans pb-12">
      <Navbar />

      {/* 
        Contenedor general con padding-top para que el Navbar fijo no lo tape 
      */}
      <div className="pt-24 px-6 md:px-12 max-w-5xl mx-auto">

        {/* Tarjeta principal del perfil */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* ========================================= */}
          {/* 1. BANNER                                 */}
          {/* ========================================= */}
          {/* Podés reemplazar el bg-color por un bg-[url('...')] o una etiqueta <img> */}
          <div className="h-48 md:h-64 w-full bg-gradient-to-r from-[#132A46] to-[#1D7BB6]"></div>

          {/* ========================================= */}
          {/* 2. CABECERA DEL PERFIL (Foto + Info base) */}
          {/* ========================================= */}
          <div className="px-8 pb-8 relative">

            {/* Foto de perfil con margen negativo para subirse al banner */}
            <div className="flex justify-between items-end -mt-16 md:-mt-20 mb-4">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-200 rounded-full border-4 border-white shadow-md flex items-center justify-center text-gray-500 overflow-hidden">
                {/* Acá iría tu <img src={...} /> */}
                <span className="font-bold text-sm text-center px-2">Foto de<br />Perfil</span>
              </div>

              {/* Botón opcional para editar perfil */}
              <button className="bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-2 px-6 rounded-md transition-colors text-sm shadow-sm mb-2">
                Editar Perfil
              </button>
            </div>

            {/* Nombre, Edad y Género */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{usuario.razonSocial}</h1>
            </div>

            {/* ========================================= */}
            {/* 3. BIOGRAFÍA                              */}
            {/* ========================================= */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-[#132A46] mb-3">Biografía</h2>
              <p className="text-gray-700 leading-relaxed max-w-3xl">
                ¡Hola! Soy emprendedor y formo parte de la comunidad CAPYMEF desde hace 3 años. Me dedico al desarrollo de software y busco conectar con otros profesionales para intercambiar ideas, organizar eventos y potenciar nuestros proyectos comerciales. Siempre dispuesto a aprender y sumar valor.
              </p>
            </div>

            {/* ========================================= */}
            {/* 4. ENLACES Y CONTACTO (3 apartados)       */}
            {/* ========================================= */}
            <div className="mt-10 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold text-[#132A46] mb-5">Contacto y Enlaces</h2>

              {/* Grid para los 3 bloques */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Apartado 1: Número de teléfono */}
                <a
                  href="tel:+541112345678"
                  className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#1D7BB6] hover:shadow-md transition-all group"
                >
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-[#1D7BB6]">
                    Teléfono
                  </span>
                  <span className="text-gray-800 font-semibold">
                    {usuario.telefono}
                  </span>
                </a>

                {/* Apartado 2: Correo Electrónico */}
                <a
                  href="mailto:usuario@gmail.com"
                  className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#1D7BB6] hover:shadow-md transition-all group"
                >
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-[#1D7BB6]">
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
                  className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#1D7BB6] hover:shadow-md transition-all group"
                >
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-[#1D7BB6]">
                    Sitio Web
                  </span>
                  <span className="text-gray-800 font-semibold truncate">
                    www.miportafolio.com
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