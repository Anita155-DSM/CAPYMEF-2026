import React from 'react';
import { NavbarPublico } from "../../Components";
import { Footer } from "../../Components";

const autoridadesData = [
  { id: 1, cargo: "Presidente", nombre: "Carlos A. Werlen" },
  { id: 2, cargo: "Secretario", nombre: "Antonio Fabian Hryniewicz" },
  { id: 3, cargo: "Tesorero", nombre: "Mónica Guadalupe Lozano" },
  { id: 4, cargo: "Vocal 1° Titular", nombre: "Federico Javier Domínguez" },
  { id: 5, cargo: "Vocal 2° Titular", nombre: "Walter Ramón Arauz" },
  { id: 6, cargo: "Vocal 3° Titular", nombre: "Marcelo Enrique Zanín" },
  { id: 7, cargo: "Vocal 1° Suplente", nombre: "Jorge Ernesto Miani" },
  { id: 8, cargo: "Vocal 2° Suplente", nombre: "Ramón Obdulio Centurión" },
  { id: 9, cargo: "Revisor de Cuentas Titular", nombre: "Sergio Eduardo Alloi" },
  { id: 10, cargo: "Revisor de Cuentas Suplente", nombre: "Augusto Eduardo Boggiano" }
];

export default function Autoridades() {
  return (
    <>
      <NavbarPublico />

      <main className="pt-32 pb-12 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
   
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-[#1A4B76] sm:text-4xl">
              Autoridades de la Cámara
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Conocé a la Comisión Directiva que impulsa el crecimiento de las PyMEs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {autoridadesData.map((autoridad) => (
              <div 
                key={autoridad.id} 
            
                className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl border-t-4 border-[#1F81B2]"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full mb-4 flex items-center justify-center text-gray-400">
                  <span className="text-2xl font-bold">{autoridad.nombre.charAt(0)}</span>
                </div>
                
                <h3 className="text-xl font-bold text-[#1A4B76] mb-1">{autoridad.nombre}</h3>
                <p className="text-sm font-medium text-[#1F81B2] border border-[#1F81B2] px-3 py-1 rounded-full mt-2">
                  {autoridad.cargo}
                </p>
              </div>
            ))}
          </div>

        </div>
      </main>
      <Footer />
      </>
  );
}