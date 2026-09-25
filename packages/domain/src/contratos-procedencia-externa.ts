/**
 * La procedencia de un dato que vino de afuera (WP-08; RF-060). Vive en su propio archivo porque la usan los catálogos
 * de nutrición y de entrenamiento y la importación controlada, y ninguno de los tres debe depender de los otros.
 *
 * RF-060 (04:701-708): «identificar proveedor, fecha y referencia suficiente de un dato externo en los contextos donde se
 * utiliza; una importación no se presenta como dato verificado por BE; el histórico no pierde su fuente».
 */
import { z } from 'zod';
import { Instante } from './contratos';

/** Los dos proveedores del compromiso académico de integración (Q-API-001, 04:1144). */
export const ProveedorExternoSchema = z.enum(['OPEN_FOOD_FACTS', 'WGER']);
export type ProveedorExterno = z.infer<typeof ProveedorExternoSchema>;

/** Cómo se nombra cada proveedor en pantalla. Es un nombre propio: no se traduce. */
export const ETIQUETA_DE_PROVEEDOR: Readonly<Record<ProveedorExterno, string>> = {
  OPEN_FOOD_FACTS: 'Open Food Facts',
  WGER: 'wger',
};

/**
 * La licencia con la que el proveedor publica el dato, tal como la declara (08: licencia y procedencia). `attribution`
 * es la autoría que la licencia exige citar, cuando el proveedor la informa.
 */
export const LicenciaExternaSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  url: z.string().nullable(),
  attribution: z.string().nullable(),
});
export type LicenciaExterna = z.infer<typeof LicenciaExternaSchema>;

/** De dónde vino un elemento importado: proveedor, identificador, cuándo se recibió y con qué licencia. */
export const FuenteExternaSchema = z.strictObject({
  provider: ProveedorExternoSchema,
  externalId: z.string().min(1),
  receivedAt: Instante,
  license: LicenciaExternaSchema,
});
export type FuenteExterna = z.infer<typeof FuenteExternaSchema>;
