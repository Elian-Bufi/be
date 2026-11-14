import { Injectable } from '@nestjs/common';
import {
  AREA_DEL_AMBITO,
  CodigoDeError,
  ContenidoDelEnfoqueSchema,
  CrearEnfoqueRequestSchema,
  CuerpoVacioSchema,
  ElegirEnfoqueRequestSchema,
  evaluarAutorizacion,
  MAXIMO_DE_ENFOQUES,
  ReemplazarEnfoqueRequestSchema,
  type Alcance,
  type AmbitoDeLaEleccion,
  type EleccionDeEnfoque,
  type EleccionesDeEnfoqueResponse,
  type Enfoque,
  type ListaDeEnfoquesResponse,
} from '@be/domain';
import type { AmbitoDeEleccionDeGraficos, ConjuntoDeGraficos as FilaDeEnfoque, EleccionDeConjuntoDeGraficos as FilaDeEleccion, Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase, sinDuplicar } from '../prisma/concurrencia';
import { puedeOperarArea } from '../profesional/area-operable';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { token } from '../vinculo/lectura';
import { EjecutorDeGraficos, esUuid } from './ejecutor';

type Tx = Prisma.TransactionClient;

/** GR-27 no tiene un caso de uso del 05: la procedencia nombra la parte del paquete (WP-GRAFICOS, DL-174). */
const CASO_DE_USO = 'GR-27';
const ENFOQUE = 'ConjuntoDeGraficos';
const ELECCION = 'EleccionDeConjuntoDeGraficos';
/** El recurso de las decisiones del PDP sobre las elecciones de una persona: la persona, nunca el enfoque. */
const ELECCIONES_DE_LA_PERSONA = 'EleccionesDeGraficos';
const PLAN_DEL_AMBITO = { TRAINING_PLAN: 'PlanDeEntrenamiento', NUTRITION_PLAN: 'PlanNutricional' } as const;
/** La elección de la persona no es de un área: se decide con la primera que el PDP permita hoy, en este orden (GR-T61). */
const AREAS: readonly Alcance[] = ['ENTRENAMIENTO', 'NUTRICION', 'ANTROPOMETRIA'];

const AMBITO_EN_LA_BASE: Readonly<Record<AmbitoDeLaEleccion, AmbitoDeEleccionDeGraficos>> = {
  PERSON: 'PERSONA',
  TRAINING_PLAN: 'PLAN_DE_ENTRENAMIENTO',
  NUTRITION_PLAN: 'PLAN_NUTRICIONAL',
};
const AMBITO_EN_LA_API: Readonly<Record<AmbitoDeEleccionDeGraficos, AmbitoDeLaEleccion>> = {
  PERSONA: 'PERSON',
  PLAN_DE_ENTRENAMIENTO: 'TRAINING_PLAN',
  PLAN_NUTRICIONAL: 'NUTRITION_PLAN',
};
/** El orden de la lectura: la elección de la persona y, después, la de cada plan. */
const ORDEN_DE_LOS_AMBITOS: readonly AmbitoDeEleccionDeGraficos[] = ['PERSONA', 'PLAN_DE_ENTRENAMIENTO', 'PLAN_NUTRICIONAL'];

const CON_LA_CUENTA = { _count: { select: { elecciones: true } } } as const satisfies Prisma.ConjuntoDeGraficosInclude;
const CON_EL_ENFOQUE = { conjunto: { select: { id: true, nombre: true } } } as const satisfies Prisma.EleccionDeConjuntoDeGraficosInclude;

/** Un enfoque como lo lee la API. El contenido se guardó validado y se vuelve a validar al leer, como las vistas (DL-128). */
export function enfoqueApi(f: FilaDeEnfoque, elecciones: number): Enfoque {
  return {
    setId: f.id,
    name: f.nombre,
    content: ContenidoDelEnfoqueSchema.parse(f.contenido),
    choices: elecciones,
    version: token(f.version),
    createdAt: f.momentoDeRegistro.toISOString(),
    updatedAt: f.momentoDeActualizacion.toISOString(),
  };
}

