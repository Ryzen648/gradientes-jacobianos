// Árbol de math.js -> LaTeX legible, como se escribiría a mano.
//
//   2 * x                      ->  2x
//   y * exp(x * y)             ->  y e^{xy}
//   -(r * sin(t))              ->  -r \sin(t)
//   (1 / 2) / sqrt(x1)         ->  \frac{1}{2\sqrt{x_1}}
//
// `toTex()` de math.js es fiel al árbol (pone un \cdot por cada producto y
// respeta cada paréntesis), pero el resultado cuesta de leer. Aquí cada
// término de una suma se lleva a la forma  ± (coef · factores) / (coef · factores):
//   - los signos se sacan delante y las restas se aplanan;
//   - las constantes se multiplican en un único coeficiente;
//   - las divisiones y los exponentes negativos se juntan en una sola fracción;
//   - el producto se escribe por yuxtaposición, con las variables primero.
// No cambia el valor de la expresión: solo cómo se escribe. Lo que produce lo
// vuelve a leer `latex-a-codigo.js` (las pruebas comprueban la ida y vuelta).

import { esGriega } from "./lenguaje.js";

/** Nombre de variable: `x` -> x, `x1` -> x_{1}, `theta` -> \theta, `peso` -> \mathit{peso}. */
export function nombreTex(nombre) {
  const m = /^([A-Za-z]+?)(\d+)$/.exec(nombre);
  const raiz = m ? m[1] : nombre;
  const subindice = m ? `_{${m[2]}}` : "";
  if (esGriega(raiz)) return `\\${raiz}${subindice}`;
  if (raiz.length === 1) return `${raiz}${subindice}`;
  return `\\mathit{${nombre.replace(/_/g, "\\_")}}`;
}

/** Número dentro de una fórmula: sin ruido de coma flotante y sin notación `1e-7`. */
function constanteTex(v) {
  if (!Number.isFinite(v)) return `\\text{${String(v)}}`;
  const texto = String(Number(v.toPrecision(12)));
  if (!texto.includes("e")) return texto;
  const [mantisa, exponente] = texto.split("e");
  const potencia = `10^{${Number(exponente)}}`;
  return mantisa === "1" ? potencia : `${mantisa}\\times ${potencia}`;
}

const COMANDO = Object.freeze({
  sin: "\\sin", cos: "\\cos", tan: "\\tan", sec: "\\sec", csc: "\\csc", cot: "\\cot",
  sinh: "\\sinh", cosh: "\\cosh", tanh: "\\tanh", coth: "\\coth",
  sech: "\\operatorname{sech}", csch: "\\operatorname{csch}",
  asin: "\\arcsin", acos: "\\arccos", atan: "\\arctan",
  asec: "\\sec^{-1}", acsc: "\\csc^{-1}", acot: "\\cot^{-1}",
  asinh: "\\sinh^{-1}", acosh: "\\cosh^{-1}", atanh: "\\tanh^{-1}",
  log: "\\ln", log10: "\\log_{10}",
});

// --- Lectura del árbol ---------------------------------------------------------

function desenvolver(nodo) {
  let n = nodo;
  while (n.isParenthesisNode) n = n.content;
  return n;
}

const esNumero = (n) => n.isConstantNode && typeof n.value === "number";
const esOperador = (n, ...fns) => n.isOperatorNode && fns.includes(n.fn);
const esSuma = (n) => esOperador(n, "add", "subtract");

/** Valor de un subárbol que es solo un número (2, -2, 1/2); `null` si no lo es. */
function valorConstante(nodo) {
  const n = desenvolver(nodo);
  if (esNumero(n)) return n.value;
  if (esOperador(n, "unaryMinus")) {
    const v = valorConstante(n.args[0]);
    return v === null ? null : -v;
  }
  if (esOperador(n, "divide")) {
    const a = valorConstante(n.args[0]);
    const b = valorConstante(n.args[1]);
    return a === null || b === null || b === 0 ? null : a / b;
  }
  return null;
}

function contieneDivision(nodo) {
  let hay = false;
  nodo.traverse((n) => { if (esOperador(n, "divide")) hay = true; });
  return hay;
}

