// Interfaz: conecta el formulario con el estado y pinta los resultados.
// Toda la matemática está en `js/nucleo`; aquí solo hay DOM.

import { mathDisponible } from "../lib/mathjs.js";
import { calcular } from "../nucleo/calcular.js";
import { resultadoTex, FORMULA_DIFERENCIA_CENTRADA } from "../nucleo/latex.js";
import { crearEstado } from "../estado.js";
import { EJEMPLOS, EJEMPLO_INICIAL } from "../ejemplos.js";
import { t, mensajeDeError, aplicarTextos } from "../i18n/index.js";

const $ = (id) => document.getElementById(id);
const estado = crearEstado();

function pintarTex(el, fuente, enBloque = true) {
  globalThis.katex.render(fuente, el, { displayMode: enBloque, throwOnError: false });
}

// --- Formulario <-> estado -------------------------------------------------

function leerFormulario() {
  estado.actualizar({
    variables: $("vars").value,
    funciones: $("funcs").value.split("\n"),
    punto: $("point").value,
  });
}

function pintarFormulario(e) {
  $("vars").value = e.variables;
  $("funcs").value = e.funciones.join("\n");
  $("point").value = e.punto;
}

// --- Resultados --------------------------------------------------------------

function mostrarResultado(r) {
  const tipo = r.esGradiente ? "gradiente" : "jacobiano";
  $("symTitle").textContent = t(`resultado.${tipo}.simbolico`, { filas: r.nodos.length, columnas: r.vars.length });
  $("valTitle").textContent = t(`resultado.${tipo}.valor`);

  const tex = resultadoTex(r);
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

function mostrarError(mensaje) {
  $("results").hidden = true;
  $("error").textContent = mensaje;
  $("error").hidden = false;
}

function ejecutar() {
  leerFormulario();
  try {
    $("error").hidden = true;
    mostrarResultado(calcular(estado.obtener()));
  } catch (err) {
    mostrarError(mensajeDeError(err));
  }
}

function cargarEjemplo(ejemplo) {
  estado.actualizar(ejemplo);
  pintarFormulario(estado.obtener());
  ejecutar();
}

// --- Arranque ----------------------------------------------------------------

function iniciar() {
  aplicarTextos(document);

  for (const ejemplo of EJEMPLOS) {
    const boton = document.createElement("button");
    boton.className = "chip";
    boton.type = "button";
    boton.textContent = t(`ejemplo.${ejemplo.id}`);
    boton.addEventListener("click", () => cargarEjemplo(ejemplo));
    $("examples").appendChild(boton);
  }

  $("calc").addEventListener("click", ejecutar);
  for (const id of ["vars", "point"]) {
    $(id).addEventListener("keydown", (e) => { if (e.key === "Enter") ejecutar(); });
  }
  // En el área de funciones Enter añade una línea; Ctrl/Cmd + Enter calcula.
  $("funcs").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) ejecutar();
  });

  if (!mathDisponible() || typeof globalThis.katex === "undefined") {
    mostrarError(t("error.librerias"));
    return;
  }
  pintarTex($("fdFormula"), FORMULA_DIFERENCIA_CENTRADA, false);
  cargarEjemplo(EJEMPLOS.find((e) => e.id === EJEMPLO_INICIAL));
}

iniciar();
