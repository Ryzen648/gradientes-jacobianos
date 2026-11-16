// Traducción de textos. De momento solo hay español; añadir un idioma es
// crear otro diccionario con las mismas claves y registrarlo aquí.

import es from "./es.js";

const DICCIONARIOS = { es };
let idioma = "es";

export function idiomaActual() {
  return idioma;
}

export function claves(codigoIdioma = idioma) {
  return Object.keys(DICCIONARIOS[codigoIdioma]);
}

/** Texto de `clave` con los `{marcadores}` sustituidos por `datos`. */
export function t(clave, datos = {}) {
  const plantilla = DICCIONARIOS[idioma][clave];
  if (plantilla === undefined) return clave; // visible en pantalla: delata la clave que falta
  return plantilla.replace(/\{(\w+)\}/g, (marcador, nombre) =>
    (nombre in datos ? String(datos[nombre]) : marcador));
}

/** Mensaje para cualquier error: los del núcleo se traducen por su código. */
export function mensajeDeError(err) {
  if (err && err.name === "ErrorCalculo") return t(`error.${err.codigo}`, err.datos);
  return t("error.inesperado", { detalle: err && err.message ? err.message : String(err) });
}

/**
 * Rellena los elementos marcados en el HTML:
 *   data-i18n="clave"       -> textContent
 *   data-i18n-html="clave"  -> innerHTML (solo textos fijos del diccionario)
 */
export function aplicarTextos(raiz) {
  raiz.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  raiz.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
}
