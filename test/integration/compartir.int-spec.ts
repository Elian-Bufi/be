/**
 * WP-COMPARTIR (DEUDA_LEGAJO DL-176; decisión de Dirección del 2026-11-15) · la pantalla única de consentimiento, por la API
 * real y contra PostgreSQL:
 * - TEST-CMP-020: al aceptar a un profesional nuevo, la propuesta trae el A3, su área, lo de las otras áreas para él y lo de
 *   su área para los demás, y la historia anterior; un toque lo escribe todo, cada acto con su texto, su hash y su fila de
 *   auditoría, y solo lo elegido. Después no queda nada para dar, y repetir el pedido responde lo mismo.
 * - TEST-CMP-021: todo o nada: si el último acto falla en la base, no queda ninguno (ni el A3, ni el B2, ni lo de otras
 *   áreas); con la misma versión, el toque después escribe todo.
 * - TEST-CMP-022: retirar cada cosa corta desde ese momento y no toca lo demás; dos veces, lo mismo; sin el A3, también;
 *   lo retirado vuelve sin marcar, y darlo de nuevo pide el A3.
 * - TEST-CMP-023: los hábitos, «si corresponde»: se dan al que se elige, no al que no se nombró; retirarlos corta.
 * - TEST-CMP-024: lo ajeno responde igual que lo inexistente; sin el A3, 403; si algo cambió, 409; el texto viejo, 409.
 * - TEST-CMP-025: compartir el plan de un área con quien lo pidió acepta su pedido (TB-56).
 * - TEST-CMP-026 (de la revisión): lo retirado de a una cosa, con otras todavía compartidas, y un «Ahora no» a un pedido
 *   no vuelven marcados; lo nunca decidido, sí; y cada cosa dice en qué nivel la ve hoy.
 * - TEST-CMP-027 (de la revisión): retirar una cosa espera a la lectura en curso (el mismo cerrojo) y lleva la hora de la
 *   base de después, en lo de otras áreas y en los hábitos.
 */
import type { INestApplication } from '@nestjs/common';
import { LoElegidoCompartidoResponseSchema, LoQueSePuedeCompartirResponseSchema, TEXTO_DE_LA_HISTORIA_ANTERIOR, UnaCosaRetiradaResponseSchema, VERSION_VIGENTE } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion } from './soporte-api';
import { esperarQueEsperen, pidDeLaTransaccion } from './soporte-concurrencia';
import { a3Vigente, finalizar, otorgarA3, prepararAsesorado, prepararProfesional, versionDeVinculo, vinculoCompleto, type Parte } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

type Propuesta = ReturnType<typeof LoQueSePuedeCompartirResponseSchema.parse>['data'];

/** Las tres operaciones con la sesión de la persona; las escrituras llevan una Idempotency-Key nueva salvo que se pase una. */
function cmp(token: string) {
  const s = conSesion(app, token);
  return {
    propuesta: (relationshipId?: string) => s.get(`/api/v1/me/sharing-proposal${relationshipId ? `?relationshipId=${relationshipId}` : ''}`),
    elegir: (cuerpo: unknown, clave?: string) => s.post('/api/v1/me/sharing-choices', clave).send(cuerpo as object),
    retirar: (key: string, clave?: string) => s.post('/api/v1/me/sharing-choices/withdrawal', clave).send({ key }),
  };
}
const propuestaDe = async (p: Parte, relationshipId?: string): Promise<Propuesta> => LoQueSePuedeCompartirResponseSchema.parse((await cmp(p.token).propuesta(relationshipId).expect(200)).body).data;

/** «Aceptar y compartir»: lo marcado (o las claves que se pasen), con los textos de lo elegido. */
function elegir(d: Propuesta, claves: readonly string[] = d.items.filter((i) => i.offered && i.preselected).map((i) => i.key)) {
  return {
    relationshipId: d.relationshipId,
    expectedVersion: d.version,
    acceptedTextIds: [...new Set(d.items.filter((i) => claves.includes(i.key)).map((i) => i.textId))],
    choices: [...claves],
  };
}

