import net from 'node:net';

// ==========================================
// URLs externas que el SERVIDOR descarga (logos externos de los certificados)
// ==========================================
// Por qué existe: al generar un certificado, el servidor descarga los logos externos que cargó el admin. Si se
// aceptara cualquier URL, alguien con acceso de admin (o un dato mal cargado) podría hacer que el servidor pida
// direcciones internas: la red privada del hosting, la base de datos, o el servicio de metadatos de la nube
// (169.254.169.254), que entrega credenciales. Eso se llama SSRF. Estas funciones son puras (sin red) para
// reutilizarlas en el validador del evento y en la descarga del certificado.

// Como máximo 5 logos por evento: ni el modelo ni el frontend ponían un límite, y en el pie del certificado no
// entran muchos más. Cada uno es una descarga al generar el PDF.
export const MAXIMO_LOGOS_EXTERNOS = 5;
// La columna logosExternos es un ARRAY de VARCHAR(255): una URL más larga no se podría guardar.
export const LARGO_MAXIMO_URL_LOGO = 255;

// Nombres que siempre apuntan a la propia máquina.
const ES_LOCALHOST = (host) => host === 'localhost' || host.endsWith('.localhost');

// Devuelve null si la URL de un logo es aceptable, o el motivo (para mostrarle al admin) si no lo es.
// Reglas: https (no http), sin usuario ni contraseña, puerto 443, largo máximo, y un dominio público (ni una IP
// escrita a mano, ni localhost, ni un nombre interno sin punto como "intranet").
export const motivoUrlDeLogoInvalida = (url) => {
  if (typeof url !== 'string' || url.trim() === '') return 'no es un link válido';
  if (url.length > LARGO_MAXIMO_URL_LOGO) return `supera los ${LARGO_MAXIMO_URL_LOGO} caracteres`;

  let destino;
  try {
    destino = new URL(url);
  } catch {
    return 'no es un link válido';
  }

  if (destino.protocol !== 'https:') return 'tiene que empezar con https://';
  if (destino.username || destino.password) return 'no puede incluir usuario ni contraseña';
  // URL ya convierte ":443" en puerto vacío (el de https por defecto); cualquier otro número se rechaza.
  if (destino.port !== '') return 'no puede usar un puerto distinto del 443';

  // URL normaliza los IP escritos de formas raras ("2130706433" o "0x7f.1" quedan como "127.0.0.1"), así que
  // acá se detectan igual. Los IPv6 vienen entre corchetes y se sacan para revisarlos.
  const host = destino.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
  if (net.isIP(host)) return 'tiene que ser un dominio público, no una dirección IP';
  if (ES_LOCALHOST(host)) return 'tiene que ser un dominio público, no localhost';
  if (!host.includes('.')) return 'tiene que ser un dominio público';

  return null;
};

// Rangos que no son internet pública: privados, loopback, link-local, multicast, reservados y de documentación.
const NO_PUBLICAS = new net.BlockList();
for (const [red, prefijo] of [
  ['0.0.0.0', 8],        // "esta red" (incluye 0.0.0.0)
  ['10.0.0.0', 8],       // privada
  ['100.64.0.0', 10],    // NAT de operadores (CGNAT)
  ['127.0.0.0', 8],      // loopback (la propia máquina)
  ['169.254.0.0', 16],   // link-local (incluye el servicio de metadatos de la nube, 169.254.169.254)
  ['172.16.0.0', 12],    // privada
  ['192.0.0.0', 24],     // reservada (IETF)
  ['192.0.2.0', 24],     // documentación
  ['192.88.99.0', 24],   // reservada (relay 6to4)
  ['192.168.0.0', 16],   // privada
  ['198.18.0.0', 15],    // pruebas de rendimiento
  ['198.51.100.0', 24],  // documentación
  ['203.0.113.0', 24],   // documentación
  ['224.0.0.0', 4],      // multicast
  ['240.0.0.0', 4],      // reservada (incluye 255.255.255.255)
]) NO_PUBLICAS.addSubnet(red, prefijo, 'ipv4');
for (const [red, prefijo] of [
  ['::', 96],            // no especificada (::), loopback (::1) e IPv4 "compatible" (en desuso)
  ['64:ff9b::', 96],     // traducción NAT64 (puede esconder una IPv4 privada)
  ['100::', 64],         // descarte
  ['2001:db8::', 32],    // documentación
  ['fc00::', 7],         // privadas (únicas locales)
  ['fe80::', 10],        // link-local
  ['fec0::', 10],        // site-local (en desuso)
  ['ff00::', 8],         // multicast
]) NO_PUBLICAS.addSubnet(red, prefijo, 'ipv6');

// IPv4 mapeado en IPv6 (::ffff:127.0.0.1 es la propia máquina escrita en IPv6): se rechaza entero, ningún DNS
// público responde así. Va en una lista APARTE porque BlockList compara también las IPv4 comunes contra esta
// regla (las trata como mapeadas): en la lista principal bloquearía todas las IPv4, incluidas las públicas.
const IPV4_MAPEADAS = new net.BlockList();
IPV4_MAPEADAS.addSubnet('::ffff:0:0', 96, 'ipv6');

// ¿La dirección es de internet pública? false también para lo que no es una IP válida.
export const esIpPublica = (direccion) => {
  if (typeof direccion !== 'string') return false;
  const ip = direccion.split('%')[0]; // sin la zona de un IPv6 link-local (fe80::1%eth0)
  const familia = net.isIP(ip);
  if (!familia) return false;
  if (familia === 6 && IPV4_MAPEADAS.check(ip, 'ipv6')) return false;
  return !NO_PUBLICAS.check(ip, familia === 4 ? 'ipv4' : 'ipv6');
};

// Arma una función "lookup" (la que usan http/https para resolver el nombre al conectarse) que solo deja
// conectar si TODAS las direcciones que devuelve el DNS son públicas. Al usarla en la conexión misma, la
// verificación y la descarga usan la misma resolución: nadie puede cambiar la respuesta del DNS entre que se
// verifica y se descarga (DNS rebinding). lookupFn es dns.lookup (o uno falso en los tests).
export const crearLookupSeguro = (lookupFn) => (hostname, opciones, callback) => {
  const cb = typeof opciones === 'function' ? opciones : callback;
  const opcionesDns = typeof opciones === 'function' ? {} : opciones || {};
  lookupFn(hostname, { ...opcionesDns, all: true }, (error, direcciones) => {
    if (error) return cb(error);
    const lista = Array.isArray(direcciones) ? direcciones : [];
    if (lista.length === 0 || !lista.every(({ address }) => esIpPublica(address))) {
      const rechazo = new Error('El host resuelve a una dirección que no es pública.');
      rechazo.code = 'EDIRECCIONNOPUBLICA';
      return cb(rechazo);
    }
    if (opcionesDns.all) return cb(null, lista);
    return cb(null, lista[0].address, lista[0].family);
  });
};
