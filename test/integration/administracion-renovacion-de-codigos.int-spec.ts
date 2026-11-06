/**
 * Renovar los códigos de recuperación (API-ADM-09) con otras operaciones al mismo tiempo: la pasada de cierre del
 * 2026-10-25 (encargo de Dirección, punto 1). La hipótesis: el guard comprueba la sesión y el segundo factor antes de
 * entrar al servicio, y la transacción que invalida el lote anterior e inserta el nuevo no tomaba un bloqueo común ni
 * volvía a leer la sesión.
 *
 * Contra PostgreSQL real y sin pausas: una transacción de la prueba retiene una fila (la identidad o los códigos vigentes)
 * mientras llegan los pedidos, y la suelta recién cuando la base informa que quedaron esperando (`pg_stat_activity`). El
 * primero que queda esperando sigue primero: así cada prueba elige qué operación queda ordenada antes que la otra.
 *
 * Las garantías:
 *  1. como máximo queda un lote vigente;
 *  2. los códigos anteriores dejan de servir;
 *  3. una renovación ordenada después de una revocación (otra renovación que cerró su sesión, el restablecimiento o la
 *     retirada del operador, el cierre de la propia sesión) no emite códigos con la autorización de antes;
 *  4. si la renovación se confirma primero, el restablecimiento o la retirada posterior también invalidan ese lote;
 *  5. ningún código ni la contraseña quedan en la auditoría ni en la salida de la API;
 *  6. una renovación que encuentra su sesión revocada o cerrada dentro de la transacción responde 401 y ese rechazo queda
 *     en la auditoría, aunque la transacción se revierta (pendiente 3 del §14, 2026-10-27).
 * La barrera es la de `soporte-concurrencia.ts`, compartida con las demás pruebas de carrera de Administración.
 * Solo datos sintéticos (`example.invalid`). Los códigos viven en la memoria de la prueba y ninguna aserción los imprime:
 * se comparan estados y cantidades.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type request from 'supertest';
import { restablecerSegundoFactor, retirarAdministrador } from '../../apps/api/src/administracion/incorporacion';
import { appDePrueba, CREDENCIAL_SINTETICA } from './soporte-api';
import { adm, administradorListo, otraSesion, primerFactor, type Administrador } from './soporte-administracion';
import { conLaFilaRetenida as retener, esperarQueEsperen as esperar, type FilaRetenida } from './soporte-concurrencia';

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

// ─── La coordinación (la barrera por bloqueos, compartida en soporte-concurrencia.ts) ───────────

const esperarQueEsperen = (n: number, yaPaso?: () => boolean): Promise<void> => esperar(prisma, n, { yaPaso });
const conLaFilaRetenida = <T>(fila: FilaRetenida, mientras: () => Promise<T>): Promise<T> => retener(prisma, fila, () => mientras());

/**
 * Los rechazos que la renovación encontró dentro de su transacción (la sesión ya no valía), auditados después de revertirla
 * (pendiente 3 del §14): sus motivos, en orden. Y cuántas renovaciones confirmaron.
 */
async function renovacionesAuditadas(identidadId: string): Promise<{ exitos: number; rechazos: string[] }> {
  const filas = await prisma.registroDeAuditoria.findMany({ where: { actorId: identidadId, operacion: 'API-ADM-09' }, orderBy: { momentoDeRegistro: 'asc' }, select: { resultado: true, motivo: true } });
  return { exitos: filas.filter((f) => f.resultado === 'EXITO').length, rechazos: filas.filter((f) => f.resultado === 'RECHAZO').map((f) => f.motivo ?? '') };
}

/** Dispara el pedido ya (supertest es perezoso) y devuelve su promesa. */
const disparar = (t: request.Test): Promise<request.Response> => t.then((r) => r);
const renovar = (token: string) => disparar(adm(app, token).post('/admin/auth/recovery-codes').send({ credential: CREDENCIAL_SINTETICA }));
const cerrarLaSesion = (token: string) => disparar(adm(app, token).delete('/admin/auth/sessions/current'));
const codigosDe = (r: request.Response): string[] => (r.status === 200 ? (r.body.data.recoveryCodes as string[]) : []);
const errorDe = (r: request.Response): string | null => (r.body?.error?.code as string | undefined) ?? null;
const sesionDelToken = (token: string): string => JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString('utf8')).sid as string;
const estadoDeLaSesion = async (token: string) => (await prisma.sesion.findUnique({ where: { id: sesionDelToken(token) }, select: { estado: true } }))?.estado;

/** El comando del operador, con lo que devuelve reducido a «listo» (el código de incorporación no se imprime nunca). */
const comandos = [
  ['el restablecimiento del segundo factor', (correo: string) => restablecerSegundoFactor(prisma, { correo, fundamento: 'Perdió el autenticador (sintético)', operador: 'Prueba de concurrencia' })],
  ['la retirada del rol', (correo: string) => retirarAdministrador(prisma, { correo, fundamento: 'Deja de administrar (sintético)', operador: 'Prueba de concurrencia' })],
] as const;
const correr = (comando: (correo: string) => Promise<unknown>, correo: string): Promise<unknown> =>
  comando(correo).then(
    () => 'listo',
    (e: unknown) => (e instanceof Error ? e.message : String(e)),
  );

