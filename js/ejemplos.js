// Ejemplos precargados. El nombre visible está en el diccionario, en la
// clave `ejemplo.<id>`. `orden` solo hace falta cuando el orden alfabético
// de las variables no es el habitual (p. ej. coordenadas esféricas).

export const EJEMPLOS = Object.freeze([
  // --- Cálculo ---
  {
    id: "gradienteR2", grupo: "calculo",
    funciones: ["x^2*y + sin(x*y)"],
    valores: { x: "1.3", y: "-0.7" },
  },
  {
    id: "polares", grupo: "calculo",
    funciones: ["r*cos(t)", "r*sin(t)"],
    valores: { r: "2", t: "pi/6" },
  },
  {
    id: "r3r2", grupo: "calculo",
    funciones: ["x*y*z", "x^2 + exp(y)*sin(z)"],
    valores: { x: "0.5", y: "-1.2", z: "2" },
  },
  {
    id: "esfericas", grupo: "calculo",
    funciones: ["p*sin(f)*cos(t)", "p*sin(f)*sin(t)", "p*cos(f)"],
    valores: { p: "2", t: "0.8", f: "1.1" },
    orden: "p, t, f",
  },
  {
    id: "logSumExp", grupo: "calculo",
    funciones: ["log(exp(a) + exp(b) + exp(c))"],
    valores: { a: "0.2", b: "-1", c: "1.5" },
  },

  // --- Aprendizaje automático ---
  {
    // σ(x) = 1 / (1 + e^{-x});  σ'(x) = σ(x)(1 − σ(x))
    id: "sigmoide", grupo: "ml",
    funciones: ["1/(1 + exp(-x))"],
    valores: { x: "0.5" },
  },
  {
    // s_i = e^{z_i} / Σ e^{z_k};  J = diag(s) − s sᵀ  (det J = 0: las filas suman 0)
    id: "softmax", grupo: "ml",
    funciones: [
      "exp(a)/(exp(a) + exp(b) + exp(c))",
      "exp(b)/(exp(a) + exp(b) + exp(c))",
      "exp(c)/(exp(a) + exp(b) + exp(c))",
    ],
    valores: { a: "1", b: "2", c: "0.5" },
  },
  {
    // Capa densa y = tanh(Wx + b) con W = [[0.5, -1.2], [0.8, 0.3]], b = [0.1, -0.4];
    // J = diag(1 − tanh²(Wx + b)) · W
    id: "capaDensa", grupo: "ml",
    funciones: ["tanh(0.5*x - 1.2*y + 0.1)", "tanh(0.8*x + 0.3*y - 0.4)"],
    valores: { x: "1", y: "-1" },
  },
]);

export const GRUPOS = Object.freeze(["calculo", "ml"]);
export const EJEMPLO_INICIAL = "polares";
