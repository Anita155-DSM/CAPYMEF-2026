import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FaAddressBook,
  FaAward,
  FaBuilding,
  FaChartBar,
  FaChartLine,
  FaEnvelope,
  FaGears,
  FaIdCard,
  FaLocationDot,
  FaLock,
  FaPenToSquare,
  FaPhone,
} from "react-icons/fa6";
import ContactoModal from "../components/empresa/ContactoModal";
import EncabezadoEmpresa from "../components/empresa/EncabezadoEmpresa";
import SolicitudModificacionModal from "../components/empresa/SolicitudModificacionModal";
import TarjetaConstancia from "../components/empresa/TarjetaConstancia";
import TarjetaFicha from "../components/empresa/TarjetaFicha";
import { mayuscula } from "../utils/cuotas";
import { etiquetaTamano } from "../utils/empresa";

export default function EmpresaSocioPage() {
  // Todo viene del SocioLayout (perfil fresco del backend)
  const { usuario, actualizarUsuario, cargandoPerfil } = useOutletContext();
  const [modal, setModal] = useState(null); // "institucional" | "contacto" | null
  const cerrar = () => setModal(null);

  // 8 datos institucionales en grilla de 2 por fila (4 filas de 2)
  const institucionales = [
    { icono: FaBuilding, etiqueta: "Razón social", valor: usuario.razonSocial },
    { icono: FaIdCard, etiqueta: "CUIT", valor: usuario.cuit, copiable: true },
    { icono: FaAward, etiqueta: "Categoría", valor: mayuscula(usuario.categoria) || "Socio" },
    { icono: FaGears, etiqueta: "Rubro", valor: usuario.rubro },
    { icono: FaChartBar, etiqueta: "Tamaño de la empresa", valor: etiquetaTamano(usuario.tamano_empresa) },
    { icono: FaChartLine, etiqueta: "Actividad", valor: usuario.actividad },
    { icono: FaEnvelope, etiqueta: "Correo electrónico", valor: usuario.email, copiable: true },
    { icono: FaLocationDot, etiqueta: "Localidad", valor: usuario.localidad },
  ];

  // Contacto directo con Teléfono y Correo electrónico (2 filas que equilibran la altura con la columna izquierda)
  const contacto = [
    { icono: FaPhone, etiqueta: "Teléfono", valor: usuario.telefono, copiable: true },
    { icono: FaEnvelope, etiqueta: "Correo electrónico", valor: usuario.email, copiable: true },
  ];

  const pieInstitucional = (
    <div className="flex flex-col gap-3 border-t border-slate-100 bg-surface/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs text-slate-600 sm:text-sm">
        Estos datos son administrados por CAPYMEF. ¿Necesitás actualizar alguno?
      </p>
      <button
        type="button"
        onClick={() => setModal("institucional")}
        className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/25 bg-white px-4 py-2 text-xs font-semibold text-primary shadow-2xs transition-colors hover:bg-surface-blue sm:text-sm"
      >
        Solicitar modificación
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <EncabezadoEmpresa usuario={usuario} />

      {/* Las dos columnas tienen la misma cantidad de bloques equivalentes y terminan alineadas sin huecos */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <TarjetaFicha
          titulo="Datos institucionales"
          icono={FaBuilding}
          insignia={
            <span className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200/80 bg-surface px-3 py-1 text-xs font-medium text-slate-500 sm:inline-flex">
              <FaLock className="text-[10px] text-primary" /> Solo administración
            </span>
          }
          datos={institucionales}
          cargando={cargandoPerfil}
          pie={pieInstitucional}
        />

        <div className="flex flex-col gap-6">
          <TarjetaFicha
            titulo="Contacto directo"
            icono={FaAddressBook}
            accion={{ texto: "Editar", icono: FaPenToSquare, onClick: () => setModal("contacto") }}
            columnas={1}
            datos={contacto}
            cargando={cargandoPerfil}
          />
          <TarjetaConstancia url={usuario.constanciaUrl} cargando={cargandoPerfil} className="flex-1" />
        </div>
      </div>

      {modal === "institucional" && <SolicitudModificacionModal usuario={usuario} onClose={cerrar} />}
      {modal === "contacto" && <ContactoModal usuario={usuario} onGuardado={actualizarUsuario} onClose={cerrar} />}
    </div>
  );
}
