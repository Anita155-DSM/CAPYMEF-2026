import React, { useState } from 'react';
import { NavbarPublico } from "../../Components";
import { Footer } from "../../Components";

const estatutoData = [
  {
    id: 1,
    titulo: "TÍTULO I - OBJETIVOS Y FINES",
    texto: "Bajo la denominación de Cámara de Pequeñas y Medianas Empresas de Formosa (CA.P. y M.E.F.), queda constituida una asociación sin fines de lucro. Tiene por objeto brindar apoyo integral a la micro, pequeña y mediana empresa en todo el territorio provincial, fomentando el intercambio de información y promoviendo la integración con los programas de desarrollo económico nacional y regional."
  },
  {
    id: 2,
    titulo: "TÍTULO II - DE LOS SOCIOS",
    texto: "La CA.P. y M.E.F. estará integrada por Socios Activos, Adherentes y Honorarios. Para ingresar se requiere presentar una solicitud formal aprobada por la Comisión Directiva. La condición de socio se pierde por renuncia, quiebra, incumplimiento del estatuto, o por la falta de pago de tres cuotas consecutivas mensuales."
  },
  {
    id: 3,
    titulo: "TÍTULO III - DE LA COMISIÓN DIRECTIVA",
    texto: "La Cámara estará dirigida por la Comisión Directiva, compuesta por un presidente, un secretario, un tesorero, tres vocales titulares y dos suplentes. Los miembros durarán dos años en el ejercicio de sus funciones, no siendo este plazo limitado. Se requiere ser socio activo al día y tener una antigüedad no menor de un año para postularse."
  },
  {
    id: 4,
    titulo: "TÍTULO IV - DEL PRESIDENTE",
    texto: "El presidente preside la Comisión Directiva y las Asambleas, representa a la Cámara en todos sus actos, y firma toda la documentación y correspondencia juntamente con el Secretario, así como los documentos de crédito con el Tesorero."
  },
  {
    id: 5,
    titulo: "TÍTULO V - DEL SECRETARIO",
    texto: "El Secretario refrendará la firma del Presidente, es depositario del archivo, llevará los Libros de Actas de sesiones y asambleas, y es el jefe inmediato de todo el personal rentado de la Institución."
  },
  {
    id: 6,
    titulo: "TÍTULO VI - DEL TESORERO",
    texto: "Es el depositario de todos los fondos de la Cámara. Llevará los libros contables, presentará balances mensuales y el Balance General anual, firmando conjuntamente con el presidente todos los cheques y órdenes de pago."
  },
  {
    id: 7,
    titulo: "TÍTULO VII - DE LOS VOCALES TITULARES Y SUPLENTES",
    texto: "Corresponde a los Vocales Titulares asistir a Asambleas y sesiones con voz y voto. Los suplentes podrán concurrir con derecho a voz, pero integrarán la Comisión Directiva con voto solo en caso de sustituir a un titular."
  },
  {
    id: 8,
    titulo: "TÍTULO VIII - DEL GERENTE",
    texto: "Cargo rentado nombrado por la Comisión Directiva. Atenderá la oficina, llevará los Registros de Socios y Cobranzas, y auxiliará a los miembros durante el desarrollo de sesiones y asambleas."
  },
  {
    id: 9,
    titulo: "TÍTULO IX - DEL REVISOR DE CUENTAS",
    texto: "La Asamblea elegirá por un año a un Revisor de Cuentas Titular y un Suplente, quienes fiscalizarán los balances y aconsejarán su aprobación."
  },
  {
    id: 10,
    titulo: "TÍTULO X - DE LOS FONDOS SOCIALES",
    texto: "Los fondos se formarán con ingresos por cuotas de ingreso, mensualidades de socios, donaciones y todo otro ingreso proveniente de servicios implementados a favor de los socios."
  },
  {
    id: 11,
    titulo: "TÍTULO XI - DE LAS ASAMBLEAS",
    texto: "Anualmente, dentro de los noventa días del cierre de ejercicio (30 de junio), se convocará a Asamblea General Ordinaria. Las decisiones se toman por simple mayoría de los socios presentes con derecho a voto (se requiere 6 meses de antigüedad y cuotas al día)."
  },
  {
    id: 12,
    titulo: "TÍTULO XII - DISPOSICIONES TRANSITORIAS",
    texto: "Queda facultado el Presidente para gestionar la aprobación de estos Estatutos y autorizada la Comisión Directiva para aceptar sugerencias de la Dirección de Personas Jurídicas."
  },
  {
    id: 13,
    titulo: "TÍTULO XIII - REFORMA DEL ESTATUTO - DISOLUCIÓN – FUSIÓN",
    texto: "El Estatuto no podrá reformarse ni la Institución disolverse o fusionarse sin el voto favorable de los dos tercios de los votos emitidos en una Asamblea convocada al efecto."
  }
];

export default function Estatuto() {
  const [openId, setOpenId] = useState(null);

  const toggleAccordion = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <>
      <NavbarPublico />

      <main className="pt-32 pb-16 bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-[#1A4B76] sm:text-4xl">
              Estatuto Social
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Marco normativo y reglamentario de la Cámara de Pequeñas y Medianas Empresas de Formosa (CAPYMEF).
            </p>
          </div>

          <div className="flex justify-center mb-12">
          
            <a 
              href="/ESTATUTO.pdf" 
              download="Estatuto.pdf"
              className="flex items-center gap-2 bg-[#1F81B2] text-white px-6 py-3 rounded-md font-semibold transition-colors duration-300 hover:bg-[#1A4B76] shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar Estatuto Completo (PDF)
            </a>
          </div>

      
          <div className="space-y-4 mb-12">
            {estatutoData.map((item) => (
              <div 
                key={item.id} 
                className="border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full flex justify-between items-center p-5 bg-gray-50 hover:bg-gray-100 transition-colors text-left focus:outline-none"
                >
                  <span className="text-lg font-bold text-[#1A4B76]">
                    {item.titulo}
                  </span>
                  <span className={`text-[#1F81B2] transform transition-transform duration-300 ${openId === item.id ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                <div 
                  className={`transition-all duration-500 ease-in-out ${
                    openId === item.id ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-5 bg-white border-t border-gray-100 text-gray-700 leading-relaxed">
                    {item.texto}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}