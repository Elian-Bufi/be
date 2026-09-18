import { DynamicModule, Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import type { Entorno } from './config/entorno';
import { ENTORNO, VERSION } from './config/tokens';
import type { VersionDesplegada } from './config/version';
import { ConsentimientoModule } from './consentimiento/consentimiento.module';
import { DIRECTORIO_MIGRACIONES } from './health/health.service';
import { HealthModule } from './health/health.module';
import { FiltroDeErrores } from './http/filtro-de-errores';
import { IdentidadModule } from './identidad/identidad.module';
import { PlataformaModule } from './plataforma/plataforma.module';
import { PrismaModule } from './prisma/prisma.module';
import { SesionModule } from './sesion/sesion.module';

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

/** Monolito modular (07 CAND-07-A). WP-01: salud. WP-02: identidad, sesiones y requisito A3 (solo lectura). */
@Module({})
export class AppModule {
  static con(opciones: OpcionesApp): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfiguracionModule.con(opciones),
        PrismaModule,
        PlataformaModule,
        HealthModule,
        SesionModule,
        IdentidadModule,
        ConsentimientoModule,
      ],
      // 09v7 T16: todo error sale como ErrorEnvelope, sin detalle interno (DL-005).
      providers: [{ provide: APP_FILTER, useClass: FiltroDeErrores }],
    };
  }
}
