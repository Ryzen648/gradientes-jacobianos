import "./preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { expresionTex, nombreTex } from "../js/nucleo/impresion.js";
import { analizarFuncion, variablesDe } from "../js/nucleo/entrada.js";
import { latexACodigo } from "../js/nucleo/latex-a-codigo.js";
import { calcular } from "../js/nucleo/calcular.js";
import { EJEMPLOS } from "../js/ejemplos.js";
import { cerca } from "./ayuda.mjs";

const tex = (codigo) => expresionTex(analizarFuncion(codigo));
const ejemplo = (id) => EJEMPLOS.find((e) => e.id === id);
const jacobiano = (id) => calcular(ejemplo(id)).Jsim.map((fila) => fila.map(expresionTex));

test("el producto se escribe por yuxtaposición, con el coeficiente delante", () => {
  assert.equal(tex("2*x"), "2 x");
  assert.equal(tex("x*2"), "2 x");
  assert.equal(tex("x*y*z"), "x y z");
  assert.equal(tex("x^2*3*y"), "3 x^{2} y");
  assert.equal(tex("2*3*x"), "6 x");
  assert.equal(tex("0.5*x*y"), "0.5 x y");
  assert.equal(tex("pi*x + e"), "\\pi x + e");
});

test("y·exp(x·y) se escribe y e^{xy}", () => {
  assert.equal(tex("y*exp(x*y)"), "y e^{x y}");
  assert.equal(tex("exp(x)*y"), "y e^{x}");
  assert.equal(tex("e^(x*y)"), "e^{x y}");
  // Un exponente con fracción quedaría diminuto arriba: se usa exp(…).
  assert.equal(tex("exp(-x^2/2)"), "\\exp\\left(-\\frac{x^{2}}{2}\\right)");
  assert.equal(tex("exp(x)^2"), "e^{2 x}");
});

test("solo se usa \\cdot donde la yuxtaposición sería ambigua", () => {
  assert.equal(tex("2*3^x"), "2 \\cdot 3^{x}");
  assert.equal(tex("x^y*2^x"), "2^{x} x^{y}");
  assert.doesNotMatch(tex("x*y*sin(x)*(x+1)"), /\\cdot/);
});

test("orden de los factores: variables en orden alfabético, luego exponenciales, funciones y sumas", () => {
  assert.equal(tex("cos(t)*p*cos(f)"), "p \\cos\\left(t\\right) \\cos\\left(f\\right)");
  assert.equal(tex("z*y*x"), "x y z");
  assert.equal(tex("sin(z)*exp(y)*x"), "x e^{y} \\sin\\left(z\\right)");
  assert.equal(tex("(x+1)*y"), "y \\left(x + 1\\right)");
  assert.equal(tex("x2*x10*x1"), "x_{1} x_{2} x_{10}");
});

test("los signos se sacan delante y las restas se aplanan", () => {
  assert.equal(tex("-(r*sin(t))"), "-r \\sin\\left(t\\right)");
  assert.equal(tex("x*-y"), "-x y");
  assert.equal(tex("-(x+y)"), "-x - y");
  assert.equal(tex("x - (y - 2)"), "x - y + 2");
  assert.equal(tex("x - -y"), "x + y");
  assert.equal(tex("x + -2*y"), "x - 2 y");
  assert.equal(tex("-x^2"), "-x^{2}");
  assert.equal(tex("(-x)^2"), "\\left(-x\\right)^{2}");
  assert.equal(tex("-3"), "-3");
});

test("las divisiones se juntan en una sola fracción", () => {
  assert.equal(tex("(1/2)/sqrt(x1)"), "\\frac{1}{2 \\sqrt{x_{1}}}");
  assert.equal(tex("x/2/y"), "\\frac{x}{2 y}");
  assert.equal(tex("a/(b/c)"), "\\frac{a c}{b}");
  assert.equal(tex("3/4*x"), "\\frac{3 x}{4}");
  assert.equal(tex("4*x/6"), "\\frac{2 x}{3}"); // coeficiente irreducible
  assert.equal(tex("x/(y+1) - 2/x"), "\\frac{x}{y + 1} - \\frac{2}{x}");
  assert.equal(tex("(x+1)/2"), "\\frac{x + 1}{2}");
  assert.equal(tex("-x/y"), "-\\frac{x}{y}");
  assert.equal(tex("1/(1+exp(-x))"), "\\frac{1}{1 + e^{-x}}");
});