/** Una elección como la lee la API: dónde rige, el plan por su identidad si es de un plan, y el enfoque por su nombre. */
export function eleccionApi(f: FilaDeEleccion, enfoque: { readonly id: string; readonly nombre: string }): EleccionDeEnfoque {
  return {
    choiceId: f.id,
    scope: AMBITO_EN_LA_API[f.ambito],
    trainingPlanId: f.planDeEntrenamientoId,
    nutritionPlanId: f.planNutricionalId,
    set: { setId: enfoque.id, name: enfoque.nombre },
    version: token(f.version),
    updatedAt: f.momentoDeActualizacion.toISOString(),
  };
}

/** Los ámbitos que se leen con las áreas que el PDP permite hoy: el de la persona, siempre; el de un plan, solo con su área. */
export function ambitosLegibles(areas: ReadonlySet<Alcance>): AmbitoDeEleccionDeGraficos[] {
  return ORDEN_DE_LOS_AMBITOS.filter((a) => {
    const area = AREA_DEL_AMBITO[AMBITO_EN_LA_API[a]];
    return area === null || areas.has(area);
  });
}

const demasiadosEnfoques = (): ErrorDeApi =>
  new ErrorDeApi(422, CodigoDeError.TOO_MANY_SETS, `Llegaste al máximo de ${MAXIMO_DE_ENFOQUES} enfoques: borrá alguno para guardar otro.`);

/**
 * WP-GRAFICOS GR-27 (DL-174; pedido de Dirección del 2026-11-14) · Los enfoques: API-GRF-01 a 07, familia propia de BE.
 * Lo que garantiza este servicio, con la base detrás (migración 20261114200000):
 * - **Solo referencias.** El cuerpo se valida con el esquema estricto del dominio: identificadores de gráficos y de series,
 *   ejercicios del catálogo, medidas y modos. No hay campo donde guardar un valor, una nota clínica ni el nombre de una
 *   persona, y el enfoque no concede nada: cada lectura de datos vuelve a pasar por el PDP.
 * - **Solo el dueño.** Los enfoques son de un profesional verificado y habilitado en algún área (si no, 403). Uno de otro
 *   profesional responde el mismo 404 que uno inexistente, también al elegirlo.
 * - **Con la persona, el PDP de hoy.** Leer, elegir y quitar una elección deciden dentro de su transacción: la de la
 *   persona pide alguna área permitida; la de un plan, el área del plan y un plan de este profesional con esta persona.
 *   Sin acceso, el 404 de lo inexistente; lo elegido queda guardado y no se lee.
 * - **Concurrencia:** cambiar un enfoque o una elección pide la versión leída (409 VERSION_CONFLICT); crear una elección,
 *   `expectedVersion: null`, y si dos pestañas eligen a la vez, la base deja una y la otra recibe el 409. Crear y borrar un
 *   enfoque y quitar una elección exigen Idempotency-Key.
 * - **Borrar un enfoque quita sus elecciones** (en cascada, en la base): esas personas y esos planes vuelven a los sugeridos.
 */
@Injectable()
export class EnfoquesService {
  constructor(
    private readonly ejecutor: EjecutorDeGraficos,
    private readonly pdp: PdpService,
  ) {}

