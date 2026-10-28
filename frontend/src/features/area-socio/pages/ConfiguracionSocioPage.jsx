import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { FaCalendarDay, FaEnvelope, FaIdCard, FaRightFromBracket, FaUserShield, FaUsers } from "react-icons/fa6";
import { useAuth } from "@/app/providers/AuthContext";
import TarjetaSeccion from "../components/configuracion/TarjetaSeccion";
import TarjetaFicha from "../components/empresa/TarjetaFicha";
import { mayuscula } from "../utils/cuotas";
import { datosAntiguedad, ESTADOS_SOCIO } from "../utils/empresa";

export default function ConfiguracionSocioPage() {
  const { usuario } = useOutletContext(); // viene del SocioLayout (perfil fresco del backend)
  const { logout } = useAuth();
  const navigate = useNavigate();

  const salir = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const { desde } = datosAntiguedad(usuario.createdAt);
  const cuenta = [
    { icono: FaEnvelope, etiqueta: "Correo de acceso", valor: usuario.email, copiable: true },
    { icono: FaIdCard, etiqueta: "CUIT", valor: usuario.cuit, copiable: true },
    { icono: FaUsers, etiqueta: "Categoría", valor: mayuscula(usuario.categoria) || "Socio" },
    { icono: FaUserShield, etiqueta: "Estado de la cuenta", valor: ESTADOS_SOCIO[usuario.estado]?.texto || mayuscula(usuario.estado) },
    { icono: FaCalendarDay, etiqueta: "Cuenta creada", valor: desde && desde.charAt(0).toUpperCase() + desde.slice(1) },
  ];

  const pieCuenta = (
    <p className="border-t border-gray-100 bg-surface px-5 py-4 text-sm text-gray-600 sm:px-6">
      Para editar tus datos de contacto andá a <Link to="/socios/empresa" className="font-bold text-[#0875b1] hover:underline">Mi empresa</Link>.
    </p>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <p className="mb-1 text-sm font-semibold text-primary">TU CUENTA</p>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-navy sm:text-3xl">Configuración</h1>
      </header>

      <div className="space-y-6">
        <TarjetaFicha titulo="Mi cuenta" icono={FaUserShield} columnas={2} datos={cuenta} pie={pieCuenta} />

        <TarjetaSeccion titulo="Sesión" icono={FaRightFromBracket}>
          <p className="text-sm text-gray-600">Si usás una computadora compartida, cerrá sesión al terminar.</p>
          <button
            type="button"
            onClick={salir}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-navy transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
          >
            <FaRightFromBracket /> Cerrar sesión
          </button>
        </TarjetaSeccion>
      </div>
    </div>
  );
}