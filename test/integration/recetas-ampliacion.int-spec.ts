/**
 * La ampliación de las recetas de ejemplo (encargo nocturno de Dirección del 2026-10-28, §10) · la carga en una base
 * efímera, por los caminos normales de la API y con una cuenta sintética. Corre la herramienta real
 * (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/ampliacion-2026-10-28/cargar.mjs`) como un proceso
 * aparte, contra esta API escuchando en un puerto local:
 * - «revisar»: los alimentos del paquete están en el catálogo sembrado por las migraciones, en su versión, y en las 50
 *   recetas el cálculo de BE (API-REC-07) coincide con el cálculo independiente y con la composición del manifiesto;
 * - «cargar» con fotos de prueba (rectángulos de un color por receta: no son fotos de recetas), cortado de golpe tres
 *   veces —después de crear una receta, después de pedir la intención de su foto y después de subirla, antes de
 *   asociarla— y retomado;
 * - al final, 50 recetas, una por nombre, con una sola versión; cada una con una imagen, y esa imagen es la de su archivo
 *   (el SHA-256 del original que guarda la API); 50 medios de receta, ni uno de más; y otra corrida no cambia nada.
 */
import type { INestApplication } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { RAIZ } from './soporte';
import { appDePrueba, conSesion, CREDENCIAL_SINTETICA } from './soporte-api';
import { prepararProfesional, type Parte } from './soporte-vinculo';

const CARPETA = join(RAIZ, 'EVIDENCIA', 'DASHBOARD-PROFESIONAL', 'herramientas', 'datos', 'recetas', 'ampliacion-2026-10-28');
const HERRAMIENTA = join(CARPETA, 'cargar.mjs');

interface RecetaDelPaquete {
  codigo: string;
  nombre: string;
  porciones: number;
  foto: { archivo: string };
  composicion: { total: Record<string, number>; porPorcion: Record<string, number> };
}
const paquete = JSON.parse(readFileSync(join(CARPETA, 'manifiesto.json'), 'utf8')) as { paquete: string; recetas: RecetaDelPaquete[] };

let app: INestApplication;
let prisma: PrismaService;
let pro: Parte;
let origen: string;
let carpeta: string;
let cuentas: string;
let fotos: string;
let estado: string;
const huellaDeLaFoto = new Map<string, string>();

/** Corre la herramienta sin bloquear este proceso, donde la API está atendiendo. */
function herramienta(argumentos: string[]): Promise<{ codigo: number | null; salida: string }> {
  return new Promise((resolver, rechazar) => {
    const hijo = spawn(process.execPath, [HERRAMIENTA, ...argumentos], { cwd: RAIZ, env: { ...process.env } });
    let salida = '';
    hijo.stdout.on('data', (b: Buffer) => (salida += b.toString('utf8')));
    hijo.stderr.on('data', (b: Buffer) => (salida += b.toString('utf8')));
    hijo.on('error', rechazar);
    hijo.on('close', (codigo) => resolver({ codigo, salida }));
  });
}
const cargar = (...extra: string[]) =>
  herramienta(['cargar', '--origen', origen, '--cuentas', cuentas, '--cuenta', 'PRO_N', '--fotos', fotos, '--estado', estado, '--confirmo-escritura', ...extra]);

async function recetasDeLaCuenta(): Promise<{ recipeId: string; name: string; image: { mediaId: string } | null }[]> {
  const todas: { recipeId: string; name: string; image: { mediaId: string } | null }[] = [];
  let cursor: string | null = null;
  do {
    const r = await conSesion(app, pro.token).get(`/api/v1/nutrition/recipes?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`).expect(200);
    todas.push(...r.body.data);
    cursor = r.body.page?.nextCursor ?? null;
  } while (cursor);
  return todas;
}

async function conteos() {
  const [recetas, versiones, medios, asociaciones] = await Promise.all([
    prisma.receta.count({ where: { profesionalId: pro.id } }),
    prisma.versionDeReceta.count({ where: { receta: { profesionalId: pro.id } } }),
    prisma.medio.count({ where: { propietarioId: pro.id, finalidad: 'RECETA_REFERENCIA' } }),
    prisma.asociacionDeImagenDeReceta.count({ where: { receta: { profesionalId: pro.id } } }),
  ]);
  return { recetas, versiones, medios, asociaciones };
}

beforeAll(async () => {
  app = await appDePrueba();
  prisma = app.get(PrismaService);
  origen = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
  pro = await prepararProfesional(app, 'ampliacion', ['NUTRICION']);
  carpeta = mkdtempSync(join(tmpdir(), 'be-recetas-ampliacion-'));
  cuentas = join(carpeta, 'cuentas.env');
  // Una cuenta sintética de esta prueba, en una carpeta temporal que se borra al final.
  writeFileSync(cuentas, `PRO_N_CORREO=${pro.correo}\nPRO_N_CLAVE=${CREDENCIAL_SINTETICA}\n`);
  fotos = join(carpeta, 'fotos');
  estado = join(carpeta, 'estado');
  mkdirSync(fotos);
  // Una imagen de prueba por receta, de 1600 × 1200 y de un color propio: no es una foto de la receta.
  for (const [k, r] of paquete.recetas.entries()) {
    const bytes = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: { r: (k * 37) % 256, g: (k * 91 + 40) % 256, b: (k * 53 + 90) % 256 } } })
      .jpeg({ quality: 90 })
      .toBuffer();
    writeFileSync(join(fotos, r.foto.archivo), bytes);
    huellaDeLaFoto.set(r.codigo, createHash('sha256').update(bytes).digest('hex'));
  }
});
afterAll(async () => {
  rmSync(carpeta, { recursive: true, force: true });
  await app.close();
});

