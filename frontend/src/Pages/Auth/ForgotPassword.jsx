import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FiArrowLeft, FiArrowRight, FiLock, FiMail, FiShield } from "react-icons/fi";
import Logo from "../../assets/img/Logo.png";

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
    <div
      className="flex min-h-screen w-full items-center justify-center bg-[#0d3150] px-4 py-8 font-sans text-[#162b3d] sm:px-6"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 15%, rgba(70, 139, 181, 0.14) 1px, transparent 1px), radial-gradient(circle at 80% 80%, rgba(70, 139, 181, 0.1) 1px, transparent 1px)",
        backgroundSize: "34px 34px, 46px 46px",
      }}
    >
      <main className="w-full max-w-[506px] rounded-[9px] bg-[#f5f7f9] px-7 py-8 shadow-[0_12px_35px_rgba(2,18,32,0.28)] sm:px-[42px] sm:py-[42px]">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcecf3] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1976a6]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1976a6]" />
            Recuperación de credenciales
          </span>
        </div>

        <div className="relative mx-auto mt-4 flex h-[68px] w-[68px] items-center justify-center rounded-[13px] bg-[#d7e8f0] text-[#0875a8]">
          <FiLock size={29} strokeWidth={2.2} />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#f5f7f9] bg-[#c6f0d9] text-[#318660]">
            <FiShield size={13} strokeWidth={2.5} />
          </span>
        </div>

        <h1 className="mt-5 text-center text-[25px] font-bold tracking-[-0.03em] sm:text-[26px]">
          Recuperar contraseña
        </h1>
        <p className="mx-auto mt-1.5 max-w-[390px] text-center text-[13px] leading-[1.55] text-[#68727b]">
          Ingresá tu correo electrónico y te enviaremos las instrucciones para
          recuperar el acceso a tu cuenta.
        </p>

        <form className="mt-6 flex w-full flex-col" onSubmit={handleSubmit(handleRecovery)}>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[13px] font-bold text-[#4a5966]" htmlFor="email">
              Correo electrónico
            </label>
            <span className="text-[12px] text-[#7d858c]">Requerido</span>
          </div>
          <div className="relative">
            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f8992]" size={19} />
            <input
              type="email"
              id="email"
              placeholder="ejemplo@correo.com"
              autoComplete="email"
              className="h-11 w-full rounded-[3px] border border-transparent bg-white pl-11 pr-4 text-[14px] text-[#1d2d3a] shadow-sm outline-none placeholder:text-[#9ba1a7] focus:border-[#2693c0] focus:ring-2 focus:ring-[#2693c0]/20"
              {...register("email", { required: true })}
            />
          </div>

          {mensaje && (
            <p className={`mt-3 text-center text-[12px] ${mensaje.tipo === "exito" ? "text-[#248354]" : "text-[#c44949]"}`}>
              {mensaje.texto}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-5 flex h-12 items-center justify-center gap-2 rounded-[9px] bg-[#0877a8] px-5 text-[15px] font-bold text-white shadow-[0_3px_5px_rgba(2,74,106,0.25)] transition-colors hover:bg-[#05648f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? "Enviando..." : "Enviar instrucciones"}
            {!enviando && <FiArrowRight size={19} strokeWidth={2.5} />}
          </button>
        </form>

        <div className="mt-11 flex justify-center text-center text-[12px] font-semibold text-[#2784ae]">
          <Link to="/login" className="inline-flex items-center gap-2 transition-colors hover:text-[#075d86] hover:underline">
            <FiArrowLeft size={16} strokeWidth={2.5} />
            ¿Recordaste tu contraseña? Volver al inicio de sesión
          </Link>
        </div>
      </main>
      <Link to="/" className="absolute bottom-6 left-6">
        <img src={Logo} alt="LogoCAPYMEF" className="h-16 w-auto object-contain" />
      </Link>
    </div>
  );
}