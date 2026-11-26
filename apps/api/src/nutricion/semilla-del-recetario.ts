import { METODO_DE_CALCULO_NUTRICIONAL, type IngredienteDeReceta } from '@be/domain';
import type { Prisma, PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { calcularReceta } from './lectura-recetas';

/**
 * DL-191 (REC-09, REC-D11) · **la semilla del Recetario de BE**: las 150 recetas de cocina familiar (las 16 originales,
 * las 50 de la ampliación del 2026-10-28 y las 84 del 2026-11-26), del repertorio de `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/`.
 * - Idempotente: cada receta se reconoce por su código editorial (R001 a R151, sin R150), guardado en `clave_de_semilla`; otra corrida
 *   no crea nada que ya esté.
 * - Recalcula con el mismo cálculo que la API (`calcularReceta`, SUM_SOURCE_PER_100G_V1) sobre la versión del catálogo que
 *   cita cada ingrediente, y la cita por identidad y versión, nunca por nombre. Si una versión no está (o se retiró), la
 *   receta no entra y se informa: no se reemplaza un alimento en silencio.
 * - Sin profesional ni autor (la sembró BE), sin foto: la pantalla muestra el ícono de la comida.
 * - No es una migración: **no corre sola en ningún entorno**. La corre a mano quien opera la base (`scripts/recetario-de-be/
 *   sembrar.mjs`), y contra el entorno de test lo decide Dirección.
 */

/** Una receta de la semilla, como la leen las dos herramientas de carga. */
export interface RecetaDeLaSemilla {
  readonly codigo: string;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly porciones: number;
  readonly pasos: readonly string[];
  readonly ingredientes: readonly {
    readonly catalogItemId: string;
    readonly catalogItemVersionId: string;
    readonly cantidad: { readonly valor: number; readonly unidad: 'g' | 'ml' };
    readonly estado: IngredienteDeReceta['preparationState'];
  }[];
}

export const CARPETA_DE_LAS_RECETAS = join('EVIDENCIA', 'DASHBOARD-PROFESIONAL', 'herramientas', 'datos', 'recetas');

interface RecetaDelManifiesto {
  readonly numero?: number;
  readonly codigo?: string;
  readonly nombre: string;
  readonly descripcion?: string | null;
  readonly porciones: number;
  readonly pasos: readonly string[];
  readonly ingredientes: RecetaDeLaSemilla['ingredientes'];
}

/** Las 150, en el orden editorial: las 16 originales (R001 a R016, por su número), las 50 de la ampliación (R017 a R066) y las 84 del recetario del 2026-11-26 (R067 a R151, sin R150). */
export function leerSemillaDelRecetario(raiz: string): RecetaDeLaSemilla[] {
  const leer = (ruta: string) => JSON.parse(readFileSync(join(raiz, CARPETA_DE_LAS_RECETAS, ruta), 'utf8')) as { recetas: RecetaDelManifiesto[] };
  const originales = leer('manifiesto.json').recetas.map((r) => ({ ...r, codigo: `R${String(r.numero).padStart(3, '0')}` }));
  const ampliacion = leer(join('ampliacion-2026-10-28', 'manifiesto.json')).recetas;
  const recetario = leer(join('recetario-2026-11-26', 'manifiesto.json')).recetas;
  return [...originales, ...ampliacion, ...recetario].map((r) => ({
    codigo: r.codigo!,
    nombre: r.nombre,
    descripcion: r.descripcion?.trim() || null,
    porciones: r.porciones,
    pasos: r.pasos,
    ingredientes: r.ingredientes.map((i) => ({ catalogItemId: i.catalogItemId, catalogItemVersionId: i.catalogItemVersionId, cantidad: i.cantidad, estado: i.estado })),
  }));
}

export interface InformeDeLaSemilla {
  readonly creadas: readonly string[];
  readonly yaEstaban: readonly string[];
  /** Las que no entraron, con el ingrediente (en base 1) cuya versión del catálogo no está disponible. */
  readonly conProblemas: readonly { readonly codigo: string; readonly ingredientes: readonly number[] }[];
}

/** Siembra lo que falta. `procedencia` identifica la corrida (quién, desde dónde y cuándo). */
export async function sembrarRecetario(prisma: PrismaClient, recetas: readonly RecetaDeLaSemilla[], procedencia: Record<string, unknown>): Promise<InformeDeLaSemilla> {
  const creadas: string[] = [];
  const yaEstaban: string[] = [];
  const conProblemas: { codigo: string; ingredientes: number[] }[] = [];
  for (const receta of recetas) {
    const resultado = await prisma.$transaction(async (tx) => {
      // La clave de la semilla es única: dos corridas a la vez no la duplican (la segunda falla y se reintenta sola).
      if (await tx.recetaDelRecetario.findUnique({ where: { claveDeSemilla: receta.codigo }, select: { recetaId: true } })) return 'YA_ESTABA' as const;
      const ids = receta.ingredientes.map((i) => i.catalogItemVersionId);
      const versiones = await tx.$queryRaw<{ versionId: string; elementoId: string; nombre: string; composicion: unknown }[]>`
        SELECT v."id"::text AS "versionId", v."elemento_id"::text AS "elementoId", v."nombre", v."composicion"
          FROM "version_de_elemento_nutricional" v
          JOIN "elemento_de_catalogo_nutricional" e ON e."id" = v."elemento_id"
         WHERE v."id" = ANY(${ids}::uuid[]) AND v."disponibilidad" = 'DISPONIBLE' AND e."procedencia" <> 'PROFESSIONAL_MANUAL'
           AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" r WHERE r."elemento_id" = e."id" AND r."disponibilidad" = 'RETIRADO')`;
      const porId = new Map(versiones.map((v) => [v.versionId, v]));
      const faltan = receta.ingredientes.flatMap((i, n) => (porId.get(i.catalogItemVersionId)?.elementoId === i.catalogItemId ? [] : [n + 1]));
      if (faltan.length > 0) return { faltan };
      const guardados: IngredienteDeReceta[] = receta.ingredientes.map((i, n) => ({
        order: n + 1,
        catalogItemId: i.catalogItemId,
        catalogItemVersionId: i.catalogItemVersionId,
        name: porId.get(i.catalogItemVersionId)!.nombre,
        quantity: { value: i.cantidad.valor, unit: i.cantidad.unidad },
        preparationState: i.estado,
      }));
      const calculo = calcularReceta(
        receta.porciones,
        receta.ingredientes.map((i) => ({ quantity: { value: i.cantidad.valor, unit: i.cantidad.unidad }, composicion: porId.get(i.catalogItemVersionId)!.composicion as Parameters<typeof calcularReceta>[1][number]['composicion'] })),
      );
      const deLaSemilla = { ...procedencia, siembra: 'DL-191 · semilla del Recetario de BE', codigo: receta.codigo } as unknown as Prisma.InputJsonValue;
      const nueva = await tx.receta.create({ data: { profesionalId: null } });
      await tx.versionDeReceta.create({
        data: {
          recetaId: nueva.id,
          numero: 1,
          nombre: receta.nombre,
          descripcion: receta.descripcion,
          porciones: receta.porciones,
          pasos: [...receta.pasos] as unknown as Prisma.InputJsonValue,
          ingredientes: guardados as unknown as Prisma.InputJsonValue,
          metodoDeCalculo: METODO_DE_CALCULO_NUTRICIONAL,
          resultado: calculo as unknown as Prisma.InputJsonValue,
          autorId: null,
          procedencia: deLaSemilla,
        },
      });
      await tx.recetaDelRecetario.create({ data: { recetaId: nueva.id, propuestaId: null, administradorId: null, claveDeSemilla: receta.codigo, procedencia: deLaSemilla } });
      return 'CREADA' as const;
    });
    if (resultado === 'YA_ESTABA') yaEstaban.push(receta.codigo);
    else if (resultado === 'CREADA') creadas.push(receta.codigo);
    else conProblemas.push({ codigo: receta.codigo, ingredientes: resultado.faltan });
  }
  return { creadas, yaEstaban, conProblemas };
}
