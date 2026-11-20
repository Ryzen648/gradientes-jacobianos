// Interfaz: conecta el formulario con el estado y pinta los resultados.
// Toda la matemática está en `js/nucleo`; aquí solo hay DOM.

import { mathDisponible } from "../../comun/js/mathjs.js";
import { calcular } from "../nucleo/calcular.js";
import { analizarEntrada, analizarFuncion } from "../nucleo/entrada.js";
import { latexACodigo } from "../../comun/js/entrada/latex-a-codigo.js";
import {
  resultadoTex, definicionTex, nodoTex, variableTex,
  FORMULA_DIFERENCIA_CENTRADA, CRITERIO_TEX, PASO_TEX, PRECISIONES, PRECISION_INICIAL,
} from "../nucleo/latex.js";
import { copiarAlPortapapeles } from "./portapapeles.js";
import { crearEstado } from "../estado.js";
import { leerFragmento, escribirFragmento } from "../estado-url.js";
import { EJEMPLOS, EJEMPLO_INICIAL, GRUPOS } from "../ejemplos.js";
import { t, mensajeDeError, aplicarTextos } from "../i18n/index.js";
import { cargarEditorVisual, crearCampoVisual, configurarCampoVisual } from "../../comun/js/editor-visual.js";
import { llevarAlResultado } from "../../comun/js/teclado-virtual.js";
import { conectarBotonTema } from "../../comun/js/tema.js";

const $ = (id) => document.getElementById(id);
const ESPERA_REFRESCO_MS = 350; // pausa al teclear antes de revisar errores y vista previa

const estado = crearEstado();

// Lo que solo interesa a la interfaz, por fila: el LaTeX tal como está en el
// editor visual y el error al convertirlo a código. El estado guarda siempre
// el código (la forma canónica).
let filas = [{ latex: null, error: null }];
let editorListo = false;        // MathLive ya está cargado
let variablesPintadas = null;   // variables que tienen campo de valor ahora mismo
let temporizador = null;
let ultimoResultado = null;     // para repintar al cambiar la precisión, sin recalcular
let textosParaCopiar = {};      // lo que copia cada botón: LaTeX o valores

const filaLimpia = () => ({ latex: null, error: null });
const enVisual = () => estado.obtener().modo === "visual" && editorListo;

function pintarTex(el, fuente, enBloque = true) {
  globalThis.katex.render(fuente, el, { displayMode: enBloque, throwOnError: false });
}

