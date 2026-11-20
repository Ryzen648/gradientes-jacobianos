// Lectura y validación de la entrada: funciones, variables y punto.
//
// Las funciones llegan como texto en la sintaxis de "código" (`x^2*y`); el
// editor visual se convierte antes a ese texto en `latex-a-codigo.js`, de modo
// que toda la validación pasa por un único sitio. La lectura de una función
// (alias, paréntesis, errores de sintaxis con sugerencias) está en lab-comun:
// `comun/js/entrada/analizar.js`. Aquí queda lo propio de esta calculadora:
// varias funciones, el orden de las variables y el punto.

import { math } from "../../comun/js/mathjs.js";
import { ErrorCalculo } from "./errores.js";
import { analizarFuncion, normalizar, numeroFinito, variablesDe } from "../../comun/js/entrada/analizar.js";

export { analizarFuncion, normalizar, numeroFinito, variablesDe };

// --- Variables ---------------------------------------------------------------

/** Variables de todas las funciones, en orden alfabético (x1 < x2 < x10). */
export function detectarVariables(nodos) {
  const nombres = new Set();
  for (const nodo of nodos) for (const v of variablesDe(nodo)) nombres.add(v);
  return [...nombres].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}

/**
 * Orden final de las variables. Sin `ordenTexto` es el alfabético; con él
 * ("p, t, f") debe nombrar exactamente las variables detectadas.
 */
export function resolverOrden(detectadas, ordenTexto = "") {
  const pedido = ordenTexto.split(",").map((t) => t.trim()).filter((t) => t !== "");
  if (!pedido.length) return detectadas;
  const esPermutacion = pedido.length === detectadas.length
    && new Set(pedido).size === pedido.length
    && pedido.every((v) => detectadas.includes(v));
  if (!esPermutacion) throw new ErrorCalculo("ordenInvalido", { esperadas: detectadas.join(", ") });
  return pedido;
}

// --- Punto -------------------------------------------------------------------

/** { x: "2", y: "pi/6" } -> [2, 0.5235…], en el orden de `vars`. */
export function leerValores(vars, valores) {
  return vars.map((variable) => {
    const texto = String(valores[variable] ?? "").trim();
    if (texto === "") throw new ErrorCalculo("valorFalta", { variable });
    let valor;
    try {
      valor = math.evaluate(normalizar(texto));
    } catch {
      throw new ErrorCalculo("valorInvalido", { variable, texto });
    }
    if (typeof valor !== "number") throw new ErrorCalculo("valorNoFinito", { variable });
    return numeroFinito(valor, "valorNoFinito", { variable });
  });
}

// --- Entrada completa --------------------------------------------------------

/**
 * Entrada en texto ({ funciones[], valores{}, orden }) -> { vars, nodos, x0 }.
 * Lanza el primer error que encuentra.
 */
export function leerEntrada({ funciones, valores = {}, orden = "" }) {
  if (!funciones.length || funciones.every((f) => f.trim() === "")) throw new ErrorCalculo("sinFunciones");
  const nodos = funciones.map((texto, k) => analizarFuncion(texto, k + 1));
  const vars = resolverOrden(detectarVariables(nodos), orden);
  if (!vars.length) throw new ErrorCalculo("sinVariables");
  const x0 = leerValores(vars, valores);
  return { vars, nodos, x0 };
}

/**
 * Versión tolerante para la interfaz en vivo: nunca lanza. Devuelve, por cada
 * función, su árbol o su error, y las variables detectadas hasta el momento.
 */
export function analizarEntrada({ funciones, orden = "" }) {
  const filas = funciones.map((texto, k) => {
    if (texto.trim() === "") return { vacia: true };
    try {
      return { nodo: analizarFuncion(texto, k + 1) };
    } catch (error) {
      return { error };
    }
  });
  const detectadas = detectarVariables(filas.filter((f) => f.nodo).map((f) => f.nodo));
  let variables = detectadas;
  let errorOrden = null;
  try {
    variables = resolverOrden(detectadas, orden);
  } catch (error) {
    errorOrden = error;
  }
  return { filas, variables, errorOrden };
}
