import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from gradcheck import (  # noqa: E402
    error_relativo,
    gradiente_numerico,
    jacobiano_numerico,
    verificar_gradiente,
    verificar_jacobiano,
)

rng = np.random.default_rng(0)


def test_gradiente_forma_cuadratica():
    A = rng.normal(size=(4, 4))
    b = rng.normal(size=4)
    x = rng.normal(size=4)
    f = lambda x: x @ A @ x + b @ x
    grad = lambda x: (A + A.T) @ x + b
    assert verificar_gradiente(f, grad, x, verbose=False)


def test_detecta_gradiente_incorrecto():
    A = rng.normal(size=(4, 4))
    x = rng.normal(size=4)
    f = lambda x: x @ A @ x
    grad_mal = lambda x: 2 * A @ x  # solo vale si A es simétrica
    assert not verificar_gradiente(f, grad_mal, x, verbose=False)


def test_gradiente_respeta_forma_matricial():
    W = rng.normal(size=(3, 2))
    f = lambda W: np.sum(W**2)
    g = gradiente_numerico(f, W)
    assert g.shape == W.shape
    assert error_relativo(g, 2 * W) < 1e-6


def test_jacobiano_polares():
    F = lambda p: np.array([p[0] * np.cos(p[1]), p[0] * np.sin(p[1])])
    J = lambda p: np.array(
        [[np.cos(p[1]), -p[0] * np.sin(p[1])], [np.sin(p[1]), p[0] * np.cos(p[1])]]
    )
    p = np.array([2.0, 0.7])
    assert verificar_jacobiano(F, J, p, verbose=False)
    assert abs(np.linalg.det(jacobiano_numerico(F, p)) - p[0]) < 1e-6


def test_jacobiano_softmax():
    def softmax(z):
        e = np.exp(z - z.max())
        return e / e.sum()

    J = lambda z: np.diag(softmax(z)) - np.outer(softmax(z), softmax(z))
    z = rng.normal(size=5)
    assert verificar_jacobiano(softmax, J, z, verbose=False)


def test_jacobiano_no_cuadrado():
    F = lambda x: np.array([x[0] * x[1], x[1] * x[2] ** 2])
    x = np.array([1.0, 2.0, 3.0])
    J = jacobiano_numerico(F, x)
    assert J.shape == (2, 3)
    assert error_relativo(J, np.array([[2.0, 1.0, 0.0], [0.0, 9.0, 12.0]])) < 1e-6
