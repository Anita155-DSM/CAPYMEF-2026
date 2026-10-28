import { useState } from "react";
import { FaEdit, FaFileExcel } from "react-icons/fa";
import { toast } from "sonner";
import Loading from "@/shared/ui/Loading";
import BuscadorSocios from "../components/BuscadorSocios";
import TablaSocios from "../components/TablaSocios";
import EditarSocioModal from "../components/EditarSocioModal";
import { useBuscador } from "../hooks/useBuscador";
import { useUsuarios } from "../hooks/useUsuarios";
import { exportarPadronExcel } from "../utils/exportarPadron";

// Los "pendientes" viven en Solicitudes.
const noPendiente = (u) => u.estado !== "pendiente";

const colorEstado = {
  aprobado: "bg-green-100 text-green-700",
  inactivo: "bg-red-100 text-red-700",
};

export default function PadronPage() {
  const { usuarios, cargando, recargar } = useUsuarios(noPendiente);
  const [socioAEditar, setSocioAEditar] = useState(null);
  const { filtros, dispatch, filtrados, opciones } = useBuscador(usuarios);

  const exportar = async () => {
    if (filtrados.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    await exportarPadronExcel(filtrados);
    toast.success("¡Archivo Excel descargado con éxito!");
  };

  const columnas = [
    { titulo: "Razón Social", className: "text-gray-800 font-medium", render: (s) => s.razonSocial },
    { titulo: "CUIT", render: (s) => s.cuit },
    { titulo: "Email", render: (s) => s.email },
    { titulo: "Categoría", className: "text-gray-600 capitalize", render: (s) => s.categoria },
    { titulo: "Rubro", render: (s) => s.rubro },
    { titulo: "Localidad", render: (s) => s.localidad },
    {
      titulo: "Estado",
      className: "",
      render: (s) => (
        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize shadow-sm ${colorEstado[s.estado] ?? "bg-yellow-100 text-red-700"}`}>
          {s.estado}
        </span>
      ),
    },
    {
      titulo: "Acciones",
      centrada: true,
      className: "",
      render: (s) => (
        <button
          onClick={() => setSocioAEditar(s)}
          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-colors shadow-sm"
          title="Editar datos del socio"
        >
          <FaEdit size={16} />
        </button>
      ),
    },
  ];

  if (cargando) return <div className="p-10"><Loading /></div>;

  return (
    <div className="px-3 pt-4 pb-6 sm:px-4 sm:pt-0 w-full font-sans relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
        <div className="grow w-full">
          <BuscadorSocios titulo="Padrón de Socios" filtros={filtros} dispatch={dispatch} opciones={opciones} />
        </div>
        <button
          onClick={exportar}
          className="flex w-full md:w-auto items-center justify-center gap-2 bg-[#107c41] hover:bg-[#0c5e31] text-white font-bold py-2.5 px-5 rounded-lg shadow-md transition-colors shrink-0"
        >
          <FaFileExcel className="text-xl" />
          Exportar a Excel
        </button>
      </div>

      <TablaSocios
        columnas={columnas}
        socios={filtrados}
        mensajeVacio={
          usuarios.length === 0
            ? "No hay usuarios registrados en la base de datos."
            : "No se encontraron coincidencias con los filtros aplicados."
        }
      />

      {socioAEditar && (
        <EditarSocioModal
          key={socioAEditar.id}
          socio={socioAEditar}
          onClose={() => setSocioAEditar(null)}
          onActualizado={recargar}
        />
      )}
    </div>
  );
}
