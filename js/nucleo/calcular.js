// Orquesta un cálculo completo: leer, derivar, evaluar y verificar.

import { math } from "../../comun/js/mathjs.js";
import { leerEntrada } from "./entrada.js";
import { jacobianoSimbolico, evaluarJacobiano } from "./derivacion.js";
import { jacobianoNumerico, errorRelativo, diferenciaMaxima, TOLERANCIA } from "./numerico.js";
import { diagnosticarPunto } from "./diagnostico.js";

const SIN_VALOR_FINITO = new Set(["derivadaNoFinita", "funcionNoFinita"]);

/**
 * @param {{funciones: string[], valores: Object<string,string>, orden?: string}} entrada
 * @returns resultado con el jacobiano simbólico (Jsim), su valor en el punto
 *   (Jval), la aproximación numérica (Jnum) y el error entre ambos. Con una
 *   sola función el "jacobiano" 1×n es el gradiente.
 * @throws {ErrorCalculo}
 */
export function calcular(entrada) {
  const { vars, nodos, x0 } = leerEntrada(entrada);
  const Jsim = jacobianoSimbolico(nodos, vars);

  let Jval;
  let Jnum;
  try {
    Jval = evaluarJacobiano(Jsim, vars, x0);
    Jnum = jacobianoNumerico(nodos, vars, x0);
  } catch (err) {
    // Si algo no es finito en el punto, se intenta decir exactamente por qué.
    if (err.name === "ErrorCalculo" && SIN_VALOR_FINITO.has(err.codigo)) {
      throw diagnosticarPunto(nodos, vars, x0) ?? err;
    }
    throw err;
  }
  const error = errorRelativo(Jval, Jnum);

  const esGradiente = nodos.length === 1;
  let extra = null;
  if (esGradiente) {
    extra = { tipo: "norma", valor: Math.hypot(...Jval[0]) };
  } else if (nodos.length === vars.length) {
    // Un jacobiano singular da por redondeo algo como -3e-18: se muestra como 0.
    // El umbral es relativo al tamaño de las entradas (det escala como |J|^n).
    const det = math.det(Jval);
    const escala = Math.max(1, ...Jval.flat().map(Math.abs)) ** vars.length;
    extra = { tipo: "determinante", valor: Math.abs(det) < 1e-12 * escala ? 0 : det };
  }

  return {
    vars, nodos, x0, Jsim, Jval, Jnum,
    diferencia: diferenciaMaxima(Jval, Jnum), error, coincide: error < TOLERANCIA,
    esGradiente, extra,
  };
}
