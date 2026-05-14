const fs   = require('fs');
const path = require('path');
const ts   = require('typescript');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFiles(dir, filtro) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(getFiles(full, filtro));
    } else if (filtro(file)) {
      results.push(full);
    }
  }
  return results;
}

// ─── MÉTRICA 1: Complejidad Ciclomática ───────────────────────────────────────

function calcularComplejidad(nodo) {
  let complejidad = 1;
  function visitar(n) {
    switch (n.kind) {
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.CaseClause:
      case ts.SyntaxKind.CatchClause:
      case ts.SyntaxKind.ConditionalExpression:
      case ts.SyntaxKind.AmpersandAmpersandToken:
      case ts.SyntaxKind.BarBarToken:
      case ts.SyntaxKind.QuestionQuestionToken:
        complejidad++;
        break;
    }
    ts.forEachChild(n, visitar);
  }
  visitar(nodo);
  return complejidad;
}

function metricaComplejidad() {
  const archivos = [
    './src/recetas/recetas.service.ts',
    './src/recetas/receta-creacion-base.service.ts',
    './src/moderacion/moderacion.service.ts',
    './src/usuarios/usuarios.service.ts',
  ];

  const resultados = [];

  for (const ruta of archivos) {
    if (!fs.existsSync(ruta)) continue;
    const codigo     = fs.readFileSync(ruta, 'utf8');
    const sourceFile = ts.createSourceFile(path.basename(ruta), codigo, ts.ScriptTarget.Latest, true);
    const funciones  = [];

    function analizar(nodo) {
      if (ts.isMethodDeclaration(nodo) || ts.isFunctionDeclaration(nodo) || ts.isArrowFunction(nodo)) {
        const nombre = (ts.isMethodDeclaration(nodo) || ts.isFunctionDeclaration(nodo))
          ? (nodo.name?.getText(sourceFile) || 'anónima')
          : 'arrow';
        funciones.push({ nombre, cc: calcularComplejidad(nodo) });
      }
      ts.forEachChild(nodo, analizar);
    }

    analizar(sourceFile);
    resultados.push({ archivo: path.basename(ruta), funciones });
  }

  return resultados;
}

// ─── MÉTRICA 2: Densidad de Seguridad ─────────────────────────────────────────

