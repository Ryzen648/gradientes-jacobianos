import "./preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  numeroTex, errorTex, matrizTex, variableTex, resultadoTex, definicionTex, valoresTexto,
  PRECISIONES, PRECISION_INICIAL,
} from "../js/nucleo/latex.js";
import { analizarFuncion } from "../js/nucleo/entrada.js";
import { calcular } from "../js/nucleo/calcular.js";
import { EJEMPLOS } from "../js/ejemplos.js";

const ejemplo = (id) => EJEMPLOS.find((e) => e.id === id);

// --- Números -----------------------------------------------------------------------

test("numeroTex con la precisión por defecto (6 decimales)", () => {
  assert.equal(PRECISION_INICIAL, 6);
  assert.equal(numeroTex(0), "0");
  assert.equal(numeroTex(2), "2");
  assert.equal(numeroTex(-1), "-1");
  assert.equal(numeroTex(0.5), "0.5"); // sin ceros de relleno
  assert.equal(numeroTex(0.8660254037844387), "0.866025");
  assert.equal(numeroTex(1.7320508075688772), "1.732051");
  assert.equal(numeroTex(-2.2496219), "-2.249622");
  assert.equal(numeroTex(123456.789), "123456.789");
  assert.equal(numeroTex(Infinity), "\\text{Infinity}");
  assert.equal(numeroTex(NaN), "\\text{NaN}");
});

test("numeroTex respeta el número de decimales pedido", () => {
  const v = Math.PI / 6; // 0.5235987755982988
  assert.equal(numeroTex(v, 4), "0.5236");
  assert.equal(numeroTex(v, 6), "0.523599");
  assert.equal(numeroTex(v, 10), "0.5235987756");
  assert.equal(numeroTex(2, 10), "2");
  assert.deepEqual(PRECISIONES, [4, 6, 10]);
});

test("numeroTex pasa a notación científica cuando se perderían cifras", () => {
  assert.equal(numeroTex(1234567.89), "1.234568\\times 10^{6}");
  assert.equal(numeroTex(-0.0000123), "-1.23\\times 10^{-5}");
  // Con 4 decimales, 0.00123 se vería como 0.0012: mejor en científica.
  assert.equal(numeroTex(0.00123, 4), "1.23\\times 10^{-3}");
  assert.equal(numeroTex(0.00123, 6), "0.00123");
  assert.equal(numeroTex(0.0123, 4), "0.0123");
  assert.equal(numeroTex(3e-9, 10), "3\\times 10^{-9}");
});

test("errorTex", () => {
  assert.equal(errorTex(5.72e-11), "5.72\\times 10^{-11}");
  assert.equal(errorTex(0), "0");
});

// --- Piezas --------------------------------------------------------------------------

test("matrizTex", () => {
  assert.equal(
    matrizTex([[1, 2], [3, 4]], String),
    "\\begin{pmatrix}1 & 2 \\\\[4pt] 3 & 4\\end{pmatrix}",
  );
});

test("variableTex: letras, subíndices, griegas y nombres largos", () => {
  assert.equal(variableTex("x"), "x");
  assert.equal(variableTex("x1"), "x_{1}");
  assert.equal(variableTex("x12"), "x_{12}");
  assert.equal(variableTex("theta"), "\\theta");
  assert.equal(variableTex("phi2"), "\\phi_{2}");
  assert.equal(variableTex("peso"), "\\mathit{peso}");
  assert.equal(variableTex("peso_2"), "\\mathit{peso\\_2}");
});

test("definicionTex: f para una función, F en columna para varias", () => {
  const n = (t) => analizarFuncion(t);
  assert.equal(definicionTex([n("x*y")], ["x", "y"]), "f(x, y) = x y");
  assert.equal(
    definicionTex([n("x1"), n("theta")], ["theta", "x1"]),
    "F(\\theta, x_{1}) = \\begin{pmatrix}x_{1} \\\\[4pt] \\theta\\end{pmatrix}",
  );
});

test("valoresTexto: listas listas para pegar en código, con toda la precisión", () => {
  assert.equal(valoresTexto([[1, -2.5, 0]], true), "[1, -2.5, 0]");
  assert.equal(valoresTexto([[1, 2], [3, 4]], false), "[[1, 2], [3, 4]]");
  assert.equal(valoresTexto([[Math.sqrt(3) / 2]], true), "[0.866025403784439]");
  // Un jacobiano 1×1 de varias funciones no existe; uno m×1 sigue siendo una matriz.
  assert.equal(valoresTexto([[1], [2]], false), "[[1], [2]]");
  // Se puede leer de vuelta como JSON.
  assert.deepEqual(JSON.parse(valoresTexto([[0.1, 1e-7], [3, -4]], false)), [[0.1, 1e-7], [3, -4]]);
});

// --- Resultado completo ----------------------------------------------------------------

