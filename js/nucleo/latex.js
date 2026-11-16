// Generación de LaTeX a partir de un resultado. No toca el DOM: solo
// devuelve cadenas, así se puede probar sin navegador.

/** Número legible: 6 cifras significativas, notación científica en los extremos. */
export function numeroTex(v) {
  if (!Number.isFinite(v)) return `\\text{${String(v)}}`;
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 1e6 || a < 1e-4) {
    const [mantisa, exponente] = v.toExponential(3).split("e");
    return `${mantisa}\\times 10^{${Number(exponente)}}`;
  }
  return String(Number(v.toPrecision(6)));
}

export function matrizTex(filas, celda) {
  const cuerpo = filas.map((fila) => fila.map(celda).join(" & ")).join(" \\\\[4pt] ");
  return `\\begin{pmatrix}${cuerpo}\\end{pmatrix}`;
}

/**
 * Nombre de variable en LaTeX. Va siempre entre llaves: math.js pega el
 * nombre justo después de `\cdot`, y sin llaves `\cdot` + `y` se leería como
 * el comando inexistente `\cdoty`.
 */
export function variableTex(nombre) {
  return nombre.length === 1
    ? `{${nombre}}`
    : `{\\mathit{${nombre.replace(/_/g, "\\_")}}}`;
}

/** Árbol de math.js -> LaTeX, con las variables del usuario en cursiva. */
export function nodoTex(nodo, vars) {
  return nodo.toTex({
    parenthesis: "auto",
    handler: (n) => (n.isSymbolNode && vars.includes(n.name) ? variableTex(n.name) : undefined),
  });
}

/** Todas las fórmulas que muestra la interfaz para un resultado de `calcular`. */
export function resultadoTex(r) {
  const nombre = r.esGradiente ? "\\nabla f" : "J_F";
  const nombreNum = r.esGradiente ? "\\nabla f_{\\text{num}}" : "J_{F,\\,\\text{num}}";
  const args = `(${r.vars.map(variableTex).join(", ")})`;
  const punto = `(${r.x0.map(numeroTex).join(",\\ ")})`;
  const tex = (nodo) => nodoTex(nodo, r.vars);

  const definicion = r.esGradiente
    ? `f${args} = ${tex(r.nodos[0])}`
    : `F${args} = ${matrizTex(r.nodos.map((n) => [n]), tex)}`;

  let extra = null;
  if (r.extra?.tipo === "norma") extra = `\\lVert \\nabla f \\rVert = ${numeroTex(r.extra.valor)}`;
  if (r.extra?.tipo === "determinante") extra = `\\det J_F = ${numeroTex(r.extra.valor)}`;

  return {
    // `gathered` apila las dos líneas; un `\\` suelto no hace nada en modo bloque.
    simbolico: `\\begin{gathered}${definicion} \\\\[12pt] ${nombre}${args} = ${matrizTex(r.Jsim, tex)}\\end{gathered}`,
    valor: `${nombre}${punto} = ${matrizTex(r.Jval, numeroTex)}`,
    extra,
    numerico: `${nombreNum}${punto} = ${matrizTex(r.Jnum, numeroTex)}`,
  };
}

export const FORMULA_DIFERENCIA_CENTRADA = "\\dfrac{f(x + h\\,e_j) - f(x - h\\,e_j)}{2h}";
