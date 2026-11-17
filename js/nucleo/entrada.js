// Lectura y validación de la entrada: funciones, variables y punto.
//
// Las funciones llegan como texto en la sintaxis de "código" (`x^2*y`); el
// editor visual se convierte antes a ese texto en `latex-a-codigo.js`, de modo
// que toda la validación pasa por un único sitio.

import { math } from "../lib/mathjs.js";
import { ErrorCalculo } from "./errores.js";
import { ALIAS_FUNCION, CONSTANTES, FUNCIONES, MAX_ARGUMENTOS, resolverFuncion, sugerirFuncion } from "./lenguaje.js";

/** Devuelve el número si es real y finito; si no, lanza el error indicado. */
export function numeroFinito(valor, codigo, datos) {
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    throw new ErrorCalculo(codigo, datos);
  }
  return valor;
}

// --- Alias -------------------------------------------------------------------

const SIMBOLOS = [
  [/[×·⋅∗]/g, "*"], [/÷/g, "/"], [/[−–]/g, "-"], [/π/g, "pi"],
  [/²/g, "^2"], [/³/g, "^3"], [/\*\*/g, "^"],
];

/**
 * Reescribe las formas alternativas a la sintaxis de math.js:
 *   `**` -> `^`,  `|x|` -> `abs(x)`,  `ln(` -> `log(`,  `sen(` -> `sin(`, `×` -> `*`…
 * `e^x`, `sec` y `cot` ya los entiende math.js y no necesitan cambio.
 */
