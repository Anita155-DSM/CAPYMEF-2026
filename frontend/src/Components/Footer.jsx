import { default as Logo } from "../assets/img/logo.png"
import { FaPhone, FaFacebook, FaInstagram, FaXTwitter } from "react-icons/fa6"
import { AiFillHome } from "react-icons/ai"
import { MdEmail } from "react-icons/md"
import { Link } from "react-router-dom"

export default function Footer() {
    return (
        <>
            <section className="mb-0 w-full bg-[#1b4f7a]">
                <div className="px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl bg-[#1b4f7a] pt-12 text-white">

                    {/* LA GRILLA CORREGIDA: 1 col en celu, 2 en tablet, 4 en compu */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8">

                        {/* 1. Contactos */}
                        <div>
                            <p className="text-sm font-bold tracking-widest text-white uppercase">Contacto</p>
                            <div className="w-12 h-1 bg-[#1D7BB6] mt-2"></div>
                            <ul className="mt-6 space-y-4">
                                <li>
                                    <p className="flex items-center"><AiFillHome className="w-5 h-5 mr-2" /> Junin 651, Formosa</p>
                                </li>
                                <li>
                                    <p className="flex items-center"><FaPhone className="w-5 h-5 mr-2" /> 0370 446-2508</p>
                                </li>
                                <li className="flex items-center">
                                    <MdEmail className="w-5 h-5 mr-2" />
                                    <p>info@capymef.ar</p>
                                </li>
                            </ul>
                        </div>

                        {/* 2. Navegación */}
                        <div>
                            <p className="text-sm font-bold tracking-widest text-white uppercase">Navegación</p>
                            <div className="w-12 h-1 bg-[#1D7BB6] mt-2"></div>
                            <ul className="mt-6 space-y-4">
                                <li><Link to="/" className="hover:text-blue-300 transition-colors">Inicio</Link></li>
                                <li><Link to="/Autoridades" className="hover:text-blue-300 transition-colors">Autoridades</Link></li>
                                <li><Link to="/Noticias" className="hover:text-blue-300 transition-colors">Noticias</Link></li>
                                <li><Link to="/Estatuto" className="hover:text-blue-300 transition-colors">Estatuto</Link></li>
                                <li><Link to="/Balance" className="hover:text-blue-300 transition-colors">Balance</Link></li>
                            </ul>
                        </div>

                        {/* 3. Vinculación Institucional */}
                        <div>
                            <p className="text-sm font-bold tracking-widest text-white uppercase">Vinculación Institucional</p>
                            <div className="w-12 h-1 bg-[#1D7BB6] mt-2"></div>
                            <ul className="mt-6 space-y-4 text-white">
                                <li>
                                    <a href="https://www.afip.gob.ar/" target="_blank" rel="noreferrer" className="flex text-base transition-all duration-200 hover:text-blue-300">AFIP</a>
                                </li>
                                <li>
                                    <a href="https://www.atpformosa.gob.ar/" target="_blank" rel="noreferrer" className="flex text-base transition-all duration-200 hover:text-blue-300">DGR</a>
                                </li>
                                <li>
                                    <a href="https://www.redcame.org.ar/" target="_blank" rel="noreferrer" className="flex text-base transition-all duration-200 hover:text-blue-300">CAME</a>
                                </li>
                            </ul>
                        </div>

                        {/* 4. Redes Sociales */}
                        <div>
                            <p className="text-sm font-bold tracking-widest text-white uppercase">Redes Sociales</p>
                            <div className="w-12 h-1 bg-[#1D7BB6] mt-2"></div>
                            {/* Cambié a flex-row para que los íconos queden uno al lado del otro (se ve más moderno) */}
                            <ul className="mt-6 space-x-5 flex flex-col ml-12 space-y-4">
                                <li>
                                    <a href="https://www.facebook.com/camara.capymef/" target="_blank" rel="noreferrer" className="hover:text-[#1D7BB6] transition-colors">
                                        <FaFacebook className="w-7 h-7" />
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.instagram.com/capymef/" target="_blank" rel="noreferrer" className="hover:text-[#1D7BB6] transition-colors">
                                        <FaInstagram className="w-7 h-7" />
                                    </a>
                                </li>
                                <li>
                                    <a href="https://x.com/capymef" target="_blank" rel="noreferrer" className="hover:text-[#1D7BB6] transition-colors">
                                        <FaXTwitter className="w-7 h-7" />
                                    </a>
                                </li>
                            </ul>
                        </div>

                    </div>
                    {/*Linea del footer */}
                    <hr className="mt-12 mb-4 border-gray-400 opacity-50" />
                    <p className="text-sm text-center text-white pb-6">© 2026 CAPyMEF. Todos los derechos reservados.</p>

                </div>
            </section>
        </>
    )
}