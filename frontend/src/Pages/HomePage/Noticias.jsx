import { useState } from "react";
import Modal from "../../Components/Modal.jsx";
import Navbar from "../../Components/Navbar.jsx";

export default function Noticias() {
  const [noticiaOpen, setNoticiaOpen] = useState(false);

  return (
    <>
      <Navbar />
      <div className="p-10 font-sans min-h-screen bg-gray-50">
        {/*TITULO DE LA PAGE */}
        <h1 className="mt-7 text-center text-3xl font-bold text-[#132A46] mb-8">
          Últimas Noticias
        </h1>
        {/* HACE QUE LA WEB SEA ATRAVEZ DE Filas(infinito) y Columnas(2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
        </div>
      </div>
    </>
  );
}
