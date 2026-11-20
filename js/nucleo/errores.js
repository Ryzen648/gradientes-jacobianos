// Errores del núcleo de cálculo.
//
// El núcleo no escribe mensajes: lanza un código y los datos del caso, y la
// interfaz los traduce con el diccionario de `js/i18n`. Así los mensajes se
// pueden traducir sin tocar la lógica y las pruebas comprueban códigos, no
// frases. `indice` es siempre el número de la función (empezando en 1).
//
// La clase `ErrorCalculo` y los códigos del editor visual vienen de lab-comun
// (`comun/js/errores.js`); aquí se declaran los propios de esta calculadora.

import { ErrorCalculo, CODIGOS_ENTRADA_VISUAL } from "../../comun/js/errores.js";

export { ErrorCalculo };

const CODIGOS_PROPIOS = [
  // --- Lista de funciones ---
  "sinFunciones",              // {}
  "funcionVacia",              // { indice }
  "sinVariables",              // {}

  // --- Sintaxis de una función ---
  "parentesisSinCerrar",       // { indice, faltan }
  "parentesisSobra",           // { indice, posicion }
  "expresionIncompleta",       // { indice }
  "faltaValor",                // { indice, posicion, cerca }
  "operadorInesperado",        // { indice, operador, posicion }
  "parteInesperada",           // { indice, parte, posicion }
  "sintaxis",                  // { indice }
  "operadorNoAdmitido",        // { indice, operador }
  "expresionNoAdmitida",       // { indice }
  "funcionDesconocida",        // { indice, nombre }
  "funcionDesconocidaSugerencia", // { indice, nombre, sugerencia }
  "productoImplicito",         // { indice, nombre }
  "funcionSinArgumento",       // { indice, nombre }
  "argumentosFuncion",         // { indice, nombre, maximo }
  "unidadImaginaria",          // { indice }
  "nombreNoValido",            // { indice, nombre }

  // --- Variables y punto ---
  "ordenInvalido",             // { esperadas }
  "valorFalta",                // { variable }
  "valorInvalido",             // { variable, texto }
  "valorNoFinito",             // { variable }

  // --- Cálculo en el punto ---
  "noDerivable",               // { indice }
  "derivadaNoFinita",          // { indice, variable }
  "funcionNoFinita",           // { indice }
  "noDerivableAbs",            // { indice, expr }
  "noDerivableRaiz",           // { indice, expr }
  "dominioRaiz",               // { indice, expr, valor }
  "dominioLogaritmo",          // { indice, expr, valor }
  "dominioInversa",            // { indice, funcion, expr, valor }
  "divisionPorCero",           // { indice, expr }
  "potenciaNoDerivable",       // { indice, expr }
  "dominioPotencia",           // { indice, expr, valor }
];

/** Todos los códigos que puede ver esta calculadora: los propios y los del editor visual. */
export const CODIGOS = Object.freeze([...CODIGOS_PROPIOS, ...CODIGOS_ENTRADA_VISUAL]);
