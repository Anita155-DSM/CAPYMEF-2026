const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Hace una petición al backend y SIEMPRE devuelve { exito, mensaje, data }.
 * Ejemplos:
 *   api("/noticias/publicas")
 *   api("/auth/login", { method: "POST", body: { email, password } })
 *   api("/noticias/admin", { method: "POST", body: formData })   // FormData también
 *   api("/pagos/mis-cuotas/3/comprobante", { blob: true })       // archivo: data = Blob
 * Todas las respuestas incluyen además `status` (código HTTP; 0 si no hubo conexión).
 */
export async function api(ruta, { method = "GET", body, headers = {}, blob = false } = {}) {
  const token = localStorage.getItem("token");
  const esFormData = body instanceof FormData;

  const config = {
    method,
    headers: {
      // Con FormData NO se pone Content-Type: el navegador lo arma solo
      ...(body && !esFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: esFormData ? body : body ? JSON.stringify(body) : undefined,
  };

  // 1. Error de red (backend apagado, sin internet, CORS)
  let response;
  try {
    response = await fetch(`${BASE_URL}${ruta}`, config);
  } catch (error) {
    console.error(`[api] ${method} ${ruta}`, error);
    return { exito: false, status: 0, mensaje: "No se pudo conectar con el servidor." };
  }

  const { status } = response;

  // 2. Archivo (PDF, imagen…): si salió bien devolvemos el Blob en `data`
  if (blob && response.ok) return { exito: true, status, data: await response.blob() };

  // 3. Respuesta sin contenido (por ejemplo, un DELETE que devuelve 204)
  if (status === 204) return { exito: true, status };

  // 4. El backend devolvió algo que no es JSON (un error HTML, por ejemplo)
  let data;
  try {
    data = await response.json();
  } catch {
    if (status === 401 && token) window.dispatchEvent(new Event("sesion-expirada"));
    return { exito: false, status, mensaje: `Error del servidor (${status}).` };
  }

  // 5. Token vencido o inválido (el backend usa 401 sin token y 403 con token malo):
  //    avisamos al AuthProvider para que cierre la sesión
  const tokenInvalido = status === 401 || (status === 403 && /token/i.test(data?.mensaje || ""));
  if (token && tokenInvalido) window.dispatchEvent(new Event("sesion-expirada"));

  // 6. Si el backend no mandó "exito", lo deducimos del status HTTP
  if (data?.exito === undefined) {
    return { exito: response.ok, status, data, mensaje: data?.mensaje };
  }

  return { ...data, status };
}