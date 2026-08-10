import { useNavigate, Link } from "react-router-dom";
import { useForm } from "../../Hooks/useForm.js";


export default function Register() {
  const navigate = useNavigate();
  const { formState, handleChange } = useForm({
    username: "",
    password: "",
    email: "",
    name: "",
    lastname: "",
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        body: JSON.stringify(formState),
        //Aca rellenamos el campo del body con nuestros datos
        headers: {
          "Content-type": "application/json",
        },
      });
      if (!response.ok) throw new Error();

      const data = await response.json();
      console.log(data);
      alert("Registrado Correctamente");
      navigate("/login");
    } catch (error) {
      throw new Error(error);
    }
  };
  return (
    <div className="min-h-screen w-full bg-[#132A46] flex flex-col items-center justify-center relative text-white font-sans">
      <div className="w-full px-10 flex flex-col items-center">
        {/* Título principal */}
        <h1 className="text-4xl font-serif font-bold text-center mb-2 mt-10">
          Registro de socio
        </h1>

        {/* Subtítulo descriptivo */}
        <p className="text-center text-sm font-medium mb-12">
          Completá tus datos comerciales. El equipo administrativo revisará tu
          solicitud.
        </p>

        <form className="flex flex-col items-center w-full max-w-4xl">
          {/* Contenedor Grid para las dos columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 w-full justify-items-center">
            {/* --- Columna Izquierda --- */}
            <div className="w-full flex flex-col items-end md:items-start max-w-[320px]">
              <div className="mb-6 w-full">
                <label className="block text-lg font-bold mb-1" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="email@gmail.com"
                  className="w-full h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                  required
                />
              </div>

              <div className="w-full">
                <label
                  className="block text-lg font-bold mb-1"
                  htmlFor="password"
                >
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Contraseña123"
                  className="w-full h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                  required
                />
                {/* Nota: Este enlace aparece en tu imagen de diseño. Lo incluí para que sea idéntico. */}
              </div>
            </div>

            {/* --- Columna Derecha --- */}
            <div className="w-full flex flex-col items-start max-w-[320px]">
              <div className="mb-6 w-full">
                <label
                  className="block text-lg font-bold mb-1"
                  htmlFor="razonSocial"
                >
                  Razón Social
                </label>
                <input
                  type="text"
                  id="razonSocial"
                  name="razonSocial"
                  placeholder="ACA TIENE Q HABER PARA ELEGIR"
                  className="w-full h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                  required
                />
              </div>

              <div className="w-full">
                <label className="block text-lg font-bold mb-1" htmlFor="cuit">
                  CUIT
                </label>
                <input
                  type="text"
                  id="cuit"
                  name="cuit"
                  placeholder="0-00000000-00"
                  className="w-full h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Input para subir archivo (Constancia AFIP/DGR) */}
          <div className="mt-10 mb-8">
            <label className="flex items-center justify-center gap-2 bg-[#E2E8F0] text-[#132A46] py-2 px-4 cursor-pointer hover:bg-[#cbd5e1] transition-colors border border-transparent">
              <span className="font-semibold text-sm">
                Subir constancia de AFIP/DGR
              </span>
              {/* Ícono de nube SVG en línea */}
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
              {/* El input real está oculto pero funcional */}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </label>
          </div>

          {/* Botón: Enviar solicitud */}
          <div className="flex justify-center mb-8">
            <button
              type="submit"
              className="bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-2 px-10 rounded-full text-lg transition-colors"
            >
              Enviar solicitud
            </button>
          </div>

          {/* Enlace: Iniciar sesión */}
          <div className="text-center text-sm pb-10">
            <span>¿Ya tienes una cuenta? </span>
            {/* Cambiamos el Link para que apunte de vuelta al Login */}
            <Link to="/login" className="text-[#3b82f6] hover:underline">
              Inicia sesión aquí
            </Link>
          </div>
        </form>
      </div>

      {/* Logo en la esquina inferior izquierda (Misma configuración que el Login) */}
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
