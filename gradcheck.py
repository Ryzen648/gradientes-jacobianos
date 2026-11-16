"""Herramientas para verificar gradientes y jacobianos numéricamente.

La idea: si derivamos a mano una fórmula para el gradiente (o el jacobiano),
la comparamos con una aproximación por diferencias finitas centradas

    df/dx_i  ~  (f(x + h e_i) - f(x - h e_i)) / (2h)

cuyo error de truncamiento es O(h^2). Si la fórmula analítica es correcta,
el error relativo entre ambas debe ser muy pequeño (típicamente < 1e-6).
"""

from __future__ import annotations

import numpy as np

__all__ = [
    "gradiente_numerico",
    "jacobiano_numerico",
    "error_relativo",
    "verificar_gradiente",
    "verificar_jacobiano",
]


def jacobiano_numerico(F, x, h=1e-6):
    """Jacobiano de F: R^n -> R^m en x por diferencias centradas.

    Devuelve una matriz (m, n) con J[i, j] = dF_i/dx_j.
    """
    x = np.asarray(x, dtype=float)
    n = x.size
    columnas = []
    for j in range(n):
        e = np.zeros(n)
        e[j] = h
        f_mas = np.atleast_1d(np.asarray(F((x.ravel() + e).reshape(x.shape)), dtype=float)).ravel()
        f_menos = np.atleast_1d(np.asarray(F((x.ravel() - e).reshape(x.shape)), dtype=float)).ravel()
        columnas.append((f_mas - f_menos) / (2 * h))
    return np.stack(columnas, axis=1)


def gradiente_numerico(f, x, h=1e-6):
    """Gradiente de f: R^n -> R en x por diferencias centradas.

    Devuelve un array con la misma forma que x.
    """
    x = np.asarray(x, dtype=float)
    return jacobiano_numerico(f, x, h).reshape(x.shape)


def error_relativo(a, b):
    """max|a - b| / max(1, max|a|, max|b|): absoluto cerca de 0, relativo si no."""
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    if a.shape != b.shape:
        raise ValueError(f"Formas distintas: {a.shape} vs {b.shape}")
    escala = max(1.0, np.max(np.abs(a), initial=0.0), np.max(np.abs(b), initial=0.0))
    return float(np.max(np.abs(a - b), initial=0.0) / escala)


def _informar(nombre, err, tol, verbose):
    ok = err < tol
    if verbose:
        estado = "OK   " if ok else "FALLA"
        print(f"[{estado}] {nombre}: error relativo = {err:.2e} (tol = {tol:.0e})")
    return ok


def verificar_gradiente(f, grad, x, h=1e-6, tol=1e-6, nombre="gradiente", verbose=True):
    """Compara grad(x) (analítico) con diferencias finitas. Devuelve True/False."""
    x = np.asarray(x, dtype=float)
    analitico = np.asarray(grad(x), dtype=float)
    numerico = gradiente_numerico(f, x, h)
    return _informar(nombre, error_relativo(analitico, numerico), tol, verbose)


def verificar_jacobiano(F, jac, x, h=1e-6, tol=1e-6, nombre="jacobiano", verbose=True):
    """Compara jac(x) (analítico, forma (m, n)) con diferencias finitas."""
    x = np.asarray(x, dtype=float)
    analitico = np.asarray(jac(x), dtype=float)
    numerico = jacobiano_numerico(F, x, h)
    return _informar(nombre, error_relativo(analitico, numerico), tol, verbose)
