// Errores del núcleo de cálculo.
//
// El núcleo no escribe mensajes: lanza un código y los datos del caso, y la
// interfaz los traduce con el diccionario de `js/i18n`. Así los mensajes se
// pueden traducir sin tocar la lógica y las pruebas comprueban códigos, no
// frases. `indice` es siempre el número de la función (empezando en 1).
//
// La clase `ErrorCalculo` y los códigos de la lectura de una función (sintaxis
// y editor visual) vienen de lab-comun (`comun/js/errores.js`); aquí se
// declaran los propios de esta calculadora.

import { ErrorCalculo, CODIGOS_ENTRADA_TEXTO, CODIGOS_ENTRADA_VISUAL } from "../../comun/js/errores.js";

export { ErrorCalculo };

const CODIGOS_PROPIOS = [
  // --- Lista de funciones ---
  "sinFunciones",              // {}
  "sinVariables",              // {}

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

/** Todos los códigos que puede ver esta calculadora: los propios y los de la entrada compartida. */
export const CODIGOS = Object.freeze([...CODIGOS_PROPIOS, ...CODIGOS_ENTRADA_TEXTO, ...CODIGOS_ENTRADA_VISUAL]);
