import "./preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { numeroTex, matrizTex, variableTex, nodoTex, resultadoTex } from "../../js/nucleo/latex.js";
import { calcular } from "../../js/nucleo/calcular.js";
import { EJEMPLOS } from "../../js/ejemplos.js";

test("numeroTex", () => {
  assert.equal(numeroTex(0), "0");
  assert.equal(numeroTex(2), "2");
  assert.equal(numeroTex(-1), "-1");
  assert.equal(numeroTex(0.8660254037844387), "0.866025");
  assert.equal(numeroTex(1.7320508075688772), "1.73205");
  assert.equal(numeroTex(1234567.89), "1.235\\times 10^{6}");
  assert.equal(numeroTex(-0.0000123), "-1.230\\times 10^{-5}");
  assert.equal(numeroTex(Infinity), "\\text{Infinity}");
  assert.equal(numeroTex(NaN), "\\text{NaN}");
});

test("matrizTex", () => {
  assert.equal(
    matrizTex([[1, 2], [3, 4]], String),
    "\\begin{pmatrix}1 & 2 \\\\[4pt] 3 & 4\\end{pmatrix}",
  );
});

test("variableTex protege con llaves y escapa guiones bajos", () => {
  assert.equal(variableTex("x"), "{x}");
  assert.equal(variableTex("x1"), "{\\mathit{x1}}");
  assert.equal(variableTex("theta_2"), "{\\mathit{theta\\_2}}");
});

test("nodoTex no pega el nombre de la variable a \\cdot", () => {
  // Regresión: `x*y` llegó a generarse como `x\cdoty`, un comando inexistente.
  const tex = nodoTex(globalThis.math.parse("x*y + p*t"), ["x", "y", "p", "t"]);
  assert.equal(tex, "{x}\\cdot{y}+{p}\\cdot{t}");
});

test("resultadoTex del gradiente", () => {
  const tex = resultadoTex(calcular(EJEMPLOS.find((e) => e.id === "gradienteR2")));
  assert.match(tex.simbolico, /^\\begin\{gathered\}f\(\{x\}, \{y\}\) = /);
  assert.match(tex.simbolico, /\\nabla f\(\{x\}, \{y\}\) = \\begin\{pmatrix\}/);
  assert.match(tex.valor, /^\\nabla f\(1\.3,\\ -0\.7\) = \\begin\{pmatrix\}-2\.24962 & 2\.48787\\end\{pmatrix\}$/);
  assert.match(tex.extra, /^\\lVert \\nabla f \\rVert = 3\.35415$/);
  assert.match(tex.numerico, /^\\nabla f_\{\\text\{num\}\}/);
});

test("resultadoTex del jacobiano", () => {
  const tex = resultadoTex(calcular(EJEMPLOS.find((e) => e.id === "polares")));
  assert.match(tex.simbolico, /^\\begin\{gathered\}F\(\{r\}, \{t\}\) = \\begin\{pmatrix\}/);
  assert.match(tex.simbolico, /\\end\{gathered\}$/);
  assert.match(tex.simbolico, /J_F\(\{r\}, \{t\}\) = /);
  assert.equal(tex.valor, "J_F(2,\\ 0.523599) = \\begin{pmatrix}0.866025 & -1 \\\\[4pt] 0.5 & 1.73205\\end{pmatrix}");
  assert.equal(tex.extra, "\\det J_F = 2");
  // Regresión: `J_F_{num}` es un doble subíndice y KaTeX lo rechaza.
  assert.match(tex.numerico, /^J_\{F,\\,\\text\{num\}\}/);
});

test("ningún ejemplo genera comandos pegados ni dobles subíndices", () => {
  for (const e of EJEMPLOS) {
    const tex = resultadoTex(calcular(e));
    for (const fuente of [tex.simbolico, tex.valor, tex.numerico, tex.extra ?? ""]) {
      assert.doesNotMatch(fuente, /\\cdot[A-Za-z]/, `\\cdot pegado en ${e.id}`);
      assert.doesNotMatch(fuente, /_F_/, `doble subíndice en ${e.id}`);
    }
  }
});

test("un jacobiano no cuadrado no tiene fórmula extra", () => {
  const tex = resultadoTex(calcular(EJEMPLOS.find((e) => e.id === "r3r2")));
  assert.equal(tex.extra, null);
});
