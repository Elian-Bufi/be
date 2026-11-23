import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import { CAPACIDAD_TIPOS_DE_SERIE, capacidadesDeclaradas, HEADER_DE_CAPACIDADES } from '@be/domain';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';

/**
 * DL-178 · el tipo de serie (`setKind`) sale explícito solo para quien lo sabe leer.
 *
 * Las lecturas de Entrenamiento arman cada serie con su tipo, `WORKING` incluido (`lectura-entrenamiento.ts`,
 * `lectura-por-serie.ts`). Un cliente que no declara `training-set-kinds-1` en `X-BE-Capabilities` —la APK instalada hasta
 * la candidata que lo declare— valida esas respuestas con esquemas estrictos y rechazaría el campo. A él se le saca, en el
 * borde y en ningún otro lado: así los cálculos de adentro siempre ven el tipo, y lo que recibe esa APK es exactamente lo
 * de antes (DL-152). Desde DL-196 un plan con calentamiento también le llega (ya no se retiene por la versión de la app):
 * sin el campo, sus series de calentamiento se ven como las demás. Todos usan la última APK, que lo declara.
 *
 * `setKind` es un nombre propio de DL-178: ninguna otra respuesta lo usa, así que sacarlo de todo el cuerpo no toca nada más.
 */
@Injectable()
export class SinTipoDeSerieInterceptor implements NestInterceptor {
  intercept(contexto: ExecutionContext, siguiente: CallHandler): Observable<unknown> {
    const req = contexto.switchToHttp().getRequest<Request>();
    if (capacidadesDeclaradas(req.get(HEADER_DE_CAPACIDADES)).has(CAPACIDAD_TIPOS_DE_SERIE)) return siguiente.handle();
    return siguiente.handle().pipe(map(sinTipoDeSerie));
  }
}

/** Una copia del cuerpo sin ninguna clave `setKind`. Lo que no es objeto ni lista queda igual. */
export function sinTipoDeSerie(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(sinTipoDeSerie);
  if (valor === null || typeof valor !== 'object' || valor instanceof Date || Buffer.isBuffer(valor)) return valor;
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(valor)) if (k !== 'setKind') r[k] = sinTipoDeSerie(v);
  return r;
}
