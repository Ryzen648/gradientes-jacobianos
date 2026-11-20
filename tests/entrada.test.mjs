import "./preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  normalizar, analizarFuncion, detectarVariables, resolverOrden, leerValores, leerEntrada, analizarEntrada,
} from "../js/nucleo/entrada.js";
import { sugerirFuncion } from "../comun/js/entrada/lenguaje.js";
import { lanza, cerca } from "./ayuda.mjs";

const valor = (texto, ambito) => analizarFuncion(texto).evaluate(ambito);

// --- Alias ---------------------------------------------------------------------

test("normalizar reescribe los alias a la sintaxis de math.js", () => {
  assert.equal(normalizar("x**2"), "x^2");
  assert.equal(normalizar("ln(x) + sen(y)"), "log(x) + sin(y)");
  assert.equal(normalizar("tg(x)*arctan(y)"), "tan(x)*atan(y)");
  assert.equal(normalizar("|x - 1| + |y|"), "abs(x - 1) + abs(y)");
  assert.equal(normalizar("2×x − y÷3"), "2*x - y/3");
  assert.equal(normalizar("π·x² + x³"), "pi*x^2 + x^3");
});

test("normalizar no toca nombres que no son llamadas a función", () => {
  // `ln` y `sen` sin paréntesis son variables con ese nombre, no alias.
  assert.equal(normalizar("ln + sen*2"), "ln + sen*2");
  assert.equal(normalizar("seno(x)"), "seno(x)");
});

test("los alias dan el mismo valor que la forma canónica", () => {
  const s = { x: 0.7 };
  cerca(valor("ln(x)", s), Math.log(0.7));
  cerca(valor("e^x", s), Math.exp(0.7));
  cerca(valor("x**3", s), 0.7 ** 3);
  cerca(valor("sec(x)", s), 1 / Math.cos(0.7));
  cerca(valor("cot(x)", s), 1 / Math.tan(0.7));
  cerca(valor("sen(x) + tg(x)", s), Math.sin(0.7) + Math.tan(0.7));
  cerca(valor("|x - 2|", s), 1.3);
  cerca(valor("2x + 3(x + 1)", s), 2 * 0.7 + 3 * 1.7);
});

// --- Errores de sintaxis ---------------------------------------------------------

test("paréntesis sin cerrar y de sobra", () => {
  lanza(() => analizarFuncion("sin(x", 2), "parentesisSinCerrar", { indice: 2, faltan: 1 });
  lanza(() => analizarFuncion("((x + 1) * (y", 1), "parentesisSinCerrar", { indice: 1, faltan: 2 });
  lanza(() => analizarFuncion("x + 1)", 3), "parentesisSobra", { indice: 3, posicion: 6 });
});

test("expresiones incompletas o mal formadas", () => {
  lanza(() => analizarFuncion("   ", 1), "funcionVacia", { indice: 1 });
  lanza(() => analizarFuncion("x +", 1), "expresionIncompleta", { indice: 1 });
  lanza(() => analizarFuncion("x * * y", 1), "faltaValor");
  lanza(() => analizarFuncion("x + / y", 2), "faltaValor");
  lanza(() => analizarFuncion("x..2", 1), "sintaxis");
  lanza(() => analizarFuncion("1.2.3", 1), "parteInesperada", { indice: 1, parte: ".3", posicion: 4 });
  lanza(() => analizarFuncion("x, y", 1), "operadorInesperado", { indice: 1, operador: ",", posicion: 2 });
  lanza(() => analizarFuncion("3 $ x", 1), "nombreNoValido", { indice: 1, nombre: "$" });
});

test("solo se admiten expresiones escalares", () => {
  lanza(() => analizarFuncion("x = 3", 1), "expresionNoAdmitida", { indice: 1 });
  lanza(() => analizarFuncion("[x, y]", 1), "expresionNoAdmitida", { indice: 1 });
  lanza(() => analizarFuncion("x > 2", 1), "operadorNoAdmitido", { indice: 1, operador: ">" });
  lanza(() => analizarFuncion("x!", 1), "operadorNoAdmitido", { indice: 1, operador: "!" });
  lanza(() => analizarFuncion("x % 2", 1), "operadorNoAdmitido");
});

test("funciones desconocidas, con sugerencia cuando hay una parecida", () => {
  lanza(() => analizarFuncion("foo(x)", 1), "funcionDesconocida", { indice: 1, nombre: "foo" });
  lanza(() => analizarFuncion("sinn(x)", 2), "funcionDesconocidaSugerencia", { indice: 2, nombre: "sinn", sugerencia: "sin" });
  lanza(() => analizarFuncion("Cos(x)", 1), "funcionDesconocidaSugerencia", { indice: 1, nombre: "Cos", sugerencia: "cos" });
  lanza(() => analizarFuncion("sqr(x)", 1), "funcionDesconocidaSugerencia");
  assert.equal(sugerirFuncion("tanh"), "tanh");
  assert.equal(sugerirFuncion("exponencial"), null);
});

test("confusiones frecuentes tienen su propio error", () => {
  // x(y + 1) se lee como "función x".
  lanza(() => analizarFuncion("x(y + 1)", 1), "productoImplicito", { indice: 1, nombre: "x" });
  // Una función escrita sin su argumento.
  lanza(() => analizarFuncion("sin + x", 1), "funcionSinArgumento", { indice: 1, nombre: "sin" });
  lanza(() => analizarFuncion("2*ln", 1), "funcionSinArgumento", { indice: 1, nombre: "ln" });
  lanza(() => analizarFuncion("sin(x, y)", 1), "argumentosFuncion", { indice: 1, nombre: "sin", maximo: 1 });
  lanza(() => analizarFuncion("x + i", 1), "unidadImaginaria", { indice: 1 });
});

