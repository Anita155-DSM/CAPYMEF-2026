import Logo from "../assets/img/Logo.png"
export default function Card({ titulo, subtitulo, imagenUrl, fecha, onLeerMas }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 flex flex-col">

      {/* IMAGEN DE LA TARJETA */}
      {imagenUrl ? (
        <img
          src={`${import.meta.env.VITE_API_URL_UPLOADS}/${imagenUrl}`}
          alt={titulo}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-tr from-[#132A46] to-[#1D7BB6] flex items-center justify-center p-6">
          {/* El logo con un poco de opacidad para que parezca marca de agua */}
          <img src={Logo} alt="CAPYMEF" className="h-24 w-auto object-contain opacity-30" />
        </div>
      )}

      <div className="p-6 flex flex-col flex-grow">
        {/* FECHA */}
        <div className="text-xs font-semibold text-[#1D7BB6] uppercase tracking-wider mb-2">
          {new Date(fecha).toLocaleDateString('es-AR')}
        </div>

        {/* TÍTULO */}
        <h3 className="text-xl font-bold text-[#132A46] mb-2 line-clamp-2">
          {titulo}
        </h3>

        {/* SUBTÍTULO */}
        {subtitulo && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {subtitulo}
          </p>
        )}

        {/* BOTÓN */}
        <div className="mt-auto pt-4">
          <button onClick={onLeerMas}
            className="text-[#1D7BB6] font-semibold hover:text-[#132A46] transition-colors">
            Leer más
          </button>
        </div>
      </div>

    </div>
  );
}