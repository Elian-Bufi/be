import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { hash, verify } from '@node-rs/bcrypt';
import { randomBytes } from 'node:crypto';
import { ENTORNO } from '../config/tokens';
import type { Entorno } from '../config/entorno';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Credencial local (08 §24.2): «hash adaptativo (bcrypt costo 10 — se conserva como mínimo), nunca en claro, nunca en logs».
 * Hash señuelo: cuando no hay credencial que comparar (identificador inexistente o credencial suprimida al cierre)
 * se compara igual contra un hash del mismo costo, para que todas las ramas del login hagan el mismo trabajo
 * (TEST-AUTH-001; DEUDA_LEGAJO DL-014).
 * El costo del señuelo es el de los hashes guardados (el más frecuente), no el configurado: si BCRYPT_COST sube, los
 * hashes viejos conservan su costo y un señuelo más caro haría que el tiempo delatara qué cuentas existen.
 */
@Injectable()
export class CredencialesService implements OnModuleInit {
  private senuelo = '';

  constructor(
    @Inject(ENTORNO) private readonly entorno: Entorno,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.senuelo = await hash(randomBytes(24).toString('base64url'), await this.costoDeLosHashesGuardados());
  }

  /** Costo más frecuente entre las credenciales guardadas (el `NN` de `$2b$NN$…`); sin datos, el configurado. */
  private async costoDeLosHashesGuardados(): Promise<number> {
    try {
      const [fila] = await this.prisma.$queryRaw<{ costo: string }[]>`
        SELECT substring("hash" from 5 for 2) AS "costo" FROM "credencial_local"
         GROUP BY 1 ORDER BY count(*) DESC, 1 DESC LIMIT 1`;
      const costo = Number(fila?.costo);
      return Number.isInteger(costo) && costo >= 4 && costo <= 31 ? costo : this.entorno.costoBcrypt;
    } catch {
      return this.entorno.costoBcrypt;
    }
  }

  generarHash(credencial: string): Promise<string> {
    return hash(credencial, this.entorno.costoBcrypt);
  }

  /** Siempre ejecuta exactamente una verificación bcrypt; `null` compara contra el señuelo y devuelve false. */
  async verificar(credencial: string, hashGuardado: string | null): Promise<boolean> {
    const coincide = await verify(credencial, hashGuardado ?? this.senuelo);
    return hashGuardado !== null && coincide;
  }

  /** Solo para pruebas: el costo con el que se generó el señuelo. */
  costoDelSenuelo(): number {
    return Number(this.senuelo.slice(4, 6));
  }
}
