import {
  FaAward,
  FaGears,
  FaLocationDot,
} from "react-icons/fa6";
import { mayuscula } from "../../utils/cuotas";
import { iniciales } from "../../utils/empresa";

const chip =
  "inline-flex items-center gap-1.5 rounded-full bg-white/14 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/25 backdrop-blur-xs";

export default function EncabezadoEmpresa({ usuario }) {
  const nombre = usuario.razonSocial || "Tu empresa";

  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-navy via-sidebar to-primary text-white shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 right-44 h-56 w-56 rounded-full bg-white/5"
      />

      <div className="relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3.5 p-5 sm:gap-x-5 sm:gap-y-2.5 sm:p-8">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-xl font-semibold ring-1 ring-white/30 backdrop-blur-xs sm:row-span-2 sm:h-20 sm:w-20 sm:text-2xl">
          {iniciales(nombre)}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8bd0f8]">
            Ficha Institucional · Mi Empresa
          </p>
          <h1 className="mt-1 break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            {nombre}
          </h1>
        </div>

        <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-1 sm:col-start-2">
          <span className={chip}>
            <FaAward className="text-[#8bd0f8]" /> Categoría {mayuscula(usuario.categoria) || "Socio"}
          </span>
          {usuario.rubro && (
            <span className={chip}>
              <FaGears className="text-[#8bd0f8]" /> {usuario.rubro}
            </span>
          )}
          {usuario.localidad && (
            <span className={chip}>
              <FaLocationDot className="text-[#8bd0f8]" /> {usuario.localidad}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
