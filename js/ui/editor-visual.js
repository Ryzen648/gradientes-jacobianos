// Carga diferida del editor visual (MathLive).
//
// MathLive pesa bastante más que el resto de la página, así que no va en el
// <head>: se importa bajo demanda, después del primer pintado. Mientras
// tanto (o si falla la red) las funciones se editan en campos de texto.

const URL_MATHLIVE = "https://cdn.jsdelivr.net/npm/mathlive@0.111.4/mathlive.min.mjs";

// Atajos al teclear, además de los que trae MathLive (sin, cos, ln, pi, sqrt…).
const ATAJOS = Object.freeze({
  sen: "\\sin", senh: "\\sinh", arcsen: "\\arcsin",
  tg: "\\tan", arctg: "\\arctan",
  sech: "\\operatorname{sech}", csch: "\\operatorname{csch}",
  abs: "\\left|#?\\right|",
});

let promesa = null;

/** Importa MathLive una sola vez. Si falla, la siguiente llamada lo reintenta. */
export function cargarEditorVisual() {
  promesa ??= import(URL_MATHLIVE)
    .then(({ MathfieldElement }) => {
      MathfieldElement.soundsDirectory = null; // sin sonidos de teclado (y sin pedirlos a la red)
      MathfieldElement.locale = document.documentElement.lang || "es";
      return MathfieldElement;
    })
    .catch((err) => {
      promesa = null;
      throw err;
    });
  return promesa;
}

/**
 * Crea un <math-field>. Debe llamarse después de `cargarEditorVisual()`.
 * Los ajustes se aplican en `configurarCampoVisual`, una vez insertado en la página.
 */
export function crearCampoVisual() {
  return document.createElement("math-field");
}

export function configurarCampoVisual(campo, latex) {
  campo.smartMode = false;                    // nunca cambia solo a modo texto
  campo.mathVirtualKeyboardPolicy = "auto";   // teclado en pantalla en dispositivos táctiles
  campo.inlineShortcuts = { ...campo.inlineShortcuts, ...ATAJOS };
  campo.setValue(latex, { silenceNotifications: true });
}
