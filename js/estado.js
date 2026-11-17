// Modelo de estado único de la calculadora.
//
// Todo lo que el usuario escribe vive aquí, en texto, y la interfaz solo lo
// refleja. Tenerlo en un único objeto serializable es lo que permitirá más
// adelante guardarlo en la URL y en el historial sin tocar la interfaz.
//
//   funciones  una cadena por función, en sintaxis de código (la forma canónica,
//              también cuando se edita en modo visual)
//   valores    texto del valor de cada variable: { x: "1.3", y: "pi/4" }
//   orden      orden de las variables ("p, t, f"); vacío = alfabético
//   modo       "visual" (editor matemático) o "codigo" (texto plano)

export const MODOS = Object.freeze(["visual", "codigo"]);

export const ESTADO_VACIO = Object.freeze({
  funciones: Object.freeze([""]),
  valores: Object.freeze({}),
  orden: "",
  modo: "visual",
});

function normalizar(e) {
  const valores = {};
  for (const [variable, texto] of Object.entries(e.valores ?? {})) valores[variable] = String(texto);
  const funciones = Array.from(e.funciones ?? [], String);
  return {
    funciones: funciones.length ? funciones : [""], // siempre hay al menos una fila
    valores,
    orden: String(e.orden ?? ""),
    modo: MODOS.includes(e.modo) ? e.modo : "visual",
  };
}

export function crearEstado(inicial = ESTADO_VACIO) {
  let actual = normalizar(inicial);
  const oyentes = new Set();

  return {
    /** Copia del estado actual (modificarla no altera el estado). */
    obtener() {
      return normalizar(actual);
    },
    /** Mezcla `cambios` con el estado y avisa a los suscriptores. */
    actualizar(cambios) {
      actual = normalizar({ ...actual, ...cambios });
      oyentes.forEach((fn) => fn(this.obtener()));
    },
    /** Devuelve una función para cancelar la suscripción. */
    suscribir(fn) {
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },
  };
}
