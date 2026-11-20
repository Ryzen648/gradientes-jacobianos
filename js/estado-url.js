// Estado compartible por URL, en el fragmento (#), legible a simple vista:
//   index.html#f=x^2*y+%2B+sin(x*y)&v.x=1.3&v.y=-0.7
//   index.html#f=y&f=-sin(x)&v.x=0&v.y=0&orden=x,y&d=10
//   index.html#ejemplo=polares
//
//   f        una función por aparición, en el orden de las filas
//   v.<var>  valor de cada variable en el punto
//   orden    orden de las variables (opcional)
//   d        decimales del resultado (4, 6 o 10; opcional)
//   ejemplo  un ejemplo de la biblioteca por su id
//
// Se usa el fragmento y no la consulta (?): no se envía al servidor, cambiarlo
// no recarga la página y no choca con ?lang=en. El modo (visual o código) no
// se guarda: es una preferencia de quien abre el enlace, no del cálculo.
//
// Compatibilidad: los enlaces que ya circulan no llevan fragmento, y entonces
// la calculadora arranca como siempre (con el ejemplo inicial). Un fragmento
// que no se entiende se ignora igual: nunca deja la página rota.

const MAX_FUNCIONES = 12;
const MAX_TEXTO = 400;
const NOMBRE_VARIABLE = /^[A-Za-z][A-Za-z0-9_]*$/;

const recortar = (texto) => String(texto).slice(0, MAX_TEXTO);

/**
 * "#f=…&v.x=…" -> { ejemplo } | { funciones, valores, orden?, precision? } | null.
 * null: no hay fragmento o no trae nada útil (se arranca como siempre).
 */
export function leerFragmento(fragmento) {
  const texto = String(fragmento ?? "").replace(/^#/, "");
  if (!texto) return null;
  let pares;
  try {
    pares = new URLSearchParams(texto);
  } catch {
    return null;
  }
  const ejemplo = pares.get("ejemplo");
  if (ejemplo) return { ejemplo: recortar(ejemplo) };
  const funciones = pares.getAll("f").slice(0, MAX_FUNCIONES).map(recortar);
  if (!funciones.some((f) => f.trim() !== "")) return null;
  const valores = {};
  for (const [clave, valor] of pares) {
    if (!clave.startsWith("v.")) continue;
    const variable = clave.slice(2);
    if (NOMBRE_VARIABLE.test(variable)) valores[variable] = recortar(valor);
  }
  const estado = { funciones, valores };
  if (pares.has("orden")) estado.orden = recortar(pares.get("orden"));
  if (pares.has("d")) estado.precision = Number(pares.get("d")); // el estado descarta lo que no sea 4, 6 o 10
  return estado;
}

/** Inversa de leerFragmento. Omite el orden vacío; los valores vacíos también. */
export function escribirFragmento({ funciones, valores = {}, orden = "", precision }) {
  const pares = new URLSearchParams();
  for (const f of funciones) pares.append("f", f);
  for (const [variable, valor] of Object.entries(valores)) {
    if (String(valor).trim() !== "") pares.append(`v.${variable}`, valor);
  }
  if (orden.trim() !== "") pares.set("orden", orden);
  if (precision !== undefined) pares.set("d", String(precision));
  return `#${pares.toString()}`;
}
