// Modelo de estado único de la calculadora.
//
// Todo lo que el usuario escribe vive aquí, en texto, y la interfaz solo lo
// refleja. Tenerlo en un único objeto serializable es lo que permitirá más
// adelante guardarlo en la URL y en el historial sin tocar la interfaz.

export const ESTADO_VACIO = Object.freeze({ variables: "", funciones: Object.freeze([]), punto: "" });

function normalizar(e) {
  return {
    variables: String(e.variables ?? ""),
    funciones: Array.from(e.funciones ?? [], String),
    punto: String(e.punto ?? ""),
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