function crear(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

// --- Lista de funciones --------------------------------------------------------

function fijarFuncion(i, codigo) {
  const funciones = estado.obtener().funciones;
  funciones[i] = codigo;
  estado.actualizar({ funciones });
}

/** Código -> LaTeX para mostrarlo en el editor visual ("" si está vacío). */
function codigoALatex(codigo) {
  if (codigo.trim() === "") return "";
  const nodo = analizarFuncion(codigo);
  return nodoTex(nodo);
}

function crearCampoCodigo(i, codigo) {
  const campo = crear("input", "campo");
  campo.type = "text";
  campo.value = codigo;
  campo.placeholder = t("entrada.funcion.ejemploCodigo");
  campo.autocomplete = "off";
  campo.autocapitalize = "off";
  campo.spellcheck = false;
  campo.addEventListener("input", () => {
    filas[i] = filaLimpia();
    fijarFuncion(i, campo.value);
    programarRefresco();
  });
  campo.addEventListener("keydown", (e) => { if (e.key === "Enter") ejecutar(); });
  return campo;
}

function leerCampoVisual(i, campo) {
  const latex = campo.getValue("latex");
  let codigo = "";
  let error = null;
  try {
    codigo = latexACodigo(latex, i + 1);
  } catch (err) {
    error = err;
  }
  filas[i] = { latex, error };
  fijarFuncion(i, codigo);
  programarRefresco();
}

function pintarFilas() {
  const { funciones } = estado.obtener();
  const visual = enVisual();
  const lista = $("funciones");
  lista.replaceChildren();

  funciones.forEach((codigo, i) => {
    const indice = i + 1;
    const id = `f${indice}`;
    const li = crear("li", "funcion");

    const nombre = crear("label", "funcion-nombre");
    nombre.htmlFor = id;
    nombre.append("f");
    if (funciones.length > 1) nombre.append(crear("sub", null, String(indice)));
    nombre.append(" =");

    const campo = visual ? crearCampoVisual() : crearCampoCodigo(i, codigo);
    campo.id = id;
    campo.setAttribute("aria-label", t("entrada.funcion.etiqueta", { indice }));
    campo.setAttribute("aria-describedby", `${id}-error`);

    const quitar = crear("button", "quitar", "✕");
    quitar.type = "button";
    quitar.setAttribute("aria-label", t("entrada.funcion.quitar", { indice }));
    quitar.hidden = funciones.length === 1; // siempre queda al menos una función
    quitar.addEventListener("click", () => quitarFuncion(i));

    const error = crear("p", "error-fila");
    error.id = `${id}-error`;
    error.hidden = true;

    li.append(nombre, campo, quitar, error);
    lista.append(li);

    if (visual) {
      let latex = filas[i].latex;
      if (latex === null) {
        try { latex = codigoALatex(codigo); } catch { latex = ""; }
      }
      configurarCampoVisual(campo, latex);
      campo.addEventListener("input", () => leerCampoVisual(i, campo));
      campo.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); ejecutar(); }
      });
    }
  });
}

function enfocarFuncion(i) {
  const campo = $(`f${i + 1}`);
  if (campo) campo.focus();
}

function agregarFuncion() {
  const funciones = estado.obtener().funciones;
  funciones.push("");
  filas.push(filaLimpia());
  estado.actualizar({ funciones });
  pintarFilas();
  refrescar();
  enfocarFuncion(funciones.length - 1);
}

function quitarFuncion(i) {
  const funciones = estado.obtener().funciones;
  funciones.splice(i, 1);
  filas.splice(i, 1);
  estado.actualizar({ funciones });
  pintarFilas();
  refrescar();
  enfocarFuncion(Math.min(i, funciones.length - 1));
}

// --- Revisión en vivo: errores por fila, variables y vista previa -----------------

function pintarErrorFila(i, err) {
  const campo = $(`f${i + 1}`);
  const caja = $(`f${i + 1}-error`);
  if (!campo || !caja) return;
  caja.hidden = !err;
  caja.textContent = err ? mensajeDeError(err) : "";
  if (err) campo.setAttribute("aria-invalid", "true");
  else campo.removeAttribute("aria-invalid");
}

function pintarValores(variables) {
  if (variablesPintadas && variablesPintadas.join() === variables.join()) return; // no molestar al que escribe
  variablesPintadas = variables;
  const { valores } = estado.obtener();
  const caja = $("valores");
  caja.replaceChildren();
  if (!variables.length) {
    caja.append(crear("p", "hint", t("entrada.punto.sinVariables")));
    return;
  }
  for (const variable of variables) {
    const id = `v-${variable}`;
    const grupo = crear("div", "valor");
    const nombre = crear("label");
    nombre.htmlFor = id;
    pintarTex(nombre, `${variableTex(variable)} =`, false);

    const campo = crear("input", "campo");
    campo.id = id;
    campo.type = "text";
    campo.inputMode = "text";
    campo.value = valores[variable] ?? "";
    campo.autocomplete = "off";
    campo.autocapitalize = "off";
    campo.spellcheck = false;
    campo.setAttribute("aria-label", t("entrada.punto.valorDe", { variable }));
    campo.addEventListener("input", () => {
      campo.removeAttribute("aria-invalid");
      estado.actualizar({ valores: { ...estado.obtener().valores, [variable]: campo.value } });
    });
    campo.addEventListener("keydown", (e) => { if (e.key === "Enter") ejecutar(); });

    grupo.append(nombre, campo);
    caja.append(grupo);
  }
}

