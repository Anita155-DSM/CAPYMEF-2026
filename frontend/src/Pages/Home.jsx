import { useState, useEffect } from "react";
import { FaGem, FaHandshake, FaStar, FaUser } from "react-icons/fa6";
import { Link } from "react-router-dom";
import fondoHome from "../assets/img/FondoCapymef.png";
import { Card, Footer, Navbar, NavbarPublico,Modal } from "../Components/index.js";
import { obtenerNoticiasPublicas } from "../services/noticiasService.js";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const token = localStorage.getItem("token")

  // 1. ESTADOS PARA LAS NOTICIAS
  const [noticias, setNoticias] = useState([]);
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  

  // 2. TRAEMOS LAS NOTICIAS AL CARGAR LA PÁGINA
  useEffect(() => {
    const cargarNoticias = async () => {
      try {
        const result = await obtenerNoticiasPublicas();
        if (result.exito) {
          setNoticias(result.data.slice(0, 3));
        }
      } catch (error) {
        console.error("Error cargando noticias en el Home:", error);
      } finally {
        setCargando(false); // AGREGAMOS ESTO AL FINAL
      }
    };

    cargarNoticias();
  }, []);
  return (
    <>
      {/* Se coloca dentro del main para poder hacer que ocupe la pantalla completa con el w-full */}
      {/*Header */}
      <header>
        {token ? <Navbar /> : <NavbarPublico />}
      </header>
      <main className="w-full overflow-x-hidden overflow-y-hidden">
        {/*La Vista N1 */}
        <section className="w-full font-sans">
          <div
            className="min-h-screen w-full bg-cover bg-[center_4rem] bg-no-repeat bg-white justify-center items-start flex flex-col"
            style={{ backgroundImage: `url(${fondoHome})` }}
          >
            {/* Contenedor del texto central */}
            <div className="px-4 py-4 line-clamp-3">
              <h1 className="text-5xl md:text-7xl text-white font-serif font-semibold px8 py-4 -rounded-xl inline-block">
                Cámara de Pequeñas y Medianas Empresas Formosa
              </h1>
              <br /> {/* Salto de línea para separar el título del subtítulo */}
              <p className="mt-6 text-xl text-white font-bold bg-black/20 inline-block px-6 py-2 rounded-lg max-w-lg">
                Sumate a CAPYMEF. Accedé a beneficios exclusivos, capacitaciones
                y herramientas digitales para hacer crecer tu negocio.
              </p>
            </div>

            {/* Boton que abre el MODAL */}
            <div className="mt-5 ml-6">
              <button
                className="mt-8 bg-[#1D7BB6] hover:bg-[#156091] text-[18px] text-white font-black py-3 px-3 rounded-lg transition-colors shadow-lg"
                onClick={() => setIsOpen(true)}
              >
                Quiero asociarme
              </button>
              {/*ACA VA EL MODAL */}
              {isOpen && (
                <div
                  onClick={() => setIsOpen(false)}
                  className="rounded-sm fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    // Fondo claro como en tu imagen, max-w-4xl para hacerlo ancho pero sin ocupar todo, y padding generoso
                    className="bg-[#F4F8FB] border border-gray-300 rounded-sm shadow-2xl p-8 md:p-12 w-full max-w-4xl relative mx-4 animacion-modal"
                  >

                    {/* Título centrado con color azul y fuente Sans */}
                    <h3 className="text-2xl md:text-[26px] font-normal text-center text-[#1D7BB6] mb-8 font-sans tracking-wide">
                      COMO SUMARSE A CAPYMEF
                    </h3>

                    {/* Contenedor del texto con la misma tipografía que Sobre Nosotros */}
                    <div className="font-sans text-gray-900 text-lg leading-relaxed space-y-1">
                      <p>
                        Para garantizar una atención personalizada y asignarte la categoría ideal para tu pyme, el proceso de alta inicial lo realizamos de forma directa.
                      </p>
                      <p>¿Cómo ser socio?</p>
                      <p>
                        Contactanos: Escribinos o acercate a nuestras oficinas para conocer los requisitos formales y completar tu solicitud de ingreso oficial.
                      </p>
                      <p>
                        Tu Alta: Tu solicitud será evaluada y aprobada por la Comisión Directiva para darte la bienvenida a la Cámara.
                      </p>
                      <p>
                        Registro Digital: Una vez que tu alta sea aprobada, podrás volver a esta página web, crear tu cuenta y subir tu documentación para acceder a tu panel de autogestión, beneficios y pago de cuotas.
                      </p>

                      <p className="pt-2">Nuestras vías de contacto:</p>
                      {/* Lista con los emojis exactos de tu imagen */}
                      <div className="flex">
                        <ul className="space-y-3">
                          <li>📍 Dirección: Maipú 651, Formosa, Argentina, 3600.</li>
                          <li>📱 Tel: 370-123-4567, 0370 446-2508</li>
                          <li>✉️ Correo: info@capymef.ar</li>
                        </ul>
                        <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d234.04766724362105!2d-58.1732974269762!3d-26.17999337323511!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x945ca5ef58d8ecd9%3A0x7d600e7dfa9b965c!2sCamara%20De%20Pequenas%20Y%20Medianas%20Empresas%20De%20Formosa!5e0!3m2!1ses!2sus!4v1786555633335!5m2!1ses!2sus" width="570" height="200" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
                      </div>
                    </div>

                    {/* Botón ENTENDIDO abajo a la derecha */}
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
              )}
            </div>
          </div>
        </section>

        {/* --- Sobre Nosotros --- */}
        <section className="w-full bg-white px-6 md:px-24 py-20 font-sans">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">

            <h2 className="text-3xl md:text-5xl font-light text-[#1D7BB6] uppercase tracking-wide mb-4">
              Sobre CAPyMEF
            </h2>
            <div className="w-24 h-1 bg-[#1D7BB6] mb-10"></div>

            <div className="space-y-6 text-lg text-gray-700 leading-relaxed text-justify md:text-center">
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

            <div className="mt-12">
              <Link
                to="/autoridades"
                className="inline-block px-8 py-3 bg-[#1A4B76] hover:bg-[#1F81B2] text-white font-bold rounded-md transition-colors shadow-md"
              >
                Conocé a la Comisión Directiva
              </Link>
            </div>

          </div>
        </section>

        {/*La Vista N2 */}
        <section className="w-full bg-[#F4F8FB] px-6 md:px-24 py-20 font-sans">

          {/* Título de la sección */}
          <div className="flex flex-col items-center mb-16">
            <h2 className="text-3xl md:text-5xl my-6.5 font-light text-[#1D7BB6] uppercase tracking-wide">
              Formas de ser socio
            </h2>
          </div>

          {/* Contenedor Grid */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12">

              {/* --- COLUMNA 1: Padrino --- */}
              <div className="group flex flex-col items-center px-6 md:border-r border-gray-300 hover:-translate-y-1 transition-transform duration-300">
                {/* Ícono */}
                <div className="text-[#1D7BB6] mb-6 h-24 flex items-center justify-center">
                  <FaGem className="text-7xl" />
                </div>

                <h3 className="text-xl font-medium text-gray-800 mb-6 titulo-animado">
                  Padrino
                </h3>

                <ul className="list-disc text-lg text-dark space-y-4 w-full max-w-[280px] text-left">
                  <li>Acceso gratuito o con bonificación especial a eventos tarifados</li>
                  <li>Reconocimiento por su respaldo institucional</li>
                  <li>Misma información y transparencia que el resto de los socios</li>
                </ul>
              </div>

              {/* --- COLUMNA 2: Activo --- */}
              <div className="group flex flex-col items-center px-6 md:border-r border-gray-300 hover:-translate-y-1 transition-transform duration-300">
                {/* Ícono (Usuario con estrellita simulada) */}
                <div className="text-[#1D7BB6] mb-6 h-24 flex items-center justify-center relative">
                  <FaUser className="text-7xl" />
                  {/* Estrellita superpuesta con borde del color del fondo para dar el efecto de corte */}
                  <FaStar className="text-3xl absolute -bottom-2 -right-3 text-[#1D7BB6] bg-[#F4F8FB] rounded-full border-4 border-[#F4F8FB]" />
                </div>

                <h3 className="text-xl font-medium text-gray-800 mb-6 titulo-animado">
                  Activo
                </h3>

                <ul className="list-disc text-lg text-dark space-y-4 w-full max-w-[280px] text-left">
                  <li>Bonificaciones máximas en eventos y capacitaciones</li>
                  <li>Participación plena en la vida institucional</li>
                  <li>Cuota mensual con ventana de pago del 1 al 10</li>
                </ul>
              </div>

              {/* --- COLUMNA 3: Adherente --- */}
              <div className=" group flex flex-col items-center px-6 hover:-translate-y-1 transition-transform duration-300">
                {/* Ícono */}
                <div className="text-[#1D7BB6] mb-6 h-24 flex items-center justify-center">
                  <FaHandshake className="text-[5.5rem]" />
                </div>

                <h3 className="text-xl font-medium text-gray-800 mb-6 titulo-animado">
                  Adherente
                </h3>

                <ul className="list-disc text-lg text-dark space-y-5 w-full max-w-[280px] text-left">
                  <li>Acceso a eventos con arancel</li>
                  <li>Becas o descuentos especiales según disponibilidad</li>
                  <li>Puerta de entrada natural a la comunidad CAPyMEF</li>
                </ul>
              </div>

            </div>
          </div>
        </section>
        {/*La vista N3*/}
        <section className="relative w-full overflow-hidden bg-[#1b4f7a] px-6 md:px-24 pt-16 font-sans text-white pb-10">
          <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-[#1D7BB6]/20 blur-3xl"></div>

          {/* Encabezado de la sección */}
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-center mb-12">
            {/* Título centrado */}
            <div className="flex flex-col items-center">
              <h2 className="text-4xl font-serif font-bold">
                Últimas noticias
              </h2>
              {/* Subrayado celeste */}
              <div className="w-24 h-1 bg-[#1D7BB6] mt-2"></div>
            </div>

            {/* Enlace a la derecha */}
            <Link
              to="/noticias"
              className="md:absolute right-0 mt-6 md:mt-0 text-sm font-bold hover:underline transition-all bg-white/10 px-4 py-2 rounded-full hover:bg-white/20"
            >
              Ver todas las noticias &gt;
            </Link>
          </div>

          {/* Contenedor Grid para las 3 Tarjetas */}
          {cargando ? (
            <div className="relative z-10 text-center py-10">
              <p className="text-gray-300 animate-pulse">Cargando las últimas novedades...</p>
            </div>
          ) : noticias.length === 0 ? (
            <div className="relative z-10 text-center py-10">
              <p className="text-gray-300">Todavía no hay noticias publicadas.</p>
            </div>
          ) : (
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {noticias.map((noticia) => (
                <Card
                  key={noticia.id}
                  titulo={noticia.titulo}
                  subtitulo={noticia.subtitulo}
                  imagenUrl={noticia.imagenUrl}
                  fecha={noticia.fechaPublicacion}
                  onLeerMas={() => setNoticiaSeleccionada(noticia)}
                />
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
      </main>
      {/*Footer */}
      <footer className="bg-[#1b4f7a] pt-5">
        <Footer />
      </footer>
    </>
  );
}
