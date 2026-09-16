import { DynamicModule, Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import type { Entorno } from './config/entorno';
import { ENTORNO, VERSION } from './config/tokens';
import type { VersionDesplegada } from './config/version';
import { DIRECTORIO_MIGRACIONES } from './health/health.service';
import { HealthModule } from './health/health.module';
import { RecursoNoEncontradoFilter } from './http/recurso-no-encontrado.filter';
import { PrismaModule } from './prisma/prisma.module';

export interface OpcionesApp {
  readonly entorno: Entorno;
  readonly version: VersionDesplegada;
  readonly directorioMigraciones: string;
}

@Global()
@Module({})
class ConfiguracionModule {
  static con(opciones: OpcionesApp): DynamicModule {
    return {
      module: ConfiguracionModule,
      providers: [
        { provide: ENTORNO, useValue: opciones.entorno },
        { provide: VERSION, useValue: opciones.version },
        { provide: DIRECTORIO_MIGRACIONES, useValue: opciones.directorioMigraciones },
      ],
      exports: [ENTORNO, VERSION, DIRECTORIO_MIGRACIONES],
    };
  }
}

/** Monolito modular (07 CAND-07-A). WP-01: solo salud; los módulos de dominio llegan por paquete. */
@Module({})
export class AppModule {
  static con(opciones: OpcionesApp): DynamicModule {
    return {
      module: AppModule,
      imports: [ConfiguracionModule.con(opciones), PrismaModule, HealthModule],
      providers: [{ provide: APP_FILTER, useClass: RecursoNoEncontradoFilter }],
    };
  }
}
