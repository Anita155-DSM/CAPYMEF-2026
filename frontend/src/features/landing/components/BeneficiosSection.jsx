import FlipCard from "@/shared/ui/FlipCard";
import { categoriasSocio } from "../data/categorias";

export default function BeneficiosSection() {
  return (
    <section id="beneficios" className="w-full bg-linear-to-r from-[#E5F1F8] to-surface px-6 md:px-24 py-20 font-sans">
      <div className="flex flex-col items-start mb-16 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-[40px] font-extrabold text-navy-soft tracking-tight leading-tight">
          Formas de ser socio
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl">
          Conocé las diferentes categorías societarias y elegí la que mejor se adapte al tamaño y objetivos de tu PyME.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 justify-items-center gap-8 lg:gap-10">
        {categoriasSocio.map((c) => (
          <FlipCard
            key={c.nombre}
            width={352}
            height={400}
            radius={24}
            background="#ffffff"
            color="#132A46"
            shadowColor="#132A46"
            shadowOpacity={0.15}
            ariaLabel={`${c.nombre}. Tocar para ver el detalle`}
            front={
              <div className="h-full flex flex-col items-center text-center p-8 border border-gray-100 rounded-3xl">
                <div className="w-16 h-16 bg-surface-blue rounded-2xl flex items-center justify-center text-teal mb-6 shrink-0">
                  {c.icono}
                </div>
                <h3 className="text-2xl font-extrabold text-navy-soft mb-8">{c.nombre}</h3>
                <p className="text-gray-500 text-[15px] leading-relaxed grow">{c.resumen}</p>
                <div className=" text-teal text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-full w-max">
                  {c.etiqueta}
                </div>
                <span className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Tocá para ver más</span>
              </div>
            }
            back={
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-gray-100 rounded-3xl">
                <h3 className="text-2xl font-extrabold text-navy-soft mb-4">{c.nombre}</h3>
                <div className="h-px w-12 bg-teal/40 mb-4" />
                <p className="text-gray-500 text-[15px] leading-relaxed">{c.descripcion}</p>
              </div>
            }
          />
        ))}
      </div>
    </section>
  );
}
