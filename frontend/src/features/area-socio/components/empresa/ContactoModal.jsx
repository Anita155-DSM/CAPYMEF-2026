import { useState } from "react";
import { FaAddressBook, FaXmark } from "react-icons/fa6";
import { toast } from "sonner";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import { actualizarMisDatosContacto } from "@/services/socioServices";
import { validarTelefono } from "../../utils/contacto";

/** Edita teléfono y localidad (PUT /auth/perfil). Renderizar solo cuando está abierto: {abierto && <ContactoModal … />} */
export default function ContactoModal({ usuario, onGuardado, onClose }) {
  const [contacto, setContacto] = useState({
    telefono: usuario.telefono || "",
    localidad: usuario.localidad || "",
  });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  useBloquearScroll();

  const cambiar = (campo) => (e) =>
    setContacto((actual) => ({ ...actual, [campo]: e.target.value }));
  const cerrar = () => !guardando && onClose();

  const guardar = async (e) => {
    e.preventDefault();
    const datos = {
      telefono: contacto.telefono.trim(),
      localidad: contacto.localidad.trim() || usuario.localidad || "",
    };
    const invalido = validarTelefono(datos.telefono);
    if (invalido) return setError(invalido);

    setGuardando(true);
    setError("");
    const resultado = await actualizarMisDatosContacto(datos);
    setGuardando(false);

    if (!resultado.exito) {
      return setError(resultado.mensaje || "No se pudieron guardar los cambios.");
    }
    onGuardado(resultado.data || datos);
    toast.success("Datos de contacto actualizados.");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs"
      onMouseDown={(e) => e.target === e.currentTarget && cerrar()}
    >
      <div
        className="animacion-modal w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Modificar datos de contacto"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-blue text-primary">
              <FaAddressBook />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Contacto directo
              </p>
              <h3 className="text-lg font-semibold text-navy">Modificar contacto</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors hover:bg-surface hover:text-navy"
          >
            <FaXmark className="text-xl" />
          </button>
        </div>

        <form onSubmit={guardar} noValidate className="mt-5 flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-slate-600">
            Podés actualizar tu teléfono y localidad. Para cambiar el correo electrónico (con el que iniciás sesión), solicitalo a la administración.
          </p>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Teléfono
            </label>
            <input
              type="tel"
              autoComplete="tel"
              maxLength={20}
              value={contacto.telefono}
              onChange={cambiar("telefono")}
              className="w-full rounded-xl border border-slate-200 bg-surface/60 px-3.5 py-2.5 text-sm font-medium text-navy outline-none transition-colors focus:border-primary focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Localidad
            </label>
            <input
              type="text"
              maxLength={100}
              value={contacto.localidad}
              onChange={cambiar("localidad")}
              className="w-full rounded-xl border border-slate-200 bg-surface/60 px-3.5 py-2.5 text-sm font-medium text-navy outline-none transition-colors focus:border-primary focus:bg-white"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={cerrar}
              disabled={guardando}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-surface hover:text-navy disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="cursor-pointer rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
