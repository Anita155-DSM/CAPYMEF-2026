import { documentosInstitucionales } from "../data/documentos";

export default function InformacionSection() {
  return (
    <section id="informacion" className="w-full bg-linear-to-r from-[#E5F1F8] to-surface px-6 md:px-24 py-20 font-sans inicio-reveal">
      <div className="flex flex-col items-center mb-16 text-center">
        <h2 className="text-3xl md:text-[40px] font-extrabold text-navy-soft tracking-tight">Información institucional</h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl">
          Accedé a nuestros documentos oficiales para conocer nuestro marco normativo y la gestión de nuestros recursos.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {documentosInstitucionales.map((doc) => (
          <div
            key={doc.titulo}
            className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col group border border-gray-100 items-center text-center"
          >
            <div className="relative z-10 text-sidebar mb-6 h-16 w-16 bg-[#E5F1F8] rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">{doc.icono}</svg>
            </div>

            <h3 className="text-2xl font-extrabold text-navy-soft mb-4">{doc.titulo}</h3>
            <div className="w-16 h-[2px] bg-[#E5F1F8] mx-auto mb-6" />
            <p className="text-gray-500 text-[15px] leading-relaxed mb-8 flex-grow">{doc.descripcion}</p>

            <a
              href={doc.href}
              download={doc.nombreArchivo}
              className="mt-auto px-6 py-3 bg-navy-soft text-white text-sm font-semibold rounded-full transition-colors hover:bg-sidebar shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {doc.textoBoton}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
