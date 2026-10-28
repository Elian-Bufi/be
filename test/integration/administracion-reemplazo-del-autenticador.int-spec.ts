/**
 * Dos reemplazos del autenticador al mismo tiempo, desde dos sesiones del mismo administrador (pendiente 2 del §14 de
 * WP-ADMINISTRACION, 2026-10-27). Hasta acá estaba revisado solo leyendo el código.
 *
 * Lo que fija el contrato (WP-ADMINISTRACION §6.3, API-ADM-07 y 08) y la base:
 *  - reemplazar exige una sesión con el segundo factor vigente y la contraseña; el autenticador anterior vale hasta que el
 *    nuevo se confirma, así que nunca queda la cuenta sin uno activo;
 *  - empezar una configuración descarta el pendiente anterior, y la base admite uno solo por identidad
 *    (`factor_totp_pendiente_por_identidad`) y uno solo activo (`factor_totp_activo_por_identidad`);
 *  - confirmar activa el nuevo, deja el anterior REEMPLAZADO, invalida los códigos de recuperación anteriores y emite diez
 *    nuevos, y termina las otras sesiones administrativas (`CREDENCIALES_ADMINISTRATIVAS_RENOVADAS`); la propia sigue.
 * El contrato no dice cuál de dos pedidos simultáneos gana. Lo que sí garantiza, y la prueba exige: uno solo termina con
 * éxito; el otro no recibe éxito ni códigos; queda un solo autenticador activo, sin pendiente huérfano que se pueda
 * confirmar; un solo lote de códigos vigente; la sesión que perdió, cerrada con su motivo; y el rechazo, en la auditoría,
 * sin ningún secreto.
 *
 * El hallazgo: dos configuraciones empezadas a la vez se cruzaban. Las dos tomaban la identidad en modo compartido, cada una
 * descartaba los pendientes que veía (no el de la otra, todavía sin confirmar) y la segunda chocaba con el índice único
 * de un pendiente por identidad: 500. La corrección (acceso-administrativo.service.ts) toma la identidad en modo exclusivo
 * al empezar, como la renovación de los códigos y el comando del operador: la segunda espera a la primera y descarta su
 * pendiente, que es lo que dice el contrato.
 *
 * Contra PostgreSQL real y sin pausas: la barrera por bloqueos de `soporte-concurrencia.ts`. Solo datos sintéticos
 * (`example.invalid`); los secretos y los códigos viven en la memoria de la prueba y ninguna aserción los imprime.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type request from 'supertest';
import { appDePrueba, CREDENCIAL_SINTETICA } from './soporte-api';
import { adm, administradorListo, codigoTotp, otraSesion, primerFactor, type Administrador } from './soporte-administracion';
import { conLaFilaRetenida, esperarQueEsperen } from './soporte-concurrencia';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = (n: string) => `${n}-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

/** Dispara el pedido ya (supertest es perezoso) y devuelve su promesa. */
const disparar = (t: request.Test): Promise<request.Response> => t.then((r) => r);
const empezar = (token: string) => disparar(adm(app, token).post('/admin/auth/second-factor/enrollment').send({ credential: CREDENCIAL_SINTETICA }));
const confirmar = (token: string, code: string) => disparar(adm(app, token).post('/admin/auth/second-factor/enrollment/confirm').send({ code }));
const secretoDe = (r: request.Response): string => (r.status === 200 ? (r.body.data.secret as string) : '');
const codigosDe = (r: request.Response): string[] => (r.status === 200 ? ((r.body.data.recoveryCodes as string[] | undefined) ?? []) : []);
const errorDe = (r: request.Response): string | null => (r.body?.error?.code as string | undefined) ?? null;
const sesionDelToken = (token: string): string => JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString('utf8')).sid as string;

/** Los autenticadores de la identidad: estado y la sesión que empezó cada uno. */
async function autenticadores(identidadId: string): Promise<{ id: string; estado: string; sesion: string | null }[]> {
  const filas = await prisma.factorTotp.findMany({ where: { identidadId }, select: { id: true, estado: true, sesionDeConfiguracionId: true } });
  return filas.map((f) => ({ id: f.id, estado: f.estado, sesion: f.sesionDeConfiguracionId }));
}
const activoDe = async (identidadId: string): Promise<string> => (await prisma.factorTotp.findFirstOrThrow({ where: { identidadId, estado: 'ACTIVO' }, select: { id: true } })).id;

