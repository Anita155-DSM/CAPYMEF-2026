import { useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { gruposAutoridades } from "../data/autoridades";
import { parrafosHistoria } from "../data/historia";
import TarjetaAutoridad from "./TarjetaAutoridad";
import TarjetaAutoridadFlip from "./TarjetaAutoridadFlip";

export default function NosotrosSection() {
  const [verMas, setVerMas] = useState(false);
  const [mesa, ...otrosGrupos] = gruposAutoridades;

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

          <div className="grid grid-cols-1 justify-items-center gap-8 md:grid-cols-3">
            {mesa.personas.map((p) => (
              <TarjetaAutoridadFlip key={p.cargo} {...p} />
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setVerMas((v) => !v)}
              aria-expanded={verMas}
              aria-controls="autoridades-extra"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary/30 bg-white px-6 py-2.5 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-primary hover:text-white"
            >
              {verMas ? "Ver menos" : "Ver más"}
              <FaChevronDown size={12} className={`transition-transform duration-300 ${verMas ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div
            id="autoridades-extra"
            className={`grid transition-all duration-500 ease-out ${verMas ? "mt-12 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
          >
            <div className="overflow-hidden">
              {otrosGrupos.map((grupo, i) => (
                <div key={grupo.titulo} className={i < otrosGrupos.length - 1 ? "mb-10" : ""}>
                  <div className="mb-6 flex items-center gap-4">
                    <h3 className="shrink-0 text-xs font-bold uppercase tracking-[0.2em] text-teal">{grupo.titulo}</h3>
                    <div className="h-px w-full bg-gray-300/60" />
                  </div>
                  <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${grupo.columnas}`}>
                    {grupo.personas.map((p) => (
                      <TarjetaAutoridad key={p.cargo} {...p} compacto={grupo.compacto} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