/** Lo que un profesional recibe de cada otra área de la persona (API-RES-04). */
async function recibe(pro: Parte, ase: Parte): Promise<Record<string, string | null>> {
  const r = await conSesion(app, pro.token).get(`/api/v1/advisees/${ase.id}/shared-summaries`).expect(200);
  return Object.fromEntries((r.body.data.areas as { area: string; shared: { level: string } | null }[]).map((a) => [a.area, a.shared?.level ?? null]));
}

/**
 * La persona (sin el A3): Ruiz la acompaña en Entrenamiento y Gómez en Antropometría, los dos con su B2; Vera la acompañó
 * en Nutrición (terminado), y acaba de aceptar a Paz, de Nutrición, sin autorizarlo todavía.
 */
async function escenario(etiqueta: string) {
  const ase = await prepararAsesorado(app, `cmp-${etiqueta}`);
  const ruiz = await prepararProfesional(app, `cmp-${etiqueta}-ruiz`, ['ENTRENAMIENTO']);
  const gomez = await prepararProfesional(app, `cmp-${etiqueta}-gomez`, ['ANTROPOMETRIA']);
  const vera = await prepararProfesional(app, `cmp-${etiqueta}-vera`, ['NUTRICION']);
  const paz = await prepararProfesional(app, `cmp-${etiqueta}-paz`, ['NUTRICION']);
  await vinculoCompleto(app, ruiz, ase, 'ENTRENAMIENTO');
  await vinculoCompleto(app, gomez, ase, 'ANTROPOMETRIA');
  const v = await vinculoCompleto(app, vera, ase, 'NUTRICION');
  await finalizar(app, ase.token, v.vinculoId, await versionDeVinculo(app, ase.token, v.vinculoId)).expect(200);
  const p = await vinculoCompleto(app, paz, ase, 'NUTRICION', { b2: false });
  return { ase, ruiz, gomez, vera, paz, vinculoDePaz: p.vinculoId };
}

