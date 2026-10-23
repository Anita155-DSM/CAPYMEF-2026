export default function TarjetaAutoridad({ cargo, nombre, icono: Icono, compacto }) {
  const caja = compacto ? "w-12 h-12" : "w-14 h-14";
  const gap = compacto ? "gap-4" : "gap-5";
  const nombreClase = compacto ? "text-[15px]" : "text-lg";

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center ${gap} transition-transform duration-300 hover:-translate-y-1 hover:shadow-md`}>
      <div className={`${caja} shrink-0 bg-surface-blue rounded-xl flex items-center justify-center text-teal`}>
        <Icono size={compacto ? 18 : 22} />
      </div>
      <div className="flex flex-col">
        <span className="text-teal text-[10px] font-extrabold uppercase tracking-widest mb-1">{cargo}</span>
        <span className={`text-navy-soft ${nombreClase} font-bold leading-tight`}>{nombre}</span>
      </div>
    </div>
  );
}
