# Gradientes y jacobianos: cálculo y verificación con Python

Ejercicios resueltos en los que se deriva a mano un gradiente o un jacobiano,
se programa con NumPy y se **verifica** de dos formas independientes:

- **simbólicamente** con SymPy, y
- **numéricamente** con diferencias finitas centradas.

## Calculadora web

**https://ryzen648.github.io/gradientes-jacobianos/**

Escribe una o varias funciones y un punto: la página calcula el gradiente o el
jacobiano simbólico, lo evalúa en el punto y lo compara con diferencias
finitas centradas. Es una página estática: funciona entera en el navegador,
sin servidor ni paso de build.

- **Editor visual o de código.** Las funciones se escriben en un editor
  matemático (MathLive, con teclado en pantalla en el móvil) o, en modo
  *Código*, como texto: `x^2*y + sin(x*y)`. En el móvil, el botón
  «Calcular» se queda justo encima del teclado en pantalla y, al pulsarlo,
  el teclado se cierra y la vista baja hasta el resultado.
- **Tema claro, oscuro o automático**, con un botón que recuerda la elección.
- **Variables automáticas.** Se detectan al escribir y cada una recibe su
  campo de valor, que admite expresiones como `pi/4`.
- **Una función da el gradiente; varias, el jacobiano.** Se añaden y quitan
  con «+ Agregar función» y ✕, y la vista previa muestra lo que se va a derivar.
- **Alias.** `ln`, `e^x`, `**`, `sec`, `cot`, `|x|`, `sen`, `tg`, `arctan`…
- **Errores que dicen qué hacer.** Paréntesis sin cerrar, funciones mal
  escritas (con sugerencia) o puntos donde la función no es derivable, como
  `abs(x)` en 0.
- **Ejemplos** de cálculo y de aprendizaje automático (sigmoide, softmax, capa
  densa con tanh).
- **Resultados legibles.** La salida se escribe como a mano (`2x`, `y e^{xy}`,
  una sola fracción) y cada resultado se puede copiar como LaTeX o como lista
  de valores para pegar en código.
- **Verificación a la vista.** Se muestra ‖J − J_num‖, el error relativo y el
  criterio de tolerancia, y se puede elegir entre 4, 6 o 10 decimales.
- **Enlace para compartir.** Cada cálculo queda en la dirección de la página
  (`#f=x*y&v.x=1&v.y=2`, una `f` por función y `v.` delante de cada
  variable), así que basta copiarla para que otra persona lo abra tal cual.
  Sin fragmento, la página arranca como siempre con el ejemplo inicial.

Librerías, todas desde CDN: math.js (derivación simbólica), KaTeX (fórmulas) y
MathLive (editor visual, con carga diferida para que la página abra rápido).

[![Pruebas](https://github.com/Ryzen648/gradientes-jacobianos/actions/workflows/pruebas.yml/badge.svg)](https://github.com/Ryzen648/gradientes-jacobianos/actions/workflows/pruebas.yml)

## Contenido

| Ruta | Descripción |
|---|---|
| [`index.html`](index.html), [`css/`](css) | Página de la calculadora (GitHub Pages) |
| [`comun/`](https://github.com/Ryzen648/lab-comun) | Submódulo [lab-comun](https://github.com/Ryzen648/lab-comun), compartido con [diffeq-lab](https://github.com/Ryzen648/diffeq-lab): editor visual, tema, conversión código ↔ LaTeX, textos comunes |
| [`js/nucleo/`](js/nucleo) | Lógica sin DOM: lectura de la entrada, derivación, verificación numérica y LaTeX |
| [`js/ui/`](js/ui), [`js/estado.js`](js/estado.js), [`js/estado-url.js`](js/estado-url.js), [`js/i18n/`](js/i18n) | Interfaz, modelo de estado, estado en la URL y textos |
| [`tests/`](tests) | Pruebas de la calculadora (`node --test`) |
| [`ejercicios/`](ejercicios) | Material aparte, en Python: notebook de ejercicios resueltos, `gradcheck.py` y sus pruebas. La calculadora no depende de esta carpeta |

## Desarrollo de la calculadora

Hace falta [Node.js](https://nodejs.org) 22 o posterior. La única dependencia
es math.js, y solo para las pruebas (la página la carga desde un CDN).

Los componentes compartidos están en el submódulo `comun/`, así que hay que
clonar con `--recurse-submodules` (o, si ya está clonado, ejecutar
`git submodule update --init`):

```bash
git clone --recurse-submodules https://github.com/Ryzen648/gradientes-jacobianos.git
```

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

## Ejercicios del notebook (carpeta `ejercicios/`)

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
pip install -r ejercicios/requirements.txt
```

```bash
jupyter notebook ejercicios/gradientes_jacobianos.ipynb
```

Para correr las pruebas de Python:

```bash
pytest ejercicios/tests
```

## Verificar tus propias derivadas en Python

Desde la carpeta `ejercicios/`:

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
