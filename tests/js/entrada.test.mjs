import "./preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { leerVariables, leerFunciones, leerPunto, leerEntrada } from "../../js/nucleo/entrada.js";
import { lanza } from "./ayuda.mjs";

test("leerVariables separa por comas e ignora espacios y huecos", () => {
  assert.deepEqual(leerVariables(" x ,y,, x1 , theta_2 "), ["x", "y", "x1", "theta_2"]);
});

test("leerVariables rechaza entradas no válidas", () => {
  lanza(() => leerVariables("  "), "sinVariables");
  lanza(() => leerVariables("x, 2y"), "variableInvalida", { nombre: "2y" });
  lanza(() => leerVariables("x, x-y"), "variableInvalida", { nombre: "x-y" });
  lanza(() => leerVariables("x, x"), "variablesRepetidas");
  for (const nombre of ["pi", "e", "i"]) {
    lanza(() => leerVariables(`x, ${nombre}`), "variableReservada", { nombre });
  }
});

test("leerFunciones ignora líneas vacías y acepta constantes y funciones", () => {
  const nodos = leerFunciones(["x*y", "  ", "sin(pi*x) + e^y"], ["x", "y"]);
  assert.equal(nodos.length, 2);
  assert.equal(nodos[0].evaluate({ x: 2, y: 3 }), 6);
});

test("leerFunciones rechaza entradas no válidas", () => {
  lanza(() => leerFunciones(["", " "], ["x"]), "sinFunciones");
  lanza(() => leerFunciones(["x*("], ["x"]), "sintaxisFuncion", { indice: 1, texto: "x*(" });
  lanza(() => leerFunciones(["x", "x*z"], ["x", "y"]), "simboloDesconocido", { indice: 2, nombre: "z" });
});

test("leerPunto evalúa expresiones", () => {
  const p = leerPunto("2, pi/6, -1e-3, sqrt(2)", ["a", "b", "c", "d"]);
  assert.deepEqual(p, [2, Math.PI / 6, -0.001, Math.SQRT2]);
});

test("leerPunto rechaza entradas no válidas", () => {
  lanza(() => leerPunto("1", ["x", "y"]), "puntoLongitud", { valores: 1, variables: 2 });
  lanza(() => leerPunto("1, 2, 3", ["x", "y"]), "puntoLongitud", { valores: 3, variables: 2 });
  lanza(() => leerPunto("1, 2+", ["x", "y"]), "puntoInvalido", { texto: "2+" });
  lanza(() => leerPunto("1, 1/0", ["x", "y"]), "valorNoFinito", { variable: "y" });
  lanza(() => leerPunto("sqrt(-1)", ["x"]), "valorNoFinito", { variable: "x" });
});

test("leerEntrada devuelve variables, árboles y punto", () => {
  const { vars, nodos, x0 } = leerEntrada({ variables: "r, t", funciones: ["r*cos(t)", "r*sin(t)"], punto: "2, 0" });
  assert.deepEqual(vars, ["r", "t"]);
  assert.equal(nodos.length, 2);
  assert.deepEqual(x0, [2, 0]);
});
