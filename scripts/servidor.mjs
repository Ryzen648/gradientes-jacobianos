// Servidor estático mínimo para desarrollo: `npm run servir`.
// Los módulos ES no cargan desde file://, así que hace falta servir la carpeta.
// Sin dependencias; no es para producción (GitHub Pages sirve el sitio real).

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PUERTO = Number(process.env.PORT) || 8765;
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

createServer(async (peticion, respuesta) => {
  const ruta = decodeURIComponent(new URL(peticion.url, "http://localhost").pathname);
  const archivo = normalize(join(RAIZ, ruta.endsWith("/") ? `${ruta}index.html` : ruta));
  // No servir nada fuera de la carpeta del proyecto.
  if (archivo !== RAIZ && !archivo.startsWith(RAIZ + sep)) {
    respuesta.writeHead(403).end("Prohibido");
    return;
  }
  try {
    const datos = await readFile(archivo);
    respuesta.writeHead(200, {
      "Content-Type": TIPOS[extname(archivo)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    respuesta.end(datos);
  } catch {
    respuesta.writeHead(404).end("No encontrado");
  }
}).listen(PUERTO, "127.0.0.1", () => {
  console.log(`Calculadora en http://localhost:${PUERTO}/`);
});
