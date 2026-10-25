import { normalizarIdentificadorLocal, codigoEnGrupos, VIGENCIA_DEL_CODIGO_DE_INCORPORACION_MS, type Procedencia } from '@be/domain';
import type { Prisma, PrismaClient } from '@prisma/client';
import { revocarSesiones } from '../sesion/sesion.service';
import { codigoAlAzar, huellaDeIncorporacion } from './segundo-factor';

/**
 * UC-ADM-01 y UC-ADM-03 (WP-ADMINISTRACION, D-3; DL-155): lo que hace el operador con el comando interno, nunca por HTTP ni
 * al arrancar la API. Cada operación es una transacción auditada, con el operador declarado y su fundamento:
 * - **incorporar**: asigna el rol a una identidad ya registrada y limpia (no profesional, sin vínculos, solicitudes ni
 *   invitaciones), revoca sus sesiones comunes y emite un código de incorporación (24 h, un solo uso);
 * - **restablecer el segundo factor**: si se perdieron el autenticador y los códigos, revoca todo lo del segundo factor y
 *   las sesiones, y emite un código nuevo. No hay un modo sin segundo factor: sin configurarlo, no hay acceso;
 * - **retirar**: el rol deja de estar vigente, con lo mismo revocado.
 * El código se devuelve una sola vez para que el comando lo muestre en la terminal del operador; la base guarda su huella.
 */
export class ErrorDeComando extends Error {}

const PROCEDENCIA = (operacion: string): Procedencia => ({ fuente: 'PROPIA', casoDeUso: operacion === 'CMD-ADM-INCORPORAR' ? 'UC-ADM-01' : 'UC-ADM-03', operacion, superficie: null, requestId: null });

export interface DatosDelOperador {
  readonly correo: string;
  readonly fundamento: string;
  readonly operador: string;
}

export interface CodigoEmitido {
  readonly identidadId: string;
  /** El código para mostrar, en grupos. No se guarda. */
  readonly codigo: string;
  readonly venceEn: Date;
}

function textos(d: DatosDelOperador): { correo: string; fundamento: string; operador: string } {
  const correo = normalizarIdentificadorLocal(d.correo ?? '');
  const fundamento = (d.fundamento ?? '').trim();
  const operador = (d.operador ?? '').trim();
  if (!correo.includes('@')) throw new ErrorDeComando('Falta el correo de la cuenta (--correo).');
  if (fundamento.length < 1 || fundamento.length > 1000) throw new ErrorDeComando('Falta el fundamento (--fundamento), de 1 a 1000 caracteres.');
  if (operador.length < 1 || operador.length > 120) throw new ErrorDeComando('Falta quién corre el comando (--operador), de 1 a 120 caracteres.');
  return { correo, fundamento, operador };
}

async function identidadDe(tx: Prisma.TransactionClient, correo: string): Promise<{ identidadId: string; estado: string }> {
  const metodo = await tx.metodoDeAcceso.findUnique({ where: { tipo_referencia: { tipo: 'LOCAL', referencia: correo } }, select: { identidadId: true } });
  if (!metodo) throw new ErrorDeComando('No hay una cuenta con ese correo. La persona tiene que crearla primero con el alta del website.');
  // La identidad, en modo exclusivo: un inicio de sesión común simultáneo queda antes (y se revoca) o después (y se rechaza).
  const [fila] = await tx.$queryRaw<{ estado: string }[]>`
    SELECT "estado_operativo_de_cuenta"::text AS "estado" FROM "identidad" WHERE "id" = ${metodo.identidadId}::uuid FOR NO KEY UPDATE`;
  if (!fila) throw new ErrorDeComando('No hay una cuenta con ese correo.');
  return { identidadId: metodo.identidadId, estado: fila.estado };
}

async function emitirCodigo(tx: Prisma.TransactionClient, identidadId: string, motivo: 'INCORPORACION' | 'RESTABLECIMIENTO', fundamento: string, operador: string, operacion: string, ahora: Date): Promise<CodigoEmitido> {
  await tx.codigoDeIncorporacion.updateMany({ where: { identidadId, momentoDeUso: null, momentoDeAnulacion: null }, data: { momentoDeAnulacion: ahora } });
  const normalizado = codigoAlAzar(20);
  const venceEn = new Date(ahora.getTime() + VIGENCIA_DEL_CODIGO_DE_INCORPORACION_MS);
  await tx.codigoDeIncorporacion.create({
    data: { identidadId, huella: huellaDeIncorporacion(normalizado), motivo, fundamento, operador, venceEn, procedencia: PROCEDENCIA(operacion) as unknown as Prisma.InputJsonValue },
  });
  return { identidadId, codigo: codigoEnGrupos(normalizado), venceEn };
}

