import "./preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { crearEstado } from "../../js/estado.js";
import { t, claves, mensajeDeError } from "../../js/i18n/index.js";
import { CODIGOS, ErrorCalculo } from "../../js/nucleo/errores.js";
import { EJEMPLOS } from "../../js/ejemplos.js";

test("el estado empieza vacío y se actualiza por partes", () => {
  const estado = crearEstado();
  assert.deepEqual(estado.obtener(), { variables: "", funciones: [], punto: "" });
  estado.actualizar({ variables: "x, y", funciones: ["x*y"] });
  estado.actualizar({ punto: "1, 2" });
  assert.deepEqual(estado.obtener(), { variables: "x, y", funciones: ["x*y"], punto: "1, 2" });
});

test("el estado ignora campos ajenos y no se puede alterar desde fuera", () => {
  const estado = crearEstado();
  estado.actualizar({ id: "polares", variables: "r, t", funciones: ["r"], punto: "1, 2" });
  assert.deepEqual(Object.keys(estado.obtener()).sort(), ["funciones", "punto", "variables"]);
  estado.obtener().funciones.push("intruso");
  assert.deepEqual(estado.obtener().funciones, ["r"]);
});

test("el estado avisa a los suscriptores y permite cancelar", () => {
  const estado = crearEstado();
  const vistos = [];
  const cancelar = estado.suscribir((e) => vistos.push(e.punto));
  estado.actualizar({ punto: "1" });
  cancelar();
  estado.actualizar({ punto: "2" });
  assert.deepEqual(vistos, ["1"]);
});

test("el estado es serializable (requisito para la URL y el historial)", () => {
  const estado = crearEstado({ variables: "x", funciones: ["x^2"], punto: "3" });
  assert.deepEqual(JSON.parse(JSON.stringify(estado.obtener())), estado.obtener());
});

test("t sustituye marcadores y delata las claves que faltan", () => {
  assert.equal(t("error.puntoLongitud", { valores: 1, variables: 2 }), "El punto tiene 1 valores, pero hay 2 variables.");
  assert.equal(t("resultado.jacobiano.simbolico", { filas: 2, columnas: 3 }), "Jacobiano simbólico (2 × 3)");
  assert.equal(t("clave.que.no.existe"), "clave.que.no.existe");
});

test("todos los códigos de error y todos los ejemplos tienen texto", () => {
  const existentes = new Set(claves());
  for (const codigo of CODIGOS) assert.ok(existentes.has(`error.${codigo}`), `falta error.${codigo}`);
  for (const e of EJEMPLOS) assert.ok(existentes.has(`ejemplo.${e.id}`), `falta ejemplo.${e.id}`);
});

test("mensajeDeError traduce los errores del núcleo y no oculta los inesperados", () => {
  assert.equal(
    mensajeDeError(new ErrorCalculo("simboloDesconocido", { indice: 2, nombre: "z" })),
    "En la función 2 aparece «z», que no está en la lista de variables.",
  );
  assert.equal(mensajeDeError(new TypeError("boom")), "Ocurrió un error inesperado: boom");
});

test("todas las claves que usa index.html existen en el diccionario", () => {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const usadas = [...html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(usadas.length > 10);
  const existentes = new Set(claves());
  for (const clave of usadas) assert.ok(existentes.has(clave), `falta la clave ${clave}`);
});
