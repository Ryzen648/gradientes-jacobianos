// Orquesta un cálculo completo: leer, derivar, evaluar y verificar.

import { math } from "../lib/mathjs.js";
import { leerEntrada } from "./entrada.js";
import { jacobianoSimbolico, evaluarJacobiano } from "./derivacion.js";
import { jacobianoNumerico, errorRelativo, TOLERANCIA } from "./numerico.js";

/**
 * @param {{variables: string, funciones: string[], punto: string}} entrada
 * @returns resultado con el jacobiano simbólico (Jsim), su valor en el punto
 *   (Jval), la aproximación numérica (Jnum) y el error entre ambos. Con una
 *   sola función el "jacobiano" 1×n es el gradiente.
 * @throws {ErrorCalculo}
 */
export function calcular(entrada) {
  const { vars, nodos, x0 } = leerEntrada(entrada);

  const Jsim = jacobianoSimbolico(nodos, vars);
  const Jval = evaluarJacobiano(Jsim, vars, x0);
  const Jnum = jacobianoNumerico(nodos, vars, x0);
  const error = errorRelativo(Jval, Jnum);

  const esGradiente = nodos.length === 1;
  let extra = null;
  if (esGradiente) {
    extra = { tipo: "norma", valor: Math.hypot(...Jval[0]) };
  } else if (nodos.length === vars.length) {
    extra = { tipo: "determinante", valor: math.det(Jval) };
  }

  return { vars, nodos, x0, Jsim, Jval, Jnum, error, coincide: error < TOLERANCIA, esGradiente, extra };
}
