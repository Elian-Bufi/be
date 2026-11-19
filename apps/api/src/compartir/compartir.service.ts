import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  CompartirLoElegidoRequestSchema,
  DejarDeCompartirUnaCosaRequestSchema,
  PIDEN_EL_A3,
  VERSION_VIGENTE,
  habitosAlCompartir,
  habitosSinElProfesional,
  leerClave,
  loQueSePuedeCompartir,
  renglonesAlCompartir,
  renglonesSinElPar,
  renglonesVigentes,
  revisarLaEleccion,
  textosDeLaVersion,
  textosDeLosResumenesElegidos,
  ultimaVersion,
  versionDeLoQueSeComparte,
  type Alcance,
  type LoQueSeComparte,
  type LoQueSePuedeCompartirResponse,
  type Procedencia,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { tieneA3Vigente } from '../consentimiento/a3-del-titular';
import { otorgarA3EnTransaccion } from '../consentimiento/consentimiento-de-salud.service';
import { otorgarB2EnTransaccion } from '../consentimiento/consentimiento-profesional.service';
import {
  aceptarLosPedidosDeQuienesLosReciben,
  agregarVersionDeAutorizacion,
  autorizacionVigente as autorizacionDeHabitosVigente,
  profesionalesDeLaPersona,
  tomarLaAutorizacion as tomarLaAutorizacionDeHabitos,
  tomarLosPedidos as tomarLosPedidosDeHabitos,
} from '../formularios/habitos-de-la-persona';
import { agregarVersion as agregarVersionDeLaHistoria, tomarLaHistoriaAnterior, versionesDelComponente } from '../historia-anterior/autorizaciones';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { AuditoriaService } from '../plataforma/auditoria.service';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase, sinDuplicar } from '../prisma/concurrencia';
import {
  aceptarLosPedidosDeQuienesVenElPlan,
  agregarVersionDeAutorizacionDeResumenes,
  autorizacionDeResumenesVigente,
  componentesDeLaPersona as componentesParaResumenes,
  tomarLaAutorizacionDeResumenes,
  tomarLosPedidosDePlan,
} from '../resumenes/resumenes-de-la-persona';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorDeCompartir, esUuid } from './ejecutor';
import { itemsApi, leerLoQueSeComparte, textosApi, TEXTOS_PARA_COMPARTIR } from './lectura';

type Tx = Prisma.TransactionClient;

/** Todo es de la persona sobre lo suyo (como API-RES-02, API-HBT-03 y API-HIA-02: UC-P33). */
const DE_LA_PERSONA = 'UC-P33';

/** El recurso con que queda cada toque en la auditoría: lo que la persona comparte. */
const RECURSO = 'LoQueSeComparte';

const noDisponible = (issues: readonly { readonly code: string; readonly path: string }[]): ErrorDeApi =>
  new ErrorDeApi(422, CodigoDeError.SHARING_CHOICE_NOT_AVAILABLE, 'Algo de lo que elegiste ya no se puede compartir así. Actualizá la vista y probá de nuevo.', { issues });
const sinElTexto = (issues: readonly { readonly code: string; readonly path: string }[]): ErrorDeApi =>
  new ErrorDeApi(422, CodigoDeError.SHARING_TEXT_REQUIRED, 'Para compartir eso, falta aceptar su texto.', { issues });

/**
 * API-CMP-01 a 03 — compartir casi por omisión (WP-COMPARTIR; DL-176; decisión de Dirección del 2026-11-15). Lo que garantiza
 * este servicio:
 * - **un toque escribe todo o nada** (API-CMP-02): el A3, el B2 de cada área, lo de otras áreas, los hábitos y la historia
 *   anterior, en una sola transacción. Cada acto queda como lo dejaría su operación de siempre (su versión, su texto con su
 *   hash, su hecho) y con su propia fila de auditoría, con esta operación. Si algo falla, no queda nada;
 * - **la mostrada es la aceptada** (08 §12.2): la versión de lo que se vio y los textos que se mostraron se comparan con los
 *   cerrojos tomados; si algo cambió, 409 y la app vuelve a leer;
 * - **retirar siempre es posible y corta hacia adelante** (API-CMP-03, sin el A3): lo de un área con un profesional, o los
 *   hábitos con uno, en una versión nueva que no lo nombra; nunca se borra nada;
 * - **lo ajeno o lo inexistente** responde lo mismo: el 404 de siempre para un componente o un profesional que no es suyo, y
 *   el mismo 422 para una cosa que no se puede dar, exista o no.
 *
 * Los cerrojos, en el orden único (prisma/concurrencia.ts): la identidad (si se da el A3), los componentes que se tocan (en
 * orden de id), el acto A3 y, al final, los de las autorizaciones, en el orden del cierre de cuenta: hábitos, lo de otras
 * áreas, la historia anterior.
 */
