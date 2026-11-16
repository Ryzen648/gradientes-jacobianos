// Errores del núcleo de cálculo.
//
// El núcleo no escribe mensajes: lanza un código y los datos del caso, y la
// interfaz los traduce con el diccionario de `js/i18n`. Así los mensajes se
// pueden traducir sin tocar la lógica y las pruebas comprueban códigos, no
// frases.

export const CODIGOS = Object.freeze([
  "sinVariables",        // {}
  "variableInvalida",    // { nombre }
  "variableReservada",   // { nombre }
  "variablesRepetidas",  // {}
  "sinFunciones",        // {}
  "puntoLongitud",       // { valores, variables }
  "puntoInvalido",       // { texto }
  "valorNoFinito",       // { variable }
  "sintaxisFuncion",     // { indice, texto, detalle }
  "simboloDesconocido",  // { indice, nombre }
  "noDerivable",         // { indice, detalle }
  "derivadaNoFinita",    // { indice, variable }
  "funcionNoFinita",     // { indice }
]);

export class ErrorCalculo extends Error {
  constructor(codigo, datos = {}) {
    super(codigo);
    this.name = "ErrorCalculo";
    this.codigo = codigo;
    this.datos = datos;
  }
}
