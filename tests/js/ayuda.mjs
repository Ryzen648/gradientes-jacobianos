// Utilidades compartidas por las pruebas.
import assert from "node:assert/strict";

/** Comprueba que `fn` lanza un ErrorCalculo con ese código (y esos datos). */
export function lanza(fn, codigo, datos) {
  assert.throws(fn, (err) => {
    assert.equal(err.name, "ErrorCalculo");
    assert.equal(err.codigo, codigo);
    // `detalle` es el mensaje de math.js: no se compara, puede cambiar de versión.
    if (datos) assert.deepEqual({ ...err.datos, detalle: undefined }, { ...datos, detalle: undefined });
    return true;
  });
}

export function cerca(real, esperado, tol = 1e-9) {
  assert.ok(Math.abs(real - esperado) <= tol, `${real} no está a menos de ${tol} de ${esperado}`);
}

export function matrizCerca(real, esperada, tol = 1e-9) {
  assert.equal(real.length, esperada.length);
  real.forEach((fila, i) => {
    assert.equal(fila.length, esperada[i].length);
    fila.forEach((v, j) => cerca(v, esperada[i][j], tol));
  });
}
