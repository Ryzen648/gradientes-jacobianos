import "./preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { leerFragmento, escribirFragmento } from "../js/estado-url.js";
import { crearEstado } from "../js/estado.js";
import { EJEMPLOS } from "../js/ejemplos.js";
import { calcular } from "../js/nucleo/calcular.js";

test("sin fragmento (los enlaces que ya circulan) no hay nada que cargar", () => {
  for (const f of ["", "#", undefined, null]) assert.equal(leerFragmento(f), null);
  // Un fragmento sin funciones (p. ej. un ancla vieja) tampoco cambia nada.
  assert.equal(leerFragmento("#resultados"), null);
  assert.equal(leerFragmento("#v.x=1"), null);
  assert.equal(leerFragmento("#f=&f=%20"), null);
});

test("ida y vuelta: funciones con símbolos, valores, orden y precisión", () => {
  const calculo = {
    funciones: ["x^2*y + sin(x*y)", "exp(-x/2) - y"], valores: { x: "1.3", y: "pi/4" }, orden: "y, x", precision: 10,
  };
  const fragmento = escribirFragmento(calculo);
  assert.ok(fragmento.startsWith("#f="));
  assert.ok(!fragmento.includes(" "), "nada sin codificar");
  assert.deepEqual(leerFragmento(fragmento), calculo);
  // Sin orden ni precisión: no se escriben.
  const simple = escribirFragmento({ funciones: ["x*y"], valores: { x: "1", y: "" } });
  assert.equal(simple, "#f=x*y&v.x=1");
  assert.deepEqual(leerFragmento(simple), { funciones: ["x*y"], valores: { x: "1" } });
});

test("el «+» de una fórmula sobrevive (no se confunde con un espacio)", () => {
  const f = escribirFragmento({ funciones: ["x+y"], valores: {} });
  assert.equal(leerFragmento(f).funciones[0], "x+y");
});

test("ejemplo por su id", () => {
  assert.deepEqual(leerFragmento("#ejemplo=polares"), { ejemplo: "polares" });
});

test("lo que no se entiende se ignora o lo corrige el estado", () => {
  const e = leerFragmento("#f=x&v.x=2&v.1mal=3&v.__proto__=4&d=7&otra=cosa");
  assert.deepEqual(e.valores, { x: "2" }); // nombres que no son de variable: fuera
  const estado = crearEstado();
  estado.actualizar(e);
  assert.equal(estado.obtener().precision, 6); // 7 no es una precisión válida
  assert.equal(estado.obtener().valores.x, "2");
  // Límites: no más de 12 funciones ni textos larguísimos.
  const muchas = leerFragmento(`#${Array.from({ length: 20 }, () => "f=x").join("&")}`);
  assert.equal(muchas.funciones.length, 12);
  assert.equal(leerFragmento(`#f=${"x".repeat(1000)}`).funciones[0].length, 400);
});

test("cada ejemplo, escrito en la URL y leído de vuelta, da el mismo jacobiano", () => {
  for (const ej of EJEMPLOS) {
    const leido = leerFragmento(escribirFragmento({ funciones: ej.funciones, valores: ej.valores, orden: ej.orden ?? "" }));
    const original = calcular({ funciones: ej.funciones, valores: ej.valores, orden: ej.orden ?? "" });
    const copia = calcular({ orden: "", ...leido });
    assert.deepEqual(copia.vars, original.vars, ej.id);
    assert.deepEqual(copia.Jval, original.Jval, ej.id);
  }
});
