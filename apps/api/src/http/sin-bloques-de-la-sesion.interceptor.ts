import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import { CAPACIDAD_BLOQUES_DE_LA_SESION, capacidadesDeclaradas, HEADER_DE_CAPACIDADES } from '@be/domain';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';

/**
 * DL-181 (ENP-D06) · los bloques de la sesión salen solo para quien los sabe leer.
 *
 * Las lecturas de Entrenamiento arman cada sesión con `exerciseGroups` (vacío si no tiene) y cada ejercicio con
 * `exerciseGroupId` (`null` si va suelto): `lectura-entrenamiento.ts` y `lectura-por-serie.ts`. Un cliente que no declara
 * `training-session-groups-1` en `X-BE-Capabilities` —la APK instalada hasta la candidata que lo declare— valida esas
 * respuestas con esquemas estrictos y rechazaría las dos claves. A él se le sacan, en el borde: recibe exactamente lo de
 * antes (DL-152), los mismos ejercicios en el mismo orden. No se retiene nada: el registro sigue siendo por ejercicio.
 *
 * `exerciseGroups` y `exerciseGroupId` son nombres propios de DL-181: ninguna otra respuesta los usa, así que sacarlos de
 * todo el cuerpo no toca nada más.
 */
@Injectable()
export class SinBloquesDeLaSesionInterceptor implements NestInterceptor {
  intercept(contexto: ExecutionContext, siguiente: CallHandler): Observable<unknown> {
    const req = contexto.switchToHttp().getRequest<Request>();
    if (capacidadesDeclaradas(req.get(HEADER_DE_CAPACIDADES)).has(CAPACIDAD_BLOQUES_DE_LA_SESION)) return siguiente.handle();
    return siguiente.handle().pipe(map(sinBloquesDeLaSesion));
  }
}

const CLAVES = new Set(['exerciseGroups', 'exerciseGroupId']);

/** Una copia del cuerpo sin ninguna clave `exerciseGroups` ni `exerciseGroupId`. Lo que no es objeto ni lista queda igual. */
export function sinBloquesDeLaSesion(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(sinBloquesDeLaSesion);
  if (valor === null || typeof valor !== 'object' || valor instanceof Date || Buffer.isBuffer(valor)) return valor;
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(valor)) if (!CLAVES.has(k)) r[k] = sinBloquesDeLaSesion(v);
  return r;
}
