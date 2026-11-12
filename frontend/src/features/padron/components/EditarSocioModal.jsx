import { useEffect, useState } from "react";
import {
  FaBuilding,
  FaFloppyDisk,
  FaIdCard,
  FaLock,
  FaTriangleExclamation,
  FaUserSlash,
  FaXmark,
} from "react-icons/fa6";
import { toast } from "sonner";
import { actualizarDatosSocio, darDeBajaSocio } from "@/services/adminServices";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import ConstanciaSocio from "./ConstanciaSocio";

const inputClase =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-navy placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors";

const labelClase =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500";

const OPCIONES_RUBRO = ["Comercio", "Industria", "Servicios", "Agropecuario", "Otro"];

/**
 * Modal de edición integral de socio para Administración.
 * Permite actualizar todos los campos institucionales y de contacto habilitados por el backend
 * (PUT /api/admin/socios/:id) y gestionar la baja o reactivación del socio.
 */
export default function EditarSocioModal({ socio, onClose, onActualizado }) {
  useBloquearScroll(true);

  const [form, setForm] = useState({
    razonSocial: socio.razonSocial || "",
    email: socio.email || "",
    telefono: socio.telefono || "",
    localidad: socio.localidad || "",
    categoria: socio.categoria || "adherente",
    rubro: socio.rubro || "Comercio",
    tamano_empresa: socio.tamano_empresa || "",
    actividad: socio.actividad || "",
    estado: socio.estado || "aprobado",
  });
  const [procesando, setProcesando] = useState(false);
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape" && !confirmandoBaja) onClose();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onClose, confirmandoBaja]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const terminar = (result, okMsg, errPrefijo) => {
    if (result.exito) {
      toast.success(okMsg);
      onActualizado?.();
      onClose();
    } else {
      const detalle = result.errores?.[0]?.mensaje || result.mensaje;
      toast.error(errPrefijo + detalle);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.razonSocial.trim().length < 3) {
      toast.error("La razón social debe tener al menos 3 caracteres.");
      return;
    }

    setProcesando(true);
    const payload = {
      razonSocial: form.razonSocial.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim(),
      localidad: form.localidad.trim(),
      categoria: form.categoria,
      rubro: form.rubro,
      actividad: form.actividad.trim(),
      estado: form.estado,
      ...(form.tamano_empresa ? { tamano_empresa: form.tamano_empresa } : {}),
    };

    const result = await actualizarDatosSocio(socio.id, payload);
    setProcesando(false);
    terminar(result, "Datos del socio actualizados correctamente.", "Error: ");
  };

  const handleInactivar = async () => {
    setProcesando(true);
    const result = await darDeBajaSocio(socio.id);
    setProcesando(false);
    setConfirmandoBaja(false);
    terminar(result, `El socio ${socio.razonSocial} ha sido dado de baja.`, "Error al dar de baja: ");
  };

  const rubrosDisponibles =
    form.rubro && !OPCIONES_RUBRO.includes(form.rubro)
      ? [form.rubro, ...OPCIONES_RUBRO]
      : OPCIONES_RUBRO;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs sm:p-6"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="animacion-modal max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:max-w-3xl sm:p-7"
          role="dialog"
          aria-modal="true"
          aria-label={`Editar socio: ${socio.razonSocial}`}
        >
          {/* Cabecera estilo Socio */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-blue px-2.5 py-1 text-xs font-bold text-primary">
                <FaBuilding className="text-[11px]" /> Ficha del socio
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                  form.estado === "aprobado"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {form.estado}
              </span>

              {socio.degradadoPorMora && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                  <FaTriangleExclamation className="text-[11px]" /> Degradado por mora
                </span>
              )}
            </div>

            <button
              type="button"
              aria-label="Cerrar ventana"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <FaXmark className="text-xl" />
            </button>
          </div>

          <h2 className="mt-2 text-xl font-bold leading-snug text-navy sm:text-2xl">
            {socio.razonSocial}
          </h2>

          {/* CUIT de solo lectura */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-surface px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-blue text-primary">
                <FaIdCard className="text-sm" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Identificación fiscal (CUIT)
                </p>
                <p className="text-sm font-bold tabular-nums text-navy">{socio.cuit}</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200/80">
              <FaLock className="text-[10px]" /> No editable
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {/* Constancia AFIP / DGR */}
            <ConstanciaSocio url={socio.constanciaUrl} razonSocial={socio.razonSocial} />

            {/* Datos institucionales */}
            <div className="rounded-xl border border-gray-100 bg-surface p-4 sm:p-5">
              <p className="mb-3.5 text-xs font-bold uppercase tracking-wider text-navy">
                Datos institucionales
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClase}>Razón social *</label>
                  <input
                    type="text"
                    name="razonSocial"
                    value={form.razonSocial}
                    onChange={handleChange}
                    required
                    minLength={3}
                    maxLength={150}
                    className={inputClase}
                  />
                </div>

                <div>
                  <label className={labelClase}>Categoría societaria</label>
                  <select
                    name="categoria"
                    value={form.categoria}
                    onChange={handleChange}
                    className={inputClase}
                  >
                    <option value="activo">Activo (abona cuota mensual)</option>
                    <option value="adherente">Adherente (sin cuota obligatoria)</option>
                    <option value="padrino">Padrino (aporte voluntario)</option>
                    <option value="honorario">Honorario (distinción institucional · exento)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClase}>Estado en el padrón</label>
                  <select
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                    className={inputClase}
                  >
                    <option value="aprobado">Aprobado (Habilitado)</option>
                    <option value="inactivo">Inactivo (Dado de baja)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClase}>Rubro</label>
                  <select
                    name="rubro"
                    value={form.rubro}
                    onChange={handleChange}
                    className={inputClase}
                  >
                    {rubrosDisponibles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClase}>Tamaño de la empresa</label>
                  <select
                    name="tamano_empresa"
                    value={form.tamano_empresa}
                    onChange={handleChange}
                    className={inputClase}
                  >
                    <option value="">No especificado</option>
                    <option value="Micro">Micro (1–9 empleados)</option>
                    <option value="Pequena">Pequeña (10–49 empleados)</option>
                    <option value="Mediana">Mediana (50–249 empleados)</option>
                    <option value="Grande">Grande (250+ empleados)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClase}>Actividad principal</label>
                  <input
                    type="text"
                    name="actividad"
                    value={form.actividad}
                    onChange={handleChange}
                    placeholder="Ej. Venta minorista de insumos industriales"
                    className={inputClase}
                  />
                </div>
              </div>
            </div>

            {/* Datos de contacto y ubicación */}
            <div className="rounded-xl border border-gray-100 bg-surface p-4 sm:p-5">
              <p className="mb-3.5 text-xs font-bold uppercase tracking-wider text-navy">
                Contacto y ubicación
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClase}>Correo electrónico *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className={inputClase}
                  />
                </div>

                <div>
                  <label className={labelClase}>Teléfono *</label>
                  <input
                    type="text"
                    name="telefono"
                    maxLength={20}
                    value={form.telefono}
                    onChange={handleChange}
                    required
                    className={inputClase}
                  />
                </div>

                <div>
                  <label className={labelClase}>Localidad *</label>
                  <input
                    type="text"
                    name="localidad"
                    maxLength={100}
                    value={form.localidad}
                    onChange={handleChange}
                    required
                    className={inputClase}
                  />
                </div>
              </div>
            </div>

            {/* Pie de acciones */}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              {socio.estado !== "inactivo" ? (
                <button
                  type="button"
                  onClick={() => setConfirmandoBaja(true)}
                  disabled={procesando}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <FaUserSlash className="text-xs" /> Dar de baja
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
                  <FaUserSlash /> Socio actualmente inactivo
                </span>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={procesando}
                  className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
                >
                  <FaFloppyDisk className="text-xs" />
                  {procesando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmandoBaja}
        icono={FaUserSlash}
        titulo="¿Dar de baja al socio?"
        mensaje={`Vas a pasar a estado INACTIVO a "${socio.razonSocial}" (CUIT: ${socio.cuit}). Su cuenta no podrá iniciar sesión hasta que vuelva a habilitarse y se liberarán sus lugares en eventos próximos.`}
        textoConfirmar={procesando ? "Procesando..." : "Dar de baja"}
        onCancelar={() => setConfirmandoBaja(false)}
        onConfirmar={handleInactivar}
      />
    </>
  );
}
