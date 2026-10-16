import { Body, Controller, Headers, HttpCode, Inject, Post, Req } from '@nestjs/common';
import { CorridaDeRecordatoriosRequestSchema } from '@be/domain';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { RecordatoriosService } from './recordatorios.service';

/** Compara sin revelar por el tiempo cuánto del secreto coincide: las dos huellas tienen siempre el mismo largo. */
export function mismoSecreto(recibido: string, esperado: string): boolean {
  const a = createHash('sha256').update(recibido, 'utf8').digest();
  const b = createHash('sha256').update(esperado, 'utf8').digest();
  return timingSafeEqual(a, b);
}

/**
 * La ruta interna que llama la tarea programada de la plataforma (07 §24: «un cron administrado de la plataforma llamando
 * un endpoint interno idempotente»; DL-133). Fuera de `/api/v1`, como las señales de salud: no es parte del contrato de
 * los clientes ni del OpenAPI.
 * - Exige `Authorization: Bearer <BE_SECRETO_DE_TAREAS>`. Sin el secreto configurado, o con otro, responde el mismo 404
 *   que una ruta inexistente: no revela que existe.
 * - Repetirla no duplica nada: cada recordatorio es único por persona, tipo, día y franja.
 */
@Controller('internal')
export class TareasController {
  constructor(
    @Inject(ENTORNO) private readonly entorno: Entorno,
    private readonly recordatorios: RecordatoriosService,
  ) {}

  @Post('reminder-runs')
  @HttpCode(200)
  correr(@Headers('authorization') autorizacion: string | undefined, @Body() cuerpo: unknown, @Req() req: SolicitudConContexto): Promise<unknown> {
    const secreto = this.entorno.secretoDeTareas;
    if (!secreto || !autorizacion || !mismoSecreto(autorizacion, `Bearer ${secreto}`)) throw errores.recursoNoEncontrado();
    const pedido = validarCuerpo(CorridaDeRecordatoriosRequestSchema, cuerpo);
    return this.recordatorios.correr(pedido.slot ?? null, contextoDe(req));
  }
}
