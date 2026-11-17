// Verificación numérica con diferencias finitas centradas.
//
//   df_i/dx_j ≈ (f_i(x + h e_j) - f_i(x - h e_j)) / (2h)
//
// El error de truncamiento es O(h²) y el de redondeo O(ε/h); en doble
// precisión h ≈ 1e-6 queda cerca del óptimo.

import { numeroFinito } from "./entrada.js";
import { ambito } from "./derivacion.js";

export const H = 1e-6;
export const TOLERANCIA = 1e-6;

export function jacobianoNumerico(nodos, vars, x0, h = H) {
  return nodos.map((nodo, i) => {
    const f = nodo.compile();
    const evaluar = (x) => numeroFinito(f.evaluate(ambito(vars, x)), "funcionNoFinita", { indice: i + 1 });
    return vars.map((_, j) => {
      const mas = x0.slice();
      const menos = x0.slice();
      mas[j] += h;
      menos[j] -= h;
      return (evaluar(mas) - evaluar(menos)) / (2 * h);
    });
  });
}

/**
 * max|a - b| / max(1, max|a|, max|b|): se comporta como error absoluto cerca
 * de cero y como relativo para valores grandes. Es la misma medida que usa
 * `gradcheck.py`.
 */
export function errorRelativo(A, B) {
  let escala = 1;
  A.forEach((fila, i) => fila.forEach((a, j) => {
    escala = Math.max(escala, Math.abs(a), Math.abs(B[i][j]));
  }));
  return diferenciaMaxima(A, B) / escala;
}

/** ‖A − B‖_max: la mayor diferencia, en valor absoluto, entre dos entradas. */
export function diferenciaMaxima(A, B) {
  let diferencia = 0;
  A.forEach((fila, i) => fila.forEach((a, j) => {
    diferencia = Math.max(diferencia, Math.abs(a - B[i][j]));
  }));
  return diferencia;
}
