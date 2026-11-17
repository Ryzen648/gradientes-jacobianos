// Convierte el LaTeX del editor visual (MathLive) a la sintaxis de código.
//
//   \frac{x^2}{y}+\sin\left(xy\right)   ->   ((x^(2))/(y))+sin(x*y)
//
// Es un analizador descendente recursivo sobre el subconjunto de LaTeX que
// producen el editor y `nodoTex`. La salida pasa después por
// `analizarFuncion`, que es quien valida de verdad; aquí solo se traduce.
// Reglas propias de la notación matemática:
//   - cada letra es una variable: `xy` es x·y (en modo código `xy` es UNA variable);
//   - `x_1` es la variable `x1`, `\theta` es `theta`;
//   - `\sin 2x` es sin(2·x) y `\sin^2 x` es (sin x)².

import { ErrorCalculo } from "./errores.js";
import { GRIEGAS, INVERSAS, resolverFuncion } from "./lenguaje.js";

// Comandos que solo dan formato o espacio: se ignoran.
const SIN_SIGNIFICADO = new Set([
  ",", ";", "!", ":", " ", "quad", "qquad", "enspace", "displaystyle", "textstyle", "limits", "nolimits",
]);
const MULTIPLICA = new Set(["cdot", "times", "ast"]);
const FRACCION = new Set(["frac", "dfrac", "tfrac", "cfrac"]);
const ENVOLTORIO_DE_NOMBRE = new Set(["mathrm", "operatorname", "mathit", "text", "mathbf"]);
const COMANDO_FUNCION = Object.freeze({
  sin: "sin", cos: "cos", tan: "tan", sec: "sec", csc: "csc", cot: "cot",
  sinh: "sinh", cosh: "cosh", tanh: "tanh", coth: "coth",
  arcsin: "asin", arccos: "acos", arctan: "atan",
  ln: "log", log: "log", exp: "exp", lg: "log10",
});

