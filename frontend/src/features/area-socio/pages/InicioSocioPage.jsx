import { useEffect, useMemo, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { FaArrowRight, FaChartLine, FaChevronRight } from "react-icons/fa6";
import { obtenerNoticiasSocios } from "@/services/noticiasService";
import { obtenerEventosSocios } from "@/services/eventosService";
import dayjs from "@/shared/utils/fechas";
import EstadoCuenta from "../components/EstadoCuenta";
import TarjetaCuota from "../components/TarjetaCuota";
import { elegirCuotaActual } from "../utils/cuotas";

const instante = (e) => dayjs(`${e.fecha}T${e.horaInicio || "00:00"}`);

export default function InicioSocioPage() {
  const { usuario, cuotas, errorCuotas } = useOutletContext(); // vienen del SocioLayout
  const [proximoEvento, setProximoEvento] = useState(null);
  const [ultimasNoticias, setUltimasNoticias] = useState([]);

  useEffect(() => {
    let activo = true;

    (async () => {
      const [eventos, noticias] = await Promise.all([obtenerEventosSocios(), obtenerNoticiasSocios()]);
      if (!activo) return;

      if (eventos.exito) {
        const ahora = dayjs();
        const futuros = (eventos.data || [])
          .filter((e) => e.estado !== "cancelado" && e.fecha && !instante(e).isBefore(ahora))
          .sort((a, b) => instante(a).diff(instante(b)));
        setProximoEvento(futuros[0] || null);
      }
      if (noticias.exito) setUltimasNoticias((noticias.data || []).slice(0, 3));
    })();

    return () => {
      activo = false;
    };
  }, []);

  const cuotaActual = useMemo(() => (Array.isArray(cuotas) ? elegirCuotaActual(cuotas) : null), [cuotas]);
  const impagas = Array.isArray(cuotas) ? cuotas.filter((c) => c.estado !== "pagada").length : 0;

  const nombreEmpresa = usuario.razonSocial || "Tu empresa";
  const rubro = usuario.rubro || "Rubro no informado";
  const localidad = usuario.localidad || "Localidad no informada";

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-sm font-semibold text-primary">PANEL DE SOCIO</p>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-navy sm:text-3xl">Hola, {nombreEmpresa}</h1>
          <p className="mt-2 text-sm text-gray-600">Socio N° {usuario.id || "-"} <span className="mx-2">•</span> {rubro} <span className="mx-2">•</span> {localidad}</p>
        </div>
        {Array.isArray(cuotas) && !errorCuotas && (
          impagas === 0 ? (
            <span className="w-fit rounded-sm bg-[#00bf68] px-4 py-2 text-sm font-bold text-white">Estás al día!</span>
          ) : (
            <Link to="/socios/pagos" className="w-fit rounded-sm bg-[#e66d4a] px-4 py-2 text-sm font-bold text-white hover:bg-[#cf5b39]">
              {impagas === 1 ? "Tenés 1 cuota por pagar" : `Tenés ${impagas} cuotas por pagar`}
            </Link>
          )
        )}
      </section>

      <TarjetaCuota cuota={cuotaActual} cuotas={cuotas} errorCuotas={errorCuotas} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <div className="space-y-6">
          <EstadoCuenta cuotas={cuotas} />

          <section className="border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium uppercase text-gray-600">Próximo evento</h2>
              <Link to="/socios/eventos" className="flex items-center gap-2 text-sm font-bold text-[#0875b1] hover:underline">Ver todos <FaArrowRight /></Link>
            </div>
            {proximoEvento ? (
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-[#168bc4] px-3 py-2 text-center font-bold text-white">
                  <span className="block text-xs uppercase">{dayjs(proximoEvento.fecha).format("MMM").replace(".", "")}</span>
                  <span className="text-xl">{dayjs(proximoEvento.fecha).date()}</span>
                </div>
                <div>
                  <h3 className="font-bold">{proximoEvento.titulo}</h3>
                  <p className="text-sm text-gray-600">◉ {proximoEvento.lugar || proximoEvento.modalidad || "Lugar a confirmar"}</p>
                  <p className="text-sm text-gray-600">♟ {proximoEvento.cupoMaximo ? `${proximoEvento.cupoMaximo} cupos disponibles` : "Cupo abierto"}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No hay próximos eventos publicados.</p>
            )}
          </section>
        </div>

        <section className="border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
            <h2 className="text-lg font-medium uppercase text-gray-600">Novedades</h2>
            <FaChartLine className="text-primary" />
          </div>
          <div className="divide-y divide-gray-200">
            {ultimasNoticias.length ? ultimasNoticias.map((noticia) => (
              <article key={noticia.id} className="py-3 first:pt-0">
                <p className="mb-1 text-sm font-medium">{dayjs(noticia.fechaPublicacion).format("DD/MM/YYYY")}</p>
                <p className="text-sm leading-snug text-gray-800">{noticia.titulo}</p>
              </article>
            )) : (
              <p className="py-3 text-sm text-gray-600">No hay noticias publicadas.</p>
            )}
          </div>
          <Link to="/socios/noticias" className="mt-5 flex items-center gap-2 text-sm font-bold text-[#0875b1] hover:underline">Ver todas las noticias <FaChevronRight /></Link>
        </section>
      </div>
    </div>
  );
}
