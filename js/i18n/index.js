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

/** Los números de los mensajes se muestran con pocas cifras (−4, 0.5, 1.2e-7). */
function presentar(valor) {
  if (typeof valor !== "number") return String(valor);
  if (Number.isInteger(valor)) return String(valor);
  const a = Math.abs(valor);
  return a >= 1e6 || a < 1e-4 ? valor.toExponential(2) : String(Number(valor.toPrecision(5)));
}

/** Mensaje para cualquier error: los del núcleo se traducen por su código. */
export function mensajeDeError(err) {
  if (err && err.name === "ErrorCalculo") {
    const datos = {};
    for (const [clave, valor] of Object.entries(err.datos)) datos[clave] = presentar(valor);
    return t(`error.${err.codigo}`, datos);
  }
  return t("error.inesperado", { detalle: err && err.message ? err.message : String(err) });
}

/**
 * Rellena los elementos marcados en el HTML:
 *   data-i18n="clave"             -> textContent
 *   data-i18n-html="clave"        -> innerHTML (solo textos fijos del diccionario)
 *   data-i18n-aria-label="clave"  -> atributo aria-label
 */
export function aplicarTextos(raiz) {
  raiz.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  raiz.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  raiz.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel));
  });
}
