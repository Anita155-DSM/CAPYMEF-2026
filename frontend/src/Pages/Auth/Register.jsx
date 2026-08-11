import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";

export default function Register() {
  const navigate = useNavigate();
  // Inicializamos react-hook-form
  const { register, handleSubmit } = useForm();

  const handleRegister = async (data) => {
    try {
      // 1. Usamos FormData para empaquetar textos y el archivo PDF/IMG
      const formData = new FormData();

      // 2. Agregamos los campos obligatorios para el backend
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("cuit", data.cuit);
      formData.append("razonSocial", data.razonSocial);
      formData.append("telefono", data.telefono);
      formData.append("localidad", data.localidad);
      formData.append("categoria", data.categoria);

      // Agregamos tus campos extra (Aunque el backend aún no los guarde, los mandamos)
      formData.append("tamanoEmpresa", data.tamanoEmpresa);
      formData.append("rubro", data.rubro);
      formData.append("actividad", data.actividad);

      // 3. Capturamos el archivo de la constancia
      if (data.constancia && data.constancia[0]) {
        formData.append("constancia", data.constancia[0]);
      }

      // 4. Enviamos a la ruta exacta de tu backend
      const response = await fetch("http://localhost:3000/api/auth/registro", {
        method: "POST",
        body: formData,
        // No enviamos header de Content-Type, el navegador lo pone solo al usar FormData
      });

      const result = await response.json();

      if (result.exito) {
        console.log(result);
        alert("Registrado Correctamente. Queda pendiente de revisión.");
        navigate("/login");
      } else {
        alert("Error: " + result.mensaje);
      }
    } catch (error) {
      console.error(error);
      alert(
        "Error de red. Verificá que el backend en el puerto 3000 esté encendido.",
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
    {
      departamento: "Matacos",
      ciudades: ["Ingeniero Juárez"],
    },
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
    {
      departamento: "Ramón Lista",
      ciudades: ["El Chorro", "El Potrillo"],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#132A46] flex flex-col items-center justify-center relative text-white font-sans py-10">
      <div className="w-full px-10 flex flex-col items-center">
        <h1 className="text-4xl font-serif font-bold text-center mb-2 mt-10">
          Registro de socio
        </h1>
        <p className="text-center text-sm font-medium mb-12">
          Completá tus datos comerciales. El equipo administrativo revisará tu
          solicitud.
        </p>

        {/* Conectamos el formulario con handleSubmit */}
        <form
          onSubmit={handleSubmit(handleRegister)}
          className="flex flex-col items-center w-full max-w-4xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2 w-full justify-items-center">
            {/* --- Columna Izquierda --- */}
            <div className="w-full flex flex-col items-end md:items-start max-w-[320px]">
              <div className="w-full my-3">
                <label className="block text-lg font-bold mb-1" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="email@gmail.com"
                  className="w-full h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
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
                  placeholder="Contraseña123"
                  className="w-full h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
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
                  placeholder="0-00000000-0"
                  className="w-full h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                  {...register("cuit", { required: true })}
                />
              </div>

              {/* Razón Social corregida a input de texto */}
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
                  className="w-full h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                  {...register("razonSocial", { required: true })}
                />
              </div>

              {/* Teléfono (Agregado) */}
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
                  className="w-full h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                  {...register("telefono", { required: true })}
                />
              </div>
            </div>

            {/* --- Columna Derecha --- */}
            <div className="w-full flex flex-col items-start max-w-[320px]">
              <div className="w-full my-3">
                <label
                  className="block text-lg font-bold mb-1"
                  htmlFor="localidad"
                >
                  Localidad
                </label>
                <select
                  id="localidad"
                  className="w-full h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
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
              </div>

              <div className="w-full my-3">
                <label
                  className="block text-lg font-bold mb-1"
                  htmlFor="tamanoEmpresa"
                >
                  Tamaño de la Empresa
                </label>
                <select
                  id="tamanoEmpresa"
                  className="w-full h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                  defaultValue=""
                  {...register("tamanoEmpresa", { required: true })}
                >
                  <option value="" disabled>
                    Seleccioná una opcion
                  </option>
                  <option value="Micro">Micro (1-9)</option>
                  <option value="Pequena">Pequeña (10-49)</option>
                  <option value="Mediana">Mediana (50-200)</option>
                </select>
              </div>

              <div className="w-full my-3">
                <label className="block text-lg font-bold mb-1" htmlFor="rubro">
                  Rubro
                </label>
                <select
                  id="rubro"
                  className="w-full h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
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
                  className="w-full h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                  {...register("actividad", { required: true })}
                />
              </div>

              {/* Categoría (Agregado) */}
              <div className="w-full my-3">
                <label
                  className="block text-lg font-bold mb-1"
                  htmlFor="categoria"
                >
                  Categoría
                </label>
                <select
                  id="categoria"
                  className="w-full h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
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
              </div>
            </div>
          </div>

          {/* Input Constancia (File) */}
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

      <div className="absolute bottom-4 left-4 mb-10">
        <Link to="/">
          <img
            src="../src/assets/img/Logo.png"
            alt="Logo CAPYMEF"
            className="w-40 opacity-90 cursor-pointer"
          />
        </Link>
      </div>
    </div>
  );
}
