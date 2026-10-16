/**
 * El acceso actual por área, dicho igual en la ficha del asesorado y en el marco de cada pestaña de área
 * (WP-ESCRITORIO-AREAS, parte 0): el estado de cada vínculo con las palabras de BE (`estadoParaMostrar`), salvo que el
 * resumen ya no deje leer esa área. Nunca dice quién retiró el acceso ni por qué (10-B04 §41).
 *
 * Salió de `workspace.tsx` sin cambiar una clase ni una palabra: la ficha lo usa como antes.
 */
import { COPY_VINCULO, estadoParaMostrar, type DashboardResponse, type DominioDeAnalisis, type Vinculo } from '@be/domain';

export const DOMINIO_DEL_ALCANCE: Readonly<Record<string, DominioDeAnalisis>> = { NUTRICION: 'NUTRITION', ENTRENAMIENTO: 'TRAINING', ANTROPOMETRIA: 'ANTHROPOMETRY' };
export const CLAVE_DEL_DOMINIO: Readonly<Record<DominioDeAnalisis, keyof DashboardResponse['data']['domains']>> = { NUTRITION: 'nutrition', TRAINING: 'training', ANTHROPOMETRY: 'anthropometry' };
/** Las áreas van siempre en el mismo orden, el de todo BE: Nutrición, Entrenamiento, Antropometría. */
const ORDEN_DE_LAS_AREAS: readonly string[] = ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'];
const lugarDelArea = (v: Vinculo): number => {
  const i = ORDEN_DE_LAS_AREAS.indexOf(v.scope.code);
  return i < 0 ? ORDEN_DE_LAS_AREAS.length : i;
};

/**
 * Si el resumen deja leer un área. `null` cuando no se le preguntó (o todavía no respondió): entonces vale el estado
 * del vínculo.
 */
export type LecturaPorArea = ((dominio: DominioDeAnalisis) => boolean) | null;

/** El estado de un área en el encabezado: el del vínculo, salvo que el resumen ya no deje leerla. */
export function estadoDelArea(v: Vinculo, sePuedeLeer: LecturaPorArea): { estado: string; detalle: string | null } {
  const e = estadoParaMostrar(v, 'PROFESSIONAL');
  const dominio = DOMINIO_DEL_ALCANCE[v.scope.code];
  if (sePuedeLeer && dominio && e.estado === COPY_VINCULO.accesoContextual && !sePuedeLeer(dominio)) {
    return { estado: COPY_VINCULO.accesoNoDisponible, detalle: null };
  }
  return e;
}

/**
 * El acceso actual por área. Si todas las áreas están en el mismo estado, se dice una vez («Nutrición, Entrenamiento y
 * Antropometría: Activo · acceso contextual»): repetir tres veces el mismo estado ocupaba una línea más de identidad
 * técnica (encargo §10). Si difieren, cada área con el suyo.
 */
export function AccesoPorArea({ vinculos, sePuedeLeer }: { vinculos: readonly Vinculo[]; sePuedeLeer: LecturaPorArea }) {
  const filas = [...vinculos].sort((a, b) => lugarDelArea(a) - lugarDelArea(b)).map((v) => ({ v, e: estadoDelArea(v, sePuedeLeer) }));
  const primero = filas[0];
  if (primero && filas.length > 1 && filas.every((f) => f.e.estado === primero.e.estado && !f.e.detalle)) {
    const nombres = filas.map((f) => f.v.scope.label);
    return (
      <p className="ficha__acceso-areas">
        <strong>{`${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`}</strong>: <span className="insignia">{primero.e.estado}</span>
      </p>
    );
  }
  return (
    <ul className="estados-de-vinculo estados-de-vinculo--en-linea">
      {filas.map(({ v, e }) => (
        <li key={v.relationshipId}>
          <strong>{v.scope.label}</strong>: <span className="insignia">{e.estado}</span>
          {e.detalle ? <> {e.detalle}</> : null}
        </li>
      ))}
    </ul>
  );
}
