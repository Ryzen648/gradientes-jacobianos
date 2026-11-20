import "./preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { calcular } from "../js/nucleo/calcular.js";
import { jacobianoNumerico, errorRelativo, diferenciaMaxima, TOLERANCIA } from "../js/nucleo/numerico.js";
import { leerEntrada } from "../js/nucleo/entrada.js";
import { FUNCIONES } from "../comun/js/entrada/lenguaje.js";
import { EJEMPLOS, EJEMPLO_INICIAL, GRUPOS } from "../js/ejemplos.js";
import { lanza, cerca, matrizCerca } from "./ayuda.mjs";

const ejemplo = (id) => EJEMPLOS.find((e) => e.id === id);
const en = (funcion, x) => calcular({ funciones: [funcion], valores: { x: String(x) } });

test("todos los ejemplos se calculan y la verificación numérica coincide", () => {
  for (const e of EJEMPLOS) {
    const r = calcular(e);
    assert.ok(r.coincide, `el ejemplo ${e.id} no coincide (error ${r.error})`);
    assert.ok(r.error < 1e-8, `error demasiado grande en ${e.id}: ${r.error}`);
    assert.equal(r.esGradiente, e.funciones.length === 1);
    assert.equal(r.Jval.length, e.funciones.length);
    assert.equal(r.Jval[0].length, r.vars.length);
    assert.ok(GRUPOS.includes(e.grupo), `grupo desconocido en ${e.id}`);
    // Un ejemplo debe rellenar el valor de todas sus variables.
    for (const v of r.vars) assert.ok(e.valores[v], `al ejemplo ${e.id} le falta el valor de ${v}`);
  }
  assert.ok(ejemplo(EJEMPLO_INICIAL), "el ejemplo inicial existe");
});

// --- Ejemplos de cálculo -----------------------------------------------------------

test("gradiente de x²y + sin(xy)", () => {
  const r = calcular(ejemplo("gradienteR2"));
  const [x, y] = [1.3, -0.7];
  const esperado = [2 * x * y + y * Math.cos(x * y), x * x + x * Math.cos(x * y)];
  assert.deepEqual(r.vars, ["x", "y"]);
  matrizCerca(r.Jval, [esperado]);
  assert.equal(r.extra.tipo, "norma");
  cerca(r.extra.valor, Math.hypot(...esperado));
});

test("jacobiano de coordenadas polares: det J = r", () => {
  const r = calcular(ejemplo("polares"));
  const [rad, t] = [2, Math.PI / 6];
  matrizCerca(r.Jval, [
    [Math.cos(t), -rad * Math.sin(t)],
    [Math.sin(t), rad * Math.cos(t)],
  ]);
  assert.equal(r.extra.tipo, "determinante");
  cerca(r.extra.valor, rad);
});

test("jacobiano no cuadrado (R³ → R²) no tiene determinante", () => {
  const r = calcular(ejemplo("r3r2"));
  const [x, y, z] = [0.5, -1.2, 2];
  matrizCerca(r.Jval, [
    [y * z, x * z, x * y],
    [2 * x, Math.exp(y) * Math.sin(z), Math.exp(y) * Math.cos(z)],
  ]);
  assert.equal(r.extra, null);
});

test("coordenadas esféricas con el orden (ρ, θ, φ): det J = −ρ² sin φ", () => {
  const r = calcular(ejemplo("esfericas"));
  assert.deepEqual(r.vars, ["p", "t", "f"]);
  cerca(r.extra.valor, -(2 ** 2) * Math.sin(1.1));
});

test("cambiar el orden de las variables permuta las columnas", () => {
  const base = { funciones: ["x^2*y"], valores: { x: "3", y: "5" } };
  matrizCerca(calcular(base).Jval, [[30, 9]]);
  matrizCerca(calcular({ ...base, orden: "y, x" }).Jval, [[9, 30]]);
});

test("el gradiente de log-sum-exp es softmax: positivo y suma 1", () => {
  const g = calcular(ejemplo("logSumExp")).Jval[0];
  assert.ok(g.every((v) => v > 0));
  cerca(g.reduce((s, v) => s + v, 0), 1);
});

// --- Ejemplos de aprendizaje automático ----------------------------------------------

