// ==========================================
// SERVICIOS DEL PANEL DE SOCIO
// Todo lo que el socio consume del backend pasa por acá, así el manejo del
// token, de la sesión vencida y la validación de URLs externas está en un solo lugar.
// ==========================================
const API_URL = import.meta.env.VITE_API_URL;

// ------------------------------------------
// SESIÓN
// ------------------------------------------
export const leerUsuarioGuardado = () => {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    return usuario && typeof usuario === "object" ? usuario : null;
  } catch {
    return null;
  }
};

// Decodifica el payload del JWT (sin verificar la firma: eso lo hace el backend)
// solo para saber si ya venció y no mostrar el panel con una sesión muerta.
const leerPayloadToken = (token) => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")));
  } catch {
    return null;
  }
};

export const tokenVigente = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;
  const payload = leerPayloadToken(token);
  if (!payload) return false;
  return !payload.exp || payload.exp * 1000 > Date.now();
};

export const limpiarSesion = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
};

const expulsarPorSesionVencida = () => {
  limpiarSesion();
  window.location.replace("/login");
};

export class ErrorApi extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

// fetch con token. Si el backend dice que el token es inválido/vencido, cerramos sesión.
const peticion = async (ruta, { method = "GET", body, esperarArchivo = false } = {}) => {
  const token = localStorage.getItem("token");
  if (!token) {
    expulsarPorSesionVencida();
    throw new ErrorApi("Tu sesión expiró. Volvé a iniciar sesión.", 401);
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ErrorApi("No se pudo conectar con el servidor. Intentá de nuevo en unos minutos.", 0);
  }

  const esJson = (respuesta.headers.get("content-type") || "").includes("application/json");
  const datos = esJson ? await respuesta.json().catch(() => null) : null;

  // verificarToken responde 401 sin token y 403 con token inválido/vencido
  if (respuesta.status === 401 || (respuesta.status === 403 && /token/i.test(datos?.mensaje || ""))) {
    expulsarPorSesionVencida();
    throw new ErrorApi("Tu sesión expiró. Volvé a iniciar sesión.", respuesta.status);
  }

  if (!respuesta.ok) {
    throw new ErrorApi(datos?.mensaje || "Ocurrió un error al procesar la solicitud.", respuesta.status);
  }

  if (esperarArchivo) return respuesta.blob();
  if (datos && datos.exito === false) throw new ErrorApi(datos.mensaje || "Ocurrió un error.", respuesta.status);
  return datos;
};

// ------------------------------------------
// VALIDACIÓN DE URLS EXTERNAS
// Nunca redirigimos ni abrimos una URL que venga del servidor sin chequear
// protocolo y dominio: evita open-redirects y esquemas tipo "javascript:".
// ------------------------------------------
const urlSegura = (valor, dominioPermitido) => {
  try {
    const url = new URL(valor);
    return url.protocol === "https:" && dominioPermitido.test(url.hostname) ? url : null;
  } catch {
    return null;
  }
};

const DOMINIO_MERCADOPAGO = /(^|\.)mercadopago\.com(\.[a-z]{2})?$/i;
const DOMINIO_CLOUDINARY = /^res\.cloudinary\.com$/i;

const idValido = (id) => /^[\w-]{1,64}$/.test(String(id ?? ""));