/** Aplana una suma en términos con signo: a - (b - c) -> [+a, -b, +c]. */
function terminos(nodo, signo, salida) {
  const n = desenvolver(nodo);
  if (esOperador(n, "add")) {
    terminos(n.args[0], signo, salida);
    terminos(n.args[1], signo, salida);
  } else if (esOperador(n, "subtract")) {
    terminos(n.args[0], signo, salida);
    terminos(n.args[1], -signo, salida);
  } else if (esOperador(n, "unaryMinus") && esSuma(desenvolver(n.args[0]))) {
    terminos(n.args[0], -signo, salida);
  } else if (esOperador(n, "unaryPlus")) {
    terminos(n.args[0], signo, salida);
  } else {
    salida.push({ signo, nodo: n });
  }
}

/**
 * Lleva un término (sin sumas en el nivel superior) a
 *   signo · (num · arriba…) / (den · abajo…)
 * con `num` y `den` números positivos y el resto factores sin evaluar.
 * Un factor es `{ nodo }` o `{ base, exp }` (potencia con exponente numérico).
 */
function descomponer(nodo) {
  const p = { signo: 1, num: 1, den: 1, arriba: [], abajo: [] };

  const acumular = (n0, enNumerador) => {
    const n = desenvolver(n0);
    if (esNumero(n)) {
      if (n.value < 0) p.signo = -p.signo;
      if (enNumerador) p.num *= Math.abs(n.value); else p.den *= Math.abs(n.value);
    } else if (esOperador(n, "multiply")) {
      n.args.forEach((a) => acumular(a, enNumerador));
    } else if (esOperador(n, "divide")) {
      acumular(n.args[0], enNumerador);
      acumular(n.args[1], !enNumerador);
    } else if (esOperador(n, "unaryMinus")) {
      p.signo = -p.signo;
      acumular(n.args[0], enNumerador);
    } else if (esOperador(n, "unaryPlus")) {
      acumular(n.args[0], enNumerador);
    } else if (esOperador(n, "pow") && valorConstante(n.args[1]) !== null && valorConstante(n.args[1]) < 0) {
      // x^(-2) en el numerador es x^2 en el denominador.
      (enNumerador ? p.abajo : p.arriba).push({ base: n.args[0], exp: -valorConstante(n.args[1]) });
    } else {
      (enNumerador ? p.arriba : p.abajo).push({ nodo: n });
    }
  };
  acumular(nodo, true);

  // Coeficiente: fracción irreducible si es de enteros, decimal si no.
  if (Number.isInteger(p.num) && Number.isInteger(p.den) && p.den !== 0) {
    const mcd = (a, b) => (b === 0 ? a : mcd(b, a % b));
    const d = mcd(p.num, p.den) || 1;
    p.num /= d;
    p.den /= d;
  } else if (p.den !== 0) {
    p.num /= p.den;
    p.den = 1;
  }
  return p;
}

// --- Escritura -----------------------------------------------------------------

function simboloTex(nombre) {
  if (nombre === "pi") return "\\pi";
  return nombreTex(nombre);
}

function funcionTex(n) {
  const nombre = n.fn.name;
  const arg = expresionTex(n.args[0]);
  if (nombre === "exp") {
    // e^{…} salvo que el exponente lleve una fracción, que arriba quedaría diminuta.
    return contieneDivision(n.args[0]) ? `\\exp\\left(${arg}\\right)` : `e^{${arg}}`;
  }
  if (nombre === "sqrt") return `\\sqrt{${arg}}`;
  if (nombre === "cbrt") return `\\sqrt[3]{${arg}}`;
  if (nombre === "nthRoot") return n.args[1] ? `\\sqrt[${expresionTex(n.args[1])}]{${arg}}` : `\\sqrt{${arg}}`;
  if (nombre === "abs") return `\\left|${arg}\\right|`;
  if (COMANDO[nombre]) return `${COMANDO[nombre]}\\left(${arg}\\right)`;
  return n.toTex(); // no debería ocurrir: `entrada.js` solo admite las funciones de arriba
}

