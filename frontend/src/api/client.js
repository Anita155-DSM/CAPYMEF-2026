const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Hace una petición al backend y SIEMPRE devuelve { exito, mensaje, data }.
 * Ejemplos:
 *   api("/noticias/publicas")
 *   api("/auth/login", { method: "POST", body: { email, password } })
 *   api("/noticias/admin", { method: "POST", body: formData })   // FormData también
 */
export async function api(ruta, { method = "GET", body, headers = {} } = {}) {
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
    return { exito: false, mensaje: "No se pudo conectar con el servidor." };
  }

  // 2. Token vencido o inválido: avisamos al AuthProvider (paso 4) para cerrar sesión
  if (response.status === 401 && token) {
    window.dispatchEvent(new Event("sesion-expirada"));
  }

  // 3. Respuesta sin contenido (por ejemplo, un DELETE que devuelve 204)
  if (response.status === 204) return { exito: true };

  // 4. El backend devolvió algo que no es JSON (un error HTML, por ejemplo)
  let data;
  try {
    data = await response.json();
  } catch {
    return { exito: false, mensaje: `Error del servidor (${response.status}).` };
  }

  // 5. Si el backend no mandó "exito", lo deducimos del status HTTP
  if (data?.exito === undefined) {
    return { exito: response.ok, data, mensaje: data?.mensaje };
  }

  return data;
}