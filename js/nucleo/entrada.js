// Lectura y validación de la entrada: variables, funciones y punto.

import { math } from "../lib/mathjs.js";
import { ErrorCalculo } from "./errores.js";

// Nombres que math.js trata como constantes y que no pueden ser variables.
export const RESERVADAS = Object.freeze(["pi", "e", "i"]);
// Constantes que sí se aceptan dentro de una función.
const CONSTANTES = ["pi", "e"];

const NOMBRE_VALIDO = /^[A-Za-z_][A-Za-z0-9_]*$/;

function separarLista(texto) {
  return texto.split(",").map((t) => t.trim()).filter((t) => t !== "");
}

/** Devuelve el número si es real y finito; si no, lanza el error indicado. */
export function numeroFinito(valor, codigo, datos) {
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    throw new ErrorCalculo(codigo, datos);
  }
  return valor;
}

/** "x, y" -> ["x", "y"] */
export function leerVariables(texto) {
  const vars = separarLista(texto);
  if (!vars.length) throw new ErrorCalculo("sinVariables");
  for (const nombre of vars) {
    if (!NOMBRE_VALIDO.test(nombre)) throw new ErrorCalculo("variableInvalida", { nombre });
    if (RESERVADAS.includes(nombre)) throw new ErrorCalculo("variableReservada", { nombre });
  }
  if (new Set(vars).size !== vars.length) throw new ErrorCalculo("variablesRepetidas");
  return vars;
}

/** Lista de expresiones en texto -> árboles de math.js, ya validados. */
export function leerFunciones(textos, vars) {
  const lineas = textos.map((l) => l.trim()).filter((l) => l !== "");
  if (!lineas.length) throw new ErrorCalculo("sinFunciones");

  return lineas.map((texto, k) => {
    const indice = k + 1;
    let nodo;
    try {
      nodo = math.parse(texto);
    } catch (err) {
      throw new ErrorCalculo("sintaxisFuncion", { indice, texto, detalle: err.message });
    }
    nodo.traverse((n, ruta) => {
      // `ruta === "fn"` es el nombre de una función (sin, exp...), no una variable.
      if (n.isSymbolNode && ruta !== "fn" && !vars.includes(n.name) && !CONSTANTES.includes(n.name)) {
        throw new ErrorCalculo("simboloDesconocido", { indice, nombre: n.name });
      }
    });
    return nodo;
  });
}

/** "2, pi/6" -> [2, 0.5235...]; un valor por variable. */
export function leerPunto(texto, vars) {
  const partes = separarLista(texto);
  if (partes.length !== vars.length) {
    throw new ErrorCalculo("puntoLongitud", { valores: partes.length, variables: vars.length });
  }
  return partes.map((parte, j) => {
    let valor;
    try {
      valor = math.evaluate(parte);
    } catch {
      throw new ErrorCalculo("puntoInvalido", { texto: parte });
    }
    return numeroFinito(valor, "valorNoFinito", { variable: vars[j] });
  });
}

/**
 * Entrada en texto ({ variables, funciones[], punto }) ->
 * { vars, nodos, x0 } listo para calcular.
 */
export function leerEntrada({ variables, funciones, punto }) {
  const vars = leerVariables(variables);
  const nodos = leerFunciones(funciones, vars);
  const x0 = leerPunto(punto, vars);
  return { vars, nodos, x0 };
}
