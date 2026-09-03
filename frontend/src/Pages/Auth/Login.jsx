import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { iniciarSesion } from "../../services/authServices";
import { toast } from "sonner"; // 1. Importamos el toast de sonner
import Logo from "../../assets/img/Logo.png";

export default function Login() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();

  // Ya no hace falta que handleLogin sea async, porque la asincronía ocurre adentro de la Promesa
  const handleLogin = (data) => {
    
    // 2. Creamos la Promesa que envuelve tu lógica original
    const loginPromise = new Promise(async (resolve, reject) => {
      try {
        // Retraso artificial de 1.5 segundos
        const esperaMinima = new Promise((res) => setTimeout(res, 1500));

        // Llamada real a tu backend
        const result = await iniciarSesion(data);

        // Obligamos al código a esperar que pase el tiempo mínimo
        await esperaMinima;

        // Evaluamos la respuesta de tu API
        if (result.exito) {
          localStorage.setItem("token", result.token);
          localStorage.setItem("usuario", JSON.stringify(result.usuario));
          resolve(result); // Todo salió bien
        } else {
          reject(new Error(result.mensaje || "Credenciales incorrectas")); // Falló el login
        }
      } catch (error) {
        reject(new Error(error.message || "Error al conectar con el servidor"));
      }
    });

    // 3. Le pasamos la promesa a Sonner para que controle los carteles
    toast.promise(loginPromise, {
      loading: 'Verificando credenciales...',
      success: (result) => {
        // Esperamos 1 segundo después del cartel verde para redirigir, así el usuario lo llega a leer
        setTimeout(() => {
          navigate(result.usuario?.rol === "admin" ? "/admin/inicio" : "/socios");
        }, 1000);
        
        return result.mensaje || "¡Sesión iniciada correctamente!";
      },
      error: (err) => {
        return err.message;
      },
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#132A46] flex flex-col items-center justify-center relative text-white font-sans">
      <div className="w-full px-10 items-center flex flex-col justify-center">
        <h1 className="text-4xl font-[Trebuchet_MS,sans-serif] font-bold text-center mb-10 tracking-tight">
          Bienvenido de vuelta
        </h1>

        <form className="flex w-full max-w-md flex-col" onSubmit={handleSubmit(handleLogin)}>
          <div className="mb-6">
            <label className="mb-2 block text-base font-bold" htmlFor="email">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              placeholder="Ingresa tu correo electrónico"
              autoComplete="email"
              className="h-11 w-full rounded-md border border-white/30 bg-white px-4 text-base text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
              {...register("email", { required: true })}
            />
          </div>

          <div className="mb-3">
            <label className="mb-2 block text-base font-bold" htmlFor="password">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              className="h-11 w-full rounded-md border border-white/30 bg-white px-4 text-base text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
              {...register("password", { required: true })}
            />
          </div>

          <div className="mb-9 flex justify-end">
            <Link to="/forgot-password" className="text-sm hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
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
      <Link to="/" className="absolute bottom-6 left-6">
        <img src={Logo} alt="LogoCAPYMEF" className="h-16 w-auto object-contain" />
      </Link>
    </div>
  );
}