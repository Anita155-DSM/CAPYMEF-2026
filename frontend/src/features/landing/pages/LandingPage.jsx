import { useAuth } from "@/app/providers/AuthContext";
import Navbar from "@/layouts/components/Navbar";
import NavbarPublico from "@/layouts/components/NavbarPublico";
import Footer from "@/layouts/components/Footer";
import { useNoticiasPublicas } from "@/features/noticias/hooks/useNoticiasPublicas";
import { useReveal } from "../hooks/useReveal";
import HeroSection from "../components/HeroSection";
import NovedadesSection from "../components/NovedadesSection";
import NosotrosSection from "../components/NosotrosSection";
import BeneficiosSection from "../components/BeneficiosSection";
import InformacionSection from "../components/InformacionSection";
import VinculacionSection from "../components/VinculacionSection";

export default function LandingPage() {
  const { estaLogueado } = useAuth();
  const { noticias, cargando } = useNoticiasPublicas();

  useReveal(`${cargando}-${noticias.length}`);

  return (
    <>
      <header>{estaLogueado ? <Navbar /> : <NavbarPublico />}</header>

      <main className="w-full overflow-x-hidden">
        <HeroSection />
        <NovedadesSection noticias={noticias} cargando={cargando} />
        <NosotrosSection />
        <BeneficiosSection />
        <InformacionSection />
        <VinculacionSection />
      </main>

      <footer className="bg-sidebar pt-5">
        <Footer />
      </footer>
    </>
  );
}
