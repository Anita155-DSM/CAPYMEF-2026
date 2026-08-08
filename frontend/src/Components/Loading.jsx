export default function Loading() {
    return (
        // Contenedor principal que ocupa toda la pantalla y centra el contenido
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">

            {/* 
        El círculo giratorio:
        - w-16 h-16: Define el tamaño (ancho y alto igual para que sea un círculo).
        - rounded-full: Lo hace completamente redondo.
        - border-4: Le da un grosor al borde.
        - border-gray-300: Pinta todo el círculo de un gris claro.
        - border-t-[#1D7BB6]: Pinta SOLO el borde superior (top) con tu azul característico.
        - animate-spin: Hace que todo el elemento gire infinitamente.
      */}
            <div className="w-16 h-16 rounded-full border-4 border-gray-300 border-t-[#1D7BB6] animate-spin"></div>

        </div>
    );
}