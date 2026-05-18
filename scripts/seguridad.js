const fs = require('fs');
const path = require('path');

function getControllerFiles(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(getControllerFiles(full));
    } else if (file.endsWith('.controller.ts')) {
      results.push(full);
    }
  }
  return results;
}

const HTTP_METHODS = /(@Get|@Post|@Patch|@Put|@Delete)\s*\(/g;
const PROTECCION = /(solicitanteRol|@UseGuards|x-rol-solicitante|Headers\(|AdminGuard)/;

const archivos = getControllerFiles('./src');

console.log('\n🔒 Métrica de Densidad de Seguridad por Controller:\n');

let totalEndpoints = 0;
let totalProtegidos = 0;

for (const fp of archivos) {
  const codigo = fs.readFileSync(fp, 'utf8');
  const lineas = codigo.split('\n');

  const nombre = path.basename(fp);
  let endpointsArchivo = 0;
  let protegidosArchivo = 0;

  for (let i = 0; i < lineas.length; i++) {
    if (HTTP_METHODS.test(lineas[i])) {
      HTTP_METHODS.lastIndex = 0; // reset regex
      endpointsArchivo++;

      // Busca protección en las 10 líneas anteriores y siguientes
      const contexto = lineas.slice(Math.max(0, i - 10), i + 10).join('\n');
      if (PROTECCION.test(contexto)) {
        protegidosArchivo++;
      }
    }
  }

  const densidad = endpointsArchivo > 0
    ? ((protegidosArchivo / endpointsArchivo) * 100).toFixed(0)
    : 0;

  const alerta = densidad < 50 ? ' ⚠️  BAJA' : densidad < 80 ? ' 🟡 MEDIA' : ' ✅ ALTA';

  console.log(`📄 ${nombre}`);
  console.log(`   Endpoints totales   : ${endpointsArchivo}`);
  console.log(`   Endpoints protegidos: ${protegidosArchivo}`);
  console.log(`   Densidad de seguridad: ${densidad}% ${alerta}`);
  console.log();

  totalEndpoints += endpointsArchivo;
  totalProtegidos += protegidosArchivo;
}

const densidadTotal = totalEndpoints > 0
  ? ((totalProtegidos / totalEndpoints) * 100).toFixed(0)
  : 0;

console.log('─'.repeat(50));
console.log(`📊 Total endpoints       : ${totalEndpoints}`);
console.log(`🔐 Total protegidos      : ${totalProtegidos}`);
console.log(`⚠️  Total desprotegidos  : ${totalEndpoints - totalProtegidos}`);
console.log(`🔒 Densidad global       : ${densidadTotal}%`);
console.log(`⚠️  Umbral recomendado   : ≥ 80%\n`);
