import { Link } from 'react-router-dom';
import { useState } from 'react';
import Navbar from "../Components/Navbar.jsx";
import Came from '../assets/img/Came.png';
import Came70years from '../assets/img/Came70years.png';
import Escudo from '../assets/img/Escudo.png';
import fondoHome from '../assets/img/FondoCapymef.png';
//asdad
export default function Home() {

  const [isOpen, setIsOpen] = useState(false);


  return (
    <>
      {/* Se coloca dentro del main para poder hacer que ocupe la pantalla completa con el w-full */}
      <main className="w-full overflow-x-hidden overflow-y-hidden">
        <Navbar />
        {/*La Vista N1 */}
        <div
          className="min-h-screen w-full bg-cover bg-no-repeat justify-center items-start flex flex-col"
          style={{ backgroundImage: `url(${fondoHome})` }}
        >

          {/* Contenedor del texto central */}
          <div className="px-4 py-4">
            <h1 className="text-5xl md:text-7xl text-white font-serif font-bold px8 py-4 -rounded-xl inline-block">
              Camara de Pequeñas y Medianas Empresas Formosa
            </h1>

            <br /> {/* Salto de línea para separar el título del subtítulo */}

            <p className="mt-6 text-xl text-white font-medium bg-black/30 inline-block px-6 py-2 rounded-lg max-w-lg line-clamp-2">
              Sumate a CAPYMEF. Accedé a beneficios exclusivos, capacitaciones y herramientas digitales para hacer crecer tu negocio.
            </p>
          </div>

          {/* Boton que abre el MODAL */}
          <div className="mt-5 ml-6">


            <button
              className="mt-8 bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-3 px-8 rounded-full transition-colors shadow-lg"
              onClick={() => setIsOpen(true)}
            >
              Quiero Asociarme
            </button>
            {/*ACA VA EL MODAL */}
            {isOpen && (
              <div onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" >
                <div onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative mx-4 animacion-modal">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <h3 className="text-2xl font-bold text-[#132A46] mb-4">
                    TITULO
                  </h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Incidunt quis assumenda consequuntur nobis sunt minima! Ut aperiam dignissimos accusamus ipsum.
                    Quae earum eos unde vitae optio beatae iure corrupti veniam?
                  </p>

                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-5 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-md transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-5 py-2 bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold rounded-md transition-colors"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Aca va el supuesto Footer pero en realidad la web sigue por debajo al scrollear*/}
          <div className="absolute bottom-0 left-0 w-full bg-white/50 backdrop-blur-sm py-5 px-10 md:px-24 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/20">

            {/* Título de la izquierda */}
            <div className="text-xl md:text-2xl font-bold text-gray-800">
              Vinculación institucional
            </div>

            {/* Lista de entidades a la derecha */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-16 text-lg md:text-xl font-bold text-gray-800">
              {/* Usamos &bull; que es el código HTML para hacer ese puntito grueso */}
              <Link to="https://www.afip.gob.ar/landing/default.asp" target="_blank" rel="noopener noreferrer">
                <span>&bull; AFIP</span>
              </Link>
              <Link to="https://www.atpformosa.gob.ar/" target="_blank" rel="noopener noreferrer">
                <span>&bull; DGR</span>
              </Link>
              <Link to="https://www.redcame.org.ar/" target="_blank" rel="noopener noreferrer">
                <span>&bull; CAME</span>
              </Link>
            </div>

          </div>


        </div>
        {/*La Vista N2 */}
        <section className="w-full bg-[#132A46] px-10 md:px-24 py-16 font-sans text-white">

          {/* Encabezado de la sección */}
          <div className="relative flex flex-col md:flex-row items-center justify-center mb-12">
            {/* Título centrado */}
            <div className="flex flex-col items-center">
              <h2 className="text-4xl font-serif font-bold">Últimas noticias</h2>
              {/* Subrayado celeste */}
              <div className="w-24 h-1 bg-[#1D7BB6] mt-2"></div>
            </div>

            {/* Enlace a la derecha */}
            <Link
              to="/noticias"
              className="md:absolute right-0 mt-6 md:mt-0 text-sm font-bold hover:underline transition-all"
            >
              Ver todas las noticias &gt;
            </Link>
          </div>

          {/* Contenedor Grid para las 3 Tarjetas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* --- TARJETA 1 --- */}
            <article className="bg-white text-black rounded-2xl p-5 flex flex-col relative shadow-xl hover:shadow-2xl transition-shadow">
              {/* Etiqueta / Badge */}
              <span className="absolute top-8 left-8 bg-[#9CA3AF] text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                Comercio exterior
              </span>
              {/* Espacio reservado para la imagen (Podés cambiar este div por tu etiqueta <img>) */}
              <img src={Came} alt="" />

              <span className="text-gray-500 text-sm font-medium mb-2">&bull; Julio,2026</span>
              <h3 className="text-xl font-bold mb-3 leading-tight text-gray-900">
                Cambios en los envíos postales
              </h3>
              <p className="text-gray-600 text-sm mb-6 flex-grow">
                Desde la Dirección de Comercio Exterior de la Confederación Empresaria de la Mediana Empresa (CAME), informamos que se ha publicado el Decreto 604/26, que introduce modificaciones al régimen de envíos postales.
              </p>
              <Link to="#" className="text-right text-[#1D7BB6] font-bold text-sm hover:underline mt-auto">
                Leer más
              </Link>
            </article>

            {/* --- TARJETA 2 --- */}
            <article className="bg-white text-black rounded-2xl p-5 flex flex-col relative shadow-xl hover:shadow-2xl transition-shadow">
              <span className="absolute top-8 left-8 bg-[#9CA3AF] text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                Institucional
              </span>
              <img src={Escudo} alt="" />

              <span className="text-gray-500 text-sm font-medium mb-2">&bull; Junio,2026</span>
              <h3 className="text-xl font-bold mb-3 leading-tight text-gray-900">
                El Gobierno precisó criterios sobre aportes y contribuciones laborales
              </h3>
              <p className="text-gray-600 text-sm mb-6 flex-grow">
                Mediante el Decreto 612/2026, el Poder Ejecutivo estableció precisiones para el cálculo, destino y administración de los aportes y contribuciones previstos en convenios colectivos de trabajo.
              </p>
              <Link to="#" className="text-right text-[#1D7BB6] font-bold text-sm hover:underline mt-auto">
                Leer más
              </Link>
            </article>

            {/* --- TARJETA 3 --- */}
            <article className="bg-white text-black rounded-2xl p-5 flex flex-col relative shadow-xl hover:shadow-2xl transition-shadow">
              <span className="absolute top-8 left-8 bg-[#9CA3AF] text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                Institucional
              </span>
              <img src={Came70years} alt="" />

              <span className="text-gray-500 text-sm font-medium mb-2">&bull; Junio,2026</span>
              <h3 className="text-xl font-bold mb-3 leading-tight text-gray-900">
                CAME acompaña una nueva edición del Concurso Emprendimiento Argentino 2026
              </h3>
              <p className="text-gray-600 text-sm mb-6 flex-grow">
                La Confederación Argentina de la Mediana Empresa (CAME) informa que ya se encuentra abierta la inscripción para participar del Concurso Emprendimiento Argentino 2026, una iniciativa del Ministerio de Economía...
              </p>
              <Link to="#" className="text-right text-[#1D7BB6] font-bold text-sm hover:underline mt-auto">
                Leer más
              </Link>
            </article>

          </div>
        </section>
        <br />
        {/*La vista N3*/}
        <section className="w-full bg-white px-10 md:px-24 py-27 font-sans">

          {/* Título de la sección */}
          <div className="flex flex-col text-start mb-12">
            <h2 className="text-4xl font-serif font-bold text-[#132A46]mb-5">
              Tres Formas de ser Socio
            </h2>
            <div className="w-24 h-1 bg-[#1D7BB6] mt-2"></div>
          </div>

          {/* 
          Contenedor Grid: 
          - grid-cols-1: En celulares pone 1 tarjeta por fila (una abajo de la otra).
          - md:grid-cols-3: En computadoras pone las 3 tarjetas en la misma fila.
          - gap-8: Genera el espacio en blanco entre las tarjetas.
        */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* --- TARJETA 1: Socio Padrino --- */}
              <div className="bg-[#1D7BB6] text-white rounded-xl p-8 shadow-lg aspect-square flex flex-col justify-start hover:-translate-y-1 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-center">
                  Socio Padrino
                </h3>
                <ul className="list-disc pl-5 text-base font-medium mt-8">
                  <li>Acceso gratuito o con bonificación especial a eventos tarifados</li>
                  <li>Reconocimiento por su respaldo institucional</li>
                  <li>Misma información y transparencia que el resto de los socios</li>
                </ul>
              </div>

              {/* --- TARJETA 2: Socio Activo --- */}
              <div className="bg-[#1D7BB6] text-white rounded-xl p-8 shadow-lg aspect-square flex flex-col justify-start hover:-translate-y-1 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-center">
                  Socio Activo
                </h3>
                <ul className="list-disc pl-5 space-y-4 text-base font-medium mt-8">
                  <li>Bonificaciones máximas en eventos y capacitaciones</li>
                  <li>Participación plena en la vida institucional</li>
                  <li>Cuota mensual con ventana de pago del 1 al 10</li>
                </ul>
              </div>

              {/* --- TARJETA 3: Socio Adherente --- */}
              <div className="bg-[#1D7BB6] text-white rounded-xl p-8 shadow-lg aspect-square flex flex-col justify-start hover:-translate-y-1 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-center">
                  Socio Adherente
                </h3>
                <ul className="list-disc pl-5 space-y-4 text-base font-medium mt-8">
                  <li>Acceso a eventos con arancel</li>
                  <li>Becas o descuentos especiales según disponibilidad</li>
                  <li>Puerta de entrada natural a la comunidad CAPyMEF</li>
                </ul>
              </div>

            </div>
          </div>
        </section>

      </main >
    </>
  );
}