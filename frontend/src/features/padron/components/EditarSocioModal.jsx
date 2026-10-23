import { useState } from "react";
import { FaRegSave, FaUserSlash } from "react-icons/fa";
import { toast } from "sonner";
import { actualizarDatosSocio, darDeBajaSocio } from "@/services/adminServices";
import ModalShell from "@/shared/ui/ModalShell";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import Campo from "@/shared/ui/Campo";
import { inputClase, btnCancelarClase, btnGuardarClase } from "@/shared/ui/estilos";

/**
 * El padre lo renderiza solo con socio y con key, así el formulario
 * se reinicia solo al cambiar de socio (sin useEffect de sincronización):
 *   {socio && <EditarSocioModal key={socio.id} socio={socio} … />}
 */
export default function EditarSocioModal({ socio, onClose, onActualizado }) {
  // Solo los 4 campos que acepta el backend
  const [form, setForm] = useState({
    categoria: socio.categoria || "",
    rubro: socio.rubro || "",
    localidad: socio.localidad || "",
    estado: socio.estado || "aprobado",
  });
  const [procesando, setProcesando] = useState(false);
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const terminar = (result, okMsg, errPrefijo) => {
    if (result.exito) {
      toast.success(okMsg);
      onActualizado();
      onClose();
    } else {
      toast.error(errPrefijo + result.mensaje);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcesando(true);
    const result = await actualizarDatosSocio(socio.id, form);
    setProcesando(false);
    terminar(result, "Datos del socio actualizados correctamente.", "Error: ");
  };

  const handleInactivar = async () => {
    setProcesando(true);
    const result = await darDeBajaSocio(socio.id);
    setProcesando(false);
    setConfirmandoBaja(false);
    terminar(result, `El socio ${socio.razonSocial} ha sido inactivado.`, "Error al inactivar: ");
  };

  return (
    <>
      <ModalShell titulo={`Editar Socio: ${socio.razonSocial}`} onClose={onClose} ancho="max-w-2xl">
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Información de contacto (No editable)</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
              <p><strong>CUIT:</strong> {socio.cuit}</p>
              <p><strong>Email:</strong> {socio.email}</p>
              <p><strong>Teléfono:</strong> {socio.telefono}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Categoría">
              <select name="categoria" value={form.categoria} onChange={handleChange} className={inputClase}>
                <option value="activo">Activo</option>
                <option value="adherente">Adherente</option>
                <option value="padrino">Padrino</option>
              </select>
            </Campo>
            <Campo label="Rubro">
              <select name="rubro" value={form.rubro} onChange={handleChange} className={inputClase}>
                <option value="Comercio">Comercio</option>
                <option value="Industria">Industria</option>
                <option value="Servicios">Servicios</option>
                <option value="Agropecuario">Agropecuario</option>
                <option value="Otro">Otro</option>
              </select>
            </Campo>
            <Campo label="Localidad">
              <input type="text" name="localidad" value={form.localidad} onChange={handleChange} required className={inputClase} />
            </Campo>
            <Campo label="Estado del Socio">
              <select name="estado" value={form.estado} onChange={handleChange} className={inputClase}>
                <option value="aprobado">Aprobado (Activo)</option>
                <option value="inactivo">Inactivo (Suspendido)</option>
              </select>
            </Campo>
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
            {form.estado !== "inactivo" ? (
              <button
                type="button"
                onClick={() => setConfirmandoBaja(true)}
                disabled={procesando}
                className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white font-semibold rounded-md flex items-center gap-2 text-sm transition-colors"
              >
                <FaUserSlash /> Dar de baja
              </button>
            ) : (
              <span className="text-red-500 font-bold text-sm bg-red-50 px-3 py-1 rounded">Este socio está dado de baja</span>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className={btnCancelarClase}>Cancelar</button>
              <button type="submit" disabled={procesando} className={btnGuardarClase}>
                <FaRegSave /> {procesando ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </form>
      </ModalShell>

      <ConfirmDialog
        isOpen={confirmandoBaja}
        icono={FaUserSlash}
        titulo="¿Dar de baja al socio?"
        mensaje={`Vas a INACTIVAR a ${socio.razonSocial}.`}
        textoConfirmar="Dar de baja"
        onCancelar={() => setConfirmandoBaja(false)}
        onConfirmar={handleInactivar}
      />
    </>
  );
}
