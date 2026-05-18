const fs = require('fs');
const path = require('path');

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

console.log('\n🚦 Detección de ausencia de Rate Limiting (riesgo DDoS)\n');

const HTTP_METHODS = /@(Get|Post|Patch|Put|Delete)\s*\(/;
const RATE_LIMIT   = /@Throttle|@SkipThrottle|ThrottlerGuard|rate.?limit/i;

const controllers = getFiles('./src', f => f.endsWith('.controller.ts'));

let totalEndpoints  = 0;
let sinRateLimit    = 0;
let conRateLimit    = 0;

for (const fp of controllers) {
  const codigo = fs.readFileSync(fp, 'utf8');
  const lineas = codigo.split('\n');
  const nombre = path.basename(fp);
  const tieneGlobalThrottle = RATE_LIMIT.test(codigo);

  console.log(`📄 ${nombre}${tieneGlobalThrottle ? ' (throttle global detectado)' : ''}`);

  for (let i = 0; i < lineas.length; i++) {
    if (HTTP_METHODS.test(lineas[i])) {
      totalEndpoints++;
      const contexto = lineas.slice(Math.max(0, i - 5), i + 2).join('\n');
      const protegido = tieneGlobalThrottle || RATE_LIMIT.test(contexto);

      const metodo = lineas[i].trim();
      if (protegido) {
        conRateLimit++;
        console.log(`   ✅ ${metodo}`);
      } else {
        sinRateLimit++;
        console.log(`   ⚠️  ${metodo}  ← sin rate limiting`);
      }
    }
  }
  console.log();
}

const porcentajeVulnerable = totalEndpoints > 0
  ? ((sinRateLimit / totalEndpoints) * 100).toFixed(1)
  : 0;

console.log('─'.repeat(50));
console.log(`📊 Total endpoints          : ${totalEndpoints}`);
console.log(`✅ Con rate limiting         : ${conRateLimit}`);
console.log(`⚠️  Sin rate limiting (DDoS) : ${sinRateLimit}`);
console.log(`🔢 Exposición a DDoS         : ${porcentajeVulnerable}%`);
console.log(`✅ Umbral seguro             : 0% (todos protegidos)\n`);
