export default function Modal({ isOpen, onClose, titulo, children }) {
  {
    /*isOpen es para abrir, onClose para cerrar */
    /*children es para el contenido entremedio del div */
  }
  if (!isOpen) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md md:max-w-lg relative mx-4 animacion-modal"
          onClick={onClose}
        >
          <div onClick={(e) => e.stopPropagation()}>
            {/*Aca es el boton para cerrar */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
              onClick={onClose}
            >
              <svg className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            {titulo && (
              <h3 className="text-2xl font-bold text-[#132A46] mb-4 pr-8">
                {titulo}
              </h3>
            )}
            <div className="text-gray-600 mb-6 leading-relaxed">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}
