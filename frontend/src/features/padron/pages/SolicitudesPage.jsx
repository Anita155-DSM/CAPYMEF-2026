import { useState } from "react";
import { toast } from "sonner";
import Loading from "@/shared/ui/Loading";
import { gestionarEstadoSolicitud } from "@/services/adminServices";
import BuscadorSocios from "../components/BuscadorSocios";
import TablaSocios from "../components/TablaSocios";
import RevisarSolicitudModal from "../components/RevisarSolicitudModal";
import { useBuscador } from "../hooks/useBuscador";
import { useUsuarios } from "../hooks/useUsuarios";

const soloPendientes = (u) => u.estado === "pendiente";

export default function SolicitudesPage() {
  const { usuarios: solicitudes, setUsuarios, cargando } = useUsuarios(soloPendientes);
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const { filtros, dispatch, filtrados, opciones } = useBuscador(solicitudes);

  const handleDecision = async (id, decision) => {
    setProcesando(true);
    const result = await gestionarEstadoSolicitud(id, decision);
    setProcesando(false);

    if (result.exito) {
      toast.success(`¡Solicitud ${decision} con éxito!`);
      setUsuarios((prev) => prev.filter((s) => s.id !== id));
      setSocioSeleccionado(null);
    } else {
      toast.error("Error: " + result.mensaje);
    }
  };

  const columnas = [
    { titulo: "Razón Social", className: "text-gray-800 font-medium", render: (s) => s.razonSocial },
    { titulo: "CUIT", render: (s) => s.cuit },
    { titulo: "Email", render: (s) => s.email },
    { titulo: "Categoría", className: "text-gray-600 capitalize", render: (s) => s.categoria },
    { titulo: "Rubro", render: (s) => s.rubro },
    { titulo: "Localidad", render: (s) => s.localidad },
    {
      titulo: "Teléfono",
      className: "",
      render: (s) => <p className="text-primary text-sm font-semibold">{s.telefono}</p>,
    },
    {
      titulo: "Acciones",
      centrada: true,
      className: "",
      render: (s) => (
        <button
          onClick={() => setSocioSeleccionado(s)}
          className="bg-primary hover:bg-navy text-white font-semibold py-1.5 px-4 rounded text-sm transition-colors shadow-sm"
        >
          Revisar
        </button>
      ),
    },
  ];

  if (cargando) return <div className="p-10 text-xl font-bold text-navy"><Loading /></div>;

  return (
    <div className="px-4 w-full font-sans relative">
      <BuscadorSocios titulo="Solicitudes de Registro Pendientes" filtros={filtros} dispatch={dispatch} opciones={opciones} />

      <TablaSocios
        columnas={columnas}
        socios={filtrados}
        mensajeVacio={
          solicitudes.length === 0
            ? "No hay solicitudes pendientes de revisión en este momento."
            : "No se encontraron solicitudes con los filtros aplicados."
        }
      />

      {socioSeleccionado && (
        <RevisarSolicitudModal
          key={socioSeleccionado.id}
          socio={socioSeleccionado}
          onClose={() => setSocioSeleccionado(null)}
          onDecision={handleDecision}
          procesando={procesando}
        />
      )}
    </div>
  );
}