test("los exponentes negativos pasan al denominador y ^(1/2) es una raíz", () => {
  assert.equal(tex("x^(-2)"), "\\frac{1}{x^{2}}");
  assert.equal(tex("y*x^(-1)"), "\\frac{y}{x}");
  assert.equal(tex("x^(1/2)"), "\\sqrt{x}");
  assert.equal(tex("x^0.5"), "\\sqrt{x}");
  assert.equal(tex("x^(-y)"), "x^{-y}"); // exponente no numérico: se deja como está
});

test("potencias: paréntesis solo cuando hacen falta", () => {
  assert.equal(tex("(x+y)^3"), "\\left(x + y\\right)^{3}");
  assert.equal(tex("(x^2)^3"), "\\left(x^{2}\\right)^{3}");
  assert.equal(tex("x^y^2"), "x^{y^{2}}");
  assert.equal(tex("2^(x+1)"), "2^{x + 1}");
  assert.equal(tex("abs(x)^2"), "\\left|x\\right|^{2}");
  assert.equal(tex("sqrt(x)^3"), "\\left(\\sqrt{x}\\right)^{3}");
  assert.equal(tex("x1^2"), "x_{1}^{2}");
});

test("funciones", () => {
  assert.equal(tex("sin(x)^2 + cos(x)^2"), "\\sin^{2}\\left(x\\right) + \\cos^{2}\\left(x\\right)");
  assert.equal(tex("log(x)^2 + log10(y)"), "\\ln^{2}\\left(x\\right) + \\log_{10}\\left(y\\right)");
  assert.equal(tex("asin(x) + atanh(x)"), "\\arcsin\\left(x\\right) + \\tanh^{-1}\\left(x\\right)");
  assert.equal(tex("sech(x)*csch(x)"), "\\operatorname{sech}\\left(x\\right) \\operatorname{csch}\\left(x\\right)");
  assert.equal(tex("nthRoot(x, 3) + cbrt(y) + sqrt(z)"), "\\sqrt[3]{x} + \\sqrt[3]{y} + \\sqrt{z}");
  assert.equal(tex("abs(x-y)*sqrt(x+y)"), "\\left|x - y\\right| \\sqrt{x + y}");
  assert.equal(tex("ln(x)"), "\\ln\\left(x\\right)");
});

test("números: sin ruido de coma flotante ni notación 1e-7", () => {
  assert.equal(tex("0.1 + 0.2"), "0.1 + 0.2");
  assert.equal(tex("1e-7*x"), "10^{-7} x");
  assert.equal(tex("2.5e-7*x"), "2.5\\times 10^{-7} x");
  assert.equal(tex("5"), "5");
  assert.equal(tex("0*x"), "0");
});

test("nombres de variable", () => {
  assert.equal(nombreTex("x"), "x");
  assert.equal(nombreTex("theta2"), "\\theta_{2}");
  assert.equal(tex("x*peso + 3"), "\\mathit{peso} x + 3"); // orden alfabético: peso < x
  assert.equal(tex("theta2*x1"), "\\theta_{2} x_{1}");
});

// --- Jacobianos de los ejemplos ------------------------------------------------------

