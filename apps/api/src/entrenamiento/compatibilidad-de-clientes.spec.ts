import { CAPACIDAD_OBJETIVOS_POR_SERIE, CodigoDeError, type CapacidadDeCliente, type ContenidoDePlanDeEntrenamiento } from '@be/domain';
import { Prisma } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { CompatibilidadDeClientesService, entregaRetenida, seRetieneLaEntrega } from './compatibilidad-de-clientes';

/**
 * Precierre del 2026-10-06, §2 (DL-122) · lo que la integración no puede forzar del registro de la capacidad declarada: que
 * es de mejor esfuerzo (si la base falla, la lectura no falla y el log técnico no lleva datos de nadie) y que no escribe en
 * cada pedido. Sin base: un cliente falso que anota cada sentencia.
 */
const IDENTIDAD = '11111111-1111-4111-8111-111111111111';

const contexto = (capacidades: readonly CapacidadDeCliente[]): ContextoDeSolicitud => ({
  requestId: 'pedido-de-prueba',
  momentoDeRecepcion: new Date(),
  superficie: 'APK',
  direccionIp: null,
  agenteDeUsuario: null,
  capacidades: new Set(capacidades),
});

function baseFalsa(p: { reciente?: boolean; falla?: unknown } = {}) {
  const sentencias: string[] = [];
  const anotar = (partes: TemplateStringsArray) => sentencias.push(partes.join('?').replace(/\s+/g, ' ').trim());
  const prisma = {
    $queryRaw: async (partes: TemplateStringsArray) => {
      anotar(partes);
      if (p.falla) throw p.falla;
      return p.reciente ? [{ reciente: 1 }] : [];
    },
    $executeRaw: async (partes: TemplateStringsArray) => {
      anotar(partes);
      return 1;
    },
  };
  const servicio = new CompatibilidadDeClientesService(prisma as never, {} as never);
  const lineas: string[] = [];
  servicio.log = (l) => lineas.push(l);
  return { servicio, sentencias, lineas };
}

describe('DL-122 · registrar la capacidad declarada', () => {
  it('sin la capacidad en el pedido no toca la base', async () => {
    const { servicio, sentencias } = baseFalsa();
    await servicio.registrarDeclaracion(IDENTIDAD, contexto([]));
    expect(sentencias).toEqual([]);
  });

  it('con una declaración de la última hora solo la consulta: no escribe en cada pedido', async () => {
    const { servicio, sentencias } = baseFalsa({ reciente: true });
    await servicio.registrarDeclaracion(IDENTIDAD, contexto([CAPACIDAD_OBJETIVOS_POR_SERIE]));
    expect(sentencias).toHaveLength(1);
    expect(sentencias[0]).toMatch(/^SELECT 1 .* "momento_de_ultima_declaracion" > now\(\) - interval '1 hour'$/);
  });

  it('sin una reciente la crea o actualiza la última vez, y la base resuelve dos pedidos a la vez', async () => {
    const { servicio, sentencias } = baseFalsa();
    await servicio.registrarDeclaracion(IDENTIDAD, contexto([CAPACIDAD_OBJETIVOS_POR_SERIE]));
    expect(sentencias).toHaveLength(2);
    expect(sentencias[1]).toMatch(/^INSERT INTO "capacidad_de_cliente_declarada" \("identidad_id", "capacidad", "superficie"\)/);
    expect(sentencias[1]).toMatch(/ON CONFLICT \("identidad_id", "capacidad"\) DO UPDATE/);
    expect(sentencias[1]).toMatch(/WHERE "capacidad_de_cliente_declarada"\."momento_de_ultima_declaracion" <= now\(\) - interval '1 hour'$/);
  });

  it('si la base falla, no lanza: deja una línea en el log técnico con el tipo y el código, sin la identidad ni el mensaje', async () => {
    const falla = new Prisma.PrismaClientKnownRequestError(`no se pudo escribir para ${IDENTIDAD}`, { code: 'P1001', clientVersion: 'prueba' });
    const { servicio, lineas } = baseFalsa({ falla });
    await expect(servicio.registrarDeclaracion(IDENTIDAD, contexto([CAPACIDAD_OBJETIVOS_POR_SERIE]))).resolves.toBeUndefined();
    expect(lineas.map((l) => JSON.parse(l))).toEqual([
      { nivel: 'warn', evento: 'capacidad_de_cliente_no_registrada', tipo: 'PrismaClientKnownRequestError', codigo: 'P1001', requestId: 'pedido-de-prueba' },
    ]);
    expect(lineas[0]).not.toContain(IDENTIDAD);
  });
});

describe('DL-122 · la entrega retenida', () => {
  /** Una prescripción con criterio RIR 3 y carga general; `serie` cambia la segunda serie. */
  const plan = (serie: Record<string, unknown>): ContenidoDePlanDeEntrenamiento =>
    ({
      blocks: [
        {
          blockId: 'b',
          label: 'Bloque',
          purpose: null,
          microcycles: [],
          sessions: [
            {
              sessionId: 's',
              label: 'Sesión',
              instructions: null,
              prescriptions: [
                {
                  prescriptionId: 'p',
                  exerciseVersionId: 'e',
                  sets: [{ repetitions: { value: 10 }, note: null }, { repetitions: { value: 8 }, note: null, ...serie }],
                  intensity: { criterion: 'RIR', target: { value: 3, reference: null } },
                  suggestedLoad: { value: 16, unit: 'kg' },
                  professionalParameters: [],
                  note: null,
                },
              ],
            },
          ],
        },
      ],
    }) as ContenidoDePlanDeEntrenamiento;

  it('se retiene solo un plan que exige objetivos por serie, y solo a un pedido que no declara mostrarlos', () => {
    const porSerie = plan({ rir: 1, suggestedLoad: { value: 20, unit: 'kg' } });
    expect(seRetieneLaEntrega(contexto([]), porSerie)).toBe(true);
    expect(seRetieneLaEntrega(contexto([CAPACIDAD_OBJETIVOS_POR_SERIE]), porSerie)).toBe(false);
    // Lo mismo que los generales, o solo otro descanso (que una APK anterior no muestra), no exige nada.
    expect(seRetieneLaEntrega(contexto([]), plan({ rir: 3 }))).toBe(false);
    expect(seRetieneLaEntrega(contexto([]), plan({ restSeconds: 120 }))).toBe(false);
  });

  it('el 404 es idéntico al de lo inexistente; el motivo real va solo a la auditoría', () => {
    const e = entregaRetenida();
    const inexistente = errores.recursoNoEncontrado();
    expect([e.status, e.code, e.mensajeSeguro, e.details]).toEqual([inexistente.status, inexistente.code, inexistente.mensajeSeguro, inexistente.details]);
    expect(e.motivoDeAuditoria).toBe(CodigoDeError.CLIENT_CAPABILITY_REQUIRED);
    expect(inexistente.motivoDeAuditoria).toBeUndefined();
  });
});
