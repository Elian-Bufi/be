import { Injectable } from '@nestjs/common';
import {
  ACTOS_DEL_REGISTRO,
  CAPACIDAD_TEXTOS_VIGENTES,
  CodigoDeError,
  RegistrarIdentidadRequestSchema,
  TipoDeTexto,
  VERSION_VIGENTE,
  identificadorLocalValido,
  nombreVisibleValido,
  normalizarIdentificadorLocal,
  problemaDelNombre,
  problemaDeCredencialLocal,
  problemaDeMayoriaDeEdad,
  versionAceptableEnElAlta,
  type DeclaracionDeMayoriaDeEdad,
  type RegistrarIdentidadResponse,
  type RegistrationIntent,
  type TipoDeActoRegistrable,
  type ValidationIssue,
} from '@be/domain';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { CredencialesService } from '../plataforma/credenciales.service';
import { AMBITO_PUBLICO, IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { bloquearCorreoDeAcceso, metodosDelCorreo } from './correo-de-acceso';

const OPERACION = 'API-ACC-01';

/** El método con que nace la identidad: el local, con el hash de su credencial, o la cuenta de Google ya verificada. */
export type MetodoDelAlta =
  | { readonly tipo: 'LOCAL'; readonly identificador: string; readonly hash: string }
  | { readonly tipo: 'GOOGLE'; readonly sub: string; readonly correo: string };

/** Los actos que toda alta presenta, con la versión que la pantalla mostró (08 §12.2). */
interface ActosPresentados {
  readonly termsAcceptance: { readonly versionId: string };
  readonly privacyAcknowledgement: { readonly versionId: string };
  readonly adultDeclaration?: DeclaracionDeMayoriaDeEdad;
}

/**
 * 08 §12.2 / 09 §31.2.5: la versión mostrada debe ser la vigente (desde UF-T57, o la que la vigente reemplaza, para un
 * cliente con `CAPACIDAD_TEXTOS_VIGENTES`: `versionAceptableEnElAlta`). Devuelve las versiones de los términos y de la
 * privacidad que se mostraron, con las que quedan los actos. Y la declaración de mayoría de edad (08 §24.7 a;
 * DL-138), marcada y con la versión vigente. Sin ella no hay alta:
 * - `faltante: 'CLIENTE_ANTERIOR'` (API-ACC-01): un cuerpo sin la declaración es el de un cliente anterior a DL-138, que
 *   no muestra la casilla; responde el código que esos clientes ya traducen a «actualizá la app» (DL-138, D-9).
 * - `faltante: 'ESTRICTO'` (API-GOO-03, sin clientes anteriores): 422 VALIDATION_FAILED con el issue preciso.
 */
export function validarActosDelAlta(solicitud: ActosPresentados, faltante: 'CLIENTE_ANTERIOR' | 'ESTRICTO', capacidades: ReadonlySet<string> = new Set()): VersionesDelAlta {
  const conCapacidad = capacidades.has(CAPACIDAD_TEXTOS_VIGENTES);
  const terminos = versionAceptableEnElAlta(TipoDeTexto.TERMINOS, solicitud.termsAcceptance.versionId, conCapacidad);
  if (!terminos) throw errores.versionDeTerminosNoAceptable();
  const privacidad = versionAceptableEnElAlta(TipoDeTexto.PRIVACIDAD_INFO, solicitud.privacyAcknowledgement.versionId, conCapacidad);
  if (!privacidad) throw errores.versionDePrivacidadNoAceptable();
  switch (problemaDeMayoriaDeEdad(solicitud.adultDeclaration)) {
    case 'FALTA':
      throw faltante === 'CLIENTE_ANTERIOR' ? errores.mayoriaDeEdadAusente() : errores.mayoriaDeEdadRequerida('adultDeclaration');
    case 'SIN_DECLARAR':
      throw errores.mayoriaDeEdadRequerida('adultDeclaration.declared');
    case 'VERSION_NO_VIGENTE':
      throw errores.versionDeMayoriaDeEdadNoAceptable();
    case null:
      return { TERMINOS: terminos, PRIVACIDAD_INFO: privacidad };
  }
}

/** Las versiones de los términos y de la privacidad que mostró el alta: con ellas quedan los actos A1 y A2 (UF-T57). */
export type VersionesDelAlta = Readonly<Record<'TERMINOS' | 'PRIVACIDAD_INFO', string>>;

/**
 * DL-169 (UF-01, UF-D1): el nombre con que nace la cuenta, ya normalizado. Sin `profile.displayName` el cuerpo es el de un
 * cliente anterior: 422 TERMS_VERSION_NOT_ACCEPTABLE (`nombreAusente`), que esos clientes traducen a «actualizá la app».
 * En blanco o con algo que no se puede guardar, 422 VALIDATION_FAILED con el issue del campo. Lo usan API-ACC-01 y
 * API-GOO-03.
 */
export function validarNombreDelAlta(perfil: { readonly displayName?: string } | undefined): string {
  const nombre = perfil?.displayName;
  if (nombre === undefined) throw errores.nombreAusente();
  const problema = problemaDelNombre(nombre);
  if (problema) throw errores.nombreDelAlta(problema);
  return nombreVisibleValido(nombre)!;
}

/** La falta de una versión sembrada en la base se responde como la versión no vigente de ese acto. */
const VERSION_FALTANTE: Readonly<Record<TipoDeActoRegistrable, () => ErrorDeApi>> = {
  TERMINOS: errores.versionDeTerminosNoAceptable,
  PRIVACIDAD_INFO: errores.versionDePrivacidadNoAceptable,
  MAYORIA_DE_EDAD: errores.versionDeMayoriaDeEdadNoAceptable,
  DATOS_SALUD_BE: errores.interno,
};

/**
 * UC-P25 — Registrar identidad BE y perfil propio (API-ACC-01, 09v8 §4).
 * En una sola transacción (REQUIRED_SAME_TX): Identidad OPERATIVA + Perfil propio con su nombre (versión 1, DL-169) +
 * control de sesión + método LOCAL
 * + credencial + A1 (TERMINOS) + A2 (PRIVACIDAD_INFO) + la declaración de mayoría de edad (DL-138) + eventos
 * IdentidadCreada/MetodoDeAccesoAsociado + auditoría.
 * No crea sesión, ni A3, ni rol, especialidad, vínculo o autorización (09v8 §2.2; 06:2013).
 * Unicidad del identificador: la garantiza el índice `metodo_de_acceso_tipo_referencia_key`, y entre métodos de distinto
 * tipo el cerrojo por correo y su disparador (DL-138: un correo de una cuenta creada con Google tampoco se registra otra
 * vez). La búsqueda previa es solo un atajo — bajo concurrencia decide la base (P2002 → 409 neutral).
 */
@Injectable()
export class RegistroService {
  constructor(
    private readonly idempotencia: IdempotenciaService,
    private readonly credenciales: CredencialesService,
    private readonly auditoria: AuditoriaService,
    private readonly limitador: LimitadorService,
  ) {}

  async registrar(cuerpo: unknown, claveDeIdempotencia: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    if (!IdempotenciaService.claveValida(claveDeIdempotencia)) {
      throw errores.solicitudInvalida([{ code: 'IDEMPOTENCY_KEY_REQUIRED', path: 'Idempotency-Key' }], { header: 'Idempotency-Key' });
    }
    const solicitud = validarCuerpo(RegistrarIdentidadRequestSchema, cuerpo);
    this.limitador.consumir('registro', ctx.direccionIp);

    const identificador = normalizarIdentificadorLocal(solicitud.identity.localIdentifier);
    const issues: ValidationIssue[] = [];
    if (!identificadorLocalValido(identificador)) issues.push({ code: 'INVALID_LOCAL_IDENTIFIER', path: 'identity.localIdentifier' });
    const problema = problemaDeCredencialLocal(solicitud.identity.localCredential);
    if (problema) issues.push({ code: problema, path: 'identity.localCredential' });
    if (issues.length > 0) throw errores.solicitudInvalida(issues);

    const versiones = validarActosDelAlta(solicitud, 'CLIENTE_ANTERIOR', ctx.capacidades);
    const nombreVisible = validarNombreDelAlta(solicitud.profile);

    // Siempre se calcula el hash, exista o no el identificador: trabajo equivalente en ambas ramas (DL-010).
    const hash = await this.credenciales.generarHash(solicitud.identity.localCredential);
    // Huella del request lógico SIN la credencial (DL-026).
    const huella = IdempotenciaService.huella({
      registrationIntent: solicitud.registrationIntent,
      identificador,
      profile: solicitud.profile ?? {},
      terminos: solicitud.termsAcceptance.versionId,
      privacidad: solicitud.privacyAcknowledgement.versionId,
      mayoriaDeEdad: solicitud.adultDeclaration?.versionId ?? null,
    });

    try {
      return await this.idempotencia.ejecutar(
        { operacion: OPERACION, ambito: AMBITO_PUBLICO, clave: claveDeIdempotencia, huella },
        async (tx) => {
          // El correo puede ser el de una cuenta local o el de una creada con Google (DL-138): cualquiera de las dos lo deja
          // ocupado, con el mismo 409 neutral de siempre (DL-010).
          await bloquearCorreoDeAcceso(tx, identificador);
          if ((await metodosDelCorreo(tx, identificador)).length > 0) throw errores.registroNoDisponible();
          const { identidadId, momentoDeRegistro } = await this.crearIdentidad(
            tx,
            { registrationIntent: solicitud.registrationIntent, metodo: { tipo: 'LOCAL', identificador, hash }, nombreVisible, versiones },
            ctx,
            OPERACION,
          );
          const respuesta: RegistrarIdentidadResponse = {
            data: {
              identityId: identidadId,
              registrationIntent: solicitud.registrationIntent,
              accountOperationalState: 'OPERATIVA',
              createdAt: momentoDeRegistro.toISOString(),
            },
          };
          return { estadoHttp: 201, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
        },
      );
    } catch (e) {
      const error = esColisionDeIdentificador(e) ? errores.registroNoDisponible() : e;
      if (error instanceof ErrorDeApi && error.code === CodigoDeError.REGISTRATION_NOT_AVAILABLE) {
        await this.auditoria.registrar({
          operacion: OPERACION,
          resultado: 'RECHAZO',
          motivo: 'IDENTIFICADOR_NO_DISPONIBLE',
          superficie: ctx.superficie,
          requestId: ctx.requestId,
          momentoDeOcurrencia: ctx.momentoDeRecepcion,
        });
      }
      throw error;
    }
  }

  /**
   * El alta (UC-P25) dentro de `tx`, con el método con que nace la identidad: la usan API-ACC-01 (LOCAL) y API-GOO-03
   * (GOOGLE, DL-138). Identidad OPERATIVA + Perfil propio + control de sesión + el método (con su credencial, si es local)
   * + A1, A2 y la declaración de mayoría de edad como actos separados + IdentidadCreada y MetodoDeAccesoAsociado +
   * auditoría de `operacion`. Quien llama ya validó los actos (`validarActosDelAlta`) y el nombre (`validarNombreDelAlta`), y
   * tomó el cerrojo del correo. Desde DL-169 (UF-01) el perfil propio nace con su versión 1, con el nombre: no hay cuentas
   * nuevas sin nombre.
   */
  async crearIdentidad(
    tx: Prisma.TransactionClient,
    datos: { readonly registrationIntent: RegistrationIntent; readonly metodo: MetodoDelAlta; readonly nombreVisible: string; readonly versiones: VersionesDelAlta },
    ctx: ContextoDeSolicitud,
    operacion: string,
  ): Promise<{ readonly identidadId: string; readonly momentoDeRegistro: Date }> {
    const identidadId = randomUUID();
    const procedencia = procedenciaDe(ctx, 'UC-P25', operacion) as unknown as Prisma.InputJsonValue;
    // TEN-39: ocurrencia = cuándo BE recibió la confirmación; registro = cuándo lo persistió (default de la base).
    const ocurrencia = ctx.momentoDeRecepcion;

    const identidad = await tx.identidad.create({
      // 06 §5.4.2 «autoría de creación»: en autorregistro, la propia identidad.
      data: { id: identidadId, autoriaDeCreacionId: identidadId, procedencia, momentoDeOcurrencia: ocurrencia },
    });
    // INV-06-22: exactamente un Perfil propio (la base lo verifica al confirmar). Nace con el nombre visible como su versión 1
    // (DL-009, DL-040 y DL-169), con la procedencia del alta; la auditoría del alta no lo guarda.
    const perfil = await tx.perfilPropio.create({ data: { identidadId, momentoDeOcurrencia: ocurrencia } });
    const primera = await tx.versionDePerfilPropio.create({ data: { perfilPropioId: perfil.id, numero: 1, nombreVisible: datos.nombreVisible, procedencia } });
    await tx.perfilPropio.update({ where: { id: perfil.id }, data: { versionEfectivaId: primera.id } });
    await tx.controlDeSesion.create({ data: { identidadId } });
    const metodo =
      datos.metodo.tipo === 'LOCAL'
        ? await tx.metodoDeAcceso.create({
            data: { identidadId, tipo: 'LOCAL', referencia: datos.metodo.identificador, procedencia, momentoDeOcurrencia: ocurrencia },
          })
        : await tx.metodoDeAcceso.create({
            // DL-138: la referencia es el `sub` de Google; el correo verificado queda aparte, para que nadie más lo use.
            data: { identidadId, tipo: 'GOOGLE', referencia: datos.metodo.sub, correo: datos.metodo.correo, procedencia, momentoDeOcurrencia: ocurrencia },
          });
    if (datos.metodo.tipo === 'LOCAL') await tx.credencialLocal.create({ data: { metodoDeAccesoId: metodo.id, hash: datos.metodo.hash } });

    // A1, A2 y la declaración de mayoría de edad: actos separados con evidencia propia (08 §12.1-12.2; DL-138). A3 NO
    // (ACTOS_DEL_REGISTRO). A1 y A2, con la versión que mostró la pantalla (UF-T57: en la transición, la anterior).
    const mostrada = (tipo: TipoDeActoRegistrable): string => (tipo === 'TERMINOS' || tipo === 'PRIVACIDAD_INFO' ? datos.versiones[tipo] : VERSION_VIGENTE[tipo].id);
    const versiones = await tx.versionDeTexto.findMany({ where: { id: { in: ACTOS_DEL_REGISTRO.map(mostrada) } } });
    for (const tipo of ACTOS_DEL_REGISTRO) {
      const version = versiones.find((v) => v.tipo === tipo);
      if (!version) throw VERSION_FALTANTE[tipo]();
      await tx.actoRegistrable.create({
        data: {
          identidadId,
          tipo,
          versionDeTextoId: version.id,
          hashDelTexto: version.hash,
          finalidad: version.finalidad,
          superficie: ctx.superficie,
          direccionIp: ctx.direccionIp,
          agenteDeUsuario: ctx.agenteDeUsuario,
          actorId: identidadId,
          autoriaId: identidadId,
          procedencia,
          momentoDeOcurrencia: ocurrencia,
        },
      });
    }

    await tx.eventoDeDominio.create({
      data: {
        tipo: 'IdentidadCreada',
        identidadId,
        actorId: identidadId,
        autoriaId: identidadId,
        procedencia,
        estadoResultante: 'OPERATIVA',
        momentoDeOcurrencia: ocurrencia,
        // `registrationIntent` es contractual pero no es rol ni atributo de Identidad (09v8 §3.1; DL-021).
        datos: { registrationIntent: datos.registrationIntent },
      },
    });
    await tx.eventoDeDominio.create({
      data: {
        tipo: 'MetodoDeAccesoAsociado',
        identidadId,
        actorId: identidadId,
        autoriaId: identidadId,
        procedencia,
        momentoDeOcurrencia: ocurrencia,
        datos: { metodoDeAccesoId: metodo.id, tipo: datos.metodo.tipo },
      },
    });
    await this.auditoria.registrar(
      {
        operacion,
        resultado: 'EXITO',
        actorId: identidadId,
        sujetoId: identidadId,
        recursoTipo: 'Identidad',
        recursoId: identidadId,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ocurrencia,
      },
      tx,
    );
    return { identidadId, momentoDeRegistro: identidad.momentoDeRegistro };
  }
}

/**
 * P2002 sobre el método de acceso: otra transacción registró el mismo identificador (índice único), o el disparador
 * `metodo_de_acceso_sin_identidad_paralela` encontró ese correo en otra identidad (DL-138).
 */
export function esColisionDeIdentificador(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') return false;
  const meta = e.meta as { modelName?: string; target?: unknown } | undefined;
  const target = Array.isArray(meta?.target) ? meta.target.join(',') : String(meta?.target ?? '');
  return meta?.modelName === 'MetodoDeAcceso' || target.includes('referencia') || target.includes('correo');
}