test("sigmoide: σ'(x) = σ(x)(1 − σ(x))", () => {
  const r = calcular(ejemplo("sigmoide"));
  const s = 1 / (1 + Math.exp(-0.5));
  matrizCerca(r.Jval, [[s * (1 - s)]]);
});

test("softmax: J = diag(s) − s sᵀ, con det J = 0", () => {
  const r = calcular(ejemplo("softmax"));
  const z = [1, 2, 0.5];
  const total = z.reduce((a, v) => a + Math.exp(v), 0);
  const s = z.map((v) => Math.exp(v) / total);
  matrizCerca(r.Jval, s.map((si, i) => s.map((sj, j) => (i === j ? si : 0) - si * sj)));
  // Las salidas suman 1, así que cada columna del jacobiano suma 0 y J es singular.
  // Y se informa como 0 exacto, no como el residuo de redondeo (~1e-18).
  assert.equal(r.extra.valor, 0);
});

test("capa densa con tanh: J = diag(1 − tanh²(Wx + b)) · W", () => {
  const r = calcular(ejemplo("capaDensa"));
  const W = [[0.5, -1.2], [0.8, 0.3]];
  const b = [0.1, -0.4];
  const x = [1, -1];
  const esperado = W.map((fila, i) => {
    const d = 1 - Math.tanh(fila[0] * x[0] + fila[1] * x[1] + b[i]) ** 2;
    return fila.map((w) => d * w);
  });
  matrizCerca(r.Jval, esperado);
});

// --- Funciones admitidas y alias -------------------------------------------------------

test("todas las funciones admitidas se derivan y coinciden con la verificación numérica", () => {
  const puntos = { acosh: 1.7, asec: 1.7, acsc: 1.7, atanh: 0.4, asin: 0.4, acos: 0.4 };
  for (const fn of FUNCIONES) {
    const llamada = fn === "nthRoot" ? "nthRoot(x, 3)" : `${fn}(x)`;
    const r = en(`${llamada} + x`, puntos[fn] ?? 0.6);
    assert.ok(r.coincide, `${fn}: error ${r.error}`);
  }
});

test("los alias se derivan igual que la forma canónica", () => {
  const pares = [
    ["ln(x)", "log(x)"], ["x**3", "x^3"], ["sen(x)*tg(x)", "sin(x)*tan(x)"],
    ["e^x", "exp(x)"], ["|x|", "abs(x)"], ["arctan(x)", "atan(x)"],
  ];
  for (const [alias, canonica] of pares) {
    const a = en(alias, 0.8);
    assert.ok(a.coincide, `${alias}: error ${a.error}`);
    cerca(a.Jval[0][0], en(canonica, 0.8).Jval[0][0], 1e-12);
  }
  matrizCerca(en("sec(x)", 0.8).Jval, [[Math.tan(0.8) / Math.cos(0.8)]]);
  matrizCerca(en("cot(x)", 0.8).Jval, [[-1 / Math.sin(0.8) ** 2]]);
});

test("variables de varias letras y nombres griegos", () => {
  const r = calcular({
    funciones: ["x1^2*x2", "sqrt(x1) + tanh(x2)", "x1/x2"],
    valores: { x1: "2", x2: "3" },
  });
  matrizCerca(r.Jval, [
    [12, 4],
    [0.5 / Math.SQRT2, 1 - Math.tanh(3) ** 2],
    [1 / 3, -2 / 9],
  ]);
  // `phi` y `tau` son constantes en math.js, pero aquí son variables normales.
  const g = calcular({ funciones: ["sin(phi)*tau + theta^2"], valores: { phi: "0.3", tau: "2", theta: "1.5" } });
  assert.deepEqual(g.vars, ["phi", "tau", "theta"]);
  matrizCerca(g.Jval, [[2 * Math.cos(0.3), Math.sin(0.3), 3]]);
  assert.ok(g.coincide);
});

// --- Errores en el punto ---------------------------------------------------------------

test("abs en 0 no es derivable y se explica por qué", () => {
  lanza(() => en("abs(x)", 0), "noDerivableAbs", { indice: 1, expr: "x" });
  lanza(() => en("|x - 2| + x", 2), "noDerivableAbs", { indice: 1, expr: "x - 2" });
  // En cualquier otro punto sí lo es.
  matrizCerca(en("abs(x)", -3).Jval, [[-1]]);
});

