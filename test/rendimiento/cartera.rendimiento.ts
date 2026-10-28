/**
 * Medición de la cartera del profesional (API-CAR-01) con 50, 100 y 200 personas sintéticas. Preparada el 2026-10-28,
 * sin correr todavía: ver EVIDENCIA/RENDIMIENTO-CARTERA/LEEME.md.
 *
 * Qué mide, para cada tamaño:
 * - la latencia de `GET /api/v1/me/portfolio` (mínimo, mediana, p95 y máximo de R lecturas, después de 3 de calentamiento);
 * - las filas que agrega cada lectura a `decision_de_acceso` (exacto: se cuentan antes y después);
 * - las transacciones confirmadas por lectura (aproximado: `pg_stat_database`, con una pausa para que se publiquen);
 * - cuántos ítems devuelve la cartera.
 *
 * Cómo se arma la población, igual que las pruebas de integración y por la API: un profesional con Nutrición y
 * Entrenamiento; cada persona con el vínculo de Nutrición; una de cada dos, también con Entrenamiento; una de cada cinco,
 * con un plan nutricional activado (camino `circuitoListoParaPlanificar`). Los tamaños se acumulan: 50, después 100 y
 * después 200 personas en la misma cartera.
 *
 * Solo corre con `BE_MEDIR_RENDIMIENTO=1`. Los resultados van a `BE_RENDIMIENTO_SALIDA` (por omisión,
 * EVIDENCIA/RENDIMIENTO-CARTERA/resultados), en JSON y en una tabla Markdown. Un resultado local describe esta máquina:
 * no dice nada de Render.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { appDePrueba, conSesion } from '../integration/soporte-api';
import { activar, circuitoListoParaPlanificar, crearBorrador } from '../integration/soporte-nutricion';
import { prepararAsesorado, prepararProfesional, vinculoCompleto, type Parte } from '../integration/soporte-vinculo';

const ACTIVA = process.env.BE_MEDIR_RENDIMIENTO === '1';
const TAMANIOS = (process.env.BE_CARTERA_TAMANIOS ?? '50,100,200').split(',').map((n) => Number.parseInt(n, 10)).filter((n) => n > 0).sort((a, b) => a - b);
const LECTURAS = Number.parseInt(process.env.BE_CARTERA_LECTURAS ?? '20', 10);
const CALENTAMIENTO = 3;
const PAUSA_DE_ESTADISTICAS_MS = 1_200;
const SALIDA = process.env.BE_RENDIMIENTO_SALIDA ?? join(__dirname, '..', '..', 'EVIDENCIA', 'RENDIMIENTO-CARTERA', 'resultados');

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = () => `rend-${++contador}-${randomUUID().slice(0, 4)}`;
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Medicion {
  readonly personas: number;
  readonly lecturas: number;
  readonly ms: { readonly minimo: number; readonly mediana: number; readonly p95: number; readonly maximo: number };
  readonly filasDeDecisionPorLectura: number;
  readonly transaccionesPorLecturaAprox: number;
  readonly items: number;
}

function percentil(valores: readonly number[], p: number): number {
  const ordenados = [...valores].sort((a, b) => a - b);
  const i = Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1);
  return Math.round(ordenados[Math.max(0, i)]! * 10) / 10;
}

async function transaccionesConfirmadas(): Promise<number> {
  const [fila] = await prisma.$queryRaw<{ xact: bigint }[]>`SELECT xact_commit AS "xact" FROM pg_stat_database WHERE datname = current_database()`;
  return Number(fila?.xact ?? 0);
}

/** Agrega personas a la cartera hasta llegar a `objetivo`. */
async function poblarHasta(pro: Parte, actuales: number, objetivo: number): Promise<void> {
  for (let i = actuales; i < objetivo; i++) {
    if (i % 5 === 4) {
      // Una de cada cinco: con plan nutricional activado (su propio camino crea la persona y el vínculo).
      const c = await circuitoListoParaPlanificar(app, etiqueta(), pro);
      const b = await crearBorrador(app, c);
      await activar(app, pro, b.planId, b.version).expect(200);
      if (i % 2 === 1) await vinculoCompleto(app, pro, c.ase, 'ENTRENAMIENTO');
      continue;
    }
    const ase = await prepararAsesorado(app, etiqueta(), { a3: true });
    await vinculoCompleto(app, pro, ase, 'NUTRICION');
    if (i % 2 === 1) await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
  }
}

