# Gradientes y jacobianos: cálculo y verificación con Python

Ejercicios resueltos en los que se deriva a mano un gradiente o un jacobiano,
se programa con NumPy y se **verifica** de dos formas independientes:

- **simbólicamente** con SymPy, y
- **numéricamente** con diferencias finitas centradas.

## Calculadora web

**https://ryzen648.github.io/gradientes-jacobianos/**

Escribe las variables, una o varias funciones y un punto: la página calcula el
gradiente o el jacobiano simbólico, lo evalúa en el punto y lo compara con
diferencias finitas centradas. Funciona entera en el navegador
([`index.html`](index.html), con math.js y KaTeX).

## Contenido

| Archivo | Descripción |
|---|---|
| [`index.html`](index.html) | Calculadora web de gradientes y jacobianos (GitHub Pages) |
| [`gradientes_jacobianos.ipynb`](gradientes_jacobianos.ipynb) | Notebook con los ejercicios, ya ejecutado |
| [`gradcheck.py`](gradcheck.py) | `gradiente_numerico`, `jacobiano_numerico`, `verificar_gradiente`, `verificar_jacobiano` |
| [`tests/test_gradcheck.py`](tests/test_gradcheck.py) | Tests de las herramientas de verificación |

## Ejercicios del notebook

| # | Función | Resultado |
|---|---|---|
| 0 | Error de la diferencia finita según `h` | por qué `h ≈ 1e-6` |
| 1 | `f(x,y) = x²y + sin(xy)` | gradiente en R² |
| 2 | `f(x) = xᵀAx + bᵀx` | `(A + Aᵀ)x + b` (y por qué `2Ax + b` falla) |
| 3 | `f(x) = ‖Ax − b‖²` | `2Aᵀ(Ax − b)` |
| 4 | log-sum-exp | `softmax(z)` |
| 5 | Coordenadas polares | jacobiano 2×2, `det J = r` |
| 6 | `F: R³ → R²` | jacobiano 2×3 |
| 7 | softmax | `diag(s) − ssᵀ` |
| 8 | Regla de la cadena | `J_h = J_G(F(x)) · J_F(x)` |
| 9 | Regresión logística | `Xᵀ(σ(Xw) − y) / N` |
| 10 | `f(W) = ½‖WX − Y‖²_F` | `(WX − Y)Xᵀ` |

Al final hay cinco ejercicios propuestos con su solución para comprobar.

## Uso

```bash
pip install -r requirements.txt
jupyter notebook gradientes_jacobianos.ipynb
```

Para correr los tests:

```bash
pytest
```

## Verificar tus propias derivadas

```python
import numpy as np
from gradcheck import verificar_gradiente, verificar_jacobiano

f = lambda x: np.sum(x**3)
grad = lambda x: 3 * x**2
verificar_gradiente(f, grad, np.array([1.0, -2.0, 0.5]))
# [OK   ] gradiente: error relativo = ... (tol = 1e-06)

F = lambda p: np.array([p[0] * np.cos(p[1]), p[0] * np.sin(p[1])])
J = lambda p: np.array([[np.cos(p[1]), -p[0] * np.sin(p[1])],
                        [np.sin(p[1]),  p[0] * np.cos(p[1])]])
verificar_jacobiano(F, J, np.array([2.0, 0.6]))
```

Convención: el jacobiano de `F: Rⁿ → Rᵐ` es una matriz `m × n` con `J[i, j] = ∂F_i/∂x_j`.
