import { Link } from "react-router-dom";
import { FaCircleCheck, FaCircleXmark, FaClock } from "react-icons/fa6";

// Mercado Pago redirige acá con parámetros en la URL (status, payment_id, etc.).
// No los usamos para nada: cualquiera puede escribirlos a mano. El estado real
// de la cuota lo define el webhook en el backend (el layout ya vuelve a pedir las cuotas al cargar).
const CONTENIDO = {
  exitoso: {
    Icono: FaCircleCheck,
    color: "text-[#00bf68]",
    titulo: "¡Recibimos tu pago!",
    texto: "Mercado Pago aprobó la operación. En unos minutos tu cuota figurará como pagada y vas a recibir el comprobante por correo.",
  },
  pendiente: {
    Icono: FaClock,
    color: "text-[#e0a030]",
    titulo: "Tu pago está en proceso",
    texto: "Mercado Pago todavía está procesando la operación. Cuando se acredite, tu cuota se actualizará automáticamente.",
  },
  fallido: {
    Icono: FaCircleXmark,
    color: "text-[#e66d4a]",
    titulo: "No se pudo completar el pago",
    texto: "La operación fue rechazada o cancelada. No se realizó ningún cobro. Podés intentarlo nuevamente desde la sección Pagos.",
  },
};

export default function ResultadoPago({ tipo }) {
  const { Icono, color, titulo, texto } = CONTENIDO[tipo] || CONTENIDO.pendiente;

  return (
    <section className="min-h-[calc(100vh-9rem)] bg-[#edf7fd] px-1 py-2 sm:px-3 sm:py-5">
      <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <Icono className={`mx-auto text-5xl ${color}`} />
        <h1 className="mt-4 text-2xl font-bold text-[#132A46]">{titulo}</h1>
        <p className="mt-3 text-sm text-gray-600">{texto}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/socios" className="border border-[#d7e0e5] px-4 py-2 text-sm text-[#17384f] hover:bg-[#f4f9fc]">Ir al inicio</Link>
          <Link to="/socios/pagos" className="bg-[#1b527d] px-4 py-2 text-sm font-bold text-white hover:bg-[#164568]">Ver mis pagos</Link>
        </div>
      </div>
    </section>
  );
}
