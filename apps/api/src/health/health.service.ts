import { Inject, Injectable } from '@nestjs/common';
import { readdirSync } from 'node:fs';
import { PrismaService } from '../prisma/prisma.service';

export const DIRECTORIO_MIGRACIONES = Symbol('DIRECTORIO_MIGRACIONES');

/** Tokens CONV-06-02. `NO_VERIFICADO`: no se pudo comprobar; la ausencia se declara. */
export type EstadoBaseDeDatos = 'OK' | 'NO_DISPONIBLE';
export type EstadoMigraciones = 'OK' | 'PENDIENTES' | 'NO_VERIFICADO';

export interface Dependencias {
  readonly baseDeDatos: EstadoBaseDeDatos;
  readonly migraciones: EstadoMigraciones;
}

export interface Readiness {
  readonly listo: boolean;
  readonly dependencias: Dependencias;
}

const TIMEOUT_BASE_DE_DATOS_MS = 2000;

function conTimeout<T>(promesa: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const limite = new Promise<never>((_, rechazar) => {
    timer = setTimeout(() => rechazar(new Error('timeout')), ms);
  });
  return Promise.race([promesa, limite]).finally(() => clearTimeout(timer));
}

/**
 * Readiness (07 §30): PostgreSQL responde (SELECT 1 con timeout corto) y todas las migraciones
 * embebidas en el artefacto están aplicadas en `_prisma_migrations`.
 * Migraciones aplicadas que el artefacto no conoce no bloquean: es el caso de un rollback de
 * aplicación sin rollback de schema (07 §39, expand→contract).
 * No incluye terceros opcionales (RF-059).
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(DIRECTORIO_MIGRACIONES) private readonly directorioMigraciones: string,
  ) {}

  async readiness(): Promise<Readiness> {
    const baseDeDatos = await this.verificarBaseDeDatos();
    const migraciones: EstadoMigraciones = baseDeDatos === 'OK' ? await this.verificarMigraciones() : 'NO_VERIFICADO';
    return { listo: baseDeDatos === 'OK' && migraciones === 'OK', dependencias: { baseDeDatos, migraciones } };
  }

  private async verificarBaseDeDatos(): Promise<EstadoBaseDeDatos> {
    try {
      await conTimeout(this.prisma.$queryRaw`SELECT 1`, TIMEOUT_BASE_DE_DATOS_MS);
      return 'OK';
    } catch {
      return 'NO_DISPONIBLE';
    }
  }

  private async verificarMigraciones(): Promise<EstadoMigraciones> {
    let embebidas: string[];
    try {
      embebidas = readdirSync(this.directorioMigraciones, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch {
      return 'NO_VERIFICADO';
    }

    try {
      const aplicadas = await conTimeout(
        this.prisma.$queryRaw<{ migration_name: string }[]>`
          SELECT migration_name FROM _prisma_migrations
          WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`,
        TIMEOUT_BASE_DE_DATOS_MS,
      );
      const nombres = new Set(aplicadas.map((m) => m.migration_name));
      return embebidas.every((m) => nombres.has(m)) ? 'OK' : 'PENDIENTES';
    } catch {
      // Sin tabla _prisma_migrations: nunca se migró esta base.
      return embebidas.length === 0 ? 'OK' : 'PENDIENTES';
    }
  }
}
