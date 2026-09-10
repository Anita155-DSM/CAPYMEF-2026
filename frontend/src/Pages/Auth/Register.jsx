import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { registrarSocio } from "../../services/authServices"; // Importamos el servicio
import Logo from "../../assets/img/Logo.png";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();

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
    <div className="min-h-screen w-full bg-[#132A46] flex flex-col items-center justify-center relative text-white font-sans py-10">
      <div className="w-full px-10 flex flex-col items-center">
        <h1 className="text-4xl font-[Trebuchet_MS,sans-serif] font-bold text-center mb-2 mt-10">
            Registro de socio
        </h1>
        <p className="text-center text-sm font-medium mb-12">
            Completá tus datos comerciales. El equipo administrativo revisará tu
          solicitud.
        </p>

        <form
          onSubmit={handleSubmit(handleRegister)}
          className="flex flex-col items-center w-full max-w-4xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2 w-full justify-items-center">
            {/* Columna Izquierda */}
            <div className="w-full flex flex-col items-end md:items-start max-w-[320px]">
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
                <input
                  type="password"
                  id="password"
                    placeholder="Ingresá una contraseña"
                  className="w-full h-11 rounded-md border border-white/30 px-4 pr-10 text-base text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                  {...register("password", { required: true })}
                />
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
            <div className="w-full flex flex-col items-start max-w-[320px]">
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

          <div className="mt-8 mb-8">
            <label className="flex items-center justify-center gap-2 bg-[#E2E8F0] text-[#132A46] py-2 px-4 cursor-pointer hover:bg-[#cbd5e1] transition-colors border border-transparent">
              <span className="font-semibold text-sm">
                Subir constancia de AFIP/DGR
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
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
                {...register("constancia", { required: true })}
              />
            </label>
          </div>

          <div className="flex justify-center mb-8">
            <button
              type="submit"
              className="bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-2 px-10 rounded-full text-lg transition-colors"
            >
              Enviar solicitud
            </button>
          </div>

          <div className="text-center text-sm pb-10">
            <span>¿Ya tienes una cuenta? </span>
            <Link to="/login" className="text-[#3b82f6] hover:underline">
              Inicia sesión aquí
            </Link>
          </div>
        </form>
      </div>
      <Link to="/" className="absolute bottom-6 left-6">
        <img src={Logo} alt="LogoCAPYMEF" className="h-16 w-auto object-contain" />
      </Link>
    </div>
  );
}