test("el diagnóstico señala la función y la subexpresión culpables", () => {
  lanza(
    () => calcular({ funciones: ["x*y", "abs(x - y)"], valores: { x: "2", y: "2" } }),
    "noDerivableAbs", { indice: 2, expr: "x - y" },
  );
});

test("raíces, logaritmos, divisiones y potencias fuera de su dominio", () => {
  lanza(() => en("sqrt(x)", 0), "noDerivableRaiz", { indice: 1, expr: "x" });
  lanza(() => en("sqrt(x - 5)", 1), "dominioRaiz", { indice: 1, expr: "x - 5", valor: -4 });
  lanza(() => en("log(x)", -1), "dominioLogaritmo", { indice: 1, expr: "x", valor: -1 });
  lanza(() => en("ln(x)", 0), "dominioLogaritmo", { indice: 1, expr: "x", valor: 0 });
  lanza(() => en("1/x", 0), "divisionPorCero", { indice: 1, expr: "x" });
  lanza(() => en("sin(x)/(x - 1)", 1), "divisionPorCero", { indice: 1, expr: "x - 1" });
  lanza(() => en("x^(-2)", 0), "divisionPorCero", { indice: 1, expr: "x" });
  lanza(() => en("x^0.5", 0), "potenciaNoDerivable", { indice: 1, expr: "x" });
  lanza(() => en("asin(x)", 1), "dominioInversa", { indice: 1, funcion: "asin", expr: "x", valor: 1 });
});

// --- Verificación numérica --------------------------------------------------------------

test("jacobianoNumerico aproxima con error O(h²)", () => {
  const { vars, nodos, x0 } = leerEntrada({ funciones: ["x^3*y", "exp(x) - y^2"], valores: { x: "1.5", y: "-2" } });
  const J = jacobianoNumerico(nodos, vars, x0);
  matrizCerca(J, [[3 * 1.5 ** 2 * -2, 1.5 ** 3], [Math.exp(1.5), 4]], 1e-7);
});

test("el resultado incluye ‖J − J_num‖ y es coherente con el error relativo", () => {
  const r = calcular(ejemplo("polares"));
  let mayor = 0;
  r.Jval.forEach((fila, i) => fila.forEach((v, j) => { mayor = Math.max(mayor, Math.abs(v - r.Jnum[i][j])); }));
  assert.equal(r.diferencia, mayor);
  assert.ok(r.diferencia > 0 && r.diferencia < 1e-8);
  // Aquí la mayor entrada es 1.73, así que el error relativo es la diferencia entre ese tamaño.
  cerca(r.error, r.diferencia / Math.max(1, ...r.Jval.flat().map(Math.abs), ...r.Jnum.flat().map(Math.abs)), 1e-20);
  assert.equal(r.coincide, r.error < TOLERANCIA);
});

test("diferenciaMaxima", () => {
  assert.equal(diferenciaMaxima([[1, 2], [3, 4]], [[1, 2.5], [2, 4]]), 1);
  assert.equal(diferenciaMaxima([[1, 2]], [[1, 2]]), 0);
});

test("errorRelativo es absoluto cerca de cero y relativo para valores grandes", () => {
  assert.equal(errorRelativo([[0, 0]], [[0, 1e-3]]), 1e-3);
  cerca(errorRelativo([[1000]], [[1001]]), 1 / 1001, 1e-15);
  assert.equal(errorRelativo([[1, 2], [3, 4]], [[1, 2], [3, 4]]), 0);
});

test("una derivada simbólica incorrecta no pasaría la tolerancia", () => {
  // Comparamos el jacobiano numérico de x² con el valor (erróneo) x en vez de 2x.
  const { vars, nodos, x0 } = leerEntrada({ funciones: ["x^2"], valores: { x: "3" } });
  const Jnum = jacobianoNumerico(nodos, vars, x0);
  assert.ok(errorRelativo([[3]], Jnum) > TOLERANCIA);
  assert.ok(errorRelativo([[6]], Jnum) < TOLERANCIA);
});