/** El estado y el motivo de cada sesión. */
async function sesiones(...ids: string[]): Promise<Record<string, { estado: string; motivo: string | null }>> {
  const filas = await prisma.sesion.findMany({ where: { id: { in: ids } }, select: { id: true, estado: true, motivoDeRevocacion: true } });
  return Object.fromEntries(ids.map((id) => [id, (({ estado, motivoDeRevocacion }) => ({ estado, motivo: motivoDeRevocacion ?? null }))(filas.find((f) => f.id === id)!)]));
}

/** Los lotes de códigos de recuperación vigentes de la identidad. */
async function lotesVigentes(identidadId: string): Promise<{ lote: string; codigos: number }[]> {
  const filas = await prisma.codigoDeRecuperacion.groupBy({ by: ['loteId'], where: { identidadId, momentoDeUso: null, momentoDeInvalidacion: null }, _count: { _all: true } });
  return filas.map((f) => ({ lote: f.loteId, codigos: f._count._all }));
}

/** Lo auditado de una operación para una sesión: resultado y motivo, en orden. */
async function auditado(operacion: string, sesionId: string): Promise<{ resultado: string; motivo: string | null }[]> {
  return prisma.registroDeAuditoria.findMany({ where: { operacion, recursoId: sesionId }, orderBy: { momentoDeRegistro: 'asc' }, select: { resultado: true, motivo: true } });
}

/** Ningún secreto del autenticador, ningún código ni la contraseña en la auditoría de la identidad. */
async function sinSecretosEnLaAuditoria(a: Administrador, secretos: readonly string[]): Promise<void> {
  const auditoria = JSON.stringify(await prisma.registroDeAuditoria.findMany({ where: { actorId: a.id } }));
  const todos = [...secretos, ...a.codigosDeRecuperacion, CREDENCIAL_SINTETICA].filter((s) => s.length > 0).flatMap((s) => [s, s.replace(/[^0-9A-Za-z]/g, '')]);
  expect(todos.filter((s) => auditoria.includes(s)).length).toBe(0);
}