describe('la ampliación de las recetas de ejemplo, cargada en una base efímera por la herramienta real', () => {
  it('«preparar», el modo por omisión, no usa la red y deja las 50 listas para cargar', async () => {
    const r = await herramienta(['--fotos', fotos]);
    expect({ codigo: r.codigo, resumen: /Preparadas 50 · listas para cargar 50 · con foto 50/.test(r.salida) }).toEqual({ codigo: 0, resumen: true });
    expect(await conteos()).toEqual({ recetas: 0, versiones: 0, medios: 0, asociaciones: 0 });
  });

  it('«revisar»: los alimentos están en el catálogo sembrado, y en las 50 el cálculo de BE es el independiente y el del manifiesto', async () => {
    const informe = join(carpeta, 'revision.json');
    const r = await herramienta(['revisar', '--origen', origen, '--cuentas', cuentas, '--cuenta', 'PRO_N', '--fotos', fotos, '--informe', informe]);
    expect(r.codigo).toBe(0);
    const { resumen, recetas } = JSON.parse(readFileSync(informe, 'utf8')) as {
      resumen: Record<string, number>;
      recetas: { codigo: string; problemas: string[]; comprobaciones: { coincide: boolean; diferencias: string[] }[]; porPorcion: Record<string, string> }[];
    };
    expect(recetas.filter((x) => x.problemas.length > 0 || x.comprobaciones.some((c) => !c.coincide)).map((x) => [x.codigo, ...x.problemas, ...x.comprobaciones.flatMap((c) => c.diferencias)])).toEqual([]);
    expect({ cargables: resumen.cargables, verificadas: resumen.verificadas, conFoto: resumen.conFoto, yaEnLaCuenta: resumen.yaEnLaCuenta }).toEqual({ cargables: 50, verificadas: 50, conFoto: 50, yaEnLaCuenta: 0 });
    // Lo que dice el manifiesto por porción es lo que calcula BE (API-REC-07), exacto hasta los seis decimales con que se guarda.
    for (const x of recetas) {
      const delPaquete = paquete.recetas.find((p) => p.codigo === x.codigo)!;
      for (const [n, v] of Object.entries(x.porPorcion)) expect({ receta: x.codigo, n, iguales: Math.abs(Number(v) - delPaquete.composicion.porPorcion[n]!) < 1e-5 }).toEqual({ receta: x.codigo, n, iguales: true });
    }
    expect(await conteos()).toEqual({ recetas: 0, versiones: 0, medios: 0, asociaciones: 0 });
  }, 600_000);

  it('«cargar» se corta de golpe tres veces (después de crear, de pedir la intención y de subir) y se retoma sin duplicar ni cruzar fotos', async () => {
    // 1. Después de crear R030, antes de su foto: R017 a R029 quedan completas.
    const primera = await cargar('--cortar-en', 'R030:creada');
    expect({ codigo: primera.codigo, corte: primera.salida.includes('R030: corte de prueba después de «creada»') }).toEqual({ codigo: 75, corte: true });
    expect(await conteos()).toEqual({ recetas: 14, versiones: 14, medios: 13, asociaciones: 13 });

    // 2. Después de pedir la intención de la foto de R041, antes de subirla: el medio queda pendiente.
    const segunda = await cargar('--cortar-en', 'R041:intencion');
    expect(segunda.codigo).toBe(75);
    expect(await conteos()).toEqual({ recetas: 25, versiones: 25, medios: 25, asociaciones: 24 });

    // 3. Después de subir la foto de R052, antes de asociarla.
    const tercera = await cargar('--cortar-en', 'R052:subida');
    expect(tercera.codigo).toBe(75);
    expect(await conteos()).toEqual({ recetas: 36, versiones: 36, medios: 36, asociaciones: 35 });

    // 4. Hasta el final.
    const cuarta = await cargar();
    expect({ codigo: cuarta.codigo, salida: cuarta.salida.slice(-400) }).toEqual({ codigo: 0, salida: expect.stringContaining('R066') });
    expect(await conteos()).toEqual({ recetas: 50, versiones: 50, medios: 50, asociaciones: 50 });

    // Una receta por nombre, cada una con su imagen, y esa imagen es la de su archivo: ninguna tomó la foto de otra.
    const enLaCuenta = await recetasDeLaCuenta();
    expect(enLaCuenta.map((x) => x.name).sort()).toEqual(paquete.recetas.map((r) => r.nombre).sort());
    const medios = new Set<string>();
    for (const r of paquete.recetas) {
      const guardada = enLaCuenta.find((x) => x.name === r.nombre)!;
      expect({ receta: r.codigo, conImagen: guardada.image !== null }).toEqual({ receta: r.codigo, conImagen: true });
      medios.add(guardada.image!.mediaId);
      const medio = await prisma.medio.findUniqueOrThrow({ where: { id: guardada.image!.mediaId } });
      expect({ receta: r.codigo, propia: medio.sha256Original === huellaDeLaFoto.get(r.codigo), estado: medio.estado, propietario: medio.propietarioId === pro.id }).toEqual({
        receta: r.codigo,
        propia: true,
        estado: 'DISPONIBLE',
        propietario: true,
      });
    }
    expect(medios.size).toBe(50);

    // 5. Otra corrida no cambia nada: ni recetas, ni versiones, ni medios, ni asociaciones.
    const quinta = await cargar();
    expect({ codigo: quinta.codigo, yaConImagen: (quinta.salida.match(/ya tiene su imagen/g) ?? []).length, creadas: (quinta.salida.match(/: creada/g) ?? []).length }).toEqual({ codigo: 0, yaConImagen: 50, creadas: 0 });
    expect(await conteos()).toEqual({ recetas: 50, versiones: 50, medios: 50, asociaciones: 50 });
  }, 900_000);
});
