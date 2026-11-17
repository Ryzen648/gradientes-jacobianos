// Punto único de acceso a math.js.
//
// En el navegador math.js se carga desde el CDN como global (`window.math`);
// en las pruebas de Node, `tests/preparar.mjs` asigna el paquete de npm a
// `globalThis.math` antes de importar el núcleo. Así el núcleo no necesita
// ni un paso de build ni un import map.
//
// Es un objeto con getters (y no `export const math = globalThis.math`) para
// que el orden de carga de los módulos no importe.
export const math = new Proxy({}, {
  get(_objetivo, propiedad) {
    const lib = globalThis.math;
    if (!lib) throw new Error("math.js no está cargado");
    return lib[propiedad];
  },
});

export function mathDisponible() {
  return typeof globalThis.math !== "undefined";
}
