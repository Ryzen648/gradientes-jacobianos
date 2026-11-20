// Textos en español. Las claves `error.<código>` corresponden a los códigos
// de `js/nucleo/errores.js`; los de los componentes compartidos (modo
// Visual/Código, tema, errores del editor visual) están en lab-comun.
// Los valores con etiquetas HTML solo se usan en elementos marcados con
// `data-i18n-html` y nunca incluyen texto del usuario.

export default {
  "pagina.titulo": "Calculadora de gradientes y jacobianos",
  "pagina.entradilla": "Deriva simbólicamente, evalúa en un punto y comprueba el resultado con diferencias finitas centradas.",

  // --- Entrada ---
  "entrada.funciones": "Funciones",
  "entrada.funciones.ayuda": "Una función da el gradiente; varias dan el jacobiano. Las variables se detectan solas.",
  "entrada.modo.corrige": "Corrige la función {indice} antes de cambiar de modo.",
  "entrada.funcion.etiqueta": "Función {indice}",
  "entrada.funcion.ejemploCodigo": "p. ej. x^2*y + sin(x*y)",
  "entrada.funcion.quitar": "Eliminar la función {indice}",
  "entrada.funcion.agregar": "+ Agregar función",
  "entrada.vistaPrevia": "Vista previa",
  "entrada.vistaPrevia.vacia": "Escribe una función para ver aquí lo que se va a derivar.",
  "entrada.vistaPrevia.conErrores": "Corrige las funciones marcadas para ver la vista previa.",
  "entrada.punto": "Punto",
  "entrada.punto.ayuda": "Un valor por variable. Admite expresiones como <code>pi/4</code> o <code>sqrt(2)</code>.",
  "entrada.punto.sinVariables": "Aquí aparecerá un campo por cada variable de tus funciones.",
  "entrada.punto.valorDe": "Valor de {variable}",
  "entrada.calcular": "Calcular",
  "entrada.ejemplos": "Ejemplos",
  "entrada.ejemplos.calculo": "Cálculo",
  "entrada.ejemplos.ml": "Aprendizaje automático",
  "entrada.opciones": "Orden de las variables y sintaxis",
  "entrada.orden": "Orden de las variables",
  "entrada.orden.ayuda": "Vacío = orden alfabético. Escríbelas separadas por comas para cambiar el orden de las columnas, p. ej. <code>y, x</code>.",
  "entrada.sintaxis.titulo": "Sintaxis del modo Código",
  "entrada.sintaxis.texto":
    "Operadores <code>+ - * / ^</code> (también <code>**</code>) y paréntesis. La multiplicación se escribe " +
    "<code>x*y</code> o <code>2x</code>; ojo: <code>xy</code> es una sola variable llamada «xy». " +
    "Funciones: <code>sin cos tan sec csc cot</code>, sus inversas (<code>asin</code>, <code>atan</code>…) e " +
    "hiperbólicas (<code>sinh</code>, <code>tanh</code>…), <code>exp</code>, <code>log</code> o <code>ln</code> " +
    "(logaritmo natural), <code>log10</code>, <code>sqrt</code>, <code>cbrt</code>, <code>abs</code> o " +
    "<code>|x|</code>. También <code>sen</code>, <code>tg</code>, <code>arctan</code>. " +
    "Constantes: <code>pi</code>, <code>e</code> (así que <code>e^x</code> funciona).",

  // --- Ejemplos ---
  "ejemplo.gradienteR2": "Gradiente en R²",
  "ejemplo.polares": "Polares",
  "ejemplo.r3r2": "R³ → R²",
  "ejemplo.esfericas": "Esféricas",
  "ejemplo.logSumExp": "Log-sum-exp",
  "ejemplo.sigmoide": "Sigmoide",
  "ejemplo.softmax": "Softmax",
  "ejemplo.capaDensa": "Capa densa (tanh)",

  // --- Resultados ---
  "resultado.gradiente.simbolico": "Gradiente simbólico",
  "resultado.jacobiano.simbolico": "Jacobiano simbólico ({filas} × {columnas})",
  "resultado.gradiente.valor": "Gradiente en el punto",
  "resultado.jacobiano.valor": "Jacobiano en el punto",
  "resultado.verificacion": "Verificación numérica",
  "resultado.coinciden": "✓ Coincide · error relativo = {error}",
  "resultado.noCoinciden": "✗ No coincide · error relativo = {error}",
  "resultado.explicacion.antes": "Cada entrada se aproxima con",
  "resultado.explicacion.paso": "usando",
  "resultado.explicacion.criterio": ". El resultado se da por bueno si el error relativo cumple:",
  "resultado.explicacion.despues":
    "Con ese paso, una diferencia finita se desvía de la derivada exacta del orden de 10⁻¹⁰: una derivada " +
    "correcta queda muy por debajo de la tolerancia y una incorrecta, muy por encima. Dividir entre el tamaño " +
    "de las entradas hace que el criterio valga igual para valores grandes y pequeños.",
  "resultado.precision": "Decimales",
  "resultado.precision.opcion": "{n} decimales",
  "resultado.copiarLatex": "Copiar LaTeX",
  "resultado.copiarValores": "Copiar valores",
  "resultado.copiado": "Copiado ✓",
  "resultado.copiado.aviso": "Copiado al portapapeles.",
  "resultado.noCopiado": "No se pudo copiar",
  "resultado.noCopiado.aviso": "El navegador no permitió copiar. Selecciona el resultado y cópialo a mano.",

  "pie.texto":
    "Hecho por Ricardo Jaico Pradinett. Código y ejercicios resueltos en " +
    "<a href=\"https://github.com/Ryzen648/gradientes-jacobianos\">el repositorio de GitHub</a>.",

  // --- Errores generales ---
  "error.librerias": "No se pudieron cargar las librerías (math.js / KaTeX). Revisa tu conexión y recarga la página.",

  // --- Errores: lista de funciones ---
  "error.sinFunciones": "Escribe al menos una función para calcular.",
  "error.funcionVacia": "La función {indice} está vacía: escríbela o elimínala con ✕.",
  "error.sinVariables": "Las funciones no dependen de ninguna variable, así que no hay nada que derivar. Usa letras como x o y.",

  // --- Errores: sintaxis ---
  "error.parentesisSinCerrar": "En la función {indice} faltan paréntesis de cierre: añade {faltan} «)».",
  "error.parentesisSobra": "En la función {indice} sobra un paréntesis de cierre «)» (posición {posicion}): no tiene uno de apertura.",
  "error.expresionIncompleta": "La función {indice} termina de forma inesperada: falta algo después del último operador.",
  "error.faltaValor": "En la función {indice} falta un número o una variable cerca de «{cerca}» (posición {posicion}): hay dos operadores seguidos o un paréntesis vacío.",
  "error.operadorInesperado": "En la función {indice} el símbolo «{operador}» (posición {posicion}) no va ahí. Si son dos funciones, pon cada una en su propia fila.",
  "error.parteInesperada": "En la función {indice} no entiendo «{parte}» (posición {posicion}). Revisa si hay un punto decimal de más o un carácter extraño.",
  "error.sintaxis": "No entiendo la función {indice}. Revisa que solo use números, variables, + - * / ^, paréntesis y funciones.",
  "error.operadorNoAdmitido": "En la función {indice} se usa «{operador}», que no está admitido. Solo se admiten + - * / ^.",
  "error.expresionNoAdmitida": "La función {indice} no es una expresión que se pueda derivar: no uses «=», listas ni comparaciones; escribe solo la fórmula.",
  "error.funcionDesconocida": "En la función {indice} se usa «{nombre}(…)», que no es una función admitida. Abre «Orden de las variables y sintaxis» para ver la lista.",
  "error.funcionDesconocidaSugerencia": "En la función {indice} se usa «{nombre}(…)», que no existe. ¿Quisiste decir «{sugerencia}»?",
  "error.productoImplicito": "En la función {indice}, «{nombre}(…)» se lee como una función llamada {nombre}. Para multiplicar escribe «{nombre}*(…)».",
  "error.funcionSinArgumento": "En la función {indice}, «{nombre}» es una función y necesita su argumento entre paréntesis, p. ej. {nombre}(x).",
  "error.argumentosFuncion": "En la función {indice}, «{nombre}» recibe un número de argumentos incorrecto (admite como máximo {maximo}).",
  "error.unidadImaginaria": "En la función {indice} aparece «i», que es la unidad imaginaria. Usa otra letra como variable.",
  "error.nombreNoValido": "En la función {indice}, «{nombre}» no es un nombre de variable válido: usa letras, dígitos y guion bajo, empezando por una letra.",

  // --- Errores: variables y punto ---
  "error.ordenInvalido": "El orden de las variables debe nombrar exactamente estas, una vez cada una: {esperadas}.",
  "error.valorFalta": "Falta el valor de {variable} en el punto.",
  "error.valorInvalido": "No entiendo «{texto}» como valor de {variable}. Escribe un número o una expresión como pi/4.",
  "error.valorNoFinito": "El valor de {variable} no es un número real finito.",

  // --- Errores: cálculo en el punto ---
  "error.noDerivable": "No se pudo derivar simbólicamente la función {indice}.",
  "error.derivadaNoFinita": "La derivada de la función {indice} respecto a {variable} no es un número real finito en ese punto. Prueba con otro punto.",
  "error.funcionNoFinita": "La función {indice} no da un número real en ese punto o justo a su alrededor. Prueba con otro punto.",
  "error.noDerivableAbs": "La función {indice} no es derivable en ese punto: contiene |{expr}| y ahí {expr} = 0, donde el valor absoluto tiene un pico. Prueba con otro punto.",
  "error.noDerivableRaiz": "La función {indice} no es derivable en ese punto: contiene la raíz de {expr} y ahí {expr} = 0, donde la pendiente es infinita. Prueba con otro punto.",
  "error.dominioRaiz": "La función {indice} no está definida en ese punto: contiene la raíz de {expr} y ahí {expr} = {valor}, que es negativo.",
  "error.dominioLogaritmo": "La función {indice} no está definida en ese punto: contiene el logaritmo de {expr} y ahí {expr} = {valor}. El logaritmo necesita un valor positivo.",
  "error.dominioInversa": "La función {indice} no es derivable en ese punto: {funcion}({expr}) necesita un valor estrictamente entre −1 y 1, y ahí {expr} = {valor}.",
  "error.divisionPorCero": "La función {indice} divide entre cero en ese punto: ahí {expr} = 0. Prueba con otro punto.",
  "error.potenciaNoDerivable": "La función {indice} no es derivable en ese punto: eleva {expr} a un exponente menor que 1 y ahí {expr} = 0.",
  "error.dominioPotencia": "La función {indice} no está definida en ese punto: eleva {expr} = {valor}, que es negativo, a un exponente no entero.",
};
