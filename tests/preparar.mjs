// Debe importarse ANTES que cualquier módulo de `js/`: deja math.js (paquete
// de npm, misma versión que el CDN) en el global que usa `comun/js/mathjs.js`.
import * as mathjs from "mathjs";

globalThis.math = mathjs;
