import { COPY_AVISO_DE_METODO_DE_ACCESO, metodoVigente, momentoDelAviso, type CambioDeMetodoAvisado, type MetodoDeLaCuenta } from '@be/domain';
import type { Prisma } from '@prisma/client';
import type { CorreoService } from '../plataforma/correo.service';

type Cliente = Pick<Prisma.TransactionClient, 'metodoDeAcceso' | 'cambioDeMetodoDeAcceso'>;

/** Un método de la cuenta con lo que la pantalla muestra: el correo y desde cuándo vale. */
export interface MetodoLeido extends MetodoDeLaCuenta {
  /** GOOGLE: el correo de esa cuenta de Google; LOCAL: el correo de acceso (su referencia). */
  readonly correo: string | null;
  /** Desde cuándo vale: su alta o, si se volvió a vincular, la última reasociación. */
  readonly desde: Date;
  /** Cuántos retiros y reasociaciones tuvo: el número del próximo es este más uno. */
  readonly cambios: number;
}

/**
 * RF-004 (DL-172): los métodos de acceso de una identidad con su vigencia, leída de sus cambios (retiros y reasociaciones,
 * de solo agregar). Lo usan los métodos de la cuenta (API-MET-01 a 03) y el acceso con Google (API-GOO-01 a 03).
 */
export async function metodosDeLaCuenta(cliente: Cliente, identidadId: string): Promise<MetodoLeido[]> {
  const filas = await cliente.metodoDeAcceso.findMany({
    where: { identidadId },
    orderBy: [{ tipo: 'asc' }, { momentoDeRegistro: 'asc' }],
    select: {
      id: true,
      tipo: true,
      referencia: true,
      correo: true,
      momentoDeRegistro: true,
      credencialLocal: { select: { metodoDeAccesoId: true } },
      cambios: { select: { numero: true, accion: true, momentoDeRegistro: true }, orderBy: { numero: 'desc' } },
    },
  });
  return filas.map((f) => {
    const ultimo = f.cambios[0];
    return {
      id: f.id,
      tipo: f.tipo,
      referencia: f.referencia,
      vigente: metodoVigente(f.cambios.length),
      conCredencial: f.credencialLocal !== null,
      correo: f.tipo === 'LOCAL' ? f.referencia : f.correo,
      desde: ultimo?.accion === 'REASOCIACION' ? ultimo.momentoDeRegistro : f.momentoDeRegistro,
      cambios: f.cambios.length,
    };
  });
}

/** Si un método vale hoy: no tiene cambios o tiene una cantidad par (los impares son retiros). */
export async function metodoVigenteEnLaBase(cliente: Cliente, metodoId: string): Promise<boolean> {
  return metodoVigente(await cliente.cambioDeMetodoDeAcceso.count({ where: { metodoDeAccesoId: metodoId } }));
}

/**
 * REG-06-21 (revisión de DL-172): el hecho de dominio de un retiro (`MetodoDeAccesoRetirado`) o de una reasociación
 * (`MetodoDeAccesoAsociado` con `reasociacion: true`), con actor y procedencia, en la misma transacción que el cambio.
 */
export async function registrarHechoDelCambio(
  tx: Prisma.TransactionClient,
  p: { readonly identidadId: string; readonly metodoId: string; readonly accion: 'RETIRO' | 'REASOCIACION'; readonly procedencia: Prisma.InputJsonValue; readonly momento: Date },
): Promise<void> {
  await tx.eventoDeDominio.create({
    data: {
      tipo: p.accion === 'RETIRO' ? 'MetodoDeAccesoRetirado' : 'MetodoDeAccesoAsociado',
      identidadId: p.identidadId,
      actorId: p.identidadId,
      autoriaId: p.identidadId,
      procedencia: p.procedencia,
      momentoDeOcurrencia: p.momento,
      datos: p.accion === 'RETIRO' ? { metodoDeAccesoId: p.metodoId, tipo: 'GOOGLE' } : { metodoDeAccesoId: p.metodoId, tipo: 'GOOGLE', reasociacion: true },
    },
  });
}

/**
 * D-11 (revisión de DL-172): el aviso al correo de acceso de que cambió cómo se entra, después de confirmar y sin esperarlo.
 * Es de mejor esfuerzo: sin proveedor de correo no sale nada y la operación es la misma (el correo nunca la bloquea).
 */
export function avisarCambioDeMetodo(
  correo: CorreoService,
  p: { readonly para: string; readonly cambio: CambioDeMetodoAvisado; readonly correoDeGoogle: string; readonly momento: Date; readonly operacion: string; readonly requestId: string | null },
): void {
  if (!correo.activo) return;
  correo.enviarSinEsperar(
    { para: p.para, asunto: COPY_AVISO_DE_METODO_DE_ACCESO.asunto[p.cambio], texto: COPY_AVISO_DE_METODO_DE_ACCESO.texto(p.cambio, p.correoDeGoogle, momentoDelAviso(p.momento)) },
    p.operacion,
    p.requestId,
  );
}
