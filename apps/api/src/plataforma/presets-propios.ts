import { CodigoDeError, EditarHabitualRequestSchema, nombreNormalizadoDeHabitual, type EsquemaDeContrato, type SalidaDe } from '@be/domain';
import type { Prisma } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { momentoDeLaBase, sinDuplicar } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { esUuid, type EjecutorDeDominio } from './ejecutor';
import type { ResultadoIdempotente } from './idempotencia.service';

type Tx = Prisma.TransactionClient;

/** Una fila de `prescripcion_habitual` o de `reparto_habitual`: las dos tienen la misma forma, con su contenido en `campo`. */
export interface FilaDePreset {
  readonly id: string;
  readonly profesionalId: string;
  readonly nombre: string;
  readonly nombreNormalizado: string;
  readonly estado: 'ACTIVO' | 'QUITADO';
  readonly version: number;
  readonly momentoDeRegistro: Date;
  readonly momentoDeActualizacion: Date;
  readonly [campo: string]: unknown;
}

/** Lo que el servicio usa del delegado de Prisma de cada tabla (`tx.prescripcionHabitual`, `tx.repartoHabitual`). */
interface Delegado {
  findMany(args: unknown): Promise<FilaDePreset[]>;
  findFirst(args: unknown): Promise<FilaDePreset | null>;
  findUnique(args: unknown): Promise<FilaDePreset | null>;
  create(args: unknown): Promise<FilaDePreset>;
  update(args: unknown): Promise<FilaDePreset>;
  updateMany(args: unknown): Promise<{ count: number }>;
}

/**
 * ED-13 (WP-EDITORES-PROFESIONAL; DL-167) · Los presets propios nuevos: la prescripción habitual (API-HAB-06 a 08) y el
 * reparto habitual (API-HAN-06 a 08). Las dos familias tienen las mismas reglas que las sesiones y las comidas
 * habituales (DL-109), y esta pieza las escribe una sola vez:
 * - solo el profesional del área, verificado y habilitado; lo ajeno o lo quitado es el 404 de lo inexistente;
 * - nombre único por profesional (sin mayúsculas, acentos ni espacios repetidos): guardar con un nombre en uso es 409
 *   PRESET_NAME_TAKEN, salvo que el pedido señale con `replaces` a cuál reemplaza, con su `expectedVersion`; el nombre de
 *   uno quitado lo reactiva;
 * - guardar lleva `Idempotency-Key`; renombrar o quitar, `expectedVersion`; todo queda auditado y con su evento;
 * - nada de esto lo lee la APK.
 */
export interface DefinicionDePresets<S extends EsquemaDeContrato> {
  readonly operaciones: { readonly listar: string; readonly guardar: string; readonly editar: string };
  readonly casoDeUso: string;
  readonly recurso: string;
  /** La columna del contenido (`prescripcion` o `reparto`) y su clave en la API (`prescription` o `distribution`). */
  readonly columna: string;
  readonly clave: string;
  readonly esquemaDeGuardado: S;
  readonly delegado: (tx: Tx) => Delegado;
  readonly ejecutor: () => EjecutorDeDominio;
  readonly exigirProfesional: (tx: Tx, identidadId: string) => Promise<void>;
  /** Valida el contenido como en un plan y devuelve lo que se guarda; lanza el 422 con su motivo. */
  readonly contenidoVerificado: (tx: Tx, profesionalId: string, pedido: SalidaDe<S>) => Promise<unknown>;
  readonly evento: (tx: Tx, tipo: 'GUARDADO' | 'QUITADO', actorId: string, recurso: { tipo: string; id: string }, estadoPrevio: string | null, estadoPosterior: string, procedencia: unknown, momento: Date) => Promise<void>;
  readonly nombreTomado: string;
}

const TOPE = 200;
const token = (n: number): string => `v${n}`;

export class PresetsPropios<S extends EsquemaDeContrato> {
  constructor(private readonly d: DefinicionDePresets<S>) {}

  /** La forma de la API: el identificador, la versión, el nombre, el contenido y las fechas. */
  aApi(f: FilaDePreset): Record<string, unknown> {
    return { presetId: f.id, version: token(f.version), name: f.nombre, [this.d.clave]: f[this.d.columna], createdAt: f.momentoDeRegistro.toISOString(), updatedAt: f.momentoDeActualizacion.toISOString() };
  }