/** LaTeX -> lista de fichas: num, letra, cmd, sim, abre, cierra, barra. */
function fichas(latex) {
  const crudas = [];
  let i = 0;
  while (i < latex.length) {
    const c = latex[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "\\") {
      let j = i + 1;
      if (/[A-Za-z]/.test(latex[j] ?? "")) while (/[A-Za-z]/.test(latex[j] ?? "")) j++;
      else j++;
      const nombre = latex.slice(i + 1, j);
      if (!SIN_SIGNIFICADO.has(nombre)) crudas.push({ t: "cmd", v: nombre });
      i = j;
    } else if (/[0-9.]/.test(c)) {
      let j = i;
      while (/[0-9.]/.test(latex[j] ?? "")) j++;
      crudas.push({ t: "num", v: latex.slice(i, j) });
      i = j;
    } else if (/[A-Za-z]/.test(c)) {
      // Texto pegado como `sin(x)` llega en letras sueltas: si deletrean una
      // función y sigue un paréntesis, es esa función y no el producto s·i·n.
      const palabra = /^[A-Za-z]+/.exec(latex.slice(i))[0];
      const sigueParentesis = /^\s*(\\left\s*)?\(/.test(latex.slice(i + palabra.length));
      if (palabra.length > 1 && sigueParentesis && resolverFuncion(palabra)) {
        crudas.push({ t: "cmd", v: "operatorname" }, { t: "sim", v: "{" });
        for (const letra of palabra) crudas.push({ t: "letra", v: letra });
        crudas.push({ t: "sim", v: "}" });
        i += palabra.length;
      } else {
        crudas.push({ t: "letra", v: c });
        i++;
      }
    } else {
      crudas.push({ t: "sim", v: c });
      i++;
    }
  }

  // Segunda pasada: une \left( y \right), y distingue paréntesis y barras.
  const esBarra = (f) => f && ((f.t === "sim" && f.v === "|") || (f.t === "cmd" && ["vert", "lvert", "rvert"].includes(f.v)));
  const salida = [];
  for (let k = 0; k < crudas.length; k++) {
    const f = crudas[k];
    const sig = crudas[k + 1];
    if (f.t === "cmd" && (f.v === "left" || f.v === "mleft")) {
      k++;
      if (esBarra(sig)) salida.push({ t: "abre", v: "|" });
      else if (sig && sig.t === "sim" && "([".includes(sig.v)) salida.push({ t: "abre", v: "(" });
      else if (sig && sig.t === "cmd" && sig.v === "lparen") salida.push({ t: "abre", v: "(" });
      else if (!(sig && sig.t === "sim" && sig.v === ".")) salida.push({ t: "sim", v: sig ? sig.v : "\\left" });
    } else if (f.t === "cmd" && (f.v === "right" || f.v === "mright")) {
      k++;
      if (esBarra(sig)) salida.push({ t: "cierra", v: "|" });
      else if (sig && sig.t === "sim" && ")]".includes(sig.v)) salida.push({ t: "cierra", v: ")" });
      else if (sig && sig.t === "cmd" && sig.v === "rparen") salida.push({ t: "cierra", v: ")" });
      // `\right.` es un paréntesis que el editor dejó abierto.
      else salida.push({ t: "cierra", v: "." });
    } else if (f.t === "cmd" && f.v === "lparen") salida.push({ t: "abre", v: "(" });
    else if (f.t === "cmd" && f.v === "rparen") salida.push({ t: "cierra", v: ")" });
    else if (f.t === "cmd" && f.v === "lvert") salida.push({ t: "abre", v: "|" });
    else if (f.t === "cmd" && f.v === "rvert") salida.push({ t: "cierra", v: "|" });
    else if (f.t === "sim" && f.v === "(") salida.push({ t: "abre", v: "(" });
    else if (f.t === "sim" && f.v === ")") salida.push({ t: "cierra", v: ")" });
    else if (esBarra(f)) salida.push({ t: "barra" });
    else salida.push(f);
  }
  return salida;
}

/**
 * @param {string} latex  contenido del editor visual
 * @param {number} indice número de la función, para los mensajes de error
 * @returns {string} la misma expresión en sintaxis de código ("" si está vacía)
 * @throws {ErrorCalculo}
 */
export function latexACodigo(latex, indice = 1) {
  const lista = fichas(latex);
  let pos = 0;

  const mirar = () => lista[pos];
  const tomar = () => lista[pos++];
  const esSim = (f, v) => Boolean(f) && f.t === "sim" && f.v === v;
  const incompleto = () => new ErrorCalculo("visualIncompleto", { indice });
  const noAdmitido = (simbolo) => new ErrorCalculo("visualNoAdmitido", { indice, simbolo });
  const textoDe = (f) => (f.t === "cmd" ? `\\${f.v}` : f.v ?? "|");

  function esperarSim(v) {
    if (!esSim(mirar(), v)) throw incompleto();
    pos++;
  }
  function esperarCierre(v) {
    const f = tomar();
    if (!f) throw new ErrorCalculo("parentesisSinCerrar", { indice, faltan: 1 });
    if (f.t === "cierra" && f.v === ".") throw new ErrorCalculo("parentesisSinCerrar", { indice, faltan: 1 });
    if (f.t !== "cierra" || f.v !== v) throw noAdmitido(textoDe(f));
  }

  const esMultiplica = (f) => Boolean(f) && (esSim(f, "*") || (f.t === "cmd" && MULTIPLICA.has(f.v)));
  const esDivide = (f) => Boolean(f) && (esSim(f, "/") || (f.t === "cmd" && f.v === "div"));

  /** ¿Empieza aquí un factor? (decide si hay un producto implícito) */
  function iniciaFactor(f, enBarras) {
    if (!f) return false;
    if (f.t === "num" || f.t === "letra" || f.t === "abre") return true;
    if (f.t === "barra") return !enBarras; // dentro de |…| una barra cierra, no abre
    if (f.t === "sim") return f.v === "{";
    if (f.t === "cmd") return !MULTIPLICA.has(f.v) && f.v !== "div";
    return false;
  }

  function expresion(enBarras) {
    let s = "";
    if (esSim(mirar(), "-")) { pos++; s = "-"; } else if (esSim(mirar(), "+")) pos++;
    s += termino(enBarras);
    while (esSim(mirar(), "+") || esSim(mirar(), "-")) s += tomar().v + termino(enBarras);
    return s;
  }

  function termino(enBarras) {
    let s = factor(enBarras);
    for (;;) {
      const f = mirar();
      if (esMultiplica(f)) { pos++; s += `*${factorConSigno(enBarras)}`; }
      else if (esDivide(f)) { pos++; s += `/${factorConSigno(enBarras)}`; }
      else if (iniciaFactor(f, enBarras)) s += `*${factor(enBarras)}`;
      else return s;
    }
  }

  function factorConSigno(enBarras) {
    if (esSim(mirar(), "-")) { pos++; return `(-${factor(enBarras)})`; }
    if (esSim(mirar(), "+")) pos++;
    return factor(enBarras);
  }

  function factor(enBarras) {
    let b = base(enBarras);
    while (esSim(mirar(), "^")) { pos++; b = `${b}^(${argumento()})`; }
    return b;
  }

  /** Argumento de ^, _, \frac o \sqrt: un grupo {…} o una sola ficha. */
  function argumento() {
    const f = mirar();
    if (!f) throw incompleto();
    if (esSim(f, "{")) {
      pos++;
      if (esSim(mirar(), "}")) throw new ErrorCalculo("visualHueco", { indice });
      const e = expresion(false);
      esperarSim("}");
      return e;
    }
    // En LaTeX `x^23` es x² · 3: sin llaves solo cuenta el primer dígito.
    if (f.t === "num" && f.v.length > 1) {
      const primero = f.v[0];
      f.v = f.v.slice(1);
      return primero;
    }
    return base(false);
  }

  /** Subíndice de un nombre: `_1`, `_{12}`, `_a`. */
  function subindice() {
    const f = tomar();
    if (!f) throw incompleto();
    if (f.t === "num" || f.t === "letra") return f.v;
    if (!esSim(f, "{")) throw noAdmitido(textoDe(f));
    let s = "";
    for (;;) {
      const g = tomar();
      if (!g) throw incompleto();
      if (esSim(g, "}")) break;
      if (g.t !== "num" && g.t !== "letra") throw noAdmitido(textoDe(g));
      s += g.v;
    }
    if (s === "") throw new ErrorCalculo("visualHueco", { indice });
    return s;
  }

  function nombre(raiz) {
    if (esSim(mirar(), "_")) { pos++; return raiz + subindice(); }
    return raiz;
  }

  function base(enBarras) {
    const f = tomar();
    if (!f) throw incompleto();
    if (f.t === "num") return f.v;
    if (f.t === "letra") return nombre(f.v);
    if (f.t === "abre" && f.v === "(") {
      const e = expresion(false);
      esperarCierre(")");
      return `(${e})`;
    }
    if (f.t === "abre" && f.v === "|") {
      const e = expresion(false);
      esperarCierre("|");
      return `abs(${e})`;
    }
    if (f.t === "barra") {
      const e = expresion(true);
      if (!mirar() || mirar().t !== "barra") throw incompleto();
      pos++;
      return `abs(${e})`;
    }
    if (esSim(f, "{")) {
      if (esSim(mirar(), "}")) throw new ErrorCalculo("visualHueco", { indice });
      const e = expresion(false);
      esperarSim("}");
      return `(${e})`;
    }
    if (f.t === "cmd") return comando(f.v, enBarras);
    throw noAdmitido(textoDe(f));
  }

  function comando(cmd, enBarras) {
    if (cmd === "placeholder") throw new ErrorCalculo("visualHueco", { indice });
    if (FRACCION.has(cmd)) {
      const numerador = argumento();
      const denominador = argumento();
      return `((${numerador})/(${denominador}))`;
    }
    if (cmd === "sqrt") {
      if (esSim(mirar(), "[")) {
        pos++;
        const n = expresion(false);
        esperarSim("]");
        return `nthRoot(${argumento()}, ${n})`;
      }
      return `sqrt(${argumento()})`;
    }
    if (cmd === "pi") return "pi";
    if (cmd === "exponentialE") return "e";
    if (cmd === "imaginaryI") return "i";
    if (GRIEGAS[cmd]) return nombre(GRIEGAS[cmd]);
    if (COMANDO_FUNCION[cmd]) return funcion(COMANDO_FUNCION[cmd], enBarras);
    if (ENVOLTORIO_DE_NOMBRE.has(cmd)) {
      esperarSim("{");
      let palabra = "";
      for (;;) {
        const g = tomar();
        if (!g) throw incompleto();
        if (esSim(g, "}")) break;
        if (g.t !== "letra" && g.t !== "num") throw noAdmitido(textoDe(g));
        palabra += g.v;
      }
      if (palabra === "") throw new ErrorCalculo("visualHueco", { indice });
      const fn = resolverFuncion(palabra);
      return fn ? funcion(fn, enBarras) : nombre(palabra);
    }
    throw noAdmitido(`\\${cmd}`);
  }

  function funcion(fnInicial, enBarras) {
    let fn = fnInicial;
    let potencia = null;
    let baseLog = null; // \log_b(x) se escribe como log(x)/log(b)
    // Base del logaritmo (\log_{10}) y potencia o inversa (\sin^2, \sin^{-1}).
    for (;;) {
      if (esSim(mirar(), "_")) {
        pos++;
        const b = argumento();
        if (fn !== "log") throw noAdmitido(`_${b}`);
        if (b === "10") fn = "log10";
        else baseLog = b;
      } else if (esSim(mirar(), "^")) {
        pos++;
        const p = argumento();
        if (p === "-1" && INVERSAS[fn]) fn = INVERSAS[fn];
        else potencia = p;
      } else break;
    }

    let arg;
    const f = mirar();
    if (f && f.t === "abre" && f.v === "(") {
      pos++;
      arg = expresion(false);
      esperarCierre(")");
    } else {
      // Sin paréntesis el argumento es el producto que sigue: \sin 2x = sin(2·x).
      arg = factor(enBarras);
      for (;;) {
        const g = mirar();
        const sigue = g && (g.t === "num" || g.t === "letra"
          || (g.t === "cmd" && (g.v === "pi" || GRIEGAS[g.v] || FRACCION.has(g.v) || g.v === "sqrt")));
        if (!sigue) break;
        arg += `*${factor(enBarras)}`;
      }
    }
    const llamada = baseLog === null ? `${fn}(${arg})` : `(log(${arg})/log(${baseLog}))`;
    return potencia === null ? llamada : `(${llamada})^(${potencia})`;
  }

  if (!lista.length) return "";
  const codigo = expresion(false);
  if (pos < lista.length) {
    const sobra = lista[pos];
    if (sobra.t === "cierra" && sobra.v === ")") throw new ErrorCalculo("parentesisSobra", { indice, posicion: pos + 1 });
    if (sobra.t === "cierra" && sobra.v === ".") throw new ErrorCalculo("parentesisSinCerrar", { indice, faltan: 1 });
    throw noAdmitido(textoDe(sobra));
  }
  return codigo;
}
