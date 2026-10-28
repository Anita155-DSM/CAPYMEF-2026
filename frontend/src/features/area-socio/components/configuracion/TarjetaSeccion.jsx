export default function TarjetaSeccion({ titulo, icono: Icono, className = "", children }) {
  return (
    <section className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      <h2 className="mb-5 flex items-center gap-2.5 border-b border-gray-100 pb-4 text-base font-bold uppercase tracking-wide text-gray-700">
        <Icono className="text-primary" /> {titulo}
      </h2>
      {children}
    </section>
  );
}