import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { registrarSocio } from "../../services/authServices"; // Importamos el servicio
import Logo from "../../assets/img/Logo.png";
import { toast } from "sonner";
import { FiArrowRight, FiEye, FiEyeOff, FiFileText } from "react-icons/fi";

export default function Register() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const password = watch("password");
  const constanciaField = register("constancia", { required: true });

  const handleRegister = async (data) => {
    try {
      // 1. Armamos el paquete de datos en el frontend
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

      // 2. Le pasamos el paquete al SERVICIO (chao al fetch largo y feo)
      const result = await registrarSocio(formData);

      // 3. Evaluamos la respuesta
      if (result.exito) {
        console.log(result);
        toast.success("Registrado Correctamente. Queda pendiente de revisión.");
        navigate("/login");
      } else {
        // Evaluamos si falló el validador estricto o si es un error general
        if (result.errores) {
          const listaDeErrores = result.errores
            .map((err) => `- ${err.mensaje}`)
            .join("\n");
          toast.error("Revisá los siguientes campos:\n" + listaDeErrores);
        } else {
          toast.error("Atención: " + result.mensaje);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.message ||
          "Error de red. Verificá que el servidor esté encendido.",
      );
    }
  };

  const handleInvalidRegister = () => {
    toast.error("Completá todos los campos obligatorios antes de registrarte.");
  };

  const localidadesPorDepartamento = [
    {
      departamento: "Bermejo",
      ciudades: [
        "Laguna Yema",
        "Los Chiriguanos",
        "Pozo de Maza",
        "Pozo del Mortero",
      ],
    },
    {
      departamento: "Formosa",
      ciudades: [
        "Formosa",
        "Colonia Pastoril",
        "Gran Guardia",
        "San Hilario",
        "Mariano Boedo",
        "Mojón de Fierro",
        "Villa del Carmen",
        "Villa Trinidad",
      ],
    },
    {
      departamento: "Laishí",
      ciudades: [
        "San Francisco de Laishí",
        "Banco Payaguá",
        "General Lucio V. Mansilla",
        "Herradura",
        "Tatané",
        "Villa Escolar",
      ],
    },
    { departamento: "Matacos", ciudades: ["Ingeniero Juárez"] },
    {
      departamento: "Patiño",
      ciudades: [
        "Comandante Fontana",
        "Bartolomé de las Casas",
        "Colonia Sarmiento",
        "El Recreo",
        "Estanislao del Campo",
        "Fortín Leyes",
        "Fortín Lugones",
        "General Manuel Belgrano",
        "Ibarreta",
        "Juan G. Bazán",
        "Las Lomitas",
        "Posta Cambio Zalazar",
        "Pozo del Tigre",
        "San Martín 1",
        "San Martín 2",
        "Subteniente Perín",
        "Villa General Güemes",
      ],
    },
    {
      departamento: "Pilagás",
      ciudades: [
        "El Espinillo",
        "Buena Vista",
        "Misión Tacaaglé",
        "Portón Negro",
        "Tres Lagunas",
      ],
    },
    {
      departamento: "Pilcomayo",
      ciudades: [
        "Clorinda",
        "Laguna Blanca",
        "Laguna Naick Neck",
        "Palma Sola",
        "Puerto Pilcomayo",
        "Riacho He-Hé",
        "Riacho Negro",
        "Siete Palmas",
      ],
    },
    {
      departamento: "Pirané",
      ciudades: [
        "Pirané",
        "El Colorado",
        "Mayor Vicente Villafañe",
        "Palo Santo",
        "Villa Dos Trece",
      ],
    },
    { departamento: "Ramón Lista", ciudades: ["El Chorro", "El Potrillo"] },
  ];

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center bg-[#0d3150] px-4 py-8 font-sans text-[#162b3d] sm:px-6"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 15%, rgba(70, 139, 181, 0.14) 1px, transparent 1px), radial-gradient(circle at 80% 80%, rgba(70, 139, 181, 0.1) 1px, transparent 1px)",
        backgroundSize: "34px 34px, 46px 46px",
      }}
    >
      <main className="w-full max-w-[860px] rounded-[9px] border-t-[4px] border-[#2084b6] bg-[#f5f7f9] px-6 py-8 shadow-[0_12px_35px_rgba(2,18,32,0.28)] sm:px-10 sm:py-10">
        <h1 className="text-center text-[27px] font-bold tracking-[-0.03em] sm:text-[29px]">
          Crear cuenta de socio
        </h1>
        <p className="mx-auto mt-2 max-w-[560px] text-center text-[13px] leading-[1.55] text-[#68727b]">
          Completá tus datos comerciales. El equipo administrativo revisará tu solicitud.
        </p>

        <form
          onSubmit={handleSubmit(handleRegister, handleInvalidRegister)}
          className="mt-7 flex w-full flex-col text-[#162b3d]"
        >
          <div className="grid w-full grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2">
            {/* Columna Izquierda */}
            <div className="flex w-full flex-col">
              <div className="w-full my-3">
                <label className="block text-lg font-bold mb-1" htmlFor="email">
                    Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                    placeholder="ejemplo@correo.com"
                  className="w-full h-11 rounded-md border border-white/30 px-4 pr-10 text-base text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                  {...register("email", { required: true })}
                />
              </div>
              <div className="w-full my-3">
                <label
                  className="block text-lg font-bold mb-1"
                  htmlFor="password"
                >
                    Contraseña
                </label>
                <div className="relative">
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    id="password"
                    placeholder="Ingresá una contraseña"
                    className="w-full h-11 rounded-md border border-white/30 bg-white px-4 pr-12 text-base text-black focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                    {...register("password", { required: true })}
                  />
                  <button
                    type="button"
                    aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setMostrarPassword((visible) => !visible)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-[#2084b6]"
                  >
                    {mostrarPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
              <div className="w-full my-3">
                <label className="block text-lg font-bold mb-1" htmlFor="confirmarPassword">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={mostrarConfirmacion ? "text" : "password"}
                    id="confirmarPassword"
                    placeholder="Repetí tu contraseña"
                    className="w-full h-11 rounded-md border border-white/30 bg-white px-4 pr-12 text-base text-black focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                    {...register("confirmarPassword", {
                      required: true,
                      validate: (valor) => valor === password || "Las contraseñas no coinciden",
                    })}
                  />
                  <button
                    type="button"
                    aria-label={mostrarConfirmacion ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                    title={mostrarConfirmacion ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                    onClick={() => setMostrarConfirmacion((visible) => !visible)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-[#2084b6]"
                  >
                    {mostrarConfirmacion ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {errors.confirmarPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.confirmarPassword.message || "Confirmá tu contraseña."}
                  </p>
                )}
              </div>
              <div className="w-full my-3">
                <label className="block text-lg font-bold mb-1" htmlFor="cuit">
                    CUIT
                </label>
                <input
                  type="text"
                  id="cuit"
                    placeholder="20-12345678-9"
                  className="w-full h-11 rounded-md border border-white/30 px-4 pr-10 text-base text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                  {...register("cuit", { required: true })}
                />
              </div>
              <div className="w-full my-3">
                <label
                  className="block text-lg font-bold mb-1"
                  htmlFor="razonSocial"
                >
                  Razón Social
                </label>
                <input
                  type="text"
                  id="razonSocial"
                    placeholder="Nombre de tu empresa"
                  className="w-full h-11 rounded-md border border-white/30 px-4 pr-10 text-base text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                  {...register("razonSocial", { required: true })}
                />
              </div>
              <div className="w-full my-3">
                <label
                  className="block text-lg font-bold mb-1"
                  htmlFor="telefono"
                >
                  Teléfono
                </label>
                <input
                  type="text"
                  id="telefono"
                    placeholder="3704 123456"
                  className="w-full h-11 rounded-md border border-white/30 px-4 text-base text-black bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                  {...register("telefono", { required: true })}
                />
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="flex w-full flex-col">
              <div className="w-full my-3">
                <label
                  className="block text-lg font-bold mb-1"
                  htmlFor="localidad"
                >
                  Localidad
                </label>
                <div className="relative w-full">
                  <select
                    id="localidad"
                    className="w-full h-11 appearance-none rounded-md border border-white/30 bg-white px-4 pr-12 text-base text-black focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                    defaultValue=""
                    {...register("localidad", { required: true })}
                  >
                  <option value="" disabled>
                    Seleccioná una opcion
                  </option>
                  {localidadesPorDepartamento.map((dep) => (
                    <optgroup
                      key={dep.departamento}
                      label={`--- ${dep.departamento} ---`}
                    >
                      {dep.ciudades.map((ciudad) => (
                        <option key={ciudad} value={ciudad}>
                          {ciudad}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="m5 7 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="w-full my-3">
                <label
                  className="block text-lg font-bold mb-1"
                  htmlFor="tamano_empresa"
                >
                  Tamaño de la Empresa
                </label>
                <div className="relative w-full">
                  <select
                    id="tamano_empresa"
                    className="w-full h-11 appearance-none rounded-md border border-white/30 bg-white px-4 pr-12 text-base text-black focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                    defaultValue=""
                    {...register("tamano_empresa", { required: true })}
                  >
                  <option value="" disabled>
                    Seleccioná una opcion
                  </option>
                  <option value="Micro">Micro (1-9)</option>
                  <option value="Pequena">Pequeña (10-49)</option>
                  <option value="Mediana">Mediana (50-200)</option>
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="m5 7 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="w-full my-3">
                <label className="block text-lg font-bold mb-1" htmlFor="rubro">
                  Rubro
                </label>
                <div className="relative w-full">
                  <select
                    id="rubro"
                    className="w-full h-11 appearance-none rounded-md border border-white/30 bg-white px-4 pr-12 text-base text-black focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                    defaultValue=""
                    {...register("rubro", { required: true })}
                  >
                  <option value="" disabled>
                    Seleccioná una opcion
                  </option>
                  <option value="Comercio">Comercio</option>
                  <option value="Industria">Industria</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Agropecuario">Agropecuario</option>
                  <option value="Otro">Otro</option>
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="m5 7 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="w-full my-3">
                <label
                  className="block text-lg font-bold mb-1"
                  htmlFor="actividad"
                >
                  Actividad
                </label>
                <input
                  type="text"
                  id="actividad"
                  placeholder='Ej. "Venta de repuestos"'
                  className="w-full h-11 rounded-md border border-white/30 px-4 text-base text-black bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                  {...register("actividad", { required: true })}
                />
              </div>
              <div className="w-full my-3">
                <label
                  className="block text-lg font-bold mb-1"
                  htmlFor="categoria"
                >
                  Categoría
                </label>
                <div className="relative w-full">
                  <select
                    id="categoria"
                    className="w-full h-11 appearance-none rounded-md border border-white/30 bg-white px-4 pr-12 text-base text-black focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                    defaultValue=""
                    {...register("categoria", { required: true })}
                  >
                  <option value="" disabled>
                    Seleccioná una opcion
                  </option>
                  <option value="activo">Activo</option>
                  <option value="adherente">Adherente</option>
                  <option value="padrino">Padrino</option>
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="m5 7 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 mb-7">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-dashed border-[#9bb4c3] bg-[#edf2fc] px-4 py-3 text-[#2784ae] transition-colors hover:bg-[#e4edf9]">
              <FiFileText size={18} />
              <span className="text-[13px] font-bold">
                Subir constancia de AFIP/DGR
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                />
              </svg>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                {...constanciaField}
                onChange={(event) => {
                  constanciaField.onChange(event);
                  setNombreArchivo(event.target.files?.[0]?.name || "");
                }}
              />
            </label>
            <div className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-[#68727b]">
              <FiFileText size={14} className={nombreArchivo ? "text-[#248354]" : "text-[#9aa5ae]"} />
              <span>{nombreArchivo || "Todavía no seleccionaste ningún archivo"}</span>
            </div>
            {errors.constancia && (
              <p className="mt-1 text-center text-xs text-red-600">La constancia es obligatoria.</p>
            )}
          </div>

          <label className="mb-7 flex cursor-pointer items-start gap-2 text-sm text-[#4a5966]">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#0877a8]"
              {...register("consentimiento", { required: true })}
            />
            <span>
              Acepto los Términos y Condiciones y el tratamiento de mis datos
            </span>
          </label>
          {errors.consentimiento && (
            <p className="-mt-5 mb-5 text-xs text-red-600">Debés aceptar el consentimiento para continuar.</p>
          )}

          <div className="flex justify-center">
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[9px] bg-[#0877a8] px-5 text-[15px] font-bold text-white shadow-[0_3px_5px_rgba(2,74,106,0.25)] transition-colors hover:bg-[#05648f] sm:max-w-[360px]"
            >
              Enviar solicitud
              <FiArrowRight size={19} strokeWidth={2.5} />
            </button>
          </div>

          <div className="mt-7 text-center text-[12px] text-[#68727b]">
            <span>¿Ya tenés una cuenta? </span>
            <Link to="/login" className="font-bold text-[#2784ae] hover:underline">
              Inicia sesión aquí
            </Link>
          </div>
        </form>
      </main>
      <Link to="/" className="absolute bottom-6 left-6">
        <img src={Logo} alt="LogoCAPYMEF" className="h-16 w-auto object-contain" />
      </Link>
    </div>
  );
}
