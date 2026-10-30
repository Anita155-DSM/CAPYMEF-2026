import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  FiActivity,
  FiArrowRight,
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiChevronDown,
  FiEye,
  FiEyeOff,
  FiHash,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTag,
  FiUploadCloud,
  FiUsers,
} from "react-icons/fi";
import logo from "../../assets/img/logo.png";
import { registrarSocio } from "../../services/authServices";
import TerminosModal from "@/features/auth/components/TerminosModal.jsx";
import { localidadesPorDepartamento } from "@/features/auth/data/localidades.js";

const TAMANOS = [
  { valor: "Micro", texto: "Micro (1-9)" },
  { valor: "Pequena", texto: "Pequeña (10-49)" },
  { valor: "Mediana", texto: "Mediana (50-200)" },
];
const RUBROS = ["Comercio", "Industria", "Servicios", "Agropecuario", "Otro"];
const CATEGORIAS = [
  { valor: "activo", texto: "Activo" },
  { valor: "adherente", texto: "Adherente" },
  { valor: "padrino", texto: "Padrino" },
];

const MAX_ARCHIVO_MB = 5;

const claseCampo = (hayError, extra = "pr-3") =>
  `h-10 w-full rounded-[3px] border bg-[#edf2fc] pl-10 text-[14px] text-[#1d2d3a] shadow-sm outline-none placeholder:text-[#a2aab2] focus:ring-2 ${extra} ${
    hayError
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
      : "border-transparent focus:border-[#2693c0] focus:ring-[#2693c0]/20"
  }`;

function CampoForm({ id, label, icono: Icono, error, flecha = false, children }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-[13px] font-bold text-[#4a5966]">
        {label}
      </label>
      <div className="relative">
        <Icono
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89939d]"
          size={17}
        />
        {children}
        {flecha && (
          <FiChevronDown
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5966]"
            size={17}
          />
        )}
      </div>
      {error && <p className="mt-1 text-[11px] leading-tight text-red-600">{error}</p>}
    </div>
  );
}

