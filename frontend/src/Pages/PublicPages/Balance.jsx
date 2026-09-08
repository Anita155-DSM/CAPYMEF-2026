import { NavbarPublico } from "../../Components";
import { Footer } from "../../Components";

export default function Balance() {
  return (
    <>
      <NavbarPublico />

      <main className="pt-32 pb-16 bg-white min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-[#1A4B76] sm:text-4xl">
              Transparencia Financiera
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Evolución histórica de los recursos y gastos de la Cámara.
            </p>
          </div>

          <div className="flex justify-center">
            <a 
              href="/Balance2011-2025_compressed.pdf" 
              download="BALANCE.pdf"
              className="flex items-center gap-2 bg-[#1F81B2] text-white px-6 py-3 rounded-md font-semibold transition-colors duration-300 hover:bg-[#1A4B76] shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar Balance Completo (PDF)
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}