import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { PrismaService } from '../prisma/prisma.service';
import { VerificacionService } from './verificacion.service';

/**
 * Siembra de profesionales de demostración (DEUDA_LEGAJO DL-036). Desde WP-ADMINISTRACION (D-7) no pisa una decisión
 * humana: un área con una decisión de Administración queda como la dejó Administración, y una identidad administrativa
 * nunca se prepara como profesional. Una entrada con el quinto campo «PENDIENTE» presenta el área y la deja para revisar.
 * Solo con `APP_ENV` test o development, para las identidades declaradas en `BE_DEMO_PROFESIONALES` (lo valida la
 * configuración).
 *
 * Las cuentas no las crea este servicio: se registran por la API pública, igual que cualquier persona, y su contraseña
 * queda solo en `.env.cuentas-demo`. Después se declaran por su identidad. Al arrancar, a cada una le aplica el
 * servicio interno de verificación: perfil profesional, alcance VERIFICADO y habilitación CONCEDIDA. Es idempotente.
 * Solo prepara cuentas operativas y sintéticas (correo @example.invalid): una identidad real nunca queda verificada.
 * El log solo dice cuántas preparó: nunca identificadores ni correos (08 §30).
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
    // WP-ADMINISTRACION (D-7): lo que la siembra no tocó porque decidió Administración, o porque es una identidad administrativa.
    let conDecision = 0;
    let administrativas = 0;
    for (const p of this.entorno.demoProfesionales) {
      const metodo = await this.prisma.metodoDeAcceso.findFirst({
        where: { identidadId: p.identidadId, tipo: 'LOCAL' },
        select: { identidadId: true, referencia: true, identidad: { select: { estadoOperativoDeCuenta: true } } },
      });
      if (!metodo || metodo.identidad.estadoOperativoDeCuenta !== 'OPERATIVA' || !metodo.referencia.endsWith('@example.invalid')) continue;
      const resultado = await this.prisma.$transaction((tx) =>
        this.verificacion.prepararProfesional(tx, metodo.identidadId, { alcance: p.alcance, tipo: p.tipo, nombreVisible: p.nombreVisible, estadoInicial: p.estadoInicial }, new Date()),
      );
      if (resultado === 'PREPARADA') preparadas++;
      else if (resultado === 'CON_DECISION_ADMINISTRATIVA') conDecision++;
      else administrativas++;
    }
    this.log(JSON.stringify({ nivel: 'info', evento: 'siembra_demo_profesionales', declaradas: this.entorno.demoProfesionales.length, preparadas, conDecisionAdministrativa: conDecision, identidadesAdministrativas: administrativas }));
  }
}