test("jacobianos de los ejemplos de cálculo, como se escribirían a mano", () => {
  assert.deepEqual(jacobiano("gradienteR2"), [
    ["y \\left(2 x + \\cos\\left(x y\\right)\\right)", "x^{2} + x \\cos\\left(x y\\right)"],
  ]);
  assert.deepEqual(jacobiano("polares"), [
    ["\\cos\\left(t\\right)", "-r \\sin\\left(t\\right)"],
    ["\\sin\\left(t\\right)", "r \\cos\\left(t\\right)"],
  ]);
  assert.deepEqual(jacobiano("r3r2"), [
    ["y z", "x z", "x y"],
    ["2 x", "e^{y} \\sin\\left(z\\right)", "e^{y} \\cos\\left(z\\right)"],
  ]);
  assert.deepEqual(jacobiano("logSumExp"), [[
    "\\frac{e^{a}}{e^{a} + e^{b} + e^{c}}", "\\frac{e^{b}}{e^{a} + e^{b} + e^{c}}", "\\frac{e^{c}}{e^{a} + e^{b} + e^{c}}",
  ]]);
});

test("jacobianos de los ejemplos de ML", () => {
  assert.deepEqual(jacobiano("sigmoide"), [["\\frac{e^{-x}}{\\left(e^{-x} + 1\\right)^{2}}"]]);
  // La función se escribió con decimales y el resultado los conserva (no 1/2, 6/5…).
  assert.deepEqual(jacobiano("capaDensa")[0], [
    "0.5 \\operatorname{sech}^{2}\\left(0.5 x + 0.1 - 1.2 y\\right)",
    "-1.2 \\operatorname{sech}^{2}\\left(0.5 x + 0.1 - 1.2 y\\right)",
  ]);
  assert.equal(jacobiano("softmax")[0][1], "-\\frac{e^{a} e^{b}}{\\left(e^{a} + e^{b} + e^{c}\\right)^{2}}");
});

test("sin decimales en la entrada, los coeficientes salen como fracciones exactas", () => {
  const J = (f) => calcular({ funciones: [f], valores: { x: "2" } }).Jsim[0].map(expresionTex);
  assert.deepEqual(J("sqrt(x)"), ["\\frac{1}{2 \\sqrt{x}}"]);
  assert.deepEqual(J("x^3/3"), ["x^{2}"]);
  assert.deepEqual(J("x^2/3"), ["\\frac{2 x}{3}"]);
  assert.deepEqual(J("0.1*x^3"), ["0.3 x^{2}"]);
});

// --- La forma de escribir no cambia el valor --------------------------------------------

test("lo impreso vale lo mismo que el árbol original (ida y vuelta por el conversor)", () => {
  const ambito = { x: 0.7, y: 1.3, z: 2.1, r: 2, t: 0.5, p: 1.4, f: 0.9, a: 0.2, b: -1, c: 1.5, x1: 2, x2: 3 };
  const comprobar = (nodo, origen) => {
    const vuelta = analizarFuncion(latexACodigo(expresionTex(nodo)));
    cerca(vuelta.evaluate(ambito), nodo.evaluate(ambito), 1e-9);
    assert.deepEqual([...variablesDe(vuelta)].sort(), [...variablesDe(nodo)].sort(), `variables distintas en ${origen}`);
  };
  // Las funciones y, sobre todo, sus derivadas simplificadas (lo que de verdad se muestra).
  for (const e of EJEMPLOS) {
    const r = calcular(e);
    r.nodos.forEach((n) => comprobar(n, e.id));
    r.Jsim.flat().forEach((n) => comprobar(n, `jacobiano de ${e.id}`));
  }
  for (const codigo of [
    "(1/2)/sqrt(x1)", "x/2/y", "a/(b/c)", "x^(-2)*y", "2*3^x", "x^y*2^x", "x - (y - 2)", "-(x+y)*(x-y)",
    "exp(-x^2/2)", "exp(x)^2", "sin(x)^2*cos(y)^3", "abs(x-y)^2", "sqrt(x)^3", "(x^2)^3", "x^y^2",
    "1e-7*x + 2.5e-3", "log10(x)^2", "asin(x/2) + atanh(x/3)", "nthRoot(x, 3)", "x*-y", "4*x/6", "(x+1)/(y-2)/z",
  ]) comprobar(analizarFuncion(codigo), codigo);
});
