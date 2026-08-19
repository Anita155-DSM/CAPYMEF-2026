import React, { useState } from 'react';
import { NavbarPublico } from "../../Components";
import { Footer } from "../../Components";

const balancesHistoricos = [
  { año: "2011", ingresos: 102330, egresos: 83698, max: 150000 },
  { año: "2014", ingresos: 628164, egresos: 629172, max: 700000 },
  { año: "2016", ingresos: 658634, egresos: 563103, max: 700000 },
  { año: "2023", ingresos: 8719299, egresos: 7631738, max: 9000000 }
];

export default function Balance() {
  const [hoveredYear, setHoveredYear] = useState(null);


  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <>
      <NavbarPublico />

      <main className="pt-32 pb-16 bg-white min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-[#1A4B76] sm:text-4xl">
              Transparencia Financiera
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Evolución histórica de los recursos y gastos de la Cámara.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white border-t-4 border-[#1F81B2] rounded-lg shadow-sm p-6 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Último Ejercicio (2023)</p>
              <p className="mt-2 text-3xl font-bold text-[#1A4B76]">{formatCurrency(8719299)}</p>
              <p className="mt-1 text-sm text-[#1F81B2] font-medium">Total Recursos</p>
            </div>
            <div className="bg-white border-t-4 border-[#D50000] rounded-lg shadow-sm p-6 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Gastos Operativos (2023)</p>
              <p className="mt-2 text-3xl font-bold text-gray-700">{formatCurrency(7631738)}</p>
              <p className="mt-1 text-sm text-[#D50000] font-medium">Total Egresos</p>
            </div>
            <div className="bg-white border-t-4 border-green-500 rounded-lg shadow-sm p-6 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Superávit (2023)</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{formatCurrency(69779)}</p>
              <p className="mt-1 text-sm text-green-500 font-medium">Resultado Positivo</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-8 shadow-inner mb-12">
            <h3 className="text-xl font-bold text-[#1A4B76] mb-8 text-center">Evolución de Ingresos vs Egresos</h3>
            
            <div className="flex flex-col md:flex-row justify-center items-end gap-8 h-64">
              {balancesHistoricos.map((data, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center group cursor-pointer w-full md:w-auto"
                  onMouseEnter={() => setHoveredYear(data.año)}
                  onMouseLeave={() => setHoveredYear(null)}
                >
          
                  <div className={`mb-2 text-xs font-bold px-2 py-1 rounded bg-white shadow-md border border-gray-200 transition-opacity duration-300 ${hoveredYear === data.año ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-[#1A4B76]">IN: {formatCurrency(data.ingresos)}</span><br/>
                    <span className="text-[#D50000]">EG: {formatCurrency(data.egresos)}</span>
                  </div>

              
                  <div className="flex items-end gap-2 w-24 h-48 bg-white border border-gray-200 rounded-t-md p-1 relative overflow-hidden">
                    <div 
                      className="w-1/2 bg-[#1A4B76] rounded-t-sm transition-all duration-700 ease-out group-hover:bg-[#1F81B2]"
                      style={{ height: `${(data.ingresos / data.max) * 100}%` }}
                    ></div>
              
                    <div 
                      className="w-1/2 bg-[#D50000] rounded-t-sm transition-all duration-700 ease-out group-hover:bg-[#A30000]"
                      style={{ height: `${(data.egresos / data.max) * 100}%` }}
                    ></div>
                  </div>
                  <span className="mt-3 font-bold text-gray-600 group-hover:text-[#1A4B76] transition-colors">{data.año}</span>
                </div>
              ))}
            </div>
            
         
            <div className="flex justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#1A4B76] rounded-full"></div>
                <span className="text-sm text-gray-600 font-medium">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#D50000] rounded-full"></div>
                <span className="text-sm text-gray-600 font-medium">Egresos</span>
              </div>
            </div>
          </div>

     
          <div className="flex justify-center">
            <a 
              href="/Balance2011-2025_compressed.pdf" 
              download="BALANCE.pdf"
              className="flex items-center gap-2 bg-[#1F81B2] text-white px-6 py-3 rounded-md font-semibold transition-colors duration-300 hover:bg-[#1A4B76] shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar Balance Completo (PDF)
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}