import { FaGem, FaHandshake, FaStar, FaUser } from "react-icons/fa6";

export const categoriasSocio = [
  {
    nombre: "Padrino",
    etiqueta: "BENEFICIOS EXCLUSIVOS",
    descripcion:
      "Acceso gratuito o con bonificación especial a eventos tarifados. Disfrutá de un reconocimiento destacado por tu respaldo institucional, manteniendo la misma información y transparencia.",
    icono: <FaGem className="text-2xl" />,
  },
  {
    nombre: "Activo",
    etiqueta: "VOZ Y VOTO",
    descripcion:
      "Abonando una cuota mensual con ventana de pago del 1 al 10, accedés a bonificaciones máximas en eventos y capacitaciones, logrando una participación plena y activa.",
    icono: (
      <div className="relative">
        <FaUser className="text-2xl" />
        <FaStar className="text-[10px] absolute -bottom-1 -right-2 text-teal bg-[#E8F4F8] rounded-full border border-[#E8F4F8]" />
      </div>
    ),
  },
  {
    nombre: "Adherente",
    etiqueta: "ACCESO A LA RED",
    descripcion:
      "La puerta de entrada natural a la comunidad CAPyMEF. Participá de eventos con arancel y solicitá acceso a becas o descuentos especiales sujetos a disponibilidad.",
    icono: <FaHandshake className="text-3xl" />,
  },
];
