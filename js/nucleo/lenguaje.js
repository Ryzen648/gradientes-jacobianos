// Vocabulario que entiende la calculadora: funciones, constantes y alias.

/** Funciones admitidas, con el nombre que usa math.js. Todas son derivables. */
export const FUNCIONES = Object.freeze([
  "sin", "cos", "tan", "sec", "csc", "cot",
  "asin", "acos", "atan", "asec", "acsc", "acot",
  "sinh", "cosh", "tanh", "sech", "csch", "coth",
  "asinh", "acosh", "atanh",
  "exp", "log", "log10",
  "sqrt", "cbrt", "nthRoot", "abs",
]);

/** Funciones que aceptan un segundo argumento. El resto recibe exactamente uno. */
export const MAX_ARGUMENTOS = Object.freeze({ nthRoot: 2 });

/** Otras formas de escribir una función (notación en español y `ln`). */
export const ALIAS_FUNCION = Object.freeze({
  ln: "log",
  sen: "sin", senh: "sinh", arcsen: "asin",
  tg: "tan", arctg: "atan", ctg: "cot", cosec: "csc",
  arcsin: "asin", arccos: "acos", arctan: "atan",
  raiz: "sqrt",
});

/** Constantes: se aceptan en las funciones y no pueden ser variables. */
export const CONSTANTES = Object.freeze(["pi", "e"]);

/** Función inversa, para leer `\sin^{-1}` como `asin`. */
export const INVERSAS = Object.freeze({
  sin: "asin", cos: "acos", tan: "atan", sec: "asec", csc: "acsc", cot: "acot",
  sinh: "asinh", cosh: "acosh", tanh: "atanh",
});

/** Comando LaTeX -> nombre de variable. */
export const GRIEGAS = Object.freeze({
  alpha: "alpha", beta: "beta", gamma: "gamma", delta: "delta",
  epsilon: "epsilon", varepsilon: "epsilon", zeta: "zeta", eta: "eta",
  theta: "theta", vartheta: "theta", iota: "iota", kappa: "kappa",
  lambda: "lambda", mu: "mu", nu: "nu", xi: "xi", rho: "rho", varrho: "rho",
  sigma: "sigma", tau: "tau", upsilon: "upsilon", phi: "phi", varphi: "phi",
  chi: "chi", psi: "psi", omega: "omega",
});

const NOMBRES_GRIEGOS = new Set(Object.values(GRIEGAS));

export function esGriega(nombre) {
  return NOMBRES_GRIEGOS.has(nombre);
}

/** Nombre canónico de una función o `null` si no existe. */
export function resolverFuncion(nombre) {
  if (FUNCIONES.includes(nombre)) return nombre;
  return ALIAS_FUNCION[nombre] ?? null;
}

/** Distancia de edición entre dos palabras cortas (Levenshtein). */
function distancia(a, b) {
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const arriba = fila[j];
      fila[j] = Math.min(arriba + 1, fila[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = arriba;
    }
  }
  return fila[b.length];
}

/** Función admitida más parecida a `nombre` (para "¿quisiste decir…?") o `null`. */
export function sugerirFuncion(nombre) {
  const minusculas = nombre.toLowerCase();
  const candidatas = [...FUNCIONES, ...Object.keys(ALIAS_FUNCION)];
  if (candidatas.includes(minusculas)) return minusculas; // p. ej. "Sin" -> "sin"
  let mejor = null;
  let mejorDistancia = Infinity;
  for (const candidata of candidatas) {
    const d = distancia(minusculas, candidata);
    if (d < mejorDistancia) { mejor = candidata; mejorDistancia = d; }
  }
  // Solo se sugiere si el parecido es claro: una errata en palabras cortas, dos en largas.
  return mejorDistancia <= (minusculas.length <= 4 ? 1 : 2) ? mejor : null;
}