async function medir(pro: Parte, personas: number): Promise<Medicion> {
  const leer = () => conSesion(app, pro.token).get('/api/v1/me/portfolio?limit=50').expect(200);
  for (let i = 0; i < CALENTAMIENTO; i++) await leer();
  const tiempos: number[] = [];
  const filas: number[] = [];
  const transacciones: number[] = [];
  let items = 0;
  for (let i = 0; i < LECTURAS; i++) {
    await esperar(PAUSA_DE_ESTADISTICAS_MS);
    const decisionesAntes = await prisma.decisionDeAcceso.count();
    const xactAntes = await transaccionesConfirmadas();
    const t0 = performance.now();
    const r = await leer();
    tiempos.push(performance.now() - t0);
    filas.push((await prisma.decisionDeAcceso.count()) - decisionesAntes);
    await esperar(PAUSA_DE_ESTADISTICAS_MS);
    // Resta las dos consultas de conteo y la propia lectura de estadísticas de esta prueba.
    transacciones.push(Math.max(0, (await transaccionesConfirmadas()) - xactAntes - 3));
    items = r.body.data.items.length;
  }
  const promedio = (v: readonly number[]) => Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10;
  return {
    personas,
    lecturas: LECTURAS,
    ms: { minimo: percentil(tiempos, 0), mediana: percentil(tiempos, 50), p95: percentil(tiempos, 95), maximo: percentil(tiempos, 100) },
    filasDeDecisionPorLectura: promedio(filas),
    transaccionesPorLecturaAprox: promedio(transacciones),
    items,
  };
}

function guardar(resultados: readonly Medicion[]): void {
  mkdirSync(SALIDA, { recursive: true });
  const cuando = new Date().toISOString();
  const maquina = { cpus: cpus().length, memoriaGb: Math.round((totalmem() / 1024 ** 3) * 10) / 10, node: process.version };
  const base = join(SALIDA, `cartera-${cuando.slice(0, 19).replace(/[:T]/g, '-')}`);
  writeFileSync(`${base}.json`, JSON.stringify({ cuando, maquina, lecturasPorTamanio: LECTURAS, resultados }, null, 2));
  const tabla = [
    '| Personas | Mediana (ms) | p95 (ms) | Máximo (ms) | Filas en decision_de_acceso por lectura | Transacciones por lectura (aprox.) | Ítems |',
    '|---|---|---|---|---|---|---|',
    ...resultados.map((m) => `| ${m.personas} | ${m.ms.mediana} | ${m.ms.p95} | ${m.ms.maximo} | ${m.filasDeDecisionPorLectura} | ${m.transaccionesPorLecturaAprox} | ${m.items} |`),
  ].join('\n');
  writeFileSync(`${base}.md`, `# Cartera · ${cuando}\n\nMáquina: ${maquina.cpus} CPU, ${maquina.memoriaGb} GB, Node ${maquina.node}. Local: no dice nada de Render.\n\n${tabla}\n`);
  console.log(tabla);
}

(ACTIVA ? describe : describe.skip)('Rendimiento · API-CAR-01 con 50, 100 y 200 personas', () => {
  beforeAll(async () => {
    app = await appDePrueba();
  }, 300_000);
  afterAll(async () => {
    await app?.close();
    await prisma.$disconnect();
  });

  it('mide la cartera en cada tamaño, sobre la misma población que crece', async () => {
    const pro = await prepararProfesional(app, etiqueta(), ['NUTRICION', 'ENTRENAMIENTO']);
    const resultados: Medicion[] = [];
    let actuales = 0;
    for (const n of TAMANIOS) {
      await poblarHasta(pro, actuales, n);
      actuales = n;
      resultados.push(await medir(pro, n));
    }
    guardar(resultados);
    // Lo único que se afirma es que la lectura respondió en todos los tamaños; los números se leen, no se aprueban.
    expect(resultados).toHaveLength(TAMANIOS.length);
  });
});
