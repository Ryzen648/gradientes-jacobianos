import "./preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { latexACodigo } from "../js/nucleo/latex-a-codigo.js";
import { analizarFuncion, variablesDe } from "../js/nucleo/entrada.js";
import { nodoTex } from "../js/nucleo/latex.js";
import { FUNCIONES } from "../js/nucleo/lenguaje.js";
import { EJEMPLOS } from "../js/ejemplos.js";
import { lanza, cerca } from "./ayuda.mjs";

/** Valor de un LaTeX en un punto, pasando por el conversor y el analizador. */
const valor = (latex, ambito) => analizarFuncion(latexACodigo(latex)).evaluate(ambito);
const P = { x: 0.7, y: -1.3, z: 2.1, r: 2, t: 0.5 };

test("una expresión vacía da código vacío", () => {
  assert.equal(latexACodigo(""), "");
  assert.equal(latexACodigo("  \\, "), "");
});

test("operaciones básicas y producto implícito", () => {
  cerca(valor("x+y-z", P), P.x + P.y - P.z);
  cerca(valor("xy", P), P.x * P.y);
  cerca(valor("2xy", P), 2 * P.x * P.y);
  cerca(valor("x\\cdot y\\times z", P), P.x * P.y * P.z);
  cerca(valor("x\\cdot-y", P), -P.x * P.y);
  cerca(valor("-x^2", P), -(P.x ** 2));
  cerca(valor("x/y", P), P.x / P.y);
  cerca(valor("3\\left(x+1\\right)\\left(y-2\\right)", P), 3 * (P.x + 1) * (P.y - 2));
  cerca(valor("1.5x", P), 1.5 * P.x);
});

test("cada letra es una variable (a diferencia del modo código)", () => {
  assert.deepEqual([...variablesDe(analizarFuncion(latexACodigo("xy+rt")))].sort(), ["r", "t", "x", "y"]);
});

test("potencias, con y sin llaves", () => {
  cerca(valor("x^2y", P), P.x ** 2 * P.y);
  cerca(valor("x^{2y}", P), P.x ** (2 * P.y));
  cerca(valor("x^23", P), P.x ** 2 * 3); // en LaTeX, sin llaves, solo el primer dígito es exponente
  cerca(valor("{x}^{2}\\cdot{y}", P), P.x ** 2 * P.y);
  cerca(valor("e^{-x^2}", P), Math.exp(-(P.x ** 2)));
  cerca(valor("\\exponentialE^{x}", P), Math.exp(P.x));
  cerca(valor("2^{x+1}", P), 2 ** (P.x + 1));
});

test("fracciones y raíces", () => {
  cerca(valor("\\frac{x^2}{y}", P), P.x ** 2 / P.y);
  cerca(valor("\\frac{1}{1+e^{-x}}", P), 1 / (1 + Math.exp(-P.x)));
  cerca(valor("\\frac12x", P), 0.5 * P.x);
  cerca(valor("\\sqrt{x+1}", P), Math.sqrt(P.x + 1));
  cerca(valor("\\sqrt[3]{x}", P), Math.cbrt(P.x));
  cerca(valor("\\sqrt2", P), Math.SQRT2);
});

test("funciones con y sin paréntesis", () => {
  cerca(valor("\\sin\\left(xy\\right)", P), Math.sin(P.x * P.y));
  cerca(valor("\\sin(x)+\\cos(y)", P), Math.sin(P.x) + Math.cos(P.y));
  cerca(valor("\\sin x", P), Math.sin(P.x));
  cerca(valor("\\sin 2x", P), Math.sin(2 * P.x));
  cerca(valor("\\sin x\\cos y", P), Math.sin(P.x) * Math.cos(P.y));
  cerca(valor("\\sin x+y", P), Math.sin(P.x) + P.y);
  cerca(valor("\\ln\\left(x\\right)", P), Math.log(P.x));
  cerca(valor("\\exp\\left(x\\right)", P), Math.exp(P.x));
  cerca(valor("\\tanh\\left(0.5x-1.2y+0.1\\right)", P), Math.tanh(0.5 * P.x - 1.2 * P.y + 0.1));
});

test("potencias e inversas de funciones", () => {
  cerca(valor("\\sin^2x", P), Math.sin(P.x) ** 2);
  cerca(valor("\\sin^{2}\\left(x\\right)+\\cos^{2}\\left(x\\right)", P), 1);
  cerca(valor("\\sin\\left(x\\right)^2", P), Math.sin(P.x) ** 2);
  cerca(valor("\\sin^{-1}\\left(x\\right)", P), Math.asin(P.x));
  cerca(valor("\\tan^{-1}\\left(x\\right)", P), Math.atan(P.x));
  cerca(valor("\\arctan\\left(x\\right)", P), Math.atan(P.x));
  cerca(valor("\\log_{10}\\left(x\\right)", P), Math.log10(P.x));
  cerca(valor("\\log_2\\left(x\\right)", P), Math.log2(P.x));
  cerca(valor("\\log_{y+3}\\left(x\\right)", P), Math.log(P.x) / Math.log(P.y + 3));
});

test("funciones escritas con \\operatorname o \\mathrm", () => {
  cerca(valor("\\operatorname{sech}\\left(x\\right)", P), 1 / Math.cosh(P.x));
  cerca(valor("\\mathrm{sen}\\left(x\\right)", P), Math.sin(P.x));
  cerca(valor("\\operatorname{tg}\\left(x\\right)", P), Math.tan(P.x));
});