function pintarVistaPrevia(analisis, hayErrores) {
  const caja = $("vistaPrevia");
  const nodos = analisis.filas.filter((f) => f.nodo).map((f) => f.nodo);
  if (hayErrores || !nodos.length) {
    caja.replaceChildren(crear("p", "hint", t(hayErrores ? "entrada.vistaPrevia.conErrores" : "entrada.vistaPrevia.vacia")));
    return;
  }
  pintarTex(caja, definicionTex(nodos, analisis.variables));
}

function refrescar() {
  clearTimeout(temporizador);
  const e = estado.obtener();
  const analisis = analizarEntrada(e);
  let hayErrores = false;
  e.funciones.forEach((_, i) => {
    const err = filas[i].error ?? analisis.filas[i].error ?? null;
    if (err) hayErrores = true;
    pintarErrorFila(i, err);
  });
  pintarValores(analisis.variables);
  pintarVistaPrevia(analisis, hayErrores);

  const errorOrden = $("ordenError");
  errorOrden.hidden = !analisis.errorOrden;
  errorOrden.textContent = analisis.errorOrden ? mensajeDeError(analisis.errorOrden) : "";
}

function programarRefresco() {
  clearTimeout(temporizador);
  temporizador = setTimeout(refrescar, ESPERA_REFRESCO_MS);
}

// --- Modo visual / código -----------------------------------------------------------

function avisar(texto) {
  const aviso = $("avisoModo");
  aviso.hidden = !texto;
  aviso.textContent = texto ?? "";
}

function pintarModo() {
  const { modo } = estado.obtener();
  $("modoVisual").setAttribute("aria-pressed", String(modo === "visual"));
  $("modoCodigo").setAttribute("aria-pressed", String(modo === "codigo"));
}

/** Carga MathLive si hace falta. Si no se puede, deja la calculadora en modo código. */
async function asegurarEditor() {
  if (editorListo) return true;
  avisar(t("comun.modo.cargando"));
  try {
    await cargarEditorVisual();
    editorListo = true;
    avisar(null);
    return true;
  } catch {
    estado.actualizar({ modo: "codigo" });
    pintarModo();
    avisar(t("comun.modo.sinEditor"));
    return false;
  }
}

async function cambiarModo(modo) {
  if (estado.obtener().modo === modo && (modo === "codigo" || editorListo)) return;
  refrescar();
  // Cambiar de modo traduce cada función; con una función a medias se perdería lo escrito.
  const e = estado.obtener();
  const analisis = analizarEntrada(e);
  const mala = e.funciones.findIndex((_, i) => filas[i].error || analisis.filas[i].error);
  if (mala >= 0) {
    avisar(t("entrada.modo.corrige", { indice: mala + 1 }));
    enfocarFuncion(mala);
    return;
  }
  avisar(null);
  estado.actualizar({ modo });
  filas = filas.map(filaLimpia);
  pintarModo();
  if (modo === "visual" && !(await asegurarEditor())) return;
  pintarFilas();
  refrescar();
}

// --- Resultados --------------------------------------------------------------------

function mostrarResultado(r) {
  ultimoResultado = r;
  const tipo = r.esGradiente ? "gradiente" : "jacobiano";
  $("symTitle").textContent = t(`resultado.${tipo}.simbolico`, { filas: r.nodos.length, columnas: r.vars.length });
  $("valTitle").textContent = t(`resultado.${tipo}.valor`);

  const tex = resultadoTex(r, { decimales: estado.obtener().precision });
  textosParaCopiar = tex.copia;
  pintarTex($("dif"), tex.diferencia);
  pintarTex($("sym"), tex.simbolico);
  pintarTex($("val"), tex.valor);
  $("extra").hidden = !tex.extra;
  if (tex.extra) pintarTex($("extra"), tex.extra);
  pintarTex($("num"), tex.numerico);

  const insignia = $("badge");
  insignia.className = `badge ${r.coincide ? "ok" : "bad"}`;
  insignia.textContent = t(r.coincide ? "resultado.coinciden" : "resultado.noCoinciden", {
    error: r.error.toExponential(2),
  });

  $("results").hidden = false;
}

