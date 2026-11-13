import { metodoVigente, type MetodoDeLaCuenta } from '@be/domain';
import type { Prisma } from '@prisma/client';

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
