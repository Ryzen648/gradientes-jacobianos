// Jacobiano simbólico y su evaluación en un punto.

import { math } from "../../comun/js/mathjs.js";
import { ErrorCalculo } from "./errores.js";
import { numeroFinito } from "./entrada.js";

/** { x: 1, y: 2 } a partir de ["x", "y"] y [1, 2]. */
export function ambito(vars, x) {
  const s = {};
  vars.forEach((v, j) => { s[v] = x[j]; });
  return s;
}

/** ¿Escribió el usuario algún decimal (0.5, 1.2…) en la función? */
function usaDecimales(nodo) {
  let hay = false;
  nodo.traverse((n) => {
    if (n.isConstantNode && typeof n.value === "number" && !Number.isInteger(n.value)) hay = true;
  });
  return hay;
}

/** Matriz m×n de árboles: J[i][j] = d nodos[i] / d vars[j], simplificada. */
export function jacobianoSimbolico(nodos, vars) {
  return nodos.map((nodo, i) => {
    // math.js convierte por defecto 0.5 en 1/2 al simplificar. Si la función
    // se escribió con decimales, el resultado se deja también en decimales.
    const opciones = { exactFractions: !usaDecimales(nodo) };
    return vars.map((v) => {
    try {
      return math.simplify(math.derivative(nodo, v), {}, opciones);
    } catch {
      // No debería ocurrir: `entrada.js` solo deja pasar funciones derivables.
      throw new ErrorCalculo("noDerivable", { indice: i + 1 });
    }
    });
  });
}

/** Evalúa el jacobiano simbólico en x0 y devuelve una matriz de números. */
export function evaluarJacobiano(Jsim, vars, x0) {
  const s = ambito(vars, x0);
  return Jsim.map((fila, i) => fila.map((nodo, j) =>
    numeroFinito(nodo.evaluate(s), "derivadaNoFinita", { indice: i + 1, variable: vars[j] })));
}