function mostrarError(err) {
  $("results").hidden = true;
  $("error").textContent = typeof err === "string" ? err : mensajeDeError(err);
  $("error").hidden = false;
  // Señala el campo culpable, si el error dice cuál es.
  const datos = (err && err.datos) || {};
  if (datos.indice) pintarErrorFila(datos.indice - 1, err);
  const campoValor = datos.variable ? $(`v-${datos.variable}`) : null;
  if (campoValor) campoValor.setAttribute("aria-invalid", "true");
}

/**
 * Escribe el cálculo en la URL (fragmento #) para poder compartirlo. Solo los
 * valores de las variables que aparecen en las funciones; la precisión, si no
 * es la inicial. replaceState: no llena el historial ni recarga la página.
 */
function guardarEnURL() {
  const e = estado.obtener();
  const { variables } = analizarEntrada(e);
  const valores = Object.fromEntries(variables.filter((v) => v in e.valores).map((v) => [v, e.valores[v]]));
  history.replaceState(null, "", escribirFragmento({
    funciones: e.funciones, valores, orden: e.orden,
    precision: e.precision === PRECISION_INICIAL ? undefined : e.precision,
  }));
}

/**
 * `desdeUsuario`: el cálculo lo pidió la persona (botón o Enter), no un ejemplo
 * al arrancar. Entonces se cierra el teclado en pantalla, que taparía la
 * respuesta, y si el resultado (o el error) no se ve, se lleva la vista hasta él.
 * `guardar`: escribir el cálculo en la URL (no al abrir la página sin enlace,
 * para no cambiar la dirección de quien solo entra).
 */
function ejecutar({ desdeUsuario = true, guardar = true } = {}) {
  refrescar();
  document.querySelectorAll("#valores [aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  try {
    const errorVisual = filas.map((f) => f.error).find(Boolean);
    if (errorVisual) throw errorVisual;
    const resultado = calcular(estado.obtener());
    $("error").hidden = true;
    mostrarResultado(resultado);
  } catch (err) {
    mostrarError(err);
  }
  if (guardar) guardarEnURL();
  if (desdeUsuario) llevarAlResultado($("error").hidden ? $("results") : $("error"));
}

/** Carga funciones, valores, orden y (si viene) precisión, y calcula. */
function cargarCalculo({ funciones, valores = {}, orden = "", precision }, { guardar = true } = {}) {
  estado.actualizar({ funciones: [...funciones], valores: { ...valores }, orden, ...(precision === undefined ? {} : { precision }) });
  filas = estado.obtener().funciones.map(filaLimpia);
  variablesPintadas = null; // fuerza a repintar los valores del punto
  $("orden").value = estado.obtener().orden;
  $("precision").value = String(estado.obtener().precision);
  avisar(null);
  pintarFilas();
  ejecutar({ desdeUsuario: false, guardar });
}

function cargarEjemplo(ejemplo, opciones) {
  cargarCalculo({ funciones: ejemplo.funciones, valores: ejemplo.valores, orden: ejemplo.orden ?? "" }, opciones);
}

/**
 * Lo que pide la URL al abrir la página (o al cambiar su fragmento a mano):
 * un ejemplo, un cálculo completo o nada (entonces, el ejemplo inicial).
 * Devuelve true si había algo que cargar.
 */
function cargarDesdeURL() {
  const pedido = leerFragmento(location.hash);
  if (pedido?.ejemplo) {
    const ejemplo = EJEMPLOS.find((e) => e.id === pedido.ejemplo);
    if (!ejemplo) return false;
    cargarEjemplo(ejemplo, { guardar: false });
    return true;
  }
  if (!pedido) return false;
  cargarCalculo(pedido, { guardar: false });
  return true;
}