@Injectable()
export class CompartirService {
  constructor(
    private readonly ejecutor: EjecutorDeCompartir,
    private readonly auditoria: AuditoriaService,
  ) {}

  // ─── API-CMP-01 · lo que puedo compartir y lo que ya comparto ────────────────────────────────
  /** Sin el A3: la persona tiene que poder ver lo que comparte para poder retirarlo (como API-HIA-01). */
  propuesta(actor: ActorAutenticado, relationshipId: string | null, ctx: ContextoDeSolicitud): Promise<LoQueSePuedeCompartirResponse> {
    const recurso = relationshipId ? { tipo: 'AlcanceDeVinculo', id: relationshipId } : null;
    return this.ejecutor.leer({
      operacion: 'API-CMP-01',
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const personaId = actor.identidadId;
        const alAceptar = relationshipId === null ? null : relationshipId.toLowerCase();
        if (alAceptar !== null && !(esUuid(alAceptar) && (await esDeLaPersona(tx, personaId, alAceptar)))) {
          throw this.ejecutor.noRevelable({ operacion: 'API-CMP-01', actorId: personaId, recurso }, ctx);
        }
        const leido = await leerLoQueSeComparte(tx, personaId);
        const items = loQueSePuedeCompartir(leido.estado, alAceptar);
        return { data: { relationshipId: alAceptar, version: versionDeLoQueSeComparte(leido.estado), items: itemsApi(items, leido), texts: textosApi(items, leido.textosDeB2) } };
      },
    });
  }

  // ─── API-CMP-02 · un toque escribe todo lo elegido ───────────────────────────────────────────
  compartir(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-CMP-02',
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: CompartirLoElegidoRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        const personaId = actor.identidadId;
        const alAceptar = pedido.relationshipId === null ? null : pedido.relationshipId.toLowerCase();
        const recurso = alAceptar ? { tipo: 'AlcanceDeVinculo', id: alAceptar } : null;
        // El componente de la pantalla tiene que ser suyo: ajeno o inexistente, el mismo 404.
        if (alAceptar !== null && !(esUuid(alAceptar) && (await esDeLaPersona(tx, personaId, alAceptar)))) {
          throw this.ejecutor.noRevelable({ operacion: 'API-CMP-02', actorId: personaId, recurso }, ctx);
        }
        const claves = pedido.choices.map((k) => leerClave(k));
        const tipos = new Set(claves.map((k) => k?.tipo));

        // 1) Los cerrojos, en el orden único, antes de leer: así lo que se compara es lo que se escribe.
        const daElA3 = tipos.has('HEALTH_DATA');
        if (daElA3) await tx.$queryRaw`SELECT 1 FROM "identidad" WHERE "id" = ${personaId}::uuid FOR NO KEY UPDATE`;
        const exclusivos = new Set(claves.flatMap((k) => (k?.tipo === 'AREA_CONSENT' ? [k.componenteId] : [])));
        const compartidos = new Set(claves.flatMap((k) => (k?.tipo === 'PREVIOUS_HISTORY' ? [k.componenteId] : [])));
        for (const id of [...new Set([...exclusivos, ...compartidos])].sort()) {
          // Uno ajeno no se toma: después no está entre lo que se ofrece (422, lo mismo que uno que no existe).
          if (exclusivos.has(id)) await tx.$queryRaw`SELECT av."id" FROM "alcance_de_vinculo" av JOIN "vinculo" v ON v."id" = av."vinculo_id" WHERE av."id" = ${id}::uuid AND v."asesorado_id" = ${personaId}::uuid FOR NO KEY UPDATE OF av`;
          else await tx.$queryRaw`SELECT av."id" FROM "alcance_de_vinculo" av JOIN "vinculo" v ON v."id" = av."vinculo_id" WHERE av."id" = ${id}::uuid AND v."asesorado_id" = ${personaId}::uuid FOR SHARE OF av`;
        }
        // El A3, con el acto tomado (DL-115), si se da algo que lo pide y no se lo da en este mismo toque.
        if (!daElA3 && [...tipos].some((t) => t !== undefined && PIDEN_EL_A3.has(t))) await tieneA3Vigente(tx, personaId, { bloquear: true });
        if (tipos.has('HABITS')) {
          await tomarLaAutorizacionDeHabitos(tx, personaId, 'escribir');
          await tomarLosPedidosDeHabitos(tx, personaId);
        }
        if (tipos.has('SUMMARY')) {
          await tomarLaAutorizacionDeResumenes(tx, personaId, 'escribir');
          await tomarLosPedidosDePlan(tx, personaId);
        }
        if (tipos.has('PREVIOUS_HISTORY')) await tomarLaHistoriaAnterior(tx, personaId, 'escribir');

        // 2) Lo de ahora, con los cerrojos tomados: tiene que ser lo que se vio.
        const leido = await leerLoQueSeComparte(tx, personaId);
        if (versionDeLoQueSeComparte(leido.estado) !== pedido.expectedVersion) throw errores.conflictoDeVersion();
        const items = loQueSePuedeCompartir(leido.estado, alAceptar);
        const revision = revisarLaEleccion(items, pedido.choices, pedido.acceptedTextIds);
        if (!revision.ok) {
          if (revision.motivo === 'NO_DISPONIBLE') throw noDisponible(revision.issues);
          if (revision.motivo === 'SIN_EL_A3') throw errores.accionNoPermitida();
          if (revision.motivo === 'TEXTO_VIEJO') throw errores.versionDeConsentimientoVieja();
          throw sinElTexto(revision.issues);
        }
        const elegidos = revision.elegidos;
        const momento = await momentoDeLaBase(tx);
        const auditar = (recursoTipo: string, recursoId: string) =>
          this.auditoria.registrar(
            { operacion: 'API-CMP-02', resultado: 'EXITO', actorId: personaId, sujetoId: personaId, recursoTipo, recursoId, superficie: ctx.superficie, requestId: ctx.requestId, momentoDeOcurrencia: ctx.momentoDeRecepcion },
            tx,
          );

        // 3) Cada acto, en el orden de los cerrojos: el A3, el B2 de cada área, los hábitos, lo de otras áreas y la historia.
        for (const i of elegidos) {
          if (i.tipo !== 'HEALTH_DATA') continue;
          await sinDuplicar(otorgarA3EnTransaccion(tx, { actorId: personaId, consentVersionId: i.textoId, ctx, procedencia, auditar: (id) => auditar('ActoRegistrable', id) }), () => errores.conflictoConcurrente());
        }
        for (const i of elegidos) {
          if (i.tipo !== 'AREA_CONSENT') continue;
          await otorgarB2EnTransaccion(tx, { actorId: personaId, vinculoId: i.componenteId, consentVersionId: i.textoId, ctx, procedencia, auditar: (id) => auditar('Consentimiento', id) });
        }
        await this.darLosHabitos(tx, { personaId, elegidos, procedencia, momento, auditar });
        await this.darLoDeOtrasAreas(tx, { personaId, elegidos, procedencia, momento, auditar });
        for (const i of elegidos) {
          if (i.tipo !== 'PREVIOUS_HISTORY') continue;
          const ultima = ultimaVersion(await versionesDelComponente(tx, i.componenteId));
          if (ultima?.estado === 'VIGENTE') continue;
          const fila = await agregarVersionDeLaHistoria(tx, { componente: { id: i.componenteId, profesionalId: i.profesionalId, alcance: i.area }, personaId, anterior: ultima, estado: 'VIGENTE', procedencia, momento });
          await auditar('AutorizacionDeHistoriaAnterior', fila.id);
        }
        return {
          estadoHttp: 200,
          cuerpo: { data: { recordedAt: momento.toISOString(), given: elegidos.map((i) => ({ key: i.clave, kind: i.tipo })) } },
          sujetoId: personaId,
          recurso: { tipo: RECURSO, id: personaId },
        };
      },
    });
  }

  /**
   * Los hábitos elegidos: los que hoy los reciben siguen y se suman los elegidos (CMP-D7). Lo no elegido queda como estaba:
   * el toque no sabe qué vio la persona (un interruptor de «Quién ve qué» da una sola cosa), así que no dice «no» por ella.
   */
  private async darLosHabitos(tx: Tx, p: { personaId: string; elegidos: readonly LoQueSeComparte[]; procedencia: Procedencia; momento: Date; auditar: (tipo: string, id: string) => Promise<void> }): Promise<void> {
    const elegidos = p.elegidos.flatMap((i) => (i.tipo === 'HABITS' ? [i.profesionalId] : []));
    if (elegidos.length === 0) return;
    const [vigente, profesionales] = await Promise.all([autorizacionDeHabitosVigente(tx, p.personaId), profesionalesDeLaPersona(tx, p.personaId)]);
    const renglones = habitosAlCompartir({ profesionales, anteriores: vigente?.fila.estado === 'ACTIVA' ? vigente.renglones : null, elegidos, declinados: [], ahora: p.momento.toISOString() });
    const texto = VERSION_VIGENTE.HABITOS_COMPARTIDOS;
    const fila = await agregarVersionDeAutorizacion(tx, { personaId: p.personaId, anterior: vigente?.fila ?? null, estado: 'ACTIVA', texto: { id: texto.id, hash: texto.hash }, renglones, procedencia: p.procedencia, momento: p.momento });
    // Quien había pedido verlos y ahora los recibe: su pedido queda aceptado (D-25), como en API-HBT-03.
    await aceptarLosPedidosDeQuienesLosReciben(tx, { personaId: p.personaId, renglones, procedencia: p.procedencia, momento: p.momento });
    await p.auditar('AutorizacionDeHabitos', fila.id);
  }

  /** Lo de otras áreas elegido: solo esos pares, sin extender en silencio lo que ya estaba (CMP-D7). */
  private async darLoDeOtrasAreas(tx: Tx, p: { personaId: string; elegidos: readonly LoQueSeComparte[]; procedencia: Procedencia; momento: Date; auditar: (tipo: string, id: string) => Promise<void> }): Promise<void> {
    const pares = p.elegidos.flatMap((i) => (i.tipo === 'SUMMARY' ? [{ profesionalId: i.profesionalId, area: i.area, nivel: i.nivel }] : []));
    if (pares.length === 0) return;
    const [vigente, { componentes }] = await Promise.all([autorizacionDeResumenesVigente(tx, p.personaId), componentesParaResumenes(tx, p.personaId)]);
    const activa = vigente !== null && vigente.fila.estado === 'ACTIVA' ? vigente : null;
    const anteriores = activa ? renglonesVigentes(activa.renglones, componentes) : [];
    const renglones = renglonesAlCompartir({ componentes, anteriores, elegidos: pares, ahora: p.momento.toISOString() });
    const textos = textosDeLaVersion(activa ? activa.aceptados : null, textosDeLosResumenesElegidos(pares, TEXTOS_PARA_COMPARTIR));
    const fila = await agregarVersionDeAutorizacionDeResumenes(tx, { personaId: p.personaId, anterior: vigente?.fila ?? null, estado: 'ACTIVA', textos, renglones, procedencia: p.procedencia, momento: p.momento });
    // Compartir el plan de un área con quien lo había pedido acepta su pedido (TB-56), como en API-RES-02.
    await aceptarLosPedidosDeQuienesVenElPlan(tx, { personaId: p.personaId, renglones, procedencia: p.procedencia, momento: p.momento });
    await p.auditar('AutorizacionDeResumenes', fila.id);
  }

  // ─── API-CMP-03 · dejar de compartir una cosa ────────────────────────────────────────────────
  /** Sin el A3 y sin la versión de lo que se vio: retirar siempre se puede (RNF-PRI-002). Dos veces, lo mismo. */
  retirar(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-CMP-03',
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: DejarDeCompartirUnaCosaRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        const personaId = actor.identidadId;
        const k = leerClave(pedido.key);
        if (k === null || (k.tipo !== 'SUMMARY' && k.tipo !== 'HABITS')) throw errores.solicitudInvalida([{ code: 'INVALID_VALUE', path: 'key' }]);
        // Un profesional que nunca la acompañó (ajeno o inexistente): el mismo 404.
        const recurso = { tipo: 'Identidad', id: k.profesionalId };
        const conVinculo = await tx.vinculo.findFirst({ where: { profesionalId: k.profesionalId, asesoradoId: personaId }, select: { id: true } });
        if (!conVinculo) throw this.ejecutor.noRevelable({ operacion: 'API-CMP-03', actorId: personaId, recurso }, ctx);
        const retirado = k.tipo === 'SUMMARY' ? await this.retirarLoDeUnArea(tx, personaId, k.profesionalId, k.area, procedencia) : await this.retirarLosHabitos(tx, personaId, k.profesionalId, procedencia);
        return {
          estadoHttp: 200,
          cuerpo: { data: { key: pedido.key, withdrawn: retirado !== null, withdrawnAt: retirado?.momento.toISOString() ?? null } },
          sujetoId: personaId,
          recurso: retirado ? { tipo: retirado.tipo, id: retirado.id } : { tipo: RECURSO, id: personaId },
        };
      },
    });
  }

  /** Lo de un área con un profesional: una versión nueva sin ese par; si no queda nada, retirada. `null` si no se compartía. */
  private async retirarLoDeUnArea(tx: Tx, personaId: string, profesionalId: string, area: Alcance, procedencia: Procedencia): Promise<{ tipo: string; id: string; momento: Date } | null> {
    await tomarLaAutorizacionDeResumenes(tx, personaId, 'escribir');
    const [vigente, { componentes }] = await Promise.all([autorizacionDeResumenesVigente(tx, personaId), componentesParaResumenes(tx, personaId)]);
    if (!vigente || vigente.fila.estado !== 'ACTIVA' || !vigente.aceptados) return null;
    const antes = renglonesVigentes(vigente.renglones, componentes);
    if (!antes.some((r) => r.profesionalId === profesionalId && r.area === area)) return null;
    // La hora de la base con el cerrojo tomado: una lectura que estaba en curso terminó antes.
    const momento = await momentoDeLaBase(tx);
    const quedan = renglonesSinElPar(antes, componentes, profesionalId, area);
    const fila =
      quedan.length === 0
        ? await agregarVersionDeAutorizacionDeResumenes(tx, { personaId, anterior: vigente.fila, estado: 'RETIRADA', textos: null, renglones: [], procedencia, momento })
        : await agregarVersionDeAutorizacionDeResumenes(tx, { personaId, anterior: vigente.fila, estado: 'ACTIVA', textos: vigente.aceptados, renglones: quedan, procedencia, momento });
    return { tipo: 'AutorizacionDeResumenes', id: fila.id, momento };
  }

  /** Los hábitos con un profesional: los demás siguen; si no queda nadie, retirada. `null` si no los recibía. */
  private async retirarLosHabitos(tx: Tx, personaId: string, profesionalId: string, procedencia: Procedencia): Promise<{ tipo: string; id: string; momento: Date } | null> {
    await tomarLaAutorizacionDeHabitos(tx, personaId, 'escribir');
    const [vigente, profesionales] = await Promise.all([autorizacionDeHabitosVigente(tx, personaId), profesionalesDeLaPersona(tx, personaId)]);
    if (!vigente || vigente.fila.estado !== 'ACTIVA' || !vigente.renglones) return null;
    const vivos = new Set(profesionales.flatMap((p) => p.componentes.map((c) => c.alcanceDeVinculoId)));
    if (!vigente.renglones.some((r) => r.profesionalId === profesionalId && r.incluido && vivos.has(r.alcanceDeVinculoId))) return null;
    const momento = await momentoDeLaBase(tx);
    const renglones = habitosSinElProfesional({ profesionales, anteriores: vigente.renglones, profesionalId, ahora: momento.toISOString() });
    const texto = vigente.fila.versionDeTextoId && vigente.fila.hashDelTexto ? { id: vigente.fila.versionDeTextoId, hash: vigente.fila.hashDelTexto } : null;
    const fila =
      renglones === null || texto === null
        ? await agregarVersionDeAutorizacion(tx, { personaId, anterior: vigente.fila, estado: 'RETIRADA', texto: null, renglones: [], procedencia, momento })
        : await agregarVersionDeAutorizacion(tx, { personaId, anterior: vigente.fila, estado: 'ACTIVA', texto, renglones, procedencia, momento });
    return { tipo: 'AutorizacionDeHabitos', id: fila.id, momento };
  }
}

/** Si el componente de vínculo es de la persona (cualquiera sea su estado). */
async function esDeLaPersona(tx: Tx, personaId: string, componenteId: string): Promise<boolean> {
  const fila = await tx.alcanceDeVinculo.findFirst({ where: { id: componenteId, vinculo: { asesoradoId: personaId } }, select: { id: true } });
  return fila !== null;
}
