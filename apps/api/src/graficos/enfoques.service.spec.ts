import { CodigoDeError, FINALIDAD_DE_ALCANCE, type Alcance, type HechosDeAutorizacion } from '@be/domain';
import { Prisma } from '@prisma/client';
import type { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi } from '../http/errores';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import type { EjecutorDeGraficos } from './ejecutor';
import { ambitosLegibles, eleccionApi, EnfoquesService } from './enfoques.service';

/**
 * TEST-GRF-083 (WP-GRAFICOS GR-27, DL-174) · el servicio de los enfoques, sin base: un ejecutor que corre el efecto con
 * una transacción falsa, y un PDP falso que permite las áreas que se le dicen. Lo que pasa contra PostgreSQL (la cascada,
 * los índices únicos, el disparador, la idempotencia de verdad y el PDP real) está en
 * test/integration/enfoques-de-graficos.int-spec.ts. Cada caso dice la mutación que lo tiene que hacer fallar.
 */

const YO = '11111111-1111-4111-8111-111111111111';
const OTRO = '22222222-2222-4222-8222-222222222222';
const PERSONA = '33333333-3333-4333-8333-333333333333';
const ENFOQUE = '44444444-4444-4444-8444-444444444444';
const PLAN = '55555555-5555-4555-8555-555555555555';
const ELECCION = '66666666-6666-4666-8666-666666666666';

const ACTOR = { identidadId: YO, sesionId: 'sesion', momentoDeAutenticacion: new Date(), expiraEn: new Date() } as unknown as ActorAutenticado;
const CTX = { requestId: null, momentoDeRecepcion: new Date(), superficie: 'WEB', direccionIp: null, agenteDeUsuario: null } as unknown as ContextoDeSolicitud;
const PROCEDENCIA = { fuente: 'PROPIA', casoDeUso: 'GR-27', operacion: 'PRUEBA', superficie: 'WEB', requestId: null };
const AHORA = new Date('2026-11-14T15:00:00.000Z');
const CONTENIDO = { schemaVersion: 1, charts: [{ kind: 'SUGGESTED', chartId: 'nutricion.energia-por-dia', exercise: null, bodyMetric: null }] };

const filaDeEnfoque = (cambios: Record<string, unknown> = {}) => ({
  id: ENFOQUE,
  profesionalId: YO,
  nombre: 'Foco en fuerza',
  contenido: CONTENIDO,
  version: 1,
  procedencia: PROCEDENCIA,
  momentoDeRegistro: AHORA,
  momentoDeActualizacion: AHORA,
  _count: { elecciones: 0 },
  ...cambios,
});
const filaDeEleccion = (cambios: Record<string, unknown> = {}) => ({
  id: ELECCION,
  profesionalId: YO,
  asesoradoId: PERSONA,
  ambito: 'PERSONA',
  planDeEntrenamientoId: null,
  planNutricionalId: null,
  conjuntoId: ENFOQUE,
  version: 1,
  procedencia: PROCEDENCIA,
  momentoDeRegistro: AHORA,
  momentoDeActualizacion: AHORA,
  ...cambios,
});

interface EstadoDeLaBase {
  profesionalHabilitado: boolean;
  enfoques: number;
  enfoque: ReturnType<typeof filaDeEnfoque> | null;
  enfoqueParaElegir: { id: string; nombre: string } | null;
  planes: number;
  eleccion: ReturnType<typeof filaDeEleccion> | null;
  creacionDuplicada: boolean;
}

