/**
 * WP-INVITACION (DEUDA_LEGAJO DL-136) · API-INV-01 a 05 contra PostgreSQL real.
 * 06 §7.4 (REG-06-46, INV-06-55, INV-06-56) · 05 UC-P04 V04 y UC-P05 V01 · 08 §24.3 y §24.5 · REL-01 (09v8:1108-1192).
 * Un solo uso, vencimiento, anulación, el mismo 404 sin oráculo, límite de intentos, dos usos simultáneos, y la cadena
 * completa: usar → aceptar (REL-03) → B2 (CON-02) → el profesional ve el vínculo.
 */
import type { INestApplication } from '@nestjs/common';
import {
  BYTES_DEL_CODIGO,
  CrearSolicitudDeVinculoResponseSchema,
  FINALIDAD_DE_ALCANCE,
  InvitacionCreadaResponseSchema,
  ListaDeInvitacionesResponseSchema,
  ListaDeVinculosResponseSchema,
  VistaPreviaDeInvitacionResponseSchema,
  codigoDesdeBytes,
  formatearCodigo,
  type Alcance,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomBytes, randomUUID } from 'node:crypto';
import request from 'supertest';
import { huellaDeSecretoDeInvitacion } from '../../apps/api/src/vinculo/invitaciones.service';
import { appDePrueba, claveDeIdempotencia, conSesion, entornoDePrueba, resumenDeRespuestas, simultaneos, transicionPorServicio } from './soporte-api';
import { aceptar, consentir, dashboard, prepararAsesorado, prepararProfesional, solicitar, vinculoCompleto, type Parte } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

type Secreto = { token: string } | { code: string };
/** La misma huella con clave que guarda la API, con el secreto de firma del entorno de prueba. */
const huella = (secreto: string): string => huellaDeSecretoDeInvitacion(entornoDePrueba().jwtSecret, secreto);

function invitar(a: INestApplication, pro: Parte, alcance: Alcance = 'NUTRICION', clave = claveDeIdempotencia()) {
  return conSesion(a, pro.token).post('/api/v1/relationship-invitations', clave).send({ scope: { code: alcance }, purpose: FINALIDAD_DE_ALCANCE[alcance] });
}

/** API-INV-01 con 201, ya validada contra su schema. */
async function invitacion(a: INestApplication, pro: Parte, alcance: Alcance = 'NUTRICION') {
  return InvitacionCreadaResponseSchema.parse((await invitar(a, pro, alcance).expect(201)).body).data;
}

/** API-INV-04: una lectura, sin Idempotency-Key. */
function ver(a: INestApplication, parte: Parte, secreto: Secreto) {
  return request(a.getHttpServer()).post('/api/v1/relationship-invitations/preview').set('Authorization', `Bearer ${parte.token}`).send(secreto);
}

function usar(a: INestApplication, parte: Parte, secreto: Secreto, clave = claveDeIdempotencia()) {
  return conSesion(a, parte.token).post('/api/v1/relationship-invitations/claim', clave).send(secreto);
}

function anular(a: INestApplication, pro: Parte, invitacionId: string, clave = claveDeIdempotencia()) {
  return conSesion(a, pro.token).post(`/api/v1/relationship-invitations/${invitacionId}/revoke`, clave).send({});
}

async function listar(a: INestApplication, pro: Parte, query = '') {
  return ListaDeInvitacionesResponseSchema.parse((await conSesion(a, pro.token).get(`/api/v1/relationship-invitations${query}`).expect(200)).body);
}

/**
 * Una invitación que venció hace un día, escrita directo en la base: la tabla solo admite agregar, así que no se la puede
 * «envejecer». Respeta los CHECK (7 días de vigencia como máximo) y el trigger (quien invita tiene perfil profesional).
 */
async function invitacionVencida(pro: Parte, alcance: Alcance = 'NUTRICION'): Promise<{ id: string; token: string; code: string }> {
  const id = randomUUID();
  const token = randomBytes(32).toString('base64url');
  const codigo = codigoDesdeBytes(randomBytes(BYTES_DEL_CODIGO));
  await prisma.$executeRaw`
    INSERT INTO "invitacion_de_vinculo" ("id", "profesional_id", "alcance", "finalidad", "hash_del_token", "hash_del_codigo", "procedencia", "momento_de_ocurrencia", "vence_en")
    VALUES (${id}::uuid, ${pro.id}::uuid, ${alcance}::"Alcance", ${FINALIDAD_DE_ALCANCE[alcance]}::"Finalidad", ${huella(token)}, ${huella(codigo)},
            '{"fuente":"PROPIA","casoDeUso":"PRUEBA","operacion":"INVITACION_VENCIDA","superficie":null,"requestId":null}'::jsonb,
            now() - interval '8 days', now() - interval '1 day')`;
  return { id, token, code: formatearCodigo(codigo) };
}

