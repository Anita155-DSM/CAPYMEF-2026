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
import ContactoModal from "../components/ContactoModal";
import EncabezadoEmpresa from "../components/EncabezadoEmpresa";
import SolicitudModificacionModal from "../components/SolicitudModificacionModal";
import TarjetaConstancia from "../components/TarjetaConstancia";
import TarjetaFicha from "../components/TarjetaFicha";
import { mayuscula } from "../utils/cuotas";
import { etiquetaTamano } from "../utils/empresa";

export default function EmpresaSocioPage() {
  // Todo viene del SocioLayout (perfil fresco del backend + cuotas)
  const { usuario, actualizarUsuario, cuotas, errorCuotas } = useOutletContext();
  const [modal, setModal] = useState(null); // "institucional" | "contacto" | null
  const cerrar = () => setModal(null);

  // Datos que solo cambia la administración
  const institucionales = [
    { icono: FaBuilding, etiqueta: "Razón social", valor: usuario.razonSocial, completo: true },
    { icono: FaIdCard, etiqueta: "CUIT", valor: usuario.cuit, copiable: true },
    { icono: FaAward, etiqueta: "Categoría", valor: mayuscula(usuario.categoria) || "Socio" },
    { icono: FaGears, etiqueta: "Rubro", valor: usuario.rubro },
    { icono: FaChartBar, etiqueta: "Tamaño de la empresa", valor: etiquetaTamano(usuario.tamano_empresa) },
    { icono: FaChartLine, etiqueta: "Actividad", valor: usuario.actividad, completo: true },
  ];

  // Teléfono y localidad los edita el propio socio (PUT /auth/perfil); el correo no
  const contacto = [
    { icono: FaPhone, etiqueta: "Teléfono", valor: usuario.telefono, copiable: true },
    { icono: FaEnvelope, etiqueta: "Correo electrónico", valor: usuario.email, copiable: true },
    { icono: FaLocationDot, etiqueta: "Localidad", valor: usuario.localidad },
  ];

  const pieInstitucional = (
    <div className="flex flex-col gap-3 border-t border-gray-100 bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-sm text-gray-600">Estos datos los mantiene la administración de CAPYMEF. ¿Algo está incorrecto?</p>
      <button
        type="button"
        onClick={() => setModal("institucional")}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface-blue"
      >
        Solicitar modificación
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <EncabezadoEmpresa usuario={usuario} cuotas={cuotas} errorCuotas={errorCuotas} />

      {/* Sin items-start: las dos columnas miden lo mismo y sus tarjetas terminan a la misma altura */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <TarjetaFicha
          titulo="Datos institucionales"
          icono={FaBuilding}
          // La insignia se oculta en celular (hidden sm:inline-flex): el pie de la tarjeta ya lo explica
          insignia={
            <span className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-surface px-3 py-1 text-xs font-semibold text-gray-500 sm:inline-flex">
              <FaLock className="text-[10px]" /> Solo administración
            </span>
          }
          datos={institucionales}
          pie={pieInstitucional}
        />

        <div className="flex flex-col gap-6">
          <TarjetaFicha
            titulo="Contacto"
            icono={FaAddressBook}
            accion={{ texto: "Editar", icono: FaPenToSquare, onClick: () => setModal("contacto") }}
            columnas={1}
            datos={contacto}
          />
          <TarjetaConstancia url={usuario.constanciaUrl} className="flex-1" />
        </div>
      </div>

      {modal === "institucional" && <SolicitudModificacionModal usuario={usuario} onClose={cerrar} />}
      {modal === "contacto" && <ContactoModal usuario={usuario} onGuardado={actualizarUsuario} onClose={cerrar} />}
    </div>
  );
}