function BotonOjo({ visible, alternar, etiqueta }) {
  return (
    <button
      type="button"
      aria-label={visible ? `Ocultar ${etiqueta}` : `Mostrar ${etiqueta}`}
      title={visible ? `Ocultar ${etiqueta}` : `Mostrar ${etiqueta}`}
      onClick={alternar}
      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-[#89939d] transition-colors hover:bg-[#dfe8f4] hover:text-[#2784ae] cursor-pointer"
    >
      {visible ? <FiEyeOff size={18} /> : <FiEye size={18} />}
    </button>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [verTerminos, setVerTerminos] = useState(false);

  const password = watch("password");
  const nombreArchivo = watch("constancia")?.[0]?.name;

  const handleRegister = async (data) => {
    try {
      const formData = new FormData();

      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("cuit", data.cuit);
      formData.append("razonSocial", data.razonSocial);
      formData.append("telefono", data.telefono);
      formData.append("localidad", data.localidad);
      formData.append("categoria", data.categoria);
      formData.append("tamano_empresa", data.tamano_empresa);
      formData.append("rubro", data.rubro);
      formData.append("actividad", data.actividad);

      if (data.constancia && data.constancia[0]) {
        formData.append("constancia", data.constancia[0]);
      }

      const result = await registrarSocio(formData);

      if (result.exito) {
        toast.success("Registrado Correctamente. Queda pendiente de revisión.");
        navigate("/login");
      } else if (result.errores) {
        const listaDeErrores = result.errores.map((err) => `- ${err.mensaje}`).join("\n");
        toast.error("Revisá los siguientes campos:\n" + listaDeErrores);
      } else {
        toast.error("Atención: " + result.mensaje);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error de red. Verificá que el servidor esté encendido.");
    }
  };

  const handleInvalidRegister = () => {
    toast.error("Completá todos los campos obligatorios antes de registrarte.");
  };

  const aceptarTerminos = () => {
    setValue("consentimiento", true, { shouldValidate: true });
    setVerTerminos(false);
  };

  const obligatorio = "Campo obligatorio";

  return (
    <div
      className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-[#0d3150] px-3 py-4 font-sans text-[#162b3d] sm:px-6 sm:py-6"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 15%, rgba(70, 139, 181, 0.14) 1px, transparent 1px), radial-gradient(circle at 80% 80%, rgba(70, 139, 181, 0.1) 1px, transparent 1px)",
        backgroundSize: "34px 34px, 46px 46px",
      }}
    >
      <main className="w-full max-w-[1040px] overflow-hidden rounded-[9px] border-t-[4px] border-[#2084b6] bg-[#f5f7f9] px-5 pt-6 shadow-[0_12px_35px_rgba(2,18,32,0.28)] sm:px-10 sm:pt-7">
        <header className="border-b border-[#dfe6ee] pb-4 text-center">
          <h1 className="text-[24px] font-bold tracking-[-0.03em] sm:text-[27px]">
            Crear cuenta de socio
          </h1>
          <p className="mx-auto mt-1 max-w-[560px] text-[13px] leading-[1.5] text-[#68727b]">
            Completá tus datos comerciales. El equipo administrativo revisará tu solicitud.
          </p>
        </header>

        <form
          noValidate
          onSubmit={handleSubmit(handleRegister, handleInvalidRegister)}
          className="mt-5 flex w-full flex-col"
        >
          <div className="grid grid-cols-1 gap-x-5 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <CampoForm id="razonSocial" label="Razón Social" icono={FiBriefcase} error={errors.razonSocial && obligatorio}>
              <input
                id="razonSocial"
                type="text"
                placeholder="Nombre de tu empresa"
                autoComplete="organization"
                className={claseCampo(errors.razonSocial)}
                {...register("razonSocial", { required: true })}
              />
            </CampoForm>

            <CampoForm id="cuit" label="CUIT" icono={FiHash} error={errors.cuit && (errors.cuit.message || obligatorio)}>
              <input
                id="cuit"
                type="text"
                inputMode="numeric"
                placeholder="20-12345678-9"
                className={claseCampo(errors.cuit)}
                {...register("cuit", {
                  required: true,
                  pattern: { value: /^(\d{2}-\d{8}-\d|\d{11})$/, message: "Formato: 20-12345678-9" },
                })}
              />
            </CampoForm>

            <CampoForm id="telefono" label="Teléfono" icono={FiPhone} error={errors.telefono && obligatorio}>
              <input
                id="telefono"
                type="tel"
                placeholder="3704 123456"
                autoComplete="tel"
                className={claseCampo(errors.telefono)}
                {...register("telefono", { required: true })}
              />
            </CampoForm>

            <CampoForm id="rubro" label="Rubro" icono={FiTag} flecha error={errors.rubro && obligatorio}>
              <select
                id="rubro"
                required
                defaultValue=""
                className={`${claseCampo(errors.rubro, "pr-9 appearance-none cursor-pointer")} invalid:text-[#a2aab2]`}
                {...register("rubro", { required: true })}
              >
                <option value="" disabled>Seleccioná una opción</option>
                {RUBROS.map((rubro) => (
                  <option key={rubro} value={rubro} className="text-[#1d2d3a]">{rubro}</option>
                ))}
              </select>
            </CampoForm>

            <CampoForm id="actividad" label="Actividad" icono={FiActivity} error={errors.actividad && obligatorio}>
              <input
                id="actividad"
                type="text"
                placeholder='Ej. "Venta de repuestos"'
                className={claseCampo(errors.actividad)}
                {...register("actividad", { required: true })}
              />
            </CampoForm>

            <CampoForm id="tamano_empresa" label="Tamaño de la Empresa" icono={FiUsers} flecha error={errors.tamano_empresa && obligatorio}>
              <select
                id="tamano_empresa"
                required
                defaultValue=""
                className={`${claseCampo(errors.tamano_empresa, "pr-9 appearance-none cursor-pointer")} invalid:text-[#a2aab2]`}
                {...register("tamano_empresa", { required: true })}
              >
                <option value="" disabled>Seleccioná una opción</option>
                {TAMANOS.map((t) => (
                  <option key={t.valor} value={t.valor} className="text-[#1d2d3a]">{t.texto}</option>
                ))}
              </select>
            </CampoForm>

            <CampoForm id="categoria" label="Categoría" icono={FiAward} flecha error={errors.categoria && obligatorio}>
              <select
                id="categoria"
                required
                defaultValue=""
                className={`${claseCampo(errors.categoria, "pr-9 appearance-none cursor-pointer")} invalid:text-[#a2aab2]`}
                {...register("categoria", { required: true })}
              >
                <option value="" disabled>Seleccioná una opción</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.valor} value={c.valor} className="text-[#1d2d3a]">{c.texto}</option>
                ))}
              </select>
            </CampoForm>

            <CampoForm id="localidad" label="Localidad" icono={FiMapPin} flecha error={errors.localidad && obligatorio}>
              <select
                id="localidad"
                required
                defaultValue=""
                className={`${claseCampo(errors.localidad, "pr-9 appearance-none cursor-pointer")} invalid:text-[#a2aab2]`}
                {...register("localidad", { required: true })}
              >
                <option value="" disabled>Seleccioná una opción</option>
                {localidadesPorDepartamento.map((dep) => (
                  <optgroup key={dep.departamento} label={dep.departamento}>
                    {dep.ciudades.map((ciudad) => (
                      <option key={ciudad} value={ciudad} className="text-[#1d2d3a]">{ciudad}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </CampoForm>

            <div className="min-w-0">
              <span className="mb-1 block text-[13px] font-bold text-[#4a5966]">Constancia AFIP/DGR</span>
              <label
                className={`flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-dashed px-3 text-[13px] font-bold transition-colors ${
                  errors.constancia
                    ? "border-red-400 bg-red-50 text-red-600"
                    : nombreArchivo
                      ? "border-[#248354] bg-[#eaf6ef] text-[#248354]"
                      : "border-[#9bb4c3] bg-[#edf2fc] text-[#2784ae] hover:bg-[#e4edf9]"
                }`}
              >
                {nombreArchivo ? <FiCheckCircle size={17} className="shrink-0" /> : <FiUploadCloud size={17} className="shrink-0" />}
                <span className="truncate">{nombreArchivo || "Subir archivo (PDF, JPG o PNG)"}</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  {...register("constancia", {
                    required: "Adjuntá la constancia.",
                    validate: (archivos) =>
                      !archivos?.[0] || archivos[0].size <= MAX_ARCHIVO_MB * 1024 * 1024 || `El archivo supera los ${MAX_ARCHIVO_MB} MB.`,
                  })}
                />
              </label>
              {errors.constancia && (
                <p className="mt-1 text-[11px] leading-tight text-red-600">{errors.constancia.message}</p>
              )}
            </div>

            <CampoForm id="email" label="Correo electrónico" icono={FiMail} error={errors.email && obligatorio}>
              <input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                autoComplete="email"
                className={claseCampo(errors.email)}
                {...register("email", { required: true })}
              />
            </CampoForm>

            <CampoForm id="password" label="Contraseña" icono={FiLock} error={errors.password && (errors.password.message || obligatorio)}>
              <input
                id="password"
                type={mostrarPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className={claseCampo(errors.password, "pr-11")}
                {...register("password", {
                  required: true,
                  pattern: {
                    value: /^(?=.*[A-Z])(?=.*\d).{8,}$/,
                    message: "Mínimo 8 caracteres, una mayúscula y un número.",
                  },
                })}
              />
              <BotonOjo visible={mostrarPassword} alternar={() => setMostrarPassword((v) => !v)} etiqueta="contraseña" />
            </CampoForm>

            <CampoForm id="confirmarPassword" label="Confirmar contraseña" icono={FiLock} error={errors.confirmarPassword && (errors.confirmarPassword.message || "Confirmá tu contraseña.")}>
              <input
                id="confirmarPassword"
                type={mostrarConfirmacion ? "text" : "password"}
                placeholder="Repetí tu contraseña"
                autoComplete="new-password"
                className={claseCampo(errors.confirmarPassword, "pr-11")}
                {...register("confirmarPassword", {
                  required: true,
                  validate: (valor) => valor === password || "Las contraseñas no coinciden.",
                })}
              />
              <BotonOjo visible={mostrarConfirmacion} alternar={() => setMostrarConfirmacion((v) => !v)} etiqueta="confirmación de contraseña" />
            </CampoForm>
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-start gap-2 text-[13px] text-[#4a5966]">
                <input
                  id="consentimiento"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#0877a8]"
                  {...register("consentimiento", { required: true })}
                />
                <p>
                  <label htmlFor="consentimiento" className="cursor-pointer">Acepto los </label>
                  <button
                    type="button"
                    onClick={() => setVerTerminos(true)}
                    className="font-bold text-[#2784ae] hover:underline cursor-pointer"
                  >
                    Términos y Condiciones
                  </button>
                  <label htmlFor="consentimiento" className="cursor-pointer"> y el tratamiento de mis datos</label>
                </p>
              </div>
              {errors.consentimiento && (
                <p className="mt-1 text-[11px] text-red-600">Debés aceptar los términos para continuar.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[9px] bg-[#0877a8] px-5 text-[15px] font-bold text-white shadow-[0_3px_5px_rgba(2,74,106,0.25)] transition-colors hover:bg-[#05648f] disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto lg:min-w-[240px] cursor-pointer"
            >
              {isSubmitting ? "Enviando..." : "Enviar solicitud"}
              {!isSubmitting && <FiArrowRight size={19} strokeWidth={2.5} />}
            </button>
          </div>
        </form>

        <div className="-mx-5 mt-5 bg-[#edf2fc] px-5 py-3.5 text-center text-[12px] text-[#68727b] sm:-mx-10 sm:px-10">
          <span>¿Ya tenés una cuenta? </span>
          <Link to="/login" className="font-bold text-[#2784ae] hover:underline">
            Iniciá sesión aquí
          </Link>
        </div>
      </main>

      <Link
        to="/"
        aria-label="Ir al inicio"
        className="mt-4 self-start min-[1280px]:absolute min-[1280px]:bottom-6 min-[1280px]:left-6 min-[1280px]:mt-0"
      >
        <img src={logo} alt="logoCAPYMEF" className="h-14 w-auto object-contain sm:h-16 min-[1280px]:h-14" />
      </Link>

      {verTerminos && <TerminosModal onClose={() => setVerTerminos(false)} onAceptar={aceptarTerminos} />}
    </div>
  );
}
