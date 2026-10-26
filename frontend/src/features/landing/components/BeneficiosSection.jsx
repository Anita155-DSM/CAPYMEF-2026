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

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
        {categoriasSocio.map((c) => (
          <div
            key={c.nombre}
            className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col group border border-gray-100"
          >
            <div className="w-16 h-16 bg-surface-blue rounded-2xl flex items-center justify-center text-teal mb-8 shrink-0 transition-transform duration-300 group-hover:scale-110">
              {c.icono}
            </div>
            <h3 className="text-2xl font-extrabold text-navy-soft mb-4">{c.nombre}</h3>
            <p className="text-gray-500 text-[15px] leading-relaxed flex-grow">{c.descripcion}</p>
            <div className="mt-8 bg-surface-blue text-teal text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-full w-max cursor-pointer hover:bg-teal hover:text-white transition-colors">
              {c.etiqueta}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
