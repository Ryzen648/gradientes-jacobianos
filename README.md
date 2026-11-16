# Gradientes y jacobianos: cálculo y verificación con Python

Ejercicios resueltos en los que se deriva a mano un gradiente o un jacobiano,
se programa con NumPy y se **verifica** de dos formas independientes:

- **simbólicamente** con SymPy, y
- **numéricamente** con diferencias finitas centradas.

## Calculadora web

**https://ryzen648.github.io/gradientes-jacobianos/**

Escribe las variables, una o varias funciones y un punto: la página calcula el
gradiente o el jacobiano simbólico, lo evalúa en el punto y lo compara con
diferencias finitas centradas. Es una página estática: funciona entera en el
navegador, sin servidor ni paso de build, con math.js y KaTeX.

[![Pruebas](https://github.com/Ryzen648/gradientes-jacobianos/actions/workflows/pruebas.yml/badge.svg)](https://github.com/Ryzen648/gradientes-jacobianos/actions/workflows/pruebas.yml)

## Contenido

| Ruta | Descripción |
|---|---|
| [`index.html`](index.html), [`css/`](css) | Página de la calculadora (GitHub Pages) |
| [`js/nucleo/`](js/nucleo) | Lógica sin DOM: lectura de la entrada, derivación, verificación numérica y LaTeX |
| [`js/ui/`](js/ui), [`js/estado.js`](js/estado.js), [`js/i18n/`](js/i18n) | Interfaz, modelo de estado y textos |
| [`tests/js/`](tests/js) | Pruebas de la calculadora (`node --test`) |
| [`gradientes_jacobianos.ipynb`](gradientes_jacobianos.ipynb) | Notebook con los ejercicios, ya ejecutado |
| [`gradcheck.py`](gradcheck.py) | `gradiente_numerico`, `jacobiano_numerico`, `verificar_gradiente`, `verificar_jacobiano` |
| [`tests/test_gradcheck.py`](tests/test_gradcheck.py) | Pruebas de las herramientas de verificación en Python |

## Desarrollo de la calculadora

Hace falta [Node.js](https://nodejs.org) 22 o posterior. La única dependencia
es math.js, y solo para las pruebas (la página la carga desde un CDN).

```bash
npm install
```

```bash
npm test
```

```bash
npm run servir
```

`npm run servir` abre la calculadora en `http://localhost:8765/`. Hace falta
servirla así porque los módulos ES no cargan desde `file://`.

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

## Uso del notebook

```bash
pip install -r requirements.txt
```

```bash
jupyter notebook gradientes_jacobianos.ipynb
```

Para correr las pruebas de Python:

```bash
pytest tests
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

## Autor y licencia

Ricardo Jaico Pradinett. Código bajo licencia [MIT](LICENSE).
