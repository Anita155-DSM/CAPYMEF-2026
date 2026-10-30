import { FaEnvelope, FaFacebookF, FaLocationDot, FaPhone, FaXTwitter } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import { contacto } from "@/features/landing/data/contacto";

const URL_FACEBOOK = "https://www.facebook.com/camara.capymef/";
const URL_X = "https://x.com/capymef";

const enlacesNavegacion = [
  { id: "inicio", nombre: "Inicio" },
  { id: "novedades", nombre: "Novedades" },
  { id: "nosotros", nombre: "Sobre nosotros" },
  { id: "beneficios", nombre: "Beneficios" },
  { id: "informacion", nombre: "Información" },
  { id: "vinculacion", nombre: "Vinculación" },
];

const claseEnlace = "text-left text-lg text-white/90 transition-colors hover:text-white cursor-pointer";
const claseRed =
  "grid size-13 place-items-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/25";

function Columna({ titulo, children }) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-white">{titulo}</h3>
      <div className="mb-8 mt-3 h-0.5 w-10 bg-[#55b6e8]" />
      {children}
    </div>
  );
}

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  // Desde la Landing baja suave a la sección; desde otra página vuelve a "/" y luego baja.
  const irASeccion = (id) => {
    if (id === "inicio") {
      if (location.pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate("/");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const bajar = () => {
      const elemento = document.getElementById(id);
      if (elemento) {
        const navOffset = 90;
        const top = elemento.getBoundingClientRect().top + window.scrollY - navOffset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    };

    if (location.pathname === "/") {
      bajar();
    } else {
      navigate("/");
      setTimeout(bajar, 300);
    }
  };

  return (
    <section className="w-full bg-sidebar font-sans text-white">
      <div className="mx-auto max-w-356 px-6 pb-5 sm:px-10 lg:px-16 lg:pt-24">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-3 md:gap-10">
          {/* 1. CONTACTO */}
          <Columna titulo="Contacto">
            <ul className="space-y-6 text-lg text-white/90">
              <li className="flex items-center gap-4">
                <FaLocationDot className="w-5 shrink-0 text-[#55b6e8]" />
                <span>{contacto.direccionCorta}</span>
              </li>
              <li className="flex items-center gap-4">
                <FaPhone className="w-5 shrink-0 text-[#55b6e8]" />
                <a href={`tel:${contacto.telefono.replace(/\D/g, "")}`} className="hover:text-white">
                  {contacto.telefono}
                </a>
              </li>
              <li className="flex items-center gap-4">
                <FaEnvelope className="w-5 shrink-0 text-[#55b6e8]" />
                <a href={`mailto:${contacto.correo}`} className="break-all hover:text-white">
                  {contacto.correo}
                </a>
              </li>
            </ul>
          </Columna>

          {/* 2. NAVEGACIÓN */}
          <Columna titulo="Navegación">
            <ul className="space-y-4">
              {enlacesNavegacion.map((enlace) => (
                <li key={enlace.id}>
                  <button
                    type="button"
                    onClick={() => irASeccion(enlace.id)}
                    className={claseEnlace}
                  >
                    {enlace.nombre}
                  </button>
                </li>
              ))}
            </ul>
          </Columna>

          {/* 3. REDES SOCIALES */}
          <Columna titulo="Redes Sociales">
            <div className="flex gap-5">
              <a href={URL_FACEBOOK} target="_blank" rel="noreferrer" aria-label="Facebook de CAPyMEF" className={claseRed}>
                <FaFacebookF />
              </a>
              <a href={URL_X} target="_blank" rel="noreferrer" aria-label="X (Twitter) de CAPyMEF" className={claseRed}>
                <FaXTwitter />
              </a>
            </div>
          </Columna>
        </div>

        <div className="mt-16 border-t border-white/20 pt-8 text-center text-base text-white/80">
          © {new Date().getFullYear()} CAPyMEF. Todos los derechos reservados.
        </div>
      </div>
    </section>
  );
}
