import NavbarPublico from "@/layouts/components/NavbarPublico";
import Footer from "@/layouts/components/Footer";
import { useNoticiasPublicas } from "@/features/noticias/hooks/useNoticiasPublicas";
import HeroSection from "../components/HeroSection";
import NovedadesSection from "../components/NovedadesSection";
import NosotrosSection from "../components/NosotrosSection";
import BeneficiosSection from "../components/BeneficiosSection";
import InformacionSection from "../components/InformacionSection";
import VinculacionSection from "../components/VinculacionSection";

export default function LandingPage() {
  const { noticias, cargando } = useNoticiasPublicas();

  return (
    <>
      <header>
        <NavbarPublico />
      </header>

      <main className="w-full overflow-x-clip">
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
