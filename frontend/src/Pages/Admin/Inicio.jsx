import { useState, useEffect } from "react";
import {
  FaHandHoldingUsd,
  FaExclamationTriangle,
  FaChalkboardTeacher,
} from "react-icons/fa";
import MainLayout from "../../layouts/MainLayout";
import Navbar from "../../Components/Navbar";
// Importamos tu servicio
import { obtenerTodosLosUsuarios } from "../../services/adminServices"; 

export default function Inicio() {
  // 1. Creamos un estado para guardar nuestros contadores
  const [conteoSocios, setConteoSocios] = useState({
    total: 0,
    activos: 0,
    padrinos: 0,
    adherentes: 0,
  });

  // 2. Usamos useEffect para ir a buscar la info apenas carga el Dashboard
  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        const result = await obtenerTodosLosUsuarios();

        if (result.exito) {
          // Filtramos solo los usuarios que ya son parte oficial de la cámara (aprobados)
          const sociosAprobados = result.data.filter(socio => socio.estado === 'aprobado');

          // Contamos cuántos hay de cada categoría (pasamos a minúscula por si acaso)
          const activos = sociosAprobados.filter(s => s.categoria?.toLowerCase() === 'activo').length;
          const padrinos = sociosAprobados.filter(s => s.categoria?.toLowerCase() === 'padrino').length;
          const adherentes = sociosAprobados.filter(s => s.categoria?.toLowerCase() === 'adherente').length;

          // Guardamos los números reales en el estado
          setConteoSocios({
            total: sociosAprobados.length,
            activos,
            padrinos,
            adherentes
          });
        }
      } catch (error) {
        console.error("Error al cargar estadísticas de socios:", error);
      }
    };

    cargarEstadisticas();
  }, []);

  return (
    <>
      <div className="p-10 flex flex-col items-center">
        
        {/* TARJETA PRINCIPAL: SOCIOS */}
        <div className="bg-[#2673A6] w-full max-w-4xl rounded-[2rem] p-8 text-white shadow-md">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold tracking-widest mb-1 uppercase">
              SOCIOS
            </h2>
            {/* 3. Reemplazamos el número duro por nuestro estado dinámico */}
            <p className="text-6xl font-bold">{conteoSocios.total}</p>
          </div>

          <div className="flex justify-around items-center border-t border-white/30 pt-6 relative">
            <div className="text-center w-1/3">
              <h3 className="text-xs font-bold tracking-widest mb-1 uppercase">
                ACTIVOS
              </h3>
              <p className="text-4xl font-bold">{conteoSocios.activos}</p>
            </div>
            <div className="absolute left-1/3 h-16 w-px bg-white/30"></div>
            
            <div className="text-center w-1/3">
              <h3 className="text-xs font-bold tracking-widest mb-1 uppercase">
                PADRINOS
              </h3>
              <p className="text-4xl font-bold">{conteoSocios.padrinos}</p>
            </div>
            <div className="absolute right-1/3 h-16 w-px bg-white/30"></div>
            
            <div className="text-center w-1/3">
              <h3 className="text-xs font-bold tracking-widest mb-1 uppercase">
                ADHERENTES
              </h3>
              <p className="text-4xl font-bold">{conteoSocios.adherentes}</p>
            </div>
          </div>
        </div>

        {/* 3 TARJETAS INFERIORES (Aún hardcodeadas, se conectarán en la Épica 2) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mt-16">
          {/* Tarjeta 1 */}
          <div className="bg-white rounded-3xl p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 relative pt-14">
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[#1B4F7A] text-white p-5 rounded-full shadow-lg">
              <FaHandHoldingUsd className="text-4xl" />
            </div>
            <h3 className="text-gray-500 font-bold tracking-wider text-xs h-8 flex items-center justify-center uppercase">
              RECAUDACIÓN DEL MES
            </h3>
            <p className="text-[28px] font-bold text-gray-600 mb-1">
              $1.850.000
            </p>
            <p className="text-[11px] text-gray-400 font-medium">
              82% de las cuotas cobradas
            </p>
          </div>

          {/* Tarjeta 2 */}
          <div className="bg-white rounded-3xl p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 relative pt-14">
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[#1B4F7A] text-white p-5 rounded-full shadow-lg">
              <FaExclamationTriangle className="text-4xl" />
            </div>
            <h3 className="text-gray-500 font-bold tracking-wider text-xs h-8 flex items-center justify-center uppercase">
              ÍNDICE DE MOROSIDAD
            </h3>
            <p className="text-[28px] font-bold text-gray-600 mb-1">18%</p>
            <p className="text-[11px] text-gray-400 font-medium leading-tight">
              12 socios en riesgo
              <br />
              (2 cuotas impagas)
            </p>
          </div>

          {/* Tarjeta 3 */}
          <div className="bg-white rounded-3xl p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 relative pt-14">
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[#1B4F7A] text-white p-5 rounded-full shadow-lg">
              <FaChalkboardTeacher className="text-4xl" />
            </div>
            <h3 className="text-gray-500 font-bold tracking-wider text-xs h-8 flex items-center justify-center uppercase">
              PRÓXIMA CAPACITACIÓN
            </h3>
            <p className="text-[28px] font-bold text-gray-600 mb-1">28/8</p>
            <p className="text-[11px] text-gray-400 font-medium">
              38/50 cupos inscriptos
            </p>
          </div>
        </div>
      </div>
    </>
  );
}