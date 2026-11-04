import { Link } from "react-router-dom";
import { FaAward, FaCircleCheck, FaGears, FaLocationDot } from "react-icons/fa6";
import { abonaCuotaSocial, mayuscula } from "../../utils/cuotas";
import { datosAntiguedad, ESTADOS_SOCIO, iniciales } from "../../utils/empresa";

const chip = "inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20";

function Dato({ etiqueta, sub, children }) {
  return (
    <div className="px-5 py-4 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">{etiqueta}</p>
      <p className="mt-0.5 text-base font-bold">{children}</p>
      {sub && <p className="text-xs text-white/70">{sub}</p>}
    </div>
  );
}

export default function EncabezadoEmpresa({ usuario, cuotas, errorCuotas }) {
  const nombre = usuario.razonSocial || "Tu empresa";
  const estado = ESTADOS_SOCIO[usuario.estado] || ESTADOS_SOCIO.aprobado;
  const { desde, antiguedad } = datosAntiguedad(usuario.createdAt);
  const impagas = Array.isArray(cuotas) ? cuotas.filter((c) => c.estado !== "pagada").length : 0;

  // Solo los socios activos abonan cuota social
  const sinCuotas = !abonaCuotaSocial(usuario?.categoria);

  let estadoCuotas;
  if (cuotas === undefined) estadoCuotas = "Cargando...";
  else if (!Array.isArray(cuotas) || errorCuotas) estadoCuotas = "No disponible";
  else if (impagas === 0) {
    estadoCuotas = (
      <span className="inline-flex items-center gap-1.5">
        <FaCircleCheck className="text-emerald-300" /> Al día
      </span>
    );
  } else {
    estadoCuotas = (
      <Link to="/socios/pagos" className="underline decoration-white/40 underline-offset-4 hover:decoration-white">
        {impagas === 1 ? "1 cuota por pagar" : `${impagas} cuotas por pagar`}
      </Link>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-navy via-sidebar to-primary text-white shadow-md">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 right-44 h-56 w-56 rounded-full bg-white/5" />

      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-8">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/15 text-3xl font-bold ring-1 ring-white/30">
          {iniciales(nombre)}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Mi empresa</p>
          <h1 className="mt-1 break-words text-2xl font-semibold leading-tight sm:text-3xl">{nombre}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={chip}>
              <span className={`h-2 w-2 rounded-full ${estado.punto}`} /> {estado.texto}
            </span>
            <span className={chip}>
              <FaAward /> Categoría {mayuscula(usuario.categoria) || "Socio"}
            </span>
            {usuario.rubro && (
              <span className={chip}>
                <FaGears /> {usuario.rubro}
              </span>
            )}
            {usuario.localidad && (
              <span className={chip}>
                <FaLocationDot /> {usuario.localidad}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={`relative grid divide-y divide-white/10 border-t border-white/10 bg-black/10 ${sinCuotas ? "sm:grid-cols-2" : "sm:grid-cols-3"} sm:divide-x sm:divide-y-0`}>
        <Dato etiqueta="N° de socio">{usuario.id ? `N° ${usuario.id}` : "-"}</Dato>
        <Dato etiqueta="Cuenta creada" sub={antiguedad && `${antiguedad} en CAPYMEF`}>
          {desde ? <span className="first-letter:uppercase">{desde}</span> : "-"}
        </Dato>
        {!sinCuotas && <Dato etiqueta="Estado de cuotas">{estadoCuotas}</Dato>}
      </div>
    </section>
  );
}