describe('API-INV-01 y 02 — el profesional invita y ve sus invitaciones', () => {
  it('crea una invitación pendiente por 7 días; el token y el código salen solo en la respuesta, y la base guarda su huella con clave', async () => {
    const pro = await prepararProfesional(app, 'inv-crear', ['NUTRICION']);
    const clave = claveDeIdempotencia();
    const r = InvitacionCreadaResponseSchema.parse((await invitar(app, pro, 'NUTRICION', clave).expect(201)).body).data;
    expect(r).toMatchObject({ scope: { code: 'NUTRICION', label: 'Nutrición' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL', state: 'PENDING', usedAt: null, revokedAt: null, relationshipRequestId: null });
    expect(new Date(r.expiresAt).getTime() - new Date(r.createdAt).getTime()).toBe(7 * 24 * 60 * 60 * 1000);

    // Solo el hash, en la invitación y en ningún otro lado: ni en la fila, ni en el registro de idempotencia, ni en la auditoría.
    const fila = await prisma.invitacionDeVinculo.findUniqueOrThrow({ where: { id: r.invitationId } });
    expect(fila.hashDelToken).toBe(huella(r.token));
    expect(fila.hashDelCodigo).toBe(huella(r.code.replace('-', '')));
    const codigo = r.code.replace('-', '');
    const [texto] = await prisma.$queryRaw<{ fila: string; idempotencia: string; auditoria: string }[]>`
      SELECT (SELECT row_to_json(i)::text FROM "invitacion_de_vinculo" i WHERE i."id" = ${r.invitationId}::uuid) AS "fila",
             (SELECT string_agg(ri."cuerpo"::text || ri."huella", '|') FROM "registro_de_idempotencia" ri WHERE ri."ambito" = ${pro.id}) AS "idempotencia",
             (SELECT string_agg(row_to_json(a)::text, '|') FROM "registro_de_auditoria" a WHERE a."actor_id" = ${pro.id}::uuid) AS "auditoria"`;
    for (const t of [texto.fila, texto.idempotencia, texto.auditoria]) {
      expect(t).not.toContain(r.token);
      expect(t).not.toContain(codigo);
      expect(t).not.toContain(r.code);
    }
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-INV-01', resultado: 'EXITO', recursoId: r.invitationId } })).toBe(1);

    // El reintento con la misma clave responde lo mismo: BE vuelve a calcular el token y el código, que no guardó.
    const otraVez = await invitar(app, pro, 'NUTRICION', clave).expect(201);
    expect(otraVez.body).toEqual({ data: r });
    expect(await prisma.invitacionDeVinculo.count({ where: { profesionalId: pro.id } })).toBe(1);
    // La misma clave con otro pedido: 409.
    const reusada = await invitar(app, pro, 'ENTRENAMIENTO', clave).expect(409);
    expect(reusada.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');

    // API-INV-02: la ve sin el token ni el código.
    const lista = await listar(app, pro);
    expect(lista.data).toEqual([{ invitationId: r.invitationId, scope: r.scope, purpose: r.purpose, state: 'PENDING', createdAt: r.createdAt, expiresAt: r.expiresAt, usedAt: null, revokedAt: null, relationshipRequestId: null }]);
    expect(JSON.stringify(lista)).not.toContain(r.token);
  });

  it('invita solo quien está verificado y habilitado en ese alcance; el alcance y la finalidad, con las reglas de REL-01', async () => {
    const pro = await prepararProfesional(app, 'inv-reglas', ['NUTRICION']);
    const ase = await prepararAsesorado(app, 'inv-reglas');
    const post = (parte: Parte, cuerpo: object) => conSesion(app, parte.token).post('/api/v1/relationship-invitations').send(cuerpo);
    const codigo = async (p: PromiseLike<request.Response>) => {
      const r = await p;
      return `${r.status} ${r.body?.error?.code ?? ''}`.trim();
    };
    expect(await codigo(invitar(app, pro, 'ENTRENAMIENTO'))).toBe('422 SCOPE_NOT_AVAILABLE'); // no verificado en ese alcance
    expect(await codigo(invitar(app, ase, 'NUTRICION'))).toBe('422 SCOPE_NOT_AVAILABLE'); // sin perfil profesional
    expect(await codigo(post(pro, { scope: { code: 'PSICOLOGIA' }, purpose: 'x' }))).toBe('422 SCOPE_NOT_AVAILABLE');
    expect(await codigo(post(pro, { scope: { code: 'NUTRICION' }, purpose: ' ' }))).toBe('422 PURPOSE_REQUIRED');
    expect(await codigo(post(pro, { scope: { code: 'NUTRICION' }, purpose: 'PLANIFICACION_DEL_ENTRENAMIENTO' }))).toBe('422 VALIDATION_FAILED');
    expect(await codigo(post(pro, { scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL', advisee: ase.id }))).toBe('400 UNKNOWN_FIELD');
    const sinClave = await request(app.getHttpServer()).post('/api/v1/relationship-invitations').set('Authorization', `Bearer ${pro.token}`).send({ scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' });
    expect(sinClave.status).toBe(400);
    await request(app.getHttpServer()).post('/api/v1/relationship-invitations').set('Idempotency-Key', claveDeIdempotencia()).send({}).expect(401);
    expect(await prisma.invitacionDeVinculo.count({ where: { profesionalId: { in: [pro.id, ase.id] } } })).toBe(0);
  });

  it('API-INV-02: solo las propias, de la más nueva a la más vieja, por páginas y con el estado derivado como filtro', async () => {
    const pro = await prepararProfesional(app, 'inv-lista', ['NUTRICION', 'ENTRENAMIENTO']);
    const otro = await prepararProfesional(app, 'inv-lista-otro', ['NUTRICION']);
    const ase = await prepararAsesorado(app, 'inv-lista');
    const pendiente = await invitacion(app, pro, 'NUTRICION');
    const anulada = await invitacion(app, pro, 'ENTRENAMIENTO');
    const usada = await invitacion(app, pro, 'NUTRICION');
    const vencida = await invitacionVencida(pro);
    const ajena = await invitacion(app, otro);
    await anular(app, pro, anulada.invitationId).expect(200);
    const uso = await usar(app, ase, { token: usada.token }).expect(201);

    const todas = await listar(app, pro);
    expect(todas.data.map((i) => i.invitationId)).not.toContain(ajena.invitationId);
    const porId = new Map(todas.data.map((i) => [i.invitationId, i]));
    expect(porId.get(pendiente.invitationId)?.state).toBe('PENDING');
    expect(porId.get(anulada.invitationId)).toMatchObject({ state: 'REVOKED', usedAt: null, relationshipRequestId: null });
    expect(porId.get(anulada.invitationId)?.revokedAt).not.toBeNull();
    expect(porId.get(usada.invitationId)).toMatchObject({ state: 'USED', revokedAt: null, relationshipRequestId: uso.body.data.relationshipRequestId });
    expect(porId.get(usada.invitationId)?.usedAt).not.toBeNull();
    expect(porId.get(vencida.id)?.state).toBe('EXPIRED');
    // De la más nueva a la más vieja (la vencida se registró última, aunque «ocurrió» antes).
    expect(todas.data.map((i) => i.invitationId)).toEqual([vencida.id, usada.invitationId, anulada.invitationId, pendiente.invitationId]);

    for (const [estado, id] of [['PENDING', pendiente.invitationId], ['REVOKED', anulada.invitationId], ['USED', usada.invitationId], ['EXPIRED', vencida.id]] as const) {
      expect((await listar(app, pro, `?state=${estado}`)).data.map((i) => i.invitationId)).toEqual([id]);
    }
    const primera = await listar(app, pro, '?limit=3');
    expect(primera.page.hasMore).toBe(true);
    const segunda = await listar(app, pro, `?limit=3&cursor=${encodeURIComponent(primera.page.nextCursor as string)}`);
    expect([...primera.data, ...segunda.data].map((i) => i.invitationId)).toEqual(todas.data.map((i) => i.invitationId));
    expect(segunda.page.hasMore).toBe(false);
    await conSesion(app, pro.token).get('/api/v1/relationship-invitations?state=CADUCADA').expect(400);
    await conSesion(app, pro.token).get('/api/v1/relationship-invitations?cursor=basura').expect(400);
    await conSesion(app, pro.token).get('/api/v1/relationship-invitations?orden=asc').expect(400);
  });
});

describe('API-INV-04 — ver una invitación antes de decidir', () => {
  it('con el token o con el código (con o sin guion, en minúsculas): quién invita, el área, la finalidad, el vencimiento y el estado; nada más', async () => {
    const pro = await prepararProfesional(app, 'inv-ver', ['ENTRENAMIENTO']);
    const ase = await prepararAsesorado(app, 'inv-ver');
    const inv = await invitacion(app, pro, 'ENTRENAMIENTO');
    const esperado = {
      data: {
        professional: { displayName: 'Profesional sintético inv-ver' },
        scope: { code: 'ENTRENAMIENTO', label: 'Entrenamiento' },
        purpose: 'PLANIFICACION_DEL_ENTRENAMIENTO',
        expiresAt: inv.expiresAt,
        state: 'PENDING',
      },
    };
    for (const secreto of [{ token: inv.token }, { code: inv.code }, { code: inv.code.toLowerCase().replace('-', '') }, { code: ` ${inv.code.replace('-', ' ')} ` }]) {
      const r = await ver(app, ase, secreto).expect(200);
      expect(VistaPreviaDeInvitacionResponseSchema.parse(r.body)).toEqual(esperado);
    }
    // Ver no la usa ni crea nada.
    expect(await prisma.resolucionDeInvitacion.count({ where: { invitacionId: inv.invitationId } })).toBe(0);
    expect(await prisma.solicitudDeVinculo.count({ where: { profesionalId: pro.id } })).toBe(0);
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-INV-04', resultado: 'EXITO', recursoId: inv.invitationId, actorId: ase.id } })).toBe(4);
    await request(app.getHttpServer()).post('/api/v1/relationship-invitations/preview').send({ token: inv.token }).expect(401);
    await ver(app, ase, { token: inv.token, code: inv.code } as unknown as Secreto).expect(400);
    await ver(app, ase, {} as Secreto).expect(400);
  });

  it('sin oráculo: una que no existe, un token o un código mal escritos, o un profesional que ya no está disponible responden el mismo 404', async () => {
    const pro = await prepararProfesional(app, 'inv-404', ['NUTRICION']);
    const ase = await prepararAsesorado(app, 'inv-404');
    const inv = await invitacion(app, pro);
    const desconocida = await ver(app, ase, { token: randomBytes(32).toString('base64url') }).expect(404);
    expect(desconocida.body).toEqual({ error: { code: 'RESOURCE_NOT_FOUND', message: 'Recurso no encontrado.' } });
    const malEscritos: Secreto[] = [
      { token: 'no-es-un-token' },
      { token: `${inv.token}x` },
      { code: 'ABCD-EFG' },
      { code: 'ABCD-EFG0' },
      { code: 'ABCD-EFGI' },
      { code: formatearCodigo(codigoDesdeBytes(randomBytes(BYTES_DEL_CODIGO))) },
    ];
    for (const secreto of malEscritos) expect((await ver(app, ase, secreto).expect(404)).body).toEqual(desconocida.body);
    for (const secreto of malEscritos) expect((await usar(app, ase, secreto).expect(404)).body).toEqual(desconocida.body);

    // El profesional suspendido: su invitación no se ve ni se usa, con el mismo 404; restablecido, vuelve a servir.
    await transicionPorServicio(app, pro.id, 'SuspenderCuenta');
    expect((await ver(app, ase, { token: inv.token }).expect(404)).body).toEqual(desconocida.body);
    expect((await usar(app, ase, { code: inv.code }).expect(404)).body).toEqual(desconocida.body);
    await transicionPorServicio(app, pro.id, 'RestablecerCuenta');
    await ver(app, ase, { token: inv.token }).expect(200);
    // El motivo real queda solo en la auditoría.
    const motivos = await prisma.registroDeAuditoria.findMany({ where: { operacion: 'API-INV-04', resultado: 'RECHAZO', actorId: ase.id }, select: { motivo: true } });
    expect(new Set(motivos.map((m) => m.motivo))).toEqual(new Set(['INVITACION_DESCONOCIDA', 'PROFESIONAL_NO_DISPONIBLE']));
  });

  it('límite de intentos por cuenta, desde cualquier red: el 429 llega igual exista o no la invitación; otra cuenta no se frena', async () => {
    const limitada = await appDePrueba({ limites: { ...entornoDePrueba().limites, invitacion: { maximo: 3, ventanaMs: 60_000 } } });
    try {
      const pro = await prepararProfesional(limitada, 'inv-limite', ['NUTRICION']);
      const ase = await prepararAsesorado(limitada, 'inv-limite');
      const otra = await prepararAsesorado(limitada, 'inv-limite-otra');
      const inv = await invitacion(limitada, pro);
      await ver(limitada, ase, { token: inv.token }).expect(200);
      await ver(limitada, ase, { code: 'ABCD-EFGH' }).expect(404);
      await usar(limitada, ase, { code: 'ABCD-EFGH' }).expect(404);
      const conLaBuena = await ver(limitada, ase, { token: inv.token }).expect(429);
      const conUnaMala = await usar(limitada, ase, { code: 'ABCD-EFGH' }).expect(429);
      expect(conLaBuena.body).toEqual({ error: { code: 'RATE_LIMITED', message: 'Demasiados intentos. Probá de nuevo más tarde.' } });
      expect(conUnaMala.body).toEqual(conLaBuena.body);
      await usar(limitada, otra, { token: inv.token }).expect(201);
    } finally {
      await limitada.close();
    }
  });
});

describe('API-INV-05 — usar la invitación', () => {
  it('la cadena completa: usarla crea la solicitud del profesional para quien la usa (como REL-01) → aceptar → B2 → el profesional ve el vínculo', async () => {
    const pro = await prepararProfesional(app, 'inv-cadena', ['NUTRICION']);
    const ase = await prepararAsesorado(app, 'inv-cadena', { a3: true });
    const inv = await invitacion(app, pro);
    const r = await usar(app, ase, { token: inv.token }).expect(201);
    const solicitud = CrearSolicitudDeVinculoResponseSchema.parse(r.body).data;
    expect(solicitud).toMatchObject({
      state: 'PENDIENTE',
      version: 'v1',
      initiatedBy: 'PROFESSIONAL',
      scope: { code: 'NUTRICION', label: 'Nutrición' },
      purpose: 'ACOMPANAMIENTO_NUTRICIONAL',
      professional: { identityId: pro.id, displayName: 'Profesional sintético inv-cadena' },
      advisee: { identityId: ase.id },
    });

    // Los hechos: la solicitud del profesional (su propuesta, con la procedencia del uso), la resolución de quien la usó y
    // la auditoría. Ningún vínculo, ni B2, ni acceso (REG-06-46; INV-06-55; INV-06-56).
    const fila = await prisma.solicitudDeVinculo.findUniqueOrThrow({ where: { id: solicitud.relationshipRequestId } });
    expect(fila).toMatchObject({ profesionalId: pro.id, asesoradoId: ase.id, iniciador: 'PROFESIONAL', estado: 'PENDIENTE' });
    expect((fila.procedencia as { operacion: string }).operacion).toBe('API-INV-05');
    const eventos = await prisma.eventoDeVinculo.findMany({ where: { solicitudDeVinculoId: solicitud.relationshipRequestId } });
    expect(eventos.map((e) => [e.tipo, e.estadoPosterior, e.actorId])).toEqual([['SolicitudDeVinculoCreada', 'PENDIENTE', pro.id]]);
    expect(await prisma.resolucionDeInvitacion.findUniqueOrThrow({ where: { invitacionId: inv.invitationId } })).toMatchObject({
      tipo: 'USADA',
      actorId: ase.id,
      solicitudDeVinculoId: solicitud.relationshipRequestId,
    });
    expect(await prisma.vinculo.count({ where: { profesionalId: pro.id, asesoradoId: ase.id } })).toBe(0);
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-INV-05', resultado: 'EXITO', recursoId: inv.invitationId, actorId: ase.id } })).toBe(1);
    // Quien la usó no recibe la novedad «solicitud recibida» de algo que acaba de hacer.
    expect(await prisma.novedad.count({ where: { destinatarioId: ase.id, referenciaId: solicitud.relationshipRequestId } })).toBe(0);
    // El profesional no ve todavía nada de la persona: la solicitud pendiente, con la referencia neutral (DL-040).
    await dashboard(app, pro, ase.id).expect(404);
    expect((await ver(app, ase, { token: inv.token }).expect(200)).body.data.state).toBe('USED');

    // Los actos explícitos de siempre: aceptar la solicitud (REL-03) y otorgar B2 (CON-01/02).
    const aceptada = await aceptar(app, ase, solicitud.relationshipRequestId).expect(200);
    const vinculoId = aceptada.body.data.relationshipId as string;
    expect(aceptada.body.data).toMatchObject({ relationshipState: 'ACEPTADO', consentRequired: true, accessMode: 'BLOCKED_PENDING_AUTHORIZATION' });
    await consentir(app, ase, vinculoId);
    const vinculos = ListaDeVinculosResponseSchema.parse((await conSesion(app, pro.token).get('/api/v1/me/relationships').expect(200)).body);
    expect(vinculos.data.find((v) => v.relationshipId === vinculoId)).toMatchObject({
      advisee: { identityId: ase.id },
      relationshipState: 'ACEPTADO',
      consentState: 'ACTIVE',
      accessMode: 'CONTEXTUAL',
    });
    await dashboard(app, pro, ase.id).expect(200);
  });

  it('es de un solo uso: el segundo uso, de otra persona o de la misma con otra clave, es 422 INVITATION_USED; el reintento con la misma clave responde lo mismo', async () => {
    const pro = await prepararProfesional(app, 'inv-un-uso', ['NUTRICION']);
    const a1 = await prepararAsesorado(app, 'inv-un-uso-1');
    const a2 = await prepararAsesorado(app, 'inv-un-uso-2');
    const inv = await invitacion(app, pro);
    const clave = claveDeIdempotencia();
    const primero = await usar(app, a1, { code: inv.code }, clave).expect(201);
    const otraPersona = await usar(app, a2, { token: inv.token }).expect(422);
    expect(otraPersona.body).toEqual({ error: { code: 'INVITATION_USED', message: 'La invitación ya se usó: es de un solo uso.' } });
    expect((await usar(app, a1, { token: inv.token }).expect(422)).body.error.code).toBe('INVITATION_USED');
    expect((await usar(app, a1, { code: inv.code }, clave).expect(201)).body).toEqual(primero.body);
    expect(await prisma.solicitudDeVinculo.count({ where: { profesionalId: pro.id } })).toBe(1);
    // Anular una usada tampoco se puede.
    expect((await anular(app, pro, inv.invitationId).expect(422)).body.error.code).toBe('INVITATION_USED');
  });

  it('vencida: se ve como EXPIRED; usarla o anularla es 422 INVITATION_EXPIRED; la base no admite resolverla', async () => {
    const pro = await prepararProfesional(app, 'inv-vencida', ['NUTRICION']);
    const ase = await prepararAsesorado(app, 'inv-vencida');
    const vencida = await invitacionVencida(pro);
    expect((await ver(app, ase, { code: vencida.code }).expect(200)).body.data.state).toBe('EXPIRED');
    const uso = await usar(app, ase, { token: vencida.token }).expect(422);
    expect(uso.body).toEqual({ error: { code: 'INVITATION_EXPIRED', message: 'La invitación venció. Pedile al profesional una nueva.' } });
    expect((await anular(app, pro, vencida.id).expect(422)).body.error.code).toBe('INVITATION_EXPIRED');
    expect(await prisma.solicitudDeVinculo.count({ where: { profesionalId: pro.id } })).toBe(0);
    await expect(
      prisma.$executeRaw`
        INSERT INTO "resolucion_de_invitacion" ("invitacion_id", "tipo", "actor_id", "procedencia", "momento_de_ocurrencia")
        VALUES (${vencida.id}::uuid, 'REVOCADA', ${pro.id}::uuid, '{}'::jsonb, now())`,
    ).rejects.toThrow(/mientras está vigente/);
  });

  it('anulada: el profesional la anula y nadie la usa (422 INVITATION_REVOKED); una ajena o inexistente es el mismo 404', async () => {
    const pro = await prepararProfesional(app, 'inv-anular', ['NUTRICION']);
    const otro = await prepararProfesional(app, 'inv-anular-otro', ['NUTRICION']);
    const ase = await prepararAsesorado(app, 'inv-anular');
    const inv = await invitacion(app, pro);
    const ajena = await anular(app, otro, inv.invitationId).expect(404);
    expect((await anular(app, pro, randomUUID()).expect(404)).body).toEqual(ajena.body);
    expect((await anular(app, pro, 'no-es-un-uuid').expect(404)).body).toEqual(ajena.body);
    await conSesion(app, pro.token).post(`/api/v1/relationship-invitations/${inv.invitationId}/revoke`).send({ motivo: 'x' }).expect(400);

    const clave = claveDeIdempotencia();
    const anulada = await anular(app, pro, inv.invitationId, clave).expect(200);
    expect(anulada.body.data).toMatchObject({ invitationId: inv.invitationId, state: 'REVOKED', usedAt: null, relationshipRequestId: null });
    expect(JSON.stringify(anulada.body)).not.toContain(inv.token);
    expect((await anular(app, pro, inv.invitationId, clave).expect(200)).body).toEqual(anulada.body);
    expect((await anular(app, pro, inv.invitationId).expect(422)).body.error.code).toBe('INVITATION_REVOKED');
    expect((await ver(app, ase, { token: inv.token }).expect(200)).body.data.state).toBe('REVOKED');
    const uso = await usar(app, ase, { code: inv.code }).expect(422);
    expect(uso.body).toEqual({ error: { code: 'INVITATION_REVOKED', message: 'El profesional anuló esta invitación.' } });
    expect(await prisma.resolucionDeInvitacion.findUniqueOrThrow({ where: { invitacionId: inv.invitationId } })).toMatchObject({ tipo: 'REVOCADA', actorId: pro.id, solicitudDeVinculoId: null });
  });

  it('el profesional no usa su propia invitación: 422 COUNTERPART_NOT_ELIGIBLE, como REL-01, y la invitación sigue pendiente', async () => {
    const pro = await prepararProfesional(app, 'inv-propia', ['NUTRICION']);
    const inv = await invitacion(app, pro);
    const r = await usar(app, pro, { token: inv.token }).expect(422);
    const rel01 = await conSesion(app, pro.token)
      .post('/api/v1/relationship-requests')
      .send({ target: { type: 'ADVISEE', identityId: pro.id }, scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' })
      .expect(422);
    expect(r.body).toEqual(rel01.body);
    expect((await listar(app, pro)).data[0]?.state).toBe('PENDING');
  });

  it('con un vínculo vigente en ese alcance: el mismo 409 que REL-01 y la invitación sigue pendiente; con una solicitud pendiente equivalente: 200 deduplicada', async () => {
    const pro = await prepararProfesional(app, 'inv-vigente', ['NUTRICION']);
    const conVinculo = await prepararAsesorado(app, 'inv-vigente', { a3: true });
    await vinculoCompleto(app, pro, conVinculo, 'NUTRICION');
    const inv = await invitacion(app, pro);
    const r = await usar(app, conVinculo, { token: inv.token }).expect(409);
    const rel01 = await solicitar(app, pro, conVinculo.id, 'NUTRICION').expect(409);
    expect(r.body).toEqual(rel01.body);
    expect(r.body.error.code).toBe('RESOURCE_CONFLICT');
    expect((await listar(app, pro, '?state=PENDING')).data.map((i) => i.invitationId)).toEqual([inv.invitationId]);

    // REG-06-44: la persona ya tenía la solicitud pendiente del mismo profesional; usar la invitación devuelve esa.
    const conSolicitud = await prepararAsesorado(app, 'inv-pendiente');
    const pendiente = (await solicitar(app, pro, conSolicitud.id, 'NUTRICION').expect(201)).body.data.relationshipRequestId as string;
    const dedup = await usar(app, conSolicitud, { token: inv.token }).expect(200);
    expect(dedup.body).toEqual({ data: { relationshipRequestId: pendiente, deduplicated: true } });
    expect(await prisma.resolucionDeInvitacion.findUniqueOrThrow({ where: { invitacionId: inv.invitationId } })).toMatchObject({ tipo: 'USADA', actorId: conSolicitud.id, solicitudDeVinculoId: pendiente });
    expect(await prisma.solicitudDeVinculo.count({ where: { profesionalId: pro.id, asesoradoId: conSolicitud.id } })).toBe(1);
  });

  it('dos usos simultáneos: exactamente uno gana (201) y los demás reciben 422 INVITATION_USED, nunca un 500', async () => {
    const pro = await prepararProfesional(app, 'inv-carrera', ['NUTRICION']);
    const personas = await Promise.all(Array.from({ length: 6 }, (_, i) => prepararAsesorado(app, `inv-carrera-${i}`)));
    const inv = await invitacion(app, pro);
    const respuestas = await simultaneos(personas.length, (i) => usar(app, personas[i] as Parte, i % 2 ? { token: inv.token } : { code: inv.code }));
    expect(resumenDeRespuestas(respuestas)).toEqual(['201', '422 INVITATION_USED', '422 INVITATION_USED', '422 INVITATION_USED', '422 INVITATION_USED', '422 INVITATION_USED']);
    const ganadora = respuestas.find((r) => r.status === 201);
    const resolucion = await prisma.resolucionDeInvitacion.findUniqueOrThrow({ where: { invitacionId: inv.invitationId } });
    expect(resolucion.solicitudDeVinculoId).toBe(ganadora?.body.data.relationshipRequestId);
    expect(await prisma.solicitudDeVinculo.count({ where: { profesionalId: pro.id } })).toBe(1);

    // La misma persona, cuatro veces a la vez con claves distintas: una solicitud.
    const ase = personas[0] as Parte;
    const otra = await invitacion(app, pro, 'NUTRICION');
    const propias = await simultaneos(4, () => usar(app, ase, { token: otra.token }));
    const resumen = resumenDeRespuestas(propias);
    // Si ganó la que encontró la solicitud ya pendiente de la ronda anterior, es 200; si no, 201. Las demás, usada.
    expect(resumen.filter((s) => s === '422 INVITATION_USED')).toHaveLength(3);
    expect(resumen.filter((s) => s === '200' || s === '201')).toHaveLength(1);

    // Un uso y una anulación a la vez: queda una sola resolución, y el que pierde lo dice.
    const tercera = await invitacion(app, pro, 'NUTRICION');
    const otraPersona = await prepararAsesorado(app, 'inv-carrera-anular');
    const [uso, anulacion] = await Promise.all([usar(app, otraPersona, { token: tercera.token }), anular(app, pro, tercera.invitationId)]);
    const par = `${uso.status} ${uso.body?.error?.code ?? ''}|${anulacion.status} ${anulacion.body?.error?.code ?? ''}`;
    expect(['201 |422 INVITATION_USED', '422 INVITATION_REVOKED|200 ']).toContain(par);
    expect(await prisma.resolucionDeInvitacion.count({ where: { invitacionId: tercera.invitationId } })).toBe(1);
  });
});

describe('La base sostiene la invitación aunque el código se equivoque', () => {
  it('solo se agregan; la vigencia es de 7 días como máximo; solo hashes; una resolución por invitación y coherente con ella', async () => {
    const pro = await prepararProfesional(app, 'inv-base', ['NUTRICION']);
    const otro = await prepararProfesional(app, 'inv-base-otro', ['NUTRICION']);
    const ase = await prepararAsesorado(app, 'inv-base');
    const inv = await invitacion(app, pro);
    await expect(prisma.$executeRaw`UPDATE "invitacion_de_vinculo" SET "vence_en" = now() + interval '1 year' WHERE "id" = ${inv.invitationId}::uuid`).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRaw`DELETE FROM "invitacion_de_vinculo" WHERE "id" = ${inv.invitationId}::uuid`).rejects.toThrow(/append-only/);

    const insertar = (venceEn: string, hashDelToken: string, profesionalId = pro.id) => prisma.$executeRawUnsafe(
      `INSERT INTO "invitacion_de_vinculo" ("profesional_id", "alcance", "finalidad", "hash_del_token", "hash_del_codigo", "procedencia", "momento_de_ocurrencia", "vence_en")
       VALUES ($1::uuid, 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL', $2, $3, '{}'::jsonb, now(), now() + $4::interval)`,
      profesionalId, hashDelToken, huella(randomUUID()), venceEn,
    );
    await expect(insertar('8 days', huella(randomUUID()))).rejects.toThrow(/invitacion_de_vinculo_vigencia/);
    await expect(insertar('7 days', 'token-en-claro')).rejects.toThrow(/invitacion_de_vinculo_solo_hashes/);
    await expect(insertar('7 days', huella(randomUUID()), ase.id)).rejects.toThrow(/perfil profesional/);

    const resolver = (tipo: 'USADA' | 'REVOCADA', actorId: string, solicitudId: string | null) =>
      prisma.$executeRaw`
        INSERT INTO "resolucion_de_invitacion" ("invitacion_id", "tipo", "actor_id", "solicitud_de_vinculo_id", "procedencia", "momento_de_ocurrencia")
        VALUES (${inv.invitationId}::uuid, ${tipo}::"TipoDeResolucionDeInvitacion", ${actorId}::uuid, ${solicitudId}::uuid, '{}'::jsonb, now())`;
    await expect(resolver('REVOCADA', otro.id, null)).rejects.toThrow(/solo el profesional que la creó/);
    await expect(resolver('USADA', ase.id, null)).rejects.toThrow(/resolucion_de_invitacion_solicitud_segun_tipo/);
    const ajena = (await solicitar(app, otro, ase.id, 'NUTRICION').expect(201)).body.data.relationshipRequestId as string;
    await expect(resolver('USADA', ase.id, ajena)).rejects.toThrow(/no es la de esta invitación/);
    await expect(resolver('USADA', pro.id, ajena)).rejects.toThrow(/no usa su propia invitación/);

    await anular(app, pro, inv.invitationId).expect(200);
    // Una sola resolución por invitación: la clave primaria (23505), aunque la segunda sea coherente.
    await expect(resolver('REVOCADA', pro.id, null)).rejects.toThrow(/23505.*already exists/s);
    await expect(prisma.$executeRaw`DELETE FROM "resolucion_de_invitacion" WHERE "invitacion_id" = ${inv.invitationId}::uuid`).rejects.toThrow(/append-only/);
  });
});