/**
 * Todo lo del segundo factor de la identidad deja de valer: el autenticador, uno pendiente y los códigos sin usar.
 * - Primero se toman las filas de sus autenticadores (FOR UPDATE): si una confirmación de API-ADM-08 está activando uno en
 *   ese momento, el comando la espera y después lo ve ACTIVO y lo revoca. Sin esto, la revocación podía saltear un
 *   autenticador que se activaba al mismo tiempo (revisión de seguridad del 2026-10-25). API-ADM-07 y 08 además toman la
 *   identidad en modo compartido, que choca con el modo exclusivo de `identidadDe`.
 * - Al final se comprueba que no quedó ninguno activo ni pendiente: si quedara, el comando falla entero, en vez de decir
 *   «Listo» con un autenticador vivo.
 */
async function revocarSegundoFactor(tx: Prisma.TransactionClient, identidadId: string, ahora: Date): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "factor_totp" WHERE "identidad_id" = ${identidadId}::uuid FOR UPDATE`;
  await tx.factorTotp.updateMany({ where: { identidadId, estado: 'ACTIVO' }, data: { estado: 'REVOCADO', momentoDeBaja: ahora } });
  await tx.factorTotp.updateMany({ where: { identidadId, estado: 'PENDIENTE' }, data: { estado: 'DESCARTADO', momentoDeBaja: ahora } });
  await tx.codigoDeRecuperacion.updateMany({ where: { identidadId, momentoDeUso: null, momentoDeInvalidacion: null }, data: { momentoDeInvalidacion: ahora } });
  const quedan = await tx.factorTotp.count({ where: { identidadId, estado: { in: ['ACTIVO', 'PENDIENTE'] } } });
  if (quedan > 0) throw new ErrorDeComando('El segundo factor cambió mientras se revocaba. No se hizo nada: volvé a correr el comando.');
}

async function auditar(tx: Prisma.TransactionClient, operacion: string, identidadId: string, recursoTipo: string, recursoId: string, ahora: Date): Promise<void> {
  await tx.registroDeAuditoria.create({
    data: { operacion, resultado: 'EXITO', actorId: null, sujetoId: identidadId, recursoTipo, recursoId, superficie: null, requestId: null, momentoDeOcurrencia: ahora },
  });
}

/**
 * Incorporar un administrador. `appEnv` decide si se admiten correos reales: en `test` y `development`, solo cuentas
 * sintéticas (`@example.invalid`), como la siembra.
 */
export async function incorporarAdministrador(prisma: PrismaClient, d: DatosDelOperador & { readonly nombre: string; readonly appEnv: string }): Promise<CodigoEmitido> {
  const { correo, fundamento, operador } = textos(d);
  const nombre = (d.nombre ?? '').trim();
  if (nombre.length < 1 || nombre.length > 80) throw new ErrorDeComando('Falta el nombre con que figura en el historial (--nombre), de 1 a 80 caracteres.');
  if (d.appEnv !== 'production' && !correo.endsWith('@example.invalid')) throw new ErrorDeComando('En test y development solo se incorporan cuentas sintéticas (@example.invalid).');
  return prisma.$transaction(async (tx) => {
    const { identidadId, estado } = await identidadDe(tx, correo);
    if (estado !== 'OPERATIVA') throw new ErrorDeComando('Esa cuenta no está operativa.');
    const [f] = await tx.$queryRaw<{ rol: boolean; profesional: boolean; vinculos: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = ${identidadId}::uuid AND "estado" = 'VIGENTE') AS "rol",
             (EXISTS (SELECT 1 FROM "perfil_profesional" WHERE "identidad_id" = ${identidadId}::uuid)
               OR EXISTS (SELECT 1 FROM "verificacion_profesional" WHERE "identidad_id" = ${identidadId}::uuid)
               OR EXISTS (SELECT 1 FROM "habilitacion" WHERE "identidad_id" = ${identidadId}::uuid)) AS "profesional",
             (EXISTS (SELECT 1 FROM "solicitud_de_vinculo" WHERE "profesional_id" = ${identidadId}::uuid OR "asesorado_id" = ${identidadId}::uuid)
               OR EXISTS (SELECT 1 FROM "vinculo" WHERE "profesional_id" = ${identidadId}::uuid OR "asesorado_id" = ${identidadId}::uuid)
               OR EXISTS (SELECT 1 FROM "invitacion_de_vinculo" WHERE "profesional_id" = ${identidadId}::uuid)) AS "vinculos"`;
    if (f?.rol) throw new ErrorDeComando('Esa cuenta ya es administradora.');
    if (f?.profesional) throw new ErrorDeComando('Esa cuenta es de un profesional: una identidad administrativa es una cuenta aparte.');
    if (f?.vinculos) throw new ErrorDeComando('Esa cuenta es parte de un vínculo, una solicitud o una invitación: una identidad administrativa es una cuenta aparte.');
    const ahora = new Date();
    const rol = await tx.rolAdministrativo.create({
      data: { identidadId, nombreVisible: nombre, fundamento, operador, procedencia: PROCEDENCIA('CMD-ADM-INCORPORAR') as unknown as Prisma.InputJsonValue, momentoDeOcurrencia: ahora },
      select: { id: true },
    });
    // Desde ahora no opera como persona: sus sesiones comunes dejan de valer.
    await revocarSesiones(tx, identidadId, 'INCORPORACION_ADMINISTRATIVA', ahora);
    // Una incorporación empieza sin segundo factor: si quedara algo de una incorporación anterior (retirada), no se hereda.
    await revocarSegundoFactor(tx, identidadId, ahora);
    const emitido = await emitirCodigo(tx, identidadId, 'INCORPORACION', fundamento, operador, 'CMD-ADM-INCORPORAR', ahora);
    await auditar(tx, 'CMD-ADM-INCORPORAR', identidadId, 'RolAdministrativo', rol.id, ahora);
    return emitido;
  });
}