  // ─── API-GRF-01 · mis enfoques ───────────────────────────────────────────────────────────────────────────────
  listar(actor: ActorAutenticado, ctx: ContextoDeSolicitud): Promise<ListaDeEnfoquesResponse> {
    return this.ejecutor.leer({
      operacion: 'API-GRF-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await exigirProfesional(tx, actor.identidadId);
        const filas = await tx.conjuntoDeGraficos.findMany({
          where: { profesionalId: actor.identidadId },
          include: CON_LA_CUENTA,
          orderBy: [{ momentoDeActualizacion: 'desc' }, { id: 'desc' }],
          take: MAXIMO_DE_ENFOQUES,
        });
        return { data: filas.map((f) => enfoqueApi(f, f._count.elecciones)) };
      },
    });
  }

  // ─── API-GRF-02 · crear un enfoque ───────────────────────────────────────────────────────────────────────────
  crear(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-GRF-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: CrearEnfoqueRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        await exigirProfesional(tx, actor.identidadId);
        // El tope es exacto aunque dos pestañas guarden a la vez: los enfoques de un profesional se crean de a uno.
        await tomarLosEnfoques(tx, actor.identidadId);
        if ((await tx.conjuntoDeGraficos.count({ where: { profesionalId: actor.identidadId } })) >= MAXIMO_DE_ENFOQUES) throw demasiadosEnfoques();
        const momento = await momentoDeLaBase(tx);
        const creado = await tx.conjuntoDeGraficos.create({
          data: {
            profesionalId: actor.identidadId,
            nombre: pedido.name,
            contenido: pedido.content as unknown as Prisma.InputJsonValue,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeRegistro: momento,
            momentoDeActualizacion: momento,
          },
        });
        return { estadoHttp: 201, cuerpo: { data: enfoqueApi(creado, 0) }, sujetoId: null, recurso: { tipo: ENFOQUE, id: creado.id } };
      },
    });
  }

  // ─── API-GRF-03 · cambiar el nombre o los gráficos ───────────────────────────────────────────────────────────
  reemplazar(actor: ActorAutenticado, setId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribir({
      operacion: 'API-GRF-03',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: ENFOQUE, id: setId },
      esquema: ReemplazarEnfoqueRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        await exigirProfesional(tx, actor.identidadId);
        const fila = await propio(tx, actor.identidadId, setId);
        if (pedido.expectedVersion !== token(fila.version)) throw errores.conflictoDeVersion();
        const momento = await momentoDeLaBase(tx);
        // Condicionada a la versión leída: si otra escritura avanzó en el medio, no se pisa.
        const r = await tx.conjuntoDeGraficos.updateMany({
          where: { id: fila.id, version: fila.version },
          data: {
            nombre: pedido.name,
            contenido: pedido.content as unknown as Prisma.InputJsonValue,
            version: fila.version + 1,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeActualizacion: momento,
          },
        });
        if (r.count !== 1) throw errores.conflictoDeVersion();
        const cambiado = await tx.conjuntoDeGraficos.findUniqueOrThrow({ where: { id: fila.id }, include: CON_LA_CUENTA });
        return { estadoHttp: 200, cuerpo: { data: enfoqueApi(cambiado, cambiado._count.elecciones) }, sujetoId: null, recurso: { tipo: ENFOQUE, id: fila.id } };
      },
    });
  }

  // ─── API-GRF-04 · borrar un enfoque ──────────────────────────────────────────────────────────────────────────
  borrar(actor: ActorAutenticado, setId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-GRF-04',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: ENFOQUE, id: setId },
      clave,
      esquema: CuerpoVacioSchema,
      cuerpo: cuerpo ?? {},
      huellaExtra: { setId },
      efecto: async (tx) => {
        await exigirProfesional(tx, actor.identidadId);
        const fila = await propio(tx, actor.identidadId, setId);
        // Sus elecciones se borran en cascada (la clave foránea): esas personas y esos planes vuelven a los sugeridos.
        const r = await tx.conjuntoDeGraficos.deleteMany({ where: { id: fila.id, profesionalId: actor.identidadId } });
        if (r.count !== 1) throw errores.recursoNoEncontrado();
        // El ejecutor espera 200 o 201; el controlador responde 204 sin cuerpo (también al reintentar con la misma clave).
        return { estadoHttp: 200, cuerpo: null, sujetoId: null, recurso: { tipo: ENFOQUE, id: fila.id } };
      },
    });
  }

  // ─── API-GRF-05 · qué enfoque rige para la persona y sus planes ──────────────────────────────────────────────
  elecciones(actor: ActorAutenticado, adviseeId: string, ctx: ContextoDeSolicitud): Promise<EleccionesDeEnfoqueResponse> {
    return this.ejecutor.leer({
      operacion: 'API-GRF-05',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: ELECCIONES_DE_LA_PERSONA, id: adviseeId },
      lectura: async (tx) => {
        if (!esUuid(adviseeId)) throw this.ejecutor.noRevelable({ operacion: 'API-GRF-05', actorId: actor.identidadId, recurso: null }, ctx);
        const personaId = adviseeId.toLowerCase();
        const yo = actor.identidadId;
        // El PDP de hoy, en la misma transacción: sin ninguna área permitida con la persona, el 404 de lo inexistente.
        const permitidos = await this.pdp.decidirAlgunAlcanceEnTransaccion(
          tx,
          { operacion: 'API-GRF-05', actorDeLaDecision: yo, profesionalId: yo, titularId: personaId, recurso: { tipo: ELECCIONES_DE_LA_PERSONA, id: personaId } },
          ctx,
        );
        // La elección del plan de un área sin acceso no se lee: queda guardada y vuelve con el acceso.
        const ambitos = ambitosLegibles(new Set(permitidos.map((p) => p.alcance)));
        const filas = await tx.eleccionDeConjuntoDeGraficos.findMany({ where: { profesionalId: yo, asesoradoId: personaId, ambito: { in: ambitos } }, include: CON_EL_ENFOQUE });
        filas.sort((a, b) => ORDEN_DE_LOS_AMBITOS.indexOf(a.ambito) - ORDEN_DE_LOS_AMBITOS.indexOf(b.ambito) || a.id.localeCompare(b.id));
        return { data: filas.map((f) => eleccionApi(f, f.conjunto)) };
      },
    });
  }

  // ─── API-GRF-06 · elegir o cambiar el enfoque de la persona o de uno de sus planes ───────────────────────────
  elegir(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribir({
      operacion: 'API-GRF-06',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: ELECCIONES_DE_LA_PERSONA, id: adviseeId },
      esquema: ElegirEnfoqueRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        if (!esUuid(adviseeId)) throw this.ejecutor.noRevelable({ operacion: 'API-GRF-06', actorId: actor.identidadId, recurso: null }, ctx);
        const personaId = adviseeId.toLowerCase();
        const yo = actor.identidadId;
        const area = AREA_DEL_AMBITO[pedido.scope];
        // Primero la autorización: la persona hoy, con el área del plan (o alguna, si la elección es de la persona).
        await this.decidirConLaPersona(tx, 'API-GRF-06', yo, personaId, area, ctx);
        const plan: { readonly scope: 'TRAINING_PLAN' | 'NUTRITION_PLAN'; readonly id: string } | null =
          pedido.scope === 'TRAINING_PLAN'
            ? { scope: 'TRAINING_PLAN', id: pedido.trainingPlanId.toLowerCase() }
            : pedido.scope === 'NUTRITION_PLAN'
              ? { scope: 'NUTRITION_PLAN', id: pedido.nutritionPlanId.toLowerCase() }
              : null;
        if (plan && !(await esPlanPropio(tx, plan.scope, plan.id, yo, personaId))) {
          // Un plan de otro profesional, de otra persona, de la otra área o inexistente: el mismo 404.
          throw this.ejecutor.noRevelable({ operacion: 'API-GRF-06', actorId: yo, recurso: { tipo: PLAN_DEL_AMBITO[plan.scope], id: plan.id }, sujetoId: personaId, alcance: area ?? undefined }, ctx);
        }
        // Un enfoque de otro profesional o inexistente: el mismo 404. Queda tomado hasta el final, para que no se borre en el medio.
        const enfoque = await enfoqueParaElegir(tx, yo, pedido.setId);
        if (!enfoque) throw errores.recursoNoEncontrado();
        const donde = {
          profesionalId: yo,
          asesoradoId: personaId,
          ambito: AMBITO_EN_LA_BASE[pedido.scope],
          planDeEntrenamientoId: plan?.scope === 'TRAINING_PLAN' ? plan.id : null,
          planNutricionalId: plan?.scope === 'NUTRITION_PLAN' ? plan.id : null,
        };
        const actual = await tx.eleccionDeConjuntoDeGraficos.findFirst({ where: donde });
        const momento = await momentoDeLaBase(tx);
        if (pedido.expectedVersion === null) {
          // Crear: si ya había una, o si otra pestaña la crea al mismo tiempo (el índice único), el 409 de lo que cambió.
          if (actual) throw errores.conflictoDeVersion();
          const creada = await sinDuplicar(
            tx.eleccionDeConjuntoDeGraficos.create({
              data: { ...donde, conjuntoId: enfoque.id, procedencia: procedencia as unknown as Prisma.InputJsonValue, momentoDeRegistro: momento, momentoDeActualizacion: momento },
            }),
            errores.conflictoDeVersion,
          );
          return { estadoHttp: 201, cuerpo: { data: eleccionApi(creada, enfoque) }, sujetoId: personaId, recurso: { tipo: ELECCION, id: creada.id } };
        }
        if (!actual || pedido.expectedVersion !== token(actual.version)) throw errores.conflictoDeVersion();
        // Condicionada a la versión leída: si otra pestaña la cambió o la quitó en el medio, no se pisa.
        const r = await tx.eleccionDeConjuntoDeGraficos.updateMany({
          where: { id: actual.id, version: actual.version },
          data: { conjuntoId: enfoque.id, version: actual.version + 1, procedencia: procedencia as unknown as Prisma.InputJsonValue, momentoDeActualizacion: momento },
        });
        if (r.count !== 1) throw errores.conflictoDeVersion();
        const cambiada = await tx.eleccionDeConjuntoDeGraficos.findUniqueOrThrow({ where: { id: actual.id } });
        return { estadoHttp: 200, cuerpo: { data: eleccionApi(cambiada, enfoque) }, sujetoId: personaId, recurso: { tipo: ELECCION, id: actual.id } };
      },
    });
  }

  // ─── API-GRF-07 · quitar una elección: vuelven los sugeridos ─────────────────────────────────────────────────
  quitar(actor: ActorAutenticado, adviseeId: string, choiceId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: ELECCION, id: choiceId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-GRF-07',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: CuerpoVacioSchema,
      cuerpo: cuerpo ?? {},
      huellaExtra: { adviseeId, choiceId },
      efecto: async (tx) => {
        const yo = actor.identidadId;
        const personaId = esUuid(adviseeId) ? adviseeId.toLowerCase() : null;
        const fila = personaId && esUuid(choiceId) ? await tx.eleccionDeConjuntoDeGraficos.findUnique({ where: { id: choiceId.toLowerCase() } }) : null;
        // De otro profesional, de otra persona o inexistente: el mismo 404. Que exista no se revela.
        if (!fila || fila.profesionalId !== yo || fila.asesoradoId !== personaId) throw this.ejecutor.noRevelable({ operacion: 'API-GRF-07', actorId: yo, recurso }, ctx);
        // El PDP de hoy, con el área que pide su ámbito: el reintento con la misma clave lo vuelve a decidir (08:601).
        await this.decidirConLaPersona(tx, 'API-GRF-07', yo, fila.asesoradoId, AREA_DEL_AMBITO[AMBITO_EN_LA_API[fila.ambito]], ctx);
        const r = await tx.eleccionDeConjuntoDeGraficos.deleteMany({ where: { id: fila.id, profesionalId: yo } });
        // Otra pestaña (o el borrado del enfoque) la quitó en el medio: ya no está.
        if (r.count !== 1) throw this.ejecutor.noRevelable({ operacion: 'API-GRF-07', actorId: yo, recurso }, ctx);
        // El ejecutor espera 200 o 201; el controlador responde 204 sin cuerpo (también al reintentar con la misma clave).
        return { estadoHttp: 200, cuerpo: null, sujetoId: fila.asesoradoId, recurso: { tipo: ELECCION, id: fila.id } };
      },
    });
  }

  // ─── Apoyo ─────────────────────────────────────────────────────────────────────────────────────────────────

  /**
   * El PDP de una escritura sobre las elecciones de la persona, dentro de su transacción y registrado: el del área del
   * plan o, para la elección de la persona, el de la primera área que hoy se permite con ella. Se decide con
   * `decidirEnTransaccion`, que el reintento con la misma clave vuelve a tomar (08:601). Sin ninguna área permitida, las
   * tres decisiones quedan registradas y responde el 404 de lo inexistente.
   */
  private async decidirConLaPersona(tx: Tx, operacion: string, yo: string, personaId: string, area: Alcance | null, ctx: ContextoDeSolicitud): Promise<void> {
    const recurso = { tipo: ELECCIONES_DE_LA_PERSONA, id: personaId };
    let alcance = area;
    if (alcance === null) {
      const permitidas = new Set((await this.pdp.leerHechos(tx, yo, personaId)).filter((h) => evaluarAutorizacion(h).permitida).map((h) => h.operacion.alcance));
      alcance = AREAS.find((a) => permitidas.has(a)) ?? null;
    }
    if (alcance === null) {
      // Lanza el 404 con la decisión que apunta a la causa. Si entre las dos lecturas se habilitó un área, sigue con esa.
      const permitidos = await this.pdp.decidirAlgunAlcanceEnTransaccion(tx, { operacion, actorDeLaDecision: yo, profesionalId: yo, titularId: personaId, recurso }, ctx);
      alcance = permitidos[0]!.alcance;
    }
    await this.pdp.decidirEnTransaccion(tx, { operacion, actorDeLaDecision: yo, profesionalId: yo, titularId: personaId, alcance, recurso }, ctx);
  }
}

