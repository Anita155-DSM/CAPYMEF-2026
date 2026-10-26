import { gruposAutoridades } from "../data/autoridades";
import { parrafosHistoria } from "../data/historia";
import TarjetaAutoridad from "./TarjetaAutoridad";

export default function NosotrosSection() {
  return (
    <section id="nosotros" className="w-full bg-linear-to-r from-[#E5F1F8] to-surface px-6 sm:px-10 md:px-24 py-20 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-20">
        <div className="w-full flex flex-col items-start">
          <h2 className="text-3xl md:text-[40px] font-extrabold text-navy-soft mb-8 leading-tight tracking-tight">
            Sobre CAPyMEF
          </h2>
          <div className="w-full space-y-5 text-lg text-[#2c4c5e] leading-relaxed">
            {parrafosHistoria.map((p) => (
              <p key={p.slice(0, 30)}>{p}</p>
            ))}
          </div>
        </div>

        <div id="autoridades" className="w-full scroll-mt-24">
          <h2 className="text-3xl md:text-4xl font-extrabold text-navy-soft mb-2 tracking-tight">
            Autoridades de la Cámara
          </h2>
          <p className="text-lg text-[#2c4c5e] mb-12">
            Conocé a la Comisión Directiva que impulsa el crecimiento de las PyMEs.
          </p>

          {gruposAutoridades.map((grupo, i) => (
            <div key={grupo.titulo} className={i < gruposAutoridades.length - 1 ? "mb-10" : ""}>
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xs font-bold text-teal uppercase tracking-[0.2em] shrink-0">{grupo.titulo}</h3>
                <div className="w-full h-px bg-gray-300/60" />
              </div>
              <div className={`grid grid-cols-1 md:grid-cols-2 ${grupo.columnas} gap-6`}>
                {grupo.personas.map((p) => (
                  <TarjetaAutoridad key={p.cargo} {...p} compacto={grupo.compacto} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