function metricaSeguridad() {
  const HTTP_METHODS = /(@Get|@Post|@Patch|@Put|@Delete)\s*\(/g;
  const PROTECCION   = /(solicitanteRol|@UseGuards|x-rol-solicitante|Headers\(|AdminGuard)/;
  const controllers  = getFiles('./src', f => f.endsWith('.controller.ts'));

  const resultados = [];
  let totalEndpoints = 0, totalProtegidos = 0;

  for (const fp of controllers) {
    const codigo = fs.readFileSync(fp, 'utf8');
    const lineas = codigo.split('\n');
    let endpointsArchivo = 0, protegidosArchivo = 0;

    for (let i = 0; i < lineas.length; i++) {
      if (HTTP_METHODS.test(lineas[i])) {
        HTTP_METHODS.lastIndex = 0;
        endpointsArchivo++;
        const contexto = lineas.slice(Math.max(0, i - 10), i + 10).join('\n');
        if (PROTECCION.test(contexto)) protegidosArchivo++;
      }
    }

    totalEndpoints  += endpointsArchivo;
    totalProtegidos += protegidosArchivo;

    resultados.push({
      archivo: path.basename(fp),
      total: endpointsArchivo,
      protegidos: protegidosArchivo,
      densidad: endpointsArchivo > 0 ? ((protegidosArchivo / endpointsArchivo) * 100).toFixed(0) : 0,
    });
  }

  return { resultados, totalEndpoints, totalProtegidos };
}

// ─── MÉTRICA 3: Riesgo DDoS (Rate Limiting) ───────────────────────────────────

function metricaDDoS() {
  const HTTP_METHODS = /@(Get|Post|Patch|Put|Delete)\s*\(/;
  const RATE_LIMIT   = /@Throttle|@SkipThrottle|ThrottlerGuard|rate.?limit/i;
  const controllers  = getFiles('./src', f => f.endsWith('.controller.ts'));

  const resultados = [];
  let totalEndpoints = 0, sinRateLimit = 0, conRateLimit = 0;

  for (const fp of controllers) {
    const codigo  = fs.readFileSync(fp, 'utf8');
    const lineas  = codigo.split('\n');
    const nombre  = path.basename(fp);
    const global  = RATE_LIMIT.test(codigo);
    const endpoints = [];

    for (let i = 0; i < lineas.length; i++) {
      if (HTTP_METHODS.test(lineas[i])) {
        totalEndpoints++;
        const contexto  = lineas.slice(Math.max(0, i - 5), i + 2).join('\n');
        const protegido = global || RATE_LIMIT.test(contexto);
        protegido ? conRateLimit++ : sinRateLimit++;
        endpoints.push({ metodo: lineas[i].trim(), protegido });
      }
    }

    resultados.push({ archivo: nombre, endpoints });
  }

  const exposicion = totalEndpoints > 0
    ? ((sinRateLimit / totalEndpoints) * 100).toFixed(1)
    : 0;

  return { resultados, totalEndpoints, sinRateLimit, conRateLimit, exposicion };
}

// ─── Recolectar datos ─────────────────────────────────────────────────────────

console.log('⏳ Recolectando métricas...');
const complejidad = metricaComplejidad();
const seguridad   = metricaSeguridad();
const ddos        = metricaDDoS();
const fechaHora   = new Date().toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' });

// ─── Generar HTML ─────────────────────────────────────────────────────────────

function badge(valor, umbralOk, umbralWarn, invertido = false) {
  const n = parseFloat(valor);
  let cls;
  if (invertido) {
    cls = n <= umbralOk ? 'badge-ok' : n <= umbralWarn ? 'badge-warn' : 'badge-bad';
  } else {
    cls = n >= umbralOk ? 'badge-ok' : n >= umbralWarn ? 'badge-warn' : 'badge-bad';
  }
  return `<span class="badge ${cls}">${valor}</span>`;
}

// Complejidad HTML
const htmlComplejidad = complejidad.map(({ archivo, funciones }) => {
  const filas = funciones.map(({ nombre, cc }) => {
    const cls = cc > 10 ? 'row-bad' : cc > 5 ? 'row-warn' : '';
    return `<tr class="${cls}"><td>${nombre}</td><td>${cc}</td><td>${cc > 10 ? '⚠️ ALTA' : cc > 5 ? '🟡 MEDIA' : '✅ BAJA'}</td></tr>`;
  }).join('');
  return `
    <div class="card">
      <div class="card-header">📄 ${archivo}</div>
      <table>
        <thead><tr><th>Función</th><th>CC</th><th>Nivel</th></tr></thead>
        <tbody>${filas || '<tr><td colspan="3" class="muted">Sin funciones detectadas</td></tr>'}</tbody>
      </table>
    </div>`;
}).join('');

// Seguridad HTML
const htmlSeguridad = seguridad.resultados.map(({ archivo, total, protegidos, densidad }) => {
  const desprotegidos = total - protegidos;
  const d = parseInt(densidad);
  const color = d < 50 ? 'var(--bad)' : d < 80 ? 'var(--warn)' : 'var(--ok)';
  return `
    <div class="card">
      <div class="card-header">📄 ${archivo}</div>
      <div class="stat-row">
        <div class="stat"><span class="stat-num">${total}</span><span class="stat-label">Endpoints</span></div>
        <div class="stat"><span class="stat-num ok">${protegidos}</span><span class="stat-label">Protegidos</span></div>
        <div class="stat"><span class="stat-num bad">${desprotegidos}</span><span class="stat-label">Desprotegidos</span></div>
        <div class="stat">
          <span class="stat-num" style="color:${color}">${densidad}%</span>
          <span class="stat-label">Densidad</span>
        </div>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${densidad}%;background:${color}"></div></div>
    </div>`;
}).join('');

const densidadGlobal = seguridad.totalEndpoints > 0
  ? ((seguridad.totalProtegidos / seguridad.totalEndpoints) * 100).toFixed(0)
  : 0;

// DDoS HTML
const htmlDdos = ddos.resultados.map(({ archivo, endpoints }) => {
  const filas = endpoints.map(({ metodo, protegido }) =>
    `<tr class="${protegido ? '' : 'row-bad'}">
      <td>${metodo}</td>
      <td>${protegido ? '✅ Protegido' : '⚠️ Sin rate limit'}</td>
    </tr>`
  ).join('');
  return `
    <div class="card">
      <div class="card-header">📄 ${archivo}</div>
      <table>
        <thead><tr><th>Endpoint</th><th>Estado</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`;
}).join('');

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reporte de Calidad — RecetasYA</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;600&display=swap');

    :root {
      --bg:      #0f1117;
      --surface: #181c27;
      --border:  #252a3a;
      --text:    #e2e8f0;
      --muted:   #64748b;
      --ok:      #22d3a5;
      --warn:    #f59e0b;
      --bad:     #f43f5e;
      --accent:  #6366f1;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'IBM Plex Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 0 0 60px;
    }

    header {
      background: linear-gradient(135deg, #1a1f35 0%, #0f1117 100%);
      border-bottom: 1px solid var(--border);
      padding: 40px 48px 32px;
      position: relative;
      overflow: hidden;
    }

    header::before {
      content: '';
      position: absolute;
      top: -80px; right: -80px;
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    .header-tag {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      color: var(--accent);
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    header h1 {
      font-size: 32px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }

    header h1 span { color: var(--accent); }

    .header-meta {
      font-size: 13px;
      color: var(--muted);
      margin-top: 8px;
      font-family: 'IBM Plex Mono', monospace;
    }

    .summary-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: var(--border);
      border-bottom: 1px solid var(--border);
    }

    .summary-item {
      background: var(--surface);
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .summary-item .s-label {
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 2px;
      font-family: 'IBM Plex Mono', monospace;
    }

    .summary-item .s-value {
      font-size: 28px;
      font-weight: 600;
      font-family: 'IBM Plex Mono', monospace;
    }

    .s-value.ok   { color: var(--ok); }
    .s-value.warn { color: var(--warn); }
    .s-value.bad  { color: var(--bad); }

    main { padding: 40px 48px; max-width: 1200px; margin: 0 auto; }

    .section { margin-bottom: 56px; }

    .section-header {
      display: flex;
      align-items: baseline;
      gap: 16px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }

    .section-header h2 {
      font-size: 18px;
      font-weight: 600;
    }

    .section-header .section-tag {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 12px;
    }

    .card-header {
      padding: 12px 20px;
      background: #1e2334;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 13px;
      color: var(--accent);
      border-bottom: 1px solid var(--border);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th {
      text-align: left;
      padding: 10px 20px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--muted);
      background: #161a28;
      font-family: 'IBM Plex Mono', monospace;
      border-bottom: 1px solid var(--border);
    }

    td {
      padding: 10px 20px;
      border-bottom: 1px solid var(--border);
      font-family: 'IBM Plex Mono', monospace;
    }

    tr:last-child td { border-bottom: none; }

    .row-bad  td { background: rgba(244,63,94,0.06); }
    .row-warn td { background: rgba(245,158,11,0.06); }

    .muted { color: var(--muted); font-style: italic; }

    .stat-row {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border);
    }

    .stat {
      flex: 1;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      border-right: 1px solid var(--border);
    }

    .stat:last-child { border-right: none; }

    .stat-num {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 22px;
      font-weight: 600;
    }

    .stat-num.ok  { color: var(--ok); }
    .stat-num.bad { color: var(--bad); }

    .stat-label {
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .progress-bar {
      height: 3px;
      background: var(--border);
    }

    .progress-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .badge {
      display: inline-block;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    .badge-ok   { background: rgba(34,211,165,0.15); color: var(--ok); }
    .badge-warn { background: rgba(245,158,11,0.15);  color: var(--warn); }
    .badge-bad  { background: rgba(244,63,94,0.15);   color: var(--bad); }

    footer {
      text-align: center;
      font-size: 12px;
      color: var(--muted);
      font-family: 'IBM Plex Mono', monospace;
      padding-top: 40px;
    }
  </style>
</head>
<body>

<header>
  <div class="header-tag">Reporte de Calidad de Software</div>
  <h1>RecetasYA <span>/ Métricas</span></h1>
  <div class="header-meta">Generado el ${fechaHora}</div>
</header>

<div class="summary-bar">
  <div class="summary-item">
    <span class="s-label">Archivos analizados</span>
    <span class="s-value">${complejidad.length}</span>
  </div>
  <div class="summary-item">
    <span class="s-label">Densidad de seguridad</span>
    <span class="s-value ${parseInt(densidadGlobal) >= 80 ? 'ok' : parseInt(densidadGlobal) >= 50 ? 'warn' : 'bad'}">${densidadGlobal}%</span>
  </div>
  <div class="summary-item">
    <span class="s-label">Endpoints sin rate limit</span>
    <span class="s-value ${ddos.sinRateLimit === 0 ? 'ok' : 'bad'}">${ddos.sinRateLimit}/${ddos.totalEndpoints}</span>
  </div>
  <div class="summary-item">
    <span class="s-label">Exposición DDoS</span>
    <span class="s-value ${parseFloat(ddos.exposicion) === 0 ? 'ok' : parseFloat(ddos.exposicion) < 50 ? 'warn' : 'bad'}">${ddos.exposicion}%</span>
  </div>
</div>

<main>

  <!-- MÉTRICA 1 -->
  <div class="section">
    <div class="section-header">
      <h2>Complejidad Ciclomática</h2>
      <span class="section-tag">Métrica 1 · Umbral ≤ 10 por función</span>
    </div>
    ${htmlComplejidad}
  </div>

  <!-- MÉTRICA 2 -->
  <div class="section">
    <div class="section-header">
      <h2>Densidad de Seguridad</h2>
      <span class="section-tag">Métrica 2 · Umbral ≥ 80% de endpoints protegidos</span>
    </div>
    ${htmlSeguridad}
    <div class="card" style="margin-top:4px">
      <div class="stat-row">
        <div class="stat">
          <span class="stat-num">${seguridad.totalEndpoints}</span>
          <span class="stat-label">Total endpoints</span>
        </div>
        <div class="stat">
          <span class="stat-num ok">${seguridad.totalProtegidos}</span>
          <span class="stat-label">Protegidos</span>
        </div>
        <div class="stat">
          <span class="stat-num bad">${seguridad.totalEndpoints - seguridad.totalProtegidos}</span>
          <span class="stat-label">Desprotegidos</span>
        </div>
        <div class="stat">
          <span class="stat-num ${parseInt(densidadGlobal) >= 80 ? 'ok' : 'bad'}">${densidadGlobal}%</span>
          <span class="stat-label">Densidad global</span>
        </div>
      </div>
    </div>
  </div>

  <!-- MÉTRICA 3 -->
  <div class="section">
    <div class="section-header">
      <h2>Riesgo DDoS — Rate Limiting</h2>
      <span class="section-tag">Métrica 3 · Umbral: 0% de exposición</span>
    </div>
    ${htmlDdos}
    <div class="card" style="margin-top:4px">
      <div class="stat-row">
        <div class="stat">
          <span class="stat-num">${ddos.totalEndpoints}</span>
          <span class="stat-label">Total endpoints</span>
        </div>
        <div class="stat">
          <span class="stat-num ok">${ddos.conRateLimit}</span>
          <span class="stat-label">Con rate limit</span>
        </div>
        <div class="stat">
          <span class="stat-num bad">${ddos.sinRateLimit}</span>
          <span class="stat-label">Sin rate limit</span>
        </div>
        <div class="stat">
          <span class="stat-num ${parseFloat(ddos.exposicion) === 0 ? 'ok' : 'bad'}">${ddos.exposicion}%</span>
          <span class="stat-label">Exposición DDoS</span>
        </div>
      </div>
    </div>
  </div>

</main>

<footer>
  reporte generado automáticamente · node scripts/reporte.js
</footer>

</body>
</html>`;

// ─── Escribir archivo ─────────────────────────────────────────────────────────

if (!fs.existsSync('./reports')) fs.mkdirSync('./reports');
fs.writeFileSync('./reports/reporte-calidad.html', html, 'utf8');
console.log('✅ Reporte generado en: reports/reporte-calidad.html');
