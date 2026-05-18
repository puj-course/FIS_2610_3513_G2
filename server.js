// ─────────────────────────────────────────────
//  RecetaYa — Mock Backend Server
//  Run: node server.js
//  Runs on: http://localhost:3000
// ─────────────────────────────────────────────

const http = require('http');
const url  = require('url');

// ── MOCK DATABASE ─────────────────────────────
// This simulates your Prisma/PostgreSQL ingrediente table.
// Replace these with real DB calls when you're ready.
const ingredientes = [
  { idingrediente: 1,  nombre: 'Arroz' },
  { idingrediente: 2,  nombre: 'Pollo' },
  { idingrediente: 3,  nombre: 'Papa criolla' },
  { idingrediente: 4,  nombre: 'Papa pastusa' },
  { idingrediente: 5,  nombre: 'Mazorca' },
  { idingrediente: 6,  nombre: 'Guascas' },
  { idingrediente: 7,  nombre: 'Hogao' },
  { idingrediente: 8,  nombre: 'Cilantro' },
  { idingrediente: 9,  nombre: 'Cebolla larga' },
  { idingrediente: 10, nombre: 'Cebolla cabezona' },
  { idingrediente: 11, nombre: 'Tomate' },
  { idingrediente: 12, nombre: 'Ajo' },
  { idingrediente: 13, nombre: 'Comino' },
  { idingrediente: 14, nombre: 'Sal' },
  { idingrediente: 15, nombre: 'Pimienta' },
  { idingrediente: 16, nombre: 'Aceite' },
  { idingrediente: 17, nombre: 'Mantequilla' },
  { idingrediente: 18, nombre: 'Leche' },
  { idingrediente: 19, nombre: 'Queso campesino' },
  { idingrediente: 20, nombre: 'Queso costeño' },
  { idingrediente: 21, nombre: 'Huevo' },
  { idingrediente: 22, nombre: 'Harina de trigo' },
  { idingrediente: 23, nombre: 'Harina de maíz' },
  { idingrediente: 24, nombre: 'Panela' },
  { idingrediente: 25, nombre: 'Azúcar' },
  { idingrediente: 26, nombre: 'Aguacate' },
  { idingrediente: 27, nombre: 'Plátano maduro' },
  { idingrediente: 28, nombre: 'Plátano verde' },
  { idingrediente: 29, nombre: 'Frijoles' },
  { idingrediente: 30, nombre: 'Lentejas' },
  { idingrediente: 31, nombre: 'Chicharrón' },
  { idingrediente: 32, nombre: 'Costilla de res' },
  { idingrediente: 33, nombre: 'Costilla de cerdo' },
  { idingrediente: 34, nombre: 'Carne molida' },
  { idingrediente: 35, nombre: 'Carne de res' },
  { idingrediente: 36, nombre: 'Lomo de cerdo' },
  { idingrediente: 37, nombre: 'Chorizo' },
  { idingrediente: 38, nombre: 'Morcilla' },
  { idingrediente: 39, nombre: 'Bocachico' },
  { idingrediente: 40, nombre: 'Bagre' },
  { idingrediente: 41, nombre: 'Camarón' },
  { idingrediente: 42, nombre: 'Mejillones' },
  { idingrediente: 43, nombre: 'Coco' },
  { idingrediente: 44, nombre: 'Leche de coco' },
  { idingrediente: 45, nombre: 'Ñame' },
  { idingrediente: 46, nombre: 'Yuca' },
  { idingrediente: 47, nombre: 'Ahuyama' },
  { idingrediente: 48, nombre: 'Habichuela' },
  { idingrediente: 49, nombre: 'Arveja' },
  { idingrediente: 50, nombre: 'Zanahoria' },
  { idingrediente: 51, nombre: 'Limón' },
  { idingrediente: 52, nombre: 'Naranja' },
  { idingrediente: 53, nombre: 'Tamarindo' },
  { idingrediente: 54, nombre: 'Maracuyá' },
  { idingrediente: 55, nombre: 'Guanábana' },
  { idingrediente: 56, nombre: 'Arequipe' },
  { idingrediente: 57, nombre: 'Bocadillo' },
  { idingrediente: 58, nombre: 'Chontaduro' },
  { idingrediente: 59, nombre: 'Pipián' },
  { idingrediente: 60, nombre: 'Maíz peto' },
];

// ── ROUTES ────────────────────────────────────
function handleRequest(req, res) {
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const query    = parsed.query;

  // CORS headers — allows your HTML file to call this server
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /ingredientes/autocomplete?q=...
  if (req.method === 'GET' && pathname === '/ingredientes/autocomplete') {
    const q = (query.q || '').trim();

    if (!q || q.length < 2) {
      res.writeHead(200);
      res.end(JSON.stringify([]));
      return;
    }

    const results = ingredientes
      .filter(i => i.nombre.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 10)
      .map(i => ({ idingrediente: i.idingrediente, nombre: i.nombre }));

    res.writeHead(200);
    res.end(JSON.stringify(results));
    return;
  }

  // GET /ingredientes — return all
  if (req.method === 'GET' && pathname === '/ingredientes') {
    res.writeHead(200);
    res.end(JSON.stringify(ingredientes));
    return;
  }

  // 404 fallback
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

// ── START ─────────────────────────────────────
const PORT = 8080;
const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`\n✅  RecetaYa mock server running at http://localhost:${PORT}`);
  console.log(`   GET /ingredientes/autocomplete?q=arr`);
  console.log(`   GET /ingredientes\n`);
});