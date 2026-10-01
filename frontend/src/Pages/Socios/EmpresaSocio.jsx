import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FaBuilding,
  FaChartBar,
  FaChartLine,
  FaEnvelope,
  FaGears,
  FaIdCard,
  FaLocationDot,
  FaPhone,
  FaUsers,
} from "react-icons/fa6";
import { toast } from "sonner";
import { actualizarMisDatosContacto } from "../../services/socioServices";

const EMAIL_CAPYMEF = "info@capymef.ar";
const LARGO_MAXIMO_SOLICITUD = 1000;

// Mismas restricciones que las columnas del modelo User (telefono STRING(20), localidad STRING(100)).
// El PUT /auth/perfil no tiene validador en el backend, así que validamos acá antes de mandar.
const validarContacto = ({ telefono, localidad }) => {
  if (!/^[+\d\s()-]{6,20}$/.test(telefono)) return "Ingresá un teléfono válido (solo números, espacios, +, - o paréntesis; entre 6 y 20 caracteres).";
  if (!/^[\p{L}\s.'-]{2,100}$/u.test(localidad)) return "Ingresá una localidad válida (solo letras; entre 2 y 100 caracteres).";
  return "";
};

export default function EmpresaSocio() {
  const { usuario, actualizarUsuario } = useOutletContext();
  const [modal, setModal] = useState(null); // "institucional" | "contacto" | null
  const [detalleSolicitud, setDetalleSolicitud] = useState("");
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [contacto, setContacto] = useState({ telefono: "", localidad: "" });
  const [errorContacto, setErrorContacto] = useState("");
  const [guardando, setGuardando] = useState(false);

  const nombreEmpresa = usuario.razonSocial || "Tu empresa";
  const categoria = usuario.categoria ? usuario.categoria.replace(/^./, (letra) => letra.toUpperCase()) : "Socio";
  const rubro = usuario.rubro || "Rubro no informado";
  const localidad = usuario.localidad || "Localidad no informada";
  const actividad = usuario.actividad || "Actividad no informada";
  const tamanoEmpresa = usuario.tamano_empresa === "Pequena" ? "Pequeña" : (usuario.tamano_empresa || "Tamaño no informado");

  const abrirModal = (tipo) => {
    setModal(tipo);
    setDetalleSolicitud("");
    setSolicitudEnviada(false);
    setErrorContacto("");
    setContacto({ telefono: usuario.telefono || "", localidad: usuario.localidad || "" });
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModal(null);
  };

  // Los datos institucionales (razón social, CUIT, rubro...) solo los puede cambiar la administración.
  // No hay endpoint para solicitudes, así que armamos el mail a CAPYMEF con el pedido.
  const enviarSolicitud = (evento) => {
    evento.preventDefault();
    const detalle = detalleSolicitud.trim();
    if (!detalle) return;
    const asunto = `Solicitud de modificación de datos - ${nombreEmpresa}`;
    const cuerpo = `Empresa: ${nombreEmpresa}\nCUIT: ${usuario.cuit || "-"}\nSocio N°: ${usuario.id || "-"}\n\nDetalle del pedido:\n${detalle}`;
    window.location.href = `mailto:${EMAIL_CAPYMEF}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    setSolicitudEnviada(true);
  };

  const guardarContacto = async (evento) => {
    evento.preventDefault();
    const datos = { telefono: contacto.telefono.trim(), localidad: contacto.localidad.trim() };
    const error = validarContacto(datos);
    if (error) {
      setErrorContacto(error);
      return;
    }
    setGuardando(true);
    setErrorContacto("");
    try {
      const actualizado = await actualizarMisDatosContacto(datos);
      actualizarUsuario(actualizado || datos);
      toast.success("Datos de contacto actualizados.");
      setModal(null);
    } catch (errorGuardado) {
      setErrorContacto(errorGuardado.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-9rem)] bg-[#edf7fd] px-1 py-2 sm:px-3 sm:py-5">
      <div className="mb-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-normal uppercase text-[#073d6f] sm:text-[25px]">Mi empresa</h1>
          <p className="text-sm text-[#6b7884]">Ficha de {nombreEmpresa}</p>
        </div>
      </div>

      <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(400px,1fr)]">
        <div className="rounded-[25px] border border-[#d9d9d9] bg-white px-3 py-5 sm:px-4 sm:py-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold uppercase text-[#34414c]">Datos institucionales</h2>
            <button type="button" onClick={() => abrirModal("institucional")} className="border border-[#d7e0e5] bg-[#f4f9fc] px-2 py-2 text-sm text-[#17384f] hover:bg-[#e7f2f8]">Solicitar modificación</button>
          </div>
          <div className="space-y-0">
            {[
              [FaBuilding, "Empresa", usuario.razonSocial],
              [FaIdCard, "CUIT", usuario.cuit],
              [FaUsers, "Categoría", categoria],
              [FaGears, "Rubro", rubro],
              [FaChartLine, "Actividad", actividad],
              [FaChartBar, "Tamaño de la empresa", tamanoEmpresa],
              [FaLocationDot, "Localidad", localidad],
            ].map(([Icono, etiqueta, valor]) => (
              <div key={etiqueta} className="grid grid-cols-[30px_1fr] items-end border-b border-[#d8d8d8] py-2 last:border-0">
                <Icono className="mb-0.5 text-lg text-[#006ab4]" />
                <div>
                  <p className="text-base uppercase text-[#66727d]">{etiqueta}</p>
                  <p className="text-base text-[#3a4147]">{valor || "No informado"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#e0e0e0] bg-white px-3 py-5 sm:px-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold uppercase text-[#34414c]">Contacto</h2>
            <button type="button" onClick={() => abrirModal("contacto")} className="border border-[#d7e0e5] bg-[#f4f9fc] px-2 py-2 text-sm text-[#17384f] hover:bg-[#e7f2f8]">Modificar</button>
          </div>
          <div>
            {[
              [FaPhone, "Teléfono", usuario.telefono],
              [FaEnvelope, "Correo electrónico", usuario.email],
            ].map(([Icono, etiqueta, valor]) => (
              <div key={etiqueta} className="grid grid-cols-[30px_1fr] items-end border-b border-[#d8d8d8] py-2 last:border-0">
                <Icono className="mb-0.5 text-base text-[#006ab4]" />
                <div>
                  <p className="text-base uppercase text-[#66727d]">{etiqueta}</p>
                  <p className="text-base text-[#3a4147] break-all">{valor || "No informado"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A46]/50 px-4" onMouseDown={(evento) => evento.target === evento.currentTarget && cerrarModal()}>
          <div className="w-full max-w-lg border border-[#d7e0e5] bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="titulo-solicitud">
            {modal === "institucional" && solicitudEnviada ? (
              <div className="text-center">
                <h2 id="titulo-solicitud" className="text-xl font-bold text-[#132A46]">Solicitud preparada</h2>
                <p className="mt-3 text-sm text-gray-600">Se abrió tu correo con el pedido dirigido a {EMAIL_CAPYMEF}. Enviá el mail para que la administración lo revise.</p>
                <button type="button" onClick={cerrarModal} className="mt-6 bg-[#1b527d] px-5 py-2 text-sm font-bold text-white hover:bg-[#164568]">Cerrar</button>
              </div>
            ) : modal === "institucional" ? (
              <form onSubmit={enviarSolicitud}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#1D7BB6]">Mi empresa</p>
                    <h2 id="titulo-solicitud" className="mt-1 text-xl font-bold text-[#132A46]">Modificar datos institucionales</h2>
                  </div>
                  <button type="button" onClick={cerrarModal} className="text-2xl leading-none text-gray-500 hover:text-[#132A46]" aria-label="Cerrar">&times;</button>
                </div>
                <p className="mt-4 text-sm text-gray-600">Contanos qué dato necesitás corregir y cuál debería ser el valor correcto. La administración de CAPYMEF revisará el pedido.</p>
                <textarea value={detalleSolicitud} onChange={(evento) => setDetalleSolicitud(evento.target.value)} required maxLength={LARGO_MAXIMO_SOLICITUD} rows="5" placeholder="Ej.: Solicito actualizar el rubro a..." className="mt-4 w-full resize-none border border-[#cfdbe3] p-3 text-sm text-[#132A46] outline-none focus:border-[#1D7BB6]" />
                <p className="text-right text-xs text-gray-500">{detalleSolicitud.length}/{LARGO_MAXIMO_SOLICITUD}</p>
                <div className="mt-5 flex justify-end gap-3">
                  <button type="button" onClick={cerrarModal} className="border border-[#d7e0e5] px-4 py-2 text-sm text-[#17384f] hover:bg-[#f4f9fc]">Cancelar</button>
                  <button type="submit" className="bg-[#1b527d] px-4 py-2 text-sm font-bold text-white hover:bg-[#164568]">Enviar solicitud</button>
                </div>
              </form>
            ) : (
              <form onSubmit={guardarContacto} noValidate>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#1D7BB6]">Mi empresa</p>
                    <h2 id="titulo-solicitud" className="mt-1 text-xl font-bold text-[#132A46]">Modificar contacto</h2>
                  </div>
                  <button type="button" onClick={cerrarModal} className="text-2xl leading-none text-gray-500 hover:text-[#132A46]" aria-label="Cerrar">&times;</button>
                </div>
                <p className="mt-4 text-sm text-gray-600">Podés actualizar tu teléfono y localidad. Para cambiar el correo electrónico solicitalo a la administración.</p>
                <label className="mt-4 block text-sm font-semibold text-[#34414c]" htmlFor="telefono-socio">Teléfono</label>
                <input id="telefono-socio" type="tel" autoComplete="tel" maxLength={20} value={contacto.telefono} onChange={(evento) => setContacto((actual) => ({ ...actual, telefono: evento.target.value }))} className="mt-1 w-full border border-[#cfdbe3] p-3 text-sm text-[#132A46] outline-none focus:border-[#1D7BB6]" />
                <label className="mt-4 block text-sm font-semibold text-[#34414c]" htmlFor="localidad-socio">Localidad</label>
                <input id="localidad-socio" type="text" autoComplete="address-level2" maxLength={100} value={contacto.localidad} onChange={(evento) => setContacto((actual) => ({ ...actual, localidad: evento.target.value }))} className="mt-1 w-full border border-[#cfdbe3] p-3 text-sm text-[#132A46] outline-none focus:border-[#1D7BB6]" />
                {errorContacto && <p className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorContacto}</p>}
                <div className="mt-5 flex justify-end gap-3">
                  <button type="button" onClick={cerrarModal} disabled={guardando} className="border border-[#d7e0e5] px-4 py-2 text-sm text-[#17384f] hover:bg-[#f4f9fc] disabled:opacity-60">Cancelar</button>
                  <button type="submit" disabled={guardando} className="bg-[#1b527d] px-4 py-2 text-sm font-bold text-white hover:bg-[#164568] disabled:opacity-60">{guardando ? "Guardando..." : "Guardar cambios"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