/** Una transacción falsa: responde lo que dice el estado y anota el orden de lo que se hizo. */
function baseFalsa(cambios: Partial<EstadoDeLaBase> = {}) {
  const estado: EstadoDeLaBase = {
    profesionalHabilitado: true,
    enfoques: 0,
    enfoque: filaDeEnfoque(),
    enfoqueParaElegir: { id: ENFOQUE, nombre: 'Foco en fuerza' },
    planes: 1,
    eleccion: null,
    creacionDuplicada: false,
    ...cambios,
  };
  const pasos: string[] = [];
  const tx = {
    $queryRaw: jest.fn(async (partes: TemplateStringsArray) => {
      const sql = partes.join('?');
      if (sql.includes('verificacion_profesional')) return [{ ok: estado.profesionalHabilitado }];
      if (sql.includes('clock_timestamp')) return [{ ahora: AHORA }];
      if (sql.includes('FOR KEY SHARE')) {
        pasos.push('tomar el enfoque');
        return estado.enfoqueParaElegir ? [estado.enfoqueParaElegir] : [];
      }
      throw new Error(`consulta no prevista: ${sql}`);
    }),
    $executeRaw: jest.fn(async (partes: TemplateStringsArray) => {
      pasos.push(partes.join('?').includes('pg_advisory_xact_lock') ? 'cerrojo' : 'otra sentencia');
      return 1;
    }),
    conjuntoDeGraficos: {
      count: jest.fn(async () => {
        pasos.push('contar');
        return estado.enfoques;
      }),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        pasos.push('crear');
        return filaDeEnfoque({ ...data, id: ENFOQUE });
      }),
      findMany: jest.fn(async () => (estado.enfoque ? [estado.enfoque] : [])),
      findUnique: jest.fn(async () => estado.enfoque),
      findUniqueOrThrow: jest.fn(async () => filaDeEnfoque({ version: 2 })),
      updateMany: jest.fn(async () => ({ count: 1 })),
      deleteMany: jest.fn(async () => ({ count: 1 })),
    },
    eleccionDeConjuntoDeGraficos: {
      findFirst: jest.fn(async () => estado.eleccion),
      findUnique: jest.fn(async () => estado.eleccion),
      findUniqueOrThrow: jest.fn(async () => filaDeEleccion({ version: 2 })),
      findMany: jest.fn(async () => []),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        if (estado.creacionDuplicada) throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'prueba' });
        pasos.push('elegir');
        return filaDeEleccion(data);
      }),
      updateMany: jest.fn(async () => ({ count: 1 })),
      deleteMany: jest.fn(async () => {
        pasos.push('quitar');
        return { count: 1 };
      }),
    },
    planDeEntrenamiento: { count: jest.fn(async () => estado.planes) },
    planNutricional: { count: jest.fn(async () => estado.planes) },
  };
  return { tx, pasos };
}

const noEncontrado = () => new ErrorDeApi(404, CodigoDeError.RESOURCE_NOT_FOUND, 'Recurso no encontrado.');

/** El ejecutor, sin transacción real: valida el cuerpo con el esquema del contrato y corre el efecto o la lectura. */
function ejecutorFalso(tx: unknown): EjecutorDeGraficos {
  const escribir = async (p: { esquema: { parse: (c: unknown) => unknown }; cuerpo: unknown; efecto: (tx: unknown, pedido: unknown, procedencia: unknown) => Promise<unknown> }) =>
    p.efecto(tx, p.esquema.parse(p.cuerpo), PROCEDENCIA);
  return {
    leer: async (p: { lectura: (tx: unknown) => Promise<unknown> }) => p.lectura(tx),
    escribir,
    escribirIdempotente: escribir,
    noRevelable: noEncontrado,
  } as unknown as EjecutorDeGraficos;
}

/** Los hechos de un área con la persona: con el acceso completo, o sin vínculo ni consentimiento. */
function hechos(alcance: Alcance, permitido: boolean): HechosDeAutorizacion {
  const finalidad = FINALIDAD_DE_ALCANCE[alcance];
  return {
    operacion: { alcance, finalidad },
    actor: { identidadId: YO, cuentaOperativa: true, tienePerfilProfesional: true, conSegundoFactor: true },
    titular: { identidadId: PERSONA, cuentaOperativa: true, a3Vigente: true },
    verificacion: 'VERIFICADO',
    habilitacion: 'CONCEDIDA',
    alcanceDeVinculo: permitido ? { id: `vinculo-${alcance}`, alcance, finalidad, estado: 'ACEPTADO' } : null,
    consentimiento: permitido ? { id: `consentimiento-${alcance}`, finalidad, situacion: 'VIGENTE', versionVigenteId: `version-${alcance}` } : null,
  };
}

/** Un PDP que permite las áreas que se le dicen y anota cada área que decidió. */
function pdpFalso(permitidas: readonly Alcance[]) {
  const decididas: Alcance[] = [];
  const pdp = {
    leerHechos: jest.fn(async () => (['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'] as const).map((a) => hechos(a, permitidas.includes(a)))),
    decidirEnTransaccion: jest.fn(async (_tx: unknown, p: { alcance: Alcance }) => {
      decididas.push(p.alcance);
      if (!permitidas.includes(p.alcance)) throw noEncontrado();
      return {};
    }),
    decidirAlgunAlcanceEnTransaccion: jest.fn(async () => {
      if (permitidas.length === 0) throw noEncontrado();
      return permitidas.map((alcance) => ({ alcance, alcanceDeVinculoId: `vinculo-${alcance}` }));
    }),
  };
  return { pdp: pdp as unknown as PdpService, decididas, espia: pdp };
}

