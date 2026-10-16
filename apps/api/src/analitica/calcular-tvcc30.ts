/**
 * UC-S01 (RF-058 · DEUDA_LEGAJO DL-135): calcula la TVCC-30 de un corte contra la base de `DATABASE_URL` y conserva el
 * resultado. Es interno y sin HTTP: el 09 declara la operación ANA-P1 «internal/reproducible» (TRACE-DEBT-12-001).
 *
 * Uso, con la API construida (`npm run build -w apps/api`):
 *   node apps/api/dist/analitica/calcular-tvcc30.js --ejecutor "Dirección" [--corte AAAA-MM-DD] [--demo archivo]
 *        [--salida archivo.json] [--sin-conservar]
 * - `--ejecutor`: quién la pide; queda en el resultado (UC-S01: «la consulta queda trazable»). Obligatorio.
 * - `--corte`: la fecha local de corte. Por defecto, hoy en Buenos Aires.
 * - `--demo`: un archivo con las identidades demo, una por renglón (`#` comenta), o la lista separada por comas. BE no
 *   marca las cuentas demo en su modelo: se declaran en cada corrida y quedan contadas en el resultado (DL-135).
 * - `--salida`: escribe el resultado completo en JSON, con cada ciclo y sus fuentes.
 * - `--sin-conservar`: calcula y muestra sin guardar, para ensayar.
 *
 * En pantalla sale el resumen: la ventana, N y D, la tasa si existe, y cuántos ciclos quedaron afuera y por qué. No
 * muestra identificadores de personas: esos van solo en el archivo de `--salida`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fechaCivil, INTERPRETACION_TVCC30, ZONA_TVCC30, type ResultadoTvcc30 } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { calcularTvcc30EnLaBase, conservarTvcc30, huellaTvcc30 } from './tvcc30';

const argumento = (nombre: string): string | undefined => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const tiene = (nombre: string): boolean => process.argv.includes(`--${nombre}`);

/** `--demo` acepta un archivo o, para la consola de Render, los identificadores separados por comas. */
function cuentasDemo(valor: string | undefined): string[] {
  if (!valor) return [];
  const lista = /^[0-9a-f-]{36}(,[0-9a-f-]{36})*$/i.test(valor.trim());
  return (lista ? valor.trim().split(',').join('\n') : readFileSync(valor, 'utf8'))
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*/, '').trim())
    .filter((l) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(l));
}

const porcentaje = (x: number): string => `${x.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

export function resumenTvcc30(r: ResultadoTvcc30): string[] {
  const e = r.especificacion;
  const motivos = new Map<string, number>();
  for (const c of r.universo) if (c.motivo) motivos.set(c.motivo, (motivos.get(c.motivo) ?? 0) + 1);
  const v = r.valor;
  return [
    `${r.nombre}`,
    `Corte ${r.ventana.corte} (${r.ventana.zona}) · ventana del ${r.ventana.desde} al ${r.ventana.hasta}, ${r.ventana.fechas} fechas`,
    `Especificación ${e.id} (${e.estado.toLowerCase()}, ${e.fuente}) · ${e.mapeo}`,
    `Universo: ${r.conteos.universo} ciclos · elegibles (D): ${r.conteos.elegibles} · cerrados (N): ${r.conteos.numerador} · excluidos: ${r.conteos.excluidos} · no resolubles: ${r.conteos.noResolubles}`,
    ...(motivos.size > 0 ? [`Fuera de D, por motivo: ${[...motivos].map(([m, n]) => `${m} ${n}`).join(' · ')}`] : []),
    `Cuentas declaradas demo: ${r.cuentasDemoDeclaradas}`,
    v.estado === 'CALCULADO'
      ? `Resultado: N/D = ${v.n}/${v.d} = ${porcentaje(v.porcentaje)}`
      : v.motivo === 'DENOMINADOR_CERO'
        ? 'Sin valor: no hay ciclos elegibles (D = 0). No se publica 0 %.'
        : `Sin valor: ${r.conteos.noResolubles} ciclo(s) no se pueden clasificar sin inferir. No se fabrica una tasa.`,
    `Se lee así: ${INTERPRETACION_TVCC30}`,
  ];
}

async function principal(): Promise<void> {
  const ejecutor = argumento('ejecutor')?.trim();
  if (!ejecutor) throw new Error('Falta --ejecutor: quién pide el cálculo queda en el resultado.');
  const corte = argumento('corte') ?? fechaCivil(new Date().toISOString(), ZONA_TVCC30);
  const demo = cuentasDemo(argumento('demo'));
  const prisma = new PrismaClient();
  try {
    // Una sola foto de la base para todas las lecturas: el resultado no mezcla momentos.
    const resultado = await prisma.$transaction((tx) => calcularTvcc30EnLaBase(tx, { corte, cuentasDemo: demo }), { isolationLevel: 'RepeatableRead', timeout: 60_000 });
    for (const renglon of resumenTvcc30(resultado)) console.log(renglon);
    const salida = argumento('salida');
    if (salida) writeFileSync(salida, `${JSON.stringify(resultado, null, 2)}\n`);
    if (tiene('sin-conservar')) {
      console.log(`Sin conservar (ensayo) · huella ${huellaTvcc30(resultado)}`);
      return;
    }
    const conservado = await conservarTvcc30(prisma, resultado, {
      ejecutor,
      ambiente: process.env.APP_ENV ?? 'desconocido',
      procedencia: { fuente: 'PROPIA', casoDeUso: 'UC-S01', operacion: 'CALCULO-TVCC30', superficie: null, requestId: null },
    });
    console.log(`Conservado: resultado_tvcc30 ${conservado.id} · huella ${conservado.huella} · ${conservado.predecesorId ? `sucesor de ${conservado.predecesorId}` : 'primero de ese corte'}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  principal().catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  });
}
