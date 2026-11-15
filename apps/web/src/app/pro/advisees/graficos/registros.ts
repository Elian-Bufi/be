/**
 * Todos los gráficos registrados (WP-GRAFICOS fase 2, DL-174), en el orden de «Patrones»: Entrenamiento, Nutrición,
 * Antropometría y los cruces. Cada rama suma los suyos en el registro de su carpeta; este archivo no se toca.
 */
import { GRAFICOS_DE_ANTROPOMETRIA } from './antropometria/registro';
import { GRAFICOS_DE_CRUCES } from './cruces/registro';
import { GRAFICOS_DE_ENTRENAMIENTO } from './entrenamiento/registro';
import { GRAFICOS_DE_NUTRICION } from './nutricion/registro';
import { crearRegistro } from './registro-de-graficos';

export const REGISTRO_DE_GRAFICOS = crearRegistro([...GRAFICOS_DE_ENTRENAMIENTO, ...GRAFICOS_DE_NUTRICION, ...GRAFICOS_DE_ANTROPOMETRIA, ...GRAFICOS_DE_CRUCES]);
