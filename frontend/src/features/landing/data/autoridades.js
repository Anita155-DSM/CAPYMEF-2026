import { FaUserTie, FaPenClip, FaCoins, FaUsers, FaUser, FaMagnifyingGlassChart } from "react-icons/fa6";

// Para actualizar la Comisión Directiva solo hay que editar este archivo.
export const gruposAutoridades = [
  {
    titulo: "Mesa Ejecutiva",
    columnas: "lg:grid-cols-3",
    compacto: false,
    personas: [
      { cargo: "Presidente", nombre: "Carlos A. Werlen", icono: FaUserTie },
      { cargo: "Secretario", nombre: "Antonio F. Hryniewicz", icono: FaPenClip },
      { cargo: "Tesorero", nombre: "Mónica G. Lozano", icono: FaCoins },
    ],
  },
  {
    titulo: "Vocales Titulares",
    columnas: "lg:grid-cols-3",
    compacto: false,
    personas: [
      { cargo: "Vocal 1° Titular", nombre: "Federico J. Domínguez", icono: FaUsers },
      { cargo: "Vocal 2° Titular", nombre: "Walter Ramón Arauz", icono: FaUsers },
      { cargo: "Vocal 3° Titular", nombre: "Marcelo Enrique Zanín", icono: FaUsers },
    ],
  },
  {
    titulo: "Suplentes y Revisores",
    columnas: "lg:grid-cols-4",
    compacto: true,
    personas: [
      { cargo: "Vocal 1° Suplente", nombre: "Jorge Ernesto Miani", icono: FaUser },
      { cargo: "Vocal 2° Suplente", nombre: "Ramón O. Centurión", icono: FaUser },
      { cargo: "Rev. Cuentas Titular", nombre: "Sergio Eduardo Alloi", icono: FaMagnifyingGlassChart },
      { cargo: "Rev. Cuentas Supl.", nombre: "Augusto E. Boggiano", icono: FaMagnifyingGlassChart },
    ],
  },
];
