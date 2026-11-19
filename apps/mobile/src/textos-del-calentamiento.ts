/**
 * DL-178 · los textos del calentamiento en la sesión. Una serie de calentamiento se registra como las demás, pero no entra
 * en la cuenta de series ni en la barra de la sesión, y no se numera: las efectivas siguen siendo 1, 2, 3.
 */
import { COPY_TIPOS_DE_SERIE } from '@be/domain';

export const TEXTOS_DEL_CALENTAMIENTO = {
  calentamiento: COPY_TIPOS_DE_SERIE.calentamiento,
  marca: COPY_TIPOS_DE_SERIE.marca,
  planDelCalentamiento: 'Plan del calentamiento',
  queEs: COPY_TIPOS_DE_SERIE.enElTelefono,
  empezar: 'Empezar calentamiento',
  terminar: 'Terminar calentamiento',
  registrar: 'Registrar calentamiento',
} as const;
