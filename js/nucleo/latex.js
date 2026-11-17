// Generación de LaTeX y de texto copiable a partir de un resultado. No toca
// el DOM: solo devuelve cadenas, así se puede probar sin navegador.

import { expresionTex, nombreTex } from "./impresion.js";
import { H, TOLERANCIA } from "./numerico.js";

export { expresionTex as nodoTex, nombreTex as variableTex };

export const PRECISIONES = Object.freeze([4, 6, 10]);
export const PRECISION_INICIAL = 6;

/**
 * Número con `decimales` decimales como máximo, sin ceros de relleno.
 * Pasa a notación científica cuando el número es muy grande o cuando, con esos
 * decimales, quedarían menos de tres cifras significativas (0.00012 con 4
 * decimales se vería como 0.0001).
 */
export function numeroTex(v, decimales = PRECISION_INICIAL) {
  if (!Number.isFinite(v)) return `\\text{${String(v)}}`;
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 1e6 || a < 10 ** -(decimales - 2)) {
    const [mantisa, exponente] = v.toExponential(decimales).split("e");
    return `${Number(mantisa)}\\times 10^{${Number(exponente)}}`;
  }
  return String(Number(v.toFixed(decimales)));
}

/** Notación científica corta para errores: 5.72e-11 -> 5.72 × 10⁻¹¹. */
export function errorTex(v) {
  if (v === 0) return "0";
  const [mantisa, exponente] = v.toExponential(2).split("e");
  return `${mantisa}\\times 10^{${Number(exponente)}}`;
}

const ESPACIO_ENTRE_FILAS = "[4pt]";

export function matrizTex(filas, celda) {
  const cuerpo = filas.map((fila) => fila.map(celda).join(" & ")).join(` \\\\${ESPACIO_ENTRE_FILAS} `);
  return `\\begin{pmatrix}${cuerpo}\\end{pmatrix}`;
}

/** Vista previa de lo que se va a derivar: f(x, y) = … o F(x, y) = (…). */
export function definicionTex(nodos, vars) {
  const args = `(${vars.map(nombreTex).join(", ")})`;
  return nodos.length === 1
    ? `f${args} = ${expresionTex(nodos[0])}`
    : `F${args} = ${matrizTex(nodos.map((n) => [n]), expresionTex)}`;
}

/**
 * Valores numéricos como texto para pegar en código (Python, NumPy, MATLAB…):
 * `[a, b]` para un gradiente y `[[a, b], [c, d]]` para un jacobiano.
 * Usa toda la precisión disponible, no la que se muestra en pantalla.
 */
export function valoresTexto(matriz, esGradiente) {
  const numero = (v) => String(Number(v.toPrecision(15)));
  const fila = (f) => `[${f.map(numero).join(", ")}]`;
  return esGradiente ? fila(matriz[0]) : `[${matriz.map(fila).join(", ")}]`;
}

/**
 * Todas las fórmulas que muestra la interfaz para un resultado de `calcular`.
 * `copia` lleva el LaTeX limpio (una sola ecuación) y los valores en texto
 * para los botones de copiar.
 */
export function resultadoTex(r, { decimales = PRECISION_INICIAL } = {}) {
  const nombre = r.esGradiente ? "\\nabla f" : "J_F";
  const nombreNum = r.esGradiente ? "\\nabla f_{\\text{num}}" : "J_{F,\\,\\text{num}}";
  const args = `(${r.vars.map(nombreTex).join(", ")})`;
  const numero = (v) => numeroTex(v, decimales);
  const punto = `(${r.x0.map(numero).join(",\\ ")})`;

  const simbolico = `${nombre}${args} = ${matrizTex(r.Jsim, expresionTex)}`;
  const valor = `${nombre}${punto} = ${matrizTex(r.Jval, numero)}`;
  const numerico = `${nombreNum}${punto} = ${matrizTex(r.Jnum, numero)}`;

  let extra = null;
  if (r.extra?.tipo === "norma") extra = `\\lVert \\nabla f \\rVert = ${numero(r.extra.valor)}`;
  if (r.extra?.tipo === "determinante") extra = `\\det J_F = ${numero(r.extra.valor)}`;

  return {
    // `gathered` apila las dos líneas; un `\\` suelto no hace nada en modo bloque.
    simbolico: `\\begin{gathered}${definicionTex(r.nodos, r.vars)} \\\\[12pt] ${simbolico}\\end{gathered}`,
    valor,
    extra,
    numerico,
    // ‖J − J_num‖: la mayor diferencia entre una entrada y su aproximación.
    diferencia: `\\lVert ${nombre} - ${nombreNum} \\rVert_{\\max} = ${errorTex(r.diferencia)}`,
    copia: {
      // Para pegar en un documento: sin el espaciado entre filas que solo hace falta en pantalla.
      simbolico: simbolico.replaceAll(ESPACIO_ENTRE_FILAS, ""),
      valor: valor.replaceAll(ESPACIO_ENTRE_FILAS, ""),
      valores: valoresTexto(r.Jval, r.esGradiente),
      numericos: valoresTexto(r.Jnum, r.esGradiente),
    },
  };
}

export const FORMULA_DIFERENCIA_CENTRADA = "\\dfrac{f(x + h\\,e_j) - f(x - h\\,e_j)}{2h}";

/** Criterio de la verificación, para explicarlo junto al resultado. */
export const CRITERIO_TEX =
  "\\dfrac{\\lVert J - J_{\\text{num}} \\rVert_{\\max}}{\\max\\left(1,\\ \\lVert J \\rVert_{\\max},\\ \\lVert J_{\\text{num}} \\rVert_{\\max}\\right)} < "
  + `10^{${Math.round(Math.log10(TOLERANCIA))}}`;

export const PASO_TEX = `h = 10^{${Math.round(Math.log10(H))}}`;
