import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CAPACIDAD_NOTACION_DEL_ESFUERZO, CAPACIDAD_OBJETIVOS_POR_SERIE, CAPACIDAD_TIPOS_DE_SERIE, type CapacidadDeCliente } from '@be/domain';
import type { ContextoDeSolicitud } from '../http/contexto';
import { muestraLaNotacionDelEsfuerzo } from './compatibilidad-de-clientes';

/**
 * DL-196 (punto 5) · lo que declara el cliente ya no traba ni retiene nada en Entrenamiento: solo moldea la forma. Lo que
 * hace la API con un plan con calentamiento y objetivos por serie y un titular que nunca declaró nada lo prueba la
 * integración (`test/integration/compatibilidad-de-clientes.int-spec.ts`); acá, sin base, lo que queda de este módulo y
 * que ningún servicio de Entrenamiento vuelva a rechazar por la versión de la app.
 */
const contexto = (capacidades: readonly CapacidadDeCliente[]): ContextoDeSolicitud => ({
  requestId: 'pedido-de-prueba',
  momentoDeRecepcion: new Date(),
  superficie: 'APK',
  direccionIp: null,
  agenteDeUsuario: null,
  capacidades: new Set(capacidades),
});

describe('DL-196 · las capacidades solo moldean la forma', () => {
  it('la notación del esfuerzo sale solo a quien la declara; las otras capacidades no la habilitan', () => {
    expect(muestraLaNotacionDelEsfuerzo(contexto([CAPACIDAD_NOTACION_DEL_ESFUERZO]))).toBe(true);
    expect(muestraLaNotacionDelEsfuerzo(contexto([]))).toBe(false);
    expect(muestraLaNotacionDelEsfuerzo(contexto([CAPACIDAD_OBJETIVOS_POR_SERIE, CAPACIDAD_TIPOS_DE_SERIE]))).toBe(false);
  });

  it('ningún servicio de Entrenamiento rechaza, retiene ni registra por la versión de la app', () => {
    const fuentes = readdirSync(__dirname).filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'));
    expect(fuentes.length).toBeGreaterThan(0);
    for (const f of fuentes) {
      const texto = readFileSync(join(__dirname, f), 'utf8');
      expect([f, /CodigoDeError.CLIENT_CAPABILITY_REQUIRED|seRetieneLaEntrega|entregaRetenida|registrarRetencion|registrarDeclaracion|titularCapaz|capacidadDeClienteDeclarada/.test(texto)]).toEqual([f, false]);
    }
  });
});
