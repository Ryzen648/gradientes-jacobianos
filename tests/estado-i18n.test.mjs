import "./preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

import { crearEstado } from "../js/estado.js";
import { t, claves, mensajeDeError } from "../js/i18n/index.js";
import { CODIGOS, ErrorCalculo } from "../js/nucleo/errores.js";
import { EJEMPLOS, GRUPOS } from "../js/ejemplos.js";

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8");

// --- Estado ------------------------------------------------------------------------

test("el estado empieza con una función vacía, en modo visual", () => {
  assert.deepEqual(crearEstado().obtener(), { funciones: [""], valores: {}, orden: "", modo: "visual" });
});

test("el estado se actualiza por partes", () => {
  const estado = crearEstado();
  estado.actualizar({ funciones: ["x*y"], valores: { x: "1" } });
  estado.actualizar({ orden: "y, x", modo: "codigo" });
  assert.deepEqual(estado.obtener(), { funciones: ["x*y"], valores: { x: "1" }, orden: "y, x", modo: "codigo" });
});

test("el estado ignora campos ajenos, corrige valores no válidos y no se puede alterar desde fuera", () => {
  const estado = crearEstado();
  estado.actualizar({ id: "polares", grupo: "calculo", funciones: ["r"], valores: { r: 2 }, modo: "otro" });
  const e = estado.obtener();
  assert.deepEqual(Object.keys(e).sort(), ["funciones", "modo", "orden", "valores"]);
  assert.deepEqual(e.valores, { r: "2" });
  assert.equal(e.modo, "visual");
  e.funciones.push("intruso");
  e.valores.z = "9";
  assert.deepEqual(estado.obtener().funciones, ["r"]);
  assert.deepEqual(estado.obtener().valores, { r: "2" });
});

test("el estado siempre conserva al menos una fila de función", () => {
  const estado = crearEstado({ funciones: ["x"] });
  estado.actualizar({ funciones: [] });
  assert.deepEqual(estado.obtener().funciones, [""]);
});

test("el estado avisa a los suscriptores y permite cancelar", () => {
  const estado = crearEstado();
  const vistos = [];
  const cancelar = estado.suscribir((e) => vistos.push(e.orden));
  estado.actualizar({ orden: "a" });
  cancelar();
  estado.actualizar({ orden: "b" });
  assert.deepEqual(vistos, ["a"]);
});

test("el estado es serializable (requisito para la URL y el historial)", () => {
  const estado = crearEstado({ funciones: ["x^2", "x*y"], valores: { x: "3", y: "pi/4" }, orden: "y, x", modo: "codigo" });
  assert.deepEqual(JSON.parse(JSON.stringify(estado.obtener())), estado.obtener());
});

// --- Textos --------------------------------------------------------------------------

test("t sustituye marcadores y delata las claves que faltan", () => {
  assert.equal(t("error.valorFalta", { variable: "y" }), "Falta el valor de y en el punto.");
  assert.equal(t("resultado.jacobiano.simbolico", { filas: 2, columnas: 3 }), "Jacobiano simbólico (2 × 3)");
  assert.equal(t("clave.que.no.existe"), "clave.que.no.existe");
});

test("todos los códigos de error, ejemplos y grupos tienen texto", () => {
  const existentes = new Set(claves());
  for (const codigo of CODIGOS) assert.ok(existentes.has(`error.${codigo}`), `falta error.${codigo}`);
  for (const e of EJEMPLOS) assert.ok(existentes.has(`ejemplo.${e.id}`), `falta ejemplo.${e.id}`);
  for (const g of GRUPOS) assert.ok(existentes.has(`entrada.ejemplos.${g}`), `falta entrada.ejemplos.${g}`);
});

test("no hay textos de error sin código (ni códigos sin usar)", () => {
  const conTexto = claves().filter((c) => c.startsWith("error.")).map((c) => c.slice("error.".length));
  const propios = new Set(["librerias", "inesperado"]); // errores de la interfaz, no del núcleo
  for (const codigo of conTexto) {
    assert.ok(CODIGOS.includes(codigo) || propios.has(codigo), `error.${codigo} no corresponde a ningún código`);
  }
  // Cada código declarado se lanza en algún sitio del núcleo.
  const fuentes = readdirSync(new URL("../js/nucleo/", import.meta.url))
    .filter((f) => f !== "errores.js")
    .map((f) => leer(`../js/nucleo/${f}`))
    .join("\n");
  for (const codigo of CODIGOS) assert.ok(fuentes.includes(`"${codigo}"`), `el código ${codigo} no se usa`);
});

test("los mensajes de error están en español y dicen qué hacer", () => {
  for (const codigo of CODIGOS) {
    const texto = t(`error.${codigo}`);
    assert.ok(texto.length > 25, `el mensaje de ${codigo} es demasiado corto`);
    assert.doesNotMatch(texto, /\b(expected|unexpected|undefined|error)\b/i, `mensaje en inglés o genérico en ${codigo}`);
  }
});

test("mensajeDeError traduce los errores del núcleo y no oculta los inesperados", () => {
  assert.equal(
    mensajeDeError(new ErrorCalculo("funcionDesconocidaSugerencia", { indice: 2, nombre: "sinn", sugerencia: "sin" })),
    "En la función 2 se usa «sinn(…)», que no existe. ¿Quisiste decir «sin»?",
  );
  assert.equal(
    mensajeDeError(new ErrorCalculo("parentesisSinCerrar", { indice: 1, faltan: 2 })),
    "En la función 1 faltan paréntesis de cierre: añade 2 «)».",
  );
  assert.equal(mensajeDeError(new TypeError("boom")), "Ocurrió un error inesperado: boom");
});

test("mensajeDeError muestra los números con pocas cifras", () => {
  const mensaje = mensajeDeError(new ErrorCalculo("dominioLogaritmo", { indice: 1, expr: "x - 2", valor: -1.3000000000000003 }));
  assert.match(mensaje, /ahí x - 2 = -1\.3\./);
});

test("todas las claves que usan index.html y la interfaz existen en el diccionario", () => {
  const existentes = new Set(claves());
  const html = leer("../index.html");
  const enHtml = [...html.matchAll(/data-i18n(?:-html|-aria-label)?="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(enHtml.length > 15);
  for (const clave of enHtml) assert.ok(existentes.has(clave), `falta la clave ${clave} (index.html)`);

  // Llamadas t("clave") con la clave escrita literalmente.
  const app = leer("../js/ui/app.js");
  const enApp = [...app.matchAll(/\bt\("([^"]+)"/g)].map((m) => m[1]);
  assert.ok(enApp.length > 5);
  for (const clave of enApp) assert.ok(existentes.has(clave), `falta la clave ${clave} (app.js)`);
});
