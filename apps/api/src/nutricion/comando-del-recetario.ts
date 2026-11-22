/**
 * DL-191 (REC-09) · el comando de la semilla del Recetario de BE. Lo corre a mano quien opera la base, nunca la API al
 * arrancar ni una migración:
 *
 *   node apps/api/dist/nutricion/comando-del-recetario.js revisar
 *   node apps/api/dist/nutricion/comando-del-recetario.js sembrar --confirmo-escritura --operador "<quién lo corre>"
 *
 * - `revisar` no toca la base: lee las 66 recetas de los manifiestos y dice cuántas hay y si tienen la forma esperada.
 * - `sembrar` escribe lo que falta (idempotente: otra corrida no cambia nada) y dice qué creó, qué ya estaba y qué no
 *   entró porque un alimento del catálogo no está disponible. Lee `DATABASE_URL` y `APP_ENV`.
 * - **Solo una base local** (localhost, 127.0.0.1 o ::1). Contra otra base pide además `--base-remota-autorizada`: cargar
 *   el recetario en el entorno de test lo decide Dirección (encargo del 2026-11-22), no quien programa.
 * Se corre desde la raíz del repositorio (lee los manifiestos de `EVIDENCIA/`), después de `npm run build:api`.
 */
import { PrismaClient } from '@prisma/client';
import { leerSemillaDelRecetario, sembrarRecetario } from './semilla-del-recetario';

const AYUDA = [
  'Uso (desde la raíz del repositorio, después de npm run build:api):',
  '  revisar                                               lee las 66 recetas sin tocar la base',
  '  sembrar --confirmo-escritura --operador "<quién>"     escribe lo que falta en la base de DATABASE_URL',
  'Contra una base que no es local, además: --base-remota-autorizada (lo decide Dirección).',
].join('\n');

class ErrorDelComando extends Error {}

const BASES_LOCALES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

/** Si la base de `DATABASE_URL` es local. Una URL que no se entiende no es local. */
export function esBaseLocal(url: string): boolean {
  try {
    return BASES_LOCALES.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

async function principal(): Promise<number> {
  const [accion, ...resto] = process.argv.slice(2);
  const raiz = process.cwd();
  if (!accion || accion === '--ayuda' || accion === 'ayuda') {
    process.stdout.write(`${AYUDA}\n`);
    return accion ? 0 : 1;
  }
  if (accion === 'revisar') {
    const recetas = leerSemillaDelRecetario(raiz);
    const codigos = new Set(recetas.map((r) => r.codigo));
    const nombres = new Set(recetas.map((r) => r.nombre));
    process.stdout.write(`${recetas.length} recetas (${codigos.size} códigos y ${nombres.size} nombres distintos), ${recetas.reduce((n, r) => n + r.ingredientes.length, 0)} ingredientes. No se tocó la base.\n`);
    return recetas.length === codigos.size && codigos.size === nombres.size ? 0 : 1;
  }
  if (accion !== 'sembrar') throw new ErrorDelComando(`Acción desconocida: ${accion.slice(0, 40)}\n${AYUDA}`);
  const marcas = new Set(resto.filter((a) => a.startsWith('--')));
  const i = resto.indexOf('--operador');
  const operador = i >= 0 ? (resto[i + 1] ?? '').trim() : '';
  if (!marcas.has('--confirmo-escritura')) throw new ErrorDelComando(`Falta --confirmo-escritura: sembrar escribe en la base.\n${AYUDA}`);
  if (!operador || operador.startsWith('--')) throw new ErrorDelComando(`Falta --operador: queda en la procedencia de cada receta.\n${AYUDA}`);
  const url = process.env.DATABASE_URL ?? '';
  if (!url) throw new ErrorDelComando('Falta DATABASE_URL.');
  if (!esBaseLocal(url) && !marcas.has('--base-remota-autorizada')) {
    throw new ErrorDelComando('La base no es local. Cargar el recetario en otro entorno lo decide Dirección: si ya lo decidió, sumá --base-remota-autorizada.');
  }
  const prisma = new PrismaClient();
  try {
    const informe = await sembrarRecetario(prisma, leerSemillaDelRecetario(raiz), { operador, comando: 'comando-del-recetario sembrar', appEnv: process.env.APP_ENV ?? null, momento: new Date().toISOString() });
    process.stdout.write(
      [
        `Creadas: ${informe.creadas.length}${informe.creadas.length ? ` (${informe.creadas.join(', ')})` : ''}.`,
        `Ya estaban: ${informe.yaEstaban.length}.`,
        `Sin cargar porque un alimento no está disponible: ${informe.conProblemas.length}${informe.conProblemas.length ? ` (${informe.conProblemas.map((p) => `${p.codigo}: ingrediente ${p.ingredientes.join(', ')}`).join('; ')})` : ''}.`,
      ].join('\n') + '\n',
    );
    return informe.conProblemas.length === 0 ? 0 : 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  principal()
    .then((codigo) => process.exit(codigo))
    .catch((e: unknown) => {
      if (e instanceof ErrorDelComando) {
        process.stderr.write(`${e.message}\n`);
        process.exit(1);
      }
      // Sin el detalle de la base: un mensaje de Prisma puede nombrar la URL o el host.
      process.stderr.write(`Falla inesperada: ${e instanceof Error ? e.name : 'error'}. Cada receta es una transacción: lo creado quedó, y otra corrida sigue desde ahí.\n`);
      process.exit(2);
    });
}
