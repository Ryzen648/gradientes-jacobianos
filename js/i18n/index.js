// Traducción de textos. De momento solo hay español; añadir un idioma es
// crear otro diccionario con las mismas claves y registrarlo aquí.
// El traductor y los textos de los componentes compartidos (editor visual,
// tema) vienen de lab-comun: `comun/js/i18n.js`.

import { crearI18n } from "../../comun/js/i18n.js";
import es from "./es.js";

const i18n = crearI18n({ es });

export const { t, mensajeDeError, aplicarTextos, idiomaActual, claves } = i18n;
