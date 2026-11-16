// Jacobiano simbólico y su evaluación en un punto.

import { math } from "../lib/mathjs.js";
import { ErrorCalculo } from "./errores.js";
import { numeroFinito } from "./entrada.js";

/** { x: 1, y: 2 } a partir de ["x", "y"] y [1, 2]. */
export function ambito(vars, x) {
  const s = {};
  vars.forEach((v, j) => { s[v] = x[j]; });
  return s;
}

/** Matriz m×n de árboles: J[i][j] = d nodos[i] / d vars[j], simplificada. */
export function jacobianoSimbolico(nodos, vars) {
  return nodos.map((nodo, i) => vars.map((v) => {
    try {
      return math.simplify(math.derivative(nodo, v));
    } catch (err) {
      throw new ErrorCalculo("noDerivable", { indice: i + 1, detalle: err.message });
    }
  }));
}

/** Evalúa el jacobiano simbólico en x0 y devuelve una matriz de números. */
export function evaluarJacobiano(Jsim, vars, x0) {
  const s = ambito(vars, x0);
  return Jsim.map((fila, i) => fila.map((nodo, j) =>
    numeroFinito(nodo.evaluate(s), "derivadaNoFinita", { indice: i + 1, variable: vars[j] })));
}
