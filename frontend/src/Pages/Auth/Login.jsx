import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { iniciarSesion } from "../../services/authServices";
import { toast } from "sonner"; // 1. Importamos el toast de sonner
import Logo from "../../assets/img/Logo.png";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";

export default function Login() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();
  const [mostrarPassword, setMostrarPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuarioString = localStorage.getItem("usuario");

    if (!token || !usuarioString) return;

    const usuario = JSON.parse(usuarioString);
    navigate(usuario.rol === "admin" ? "/admin/inicio" : "/socios", {
      replace: true,
    });
  }, [navigate]);

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
          if (result.usuario.rol === "admin") {
            navigate("/admin/inicio"); 
          } else {
            navigate("/socios"); // Ruta normal para los socios
          }
        }, 1000);

        return result.mensaje || `"¡Sesión iniciada correctamente!";`

      },
      error: (err) => {
        return err.message;
      },
    });
  };

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center bg-[#0d3150] px-4 py-8 font-sans text-[#162b3d] sm:px-6"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 15%, rgba(70, 139, 181, 0.14) 1px, transparent 1px), radial-gradient(circle at 80% 80%, rgba(70, 139, 181, 0.1) 1px, transparent 1px)",
        backgroundSize: "34px 34px, 46px 46px",
      }}
    >
      <main className="w-full max-w-[506px] overflow-hidden rounded-[9px] border-t-[4px] border-[#2084b6] bg-[#f5f7f9] px-7 pt-8 shadow-[0_12px_35px_rgba(2,18,32,0.28)] sm:px-[42px] sm:pt-[42px]">
        <h1 className="text-center text-[27px] font-bold tracking-[-0.03em] sm:text-[29px]">
          Bienvenido de vuelta
        </h1>

        <form className="mt-8 flex w-full flex-col" onSubmit={handleSubmit(handleLogin)}>
          <div className="mb-4">
            <label className="mb-2 block text-[13px] font-bold text-[#4a5966]" htmlFor="email">
              Correo electrónico
            </label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89939d]" size={19} />
              <input
                type="email"
                id="email"
                placeholder="ejemplo@correo.com"
                autoComplete="email"
                className="h-11 w-full rounded-[3px] border border-transparent bg-[#edf2fc] pl-11 pr-4 text-[14px] text-[#1d2d3a] shadow-sm outline-none placeholder:text-[#a2aab2] focus:border-[#2693c0] focus:ring-2 focus:ring-[#2693c0]/20"
                {...register("email", { required: true })}
              />
            </div>
          </div>

          <div className="mb-2">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[13px] font-bold text-[#4a5966]" htmlFor="password">
                Contraseña
              </label>
              <Link to="/forgot-password" className="text-[12px] font-bold text-[#2784ae] hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89939d]" size={18} />
              <input
                type={mostrarPassword ? "text" : "password"}
                id="password"
                placeholder="Ingresá tu contraseña"
                autoComplete="current-password"
                className="h-11 w-full rounded-[3px] border border-transparent bg-[#edf2fc] pl-11 pr-11 text-[14px] text-[#1d2d3a] shadow-sm outline-none placeholder:text-[#a2aab2] focus:border-[#2693c0] focus:ring-2 focus:ring-[#2693c0]/20"
                {...register("password", { required: true })}
              />
              <button
                type="button"
                aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setMostrarPassword((visible) => !visible)}
                className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-[#89939d] transition-colors hover:bg-[#dfe8f4] hover:text-[#2784ae]"
              >
                {mostrarPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="mt-5 flex h-12 items-center justify-center gap-2 rounded-[9px] bg-[#0877a8] px-5 text-[15px] font-bold text-white shadow-[0_3px_5px_rgba(2,74,106,0.25)] transition-colors hover:bg-[#05648f]"
          >
            Iniciar Sesión
            <FiArrowRight size={19} strokeWidth={2.5} />
          </button>
        </form>

        <div className="-mx-7 mt-6 bg-[#edf2fc] px-7 py-4 text-center text-[12px] text-[#68727b] sm:-mx-[42px] sm:px-[42px]">
          <span>¿No tenés una cuenta habilitada? </span>
          <Link to="/register" className="font-bold text-[#2784ae] hover:underline">
            Creála aquí
          </Link>
        </div>
      </main>
      <Link to="/" className="absolute bottom-6 left-6">
        <img src={Logo} alt="LogoCAPYMEF" className="h-16 w-auto object-contain" />
      </Link>
    </div>
  );
}