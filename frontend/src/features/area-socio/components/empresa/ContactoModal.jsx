import { useState } from "react";
import { toast } from "sonner";
import ModalShell from "@/shared/ui/ModalShell";
import Campo from "@/shared/ui/Campo";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import { btnCancelarClase, btnGuardarClase, inputClase } from "@/shared/ui/estilos";
import { actualizarMisDatosContacto } from "@/services/socioServices";
import { validarTelefono } from "../../utils/contacto";

/** Edita solo el teléfono. Renderizar solo cuando está abierto: {abierto && <ContactoModal … />} */
export default function ContactoModal({ usuario, onGuardado, onClose }) {
  const [contacto, setContacto] = useState({ telefono: usuario.telefono || "" });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  useBloquearScroll();

  const cambiar = (campo) => (e) => setContacto((actual) => ({ ...actual, [campo]: e.target.value }));
  const cerrar = () => !guardando && onClose();

  const guardar = async (e) => {
    e.preventDefault();
    // La localidad no se edita acá: se reenvía la que ya tiene el socio
    const datos = { telefono: contacto.telefono.trim(), localidad: usuario.localidad || "" };
    const invalido = validarTelefono(datos.telefono);
    if (invalido) return setError(invalido);

    setGuardando(true);
    setError("");
    const resultado = await actualizarMisDatosContacto(datos);
    setGuardando(false);

    if (!resultado.exito) return setError(resultado.mensaje || "No se pudieron guardar los cambios.");
    onGuardado(resultado.data || datos);
    toast.success("Datos de contacto actualizados.");
    onClose();
  };

  return (
    <ModalShell titulo="Modificar teléfono" onClose={cerrar} ancho="max-w-lg">
      <form onSubmit={guardar} noValidate className="flex flex-col gap-4 p-6">
        <p className="text-sm text-gray-600">Podés actualizar tu número de teléfono. Para cambiar el correo electrónico o la localidad solicitalo a la administración.</p>
        <Campo label="Teléfono">
          <input type="tel" autoComplete="tel" maxLength={20} value={contacto.telefono} onChange={cambiar("telefono")} className={inputClase} />
        </Campo>
        {error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={cerrar} disabled={guardando} className={btnCancelarClase}>Cancelar</button>
          <button type="submit" disabled={guardando} className={btnGuardarClase}>{guardando ? "Guardando..." : "Guardar cambios"}</button>
        </div>
      </form>
    </ModalShell>
  );
}
