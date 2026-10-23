import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { FaEnvelope, FaIdCard, FaKey, FaRightFromBracket, FaUserShield, FaUsers } from "react-icons/fa6";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthContext";
import { recuperarPassword } from "@/services/authServices";
import DatoFicha from "../components/empresa/DatoFicha";
import { mayuscula } from "../utils/cuotas";

const tarjeta = "border border-[#e0e0e0] bg-white px-3 py-5 sm:px-4";
const titulo = "mb-2 text-lg font-bold uppercase text-[#34414c]";

export default function ConfiguracionSocioPage() {
  const { usuario } = useOutletContext();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [enviandoMail, setEnviandoMail] = useState(false);

  // El backend solo permite cambiar la contraseña con el link de recuperación que llega por mail
  const solicitarCambioPassword = async () => {
    if (!usuario.email || enviandoMail) return;
    setEnviandoMail(true);
    const resultado = await recuperarPassword(usuario.email);
    setEnviandoMail(false);

    if (resultado.exito) toast.success(`Te enviamos un correo a ${usuario.email} con el enlace para cambiar tu contraseña.`);
    else toast.error(resultado.mensaje || "No se pudo enviar el correo. Intentá más tarde.");
  };

  const salir = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const cuenta = [
    [FaEnvelope, "Correo de acceso", usuario.email],
    [FaIdCard, "CUIT", usuario.cuit],
    [FaUsers, "Categoría", mayuscula(usuario.categoria) || "Socio"],
    [FaUserShield, "Estado de la cuenta", mayuscula(usuario.estado) || "-"],
  ];

  return (
    <section className="min-h-[calc(100vh-9rem)] bg-[#edf7fd] px-1 py-2 sm:px-3 sm:py-5">
      <div className="mb-5">
        <h1 className="text-2xl font-normal uppercase text-[#073d6f] sm:text-[25px]">Configuración</h1>
        <p className="mt-1 text-sm text-[#6b7884]">Datos de acceso y seguridad de tu cuenta.</p>
      </div>

      <div className="grid items-start gap-9 lg:grid-cols-2">
        <div className={`${tarjeta} rounded-[25px]`}>
          <h2 className={titulo}>Mi cuenta</h2>
          {cuenta.map(([icono, etiqueta, valor]) => (
            <DatoFicha key={etiqueta} icono={icono} etiqueta={etiqueta} valor={valor} quebrar />
          ))}
          <p className="mt-3 text-sm text-gray-600">
            Para editar tus datos de contacto andá a <Link to="/socios/empresa" className="font-bold text-[#0875b1] hover:underline">Mi empresa</Link>.
          </p>
        </div>

        <div className="space-y-6">
          <div className={tarjeta}>
            <h2 className={titulo}>Contraseña</h2>
            <p className="text-sm text-gray-600">Te enviaremos un enlace a tu correo para que elijas una nueva contraseña. El enlace vence en 1 hora.</p>
            <button type="button" onClick={solicitarCambioPassword} disabled={enviandoMail} className="mt-4 inline-flex items-center gap-2 bg-sidebar px-4 py-2 text-sm font-bold text-white hover:bg-[#164568] disabled:opacity-60">
              <FaKey /> {enviandoMail ? "Enviando..." : "Cambiar contraseña"}
            </button>
          </div>

          <div className={tarjeta}>
            <h2 className={titulo}>Sesión</h2>
            <p className="text-sm text-gray-600">Si usás una computadora compartida, cerrá sesión al terminar.</p>
            <button type="button" onClick={salir} className="mt-4 inline-flex items-center gap-2 border border-[#d7e0e5] bg-[#f4f9fc] px-4 py-2 text-sm text-[#17384f] hover:bg-[#e7f2f8]">
              <FaRightFromBracket /> Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