/** Solo un profesional verificado y habilitado en algún área tiene enfoques. Otro actor: 403. */
async function exigirProfesional(tx: Tx, identidadId: string): Promise<void> {
  // Con las filas de sus áreas en modo compartido, como el PDP (profesional/area-operable.ts).
  if (!(await puedeOperarArea(tx, identidadId))) throw errores.accionNoPermitida();
}

/** El enfoque del profesional, o el 404 neutral: uno ajeno no se distingue de uno inexistente. */
async function propio(tx: Tx, profesionalId: string, setId: string): Promise<FilaDeEnfoque> {
  const fila = esUuid(setId) ? await tx.conjuntoDeGraficos.findUnique({ where: { id: setId.toLowerCase() } }) : null;
  if (!fila || fila.profesionalId !== profesionalId) throw errores.recursoNoEncontrado();
  return fila;
}

/**
 * El enfoque que se elige, si es del profesional, tomado en modo compartido hasta el final de la transacción: borrarlo en
 * el medio espera, y después se lleva también la elección nueva (en cascada).
 */
async function enfoqueParaElegir(tx: Tx, profesionalId: string, setId: string): Promise<{ id: string; nombre: string } | null> {
  const [fila] = await tx.$queryRaw<{ id: string; nombre: string }[]>`
    SELECT "id"::text AS "id", "nombre" FROM "conjunto_de_graficos"
     WHERE "id" = ${setId}::uuid AND "profesional_id" = ${profesionalId}::uuid
       FOR KEY SHARE`;
  return fila ?? null;
}

/** El plan de la elección: de este profesional, con esta persona y del área del ámbito. */
async function esPlanPropio(tx: Tx, scope: 'TRAINING_PLAN' | 'NUTRITION_PLAN', planId: string, profesionalId: string, personaId: string): Promise<boolean> {
  const donde = { id: planId, profesionalId, asesoradoId: personaId };
  const encontrados = scope === 'TRAINING_PLAN' ? await tx.planDeEntrenamiento.count({ where: donde }) : await tx.planNutricional.count({ where: donde });
  return encontrados === 1;
}

/** Los enfoques de un profesional se crean de a uno: el tope de 50 es exacto aunque dos pestañas guarden a la vez. */
async function tomarLosEnfoques(tx: Tx, profesionalId: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`conjunto_de_graficos|${profesionalId}`}, 0))`;
}