test("texto pegado: letras que deletrean una función seguida de paréntesis", () => {
  cerca(valor("sin(x)+cos\\left(y\\right)", P), Math.sin(P.x) + Math.cos(P.y));
  cerca(valor("2ln(x)", P), 2 * Math.log(P.x));
  cerca(valor("xsen(x)", P), P.x * Math.sin(P.x)); // se busca desde cada letra: x · sen(x)
  // Sin paréntesis siguen siendo letras sueltas: s·i·n·x, y la i no está admitida.
  lanza(() => analizarFuncion(latexACodigo("sinx")), "unidadImaginaria");
});

test("valor absoluto", () => {
  cerca(valor("\\left|x-2\\right|", P), 1.3);
  cerca(valor("|y|+|x|", P), 1.3 + 0.7);
  cerca(valor("2\\lvert y\\rvert", P), 2.6);
});

test("constantes, letras griegas y subíndices", () => {
  cerca(valor("\\pi x", P), Math.PI * P.x);
  cerca(valor("e^x", P), Math.exp(P.x));
  assert.equal(latexACodigo("\\theta"), "theta");
  assert.equal(latexACodigo("\\varphi+\\rho"), "phi+rho");
  assert.equal(latexACodigo("x_1+x_{12}"), "x1+x12");
  assert.equal(latexACodigo("\\theta_2"), "theta2");
  assert.equal(latexACodigo("\\mathit{peso}"), "peso");
  cerca(valor("x_1^2x_2", { x1: 2, x2: 3 }), 12);
});

test("errores del editor visual", () => {
  lanza(() => latexACodigo("\\frac{\\placeholder{}}{x}", 2), "visualHueco", { indice: 2 });
  lanza(() => latexACodigo("x^{}", 1), "visualHueco", { indice: 1 });
  lanza(() => latexACodigo("x+", 1), "visualIncompleto", { indice: 1 });
  lanza(() => latexACodigo("\\frac{x}", 1), "visualIncompleto", { indice: 1 });
  lanza(() => latexACodigo("\\sin", 3), "visualIncompleto", { indice: 3 });
  lanza(() => latexACodigo("\\left(x+1\\right.", 1), "parentesisSinCerrar", { indice: 1, faltan: 1 });
  lanza(() => latexACodigo("(x+1", 1), "parentesisSinCerrar", { indice: 1, faltan: 1 });
  lanza(() => latexACodigo("x+1)", 1), "parentesisSobra");
  lanza(() => latexACodigo("x\\int y", 1), "visualNoAdmitido", { indice: 1, simbolo: "\\int" });
  lanza(() => latexACodigo("x=3", 1), "visualNoAdmitido", { indice: 1, simbolo: "=" });
  lanza(() => latexACodigo("\\sin_3\\left(x\\right)", 1), "visualNoAdmitido", { indice: 1, simbolo: "_3" });
});

// --- Ida y vuelta: código -> LaTeX -> código ---------------------------------------------
// Es lo que ocurre al pasar del modo código al visual y al cargar un ejemplo.

function idaYVuelta(codigo, ambito) {
  const original = analizarFuncion(codigo);
  const vars = [...variablesDe(original)];
  const latex = nodoTex(original, vars);
  const vuelta = analizarFuncion(latexACodigo(latex));
  cerca(vuelta.evaluate(ambito), original.evaluate(ambito), 1e-12);
  assert.deepEqual([...variablesDe(vuelta)].sort(), vars.sort(), `variables distintas en ${codigo}`);
}

test("ida y vuelta de todos los ejemplos", () => {
  const ambito = { x: 0.7, y: -1.3, z: 2.1, r: 2, t: 0.5, p: 1.4, f: 0.9, a: 0.2, b: -1, c: 1.5 };
  for (const e of EJEMPLOS) for (const funcion of e.funciones) idaYVuelta(funcion, ambito);
});

test("ida y vuelta de todas las funciones admitidas", () => {
  const puntos = { acosh: 1.7, asec: 1.7, acsc: 1.7 };
  for (const fn of FUNCIONES) {
    const llamada = fn === "nthRoot" ? "nthRoot(x, 3)" : `${fn}(x)`;
    idaYVuelta(`2*${llamada} + x`, { x: puntos[fn] ?? 0.6 });
  }
});

test("ida y vuelta de expresiones variadas", () => {
  const ambito = { x: 0.7, y: 1.3, x1: 2, x2: 3, theta: 0.4, phi: 1.1, peso: 5 };
  for (const codigo of [
    "x^2*y + sin(x*y)", "-x^2 + (x - y)^3", "x/(y + 1) - 2/x", "(x + y)/(x - y)",
    "e^(-x^2/2)", "2^x * x^y", "abs(x - y)*sqrt(x + y)", "x1^2*x2 + x1/x2",
    "sin(theta)*cos(phi)", "peso*x + 3", "-(x + y)", "x - (y - 2)", "1/(1 + exp(-x))",
    "log(x)^2 + log10(y)", "sin(x)^2 + cos(x)^2", "pi*x + e", "x*-y", "(-x)^2",
  ]) idaYVuelta(codigo, ambito);
});
