import Navbar from "../Components/Navbar.jsx";
import fondoHome from '../assets/img/FondoCapymef.png';
import Came from '../assets/img/Came.png';
import Came70years from '../assets/img/Came70years.png';
import Escudo from '../assets/img/Escudo.png';
import { Link } from 'react-router-dom';
export default function Home() {
  return (
    <>
      <main className="w-full overflow-x-hidden">


        <Navbar />

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

            <p className="mt-6 text-xl text-white font-medium bg-black/30 inline-block px-6 py-2 rounded-lg">
              Sumate a CAPYMEF. Accedé a beneficios exclusivos, capacitaciones y herramientas digitales para hacer crecer tu negocio.
            </p>
          </div>

          {/* Este boton debería de Loguearte si no lo estas, y si estas Asociado debería de desaparecer */}
          <div className="mt-5 ml-4">
            <Link
              to="/login"
              className="bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-2 px-4 rounded-md "
            >
              Quiero Asociarme
            </Link>
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
              <span>&bull; AFIP</span>
              <span>&bull; DGR</span>
              <span>&bull; CAME</span>
            </div>

          </div>


        </div>
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
      </main>
    </>
  );
}