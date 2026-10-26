import { aliados } from "../data/aliados";

export default function VinculacionSection() {
  return (
    <section id="vinculacion" className="w-full bg-linear-to-r from-surface to-[#E5F1F8] px-6 md:px-24 py-20 font-sans inicio-reveal">
      <div className="flex flex-col items-center mb-16 text-center max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-[40px] font-extrabold text-navy-soft tracking-tight leading-tight">
          Vinculación Institucional
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Trabajamos en conjunto con organismos y entidades clave para potenciar el desarrollo de nuestras PyMEs, brindando respaldo y agilizando gestiones.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="flex md:grid md:grid-cols-3 gap-8 lg:gap-10 overflow-x-auto pb-4 snap-x snap-mandatory md:overflow-visible md:pb-0">
          {aliados.map((a) => (
            <a
              key={a.nombre}
              href={a.href}
              target="_blank"
              rel="noreferrer"
              className={`min-w-[calc(100vw-3rem)] md:min-w-0 snap-start h-32 rounded-3xl shadow-sm flex items-center justify-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 border group p-6 ${
                a.oscuro ? "bg-navy-soft border-navy-soft" : "bg-white border-gray-100"
              }`}
            >
              <img
                src={a.logo}
                alt={a.nombre}
                loading="lazy"
                decoding="async"
                className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${
                  a.oscuro ? "opacity-100" : "opacity-80 group-hover:opacity-100"
                }`}
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
