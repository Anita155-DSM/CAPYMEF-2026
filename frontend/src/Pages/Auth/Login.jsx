import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { iniciarSesion } from "../../services/authServices"; // Importamos el servicio

export default function Login() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();

  const handleLogin = async (data) => {
    try {
      // 1. Llamamos al servicio y le pasamos la data visual
      const result = await iniciarSesion(data);

      // 2. Evaluamos la respuesta
      if (result.exito) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("usuario", JSON.stringify(result.usuario));

        alert(result.mensaje);
        navigate("/"); // Te mando directo al admin para que pruebes
      } else {
        alert("Error: " + result.mensaje);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#132A46] flex flex-col items-center justify-center relative text-white font-sans">
      <div className="w-full px-10 items-center flex flex-col justify-center">
        <h1 className="text-4xl font-serif font-bold text-center mb-12">
          Bienvenido de vuelta
        </h1>

        {/* Conectamos el form con handleSubmit */}
        <form className="flex flex-col" onSubmit={handleSubmit(handleLogin)}>
          <div className="mb-6">
            <label className="block text-lg font-bold mb-1" htmlFor="email">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              placeholder="email@ejemplo.com"
              className="w-64 h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
              {...register("email", { required: true })} // Capturamos el input
            />
          </div>

          <div className="mt-5">
            <label className="block text-lg font-bold mb-1" htmlFor="password">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              placeholder="********"
              className="w-64 h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
              {...register("password", { required: true })} // Capturamos el input
            />
          </div>

          <div className="justify-end mb-10 mt-2">
            <a href="#" className="text-sm hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <div className="flex justify-center mb-12">
            <button
              type="submit"
              className="bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-2 px-10 rounded-full text-lg transition-colors"
            >
              Iniciar Sesión
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <span>¿No tienes una cuenta? </span>
          <Link to="/register" className="text-[#3b82f6] hover:underline">
            Créala aquí
          </Link>
        </div>
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