const descargarBlob = (blob, nombreArchivo) => {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const nombreArchivoSeguro = (texto) => String(texto || "archivo").replace(/[^\w.-]+/g, "_").slice(0, 80);

// ------------------------------------------
// PERFIL
// ------------------------------------------
export const obtenerMiPerfil = async () => (await peticion("/auth/perfil")).data;

// El backend solo permite que el socio edite teléfono y localidad.
export const actualizarMisDatosContacto = async ({ telefono, localidad }) =>
  (await peticion("/auth/perfil", { method: "PUT", body: { telefono, localidad } })).data;

// ------------------------------------------
// CUOTAS Y PAGOS
// ------------------------------------------
// Endpoint esperado: GET /api/pagos/mis-cuotas -> { exito, data: Cuota[] (con su "pago" incluido) }
// Si el backend todavía no lo expone devolvemos null para que la vista lo informe.
export const obtenerMisCuotas = async () => {
  try {
    const resultado = await peticion("/pagos/mis-cuotas");
    return Array.isArray(resultado?.data) ? resultado.data : [];
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
};

// Pide al backend la orden de Mercado Pago y redirige al checkout.
export const pagarCuotaOnline = async (cuotaId) => {
  if (!idValido(cuotaId)) throw new ErrorApi("Cuota inválida.", 400);
  const resultado = await peticion(`/pagos/${encodeURIComponent(cuotaId)}/iniciar`, { method: "POST" });
  const destino = urlSegura(resultado?.data?.linkPago, DOMINIO_MERCADOPAGO);
  if (!destino) throw new ErrorApi("El enlace de pago recibido no es válido. Contactá a la administración.", 0);
  window.location.assign(destino.href);
};

export const descargarComprobanteCuota = async (cuota) => {
  const urlCloudinary = urlSegura(cuota?.pago?.urlComprobante, DOMINIO_CLOUDINARY);
  if (urlCloudinary) {
    window.open(urlCloudinary.href, "_blank", "noopener,noreferrer");
    return;
  }
  if (!idValido(cuota?.id)) throw new ErrorApi("Cuota inválida.", 400);
  try {
    const blob = await peticion(`/pagos/mis-cuotas/${encodeURIComponent(cuota.id)}/comprobante`, { esperarArchivo: true });
    descargarBlob(blob, `comprobante-${nombreArchivoSeguro(cuota.mes_anio)}.pdf`);
  } catch (error) {
    if (error.status === 404) throw new ErrorApi("El comprobante todavía no está disponible para descargar.", 404);
    throw error;
  }
};

// ------------------------------------------
// EVENTOS
// ------------------------------------------
export const obtenerEventosSocio = async () => {
  const resultado = await peticion("/eventos/socios");
  return (Array.isArray(resultado?.data) ? resultado.data : []).filter((evento) => evento.estado !== "cancelado");
};

export const cambiarInscripcionEvento = async (eventoId, inscribirse) => {
  if (!idValido(eventoId)) throw new ErrorApi("Evento inválido.", 400);
  return peticion(`/eventos/${encodeURIComponent(eventoId)}/inscribirse`, { method: inscribirse ? "POST" : "DELETE" });
};

export const descargarCertificadoEvento = async (evento) => {
  if (!idValido(evento?.id)) throw new ErrorApi("Evento inválido.", 400);
  const blob = await peticion(`/eventos/${encodeURIComponent(evento.id)}/certificado`, { esperarArchivo: true });
  descargarBlob(blob, `certificado-${nombreArchivoSeguro(evento.titulo)}.pdf`);
};

// ------------------------------------------
// FORMATEO
// ------------------------------------------
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export const formatearPeriodo = (mesAnio) => {
  const [anio, mes] = String(mesAnio || "").split("-");
  const nombreMes = MESES[Number(mes) - 1];
  return nombreMes ? `${nombreMes} de ${anio}` : mesAnio || "-";
};

export const formatearMonto = (monto) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(Number(monto) || 0);

export const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  const [anio, mes, dia] = String(fecha).slice(0, 10).split("-");
  return dia ? `${dia}/${mes}/${anio}` : "-";
};

// Cuota que hay que mostrar como "actual": la impaga más vieja, o si está todo pago, la más reciente.
export const elegirCuotaActual = (cuotas = []) => {
  const ordenadas = [...cuotas].sort((a, b) => String(b.mes_anio).localeCompare(String(a.mes_anio)));
  const impagas = ordenadas.filter((c) => c.estado !== "pagada");
  return impagas.length ? impagas[impagas.length - 1] : ordenadas[0] || null;
};

export const ESTILOS_ESTADO_CUOTA = {
  pagada: { texto: "Pagada", clase: "bg-[#61d5a5] text-[#247c5c]" },
  pendiente: { texto: "Pendiente", clase: "bg-[#ffd58f] text-[#a16b18]" },
  vencida: { texto: "Vencida", clase: "bg-[#f7b4a2] text-[#9b3418]" },
};
