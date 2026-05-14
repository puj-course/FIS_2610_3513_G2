import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

function calcularComplejidad(nodo: ts.Node): number {
  let complejidad = 1;
  function visitar(n: ts.Node) {
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

const archivos = [
  './src/recetas/recetas.service.ts',
  './src/recetas/receta-creacion-base.service.ts',
  './src/moderacion/moderacion.service.ts',
  './src/usuarios/usuarios.service.ts',
];

console.log('\n🔍 ANÁLISIS DE COMPLEJIDAD CICLOMÁTICA');
console.log('='.repeat(60));

archivos.forEach(function(ruta) {
  const codigo = fs.readFileSync(ruta, 'utf8');
  const sourceFile = ts.createSourceFile(
    path.basename(ruta),
    codigo,
    ts.ScriptTarget.Latest,
    true
  );

  console.log(`\n📄 ${path.basename(ruta)}`);
  console.log('─'.repeat(50));

  let hayAlta = false;

  function analizarFunciones(nodo: ts.Node) {
    if (
      ts.isMethodDeclaration(nodo) ||
      ts.isFunctionDeclaration(nodo) ||
      ts.isArrowFunction(nodo)
    ) {
      const nombre = ts.isMethodDeclaration(nodo) || ts.isFunctionDeclaration(nodo)
        ? (nodo.name?.getText(sourceFile) || 'anónima')
        : 'arrow';

      const complejidad = calcularComplejidad(nodo);
      const estado = complejidad > 10 ? '⚠️  ALTA' : '✓    ';
      if (complejidad > 10) hayAlta = true;

      console.log(`  ${estado}  ${nombre.padEnd(35)} complejidad: ${complejidad}`);
    }
    ts.forEachChild(nodo, analizarFunciones);
  }

  analizarFunciones(sourceFile);

  if (!hayAlta) console.log('  Todas las funciones dentro del umbral (≤ 10)');
});

console.log('\n' + '='.repeat(60));
console.log('Umbral recomendado: ≤ 10 por función\n');