test("resultadoTex del gradiente", () => {
  const tex = resultadoTex(calcular(ejemplo("gradienteR2")));
  assert.equal(
    tex.simbolico,
    "\\begin{gathered}f(x, y) = x^{2} y + \\sin\\left(x y\\right) \\\\[12pt] "
    + "\\nabla f(x, y) = \\begin{pmatrix}y \\left(2 x + \\cos\\left(x y\\right)\\right) & x^{2} + x \\cos\\left(x y\\right)\\end{pmatrix}\\end{gathered}",
  );
  assert.equal(tex.valor, "\\nabla f(1.3,\\ -0.7) = \\begin{pmatrix}-2.249622 & 2.487869\\end{pmatrix}");
  assert.equal(tex.extra, "\\lVert \\nabla f \\rVert = 3.354146");
  assert.match(tex.numerico, /^\\nabla f_\{\\text\{num\}\}\(1\.3,\\ -0\.7\) = /);
  assert.match(tex.diferencia, /^\\lVert \\nabla f - \\nabla f_\{\\text\{num\}\} \\rVert_\{\\max\} = \d\.\d\d\\times 10\^\{-1\d\}$/);
});

test("resultadoTex del jacobiano", () => {
  const tex = resultadoTex(calcular(ejemplo("polares")));
  assert.match(tex.simbolico, /^\\begin\{gathered\}F\(r, t\) = \\begin\{pmatrix\}r \\cos\\left\(t\\right\)/);
  assert.match(tex.simbolico, /J_F\(r, t\) = .*\\end\{gathered\}$/);
  assert.equal(tex.valor, "J_F(2,\\ 0.523599) = \\begin{pmatrix}0.866025 & -1 \\\\[4pt] 0.5 & 1.732051\\end{pmatrix}");
  assert.equal(tex.extra, "\\det J_F = 2");
  // Regresión: `J_F_{num}` es un doble subíndice y KaTeX lo rechaza.
  assert.match(tex.numerico, /^J_\{F,\\,\\text\{num\}\}/);
  assert.match(tex.diferencia, /^\\lVert J_F - J_\{F,\\,\\text\{num\}\} \\rVert_\{\\max\} = /);
});

test("resultadoTex aplica la precisión a valores, punto y extra, no a la parte simbólica", () => {
  const r = calcular(ejemplo("polares"));
  const corto = resultadoTex(r, { decimales: 4 });
  const largo = resultadoTex(r, { decimales: 10 });
  assert.equal(corto.valor, "J_F(2,\\ 0.5236) = \\begin{pmatrix}0.866 & -1 \\\\[4pt] 0.5 & 1.7321\\end{pmatrix}");
  assert.equal(largo.valor, "J_F(2,\\ 0.5235987756) = \\begin{pmatrix}0.8660254038 & -1 \\\\[4pt] 0.5 & 1.7320508076\\end{pmatrix}");
  assert.equal(corto.simbolico, largo.simbolico);
  const g = calcular(ejemplo("gradienteR2"));
  const norma = Math.hypot(...g.Jval[0]);
  assert.equal(resultadoTex(g, { decimales: 4 }).extra, "\\lVert \\nabla f \\rVert = 3.3541");
  assert.equal(resultadoTex(g, { decimales: 10 }).extra, `\\lVert \\nabla f \\rVert = ${norma.toFixed(10)}`);
});

test("lo que se copia: LaTeX de una sola ecuación y valores con toda la precisión", () => {
  const r = calcular(ejemplo("polares"));
  const { copia } = resultadoTex(r, { decimales: 4 });
  assert.equal(
    copia.simbolico,
    "J_F(r, t) = \\begin{pmatrix}\\cos\\left(t\\right) & -r \\sin\\left(t\\right) \\\\ \\sin\\left(t\\right) & r \\cos\\left(t\\right)\\end{pmatrix}",
  );
  assert.equal(copia.valor, "J_F(2,\\ 0.5236) = \\begin{pmatrix}0.866 & -1 \\\\ 0.5 & 1.7321\\end{pmatrix}");
  // Los valores no dependen de los decimales elegidos para la pantalla.
  assert.equal(copia.valores, "[[0.866025403784439, -1], [0.5, 1.73205080756888]]");
  assert.deepEqual(JSON.parse(copia.valores), r.Jval.map((f) => f.map((v) => Number(v.toPrecision(15)))));
  assert.deepEqual(JSON.parse(copia.numericos), r.Jnum.map((f) => f.map((v) => Number(v.toPrecision(15)))));
  // Un gradiente se copia como lista simple.
  assert.match(resultadoTex(calcular(ejemplo("gradienteR2"))).copia.valores, /^\[-2\.2496\d+, 2\.4878\d+\]$/);
});

test("ningún ejemplo genera \\cdot pegado a una letra, dobles subíndices ni paréntesis sueltos", () => {
  for (const e of EJEMPLOS) {
    const tex = resultadoTex(calcular(e));
    for (const fuente of [tex.simbolico, tex.valor, tex.numerico, tex.diferencia, tex.extra ?? ""]) {
      assert.doesNotMatch(fuente, /\\cdot[A-Za-z]/, `\\cdot pegado en ${e.id}`);
      assert.doesNotMatch(fuente, /_F_/, `doble subíndice en ${e.id}`);
      const abre = (fuente.match(/\\left/g) ?? []).length;
      const cierra = (fuente.match(/\\right/g) ?? []).length;
      assert.equal(abre, cierra, `\\left y \\right descompensados en ${e.id}`);
    }
  }
});

test("un jacobiano no cuadrado no tiene fórmula extra", () => {
  assert.equal(resultadoTex(calcular(ejemplo("r3r2"))).extra, null);
});
