import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { restablecerPassword } from "../../services/authServices";
import Logo from "../../assets/img/Logo.png";

export default function ResetPassword() {
  const { token } = useParams(); // viene de la URL: /reset-password/:token
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const password = watch("password");

  const handleReset = async (data) => {
    setEnviando(true);
    setMensaje(null);
    try {
      const result = await restablecerPassword(token, data.password);

      if (result.exito) {
        alert(result.mensaje);
        navigate("/login");
      } else {
        setMensaje({ texto: result.mensaje, tipo: "error" });
      }
    } catch (error) {
      setMensaje({ texto: error.message, tipo: "error" });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#132A46] flex flex-col items-center justify-center relative px-6 text-white font-sans">
      <div className="w-full max-w-md">
        <h1 className="text-center text-4xl font-[Trebuchet_MS,sans-serif] font-bold tracking-tight">
          Elegí tu nueva contraseña
        </h1>
        <p className="mt-4 mb-8 text-center text-base leading-relaxed text-white/85">
          Ingresá y confirmá tu nueva contraseña para poder volver a acceder a tu cuenta.
        </p>

        <form className="flex w-full flex-col" onSubmit={handleSubmit(handleReset)}>
          <label className="mb-2 text-base font-bold" htmlFor="password">
            Nueva contraseña
          </label>
          <input
            type="password"
            id="password"
            placeholder="Mínimo 8 caracteres, con mayúscula y número"
            autoComplete="new-password"
            className="h-11 w-full rounded-md border border-white/30 bg-white px-4 text-base text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
            {...register("password", {
              required: true,
              minLength: 8,
              pattern: /^(?=.*\d)(?=.*[A-Z]).+$/, // debe tener al menos 1 número y 1 mayúscula, igual que el backend
            })}
          />
          {errors.password && (
            <span className="mt-1 text-xs text-red-400">
              Debe tener al menos 8 caracteres, una mayúscula y un número.
            </span>
          )}

          <label className="mb-2 mt-5 text-base font-bold" htmlFor="confirmarPassword">
            Confirmar contraseña
          </label>
          <input
            type="password"
            id="confirmarPassword"
            placeholder="Repetí la contraseña"
            autoComplete="new-password"
            className="h-11 w-full rounded-md border border-white/30 bg-white px-4 text-base text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
            {...register("confirmarPassword", {
              required: true,
              validate: (valor) => valor === password || "Las contraseñas no coinciden",
            })}
          />
          {errors.confirmarPassword && (
            <span className="mt-1 text-xs text-red-400">{errors.confirmarPassword.message}</span>
          )}

          {mensaje && (
            <p className="mt-4 text-sm text-center text-red-400">{mensaje.texto}</p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className={`mt-8 rounded-full px-10 py-2 text-lg font-bold text-white transition-colors ${
              enviando ? "bg-gray-500 cursor-not-allowed" : "bg-[#1D7BB6] hover:bg-[#156091]"
            }`}
          >
            {enviando ? "Guardando..." : "Restablecer contraseña"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <Link to="/login" className="text-[#3b82f6] hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>

      <Link to="/" className="absolute bottom-6 left-6">
        <img src={Logo} alt="LogoCAPYMEF" className="h-16 w-auto object-contain" />
      </Link>
    </div>
  );
}
