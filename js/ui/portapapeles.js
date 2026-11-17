// Copiar texto al portapapeles.

/** Devuelve `true` si se copió. Nunca lanza. */
export async function copiarAlPortapapeles(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Sin permiso o sin contexto seguro (http): se intenta el método antiguo.
    return copiarConSeleccion(texto);
  }
}

function copiarConSeleccion(texto) {
  const area = document.createElement("textarea");
  area.value = texto;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}
