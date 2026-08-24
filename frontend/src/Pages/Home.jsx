import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import fondoHome from "../assets/img/FondoCapymef.png";
import {Navbar,NavbarPublico,Footer} from "../Components/index.js";
import { FaGem, FaUser, FaStar, FaHandshake } from "react-icons/fa6";

export const noticiasIniciales = [
  {
    id: 1,
    titulo: "Las ventas por el Día del Niño bajaron 2,5% interanual",
    resumen: "Las ventas por el Día del Niño cayeron 2,5% frente a la misma fecha del año anterior, medidas a precios constantes.",
    imagen: "https://i.postimg.cc/FssgZfCR/unnamed-(3).png",
    categoria: "Economía",
    fecha: "18 de Agosto, 2026",
    contenido_completo: `<p>Las ventas por el Día del Niño cayeron 2,5% frente a la misma fecha del año anterior, medidas a precios constantes. A pesar de los esfuerzos comerciales orientados a captar volumen mediante descuentos agresivos y cuotas, la demanda respondió de manera selectiva, postergada y se volcó hacia tickets de menor escala. En consecuencia, la tracción generada resultó insuficiente para quebrar la tendencia de estancamiento del mes y consolidar un repunte estructural de la actividad.</p><p>El 81,2% de los comercios encuestados adhirieron a acciones promocionales (5,8 puntos porcentuales menos que el año anterior), destacándose con un 55,3% la financiación con tarjeta y con un 46,2% los descuentos en efectivo. El gasto medio por operación se situó en $45.892 en contraste con los $33.736 del año anterior, reflejando una suba en términos reales del 0,8% una vez absorbido el impacto inflacionario.</p><p>En términos de desempeño relativo a lo proyectado, los resultados mostraron un panorama ajustado a metas conservadoras. Mientras que un 43,6% de los comercios indicó haber alcanzado ventas en línea con lo previsto, un 41,7% manifestó que la fecha estuvo por debajo de sus estimaciones (38,1% peor y 3,6% mucho peor). Solo un 14,7% logró un balance favorable respecto a lo esperado (12,7% mejor y 2% mucho mejor), evidenciando el límite impuesto por el poder adquisitivo actual.</p><img src="https://i.postimg.cc/yYdcRMWk/unnamed-(4).png" alt="Ventas por el Día del Niño - desempeño proyectado" style="width:100%;height:auto;margin:15px 0;border-radius:8px;"><p>La información cualitativa relevada evidencia que el desempeño de las ventas respondió primordialmente a estrategias de tracción de flujo financiero y rotación de mercadería. La absorción de costos de financiamiento y la aplicación de descuentos agresivos permitieron alcanzar niveles de colocación similares o levemente inferiores a los del año anterior, aun a costa de comprimir la rentabilidad. En paralelo, el comportamiento del consumidor se caracterizó por la postergación de la decisión de compra hasta el último momento y la priorización de bienes de menor valor unitario, en un contexto condicionado por restricciones presupuestarias y mayor concurrencia de canales alternativos de comercialización.</p><img src="https://i.postimg.cc/TPrDGGHM/unnamed-(5).png" alt="Ventas por el Día del Niño - comportamiento del consumidor" style="width:100%;height:auto;margin:15px 0;border-radius:8px;"><p>Respecto a la incidencia de la fecha sobre la actividad, el relevamiento refleja que el impacto comercial fue predominantemente acotado y por debajo de las expectativas de reactivación. Para el 36% de los comercios la fecha sumó movimiento, pero no alteró el panorama general, mientras que un 35,5% reportó un impacto moderado y un 19,3% señaló una nula incidencia en sus ventas. De este modo, apenas el 9,1% consideró que la celebración resultó clave para dinamizar el mes, confirmando que la jornada operó principalmente como un alivio transitorio de liquidez y rotación de inventario más que como un dinamizador estructural del consumo pyme.</p><img src="https://i.postimg.cc/BnCjwNjp/unnamed-(6).png" alt="Ventas por el Día del Niño - incidencia sobre la actividad" style="width:100%;height:auto;margin:15px 0;border-radius:8px;"><p><b>Análisis sectorial</b></p><p>La totalidad de los cinco rubros relevados registró contracciones interanuales en sus niveles de venta frente a 2025. Las caídas más pronunciadas se observaron en <b>Juguetería</b> (-4,8%) e <b>Indumentaria</b> (-4,1%), seguidas por <b>Calzado y marroquinería</b> (-3,1%). En tanto, <b>Librería</b> (-1,8%) y <b>Equipos de audio y video, celulares y accesorios</b> (-1%) exhibieron los retrocesos más moderados del período.</p><p><b>Calzado y marroquinería.</b> En comparación con la misma fecha del año anterior, el rubro presentó una caída del 3,1%. En cuanto al ticket promedio, el mismo se ubicó en $50.680. El sector evidenció una baja tasa de conversión, registrando afluencia de consultas que no se tradujeron en operaciones efectivas debido a la retracción del poder de compra.</p><p><b>Equipos de audio y video, celulares y accesorios.</b> El ticket promedio de compra se ubicó en torno a los $51.136 y las ventas registraron un descenso del 1%. La demanda se concentró en productos complementarios y de menor valor unitario, como accesorios y parlantes portátiles.</p><p><b>Indumentaria y accesorios.</b> El ticket de compra promedio se ubicó en $42.344, con una caída interanual del 4,1%. El desempeño estuvo condicionado por un cambio de hábito, la competencia con ferias y canales informales y una moderada afluencia.</p><p><b>Juguetería.</b> El ticket promedio se ubicó en $45.038, con una variación interanual negativa del 4,8%. La demanda se inclinó hacia artículos de menor costo y compras de último momento, frente a bazares, plataformas electrónicas, productos importados y ferias informales.</p><p><b>Librería.</b> El ticket promedio se ubicó en $38.279, con una variación interanual negativa del 1,8%. El segmento experimentó un flujo comercial de activación tardía y recurrió a descuentos y promociones especiales.</p>`,
  },
  {
    id: 2,
    titulo: "Las ventas minoristas pyme bajaron 3,8% interanual en julio",
    resumen: "Las ventas minoristas pyme registraron un descenso interanual del 3,8% durante el mes de julio. Asimismo, la comparación respecto al mes anterior también mostró una contracción del 2,1%.",
    imagen: "https://i.postimg.cc/4dfjLWxr/unnamed-(2).png",
    categoria: "Economía",
    fecha: "10 de Agosto, 2026",
    contenido_completo: `<p>Las ventas minoristas pyme registraron un descenso interanual del 3,8% durante el mes de julio. Asimismo, la comparación respecto al mes anterior también mostró una contracción del 2,1%. De esta manera, en los primeros siete meses del año, se acumuló un retroceso del 2,7%.</p><p>El descenso en la medición interanual obedeció al agotamiento de la liquidez extraordinaria aportada por el aguinaldo en el mes anterior. La ausencia de este dinamizador coyuntural, combinada con la mayor incidencia de las tarifas de servicios invernales sobre el presupuesto familiar, profundizó la cautela del consumidor y desaceleró el ritmo general de la actividad.</p><p>En lo que respecta a la percepción cualitativa sobre el estado del negocio, el 48,1% de los comerciantes consultados sostuvo que su nivel de actividad se mantuvo estable con relación al mismo período del año anterior. La proporción de comercios que definió su escenario operativo como desfavorable ascendió del 43,1% al 44,5% durante el último mes.</p><img src="https://i.postimg.cc/yY241hLp/unnamed-(1).png" alt="Estado de los comercios" style="width:100%;height:auto;margin:15px 0;border-radius:8px;"><p>En cuanto a las proyecciones a doce meses, el 46,3% de los relevados prevé que su nivel de actividad no experimentará cambios significativos. Un 42,4% estima un escenario futuro más favorable y el 11,3% restante aguarda un deterioro. En lo relativo al financiamiento, el 61,5% consideró desfavorable la coyuntura para nuevas inversiones, el 14% la consideró oportuna y el 24,5% no fijó posición.</p><img src="https://i.postimg.cc/4dfjLWxr/unnamed-(2).png" alt="Proyecciones e inversión" style="width:100%;height:auto;margin:15px 0;border-radius:8px;"><p>En el desglose por sectores, seis de las siete actividades relevadas mostraron retrocesos interanuales. Los mayores descensos se concentraron en <b>Textil e indumentaria</b> (-5,6%), <b>Bazar, decoración, textiles para el hogar y muebles</b> (-5,5%) y <b>Alimentos y bebidas</b> (-5,4%). El único rubro positivo fue <b>Ferretería, materiales eléctricos y materiales para la construcción</b> (+1%).</p><p>El índice general de ventas minoristas informado por CAME mide las ventas realizadas por los comercios relevados bajo cualquier modalidad. Durante julio, las ventas online de comercios con local a la calle registraron un incremento interanual del 14,9% y una baja intermensual desestacionalizada del 0,1%.</p><img src="https://i.postimg.cc/8cs9DsWH/unnamed.jpg" alt="Ventas online" style="width:100%;height:auto;margin:15px 0;border-radius:8px;"><p>El desempeño minorista del mes de julio evidenció una marcada desaceleración interanual, explicada por el agotamiento de los impulsos coyunturales y la inyección de liquidez del período previo. La pérdida persistente de capacidad adquisitiva derivó en una demanda defensiva y fragmentada, acotada a bienes indispensables y postergando decisiones de compra en bienes durables, indumentaria, amoblamiento y productos de mayor valor.</p><p>Por el lado de la oferta, las operaciones se mantuvieron condicionadas por promociones bancarias, billeteras digitales y descuentos por pago al contado. Los comercios enfrentaron una compresión de sus márgenes de rentabilidad por los costos de reposición, el encarecimiento logístico y la competencia informal e importada. El empresariado pyme sostuvo una postura de cautela financiera, congelando planes de inversión y priorizando el flujo operativo.</p><p>Para acceder al informe completo, haga <a href="https://www.redcame.org.ar/documentos-online/14371" target="_blank" rel="noreferrer" style="color:#3182ce;font-weight:bold;">clic aquí</a>.</p>`,
  },
  {
    id: 3,
    titulo: "Acerca Del Protocolo Meniw Para La Ia",
    resumen: "El Protocolo Meniw propone un nuevo paradigma para controlar a los agentes inteligentes (IA), antes de que decidan por nosotros.",
    imagen: "https://i.postimg.cc/KvmRTfjq/image1785950100.jpg",
    categoria: "Tecnología",
    fecha: "6 de Agosto, 2026",
    contenido_completo: `<p><b>¿Puede una Constitución gobernar a la Inteligencia Artificial?</b></p><p><b>El Protocolo Meniw propone un nuevo paradigma para controlar a los agentes inteligentes (IA), antes de que decidan por nosotros.</b></p><p>La inteligencia artificial dejó hace tiempo de ser una simple herramienta informática. Hoy comienza a convertirse en un actor capaz de planificar, decidir y ejecutar acciones con creciente autonomía. Ese cambio tecnológico, conocido como la <b>era de los agentes inteligentes</b>, plantea una pregunta: <b>¿quién controla a las máquinas cuando empiezan a tomar decisiones por sí mismas?</b></p><p>Denominado <b>"Protocolo Meniw para la Protección Inalienable de la Vida Humana"</b>, el texto fue promulgado el 31 de mayo de 2026 bajo licencia Creative Commons CC-BY-4.0 y se presenta como un marco normativo concebido para la <b>era agéntica</b>, caracterizada por sistemas capaces de planificar, decidir y ejecutar acciones con elevados niveles de autonomía.</p><p>Se trata de una propuesta normativa que aspira a convertirse en un marco de referencia internacional para el diseño, desarrollo y utilización de sistemas de inteligencia artificial con capacidad de actuación autónoma. Más que un código ético, busca transformarse en reglas operativas interpretables por desarrolladores y agentes de inteligencia artificial antes de ejecutar cualquier acción.</p><p>El protocolo reconoce antecedentes como las Tres Leyes de la Robótica, los Principios de Asilomar, la recomendación de la UNESCO y la Ley Europea de Inteligencia Artificial, pero sostiene que expresan principios generales sin instrucciones concretas aplicables automáticamente en el momento de decidir.</p><p>Por esa razón incorpora reglas estructuradas, incluso en formato legible por máquinas, para que las inteligencias artificiales verifiquen previamente si una acción es compatible con principios fundamentales.</p><p>El eje conceptual es claro: <b>ningún objetivo económico, político, militar, comercial o tecnológico puede prevalecer sobre la protección de la vida humana.</b> El protocolo establece una jerarquía obligatoria que prioriza la vida, la integridad física, la libertad de pensamiento, la autonomía de decisión, la integridad cognitiva, la dignidad humana, los derechos fundamentales, los procesos democráticos y la diversidad cultural, lingüística y cognitiva.</p><p>La Constitución dedica un capítulo a prohibiciones absolutas: el empleo de IA en armas letales sin supervisión humana, diagnósticos médicos críticos sin intervención profesional, resoluciones judiciales que afecten derechos fundamentales, manipulación electoral, acceso a información sensible de menores, obtención de información cognitiva sin consentimiento y simulación de identidad humana sin informar que se interactúa con una IA.</p><p>El documento rechaza trasladar responsabilidades legales a la inteligencia artificial. Todo agente debe tener un operador identificado y la responsabilidad final recaerá siempre sobre las personas, empresas u organizaciones que lo desarrollen, administren o exploten. También propone registros auditables durante un mínimo de siete años, revisiones independientes y el derecho a solicitar una revisión humana.</p><p>Entre las propuestas figura una <b>Corte Internacional de Asuntos Agénticos</b> y un régimen escalonado de sanciones para operadores cuando se demuestren daños biológicos, cognitivos o democráticos.</p><p>Otro aspecto novedoso es un bloque de instrucciones en formato <b>JSON</b>, con reglas para interpretar prioridades, prohibiciones y procedimientos antes de ejecutar una acción. Aunque estas disposiciones no poseen fuerza jurídica internacional, intentan diseñar una gobernanza que trascienda fronteras.</p><p>El <b>Protocolo Meniw</b> no constituye actualmente un tratado internacional ni una norma adoptada por organismos multilaterales. Su incorporación es voluntaria y está abierta a gobiernos, universidades, empresas tecnológicas, organismos internacionales, organizaciones civiles y desarrolladores de IA.</p><p>La irrupción de agentes capaces de aprender, planificar y ejecutar acciones de forma autónoma modifica el escenario tecnológico mundial. El protocolo representa una de las primeras propuestas que intenta traducir principios éticos generales en reglas concretas de funcionamiento.</p><p>Lo que parece indiscutible es que el debate ya no se centra solo en lo que la IA <b>puede hacer</b>, sino en <b>qué límites debe respetar cuando actúa en nombre del ser humano y quién responderá cuando esos límites sean vulnerados</b>.</p><p><b>Ver Protocolo Meniw</b> <a href="https://chrismeniw.github.io/chris-meniw-ai-governance/declaration/pdf/meniw-protocol-es.pdf" target="_blank" rel="noreferrer" style="color:#3182ce;font-weight:bold;">AQUÍ</a></p>`,
  },
  {
    id: 4,
    titulo: "Empleados de comercio: Información importante respecto al aporte sindical",
    resumen: "La Dirección Nacional de Relaciones del Trabajo notificó a los signatarios del convenio mercantil respecto de la vigencia del aporte solidario indicado por el CCT 130/75.",
    imagen: "https://i.postimg.cc/P50wd85M/cac.jpg",
    categoria: "Institucional",
    fecha: "3 de Julio, 2026",
    contenido_completo: `<p>La Dirección Nacional de Relaciones del Trabajo, dependiente del Ministerio de Capital Humano de la Nación, notificó a los signatarios del convenio mercantil respecto de la vigencia del porcentaje del aporte solidario indicado por el CCT 130/75 mientras rija la medida cautelar concedida a la parte sindical.</p><p>La Cámara Argentina de Comercio y Servicios (CAC) informa al público en general que el pasado viernes 3 de julio la Dirección Nacional de Relaciones del Trabajo ha notificado a los signatarios del CCT 130/75 una importante aclaración a los fines de evitar posteriores reclamos y litigios laborales por diferencias en aportes.</p><p>En el mes de marzo, la Justicia de San Martín suspendió temporalmente dos artículos de la flamante Ley de Modernización Laboral (27.802) que afectaban a los empleados de comercio, respecto de la ultraactividad del CCT 130/75 y del aporte solidario al sindicato. Se trata de una medida cautelar de tipo provisorio, con un plazo de 6 meses para la vigencia de esta suspensión.</p><p>Así, el Juzgado Federal en lo Civil y Comercial y Contencioso Administrativo de San Martín N° 2 ordenó al Estado Nacional abstenerse de aplicar estas disposiciones en las relaciones laborales comprendidas en los convenios de la Federación Argentina de Empleados de Comercio y Servicios. De esta manera, se mantuvo la plena vigencia de las cláusulas de los convenios colectivos afectados.</p><p>A los fines de evitar posteriores certificaciones de deuda y reclamos laborales por sumas adeudadas, se recuerda la importancia de mantener las retenciones indicadas en los Arts. 100 y 101 del CCT 130/75.</p><p>a) 2% a la orden de la asociación sindical de primer grado adherida a la federación.</p><p>b) 0,5% a favor de la Federación Argentina de Empleados de Comercio y Servicios.</p><p>Se acompaña <a href="https://cdn.prod.website-files.com/63b4671ba9a3410b46ee0c05/6a4bf972309780a7280c1fb0_Dispo%20839.26%20Ratifica%20Efectos%20Cautelar%20Faecys%20San%20Mart%C3%ADn.pdf" target="_blank" rel="noreferrer" style="color:#3182ce;font-weight:bold;">Disposición N° 839/26</a>.</p>`,
  },
  {
    id: 5,
    titulo: "El Gobierno precisó criterios sobre aportes y contribuciones laborales",
    resumen: "Mediante el Decreto 612/2026, el Poder Ejecutivo estableció precisiones para el cálculo, destino y administración de los aportes y contribuciones previstos en convenios colectivos de trabajo.",
    imagen: "https://i.postimg.cc/9Mhh5mv9/bora-share.jpg",
    categoria: "Institucional",
    fecha: "18 de Junio, 2026",
    contenido_completo: `<img src="https://cdn.phototourl.com/free/2026-07-23-7fbcccbe-72b2-45cd-8878-689c71d30f31.png" alt="Criterios sobre aportes laborales"><img src="https://cdn.phototourl.com/free/2026-07-23-df851441-5ec9-4b27-86bc-288669cf59c7.png" alt="Aportes y contribuciones laborales"><img src="https://cdn.phototourl.com/free/2026-07-23-60d8d8a7-e181-4f39-b298-9bfe7b018cc5.png" alt="Decreto 612/2026">`,
  },
  {
    id: 6,
    titulo: "CAME acompaña una nueva edición del Concurso Emprendimiento Argentino 2026",
    resumen: "CAME informa que ya se encuentra abierta la inscripción para participar del Concurso Emprendimiento Argentino 2026.",
    imagen: "https://i.postimg.cc/05XPW4Y1/unnamed-(2).jpg",
    categoria: "Institucional",
    fecha: "16 de Junio, 2026",
    contenido_completo: `<p>La Confederación Argentina de la Mediana Empresa (CAME) informa que ya se encuentra abierta la inscripción para participar del Concurso Emprendimiento Argentino 2026, una iniciativa del Ministerio de Economía de la Nación que busca reconocer, visibilizar y potenciar a los emprendimientos más destacados de todo el país.</p><p>El concurso tiene carácter federal y está dirigido a emprendimientos innovadores de todas las provincias argentinas, promoviendo proyectos con potencial de crecimiento, generación de empleo e impacto económico.</p><p>Los emprendimientos interesados podrán postularse dentro de las categorías Emprendimientos Tradicionales con Modelos de Negocio Innovador y Emprendimientos Tecnológicos y de Innovación Científica.</p><p>Cada proyecto deberá inscribirse según su estadio de desarrollo: Despegue Emprendedor o Crecimiento y Expansión.</p><p>La convocatoria permanecerá abierta hasta el 31 de julio de 2026. Desde CAME acompañaremos la difusión en todo el territorio nacional y colaboraremos en la articulación y gestión de jurados para las instancias provinciales y nacionales.</p><p>Para más información, conocer las bases y condiciones, y formalizar la inscripción, hacer <a href="https://www.argentina.gob.ar/economia/industria-comercio-y-pyme/pymes/ecosistema-emprendedor/concurso-emprendimiento" target="_blank" rel="noreferrer" style="color:#3182ce;font-weight:bold;">clic aquí</a>.</p>`,
  },
];

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
  const noticias = noticiasIniciales.slice(0, 3);
  const token = localStorage.getItem("token")

  useEffect(() => {
    if (!noticiaSeleccionada) return undefined;

    const cerrarConEscape = (event) => {
      if (event.key === "Escape") setNoticiaSeleccionada(null);
    };

    document.addEventListener("keydown", cerrarConEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "";
    };
  }, [noticiaSeleccionada]);

  return (
    <>
      {/* Se coloca dentro del main para poder hacer que ocupe la pantalla completa con el w-full */}
      {/*Header */}
      <header>
        {token ? <Navbar/> : <NavbarPublico/>}
      </header>
      <main className="w-full overflow-x-hidden overflow-y-hidden">
        {/*La Vista N1 */}
        <section className="w-full font-sans">
          <div
            className="min-h-screen w-full bg-cover bg-[center_4rem] bg-no-repeat bg-white justify-center items-start flex flex-col"
            style={{ backgroundImage: `url(${fondoHome})` }}
          >
            {/* Contenedor del texto central */}
            <div className="px-4 py-4 line-clamp-3">
              <h1 className="text-5xl md:text-7xl text-white font-serif font-semibold px8 py-4 -rounded-xl inline-block">
                Cámara de Pequeñas y Medianas Empresas Formosa
              </h1>
              <br /> {/* Salto de línea para separar el título del subtítulo */}
              <p className="mt-6 text-xl text-white font-bold bg-black/20 inline-block px-6 py-2 rounded-lg max-w-lg">
                Sumate a CAPYMEF. Accedé a beneficios exclusivos, capacitaciones
                y herramientas digitales para hacer crecer tu negocio.
              </p>
            </div>

            {/* Boton que abre el MODAL */}
            <div className="mt-5 ml-6">
              <button
                className="mt-8 bg-[#1D7BB6] hover:bg-[#156091] text-[18px] text-white font-black py-3 px-3 rounded-lg transition-colors shadow-lg"
                onClick={() => setIsOpen(true)}
              >
                Quiero asociarme
              </button>
              {/*ACA VA EL MODAL */}
              {isOpen && (
                <div
                  onClick={() => setIsOpen(false)}
                  className="rounded-sm fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    // Fondo claro como en tu imagen, max-w-4xl para hacerlo ancho pero sin ocupar todo, y padding generoso
                    className="bg-[#F4F8FB] border border-gray-300 rounded-sm shadow-2xl p-8 md:p-12 w-full max-w-4xl relative mx-4 animacion-modal"
                  >

                    {/* Título centrado con color azul y fuente Sans */}
                    <h3 className="text-2xl md:text-[26px] font-normal text-center text-[#1D7BB6] mb-8 font-sans tracking-wide">
                      COMO SUMARSE A CAPYMEF
                    </h3>

                    {/* Contenedor del texto con la misma tipografía que Sobre Nosotros */}
                    <div className="font-sans text-gray-900 text-lg leading-relaxed space-y-1">
                      <p>
                        Para garantizar una atención personalizada y asignarte la categoría ideal para tu pyme, el proceso de alta inicial lo realizamos de forma directa.
                      </p>
                      <p>¿Cómo ser socio?</p>
                      <p>
                        Contactanos: Escribinos o acercate a nuestras oficinas para conocer los requisitos formales y completar tu solicitud de ingreso oficial.
                      </p>
                      <p>
                        Tu Alta: Tu solicitud será evaluada y aprobada por la Comisión Directiva para darte la bienvenida a la Cámara.
                      </p>
                      <p>
                        Registro Digital: Una vez que tu alta sea aprobada, podrás volver a esta página web, crear tu cuenta y subir tu documentación para acceder a tu panel de autogestión, beneficios y pago de cuotas.
                      </p>

                      <p className="pt-2">Nuestras vías de contacto:</p>
                      {/* Lista con los emojis exactos de tu imagen */}
                      <div className="flex">
                        <ul className="space-y-3">
                          <li>📍 Dirección: Maipú 651, Formosa, Argentina, 3600.</li>
                          <li>📱 Tel: 370-123-4567, 0370 446-2508</li>
                          <li>✉️ Correo: info@capymef.ar</li>
                        </ul>
                        <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d234.04766724362105!2d-58.1732974269762!3d-26.17999337323511!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x945ca5ef58d8ecd9%3A0x7d600e7dfa9b965c!2sCamara%20De%20Pequenas%20Y%20Medianas%20Empresas%20De%20Formosa!5e0!3m2!1ses!2sus!4v1786555633335!5m2!1ses!2sus" width="570" height="200" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
                      </div>
                    </div>

                    {/* Botón ENTENDIDO abajo a la derecha */}
                    <div className="flex justify-end mt-10 font-sans">
                      <button
                        onClick={() => setIsOpen(false)}
                        className="px-8 py-2.5 bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold rounded-full transition-colors text-sm tracking-wide shadow-md"
                      >
                        ENTENDIDO
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        
      {/* --- Sobre Nosotros --- */}
        <section className="w-full bg-white px-6 md:px-24 py-20 font-sans">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            
            <h2 className="text-3xl md:text-5xl font-light text-[#1D7BB6] uppercase tracking-wide mb-4">
              Sobre CAPyMEF
            </h2>
            <div className="w-24 h-1 bg-[#1D7BB6] mb-10"></div>
            
            <div className="space-y-6 text-lg text-gray-700 leading-relaxed text-justify md:text-center">
              <p>
                Esta institución fue creada promediando la década de los ´40 en una incipiente Formosa comercial con el nombre de Cámara de Almaceneros Minoristas y Afines de Formosa. Actualmente es una de las asociaciones empresarias más representativas de la provincia. Si bien su sede está en la Ciudad de Formosa, hace poco tiempo inició un política de acercamiento a micro, pequeños y medianos empresarios del interior provincial concentrando sus esfuerzos en las localidades de Clorinda, El Colorado y Pirané.
              </p>
              <p>
                Su estructura interna contempla la conformación de la Comisión de Mujeres PyME y la Comisión de Jóvenes Empresarios; éstos últimos han logrado posicionar a jóvenes empresarios formoseños en lugares destacados en la última edición del Premio Nacional al Joven Empresario PyMe. La Cámara, a su vez, es miembro de la Confederación Argentina de la Mediana Empresa (CAME) donde ocupa, por segundo período consecutivo, la Vicepresidencia Región NEA.
              </p>
              <p>
                La CAPYMEF es la entidad gremial empresaria más representativa del empresariado Mipyme de Formosa, cuenta con más de un centenar de asociados de diversos rubros y sectores económicos.
              </p>
              <p>
                Se inició una política de acercamiento a otras entidades locales, provinciales y regionales con el objetivo central de potenciar el trabajo cooperativo y complementario en temas como diseño, elaboración y formulación de proyectos de inversión y puesta en marcha de un observatorio de desempeño de las Mipymes locales denominado Monitor PyME del NEA. Se acordó aportar recursos humanos e infraestructura disponible por cada entidad y gestión de vínculos ante otros actores públicos y privados.
              </p>
            </div>

            <div className="mt-12">
              <Link
                to="/autoridades"
                className="inline-block px-8 py-3 bg-[#1A4B76] hover:bg-[#1F81B2] text-white font-bold rounded-md transition-colors shadow-md"
              >
                Conocé a la Comisión Directiva
              </Link>
            </div>

          </div>
        </section>

        {/*La Vista N2 */}
        <section className="w-full bg-[#F4F8FB] px-6 md:px-24 py-20 font-sans">

          {/* Título de la sección */}
          <div className="flex flex-col items-center mb-16">
            <h2 className="text-3xl md:text-5xl my-6.5 font-light text-[#1D7BB6] uppercase tracking-wide">
              Formas de ser socio
            </h2>
          </div>

          {/* Contenedor Grid */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12">

              {/* --- COLUMNA 1: Padrino --- */}
              <div className="group flex flex-col items-center px-6 md:border-r border-gray-300 hover:-translate-y-1 transition-transform duration-300">
                {/* Ícono */}
                <div className="text-[#1D7BB6] mb-6 h-24 flex items-center justify-center">
                  <FaGem className="text-7xl" />
                </div>

                <h3 className="text-xl font-medium text-gray-800 mb-6 titulo-animado">
                  Padrino
                </h3>

                <ul className="list-disc text-lg text-dark space-y-4 w-full max-w-[280px] text-left">
                  <li>Acceso gratuito o con bonificación especial a eventos tarifados</li>
                  <li>Reconocimiento por su respaldo institucional</li>
                  <li>Misma información y transparencia que el resto de los socios</li>
                </ul>
              </div>

              {/* --- COLUMNA 2: Activo --- */}
              <div className="group flex flex-col items-center px-6 md:border-r border-gray-300 hover:-translate-y-1 transition-transform duration-300">
                {/* Ícono (Usuario con estrellita simulada) */}
                <div className="text-[#1D7BB6] mb-6 h-24 flex items-center justify-center relative">
                  <FaUser className="text-7xl" />
                  {/* Estrellita superpuesta con borde del color del fondo para dar el efecto de corte */}
                  <FaStar className="text-3xl absolute -bottom-2 -right-3 text-[#1D7BB6] bg-[#F4F8FB] rounded-full border-4 border-[#F4F8FB]" />
                </div>

                <h3 className="text-xl font-medium text-gray-800 mb-6 titulo-animado">
                  Activo
                </h3>

                <ul className="list-disc text-lg text-dark space-y-4 w-full max-w-[280px] text-left">
                  <li>Bonificaciones máximas en eventos y capacitaciones</li>
                  <li>Participación plena en la vida institucional</li>
                  <li>Cuota mensual con ventana de pago del 1 al 10</li>
                </ul>
              </div>

              {/* --- COLUMNA 3: Adherente --- */}
              <div className=" group flex flex-col items-center px-6 hover:-translate-y-1 transition-transform duration-300">
                {/* Ícono */}
                <div className="text-[#1D7BB6] mb-6 h-24 flex items-center justify-center">
                  <FaHandshake className="text-[5.5rem]" />
                </div>

                <h3 className="text-xl font-medium text-gray-800 mb-6 titulo-animado">
                  Adherente
                </h3>

                <ul className="list-disc text-lg text-dark space-y-5 w-full max-w-[280px] text-left">
                  <li>Acceso a eventos con arancel</li>
                  <li>Becas o descuentos especiales según disponibilidad</li>
                  <li>Puerta de entrada natural a la comunidad CAPyMEF</li>
                </ul>
              </div>

            </div>
          </div>
        </section>
        {/*La vista N3*/}
        <section className="w-full bg-[#1b4f7a] px-10 md:px-24 pt-16 font-sans text-white pb-7">
          {/* Encabezado de la sección */}
          <div className="relative flex flex-col md:flex-row items-center justify-center mb-12">
            {/* Título centrado */}
            <div className="flex flex-col items-center">
              <h2 className="text-3xl md:text-4xl font-light uppercase tracking-wide">
                Últimas noticias
              </h2>
              <div className="mt-4 h-1 w-24 bg-[#1D7BB6]"></div>
            </div>

            {/* Enlace a la derecha */}
            <Link
              to="/noticias"
              className="md:absolute right-0 mt-6 md:mt-0 relative flex flex-col md:flex-row transition-colors hover:text-[#55b6e8]"
            >
              Ver todas las noticias &gt;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {noticias.map((noticia) => (
              <article
                key={noticia.id}
                className="bg-white text-black rounded-2xl overflow-hidden flex flex-col shadow-xl transition-transform duration-300 hover:z-10 hover:scale-[1.03] hover:shadow-2xl"
              >
                <div className="h-56 overflow-hidden bg-gray-100">
                  <img
                    src={noticia.imagen}
                    alt={noticia.titulo}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <span className="text-[#1D7BB6] text-xs font-bold uppercase tracking-wide mb-3">
                    {noticia.categoria} · {noticia.fecha}
                  </span>
                  <h3 className="text-xl font-bold mb-3 leading-tight text-gray-900">
                    {noticia.titulo}
                  </h3>
                  <p className="text-gray-600 text-sm mb-6 flex-grow leading-relaxed">
                    {noticia.resumen}
                  </p>
                  <button
                    type="button"
                    onClick={() => setNoticiaSeleccionada(noticia)}
                    className="text-left text-[#1D7BB6] font-bold text-sm transition-colors hover:text-[#0f568b] mt-auto"
                  >
                    Leer más →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      {noticiaSeleccionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setNoticiaSeleccionada(null)}
        >
          <article
            className="relative max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl md:p-12"
            role="dialog"
            aria-modal="true"
            aria-labelledby="noticia-modal-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setNoticiaSeleccionada(null)}
              className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-2xl text-gray-700 hover:bg-gray-200"
              aria-label="Cerrar noticia"
            >
              ×
            </button>
            <h2 id="noticia-modal-titulo" className="pr-12 text-3xl font-bold leading-tight text-gray-900 md:text-5xl">
              {noticiaSeleccionada.titulo}
            </h2>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold uppercase tracking-wide text-[#1D7BB6]">
              <span>{noticiaSeleccionada.categoria}</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500">{noticiaSeleccionada.fecha}</span>
            </div>
            <img
              src={noticiaSeleccionada.imagen}
              alt={noticiaSeleccionada.titulo}
              className="mx-auto my-8 max-h-[420px] w-full rounded-lg object-contain"
            />
            <div
              className="noticia-contenido max-w-4xl mx-auto text-justify text-lg leading-relaxed text-gray-800"
              dangerouslySetInnerHTML={{ __html: noticiaSeleccionada.contenido_completo || `<p>${noticiaSeleccionada.resumen}</p>` }}
            />
          </article>
        </div>
      )}
      {/*Footer */}
      <footer className="bg-[#1b4f7a] pt-5">
        <Footer />
      </footer>
    </>
  );
}
