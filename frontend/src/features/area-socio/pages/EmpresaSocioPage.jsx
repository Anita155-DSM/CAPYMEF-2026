import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FaBuilding, FaChartBar, FaChartLine, FaEnvelope, FaGears, FaIdCard, FaLocationDot, FaPhone, FaUsers } from "react-icons/fa6";
import ContactoModal from "../components/ContactoModal";
import DatoFicha from "../components/DatoFicha";
import SolicitudModificacionModal from "../components/SolicitudModificacionModal";
import { mayuscula } from "../utils/cuotas";

const btnFicha = "border border-[#d7e0e5] bg-[#f4f9fc] px-2 py-2 text-sm text-[#17384f] hover:bg-[#e7f2f8]";

export default function EmpresaSocioPage() {
  const { usuario, actualizarUsuario } = useOutletContext();
  const [modal, setModal] = useState(null); // "institucional" | "contacto" | null
  const cerrar = () => setModal(null);

  const nombreEmpresa = usuario.razonSocial || "Tu empresa";
  const tamano = usuario.tamano_empresa === "Pequena" ? "Pequeña" : usuario.tamano_empresa;

  const institucionales = [
    [FaBuilding, "Empresa", usuario.razonSocial],
    [FaIdCard, "CUIT", usuario.cuit],
    [FaUsers, "Categoría", mayuscula(usuario.categoria) || "Socio"],
    [FaGears, "Rubro", usuario.rubro],
    [FaChartLine, "Actividad", usuario.actividad],
    [FaChartBar, "Tamaño de la empresa", tamano],
    [FaLocationDot, "Localidad", usuario.localidad],
  ];
  const contacto = [
    [FaPhone, "Teléfono", usuario.telefono],
    [FaEnvelope, "Correo electrónico", usuario.email],
  ];

  return (
    <section className="min-h-[calc(100vh-9rem)] bg-[#edf7fd] px-1 py-2 sm:px-3 sm:py-5">
      <div className="mb-3">
        <h1 className="text-2xl font-normal uppercase text-[#073d6f] sm:text-[25px]">Mi empresa</h1>
        <p className="text-sm text-[#6b7884]">Ficha de {nombreEmpresa}</p>
      </div>

      <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(400px,1fr)]">
        <Ficha titulo="Datos institucionales" boton="Solicitar modificación" onBoton={() => setModal("institucional")} datos={institucionales} redondeada />
        <Ficha titulo="Contacto" boton="Modificar" onBoton={() => setModal("contacto")} datos={contacto} quebrar />
      </div>

      {modal === "institucional" && <SolicitudModificacionModal usuario={usuario} onClose={cerrar} />}
      {modal === "contacto" && <ContactoModal usuario={usuario} onGuardado={actualizarUsuario} onClose={cerrar} />}
    </section>
  );
}

function Ficha({ titulo, boton, onBoton, datos, quebrar, redondeada }) {
  return (
    <div className={`border border-[#d9d9d9] bg-white px-3 py-5 sm:px-4 ${redondeada ? "rounded-[25px]" : ""}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold uppercase text-[#34414c]">{titulo}</h2>
        <button type="button" onClick={onBoton} className={btnFicha}>{boton}</button>
      </div>
      {datos.map(([icono, etiqueta, valor]) => (
        <DatoFicha key={etiqueta} icono={icono} etiqueta={etiqueta} valor={valor} quebrar={quebrar} />
      ))}
    </div>
  );
}
