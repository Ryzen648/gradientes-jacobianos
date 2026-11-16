// Ejemplos precargados. El nombre visible está en el diccionario, en la
// clave `ejemplo.<id>`.

export const EJEMPLOS = Object.freeze([
  { id: "gradienteR2", variables: "x, y", funciones: ["x^2*y + sin(x*y)"], punto: "1.3, -0.7" },
  { id: "polares", variables: "r, t", funciones: ["r*cos(t)", "r*sin(t)"], punto: "2, pi/6" },
  { id: "r3r2", variables: "x, y, z", funciones: ["x*y*z", "x^2 + exp(y)*sin(z)"], punto: "0.5, -1.2, 2" },
  { id: "esfericas", variables: "p, t, f", funciones: ["p*sin(f)*cos(t)", "p*sin(f)*sin(t)", "p*cos(f)"], punto: "2, 0.8, 1.1" },
  { id: "logSumExp", variables: "a, b, c", funciones: ["log(exp(a) + exp(b) + exp(c))"], punto: "0.2, -1, 1.5" },
]);

export const EJEMPLO_INICIAL = "polares";
