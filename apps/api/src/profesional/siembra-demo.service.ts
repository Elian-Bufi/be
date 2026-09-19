import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { normalizarIdentificadorLocal } from '@be/domain';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { PrismaService } from '../prisma/prisma.service';
import { VerificacionService } from './verificacion.service';

/**
 * Siembra de profesionales de demostración (DEUDA_LEGAJO DL-036). Solo con `APP_ENV` test o development y solo para
 * correos `example.invalid` declarados en `BE_DEMO_PROFESIONALES` (lo valida la configuración).
 *
 * Las cuentas no las crea este servicio: se registran por la API pública, igual que cualquier persona, y su contraseña
 * queda solo en `.env.cuentas-demo`. Al arrancar, a cada cuenta ya registrada le aplica el servicio interno de
 * verificación: perfil profesional, alcance VERIFICADO y habilitación CONCEDIDA. Es idempotente.
 * El log solo dice cuántas preparó: nunca correos (08 §30).
 */
@Injectable()
export class SiembraDemoService implements OnApplicationBootstrap {
  log: (linea: string) => void = (l) => process.stdout.write(`${l}\n`);

  constructor(
    @Inject(ENTORNO) private readonly entorno: Entorno,
    private readonly prisma: PrismaService,
    private readonly verificacion: VerificacionService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.entorno.demoProfesionales.length === 0) return;
    if (this.entorno.appEnv !== 'test' && this.entorno.appEnv !== 'development') return;
    let preparadas = 0;
    for (const p of this.entorno.demoProfesionales) {
      const metodo = await this.prisma.metodoDeAcceso.findUnique({
        where: { tipo_referencia: { tipo: 'LOCAL', referencia: normalizarIdentificadorLocal(p.correo) } },
        select: { identidadId: true, identidad: { select: { estadoOperativoDeCuenta: true } } },
      });
      if (!metodo || metodo.identidad.estadoOperativoDeCuenta !== 'OPERATIVA') continue;
      await this.prisma.$transaction((tx) =>
        this.verificacion.prepararProfesional(tx, metodo.identidadId, { alcance: p.alcance, tipo: p.tipo, nombreVisible: p.nombreVisible }, new Date()),
      );
      preparadas++;
    }
    this.log(JSON.stringify({ nivel: 'info', evento: 'siembra_demo_profesionales', declaradas: this.entorno.demoProfesionales.length, preparadas }));
  }
}