// --- Copiar y precisión ----------------------------------------------------------------

async function copiar(boton) {
  const ok = await copiarAlPortapapeles(textosParaCopiar[boton.dataset.copia] ?? "");
  const original = t(boton.dataset.i18n);
  boton.textContent = t(ok ? "resultado.copiado" : "resultado.noCopiado");
  $("avisoCopia").textContent = t(ok ? "resultado.copiado.aviso" : "resultado.noCopiado.aviso");
  setTimeout(() => { boton.textContent = original; }, 1600);
}

function pintarSelectorDePrecision() {
  const selector = $("precision");
  for (const n of PRECISIONES) {
    const opcion = crear("option", null, t("resultado.precision.opcion", { n }));
    opcion.value = String(n);
    selector.append(opcion);
  }
  selector.value = String(estado.obtener().precision);
  selector.addEventListener("change", () => {
    estado.actualizar({ precision: Number(selector.value) });
    if (ultimoResultado) { mostrarResultado(ultimoResultado); guardarEnURL(); }
  });
}

// --- Arranque ------------------------------------------------------------------------

function pintarEjemplos() {
  for (const grupo of GRUPOS) {
    const fila = crear("div", "grupo-ejemplos");
    fila.append(crear("span", "muted", t(`entrada.ejemplos.${grupo}`)));
    for (const ejemplo of EJEMPLOS.filter((e) => e.grupo === grupo)) {
      const boton = crear("button", "chip", t(`ejemplo.${ejemplo.id}`));
      boton.type = "button";
      boton.addEventListener("click", () => cargarEjemplo(ejemplo));
      fila.append(boton);
    }
    $("examples").append(fila);
  }
}

/** Sustituye los campos de texto por el editor visual sin interrumpir a quien escribe. */
function activarEditorVisual() {
  if (estado.obtener().modo !== "visual") return;
  const lista = $("funciones");
  if (!lista.contains(document.activeElement)) {
    pintarFilas();
    refrescar();
    return;
  }
  lista.addEventListener("focusout", () => setTimeout(activarEditorVisual, 0), { once: true });
}

function iniciar() {
  aplicarTextos(document);
  conectarBotonTema($("tema"), (tema) => t(`comun.tema.${tema}`));
  pintarEjemplos();

  $("calc").addEventListener("click", () => ejecutar());
  $("agregar").addEventListener("click", agregarFuncion);
  $("modoVisual").addEventListener("click", () => cambiarModo("visual"));
  $("modoCodigo").addEventListener("click", () => cambiarModo("codigo"));
  $("orden").addEventListener("input", () => {
    estado.actualizar({ orden: $("orden").value });
    programarRefresco();
  });
  $("orden").addEventListener("keydown", (e) => { if (e.key === "Enter") ejecutar(); });
  document.querySelectorAll(".copiar").forEach((boton) => boton.addEventListener("click", () => copiar(boton)));
  pintarSelectorDePrecision();

  if (!mathDisponible() || typeof globalThis.katex === "undefined") {
    mostrarError(t("error.librerias"));
    return;
  }
  pintarTex($("fdFormula"), FORMULA_DIFERENCIA_CENTRADA, false);
  pintarTex($("pasoFormula"), PASO_TEX, false);
  pintarTex($("criterio"), CRITERIO_TEX);
  pintarModo();
  if (!cargarDesdeURL()) cargarEjemplo(EJEMPLOS.find((e) => e.id === EJEMPLO_INICIAL), { guardar: false });
  window.addEventListener("hashchange", cargarDesdeURL);

  // El editor visual se pide cuando el navegador queda libre, tras el primer pintado.
  const cargar = () => asegurarEditor().then((ok) => { if (ok) activarEditorVisual(); });
  if ("requestIdleCallback" in window) window.requestIdleCallback(cargar, { timeout: 2000 });
  else setTimeout(cargar, 200);
}

iniciar();
