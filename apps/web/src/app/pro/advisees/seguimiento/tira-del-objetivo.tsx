'use client';

/**
 * La tira del objetivo del día (WP-ESCRITORIO-AMABLE, C-30 y C-31): las calorías y los tres macronutrientes del objetivo
 * nutricional vigente, siempre en el orden de la APK —calorías, carbohidratos, grasas y proteínas—, cada uno con su
 * ícono y su palabra.
 * - **Las calorías** son el requerimiento energético estimado del objetivo, y llegan con el resumen de la ficha.
 * - **Los macros** los declaró el profesional en el mismo objetivo. Llegan por otra lectura (API-NUT-06, «objetivo
 *   efectivo»): mientras llega se ven las calorías; si falla, se dice y se ofrece reintentar. Nunca un cero.
 * - Es lo indicado, no lo consumido: no se compara con nada ni se resta. Ubica, no califica.
 */
import { numero, type NombreDeIcono, type VersionDeObjetivo } from '@be/domain';
import { Icono } from '../../../../components/icono';

type Macro = VersionDeObjetivo['macronutrientDistribution']['protein'];

/** Los macros de la tira: todavía se leen, llegaron, o la lectura falló. `null`: no hay macros que mostrar. */
export type MacrosDelObjetivo = { readonly estado: 'cargando' } | { readonly estado: 'listos'; readonly valor: VersionDeObjetivo['macronutrientDistribution'] } | { readonly estado: 'falla' } | null;

const DE_LOS_MACROS: readonly { readonly clave: 'carbohydrate' | 'fat' | 'protein'; readonly nombre: string; readonly icono: NombreDeIcono }[] = [
  { clave: 'carbohydrate', nombre: 'Carbohidratos', icono: 'carbohidratos' },
  { clave: 'fat', nombre: 'Grasas', icono: 'grasas' },
  { clave: 'protein', nombre: 'Proteínas', icono: 'proteinas' },
];

/** Un macro en gramos por día lleva «g»; uno declarado como proporción de las calorías no es una cantidad de gramos. */
const valorDelMacro = (m: Macro): { readonly cifra: string; readonly unidad: string } => (m.unit === 'g/day' ? { cifra: numero(m.value), unidad: 'g' } : { cifra: numero(m.value), unidad: 'de las calorías (proporción)' });

export function TiraDelObjetivo({ calorias, macros, onReintentar }: { calorias: number; macros: MacrosDelObjetivo; onReintentar: () => void }) {
  return (
    <>
      <dl className="tira-del-objetivo" aria-busy={macros?.estado === 'cargando' ? true : undefined}>
        <div>
          <dt>
            <Icono nombre="calorias" tamano={18} />
            Calorías
            {/* Qué son esas calorías, para quien no ve la ayuda de la vista: el nombre que usa el objetivo en BE. */}
            <span className="visualmente-oculto"> (requerimiento energético estimado)</span>
          </dt>
          <dd>
            <strong>{numero(calorias)}</strong> kcal
          </dd>
        </div>
        {macros?.estado === 'listos' || macros?.estado === 'cargando'
          ? DE_LOS_MACROS.map((m) => {
              const v = macros.estado === 'listos' ? valorDelMacro(macros.valor[m.clave]) : null;
              return (
                <div key={m.clave}>
                  <dt>
                    <Icono nombre={m.icono} tamano={18} />
                    {m.nombre}
                  </dt>
                  {/* Mientras llega, el lugar queda reservado (la tarjeta no salta) y no se escribe ningún número. */}
                  <dd>
                    {v ? (
                      <>
                        <strong>{v.cifra}</strong> {v.unidad}
                      </>
                    ) : (
                      <span className="tenue">…</span>
                    )}
                  </dd>
                </div>
              );
            })
          : null}
      </dl>
      {macros?.estado === 'falla' ? (
        <p className="tira-del-objetivo__falla nota">
          No pudimos cargar los macros del objetivo. No es que falten: reintentá.{' '}
          <button type="button" className="boton boton--enlace" onClick={onReintentar}>
            Reintentar<span className="visualmente-oculto"> los macros del objetivo</span>
          </button>
        </p>
      ) : null}
    </>
  );
}
