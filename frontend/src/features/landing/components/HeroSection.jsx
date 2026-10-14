import { useState } from "react";
import { slidesHero, INTERVALO_HERO_MS } from "../data/hero";
import { useCarrusel } from "../hooks/useCarrusel";
import ComoAsociarseModal from "./ComoAsociarseModal";

export default function HeroSection() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const activa = useCarrusel(slidesHero.length, INTERVALO_HERO_MS);

  return (
    <section id="inicio" className="w-full font-sans">
      <div className="relative flex min-h-screen w-full flex-col items-start justify-center overflow-hidden bg-gray-900 inicio-reveal inicio-reveal-hero">
        {slidesHero.map((slide, i) => (
          <div
            key={slide.src}
            className={`absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-1000 ease-in-out ${
              i === activa ? "opacity-100 z-0" : "opacity-0 -z-10"
            }`}
            style={{ backgroundImage: `url("${slide.src}")`, backgroundPosition: slide.posicion }}
          />
        ))}

        <div className="absolute inset-0 bg-black/50 z-0" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 flex flex-col items-start mt-16">
          <span className="text-white/90 text-sm sm:text-base font-bold tracking-[0.2em] uppercase mb-4 drop-shadow-md">
            Impulsando el desarrollo comercial
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-[65px] lg:text-[70px] text-white font-extrabold tracking-tight leading-[1.1] max-w-4xl drop-shadow-lg">
            Cámara de Pequeñas <br className="hidden sm:block" />
            y Medianas Empresas <br className="hidden sm:block" />
            de Formosa
          </h1>

          <div className="mt-8 border-l-4 border-primary pl-5">
            <p className="text-base sm:text-lg md:text-xl text-white/90 font-medium max-w-2xl leading-relaxed drop-shadow-md">
              Sumate a CAPYMEF. Accedé a beneficios exclusivos, capacitaciones
              y herramientas digitales para hacer crecer tu negocio.
            </p>
          </div>

          <button
            className="mt-10 bg-primary hover:bg-primary-dark text-white text-[15px] sm:text-[17px] font-bold py-3.5 px-8 rounded-full transition-all duration-300 flex items-center gap-3 shadow-xl hover:-translate-y-1"
            onClick={() => setModalAbierto(true)}
          >
            Quiero asociarme
          </button>

          {modalAbierto && <ComoAsociarseModal onClose={() => setModalAbierto(false)} />}
        </div>
      </div>
    </section>
  );
}