/** base^exp, con `exp` numérico (`expNumero`) o como subárbol (`expNodo`). */
function potenciaTex(baseNodo, expNumero, expNodo) {
  const base = desenvolver(baseNodo);
  const e = expNumero ?? valorConstante(expNodo);
  if (e === 1) return factorTex({ nodo: base });
  if (e === 0.5) return `\\sqrt{${expresionTex(base)}}`;
  const expTex = expNodo ? expresionTex(expNodo) : constanteTex(e);

  // (e^a)^2 se escribe e^{2a}.
  if (base.isFunctionNode && base.fn.name === "exp" && e !== null && !contieneDivision(base.args[0])) {
    const arg = desenvolver(base.args[0]);
    const argTex = esSuma(arg) ? `\\left(${expresionTex(arg)}\\right)` : expresionTex(arg);
    return `e^{${e === -1 ? "-" : constanteTex(e) + " "}${argTex}}`;
  }

  // sin(x)^2 se escribe sin²(x), como en los libros.
  const esFuncionConComando = base.isFunctionNode && COMANDO[base.fn.name] && !COMANDO[base.fn.name].includes("^");
  if (esFuncionConComando && Number.isInteger(e) && e >= 2) {
    return `${COMANDO[base.fn.name]}^{${expTex}}\\left(${expresionTex(base.args[0])}\\right)`;
  }

  let baseTex;
  if (base.isSymbolNode) baseTex = simboloTex(base.name);
  else if (esNumero(base) && base.value >= 0) baseTex = constanteTex(base.value);
  else if (base.isFunctionNode && base.fn.name === "abs") baseTex = funcionTex(base);
  else baseTex = `\\left(${expresionTex(base)}\\right)`;
  return `${baseTex}^{${expTex}}`;
}

function factorTex(f) {
  if (f.base) return potenciaTex(f.base, f.exp, null);
  const n = f.nodo;
  if (n.isSymbolNode) return simboloTex(n.name);
  if (n.isFunctionNode) return funcionTex(n);
  if (esNumero(n)) return constanteTex(n.value);
  if (esOperador(n, "pow")) return potenciaTex(n.args[0], null, n.args[1]);
  if (n.isOperatorNode) return `\\left(${expresionTex(n)}\\right)`; // una suma dentro de un producto
  return n.toTex();
}

/** Base de un factor: la de la potencia, o el propio factor si no es una potencia. */
function baseDe(f) {
  const n = f.base ? desenvolver(f.base) : f.nodo;
  return !f.base && esOperador(n, "pow") ? desenvolver(n.args[0]) : n;
}

/**
 * Orden dentro de un producto, como se escribe a mano:
 * potencias de números (2^x), variables, exponenciales, funciones y, al final, sumas.
 */
function clase(f) {
  const base = baseDe(f);
  if (esNumero(base)) return 0;
  if (base.isSymbolNode) return 1;
  if (base.isFunctionNode && base.fn.name === "exp") return 2;
  if (!f.base && esSuma(f.nodo)) return 4;
  return 3;
}

/** Entre factores de la misma clase se conserva el orden, salvo las variables: alfabético. */
function comparar(a, b) {
  if (a.c !== b.c) return a.c - b.c;
  if (a.c === 1) {
    const orden = baseDe(a.f).name.localeCompare(baseDe(b.f).name, "es", { numeric: true });
    if (orden !== 0) return orden;
  }
  return a.k - b.k;
}

/** Une factores por yuxtaposición; solo hace falta \cdot delante de un número (3 · 2^x). */
function unir(partes) {
  let s = "";
  for (const parte of partes) {
    if (s === "") s = parte;
    else s += (/^[\d.]/.test(parte) ? " \\cdot " : " ") + parte;
  }
  return s;
}

function ladoTex(coeficiente, factores) {
  // Una suma sola en el numerador o el denominador no necesita paréntesis.
  if (coeficiente === 1 && factores.length === 1 && !factores[0].base && esSuma(factores[0].nodo)) {
    return expresionTex(factores[0].nodo);
  }
  const ordenados = factores
    .map((f, k) => ({ f, k, c: clase(f) }))
    .sort(comparar)
    .map((x) => factorTex(x.f));
  const partes = coeficiente !== 1 || !ordenados.length ? [constanteTex(coeficiente), ...ordenados] : ordenados;
  return unir(partes);
}

/** Un término sin su signo: { signo, tex }. */
function terminoTex(nodo) {
  const p = descomponer(nodo);
  if (p.num === 0) return { signo: 1, tex: "0" };
  const numerador = ladoTex(p.num, p.arriba);
  if (p.den === 1 && !p.abajo.length) return { signo: p.signo, tex: numerador };
  return { signo: p.signo, tex: `\\frac{${numerador}}{${ladoTex(p.den, p.abajo)}}` };
}

/** Árbol de math.js -> LaTeX legible. */
export function expresionTex(nodo) {
  const lista = [];
  terminos(nodo, 1, lista);
  let s = "";
  lista.forEach((termino, k) => {
    const { signo, tex } = terminoTex(termino.nodo);
    const negativo = termino.signo * signo < 0;
    if (k === 0) s = (negativo ? "-" : "") + tex;
    else s += (negativo ? " - " : " + ") + tex;
  });
  return s;
}
