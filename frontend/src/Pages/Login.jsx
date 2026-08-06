import { Link, useNavigate } from "react-router-dom";
import { useForm } from "../Hooks/useForm.js";

export default function Login() {
  const navigate = useNavigate();
  const { formState, handleChange } = useForm({
    email: "",
    password: "",
  });
  const handleLogin = async (e) => {
    e.preventDefault();
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      body: JSON.stringify(formState),
      headers: {
        "Content-type": "application/json",
      },
      credentials: "include",
    });
    const data = await response.json();

    // ESTO ES LO NUEVO: Evaluamos si el backend dijo que todo salió bien (código 200)
    if (response.ok) {
      alert("Logueado con éxito");
      navigate("/home");
    } else {
      // Si la contraseña o correo están mal, mostramos el error que mande el backend
      alert(data.message || "Error al iniciar sesión");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#132A46] flex flex-col items-center justify-center relative text-white font-sans">
      <div className="w-full px-10">
        <h1 className="text-4xl font-serif font-bold text-center mb-12">
          Bienvenido de vuelta
        </h1>

        <form className="flex flex-col" onSubmit={handleLogin}>
          
          <div className="mb-6">
            <label className="block text-lg font-bold" htmlFor="email">
              Correo electrónico
            </label>
            <input
              value={formState.email}
              onChange={handleChange}
              type="email"
              id="email"
              name="email"
              className="w-64 h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
              required
            />
          </div>

          <div className="mt-5">
            <label className="block text-lg font-bold" htmlFor="password">
              Contraseña
            </label>
            <input
              value={formState.password}
              onChange={handleChange}
              type="password"
              id="password"
              name="password"
              className="w-64 h-8 px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
              required
            />
          </div>

          <div className="justify-end mb-10">
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
        <img
          src="../assets/img/Logo.png"
          alt="Logo CAPYMEF"
          className="w-40 opacity-90"
        />
      </div>
    </div>
  );
}