// ─── Lo que queda ───────────────────────────────────────────────────────────────────────────────

/** Los lotes vigentes (códigos sin usar ni invalidar) de la identidad y cuántos códigos suman. */
async function vigentes(identidadId: string): Promise<{ lotes: number; codigos: number }> {
  const filas = await prisma.codigoDeRecuperacion.groupBy({ by: ['loteId'], where: { identidadId, momentoDeUso: null, momentoDeInvalidacion: null }, _count: { _all: true } });
  return { lotes: filas.length, codigos: filas.reduce((s, f) => s + f._count._all, 0) };
}

/** Si un código de recuperación abre una sesión nueva (la contraseña y el código). Si sirve, queda usado. */
async function sirve(a: Administrador, codigo: string | undefined): Promise<boolean> {
  if (!codigo) return false;
  const t = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
  const r = await adm(app, t).post('/admin/auth/sessions/current/recovery-code').send({ recoveryCode: codigo });
  if (r.status !== 200 && r.status !== 422) throw new Error(`respuesta inesperada al probar un código: ${r.status}`);
  return r.status === 200;
}

describe('Renovar los códigos de recuperación en concurrencia (pasada de cierre del 2026-10-25)', () => {
  it('dos renovaciones simultáneas desde dos sesiones: queda un lote; la segunda, ordenada después de que la primera cerró su sesión, no emite códigos', async () => {
    const a = await administradorListo(app, prisma, etiqueta('dos-sesiones'));
    const otra = await otraSesion(app, a);
    // La salida de la API durante la carrera, para comprobar al final que ningún código pasó por ella.
    const salida = [jest.spyOn(process.stdout, 'write'), jest.spyOn(process.stderr, 'write')];
    try {
      const [p1, p2] = await conLaFilaRetenida({ identidad: a.id }, async () => {
        const p1 = renovar(a.token);
        await esperarQueEsperen(1);
        const p2 = renovar(otra);
        await esperarQueEsperen(2);
        return [p1, p2] as const;
      });
      const [r1, r2] = await Promise.all([p1, p2]);
      expect({ primera: r1.status, segunda: r2.status, error: errorDe(r2), ...(await vigentes(a.id)) }).toEqual({ primera: 200, segunda: 401, error: 'SESSION_REVOKED', lotes: 1, codigos: 10 });
      // La segunda encontró su sesión revocada dentro de la transacción: el rechazo quedó auditado igual (pendiente 3 del §14).
      expect(await renovacionesAuditadas(a.id)).toEqual({ exitos: 1, rechazos: ['SESION_REVOCADA'] });
      // Los códigos anteriores ya no sirven; los nuevos, sí.
      expect({ anterior: await sirve(a, a.codigosDeRecuperacion[0]), nuevo: await sirve(a, codigosDe(r1)[0]) }).toEqual({ anterior: false, nuevo: true });
      // Ningún código (con o sin guiones) ni la contraseña quedaron en la auditoría ni en la salida de la API.
      const secretos = [...a.codigosDeRecuperacion, ...codigosDe(r1), ...codigosDe(r2)].flatMap((c) => [c, c.replace(/[^0-9A-Za-z]/g, '')]).concat(CREDENCIAL_SINTETICA);
      const auditoria = JSON.stringify(await prisma.registroDeAuditoria.findMany({ where: { actorId: a.id } }));
      const texto = salida.flatMap((s) => s.mock.calls.map((c) => String(c[0]))).join('');
      expect(secretos.filter((s) => auditoria.includes(s) || texto.includes(s)).length).toBe(0);
    } finally {
      for (const s of salida) s.mockRestore();
    }
  });

  it('dos renovaciones simultáneas desde la misma sesión: la segunda reemplaza a la primera; queda un lote y los códigos de la primera ya no sirven', async () => {
    const a = await administradorListo(app, prisma, etiqueta('misma-sesion'));
    const [p1, p2] = await conLaFilaRetenida({ identidad: a.id }, async () => {
      const p1 = renovar(a.token);
      await esperarQueEsperen(1);
      const p2 = renovar(a.token);
      await esperarQueEsperen(2);
      return [p1, p2] as const;
    });
    const [r1, r2] = await Promise.all([p1, p2]);
    expect({ primera: r1.status, segunda: r2.status, ...(await vigentes(a.id)) }).toEqual({ primera: 200, segunda: 200, lotes: 1, codigos: 10 });
    expect(await renovacionesAuditadas(a.id)).toEqual({ exitos: 2, rechazos: [] });
    expect({
      anterior: await sirve(a, a.codigosDeRecuperacion[0]),
      deLaPrimera: await sirve(a, codigosDe(r1)[0]),
      deLaSegunda: await sirve(a, codigosDe(r2)[0]),
    }).toEqual({ anterior: false, deLaPrimera: false, deLaSegunda: true });
  });

  it.each(comandos)('%s primero: la renovación que ya pasó el guard espera y, con la sesión revocada, no emite códigos', async (_nombre, comando) => {
    const a = await administradorListo(app, prisma, etiqueta('operador-primero'));
    const [pc, pr] = await conLaFilaRetenida({ identidad: a.id }, async () => {
      const pc = correr(comando, a.correo);
      await esperarQueEsperen(1);
      const pr = renovar(a.token);
      await esperarQueEsperen(2);
      return [pc, pr] as const;
    });
    const [c, r] = await Promise.all([pc, pr]);
    expect({ comando: c, renovacion: r.status, error: errorDe(r), sesion: await estadoDeLaSesion(a.token), ...(await vigentes(a.id)) }).toEqual({
      comando: 'listo',
      renovacion: 401,
      error: 'SESSION_REVOKED',
      sesion: 'REVOCADA',
      lotes: 0,
      codigos: 0,
    });
    // El 401 salió de la transacción, con la sesión ya revocada por el comando: queda en la auditoría, sin un éxito.
    expect(await renovacionesAuditadas(a.id)).toEqual({ exitos: 0, rechazos: ['SESION_REVOCADA'] });
  });

  it.each(comandos)('la renovación primero: %s espera y después invalida también el lote nuevo', async (_nombre, comando) => {
    const a = await administradorListo(app, prisma, etiqueta('renovacion-primero'));
    // Otra sesión del mismo administrador: la renovación la cierra, y la prueba retiene esa fila. Así la renovación queda
    // a mitad de camino, con el lote nuevo ya insertado y sin confirmar, mientras llega el comando.
    const otra = await otraSesion(app, a);
    const [pr, pc] = await conLaFilaRetenida({ sesion: sesionDelToken(otra) }, async () => {
      const pr = renovar(a.token);
      await esperarQueEsperen(1);
      const pc = correr(comando, a.correo);
      await esperarQueEsperen(2);
      return [pr, pc] as const;
    });
    const [r, c] = await Promise.all([pr, pc]);
    expect({ renovacion: r.status, comando: c, sesion: await estadoDeLaSesion(a.token), otra: await estadoDeLaSesion(otra), ...(await vigentes(a.id)) }).toEqual({
      renovacion: 200,
      comando: 'listo',
      sesion: 'REVOCADA',
      otra: 'REVOCADA',
      lotes: 0,
      codigos: 0,
    });
  });

  it('el cierre de la propia sesión primero: la renovación que ya pasó el guard no emite códigos y el lote de antes sigue valiendo', async () => {
    const a = await administradorListo(app, prisma, etiqueta('cierre-primero'));
    let cerro = false;
    const [pr, pc, cerroAntes] = await conLaFilaRetenida({ identidad: a.id }, async () => {
      const pr = renovar(a.token);
      await esperarQueEsperen(1);
      // El cierre no tiene por qué esperar: la renovación, frenada en la identidad, todavía no tomó nada de la sesión.
      const pc = cerrarLaSesion(a.token).then((x) => {
        cerro = true;
        return x;
      });
      await esperarQueEsperen(2, () => cerro);
      return [pr, pc, cerro] as const;
    });
    const [r, cierre] = await Promise.all([pr, pc]);
    expect({ cierreTerminoAntes: cerroAntes, cierre: cierre.status, renovacion: r.status, error: errorDe(r), ...(await vigentes(a.id)) }).toEqual({
      cierreTerminoAntes: true,
      cierre: 204,
      renovacion: 401,
      error: 'SESSION_REVOKED',
      lotes: 1,
      codigos: 10,
    });
    expect(await sirve(a, a.codigosDeRecuperacion[0])).toBe(true);
    expect(await renovacionesAuditadas(a.id)).toEqual({ exitos: 0, rechazos: ['SESION_FINALIZADA'] });
  });

  it('la renovación primero: el cierre de la sesión espera a que confirme, y los códigos nuevos siguen valiendo', async () => {
    const a = await administradorListo(app, prisma, etiqueta('renovacion-y-cierre'));
    let cerro = false;
    const [pr, pc, cerroAntes] = await conLaFilaRetenida({ codigosDe: a.id }, async () => {
      const pr = renovar(a.token);
      await esperarQueEsperen(1);
      const pc = cerrarLaSesion(a.token).then((x) => {
        cerro = true;
        return x;
      });
      // O el cierre queda esperando detrás de la renovación, o (si nada lo ordena) termina antes: las dos cosas se ven.
      await esperarQueEsperen(2, () => cerro);
      return [pr, pc, cerro] as const;
    });
    const [r, c] = await Promise.all([pr, pc]);
    expect({ cierreEsperoALaRenovacion: !cerroAntes, renovacion: r.status, cierre: c.status, sesion: await estadoDeLaSesion(a.token), ...(await vigentes(a.id)) }).toEqual({
      cierreEsperoALaRenovacion: true,
      renovacion: 200,
      cierre: 204,
      sesion: 'FINALIZADA',
      lotes: 1,
      codigos: 10,
    });
    expect(await sirve(a, codigosDe(r)[0])).toBe(true);
  });
});
