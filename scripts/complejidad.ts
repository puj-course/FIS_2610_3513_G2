import { analyzeModule } from 'typhonjs-escomplex';
import * as fs from 'fs';

const codigo = fs.readFileSync(
  './src/recetas/recetas.service.ts',
  'utf8'
);

const resultado = analyzeModule(codigo);

resultado.methods.forEach((m: any) => {
  console.log(
    `${m.name}: complejidad ciclomática = ${m.cyclomatic}`
  );

  if (m.cyclomatic > 10) {
    console.warn(
      `${m.name} supera el umbral recomendado`
    );
  }
});