  listar(actor: ActorAutenticado, ctx: ContextoDeSolicitud): Promise<{ data: Record<string, unknown>[] }> {
    return this.d.ejecutor().leer({
      operacion: this.d.operaciones.listar,
      casoDeUso: this.d.casoDeUso,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await this.d.exigirProfesional(tx, actor.identidadId);
        const filas = await this.d.delegado(tx).findMany({ where: { profesionalId: actor.identidadId, estado: 'ACTIVO' }, orderBy: [{ momentoDeActualizacion: 'desc' }, { id: 'desc' }], take: TOPE });
        return { data: filas.map((f) => this.aApi(f)) };
      },
    });
  }

  guardar(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const op = this.d.operaciones.guardar;
    return this.d.ejecutor().escribirIdempotente({
      operacion: op,
      casoDeUso: this.d.casoDeUso,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: this.d.esquemaDeGuardado,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        await this.d.exigirProfesional(tx, actor.identidadId);
        const p = pedido as { name: string; replaces?: string; expectedVersion?: string };
        const contenido = await this.d.contenidoVerificado(tx, actor.identidadId, pedido);
        const delegado = this.d.delegado(tx);
        const nombreNormalizado = nombreNormalizadoDeHabitual(p.name);
        const senalada = p.replaces !== undefined ? await this.propia(tx, actor.identidadId, p.replaces) : null;
        if (p.replaces !== undefined && !senalada) throw this.d.ejecutor().noRevelable({ operacion: op, actorId: actor.identidadId, recurso: { tipo: this.d.recurso, id: p.replaces } }, ctx);
        if (senalada && p.expectedVersion !== token(senalada.version)) throw errores.conflictoDeVersion();
        const homonima = await delegado.findUnique({ where: { profesionalId_nombreNormalizado: { profesionalId: actor.identidadId, nombreNormalizado } } });
        if (homonima && homonima.estado === 'ACTIVO' && homonima.id !== senalada?.id) throw this.nombreTomado();
        const destino = senalada ?? (homonima && homonima.estado === 'QUITADO' ? homonima : null);
        if (senalada && homonima && homonima.id !== senalada.id) await this.liberarNombre(tx, homonima);
        const momento = await momentoDeLaBase(tx);
        const datos = { nombre: p.name, nombreNormalizado, [this.d.columna]: contenido as Prisma.InputJsonValue, procedencia: procedencia as unknown as Prisma.InputJsonValue, momentoDeActualizacion: momento };
        let fila: FilaDePreset;
        if (destino) {
          // Condicionado a la versión leída: dos reemplazos simultáneos no se pisan (409).
          const r = await sinDuplicar(delegado.updateMany({ where: { id: destino.id, version: destino.version }, data: { ...datos, estado: 'ACTIVO', version: { increment: 1 } } }), () => this.nombreTomado());
          if (r.count === 0) throw errores.conflictoDeVersion();
          fila = (await delegado.findUnique({ where: { id: destino.id } })) as FilaDePreset;
        } else {
          fila = await sinDuplicar(delegado.create({ data: { profesionalId: actor.identidadId, ...datos } }), () => this.nombreTomado());
        }
        const recurso = { tipo: this.d.recurso, id: fila.id };
        await this.d.evento(tx, 'GUARDADO', actor.identidadId, recurso, destino?.estado ?? null, 'ACTIVO', procedencia, momento);
        return { estadoHttp: 201, cuerpo: { data: this.aApi(fila) }, sujetoId: null, recurso };
      },
    });
  }

  editar(actor: ActorAutenticado, presetId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const op = this.d.operaciones.editar;
    const recurso = { tipo: this.d.recurso, id: presetId };
    return this.d.ejecutor().escribir({
      operacion: op,
      casoDeUso: this.d.casoDeUso,
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: EditarHabitualRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        await this.d.exigirProfesional(tx, actor.identidadId);
        const fila = await this.propia(tx, actor.identidadId, presetId);
        if (!fila) throw this.d.ejecutor().noRevelable({ operacion: op, actorId: actor.identidadId, recurso }, ctx);
        if (pedido.expectedVersion !== token(fila.version)) throw errores.conflictoDeVersion();
        const delegado = this.d.delegado(tx);
        let nombre: { nombre: string; nombreNormalizado: string } | null = null;
        if (pedido.name !== undefined) {
          const nombreNormalizado = nombreNormalizadoDeHabitual(pedido.name);
          const homonima = await delegado.findUnique({ where: { profesionalId_nombreNormalizado: { profesionalId: actor.identidadId, nombreNormalizado } } });
          if (homonima && homonima.id !== fila.id) {
            if (homonima.estado === 'ACTIVO') throw this.nombreTomado();
            await this.liberarNombre(tx, homonima);
          }
          nombre = { nombre: pedido.name, nombreNormalizado };
        }
        const momento = await momentoDeLaBase(tx);
        const quitar = pedido.state === 'REMOVED';
        const r = await sinDuplicar(
          delegado.updateMany({ where: { id: fila.id, version: fila.version }, data: { ...(nombre ?? {}), ...(quitar ? { estado: 'QUITADO' } : {}), version: { increment: 1 }, momentoDeActualizacion: momento } }),
          () => this.nombreTomado(),
        );
        if (r.count === 0) throw errores.conflictoDeVersion();
        await this.d.evento(tx, quitar ? 'QUITADO' : 'GUARDADO', actor.identidadId, recurso, fila.estado, quitar ? 'QUITADO' : fila.estado, procedencia, momento);
        const despues = (await delegado.findUnique({ where: { id: fila.id } })) as FilaDePreset;
        return { estadoHttp: 200, cuerpo: { data: this.aApi(despues) }, sujetoId: null, recurso };
      },
    });
  }

  /** Uno propio y activo; lo ajeno, lo quitado o lo inexistente no existe para el profesional. */
  private propia(tx: Tx, profesionalId: string, presetId: string): Promise<FilaDePreset | null> {
    if (!esUuid(presetId)) return Promise.resolve(null);
    return this.d.delegado(tx).findFirst({ where: { id: presetId, profesionalId, estado: 'ACTIVO' } });
  }

  /** Un quitado que ocupa el nombre que otro va a tomar: se le corre el nombre normalizado, como en las sesiones habituales. */
  private async liberarNombre(tx: Tx, quitada: FilaDePreset): Promise<void> {
    await this.d.delegado(tx).update({ where: { id: quitada.id }, data: { nombreNormalizado: `${quitada.nombreNormalizado}\u001f${quitada.id}` } });
  }

  private nombreTomado(): ErrorDeApi {
    return new ErrorDeApi(409, CodigoDeError.PRESET_NAME_TAKEN, this.d.nombreTomado);
  }
}
