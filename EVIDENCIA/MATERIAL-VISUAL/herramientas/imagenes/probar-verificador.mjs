// Prueba acotada del verificador: daña dos cosas del inventario (un archivo de receta cambiado y una ficha sin archivo
// presentada como imagen), corre el verificador, que tiene que fallar con salida 1, y restaura el inventario original.
// Uso: node probar-verificador.mjs <raíz del repositorio>
import fs from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const raiz = process.argv[2];
const ruta = join(raiz, 'EVIDENCIA', 'MATERIAL-VISUAL', 'inventario.json');
const original = fs.readFileSync(ruta, 'utf8');
try {
  const inv = JSON.parse(original);
  inv.contenidos.find((c) => c.id === 'receta-03').archivo = '03-otra-cosa.jpg';
  inv.contenidos.find((c) => c.id === 'alimento-A07').estadoDeRevision = 'ARCHIVO_REAL_PENDIENTE_DE_REVISION_HUMANA';
  fs.writeFileSync(ruta, JSON.stringify(inv, null, 2));
  const r = spawnSync(process.execPath, [join(raiz, 'EVIDENCIA', 'MATERIAL-VISUAL', 'herramientas', 'verificar.mjs')], { encoding: 'utf8' });
  console.log(r.stdout.split('\n').filter((l) => l.includes('PROBLEMAS') || l.trim().startsWith('- ')).join('\n'));
  console.log(`salida del verificador con el inventario dañado: ${r.status} (se espera 1)`);
} finally {
  fs.writeFileSync(ruta, original);
  console.log(`inventario restaurado: ${fs.readFileSync(ruta, 'utf8') === original}`);
}