// --- Variables -------------------------------------------------------------------

const nodos = (...textos) => textos.map((t, k) => analizarFuncion(t, k + 1));

test("detectarVariables ignora constantes y funciones, y ordena de forma natural", () => {
  assert.deepEqual(detectarVariables(nodos("y*sin(x) + pi*e^z")), ["x", "y", "z"]);
  assert.deepEqual(detectarVariables(nodos("x10 + x2 + x1")), ["x1", "x2", "x10"]);
  assert.deepEqual(detectarVariables(nodos("r*cos(t)", "r*sin(t)")), ["r", "t"]);
  assert.deepEqual(detectarVariables(nodos("theta + phi*tau")), ["phi", "tau", "theta"]);
  assert.deepEqual(detectarVariables(nodos("2 + pi")), []);
});

test("en modo código un nombre de varias letras es una sola variable", () => {
  assert.deepEqual(detectarVariables(nodos("xy + peso*x")), ["peso", "x", "xy"]);
});

test("resolverOrden acepta una permutación y rechaza lo demás", () => {
  assert.deepEqual(resolverOrden(["f", "p", "t"]), ["f", "p", "t"]);
  assert.deepEqual(resolverOrden(["f", "p", "t"], " p , t, f "), ["p", "t", "f"]);
  lanza(() => resolverOrden(["f", "p", "t"], "p, t"), "ordenInvalido", { esperadas: "f, p, t" });
  lanza(() => resolverOrden(["f", "p", "t"], "p, t, z"), "ordenInvalido");
  lanza(() => resolverOrden(["f", "p", "t"], "p, p, t"), "ordenInvalido");
});

// --- Punto -----------------------------------------------------------------------

test("leerValores evalúa expresiones en el orden de las variables", () => {
  const x0 = leerValores(["a", "b", "c", "d"], { d: "sqrt(2)", a: "2", c: "-1e-3", b: "pi/6" });
  assert.deepEqual(x0, [2, Math.PI / 6, -0.001, Math.SQRT2]);
  assert.deepEqual(leerValores(["x"], { x: " 2**3 " }), [8]);
});

test("leerValores rechaza valores que faltan o no son números reales", () => {
  lanza(() => leerValores(["x", "y"], { x: "1" }), "valorFalta", { variable: "y" });
  lanza(() => leerValores(["x", "y"], { x: "1", y: "  " }), "valorFalta", { variable: "y" });
  lanza(() => leerValores(["x"], { x: "2+" }), "valorInvalido", { variable: "x", texto: "2+" });
  lanza(() => leerValores(["x"], { x: "hola" }), "valorInvalido", { variable: "x", texto: "hola" });
  lanza(() => leerValores(["x"], { x: "1/0" }), "valorNoFinito", { variable: "x" });
  lanza(() => leerValores(["x"], { x: "sqrt(-1)" }), "valorNoFinito", { variable: "x" });
});

// --- Entrada completa ------------------------------------------------------------

test("leerEntrada devuelve variables, árboles y punto", () => {
  const { vars, nodos: n, x0 } = leerEntrada({ funciones: ["r*cos(t)", "r*sin(t)"], valores: { r: "2", t: "0" } });
  assert.deepEqual(vars, ["r", "t"]);
  assert.equal(n.length, 2);
  assert.deepEqual(x0, [2, 0]);
});

test("leerEntrada respeta el orden pedido", () => {
  const { vars, x0 } = leerEntrada({ funciones: ["p*f + t"], valores: { p: "1", t: "2", f: "3" }, orden: "p, t, f" });
  assert.deepEqual(vars, ["p", "t", "f"]);
  assert.deepEqual(x0, [1, 2, 3]);
});

test("leerEntrada rechaza listas vacías, filas vacías y funciones sin variables", () => {
  lanza(() => leerEntrada({ funciones: [] }), "sinFunciones");
  lanza(() => leerEntrada({ funciones: ["", "  "] }), "sinFunciones");
  lanza(() => leerEntrada({ funciones: ["x", ""], valores: { x: "1" } }), "funcionVacia", { indice: 2 });
  lanza(() => leerEntrada({ funciones: ["2 + pi"] }), "sinVariables");
});

test("analizarEntrada no lanza y describe cada fila", () => {
  const a = analizarEntrada({ funciones: ["x*y", "", "sin(z", "foo(w)"] });
  assert.ok(a.filas[0].nodo);
  assert.ok(a.filas[1].vacia);
  assert.equal(a.filas[2].error.codigo, "parentesisSinCerrar");
  assert.equal(a.filas[3].error.codigo, "funcionDesconocida");
  // Solo cuentan las variables de las filas válidas.
  assert.deepEqual(a.variables, ["x", "y"]);
  assert.equal(a.errorOrden, null);
});

test("analizarEntrada informa de un orden no válido sin perder las variables", () => {
  const a = analizarEntrada({ funciones: ["x*y"], orden: "y, z" });
  assert.deepEqual(a.variables, ["x", "y"]);
  assert.equal(a.errorOrden.codigo, "ordenInvalido");
});