function servicio(base: ReturnType<typeof baseFalsa>, permitidas: readonly Alcance[] = ['ENTRENAMIENTO', 'NUTRICION']) {
  const p = pdpFalso(permitidas);
  return { s: new EnfoquesService(ejecutorFalso(base.tx), p.pdp), ...p };
}

async function rechazo(promesa: Promise<unknown>): Promise<{ status: number; code: string }> {
  try {
    await promesa;
  } catch (e) {
    if (e instanceof ErrorDeApi) return { status: e.status, code: e.code };
    throw e;
  }
  throw new Error('se esperaba un rechazo');
}

const CREAR = { name: 'Foco en fuerza', content: CONTENIDO };

describe('TEST-GRF-083 · los enfoques del profesional (API-GRF-01 a 04)', () => {
  it('crear toma el cerrojo de sus enfoques antes de contar, y el 51 responde 422 TOO_MANY_SETS sin crear (mutación: contar sin el cerrojo o dejar pasar el 51)', async () => {
    const lleno = baseFalsa({ enfoques: 50 });
    expect(await rechazo(servicio(lleno).s.crear(ACTOR, CREAR, 'clave-de-prueba', CTX))).toEqual({ status: 422, code: 'TOO_MANY_SETS' });
    expect(lleno.pasos).toEqual(['cerrojo', 'contar']);
    const con49 = baseFalsa({ enfoques: 49 });
    const creado = (await servicio(con49).s.crear(ACTOR, CREAR, 'clave-de-prueba', CTX)) as unknown as { estadoHttp: number; cuerpo: { data: { choices: number; version: string } } };
    expect(con49.pasos).toEqual(['cerrojo', 'contar', 'crear']);
    expect(creado.estadoHttp).toBe(201);
    expect(creado.cuerpo.data).toMatchObject({ choices: 0, version: 'v1' });
  });

  it('solo un profesional verificado y habilitado en algún área: otro actor recibe 403 al listar y al crear', async () => {
    const base = baseFalsa({ profesionalHabilitado: false });
    expect(await rechazo(servicio(base).s.listar(ACTOR, CTX))).toEqual({ status: 403, code: 'ACTION_FORBIDDEN' });
    expect(await rechazo(servicio(base).s.crear(ACTOR, CREAR, 'clave-de-prueba', CTX))).toEqual({ status: 403, code: 'ACTION_FORBIDDEN' });
    expect(base.tx.conjuntoDeGraficos.create).not.toHaveBeenCalled();
  });

  it('un enfoque de otro profesional responde el mismo 404 que uno inexistente, al cambiarlo y al borrarlo (mutación: dejar al otro profesional)', async () => {
    const ajeno = baseFalsa({ enfoque: filaDeEnfoque({ profesionalId: OTRO }) });
    const inexistente = baseFalsa({ enfoque: null });
    const cambio = { expectedVersion: 'v1', ...CREAR };
    for (const base of [ajeno, inexistente]) {
      expect(await rechazo(servicio(base).s.reemplazar(ACTOR, ENFOQUE, cambio, CTX))).toEqual({ status: 404, code: 'RESOURCE_NOT_FOUND' });
      expect(await rechazo(servicio(base).s.borrar(ACTOR, ENFOQUE, {}, 'clave-de-prueba', CTX))).toEqual({ status: 404, code: 'RESOURCE_NOT_FOUND' });
      expect(base.tx.conjuntoDeGraficos.updateMany).not.toHaveBeenCalled();
      expect(base.tx.conjuntoDeGraficos.deleteMany).not.toHaveBeenCalled();
    }
    // Un identificador que no es un UUID ni se busca.
    const otra = baseFalsa();
    expect(await rechazo(servicio(otra).s.reemplazar(ACTOR, 'foco-en-fuerza', cambio, CTX))).toEqual({ status: 404, code: 'RESOURCE_NOT_FOUND' });
    expect(otra.tx.conjuntoDeGraficos.findUnique).not.toHaveBeenCalled();
  });

  it('cambiar pide la versión leída: otra responde 409 VERSION_CONFLICT, y la escritura va condicionada a esa versión', async () => {
    const base = baseFalsa({ enfoque: filaDeEnfoque({ version: 3 }) });
    expect(await rechazo(servicio(base).s.reemplazar(ACTOR, ENFOQUE, { expectedVersion: 'v2', ...CREAR }, CTX))).toEqual({ status: 409, code: 'VERSION_CONFLICT' });
    await servicio(base).s.reemplazar(ACTOR, ENFOQUE, { expectedVersion: 'v3', ...CREAR }, CTX);
    expect(base.tx.conjuntoDeGraficos.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: ENFOQUE, version: 3 }, data: expect.objectContaining({ version: 4 }) }));
  });
});