export function normalizar(texto) {
  let t = texto;
  for (const [patron, reemplazo] of SIMBOLOS) t = t.replace(patron, reemplazo);
  // Barras de valor absoluto sin anidar: |x - 1| -> abs(x - 1).
  t = t.replace(/\|([^|]*)\|/g, "abs($1)");
  // Alias de funciones, solo cuando van seguidos de "(".
  t = t.replace(/[A-Za-z]+(?=\s*\()/g, (nombre) => ALIAS_FUNCION[nombre] ?? nombre);
  return t;
}

// --- Una función -------------------------------------------------------------

function comprobarParentesis(texto, indice) {
  let abiertos = 0;
  for (let k = 0; k < texto.length; k++) {
    if (texto[k] === "(") abiertos++;
    if (texto[k] === ")" && --abiertos < 0) {
      throw new ErrorCalculo("parentesisSobra", { indice, posicion: k + 1 });
    }
  }
  if (abiertos > 0) throw new ErrorCalculo("parentesisSinCerrar", { indice, faltan: abiertos });
}

/** Convierte el mensaje (en inglés) de un error de sintaxis de math.js en un código nuestro. */
function errorDeSintaxis(err, texto, indice) {
  const mensaje = String(err && err.message);
  const posicion = Number((/\(char (\d+)\)/.exec(mensaje) ?? [])[1]) || null;
  let m;
  if (/Unexpected end of expression/.test(mensaje)) {
    return new ErrorCalculo("expresionIncompleta", { indice });
  }
  if (/Value expected/.test(mensaje) && posicion) {
    return new ErrorCalculo("faltaValor", { indice, posicion, cerca: texto.slice(Math.max(0, posicion - 4), posicion + 2).trim() });
  }
  if ((m = /Unexpected operator (\S+)/.exec(mensaje)) && posicion) {
    return new ErrorCalculo("operadorInesperado", { indice, operador: m[1], posicion });
  }
  if ((m = /Unexpected part "(.*)" \(char/.exec(mensaje)) && posicion) {
    return new ErrorCalculo("parteInesperada", { indice, parte: m[1], posicion });
  }
  return new ErrorCalculo("sintaxis", { indice });
}

const OPERADORES = new Set(["add", "subtract", "multiply", "divide", "pow", "unaryMinus", "unaryPlus"]);

/** Rechaza todo lo que no sea una expresión escalar con funciones admitidas. */
function validarArbol(nodo, indice) {
  nodo.traverse((n, ruta) => {
    if (n.isParenthesisNode) return;
    if (n.isConstantNode) {
      if (typeof n.value !== "number") throw new ErrorCalculo("expresionNoAdmitida", { indice });
      return;
    }
    if (n.isOperatorNode) {
      if (!OPERADORES.has(n.fn)) throw new ErrorCalculo("operadorNoAdmitido", { indice, operador: n.op });
      return;
    }
    if (n.isFunctionNode) {
      const nombre = n.fn && n.fn.name;
      if (!nombre) throw new ErrorCalculo("expresionNoAdmitida", { indice });
      if (!FUNCIONES.includes(nombre)) {
        // `x(y+1)` se lee como "función x": casi siempre era un producto.
        if (nombre.length === 1) throw new ErrorCalculo("productoImplicito", { indice, nombre });
        const sugerencia = sugerirFuncion(nombre);
        throw sugerencia
          ? new ErrorCalculo("funcionDesconocidaSugerencia", { indice, nombre, sugerencia })
          : new ErrorCalculo("funcionDesconocida", { indice, nombre });
      }
      const maximo = MAX_ARGUMENTOS[nombre] ?? 1;
      if (n.args.length < 1 || n.args.length > maximo) {
        throw new ErrorCalculo("argumentosFuncion", { indice, nombre, maximo });
      }
      return;
    }
    if (n.isSymbolNode) {
      if (ruta === "fn") return; // nombre de función, ya comprobado arriba
      if (n.name === "i") throw new ErrorCalculo("unidadImaginaria", { indice });
      // math.js acepta nombres como `$` o `ñ`; aquí solo letras, dígitos y guion bajo.
      if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(n.name)) throw new ErrorCalculo("nombreNoValido", { indice, nombre: n.name });
      if (resolverFuncion(n.name)) throw new ErrorCalculo("funcionSinArgumento", { indice, nombre: n.name });
      return;
    }
    // Asignaciones, matrices, comparaciones, rangos, etc.
    throw new ErrorCalculo("expresionNoAdmitida", { indice });
  });
}

/** Texto de una función -> árbol de math.js validado. */
export function analizarFuncion(texto, indice = 1) {
  const normalizado = normalizar(texto).trim();
  if (normalizado === "") throw new ErrorCalculo("funcionVacia", { indice });
  comprobarParentesis(normalizado, indice);
  let nodo;
  try {
    nodo = math.parse(normalizado);
  } catch (err) {
    throw errorDeSintaxis(err, normalizado, indice);
  }
  validarArbol(nodo, indice);
  return nodo;
}

// --- Variables ---------------------------------------------------------------

/** Variables de un árbol: todos los símbolos que no son constantes ni nombres de función. */
export function variablesDe(nodo) {
  const nombres = new Set();
  nodo.traverse((n, ruta) => {
    if (n.isSymbolNode && ruta !== "fn" && !CONSTANTES.includes(n.name)) nombres.add(n.name);
  });
  return nombres;
}

/** Variables de todas las funciones, en orden alfabético (x1 < x2 < x10). */
export function detectarVariables(nodos) {
  const nombres = new Set();
  for (const nodo of nodos) for (const v of variablesDe(nodo)) nombres.add(v);
  return [...nombres].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}

/**
 * Orden final de las variables. Sin `ordenTexto` es el alfabético; con él
 * ("p, t, f") debe nombrar exactamente las variables detectadas.
 */
export function resolverOrden(detectadas, ordenTexto = "") {
  const pedido = ordenTexto.split(",").map((t) => t.trim()).filter((t) => t !== "");
  if (!pedido.length) return detectadas;
  const esPermutacion = pedido.length === detectadas.length
    && new Set(pedido).size === pedido.length
    && pedido.every((v) => detectadas.includes(v));
  if (!esPermutacion) throw new ErrorCalculo("ordenInvalido", { esperadas: detectadas.join(", ") });
  return pedido;
}

// --- Punto -------------------------------------------------------------------

/** { x: "2", y: "pi/6" } -> [2, 0.5235…], en el orden de `vars`. */
export function leerValores(vars, valores) {
  return vars.map((variable) => {
    const texto = String(valores[variable] ?? "").trim();
    if (texto === "") throw new ErrorCalculo("valorFalta", { variable });
    let valor;
    try {
      valor = math.evaluate(normalizar(texto));
    } catch {
      throw new ErrorCalculo("valorInvalido", { variable, texto });
    }
    if (typeof valor !== "number") throw new ErrorCalculo("valorNoFinito", { variable });
    return numeroFinito(valor, "valorNoFinito", { variable });
  });
}

// --- Entrada completa --------------------------------------------------------

/**
 * Entrada en texto ({ funciones[], valores{}, orden }) -> { vars, nodos, x0 }.
 * Lanza el primer error que encuentra.
 */
export function leerEntrada({ funciones, valores = {}, orden = "" }) {
  if (!funciones.length || funciones.every((f) => f.trim() === "")) throw new ErrorCalculo("sinFunciones");
  const nodos = funciones.map((texto, k) => analizarFuncion(texto, k + 1));
  const vars = resolverOrden(detectarVariables(nodos), orden);
  if (!vars.length) throw new ErrorCalculo("sinVariables");
  const x0 = leerValores(vars, valores);
  return { vars, nodos, x0 };
}

/**
 * Versión tolerante para la interfaz en vivo: nunca lanza. Devuelve, por cada
 * función, su árbol o su error, y las variables detectadas hasta el momento.
 */
export function analizarEntrada({ funciones, orden = "" }) {
  const filas = funciones.map((texto, k) => {
    if (texto.trim() === "") return { vacia: true };
    try {
      return { nodo: analizarFuncion(texto, k + 1) };
    } catch (error) {
      return { error };
    }
  });
  const detectadas = detectarVariables(filas.filter((f) => f.nodo).map((f) => f.nodo));
  let variables = detectadas;
  let errorOrden = null;
  try {
    variables = resolverOrden(detectadas, orden);
  } catch (error) {
    errorOrden = error;
  }
  return { filas, variables, errorOrden };
}