describe('WP-COMPARTIR · la pantalla única de consentimiento (DL-176)', () => {
  it('TEST-CMP-020 · al aceptar: la propuesta, y un toque que escribe todo lo elegido, con sus textos y su auditoría', async () => {
    const e = await escenario('020');
    const d = await propuestaDe(e.ase, e.vinculoDePaz);
    expect(d.relationshipId).toBe(e.vinculoDePaz);
    expect(d.items.map((i) => i.key).sort()).toEqual(
      [
        'HEALTH_DATA',
        `AREA_CONSENT:${e.vinculoDePaz}`,
        `SUMMARY:${e.paz.id}:ENTRENAMIENTO`,
        `SUMMARY:${e.paz.id}:ANTROPOMETRIA`,
        `SUMMARY:${e.ruiz.id}:NUTRICION`,
        `SUMMARY:${e.gomez.id}:NUTRICION`,
        `PREVIOUS_HISTORY:${e.vinculoDePaz}`,
      ].sort(),
    );
    expect(d.items.every((i) => i.offered && i.preselected && !i.given)).toBe(true);
    // Cada cosa con su texto, y cada texto con su hash.
    expect(d.items.every((i) => d.texts.some((t) => t.id === i.textId))).toBe(true);
    expect(d.texts.find((t) => t.kind === 'PREVIOUS_HISTORY')?.textHash).toBe(TEXTO_DE_LA_HISTORIA_ANTERIOR.hash);

    const clave = `cmp-020-${randomUUID()}`;
    const r = LoElegidoCompartidoResponseSchema.parse((await cmp(e.ase.token).elegir(elegir(d), clave).expect(200)).body).data;
    expect(r.given.map((g) => g.key).sort()).toEqual(d.items.map((i) => i.key).sort());
    // Repetir el pedido con la misma clave responde lo mismo, sin escribir dos veces.
    expect((await cmp(e.ase.token).elegir(elegir(d), clave).expect(200)).body.data).toEqual(r);

    // El A3 y el B2, vigentes.
    await a3Vigente(app, e.ase.token);
    expect((await conSesion(app, e.ase.token).get(`/api/v1/relationships/${e.vinculoDePaz}`).expect(200)).body.data.consentState).toBe('ACTIVE');
    // Lo de otras áreas: solo lo elegido. Ruiz no recibe Antropometría: ese par no tocaba al vínculo aceptado.
    expect(await recibe(e.paz, e.ase)).toEqual({ ENTRENAMIENTO: 'SUMMARY_AND_PLAN', ANTROPOMETRIA: 'SUMMARY' });
    expect(await recibe(e.ruiz, e.ase)).toEqual({ NUTRICION: 'SUMMARY_AND_PLAN', ANTROPOMETRIA: null });
    expect(await recibe(e.gomez, e.ase)).toEqual({ NUTRICION: 'SUMMARY_AND_PLAN', ENTRENAMIENTO: null });
    // La historia anterior: Paz la puede leer.
    await conSesion(app, e.paz.token).get(`/api/v1/advisees/${e.ase.id}/previous-history/NUTRICION`).expect(200);

    // Cada acto con su texto y su hash, como lo dejaría su operación de siempre.
    const a3 = await prisma.actoRegistrable.findFirstOrThrow({ where: { identidadId: e.ase.id, tipo: 'DATOS_SALUD_BE', estado: 'VIGENTE' } });
    expect([a3.versionDeTextoId, a3.hashDelTexto]).toEqual([VERSION_VIGENTE.DATOS_SALUD_BE.id, VERSION_VIGENTE.DATOS_SALUD_BE.hash]);
    const b2 = await prisma.versionDeConsentimiento.findFirstOrThrow({ where: { consentimiento: { alcanceDeVinculoId: e.vinculoDePaz } } });
    expect(b2.hashDelTexto).toBe(d.texts.find((t) => t.kind === 'AREA_CONSENT')?.textHash);
    const res = await prisma.autorizacionDeResumenes.findFirstOrThrow({ where: { asesoradoId: e.ase.id }, include: { textosAceptados: true } });
    expect(res.textosAceptados.map((t) => [t.nivel, t.versionDeTextoId]).sort()).toEqual(
      [
        ['RESUMEN', VERSION_VIGENTE.RESUMENES_COMPARTIDOS.id],
        ['RESUMEN_Y_PLAN', VERSION_VIGENTE.RESUMENES_Y_PLAN_COMPARTIDOS.id],
      ].sort(),
    );
    const hia = await prisma.autorizacionDeHistoriaAnterior.findFirstOrThrow({ where: { alcanceDeVinculoId: e.vinculoDePaz } });
    expect([hia.estado, hia.textoId, hia.hashDelTexto]).toEqual(['VIGENTE', TEXTO_DE_LA_HISTORIA_ANTERIOR.id, TEXTO_DE_LA_HISTORIA_ANTERIOR.hash]);
    // Una fila de auditoría por acto, con esta operación, más la del toque.
    const auditoria = await prisma.registroDeAuditoria.findMany({ where: { operacion: 'API-CMP-02', actorId: e.ase.id, resultado: 'EXITO' } });
    expect(auditoria.map((a) => a.recursoTipo).sort()).toEqual(['ActoRegistrable', 'AutorizacionDeHistoriaAnterior', 'AutorizacionDeResumenes', 'Consentimiento', 'LoQueSeComparte']);

    // Después, no queda nada para dar.
    const despues = await propuestaDe(e.ase, e.vinculoDePaz);
    expect(despues.items.filter((i) => i.offered)).toEqual([]);
    expect(despues.items.every((i) => i.given)).toBe(true);
  });

  it('TEST-CMP-021 · todo o nada: si el último acto falla en la base, no queda ninguno', async () => {
    const e = await escenario('021');
    const d = await propuestaDe(e.ase, e.vinculoDePaz);
    // Una falla de prueba en la base, solo para esta persona, en el último acto del toque (la historia anterior).
    await prisma.$executeRawUnsafe(
      `CREATE OR REPLACE FUNCTION prueba_cmp_falla() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."asesorado_id" = '${e.ase.id}'::uuid THEN RAISE EXCEPTION 'falla de prueba'; END IF; RETURN NEW; END $$`,
    );
    await prisma.$executeRawUnsafe('CREATE TRIGGER prueba_cmp_falla BEFORE INSERT ON "autorizacion_de_historia_anterior" FOR EACH ROW EXECUTE FUNCTION prueba_cmp_falla()');
    try {
      // Una falla de la base sale como error del servidor, nunca como éxito ni como un rechazo de la persona.
      expect((await cmp(e.ase.token).elegir(elegir(d))).status).toBeGreaterThanOrEqual(500);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS prueba_cmp_falla ON "autorizacion_de_historia_anterior"');
      await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS prueba_cmp_falla()');
    }
    expect(await prisma.actoRegistrable.count({ where: { identidadId: e.ase.id, tipo: 'DATOS_SALUD_BE' } })).toBe(0);
    expect(await prisma.consentimiento.count({ where: { alcanceDeVinculoId: e.vinculoDePaz } })).toBe(0);
    expect(await prisma.autorizacionDeResumenes.count({ where: { asesoradoId: e.ase.id } })).toBe(0);
    expect(await prisma.autorizacionDeHistoriaAnterior.count({ where: { asesoradoId: e.ase.id } })).toBe(0);
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-CMP-02', actorId: e.ase.id, resultado: 'EXITO' } })).toBe(0);
    // Lo que vio sigue valiendo: el mismo toque, ahora, escribe todo.
    await cmp(e.ase.token).elegir(elegir(d)).expect(200);
    expect(await prisma.autorizacionDeHistoriaAnterior.count({ where: { asesoradoId: e.ase.id } })).toBe(1);
  });

  it('TEST-CMP-022 · retirar cada cosa corta desde ese momento, sin tocar lo demás; también sin el A3; lo retirado vuelve sin marcar', async () => {
    const e = await escenario('022');
    await cmp(e.ase.token).elegir(elegir(await propuestaDe(e.ase, e.vinculoDePaz))).expect(200);
    const ruizNutricion = `SUMMARY:${e.ruiz.id}:NUTRICION`;

    const r1 = UnaCosaRetiradaResponseSchema.parse((await cmp(e.ase.token).retirar(ruizNutricion).expect(200)).body).data;
    expect([r1.withdrawn, r1.withdrawnAt !== null]).toEqual([true, true]);
    expect((await recibe(e.ruiz, e.ase)).NUTRICION).toBeNull();
    await conSesion(app, e.ruiz.token).get(`/api/v1/advisees/${e.ase.id}/shared-summaries/NUTRICION/plan`).expect(404);
    // Lo demás sigue igual.
    expect(await recibe(e.paz, e.ase)).toEqual({ ENTRENAMIENTO: 'SUMMARY_AND_PLAN', ANTROPOMETRIA: 'SUMMARY' });
    expect((await recibe(e.gomez, e.ase)).NUTRICION).toBe('SUMMARY_AND_PLAN');
    // Dos veces, lo mismo, sin escribir.
    const versiones = await prisma.autorizacionDeResumenes.count({ where: { asesoradoId: e.ase.id } });
    expect(UnaCosaRetiradaResponseSchema.parse((await cmp(e.ase.token).retirar(ruizNutricion).expect(200)).body).data.withdrawn).toBe(false);
    expect(await prisma.autorizacionDeResumenes.count({ where: { asesoradoId: e.ase.id } })).toBe(versiones);

    // Sin el A3, retirar también se puede; sin nada que quede, la autorización queda retirada.
    await conSesion(app, e.ase.token).post(`/api/v1/me/health-data-consents/${await a3Vigente(app, e.ase.token)}/revoke`).send({}).expect(200);
    for (const k of [`SUMMARY:${e.paz.id}:ENTRENAMIENTO`, `SUMMARY:${e.paz.id}:ANTROPOMETRIA`, `SUMMARY:${e.gomez.id}:NUTRICION`]) await cmp(e.ase.token).retirar(k).expect(200);
    const ultima = await prisma.autorizacionDeResumenes.findFirstOrThrow({ where: { asesoradoId: e.ase.id }, orderBy: { version: 'desc' } });
    expect(ultima.estado).toBe('RETIRADA');

    // Lo retirado vuelve sin marcar, y darlo de nuevo pide el A3.
    const todo = await propuestaDe(e.ase);
    const item = todo.items.find((i) => i.key === ruizNutricion)!;
    expect([item.given, item.offered, item.preselected]).toEqual([false, true, false]);
    expect(todo.items.find((i) => i.key === 'HEALTH_DATA')?.preselected).toBe(false);
    await cmp(e.ase.token).elegir(elegir(todo, [ruizNutricion])).expect(403);
    await cmp(e.ase.token).elegir(elegir(todo, ['HEALTH_DATA', ruizNutricion])).expect(200);
    expect((await recibe(e.ruiz, e.ase)).NUTRICION).toBe('SUMMARY_AND_PLAN');
  });

  it('TEST-CMP-023 · los hábitos: al que se elige; al que no se nombró, no; retirarlos corta', async () => {
    const ase = await prepararAsesorado(app, 'cmp-023', { a3: true });
    const ruiz = await prepararProfesional(app, 'cmp-023-ruiz', ['ENTRENAMIENTO']);
    const paz = await prepararProfesional(app, 'cmp-023-paz', ['NUTRICION']);
    await vinculoCompleto(app, ruiz, ase, 'ENTRENAMIENTO');
    const sinHabitos = await propuestaDe(ase);
    expect(sinHabitos.items.some((i) => i.kind === 'HABITS')).toBe(false); // sin hábitos y sin compartirlos, no corresponde
    await conSesion(app, ase.token).post('/api/v1/me/habits').send({ expectedVersion: null, answers: [{ fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER', number: 7, unit: 'h' } }] }).expect(201);
    const { vinculoId } = await vinculoCompleto(app, paz, ase, 'NUTRICION', { b2: false });
    const d = await propuestaDe(ase, vinculoId);
    const habitos = d.items.find((i) => i.key === `HABITS:${paz.id}`)!;
    expect([habitos.offered, habitos.preselected]).toEqual([true, true]);
    await cmp(ase.token).elegir(elegir(d)).expect(200);
    await conSesion(app, paz.token).get(`/api/v1/advisees/${ase.id}/habits`).expect(200);
    await conSesion(app, ruiz.token).get(`/api/v1/advisees/${ase.id}/habits`).expect(404); // a Ruiz no se le preguntó
    expect((await propuestaDe(ase)).items.find((i) => i.key === `HABITS:${ruiz.id}`)?.preselected).toBe(true);

    await cmp(ase.token).retirar(`HABITS:${paz.id}`).expect(200);
    await conSesion(app, paz.token).get(`/api/v1/advisees/${ase.id}/habits`).expect(404);
    const ultima = await prisma.autorizacionDeHabitos.findFirstOrThrow({ where: { asesoradoId: ase.id }, orderBy: { version: 'desc' } });
    expect(ultima.estado).toBe('RETIRADA');
    expect((await propuestaDe(ase)).items.find((i) => i.key === `HABITS:${paz.id}`)?.preselected).toBe(false);
  });

  it('TEST-CMP-024 · lo ajeno responde igual que lo inexistente; sin el A3, 403; si algo cambió, 409', async () => {
    const e = await escenario('024');
    const otra = await prepararAsesorado(app, 'cmp-024-otra');
    const ajeno = await prepararProfesional(app, 'cmp-024-ajeno', ['NUTRICION']);
    const deOtra = await vinculoCompleto(app, ajeno, otra, 'NUTRICION', { b2: false });

    // Un componente ajeno y uno inexistente: el mismo 404, con el mismo cuerpo.
    const ajenoR = await cmp(e.ase.token).propuesta(deOtra.vinculoId).expect(404);
    const inexistenteR = await cmp(e.ase.token).propuesta(randomUUID()).expect(404);
    expect(ajenoR.body.error.code).toBe(inexistenteR.body.error.code);
    const d = await propuestaDe(e.ase, e.vinculoDePaz);
    await cmp(e.ase.token).elegir({ ...elegir(d), relationshipId: deOtra.vinculoId }).expect(404);
    // Una cosa ajena y una inexistente: el mismo 422.
    const conAjena = await cmp(e.ase.token).elegir({ ...elegir(d, ['HEALTH_DATA']), choices: ['HEALTH_DATA', `AREA_CONSENT:${deOtra.vinculoId}`] }).expect(422);
    const conInexistente = await cmp(e.ase.token).elegir({ ...elegir(d, ['HEALTH_DATA']), choices: ['HEALTH_DATA', `AREA_CONSENT:${randomUUID()}`] }).expect(422);
    expect(conAjena.body.error).toEqual(conInexistente.body.error);
    // Retirar con un profesional ajeno o inexistente: el mismo 404.
    await cmp(e.ase.token).retirar(`HABITS:${ajeno.id}`).expect(404);
    await cmp(e.ase.token).retirar(`HABITS:${randomUUID()}`).expect(404);

    // Lo que pide el A3, sin el A3: 403. El texto viejo: 409.
    await cmp(e.ase.token).elegir(elegir(d, [`SUMMARY:${e.paz.id}:ENTRENAMIENTO`])).expect(403);
    await cmp(e.ase.token).elegir({ ...elegir(d, ['HEALTH_DATA']), acceptedTextIds: ['otro-texto'] }).expect(409);
    // Algo cambió mientras miraba (el A3, desde Privacidad): 409, y no se escribió nada.
    await otorgarA3(app, e.ase.token).expect(201);
    await cmp(e.ase.token).elegir(elegir(d, [`AREA_CONSENT:${e.vinculoDePaz}`])).expect(409);
    expect(await prisma.consentimiento.count({ where: { alcanceDeVinculoId: e.vinculoDePaz } })).toBe(0);
    // Con lo nuevo, sí: el A3 ya no se ofrece, y lo demás se da sin él.
    const nueva = await propuestaDe(e.ase, e.vinculoDePaz);
    expect(nueva.items.find((i) => i.key === 'HEALTH_DATA')?.offered).toBe(false);
    await cmp(e.ase.token).elegir(elegir(nueva)).expect(200);
  });

  it('TEST-CMP-026 · lo retirado de a una cosa (con otras compartidas) y un «Ahora no» a un pedido no vuelven marcados (CMP-D3)', async () => {
    // Revisión del PR: con la autorización todavía ACTIVA (quedan otras cosas compartidas), lo retirado desde «Quién ve qué»
    // volvía marcado en «Compartir todo» y al aceptar a otro profesional. Mutación: decidir lo marcado solo con la versión
    // vigente la pone en rojo.
    const e = await escenario('026');
    await cmp(e.ase.token).elegir(elegir(await propuestaDe(e.ase, e.vinculoDePaz))).expect(200);
    const ruizNutricion = `SUMMARY:${e.ruiz.id}:NUTRICION`;
    await cmp(e.ase.token).retirar(ruizNutricion).expect(200);
    const ultima = await prisma.autorizacionDeResumenes.findFirstOrThrow({ where: { asesoradoId: e.ase.id }, orderBy: { version: 'desc' } });
    expect(ultima.estado).toBe('ACTIVA');
    const antes = await propuestaDe(e.ase);
    const retirado = antes.items.find((i) => i.key === ruizNutricion)!;
    expect([retirado.given, retirado.offered, retirado.preselected]).toEqual([false, true, false]);
    // Lo nunca decidido sigue marcado (Ruiz ← Antropometría no tocaba a Paz), y lo que ve hoy dice su nivel.
    const nunca = antes.items.find((i) => i.key === `SUMMARY:${e.ruiz.id}:ANTROPOMETRIA`)!;
    expect([nunca.offered, nunca.preselected, nunca.kind === 'SUMMARY' && nunca.givenLevel]).toEqual([true, true, null]);
    const visto = antes.items.find((i) => i.key === `SUMMARY:${e.paz.id}:ENTRENAMIENTO`)!;
    expect(visto.kind === 'SUMMARY' && [visto.given, visto.givenLevel]).toEqual([true, 'SUMMARY_AND_PLAN']);

    // Gómez (Antropometría) pide ver el plan de Entrenamiento: marcado mientras espera; con «Ahora no», ya no.
    const gomezEntrenamiento = `SUMMARY:${e.gomez.id}:ENTRENAMIENTO`;
    expect(antes.items.find((i) => i.key === gomezEntrenamiento)?.preselected).toBe(true);
    await conSesion(app, e.gomez.token).post(`/api/v1/advisees/${e.ase.id}/shared-summaries/access-requests`).send({ scope: 'ANTROPOMETRIA', area: 'ENTRENAMIENTO' }).expect(201);
    const [pedido] = (await conSesion(app, e.ase.token).get('/api/v1/me/summary-sharing/access-requests').expect(200)).body.data as { accessRequestId: string; version: string }[];
    await conSesion(app, e.ase.token)
      .post(`/api/v1/me/summary-sharing/access-requests/${pedido!.accessRequestId}/answer`)
      .send({ expectedVersion: pedido!.version, answer: 'NOT_NOW', sharing: null })
      .expect(200);
    const despues = await propuestaDe(e.ase);
    expect(despues.items.find((i) => i.key === gomezEntrenamiento)?.preselected).toBe(false);
    expect(despues.items.find((i) => i.key === ruizNutricion)?.preselected).toBe(false);
    // Elegirlo a mano sigue pudiéndose: sin marcar no es prohibido.
    await cmp(e.ase.token).elegir(elegir(despues, [ruizNutricion])).expect(200);
    expect((await recibe(e.ruiz, e.ase)).NUTRICION).toBe('SUMMARY_AND_PLAN');
  });

  it('TEST-CMP-027 · retirar una cosa espera a la lectura en curso y lleva la hora de después: lo de otras áreas y los hábitos', async () => {
    // Revisión del PR: API-CMP-03 tiene que tomar el mismo cerrojo que toman las lecturas (compartido, después del PDP) y
    // la hora de la base después de tomarlo; si tomara otro, un retiro no esperaría a la lectura en curso. Mutación: otra
    // clave de cerrojo en API-CMP-03 la pone en rojo (el retiro no espera).
    const e = await escenario('027');
    await cmp(e.ase.token).elegir(elegir(await propuestaDe(e.ase, e.vinculoDePaz))).expect(200);
    await conSesion(app, e.ase.token).post('/api/v1/me/habits').send({ expectedVersion: null, answers: [{ fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER', number: 7, unit: 'h' } }] }).expect(201);
    await cmp(e.ase.token).elegir(elegir(await propuestaDe(e.ase), [`HABITS:${e.paz.id}`])).expect(200);
    await conSesion(app, e.paz.token).get(`/api/v1/advisees/${e.ase.id}/habits`).expect(200);

    /** Una lectura en curso (el cerrojo compartido de la autorización) mientras llega el retiro; la suelta cuando espera. */
    async function conUnaLecturaEnCurso<T>(cerrojo: string, pedido: () => Promise<T>, que: string): Promise<{ respuesta: T; soltadoEn: Date }> {
      let respuesta: Promise<T> | undefined;
      let termino = false;
      let soltadoEn = new Date(0);
      await prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(hashtextextended(${cerrojo}, 0))`;
          const pid = await pidDeLaTransaccion(tx);
          respuesta = pedido().finally(() => {
            termino = true;
          });
          await esperarQueEsperen(prisma, 1, { bloqueadoPor: pid, yaPaso: () => termino, que });
          // Si el retiro terminó sin esperar, no tomó el cerrojo de las lecturas.
          expect(termino).toBe(false);
          const [ahora] = await tx.$queryRaw<{ ahora: Date }[]>`SELECT clock_timestamp() AS "ahora"`;
          soltadoEn = ahora!.ahora;
        },
        { timeout: 40_000, maxWait: 10_000 },
      );
      return { respuesta: await (respuesta as Promise<T>), soltadoEn };
    }

    const res = await conUnaLecturaEnCurso(`autorizacion-de-resumenes|${e.ase.id}`, () => cmp(e.ase.token).retirar(`SUMMARY:${e.ruiz.id}:NUTRICION`).then((r) => r), 'el retiro de lo de otras áreas esperando la lectura');
    expect(res.respuesta.status).toBe(200);
    const deRes = UnaCosaRetiradaResponseSchema.parse(res.respuesta.body).data;
    expect(deRes.withdrawn).toBe(true);
    expect(new Date(deRes.withdrawnAt!).getTime()).toBeGreaterThanOrEqual(res.soltadoEn.getTime());
    expect((await recibe(e.ruiz, e.ase)).NUTRICION).toBeNull();

    const hbt = await conUnaLecturaEnCurso(`autorizacion-de-habitos|${e.ase.id}`, () => cmp(e.ase.token).retirar(`HABITS:${e.paz.id}`).then((r) => r), 'el retiro de los hábitos esperando la lectura');
    expect(hbt.respuesta.status).toBe(200);
    const deHbt = UnaCosaRetiradaResponseSchema.parse(hbt.respuesta.body).data;
    expect(deHbt.withdrawn).toBe(true);
    expect(new Date(deHbt.withdrawnAt!).getTime()).toBeGreaterThanOrEqual(hbt.soltadoEn.getTime());
    await conSesion(app, e.paz.token).get(`/api/v1/advisees/${e.ase.id}/habits`).expect(404);
  }, 120_000);

  it('TEST-CMP-025 · compartir el plan de un área con quien lo pidió acepta su pedido', async () => {
    const e = await escenario('025');
    // Paz, con su B2 y el A3, y Ruiz pide ver el plan de Nutrición desde Entrenamiento.
    const d = await propuestaDe(e.ase, e.vinculoDePaz);
    await cmp(e.ase.token).elegir(elegir(d, ['HEALTH_DATA', `AREA_CONSENT:${e.vinculoDePaz}`])).expect(200);
    await conSesion(app, e.ruiz.token).post(`/api/v1/advisees/${e.ase.id}/shared-summaries/access-requests`).send({ scope: 'ENTRENAMIENTO', area: 'NUTRICION' }).expect(201);
    expect((await conSesion(app, e.ase.token).get('/api/v1/me/summary-sharing/access-requests').expect(200)).body.data).toHaveLength(1);
    await cmp(e.ase.token).elegir(elegir(await propuestaDe(e.ase), [`SUMMARY:${e.ruiz.id}:NUTRICION`])).expect(200);
    expect((await conSesion(app, e.ase.token).get('/api/v1/me/summary-sharing/access-requests').expect(200)).body.data).toEqual([]);
    expect((await recibe(e.ruiz, e.ase)).NUTRICION).toBe('SUMMARY_AND_PLAN');
  });
});