/** Restablecer el segundo factor de un administrador que perdió el autenticador y los códigos de recuperación. */
export async function restablecerSegundoFactor(prisma: PrismaClient, d: DatosDelOperador): Promise<CodigoEmitido> {
  const { correo, fundamento, operador } = textos(d);
  return prisma.$transaction(async (tx) => {
    const { identidadId } = await identidadDe(tx, correo);
    const rol = await tx.rolAdministrativo.findFirst({ where: { identidadId, estado: 'VIGENTE' }, select: { id: true } });
    if (!rol) throw new ErrorDeComando('Esa cuenta no es administradora.');
    const ahora = new Date();
    await revocarSegundoFactor(tx, identidadId, ahora);
    await revocarSesiones(tx, identidadId, 'SEGUNDO_FACTOR_RESTABLECIDO', ahora);
    const emitido = await emitirCodigo(tx, identidadId, 'RESTABLECIMIENTO', fundamento, operador, 'CMD-ADM-RESTABLECER', ahora);
    await auditar(tx, 'CMD-ADM-RESTABLECER', identidadId, 'RolAdministrativo', rol.id, ahora);
    return emitido;
  });
}

/** Retirar el rol: deja de ser administradora, con su segundo factor, sus códigos y sus sesiones revocados. */
export async function retirarAdministrador(prisma: PrismaClient, d: DatosDelOperador): Promise<{ readonly identidadId: string }> {
  const { correo, fundamento, operador } = textos(d);
  return prisma.$transaction(async (tx) => {
    const { identidadId } = await identidadDe(tx, correo);
    const rol = await tx.rolAdministrativo.findFirst({ where: { identidadId, estado: 'VIGENTE' }, select: { id: true } });
    if (!rol) throw new ErrorDeComando('Esa cuenta no es administradora.');
    const ahora = new Date();
    await tx.rolAdministrativo.update({ where: { id: rol.id }, data: { estado: 'RETIRADO', momentoDeRetiro: ahora, fundamentoDelRetiro: fundamento, operadorDelRetiro: operador } });
    await revocarSegundoFactor(tx, identidadId, ahora);
    await tx.codigoDeIncorporacion.updateMany({ where: { identidadId, momentoDeUso: null, momentoDeAnulacion: null }, data: { momentoDeAnulacion: ahora } });
    await revocarSesiones(tx, identidadId, 'ROL_ADMINISTRATIVO_RETIRADO', ahora);
    await auditar(tx, 'CMD-ADM-RETIRAR', identidadId, 'RolAdministrativo', rol.id, ahora);
    return { identidadId };
  });
}
