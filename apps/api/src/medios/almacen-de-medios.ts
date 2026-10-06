import type { Prisma } from '@prisma/client';
import type { Entorno } from '../config/entorno';

type Tx = Prisma.TransactionClient;

/**
 * DL-120 · dónde viven los bytes de un medio privado. El 07 §25 pide un almacenamiento de objetos compatible con S3,
 * nunca el disco del contenedor; no hay un servicio contratado, así que la implementación es `postgres`, sobre la única
 * persistencia que existe. Sobrevive a un reinicio de la API y es privada: los bytes solo salen por una ruta firmada.
 *
 * Las tres operaciones reciben la transacción del caso de uso: guardar y suprimir quedan del mismo lado que el cambio de
 * estado del medio y su auditoría (si algo falla, no queda nada a medias). Una implementación S3 guardaría antes de la
 * transacción y suprimiría después, sin cambiar a quien la usa.
 */
export interface AlmacenDeMedios {
  readonly nombre: string;
  /** Guarda los bytes procesados de un medio. Una sola vez: no se reescriben. */
  guardar(tx: Tx, medioId: string, bytes: Buffer): Promise<void>;
  /** Los bytes de un medio, o `null` si no hay (pendiente o suprimido). */
  leer(tx: Tx, medioId: string): Promise<Buffer | null>;
  /** Borra los bytes. El medio ya tiene que estar SUPRIMIDO (la base lo exige). */
  suprimir(tx: Tx, medioId: string): Promise<void>;
}

export const ALMACEN_DE_MEDIOS = Symbol('ALMACEN_DE_MEDIOS');

/** `contenido_de_medio`, en `bytea`. */
export class AlmacenDeMediosEnPostgres implements AlmacenDeMedios {
  readonly nombre = 'postgres';

  async guardar(tx: Tx, medioId: string, bytes: Buffer): Promise<void> {
    // Prisma pide un Uint8Array sobre un ArrayBuffer propio: se copia una vez.
    await tx.contenidoDeMedio.create({ data: { medioId, bytes: new Uint8Array(bytes) } });
  }

  async leer(tx: Tx, medioId: string): Promise<Buffer | null> {
    const fila = await tx.contenidoDeMedio.findUnique({ where: { medioId }, select: { bytes: true } });
    return fila ? Buffer.from(fila.bytes) : null;
  }

  async suprimir(tx: Tx, medioId: string): Promise<void> {
    await tx.contenidoDeMedio.deleteMany({ where: { medioId } });
  }
}

/** El almacenamiento que pide la configuración. `leerEntorno` ya rechazó cualquier otro valor al arrancar. */
export function almacenSegunEntorno(entorno: Entorno): AlmacenDeMedios {
  switch (entorno.mediosAlmacen) {
    case 'postgres':
      return new AlmacenDeMediosEnPostgres();
    default:
      throw new Error('BE_MEDIOS_ALMACEN solo admite «postgres»: el almacenamiento compatible con S3 no está configurado (DL-120)');
  }
}
