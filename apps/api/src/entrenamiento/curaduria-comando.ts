/**
 * El comando de curaduría del catálogo de todos (DL-081 y DL-162; `curaduria.ts`). Lo corre el operador con acceso a la
 * base del ambiente, como el de Administración (08 §28.3-bis), nunca la API por HTTP ni al arrancar.
 *
 *   node apps/api/dist/entrenamiento/curaduria-comando.js zonas --archivo <zonas.json> --operador "<quién>" --fundamento "<por qué>" [--confirmo-escritura]
 *   node apps/api/dist/entrenamiento/curaduria-comando.js imagenes --manifiesto <imagenes.json> --curador <correo administrador> --operador "<quién>" --fundamento "<por qué>" [--confirmo-escritura]
 *
 * Sin `--confirmo-escritura` solo dice lo que haría, sin tocar la base. Lee `DATABASE_URL` y `APP_ENV`, y no los imprime.
 * Con `--salida json` responde en JSON, para las herramientas de EVIDENCIA/CATALOGO-VISUAL.
 *
 * - `zonas.json`: `{ "ejercicios": [{ "exerciseId": "…", "muscleZones": [{ "zoneId": "pectoral", "role": "PRIMARY" }] }] }`.
 *   Solo ejercicios sembrados o importados: los de un profesional van por API-EJE-04.
 * - `imagenes.json`: `{ "imagenes": [{ "exerciseId", "archivo" (relativo al manifiesto), "contentType", "provenance",
 *   "authorship", "altText", "license", "technicalReview" }] }`, con las formas de API-MED-01 y API-EJE-02.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { ArchivoDeZonasCuradasSchema, ManifiestoDeImagenesCuradasSchema, type ArchivoDeZonasCuradas, type ManifiestoDeImagenesCuradas } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { AlmacenDeMediosEnPostgres } from '../medios/almacen-de-medios';
import { curarImagen, curarZonas, ErrorDeCuraduria, type ResultadoDeImagen, type ResultadoDeZonas } from './curaduria';

const AYUDA = [
  'Uso:',
  '  zonas --archivo <zonas.json> --operador "<quién>" --fundamento "<por qué>" [--confirmo-escritura]',
  '  imagenes --manifiesto <imagenes.json> --curador <correo administrador> --operador "<quién>" --fundamento "<por qué>" [--confirmo-escritura]',
  'Sin --confirmo-escritura solo dice lo que haría. Opcional: --salida json. Requiere DATABASE_URL y APP_ENV.',
].join('\n');

const BANDERAS = new Set(['confirmo-escritura']);

function opciones(args: readonly string[]): Record<string, string | true> {
  const salida: Record<string, string | true> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (!a.startsWith('--')) throw new ErrorDeCuraduria(`Argumento inesperado: ${a.slice(0, 40)}\n${AYUDA}`);
    const nombre = a.slice(2);
    if (BANDERAS.has(nombre)) {
      salida[nombre] = true;
      continue;
    }
    const valor = args[i + 1];
    if (valor === undefined || valor.startsWith('--')) throw new ErrorDeCuraduria(`Falta el valor de ${a}.\n${AYUDA}`);
    salida[nombre] = valor;
    i++;
  }
  return salida;
}

/** Lee un JSON y lo valida con su esquema del dominio. Un error dice dónde, sin volcar el archivo. */
function leerJson<T>(
  ruta: string,
  esquema: { safeParse(x: unknown): { success: true; data: T } | { success: false; error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] } } },
  que: string,
): T {
  let crudo: unknown;
  try {
    crudo = JSON.parse(readFileSync(ruta, 'utf8'));
  } catch {
    throw new ErrorDeCuraduria(`No se pudo leer ${que} (${ruta.slice(-120)}).`);
  }
  const r = esquema.safeParse(crudo);
  if (!r.success) throw new ErrorDeCuraduria(`${que} no tiene la forma esperada: ${r.error.issues.map((i) => `${i.path.map(String).join('.')} ${i.message}`).slice(0, 8).join('; ')}`);
  return r.data;
}

const texto = (o: Record<string, string | true>, nombre: string): string => (typeof o[nombre] === 'string' ? (o[nombre] as string) : '');
const zonasEnTexto = (zonas: ResultadoDeZonas['despues']): string => (zonas.length === 0 ? '(ninguna)' : zonas.map((z) => `${z.zoneId}${z.role === 'PRIMARY' ? ' (principal)' : ''}`).join(', '));

