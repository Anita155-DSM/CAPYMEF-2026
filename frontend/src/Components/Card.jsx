import Logo from "../assets/img/Logo.png"
export default function Card({ titulo, subtitulo, imagenUrl, fecha, tipo = "Institucional", onLeerMas }) {
  return (
    <article className="group h-full transform-gpu overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition-all duration-300 ease-out hover:z-10 hover:scale-[1.03] hover:shadow-2xl">

      {/* IMAGEN DE LA TARJETA */}
      {imagenUrl ? (
        <img
          src={imagenUrl}
          alt={titulo}
          className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-gradient-to-tr from-[#132A46] to-[#1D7BB6] p-6">
          {/* El logo con un poco de opacidad para que parezca marca de agua */}
          <img src={Logo} alt="CAPYMEF" className="h-24 w-auto object-contain opacity-30" />
        </div>
      )}

      <div className="flex min-h-[236px] flex-grow flex-col p-6">
        {/* FECHA */}
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1D7BB6]">
          {new Date(fecha).toLocaleDateString('es-AR')}
          <span className="text-gray-300">&bull;</span>
          <span>{tipo}</span>
        </div>

        {/* TÍTULO */}
        <h3 className="mb-3 line-clamp-2 text-xl font-bold leading-tight text-[#132A46]">
          {titulo}
        </h3>

        {/* SUBTÍTULO */}
        {subtitulo && (
          <p className="mb-4 line-clamp-3 text-base leading-relaxed text-gray-600">
            {subtitulo}
          </p>
        )}

        {/* BOTÓN */}
        <div className="mt-auto pt-5">
          <button
            type="button"
            onClick={onLeerMas}
            className="font-semibold text-[#1D7BB6] transition-colors duration-200 hover:text-[#1A4B76]"
          >
            Leer más &gt;&gt;
          </button>
        </div>
      </div>

    </article>
  );
}