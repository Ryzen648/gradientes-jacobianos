// Explica POR QUÉ una función no se puede derivar o evaluar en un punto.
//
// Cuando la derivada o la función dan un valor no finito, se recorre el árbol
// evaluando cada subexpresión en el punto para encontrar la causa concreta:
// un valor absoluto con argumento 0, una raíz o un logaritmo fuera de su
// dominio, una división entre cero, etc.

import { ErrorCalculo } from "./errores.js";
import { ambito } from "./derivacion.js";

const CERO = 1e-12;

/** Valor numérico real de un subárbol en el punto, o `null` si no lo tiene. */
function valorDe(nodo, s) {
  try {
    const v = nodo.evaluate(s);
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

/** Texto de un subárbol sin los paréntesis que lo envuelven. */
function textoDe(nodo) {
  let n = nodo;
  while (n.isParenthesisNode) n = n.content;
  return n.toString();
}

function revisarFuncion(n, s, indice) {
  const nombre = n.fn.name;
  const arg = n.args[0];
  const u = valorDe(arg, s);
  if (u === null) return null; // el problema está más adentro
  const expr = textoDe(arg);
  const cero = Math.abs(u) < CERO;

  if (nombre === "abs" && cero) return new ErrorCalculo("noDerivableAbs", { indice, expr });
  if (nombre === "sqrt") {
    if (u < 0 && !cero) return new ErrorCalculo("dominioRaiz", { indice, expr, valor: u });
    if (cero) return new ErrorCalculo("noDerivableRaiz", { indice, expr });
  }
  if (["log", "log10", "log2"].includes(nombre) && (u < 0 || cero)) {
    return new ErrorCalculo("dominioLogaritmo", { indice, expr, valor: u });
  }
  if (["asin", "acos"].includes(nombre) && Math.abs(u) >= 1 - CERO) {
    return new ErrorCalculo("dominioInversa", { indice, funcion: nombre, expr, valor: u });
  }
  return null;
}

function revisarOperador(n, s, indice) {
  if (n.fn === "divide") {
    const d = valorDe(n.args[1], s);
    if (d !== null && Math.abs(d) < CERO) {
      return new ErrorCalculo("divisionPorCero", { indice, expr: textoDe(n.args[1]) });
    }
  }
  if (n.fn === "pow") {
    const base = valorDe(n.args[0], s);
    const exponente = valorDe(n.args[1], s);
    if (base === null || exponente === null) return null;
    const expr = textoDe(n.args[0]);
    if (Math.abs(base) < CERO && exponente < 0) return new ErrorCalculo("divisionPorCero", { indice, expr });
    if (Math.abs(base) < CERO && exponente < 1) return new ErrorCalculo("potenciaNoDerivable", { indice, expr });
    if (base < 0 && !Number.isInteger(exponente)) return new ErrorCalculo("dominioPotencia", { indice, expr, valor: base });
  }
  return null;
}

/**
 * Busca la causa de un valor no finito. Devuelve un ErrorCalculo específico
 * o `null` si no reconoce el problema (entonces vale el error genérico).
 */
export function diagnosticarPunto(nodos, vars, x0) {
  const s = ambito(vars, x0);
  for (let k = 0; k < nodos.length; k++) {
    let hallado = null;
    nodos[k].traverse((n) => {
      if (hallado) return;
      if (n.isFunctionNode) hallado = revisarFuncion(n, s, k + 1);
      else if (n.isOperatorNode) hallado = revisarOperador(n, s, k + 1);
    });
    if (hallado) return hallado;
  }
  return null;
}