describe('TEST-GRF-083 · dónde está elegido (API-GRF-05 a 07)', () => {
  it('la elección de la persona se decide con la primera área que el PDP permite hoy, en el orden Entrenamiento, Nutrición, Antropometría', async () => {
    const base = baseFalsa();
    const { s, decididas } = servicio(base, ['NUTRICION', 'ANTROPOMETRIA']);
    const r = (await s.elegir(ACTOR, PERSONA, { scope: 'PERSON', setId: ENFOQUE, expectedVersion: null }, CTX)) as unknown as { estadoHttp: number };
    expect(r.estadoHttp).toBe(201);
    expect(decididas).toEqual(['NUTRICION']);
    expect(base.pasos).toEqual(['tomar el enfoque', 'elegir']);
  });

  it('sin ningún área permitida con la persona, el 404 antes de mirar el enfoque o el plan (mutación: elegir sin el PDP)', async () => {
    const base = baseFalsa();
    const { s, espia } = servicio(base, []);
    expect(await rechazo(s.elegir(ACTOR, PERSONA, { scope: 'PERSON', setId: ENFOQUE, expectedVersion: null }, CTX))).toEqual({ status: 404, code: 'RESOURCE_NOT_FOUND' });
    expect(espia.decidirAlgunAlcanceEnTransaccion).toHaveBeenCalled();
    expect(base.pasos).toEqual([]);
    expect(await rechazo(s.elecciones(ACTOR, PERSONA, CTX))).toEqual({ status: 404, code: 'RESOURCE_NOT_FOUND' });
    expect(base.tx.eleccionDeConjuntoDeGraficos.findMany).not.toHaveBeenCalled();
  });

  it('la de un plan pide el área del plan, aunque otra esté permitida, y un plan que no es de este profesional con esta persona es el mismo 404', async () => {
    const soloNutricion = baseFalsa();
    const conNutricion = servicio(soloNutricion, ['NUTRICION']);
    expect(await rechazo(conNutricion.s.elegir(ACTOR, PERSONA, { scope: 'TRAINING_PLAN', trainingPlanId: PLAN, setId: ENFOQUE, expectedVersion: null }, CTX))).toEqual({ status: 404, code: 'RESOURCE_NOT_FOUND' });
    expect(conNutricion.decididas).toEqual(['ENTRENAMIENTO']);
    const ajeno = baseFalsa({ planes: 0 });
    const conAmbas = servicio(ajeno);
    expect(await rechazo(conAmbas.s.elegir(ACTOR, PERSONA, { scope: 'NUTRITION_PLAN', nutritionPlanId: PLAN, setId: ENFOQUE, expectedVersion: null }, CTX))).toEqual({ status: 404, code: 'RESOURCE_NOT_FOUND' });
    expect(conAmbas.decididas).toEqual(['NUTRICION']);
    expect(ajeno.tx.planNutricional.count).toHaveBeenCalledWith({ where: { id: PLAN, profesionalId: YO, asesoradoId: PERSONA } });
    expect(ajeno.pasos).toEqual([]);
  });

  it('un enfoque de otro profesional no se elige: el mismo 404, sin escribir', async () => {
    const base = baseFalsa({ enfoqueParaElegir: null });
    expect(await rechazo(servicio(base).s.elegir(ACTOR, PERSONA, { scope: 'PERSON', setId: ENFOQUE, expectedVersion: null }, CTX))).toEqual({ status: 404, code: 'RESOURCE_NOT_FOUND' });
    expect(base.tx.eleccionDeConjuntoDeGraficos.create).not.toHaveBeenCalled();
  });

  it('crear con una elección que ya existe, o con la que otra pestaña creó al mismo tiempo (el índice único), responde 409 VERSION_CONFLICT; cambiar pide la versión leída', async () => {
    const yaHay = baseFalsa({ eleccion: filaDeEleccion() });
    expect(await rechazo(servicio(yaHay).s.elegir(ACTOR, PERSONA, { scope: 'PERSON', setId: ENFOQUE, expectedVersion: null }, CTX))).toEqual({ status: 409, code: 'VERSION_CONFLICT' });
    const aLaVez = baseFalsa({ creacionDuplicada: true });
    expect(await rechazo(servicio(aLaVez).s.elegir(ACTOR, PERSONA, { scope: 'PERSON', setId: ENFOQUE, expectedVersion: null }, CTX))).toEqual({ status: 409, code: 'VERSION_CONFLICT' });
    const vieja = baseFalsa({ eleccion: filaDeEleccion({ version: 2 }) });
    expect(await rechazo(servicio(vieja).s.elegir(ACTOR, PERSONA, { scope: 'PERSON', setId: ENFOQUE, expectedVersion: 'v1' }, CTX))).toEqual({ status: 409, code: 'VERSION_CONFLICT' });
    const sinNada = baseFalsa();
    expect(await rechazo(servicio(sinNada).s.elegir(ACTOR, PERSONA, { scope: 'PERSON', setId: ENFOQUE, expectedVersion: 'v1' }, CTX))).toEqual({ status: 409, code: 'VERSION_CONFLICT' });
    const vigente = baseFalsa({ eleccion: filaDeEleccion({ version: 2 }) });
    const r = (await servicio(vigente).s.elegir(ACTOR, PERSONA, { scope: 'PERSON', setId: ENFOQUE, expectedVersion: 'v2' }, CTX)) as unknown as { estadoHttp: number };
    expect(r.estadoHttp).toBe(200);
    expect(vigente.tx.eleccionDeConjuntoDeGraficos.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: ELECCION, version: 2 } }));
  });

  it('la lectura trae la elección de un plan solo con el área del plan permitida hoy (mutación: leer todos los ámbitos)', () => {
    expect(ambitosLegibles(new Set<Alcance>(['NUTRICION']))).toEqual(['PERSONA', 'PLAN_NUTRICIONAL']);
    expect(ambitosLegibles(new Set<Alcance>(['ANTROPOMETRIA']))).toEqual(['PERSONA']);
    expect(ambitosLegibles(new Set<Alcance>(['ENTRENAMIENTO', 'NUTRICION']))).toEqual(['PERSONA', 'PLAN_DE_ENTRENAMIENTO', 'PLAN_NUTRICIONAL']);
  });

  it('API-GRF-05 pide a la base solo los ámbitos legibles de este profesional con esta persona', async () => {
    const base = baseFalsa();
    await servicio(base, ['ANTROPOMETRIA']).s.elecciones(ACTOR, PERSONA.toUpperCase(), CTX);
    expect(base.tx.eleccionDeConjuntoDeGraficos.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { profesionalId: YO, asesoradoId: PERSONA, ambito: { in: ['PERSONA'] } } }));
  });

  it('una elección se lee con el plan por su identidad (nunca una versión) y el nombre del enfoque, sin su contenido', () => {
    const del = eleccionApi(filaDeEleccion({ ambito: 'PLAN_DE_ENTRENAMIENTO', planDeEntrenamientoId: PLAN }) as never, { id: ENFOQUE, nombre: 'Foco en fuerza' });
    expect(del).toEqual({ choiceId: ELECCION, scope: 'TRAINING_PLAN', trainingPlanId: PLAN, nutritionPlanId: null, set: { setId: ENFOQUE, name: 'Foco en fuerza' }, version: 'v1', updatedAt: AHORA.toISOString() });
    expect(eleccionApi(filaDeEleccion() as never, { id: ENFOQUE, nombre: 'Foco en fuerza' })).toMatchObject({ scope: 'PERSON', trainingPlanId: null, nutritionPlanId: null });
  });

  it('quitar: una elección de otro profesional o de otra persona es el mismo 404; la propia decide el área de su ámbito antes de quitarla (mutación: quitar sin el PDP)', async () => {
    for (const ajena of [filaDeEleccion({ profesionalId: OTRO }), filaDeEleccion({ asesoradoId: OTRO })]) {
      const base = baseFalsa({ eleccion: ajena });
      const { s, decididas } = servicio(base);
      expect(await rechazo(s.quitar(ACTOR, PERSONA, ELECCION, {}, 'clave-de-prueba', CTX))).toEqual({ status: 404, code: 'RESOURCE_NOT_FOUND' });
      expect(decididas).toEqual([]);
      expect(base.pasos).toEqual([]);
    }
    const delPlan = baseFalsa({ eleccion: filaDeEleccion({ ambito: 'PLAN_NUTRICIONAL', planNutricionalId: PLAN }) });
    const sinNutricion = servicio(delPlan, ['ENTRENAMIENTO']);
    expect(await rechazo(sinNutricion.s.quitar(ACTOR, PERSONA, ELECCION, {}, 'clave-de-prueba', CTX))).toEqual({ status: 404, code: 'RESOURCE_NOT_FOUND' });
    expect(sinNutricion.decididas).toEqual(['NUTRICION']);
    expect(delPlan.pasos).toEqual([]);
    const conNutricion = servicio(delPlan, ['NUTRICION']);
    await conNutricion.s.quitar(ACTOR, PERSONA, ELECCION, {}, 'clave-de-prueba', CTX);
    expect(delPlan.pasos).toEqual(['quitar']);
  });
});
