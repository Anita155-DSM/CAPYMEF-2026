import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";

export default function ForgotPassword() {
  const { register, handleSubmit, reset } = useForm();
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const handleRecovery = async (data) => {
    setEnviando(true);
    setMensaje(null);

    try {
      const respuesta = await fetch(`${import.meta.env.VITE_API_URL_AUTH}/recuperar-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const resultado = await respuesta.json();

      // El backend siempre responde con un mensaje genérico (exista o no el email),
      // así que mostramos ese mismo mensaje sin importar si el usuario existe.
      setMensaje({
        tipo: resultado.exito ? "exito" : "error",
        texto: resultado.mensaje || "Ocurrió un error. Intentá de nuevo más tarde.",
      });

      if (resultado.exito) {
        reset();
      }
    } catch (error) {
      console.error("Error al solicitar recuperación de contraseña:", error);
      setMensaje({
        tipo: "error",
        texto: "No se pudo conectar con el servidor. Intentá de nuevo más tarde.",
      });
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
              className={`mt-4 text-center text-sm ${
                mensaje.tipo === "exito" ? "text-green-400" : "text-red-400"
              }`}
            >
              {mensaje.texto}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-8 rounded-full bg-[#1D7BB6] px-10 py-2 text-lg font-bold text-white transition-colors hover:bg-[#156091] disabled:opacity-60 disabled:cursor-not-allowed"
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