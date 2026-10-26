/** Fila de una ficha: ícono + etiqueta + valor. Se usa en Mi empresa y Configuración. */
export default function DatoFicha({ icono: Icono, etiqueta, valor, quebrar = false }) {
  return (
    <div className="grid grid-cols-[30px_1fr] items-end border-b border-[#d8d8d8] py-2 last:border-0">
      <Icono className="mb-0.5 text-lg text-[#006ab4]" />
      <div>
        <p className="text-base uppercase text-[#66727d]">{etiqueta}</p>
        <p className={`text-base text-[#3a4147] ${quebrar ? "break-all" : ""}`}>{valor || "No informado"}</p>
      </div>
    </div>
  );
}
