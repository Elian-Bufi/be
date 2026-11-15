/**
 * El registro de los gráficos (WP-GRAFICOS fase 2, DL-174): cada gráfico de la fase 2 se anota en el registro de su
 * área (`entrenamiento/registro.ts`, `nutricion/registro.ts`, `antropometria/registro.ts` y `cruces/registro.ts`) con su
 * identificador estable, su pregunta, dónde va y cuándo se ofrece. «Patrones», los enfoques y «Agregar un gráfico» los
 * leen de acá: un gráfico que no se ofrece con esta persona (un área sin acceso) no aparece, ni en gris ni con candado.
 *
 * Es puro: lo prueba `apps/web/test/graficos-base.test.mjs`.
 */
import type { AccesoDeLaPersona, AreaDelGrafico, EjercicioDelPeriodo, IdDeGrafico, UbicacionDelGrafico } from '@be/domain';
import type { ComponentType } from 'react';
import type { BandaDeVersion } from './carriles';
import type { PeriodoDelGrafico } from './eje-de-fechas';
import type { ParametrosDeLectura } from './lecturas';
import type { DensidadDelGrafico } from './paneles-alineados';

/** Lo que el registro mira para ofrecer un gráfico: el acceso de hoy y lo que hay en el período. */
export interface ContextoDelRegistro {
  readonly acceso: AccesoDeLaPersona;
  /** Los ejercicios del período, del más registrado al menos; `null` sin Entrenamiento. */
  readonly ejercicios: readonly EjercicioDelPeriodo[] | null;
  /** Los códigos de las medidas con tomas en el período; `null` sin Antropometría. */
  readonly medidas: readonly string[] | null;
}

/** El ejercicio de un gráfico elegido, ya resuelto (uno fijo o «el más registrado»). */
export interface EjercicioDelGraficoElegido {
  readonly exerciseKey: string;
  readonly nombre: string;
  readonly unidad: 'kg' | 'lb' | null;
  readonly serie: number | null;
}

/** Lo que recibe todo gráfico registrado. Las lecturas van a la API con el acceso de este momento. */
export interface PropsDelGrafico {
  readonly lectura: Omit<ParametrosDeLectura, 'periodo'>;
  readonly periodo: PeriodoDelGrafico;
  readonly densidad: DensidadDelGrafico;
  readonly ejercicio: EjercicioDelGraficoElegido | null;
  /** El código de la medida (`antropometria.<código>`), si el gráfico la pide. */
  readonly medida: string | null;
  /** Las versiones del plan del área del gráfico, de fondo. */
  readonly bandas: readonly BandaDeVersion[];
}

export interface GraficoRegistrado {
  readonly id: IdDeGrafico;
  /** El código de la propuesta: GR-02, SP-01. */
  readonly codigo: string;
  readonly area: AreaDelGrafico;
  /** La pregunta corta que va como título de la tarjeta. */
  readonly titulo: string;
  readonly ubicacion: UbicacionDelGrafico;
  /** Las series del catálogo que dibuja. */
  readonly series: readonly string[];
  readonly requiere: { readonly ejercicio: boolean; readonly listaV1: boolean; readonly medida: boolean };
  /** Si se ofrece con esta persona. Un área sin acceso devuelve `false` y el gráfico no aparece. */
  readonly ofrecido: (c: ContextoDelRegistro) => boolean;
  readonly Grafico: ComponentType<PropsDelGrafico>;
}

export interface RegistroDeGraficos {
  readonly todos: readonly GraficoRegistrado[];
  /** El gráfico de un identificador, o `null` si este website no lo conoce (se ignora, no es un error). */
  readonly grafico: (id: string) => GraficoRegistrado | null;
  /** Los que se ofrecen con esta persona, en el orden del registro. */
  readonly ofrecidos: (c: ContextoDelRegistro) => readonly GraficoRegistrado[];
}

const FORMA_DEL_ID = /^(entrenamiento|nutricion|antropometria|cruce)\.[a-z0-9-]+$/;

/** Une los registros de las áreas. Un identificador repetido o mal formado es un error de programación. */
export function crearRegistro(graficos: readonly GraficoRegistrado[]): RegistroDeGraficos {
  const vistos = new Set<string>();
  for (const g of graficos) {
    if (!FORMA_DEL_ID.test(g.id)) throw new Error(`El gráfico ${g.codigo} tiene un identificador mal formado: ${g.id}`);
    if (vistos.has(g.id)) throw new Error(`El gráfico ${g.id} está registrado dos veces`);
    vistos.add(g.id);
  }
  return {
    todos: graficos,
    grafico: (id) => graficos.find((g) => g.id === id) ?? null,
    ofrecidos: (c) => graficos.filter((g) => g.ofrecido(c)),
  };
}
