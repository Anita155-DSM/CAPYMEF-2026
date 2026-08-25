import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { solicitarRecuperacion } from "../../services/authServices";

export default function ForgotPassword() {
  const { register, handleSubmit, reset } = useForm();
  const [enviando, setEnviando] = useState(false);
  // Guardamos el mensaje de respuesta para mostrarlo en pantalla (no usamos alert acá
  // porque el mensaje del backend es intencionalmente genérico, conviene que quede
  // visible y no se pierda con un popup)
  const [mensaje, setMensaje] = useState(null);

  const handleRecovery = async (data) => {
    setEnviando(true);
    setMensaje(null);
    try {
      const result = await solicitarRecuperacion(data.email);
      setMensaje({ texto: result.mensaje, tipo: result.exito ? "exito" : "error" });
      if (result.exito) reset();
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
          Recuperar contraseña
        </h1>
        <p className="mt-4 mb-8 text-center text-base leading-relaxed text-white/85">
          Ingresá tu correo electrónico y te enviaremos las instrucciones para
          recuperar el acceso a tu cuenta.
        </p>

        <form
          className="flex w-full flex-col"
          onSubmit={handleSubmit(handleRecovery)}
        >
          <label className="mb-2 text-base font-bold" htmlFor="email">
            Correo electrónico
          </label>
          <input
            type="email"
            id="email"
            placeholder="ejemplo@correo.com"
            autoComplete="email"
            className="h-11 w-full rounded-md border border-white/30 bg-white px-4 text-base text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2084b6]"
            {...register("email", { required: true })}
          />

          {mensaje && (
            <p
              className={`mt-4 text-sm text-center ${
                mensaje.tipo === "exito" ? "text-green-400" : "text-red-400"
              }`}
            >
              {mensaje.texto}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className={`mt-8 rounded-full px-10 py-2 text-lg font-bold text-white transition-colors ${
              enviando
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#1D7BB6] hover:bg-[#156091]"
            }`}
          >
            {enviando ? "Enviando..." : "Enviar instrucciones"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span>¿Recordaste tu contraseña? </span>
          <Link to="/login" className="text-[#3b82f6] hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>

    </div>
  );
}