describe('Dos reemplazos del autenticador al mismo tiempo (pendiente 2 del §14, 2026-10-27)', () => {
  it('dos configuraciones empezadas a la vez desde dos sesiones: las dos responden, la segunda descarta el pendiente de la primera, y de las dos confirmaciones cruzadas gana una sola', async () => {
    const a = await administradorListo(app, prisma, etiqueta('dos-empiezan'));
    const otra = await otraSesion(app, a);
    const [s1, s2] = [sesionDelToken(a.token), sesionDelToken(otra)];
    const anterior = await activoDe(a.id);
    const [loteAnterior] = await lotesVigentes(a.id);

    // Un pendiente previo de la primera sesión (P0). Las dos configuraciones nuevas lo van a querer descartar: la prueba lo
    // retiene y las suelta cuando las dos esperan. Sin la corrección, las dos esperaban P0 con la identidad compartida, y
    // la segunda no veía el pendiente que la primera creaba después: chocaba con el índice único y respondía 500. Con la
    // corrección, la segunda espera la identidad que tomó la primera.
    expect((await empezar(a.token)).status).toBe(200);
    const p0 = (await prisma.factorTotp.findFirstOrThrow({ where: { identidadId: a.id, estado: 'PENDIENTE' }, select: { id: true } })).id;
    const [pe1, pe2] = await conLaFilaRetenida(prisma, { factorTotp: p0 }, async () => {
      const pe1 = empezar(a.token);
      await esperarQueEsperen(prisma, 1, { que: 'la primera configuración, esperando el pendiente anterior' });
      const pe2 = empezar(otra);
      await esperarQueEsperen(prisma, 2, { que: 'las dos configuraciones esperando' });
      return [pe1, pe2] as const;
    });
    const [e1, e2] = await Promise.all([pe1, pe2]);
    expect({ primera: e1.status, segunda: e2.status }).toEqual({ primera: 200, segunda: 200 });
    const [secreto1, secreto2] = [secretoDe(e1), secretoDe(e2)];
    // Queda un solo pendiente, el de la que empezó después; el anterior (P0) y el de la primera, descartados.
    const empezados = await autenticadores(a.id);
    const p1 = empezados.find((f) => f.sesion === s1 && f.id !== p0 && f.id !== anterior)!;
    const p2 = empezados.find((f) => f.sesion === s2)!;
    expect({ p0: empezados.find((f) => f.id === p0)?.estado, p1: p1.estado, p2: p2.estado, pendientes: empezados.filter((f) => f.estado === 'PENDIENTE').length }).toEqual({
      p0: 'DESCARTADO',
      p1: 'DESCARTADO',
      p2: 'PENDIENTE',
      pendientes: 1,
    });

    // Las dos confirman a la vez, cada una con un código de su autenticador nuevo: la prueba retiene la identidad y las
    // suelta juntas. Solo la segunda tiene un pendiente que confirmar.
    const [pc1, pc2] = await conLaFilaRetenida(prisma, { identidad: a.id }, async () => {
      const pc1 = confirmar(a.token, codigoTotp(secreto1));
      await esperarQueEsperen(prisma, 1, { que: 'la primera confirmación, esperando la identidad' });
      const pc2 = confirmar(otra, codigoTotp(secreto2));
      await esperarQueEsperen(prisma, 2, { que: 'las dos confirmaciones esperando la identidad' });
      return [pc1, pc2] as const;
    });
    const [c1, c2] = await Promise.all([pc1, pc2]);
    // La segunda confirma. La primera no recibe éxito ni códigos: según quién lea primero, ya no tiene pendiente (422) o
    // su sesión ya se cerró por el reemplazo de la otra (401). Las dos son respuestas del contrato.
    expect({ segunda: c2.status, codigos: codigosDe(c2).length }).toEqual({ segunda: 200, codigos: 10 });
    expect([401, 422]).toContain(c1.status);
    expect(codigosDe(c1)).toEqual([]);

    // Lo que queda: un activo (el de la segunda), el anterior reemplazado, ningún pendiente; un lote vigente, el nuevo; la
    // primera sesión cerrada con su motivo y la segunda, abierta.
    const fin = await autenticadores(a.id);
    expect({
      activos: fin.filter((f) => f.estado === 'ACTIVO').map((f) => f.id),
      anterior: fin.find((f) => f.id === anterior)?.estado,
      pendientes: fin.filter((f) => f.estado === 'PENDIENTE').length,
    }).toEqual({ activos: [p2.id], anterior: 'REEMPLAZADO', pendientes: 0 });
    const lotes = await lotesVigentes(a.id);
    expect({ lotes: lotes.length, codigos: lotes[0]?.codigos, esElAnterior: lotes[0]?.lote === loteAnterior?.lote }).toEqual({ lotes: 1, codigos: 10, esElAnterior: false });
    expect(await sesiones(s1, s2)).toEqual({ [s1]: { estado: 'REVOCADA', motivo: 'CREDENCIALES_ADMINISTRATIVAS_RENOVADAS' }, [s2]: { estado: 'ACTIVA', motivo: null } });

    // Auditoría: un solo reemplazo confirmado; el rechazo de la primera, registrado (sea el paso que ya no corresponde o la
    // sesión cerrada mientras esperaba); ningún secreto.
    const confirmados = await prisma.registroDeAuditoria.count({ where: { actorId: a.id, operacion: 'API-ADM-08', resultado: 'EXITO', motivo: 'AUTENTICADOR_REEMPLAZADO' } });
    const rechazoDeLaPrimera = await auditado('API-ADM-08', s1);
    expect({ confirmados, rechazos: rechazoDeLaPrimera.filter((x) => x.resultado === 'RECHAZO').length, exitosDeLaPrimera: rechazoDeLaPrimera.filter((x) => x.resultado === 'EXITO' && x.motivo === 'AUTENTICADOR_REEMPLAZADO').length }).toEqual({
      confirmados: 1,
      rechazos: 1,
      exitosDeLaPrimera: 0,
    });
    await sinSecretosEnLaAuditoria(a, [secreto1, secreto2, ...codigosDe(c2)]);

    // El autenticador nuevo sirve para entrar (con un código del paso siguiente); el que empezó la primera no se activó.
    const t3 = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
    await adm(app, t3).post('/admin/auth/sessions/current/second-factor').send({ code: codigoTotp(secreto2, 30_000) }).expect(200);
  });

  it.each([
    ['la confirmación primero', 'confirmacion'],
    ['la otra configuración primero', 'configuracion'],
  ] as const)('una confirmación y otra configuración desde otra sesión al mismo tiempo (%s): una espera a la otra y decide con lo que dejó', async (_nombre, primero) => {
    const a = await administradorListo(app, prisma, etiqueta(`cruce-${primero}`));
    const otra = await otraSesion(app, a);
    const [s1, s2] = [sesionDelToken(a.token), sesionDelToken(otra)];
    const anterior = await activoDe(a.id);
    const [loteAnterior] = await lotesVigentes(a.id);
    // La primera sesión empezó un reemplazo (P1); al mismo tiempo, confirma y la otra sesión empieza el suyo.
    const empezada = await empezar(a.token);
    expect(empezada.status).toBe(200);
    const secreto1 = secretoDe(empezada);
    const p1 = (await prisma.factorTotp.findFirstOrThrow({ where: { identidadId: a.id, estado: 'PENDIENTE' }, select: { id: true } })).id;
    // La prueba retiene la identidad y dispara en el orden pedido: el que queda esperando primero sigue primero. La
    // confirmación la toma en modo compartido y la configuración, en exclusivo: una termina antes de que la otra empiece.
    const { pk, ps } = await conLaFilaRetenida(prisma, { identidad: a.id }, async () => {
      if (primero === 'confirmacion') {
        const pk = confirmar(a.token, codigoTotp(secreto1));
        await esperarQueEsperen(prisma, 1, { que: 'la confirmación, esperando la identidad' });
        const ps = empezar(otra);
        await esperarQueEsperen(prisma, 2, { que: 'la confirmación y la configuración esperando la identidad' });
        return { pk, ps };
      }
      const ps = empezar(otra);
      await esperarQueEsperen(prisma, 1, { que: 'la configuración, esperando la identidad' });
      const pk = confirmar(a.token, codigoTotp(secreto1));
      await esperarQueEsperen(prisma, 2, { que: 'la configuración y la confirmación esperando la identidad' });
      return { pk, ps };
    });
    const [k, s] = await Promise.all([pk, ps]);
    const fin = await autenticadores(a.id);
    const lotes = await lotesVigentes(a.id);
    if (primero === 'confirmacion') {
      // El reemplazo de la primera se confirma y cierra la otra sesión; la configuración de la otra, que esperaba, encuentra
      // su sesión cerrada (401) y no crea nada. El rechazo queda auditado aunque su transacción se revirtió.
      expect({ confirmacion: k.status, configuracion: s.status, error: errorDe(s), secreto: secretoDe(s) }).toEqual({ confirmacion: 200, configuracion: 401, error: 'SESSION_REVOKED', secreto: '' });
      expect({ activos: fin.filter((f) => f.estado === 'ACTIVO').map((f) => f.id), anterior: fin.find((f) => f.id === anterior)?.estado, pendientes: fin.filter((f) => f.estado === 'PENDIENTE').length }).toEqual({
        activos: [p1],
        anterior: 'REEMPLAZADO',
        pendientes: 0,
      });
      expect({ lotes: lotes.length, esElAnterior: lotes[0]?.lote === loteAnterior?.lote }).toEqual({ lotes: 1, esElAnterior: false });
      expect(await sesiones(s1, s2)).toEqual({ [s1]: { estado: 'ACTIVA', motivo: null }, [s2]: { estado: 'REVOCADA', motivo: 'CREDENCIALES_ADMINISTRATIVAS_RENOVADAS' } });
      expect(await auditado('API-ADM-07', s2)).toEqual([{ resultado: 'RECHAZO', motivo: 'SESION_REVOCADA' }]);
      await sinSecretosEnLaAuditoria(a, [secreto1, ...codigosDe(k)]);
    } else {
      // La otra configuración empieza y descarta el pendiente de la primera; la confirmación, que esperaba, ya no tiene qué
      // confirmar (422) y no cambia nada: el autenticador anterior sigue activo y el lote anterior sigue valiendo.
      expect({ configuracion: s.status, confirmacion: k.status, error: errorDe(k), codigos: codigosDe(k).length }).toEqual({
        configuracion: 200,
        confirmacion: 422,
        error: 'INVALID_STATE_TRANSITION',
        codigos: 0,
      });
      expect({
        activos: fin.filter((f) => f.estado === 'ACTIVO').map((f) => f.id),
        p1: fin.find((f) => f.id === p1)?.estado,
        pendientes: fin.filter((f) => f.estado === 'PENDIENTE').map((f) => f.sesion),
      }).toEqual({ activos: [anterior], p1: 'DESCARTADO', pendientes: [s2] });
      expect({ lotes: lotes.length, esElAnterior: lotes[0]?.lote === loteAnterior?.lote }).toEqual({ lotes: 1, esElAnterior: true });
      expect(await sesiones(s1, s2)).toEqual({ [s1]: { estado: 'ACTIVA', motivo: null }, [s2]: { estado: 'ACTIVA', motivo: null } });
      // (La primera sesión ya tiene el éxito de su configuración inicial: se miran sus rechazos.)
      expect((await auditado('API-ADM-08', s1)).filter((x) => x.resultado === 'RECHAZO')).toEqual([{ resultado: 'RECHAZO', motivo: 'PASO_NO_PERMITIDO:SIN_CONFIGURACION_PENDIENTE' }]);
      await sinSecretosEnLaAuditoria(a, [secreto1, secretoDe(s)]);
    }
  });
});
