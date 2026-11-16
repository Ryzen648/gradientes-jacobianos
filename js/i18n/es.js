// Textos en español. Las claves `error.<código>` corresponden a los códigos
// de `js/nucleo/errores.js`. Los valores con etiquetas HTML solo se usan en
// elementos marcados con `data-i18n-html` y nunca incluyen texto del usuario.

export default {
  "pagina.titulo": "Calculadora de gradientes y jacobianos",
  "pagina.entradilla": "Deriva simbólicamente, evalúa en un punto y comprueba el resultado con diferencias finitas centradas.",

  "entrada.variables": "Variables",
  "entrada.variables.ayuda": "separadas por comas",
  "entrada.funciones": "Funciones",
  "entrada.funciones.ayuda": "una por línea: una sola da el gradiente, varias dan el jacobiano",
  "entrada.punto": "Punto",
  "entrada.punto.ayuda": "un valor por variable, en el mismo orden; admite expresiones como <code>pi/4</code>",
  "entrada.calcular": "Calcular",
  "entrada.ejemplos": "Ejemplos:",
  "entrada.sintaxis.titulo": "Sintaxis admitida",
  "entrada.sintaxis.texto":
    "Operadores <code>+ - * / ^</code> y paréntesis. Funciones: <code>sin cos tan asin acos atan sinh cosh tanh " +
    "exp log sqrt abs</code> (<code>log</code> es el logaritmo natural). Constantes: <code>pi</code>, <code>e</code>. " +
    "La multiplicación se puede escribir como <code>x*y</code> o <code>2x</code>.",

  "ejemplo.gradienteR2": "Gradiente en R²",
  "ejemplo.polares": "Polares",
  "ejemplo.r3r2": "R³ → R²",
  "ejemplo.esfericas": "Esféricas",
  "ejemplo.logSumExp": "Log-sum-exp",

  "resultado.gradiente.simbolico": "Gradiente simbólico",
  "resultado.jacobiano.simbolico": "Jacobiano simbólico ({filas} × {columnas})",
  "resultado.gradiente.valor": "Gradiente en el punto",
  "resultado.jacobiano.valor": "Jacobiano en el punto",
  "resultado.verificacion": "Verificación numérica",
  "resultado.coinciden": "Coinciden · error relativo = {error}",
  "resultado.noCoinciden": "No coinciden · error relativo = {error}",
  "resultado.explicacion.antes": "Cada entrada se aproxima con",
  "resultado.explicacion.despues":
    "usando <code>h = 1e-6</code>. Si la derivada simbólica es correcta, el error relativo es muy pequeño " +
    "(tolerancia <code>1e-6</code>).",

  "pie.texto": "Ejercicios resueltos y código en <a href=\"https://github.com/Ryzen648/gradientes-jacobianos\">el repositorio de GitHub</a>.",

  "error.librerias": "No se pudieron cargar las librerías (math.js / KaTeX). Revisa tu conexión y recarga la página.",
  "error.inesperado": "Ocurrió un error inesperado: {detalle}",
  "error.sinVariables": "Escribe al menos una variable.",
  "error.variableInvalida": "Nombre de variable no válido: «{nombre}».",
  "error.variableReservada": "«{nombre}» es una constante; usa otro nombre de variable.",
  "error.variablesRepetidas": "Hay variables repetidas.",
  "error.sinFunciones": "Escribe al menos una función.",
  "error.puntoLongitud": "El punto tiene {valores} valores, pero hay {variables} variables.",
  "error.puntoInvalido": "No entiendo el valor «{texto}» del punto.",
  "error.valorNoFinito": "El valor de {variable} no da un número real finito.",
  "error.sintaxisFuncion": "No entiendo la función {indice} («{texto}»): {detalle}",
  "error.simboloDesconocido": "En la función {indice} aparece «{nombre}», que no está en la lista de variables.",
  "error.noDerivable": "No puedo derivar simbólicamente la función {indice}: {detalle}",
  "error.derivadaNoFinita": "∂f{indice}/∂{variable} no da un número real finito en ese punto.",
  "error.funcionNoFinita": "La función {indice} no da un número real finito en ese punto.",
};
