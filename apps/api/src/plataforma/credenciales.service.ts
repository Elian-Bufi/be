import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { hash, verify } from '@node-rs/bcrypt';
import { randomBytes } from 'node:crypto';
import { ENTORNO } from '../config/tokens';
import type { Entorno } from '../config/entorno';

/**
 * Credencial local (08 §24.2): «hash adaptativo (bcrypt costo 10 — se conserva como mínimo), nunca en claro, nunca en logs».
 * Hash señuelo: cuando no hay credencial que comparar (identificador inexistente o credencial suprimida al cierre)
 * se compara igual contra un hash del mismo costo, para que todas las ramas del login hagan el mismo trabajo
 * (TEST-AUTH-001; DEUDA_LEGAJO DL-014).
 */
@Injectable()
export class CredencialesService implements OnModuleInit {
  private senuelo = '';

  constructor(@Inject(ENTORNO) private readonly entorno: Entorno) {}

  async onModuleInit(): Promise<void> {
    this.senuelo = await hash(randomBytes(24).toString('base64url'), this.entorno.costoBcrypt);
  }

  generarHash(credencial: string): Promise<string> {
    return hash(credencial, this.entorno.costoBcrypt);
  }

  /** Siempre ejecuta exactamente una verificación bcrypt; `null` compara contra el señuelo y devuelve false. */
  async verificar(credencial: string, hashGuardado: string | null): Promise<boolean> {
    const coincide = await verify(credencial, hashGuardado ?? this.senuelo);
    return hashGuardado !== null && coincide;
  }
}
