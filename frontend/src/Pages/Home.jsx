import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { FaGem, FaHandshake, FaStar, FaUser, FaUserTie, FaPenClip, FaCoins, FaUsers, FaMagnifyingGlassChart } from "react-icons/fa6";

// IMPORTACIONES DE IMÁGENES CORRECTAS (desde src/assets/img/)
import fondoHome from "../assets/img/FondoCapymef.png";
import hero2 from "../assets/img/image.webp";
import hero3 from "../assets/img/image3.webp";
import hero4 from "../assets/img/image4.webp";
import hero5 from "../assets/img/image5.webp";
import logoCAME from "../assets/img/Came.png";
import logoDGR from "../assets/img/dgr.png";
import logoAFIP from "../assets/img/afip.png";

import { Card, Footer, Navbar, NavbarPublico, Modal } from "../Components/index.js";
import { obtenerNoticiasPublicas } from "../services/noticiasService.js";

const formatearFecha = (fecha) => (
  fecha ? new Date(fecha).toLocaleDateString("es-AR") : "Fecha no disponible"
);

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [imagenActiva, setImagenActiva] = useState(0);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!isOpen) return undefined;

    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflowOriginal;
    };
  }, [isOpen]);

  // CARRUSEL ARREGLADO: Ahora usa las variables importadas directamente
  const imagenesHero = [
    fondoHome,
    hero2,
    hero3,
    hero4,
    hero5
  ];
  
  const posicionesHero = [
    "center 56px",
    "center center",
    "center center",
    "center center",
    "center center"
  ];

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setImagenActiva((prev) => (prev + 1) % imagenesHero.length);
    }, 5500);

    return () => window.clearInterval(intervalo);
  }, [imagenesHero.length]);

  const [noticias, setNoticias] = useState([]);
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarNoticias = async () => {
      try {
        const result = await obtenerNoticiasPublicas();
        if (result.exito) {
          setNoticias(Array.isArray(result.data) ? result.data : []);
        }
      } catch (error) {
        console.error("Error cargando noticias en el Home:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarNoticias();
  }, []);

  useEffect(() => {
    const elementos = document.querySelectorAll(".inicio-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    elementos.forEach((elemento) => observer.observe(elemento));

    return () => observer.disconnect();
  }, [cargando, noticias]);

  return (
    <>
      <header>
        {token ? <Navbar /> : <NavbarPublico />}
      </header>
      <main className="w-full overflow-x-hidden">
        
        {/* --- Hero Section --- */}
        <section id="inicio" className="w-full font-sans">
          <div className="relative flex min-h-screen w-full flex-col items-start justify-center overflow-hidden bg-gray-900 inicio-reveal inicio-reveal-hero">
            
            {imagenesHero.map((img, index) => (
              <div
                key={index}
                className={`absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-1000 ease-in-out ${
                  index === imagenActiva ? "opacity-100 z-0" : "opacity-0 -z-10"
                }`}
                style={{
                  backgroundImage: `url("${img}")`,
                  backgroundPosition: posicionesHero[index] || "center center",
                }}
              />
            ))}

            <div className="absolute inset-0 bg-black/50 z-0"></div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 flex flex-col items-start mt-16">
              
              <span className="text-white/90 text-sm sm:text-base font-bold tracking-[0.2em] uppercase mb-4 drop-shadow-md">
                Impulsando el desarrollo comercial
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-[65px] lg:text-[70px] text-white font-extrabold tracking-tight leading-[1.1] max-w-4xl drop-shadow-lg">
                Cámara de Pequeñas <br className="hidden sm:block" />
                y Medianas Empresas <br className="hidden sm:block" />
                de Formosa
              </h1>

              <div className="mt-8 border-l-4 border-[#1D7BB6] pl-5">
                <p className="text-base sm:text-lg md:text-xl text-white/90 font-medium max-w-2xl leading-relaxed drop-shadow-md">
                  Sumate a CAPYMEF. Accedé a beneficios exclusivos, capacitaciones
                  y herramientas digitales para hacer crecer tu negocio.
                </p>
              </div>

              <button
                className="mt-10 bg-[#1D7BB6] hover:bg-[#156091] text-white text-[15px] sm:text-[17px] font-bold py-3.5 px-8 rounded-full transition-all duration-300 flex items-center gap-3 shadow-xl hover:-translate-y-1"
                onClick={() => setIsOpen(true)}
              >
                Quiero asociarme
              </button>

              {/* --- MODAL --- */}
              {isOpen && createPortal(
                (
                <div
                  onClick={() => setIsOpen(false)}
                  className="rounded-sm fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#F4F8FB] border border-gray-300 rounded-sm shadow-2xl p-4 sm:p-8 md:p-12 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative mx-2 sm:mx-4 animacion-modal"
                  >
                    <h3 className="text-xl sm:text-2xl md:text-[26px] font-normal text-center text-[#1D7BB6] mb-5 sm:mb-8 font-sans tracking-wide">
                      COMO SUMARSE A CAPYMEF
                    </h3>

                    <div className="font-sans text-gray-900 text-sm sm:text-lg leading-relaxed space-y-2">
                      <p>Para garantizar una atención personalizada y asignarte la categoría ideal para tu pyme, el proceso de alta inicial lo realizamos de forma directa.</p>
                      <p>¿Cómo ser socio?</p>
                      <p>Contactanos: Escribinos o acercate a nuestras oficinas para conocer los requisitos formales y completar tu solicitud de ingreso oficial.</p>
                      <p>Tu Alta: Tu solicitud será evaluada y aprobada por la Comisión Directiva para darte la bienvenida a la Cámara.</p>
                      <p>Registro Digital: Una vez que tu alta sea aprobada, podrás volver a esta página web, crear tu cuenta y subir tu documentación para acceder a tu panel de autogestión, beneficios y pago de cuotas.</p>

                      <p className="pt-2">Nuestras vías de contacto:</p>
                      <div className="flex flex-col lg:flex-row gap-5">
                        <ul className="space-y-3 flex-1">
                          <li>📍 Dirección: Maipú 651, Formosa, Argentina, 3600.</li>
                          <li>📱 Tel: 0370 446-2508</li>
                          <li>✉️ Correo: info@capymef.ar</li>
                        </ul>
                        <iframe className="w-full lg:w-142.5 max-w-full h-44 sm:h-48 rounded shadow" src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d234.04766724362105!2d-58.1732974269762!3d-26.17999337323511!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x945ca5ef58d8ecd9%3A0x7d600e7dfa9b965c!2sCamara%20De%20Pequenas%20Y%20Medianas%20Empresas%20De%20Formosa!5e0!3m2!1ses!2sus!4v1786555633335!5m2!1ses!2sus" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                      </div>
                    </div>

                    <div className="flex justify-end mt-10 font-sans">
                      <button
                        onClick={() => setIsOpen(false)}
                        className="px-8 py-2.5 bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold rounded-full transition-colors text-sm tracking-wide shadow-md"
                      >
                        ENTENDIDO
                      </button>
                    </div>
                  </div>
                </div>
                ),
                document.body
              )}
            </div>
          </div>
        </section>

                {/*NOVEDADES*/}
<section id="novedades" className="w-full bg-[#F4F8FB] px-6 sm:px-10 md:px-24 pt-20 pb-20 font-sans inicio-reveal">
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between mb-16 max-w-7xl mx-auto">
            {/* Título alineado a la izquierda, sin subtítulo y con la fuente Sans bien gruesa */}
            <div className="flex flex-col items-start w-full">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#153448] tracking-tight font-sans">
                Novedades de la Cámara
              </h2>
            </div>
            
            {/* Botón Ver Todas: A la izquierda en celular (self-start), a la derecha en PC */}
            <Link
              to="/noticias"
              className="mt-6 md:mt-0 self-start md:self-auto flex-shrink-0 bg-[#153448] text-white text-sm font-semibold rounded-full px-6 py-3 transition-colors hover:bg-[#1b4f7a] shadow-md flex items-center gap-2"
            >
              Ver todas &rarr;
            </Link>
          </div>

          {cargando ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-4 border-[#1b4f7a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Buscando las últimas novedades...</p>
            </div>
          ) : noticias.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 max-w-3xl mx-auto shadow-sm">
              <p className="text-gray-600 text-lg">Todavía no hay noticias publicadas.</p>
            </div>
          ) : (
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {noticias.slice(0, 3).map((noticia) => (
                <article
                  key={noticia.id}
                  onClick={() => setNoticiaSeleccionada(noticia)}
                  className="bg-white rounded-2xl overflow-hidden flex flex-col shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer group"
                >
                  {/* Imagen y Etiqueta */}
                  <div className="h-56 relative overflow-hidden bg-gray-100">
                    <span className="absolute top-4 left-4 bg-[#F4F8FB] text-[#1b4f7a] text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-sm uppercase tracking-wide flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      {noticia.categoria || 'Institucional'}
                    </span>
                    <img
                      src={noticia.imagenUrl || 'https://via.placeholder.com/600x400?text=Sin+Imagen'}
                      alt={noticia.titulo}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  
                  {/* Cuerpo de la Tarjeta */}
                  <div className="p-6 md:p-8 flex flex-col flex-1 bg-white">
                    {/* Fecha e ícono en azul oscuro (mismo color que el botón) */}
                    <div className="flex items-center gap-2 mb-3 text-[#1b4f7a]">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span className="text-[11px] font-semibold uppercase tracking-wider">
                        {formatearFecha(noticia.fechaPublicacion)}
                      </span>
                    </div>
                    
                    {/* Título más chico (text-lg en lugar de text-xl) */}
                    <h3 className="text-lg font-bold mb-4 leading-snug text-[#153448] group-hover:text-[#1b4f7a] transition-colors line-clamp-2">
                      {noticia.titulo}
                    </h3>
                    
                    <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed line-clamp-3">
                      {noticia.subtitulo || noticia.resumen}
                    </p>
                    
                    {/* Botón sutil con "Leer más" y flechita horizontal */}
                    <div className="mt-auto flex items-center text-[#1b4f7a] font-bold text-sm bg-[#F4F8FB] w-max px-4 py-2 rounded-lg transition-colors group-hover:bg-[#1b4f7a] group-hover:text-white">
                      Leer más <span className="ml-2 transform transition-transform group-hover:translate-x-1">&rarr;</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {noticiaSeleccionada && (
            <Modal
              noticia={noticiaSeleccionada}
              onClose={() => setNoticiaSeleccionada(null)}
            />
          )}
        </section>

{/*Sobre Nosotros + Autoridades*/}
        <section id="nosotros" className="w-full bg-gradient-to-r from-[#E5F1F8] to-[#F4F8FB] px-6 sm:px-10 md:px-24 py-20 font-sans inicio-reveal">
          <div className="max-w-7xl mx-auto flex flex-col gap-20">

            {/* --- BLOQUE 1: Historia Institucional --- */}
            <div className="w-full flex flex-col items-start">
              <h2 className="text-3xl md:text-[40px] font-extrabold text-[#153448] mb-8 leading-tight tracking-tight">
                Sobre CAPyMEF
              </h2>

              <div className="w-full space-y-5 text-lg text-[#2c4c5e] leading-relaxed">
                <p>
                  Esta institución fue creada promediando la década de los ´40 en una incipiente Formosa comercial con el nombre de Cámara de Almaceneros Minoristas y Afines de Formosa. Actualmente es una de las asociaciones empresarias más representativas de la provincia. Si bien su sede está en la Ciudad de Formosa, hace poco tiempo inició un política de acercamiento a micro, pequeños y medianos empresarios del interior provincial concentrando sus esfuerzos en las localidades de Clorinda, El Colorado y Pirané.
                </p>
                <p>
                  Su estructura interna contempla la conformación de la Comisión de Mujeres PyME y la Comisión de Jóvenes Empresarios; éstos últimos han logrado posicionar a jóvenes empresarios formoseños en lugares destacados en la última edición del Premio Nacional al Joven Empresario PyMe. La Cámara, a su vez, es miembro de la Confederación Argentina de la Mediana Empresa (CAME) donde ocupa, por segundo período consecutivo, la Vicepresidencia Región NEA.
                </p>
                <p>
                  La CAPYMEF es la entidad gremial empresaria más representativa del empresariado Mipyme de Formosa, cuenta con más de un centenar de asociados de diversos rubros y sectores económicos.
                </p>
                <p>
                  Se inició una política de acercamiento a otras entidades locales, provinciales y regionales con el objetivo central de potenciar el trabajo cooperativo y complementario en temas como diseño, elaboración y formulación de proyectos de inversión y puesta en marcha de un observatorio de desempeño de las Mipymes locales denominado Monitor PyME del NEA. Se acordó aportar recursos humanos e infraestructura disponible por cada entidad y gestión de vínculos ante otros actores públicos y privados.
                </p>
              </div>
            </div>

            {/* --- BLOQUE 2: Comisión Directiva  --- */}
            <div className="w-full">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#153448] mb-2 tracking-tight">
                Autoridades de la Cámara 
              </h2>
              <p className="text-lg text-[#2c4c5e] mb-12">
                Conocé a la Comisión Directiva que impulsa el crecimiento de las PyMEs.
              </p>

              {/* Grupo 1: MESA EJECUTIVA */}
              <div className="mb-10">
                <div className="flex items-center gap-4 mb-6">
                  {/* Color azulado nuevo: #187A8D */}
                  <h3 className="text-xs font-bold text-[#187A8D] uppercase tracking-[0.2em] shrink-0">Mesa Ejecutiva</h3>
                  <div className="w-full h-px bg-gray-300/60"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="w-14 h-14 shrink-0 bg-[#E8F4F8] rounded-xl flex items-center justify-center text-[#187A8D]">
                      <FaUserTie size={22} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#187A8D] text-[10px] font-extrabold uppercase tracking-widest mb-1">Presidente</span>
                      <span className="text-[#153448] text-lg font-bold leading-tight">Carlos A. Werlen</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="w-14 h-14 shrink-0 bg-[#E8F4F8] rounded-xl flex items-center justify-center text-[#187A8D]">
                      <FaPenClip size={22} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#187A8D] text-[10px] font-extrabold uppercase tracking-widest mb-1">Secretario</span>
                      <span className="text-[#153448] text-lg font-bold leading-tight">Antonio F. Hryniewicz</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="w-14 h-14 shrink-0 bg-[#E8F4F8] rounded-xl flex items-center justify-center text-[#187A8D]">
                      <FaCoins size={22} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#187A8D] text-[10px] font-extrabold uppercase tracking-widest mb-1">Tesorero</span>
                      <span className="text-[#153448] text-lg font-bold leading-tight">Mónica G. Lozano</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grupo 2: VOCALES TITULARES */}
              <div className="mb-10">
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-xs font-bold text-[#187A8D] uppercase tracking-[0.2em] shrink-0">Vocales Titulares</h3>
                  <div className="w-full h-px bg-gray-300/60"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="w-14 h-14 shrink-0 bg-[#E8F4F8] rounded-xl flex items-center justify-center text-[#187A8D]">
                      <FaUsers size={22} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#187A8D] text-[10px] font-extrabold uppercase tracking-widest mb-1">Vocal 1° Titular</span>
                      <span className="text-[#153448] text-lg font-bold leading-tight">Federico J. Domínguez</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="w-14 h-14 shrink-0 bg-[#E8F4F8] rounded-xl flex items-center justify-center text-[#187A8D]">
                      <FaUsers size={22} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#187A8D] text-[10px] font-extrabold uppercase tracking-widest mb-1">Vocal 2° Titular</span>
                      <span className="text-[#153448] text-lg font-bold leading-tight">Walter Ramón Arauz</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="w-14 h-14 shrink-0 bg-[#E8F4F8] rounded-xl flex items-center justify-center text-[#187A8D]">
                      <FaUsers size={22} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#187A8D] text-[10px] font-extrabold uppercase tracking-widest mb-1">Vocal 3° Titular</span>
                      <span className="text-[#153448] text-lg font-bold leading-tight">Marcelo Enrique Zanín</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grupo 3: SUPLENTES Y REVISORES */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-xs font-bold text-[#187A8D] uppercase tracking-[0.2em] shrink-0">Suplentes y Revisores</h3>
                  <div className="w-full h-px bg-gray-300/60"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="w-12 h-12 shrink-0 bg-[#E8F4F8] rounded-xl flex items-center justify-center text-[#187A8D]">
                      <FaUser size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#187A8D] text-[10px] font-extrabold uppercase tracking-widest mb-1">Vocal 1° Suplente</span>
                      <span className="text-[#153448] text-[15px] font-bold leading-tight">Jorge Ernesto Miani</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="w-12 h-12 shrink-0 bg-[#E8F4F8] rounded-xl flex items-center justify-center text-[#187A8D]">
                      <FaUser size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#187A8D] text-[10px] font-extrabold uppercase tracking-widest mb-1">Vocal 2° Suplente</span>
                      <span className="text-[#153448] text-[15px] font-bold leading-tight">Ramón O. Centurión</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="w-12 h-12 shrink-0 bg-[#E8F4F8] rounded-xl flex items-center justify-center text-[#187A8D]">
                      <FaMagnifyingGlassChart size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#187A8D] text-[10px] font-extrabold uppercase tracking-widest mb-1">Rev. Cuentas Titular</span>
                      <span className="text-[#153448] text-[15px] font-bold leading-tight">Sergio Eduardo Alloi</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="w-12 h-12 shrink-0 bg-[#E8F4F8] rounded-xl flex items-center justify-center text-[#187A8D]">
                      <FaMagnifyingGlassChart size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#187A8D] text-[10px] font-extrabold uppercase tracking-widest mb-1">Rev. Cuentas Supl.</span>
                      <span className="text-[#153448] text-[15px] font-bold leading-tight">Augusto E. Boggiano</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

{/*La Vista N3 - Formas de ser socio */}
        <section id="beneficios" className="w-full bg-gradient-to-r from-[#E5F1F8] to-[#F4F8FB] px-6 md:px-24 py-20 font-sans inicio-reveal">

          {/* Título Principal alineado a la izquierda */}
          <div className="flex flex-col items-start mb-16 max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-[40px] font-extrabold text-[#153448] tracking-tight leading-tight">
              Formas de ser socio
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl">
              Conocé las diferentes categorías societarias y elegí la que mejor se adapte al tamaño y objetivos de tu PyME.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">

              {/* --- Tarjeta 1: Padrino --- */}
              <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col group border border-gray-100">
                
                {/* Ícono a la izquierda */}
                <div className="w-16 h-16 bg-[#E8F4F8] rounded-2xl flex items-center justify-center text-[#187A8D] mb-8 shrink-0 transition-transform duration-300 group-hover:scale-110">
                  <FaGem className="text-2xl" />
                </div>
                
                <h3 className="text-2xl font-extrabold text-[#153448] mb-4">
                  Padrino
                </h3>

                <p className="text-gray-500 text-[15px] leading-relaxed flex-grow">
                  Acceso gratuito o con bonificación especial a eventos tarifados. Disfrutá de un reconocimiento destacado por tu respaldo institucional, manteniendo la misma información y transparencia.
                </p>

                {/* Botón inferior con el nuevo color #187A8D para el texto y el hover */}
                <div className="mt-8 bg-[#E8F4F8] text-[#187A8D] text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-full w-max cursor-pointer hover:bg-[#187A8D] hover:text-white transition-colors">
                  BENEFICIOS EXCLUSIVOS
                </div>
              </div>

              {/* --- Tarjeta 2: Activo --- */}
              <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col group border border-gray-100">
                
                {/* Ícono a la izquierda */}
                <div className="w-16 h-16 bg-[#E8F4F8] rounded-2xl flex items-center justify-center text-[#187A8D] mb-8 shrink-0 transition-transform duration-300 group-hover:scale-110">
                  <div className="relative">
                    <FaUser className="text-2xl" />
                    <FaStar className="text-[10px] absolute -bottom-1 -right-2 text-[#187A8D] bg-[#E8F4F8] rounded-full border border-[#E8F4F8]" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-extrabold text-[#153448] mb-4">
                  Activo
                </h3>

                <p className="text-gray-500 text-[15px] leading-relaxed flex-grow">
                  Abonando una cuota mensual con ventana de pago del 1 al 10, accedés a bonificaciones máximas en eventos y capacitaciones, logrando una participación plena y activa.
                </p>

                {/* Botón inferior con el nuevo color #187A8D para el texto y el hover */}
                <div className="mt-8 bg-[#E8F4F8] text-[#187A8D] text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-full w-max cursor-pointer hover:bg-[#187A8D] hover:text-white transition-colors">
                  VOZ Y VOTO
                </div>
              </div>

              {/* --- Tarjeta 3: Adherente --- */}
              <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col group border border-gray-100">
                
                {/* Ícono a la izquierda */}
                <div className="w-16 h-16 bg-[#E8F4F8] rounded-2xl flex items-center justify-center text-[#187A8D] mb-8 shrink-0 transition-transform duration-300 group-hover:scale-110">
                  <FaHandshake className="text-3xl" />
                </div>
                
                <h3 className="text-2xl font-extrabold text-[#153448] mb-4">
                  Adherente
                </h3>

                <p className="text-gray-500 text-[15px] leading-relaxed flex-grow">
                  La puerta de entrada natural a la comunidad CAPyMEF. Participá de eventos con arancel y solicitá acceso a becas o descuentos especiales sujetos a disponibilidad.
                </p>

                {/* Botón inferior con el nuevo color #187A8D para el texto y el hover */}
                <div className="mt-8 bg-[#E8F4F8] text-[#187A8D] text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-full w-max cursor-pointer hover:bg-[#187A8D] hover:text-white transition-colors">
                  ACCESO A LA RED
                </div>
              </div>

            </div>
          </div>
        </section>
      

        {/* --- VISTA N5: Información Institucional --- */}
        <section id="informacion" className="w-full bg-gradient-to-r from-[#E5F1F8] to-[#F4F8FB] px-6 md:px-24 py-20 font-sans inicio-reveal">
          
          <div className="flex flex-col items-center mb-16 text-center">
            <h2 className="text-3xl md:text-[40px] font-extrabold text-[#153448] tracking-tight">
              Información institucional
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl">
              Accedé a nuestros documentos oficiales para conocer nuestro marco normativo y la gestión de nuestros recursos.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

              {/* --- Tarjeta: Estatuto Social --- */}
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col group border border-gray-100 items-center text-center">
                <div className="relative z-10 text-[#1b4f7a] mb-6 h-16 w-16 bg-[#E5F1F8] rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                
                <h3 className="text-2xl font-extrabold text-[#153448] mb-4">
                  Estatuto Social
                </h3>
                <div className="w-16 h-[2px] bg-[#E5F1F8] mx-auto mb-6"></div>

                <p className="text-gray-500 text-[15px] leading-relaxed mb-8 flex-grow">
                  Conocé el marco normativo de CAPYMEF. Detalla los derechos y obligaciones de los socios, y las reglas que rigen el funcionamiento de nuestra Comisión Directiva.
                </p>

                {/* Botón de descarga del Estatuto */}
                <a 
                  href="/ESTATUTO.pdf" 
                  download="Estatuto_CAPYMEF.pdf"
                  className="mt-auto px-6 py-3 bg-[#153448] text-white text-sm font-semibold rounded-full transition-colors hover:bg-[#1b4f7a] shadow-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar Estatuto
                </a>
              </div>

              {/* --- Tarjeta: Balance Financiero --- */}
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col group border border-gray-100 items-center text-center">
                <div className="relative z-10 text-[#1b4f7a] mb-6 h-16 w-16 bg-[#E5F1F8] rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                
                <h3 className="text-2xl font-extrabold text-[#153448] mb-4">
                  Transparencia y Balances
                </h3>
                <div className="w-16 h-[2px] bg-[#E5F1F8] mx-auto mb-6"></div>

                <p className="text-gray-500 text-[15px] leading-relaxed mb-8 flex-grow">
                  Mantenemos un compromiso absoluto con la gestión clara. Analizá la evolución histórica de nuestros recursos y gastos en detalle.
                </p>

                {/* Botón de descarga del Balance */}
                <a 
                  href="/Balance2011-2025_compressed.pdf" 
                  download="Balances_Historicos_CAPYMEF.pdf"
                  className="mt-auto px-6 py-3 bg-[#153448] text-white text-sm font-semibold rounded-full transition-colors hover:bg-[#1b4f7a] shadow-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar Balance
                </a>
              </div>

            </div>
          </div>
        </section>
{/* --- VISTA N6: Vinculación Institucional --- */}
        <section id="vinculacion" className="w-full bg-gradient-to-r from-[#F4F8FB] to-[#E5F1F8] px-6 md:px-24 py-20 font-sans inicio-reveal">
          
          {/* Título y bajada centrados */}
          <div className="flex flex-col items-center mb-16 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-[40px] font-extrabold text-[#153448] tracking-tight leading-tight">
              Vinculación Institucional
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Trabajamos en conjunto con organismos y entidades clave para potenciar el desarrollo de nuestras PyMEs, brindando respaldo y agilizando gestiones.
            </p>
          </div>

          {/* Grilla de Aliados (CAME, ATP, ARCA) */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
              
              {/* Aliado: CAME */}
              <a 
                href="https://www.redcame.org.ar/" 
                target="_blank" 
                rel="noreferrer"
                className="bg-white h-32 rounded-3xl shadow-sm flex items-center justify-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 border border-gray-100 group p-6"
              >
                <img 
                  src={logoCAME} 
                  alt="CAME" 
                  className="max-h-full max-w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300" 
                />
              </a>

              {/* Aliado: DGR / ATP */}
              <a 
                href="https://www.atpformosa.gob.ar/" 
                target="_blank" 
                rel="noreferrer"
                className="bg-white h-32 rounded-3xl shadow-sm flex items-center justify-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 border border-gray-100 group p-6"
              >
                <img 
                  src={logoDGR} 
                  alt="ATP Formosa" 
                  className="max-h-full max-w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300" 
                />
              </a>

              {/* Aliado: AFIP / ARCA */}
              <a 
                href="https://www.afip.gob.ar/" 
                target="_blank" 
                rel="noreferrer"
                className="bg-[#153448] h-32 rounded-3xl shadow-sm flex items-center justify-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 border border-[#153448] group p-6"
              >
                <img 
                  src={logoAFIP} 
                  alt="ARCA" 
                  className="max-h-full max-w-full object-contain opacity-100 transition-opacity duration-300" 
                />
              </a>

            </div>
          </div>
        </section>
        </main>
        

      
      {/*Footer */}
      <footer className="bg-[#1b4f7a] pt-5">
        <Footer />
      </footer>
    </>
  );
}