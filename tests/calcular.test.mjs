import "./preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { calcular } from "../js/nucleo/calcular.js";
import { jacobianoNumerico, errorRelativo, TOLERANCIA } from "../js/nucleo/numerico.js";
import { leerEntrada } from "../js/nucleo/entrada.js";
import { EJEMPLOS, EJEMPLO_INICIAL } from "../js/ejemplos.js";
import { lanza, cerca, matrizCerca } from "./ayuda.mjs";

const ejemplo = (id) => EJEMPLOS.find((e) => e.id === id);

test("todos los ejemplos se calculan y la verificación numérica coincide", () => {
  for (const e of EJEMPLOS) {
    const r = calcular(e);
    assert.ok(r.coincide, `el ejemplo ${e.id} no coincide (error ${r.error})`);
    assert.ok(r.error < 1e-8, `error demasiado grande en ${e.id}: ${r.error}`);
    assert.equal(r.esGradiente, e.funciones.length === 1);
    assert.equal(r.Jval.length, e.funciones.length);
    assert.equal(r.Jval[0].length, r.vars.length);
  }
  assert.ok(ejemplo(EJEMPLO_INICIAL), "el ejemplo inicial existe");
});

test("gradiente de x²y + sin(xy)", () => {
  const r = calcular(ejemplo("gradienteR2"));
  const [x, y] = [1.3, -0.7];
  const esperado = [2 * x * y + y * Math.cos(x * y), x * x + x * Math.cos(x * y)];
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

test("coordenadas esféricas: |det J| = ρ² sin φ", () => {
  const r = calcular(ejemplo("esfericas"));
  cerca(Math.abs(r.extra.valor), 2 ** 2 * Math.sin(1.1));
});

test("el gradiente de log-sum-exp es softmax: positivo y suma 1", () => {
  const r = calcular(ejemplo("logSumExp"));
  const g = r.Jval[0];
  assert.ok(g.every((v) => v > 0));
  cerca(g.reduce((s, v) => s + v, 0), 1);
});

test("variables de varias letras y funciones variadas", () => {
  const r = calcular({ variables: "x1, x2", funciones: ["x1^2*x2", "sqrt(x1) + tanh(x2)", "x1/x2"], punto: "2, 3" });
  matrizCerca(r.Jval, [
    [12, 4],
    [0.5 / Math.SQRT2, 1 - Math.tanh(3) ** 2],
    [1 / 3, -2 / 9],
  ]);
  assert.ok(r.coincide);
});

test("errores de cálculo", () => {
  // log(x) en x < 0: la función no es real cerca del punto.
  lanza(() => calcular({ variables: "x", funciones: ["log(x)"], punto: "-1" }), "funcionNoFinita", { indice: 1 });
  // 1/x en 0: la derivada simbólica no es finita.
  lanza(() => calcular({ variables: "x", funciones: ["1/x"], punto: "0" }), "derivadaNoFinita", { indice: 1, variable: "x" });
  // Función desconocida para el derivador.
  lanza(() => calcular({ variables: "x", funciones: ["foo(x)"], punto: "1" }), "noDerivable", { indice: 1 });
});

test("jacobianoNumerico aproxima con error O(h²)", () => {
  const { vars, nodos, x0 } = leerEntrada({ variables: "x, y", funciones: ["x^3*y", "exp(x) - y^2"], punto: "1.5, -2" });
  const J = jacobianoNumerico(nodos, vars, x0);
  matrizCerca(J, [[3 * 1.5 ** 2 * -2, 1.5 ** 3], [Math.exp(1.5), 4]], 1e-7);
});

test("errorRelativo es absoluto cerca de cero y relativo para valores grandes", () => {
  assert.equal(errorRelativo([[0, 0]], [[0, 1e-3]]), 1e-3);
  cerca(errorRelativo([[1000]], [[1001]]), 1 / 1001, 1e-15);
  assert.equal(errorRelativo([[1, 2], [3, 4]], [[1, 2], [3, 4]]), 0);
});

test("una derivada simbólica incorrecta no pasaría la tolerancia", () => {
  // Comparamos el jacobiano numérico de x² con el valor (erróneo) x en vez de 2x.
  const { vars, nodos, x0 } = leerEntrada({ variables: "x", funciones: ["x^2"], punto: "3" });
  const Jnum = jacobianoNumerico(nodos, vars, x0);
  assert.ok(errorRelativo([[3]], Jnum) > TOLERANCIA);
  assert.ok(errorRelativo([[6]], Jnum) < TOLERANCIA);
});