async function principal(): Promise<number> {
  const [accion, ...resto] = process.argv.slice(2);
  if (!accion || accion === '--ayuda' || accion === 'ayuda') {
    process.stdout.write(`${AYUDA}\n`);
    return accion ? 0 : 1;
  }
  const o = opciones(resto);
  const json = o.salida === 'json';
  const escribir = o['confirmo-escritura'] === true;
  const appEnv = process.env.APP_ENV ?? '';
  if (!['development', 'test', 'production'].includes(appEnv)) throw new ErrorDeCuraduria('APP_ENV tiene que ser development, test o production.');
  if (!process.env.DATABASE_URL) throw new ErrorDeCuraduria('Falta DATABASE_URL.');
  const datos = { operador: texto(o, 'operador'), fundamento: texto(o, 'fundamento'), escribir };
  const prisma = new PrismaClient();
  try {
    if (accion === 'zonas') {
      const archivo = leerJson<ArchivoDeZonasCuradas>(resolve(texto(o, 'archivo')), ArchivoDeZonasCuradasSchema, 'El archivo de zonas');
      const r = await curarZonas(prisma, archivo.ejercicios, datos);
      if (json) process.stdout.write(`${JSON.stringify({ appEnv, escribir, resultados: r })}\n`);
      else {
        for (const x of r) process.stdout.write(`${x.accion === 'SIN_CAMBIOS' ? '=' : x.escrito ? '✓ asignadas' : '→ asignaría'}  ${x.nombre}: ${zonasEnTexto(x.despues)}${x.accion === 'SIN_CAMBIOS' ? '' : `  (antes: ${zonasEnTexto(x.antes)})`}\n`);
        process.stdout.write(escribir ? 'Listo.\n' : 'No se escribió nada: para hacerlo, repetí con --confirmo-escritura.\n');
      }
      return 0;
    }
    if (accion === 'imagenes') {
      const ruta = resolve(texto(o, 'manifiesto'));
      const manifiesto = leerJson<ManifiestoDeImagenesCuradas>(ruta, ManifiestoDeImagenesCuradasSchema, 'El manifiesto de imágenes');
      const almacen = new AlmacenDeMediosEnPostgres();
      const resultados: ResultadoDeImagen[] = [];
      for (const { archivo, ...pedido } of manifiesto.imagenes) {
        let bytes: Buffer;
        try {
          bytes = readFileSync(resolve(dirname(ruta), archivo));
        } catch {
          throw new ErrorDeCuraduria(`No se pudo leer la imagen de ${pedido.exerciseId} (${archivo.slice(-80)}).`);
        }
        resultados.push(await curarImagen(prisma, almacen, { ...pedido, bytes }, { ...datos, curador: texto(o, 'curador') }));
      }
      if (json) process.stdout.write(`${JSON.stringify({ appEnv, escribir, resultados })}\n`);
      else {
        for (const x of resultados) {
          process.stdout.write(`${x.accion === 'SIN_CAMBIOS' ? '=' : x.escrito ? '✓ asociada' : '→ asociaría'}  ${x.nombre}: ${x.original.ancho}×${x.original.alto} → ${x.guardada.ancho}×${x.guardada.alto} (versión de imagen ${x.imageVersion})\n`);
        }
        process.stdout.write(escribir ? 'Listo.\n' : 'No se escribió nada: para hacerlo, repetí con --confirmo-escritura.\n');
      }
      return 0;
    }
    throw new ErrorDeCuraduria(`Acción desconocida: ${accion.slice(0, 40)}\n${AYUDA}`);
  } finally {
    await prisma.$disconnect();
  }
}

principal()
  .then((codigo) => process.exit(codigo))
  .catch((e: unknown) => {
    if (e instanceof ErrorDeCuraduria) {
      process.stderr.write(`${e.message}\n`);
      process.exit(1);
    }
    // Sin el detalle de la base: un mensaje de Prisma puede nombrar la URL o el host.
    process.stderr.write(`Falla inesperada: ${e instanceof Error ? e.name : 'error'}. No se cambió nada (cada cambio es una transacción).\n`);
    process.exit(2);
  });
