/** Placeholder para secciones que todavía no existen (reemplaza al spinner infinito). */
export default function EnConstruccion({ titulo = "Sección en construcción" }) {
  return (
    <section className="min-h-[calc(100vh-9rem)] bg-[#edf7fd] px-1 py-2 sm:px-3 sm:py-5">
      <h1 className="text-2xl font-normal uppercase text-[#073d6f] sm:text-[25px]">{titulo}</h1>
      <p className="mt-4 text-sm text-gray-600">Estamos trabajando en esta sección. Pronto vas a poder usarla.</p>
    </section>
  );
}
