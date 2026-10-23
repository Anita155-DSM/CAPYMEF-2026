import fondoHome from "@/assets/img/FondoCapymef.png";
import hero2 from "@/assets/img/image.webp";
import hero3 from "@/assets/img/image3.webp";
import hero4 from "@/assets/img/image4.webp";
import hero5 from "@/assets/img/image5.webp";

// Cada slide lleva su propio encuadre (la primera necesita bajar 56px por el navbar).
export const slidesHero = [
  { src: fondoHome, posicion: "center 56px" },
  { src: hero2, posicion: "center center" },
  { src: hero3, posicion: "center center" },
  { src: hero4, posicion: "center center" },
  { src: hero5, posicion: "center center" },
];

export const INTERVALO_HERO_MS = 5500;
