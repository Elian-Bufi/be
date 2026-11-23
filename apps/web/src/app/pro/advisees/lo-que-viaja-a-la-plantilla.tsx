'use client';

/**
 * DL-108 D-3, ratificado por Dirección el 19/11 · al guardar un plan como plantilla, además de las notas, **los nombres,
 * los parámetros del profesional y la referencia del %RM**, para confirmarlos o vaciarlos uno por uno: un bloque llamado
 * «Diego · piernas» no viaja a la plantilla sin que el profesional lo vea. Las reglas (qué se lista, qué queda al
 * vaciar) están en `plantillas-de-plan.ts`; lo usan los diálogos de Entrenamiento y de Nutrición.
 */
import { COPY_PLANTILLAS, type LoQueViajaALaPlantilla } from '@be/domain';

export function LoQueViajaALaPlantillaParaRevisar({
  items,
  titulo,
  ayuda,
  vacio,
  onVaciar,
}: {
  items: readonly LoQueViajaALaPlantilla[];
  titulo: string;
  ayuda: string;
  vacio: string;
  onVaciar: (x: LoQueViajaALaPlantilla) => void;
}) {
  return (
    <div data-lo-que-viaja-a-la-plantilla>
      <h4>{titulo}</h4>
      {items.length === 0 ? (
        <p className="nota">{vacio}</p>
      ) : (
        <>
          <p className="nota">{ayuda}</p>
          <ul className="lista-compacta">
            {items.map((x) => {
              const accion = x.tipo === 'NOMBRE' && x.generico ? COPY_PLANTILLAS.usarGenerico(x.generico) : x.tipo === 'PARAMETRO' ? COPY_PLANTILLAS.quitar : COPY_PLANTILLAS.vaciarNota;
              return (
                <li key={x.lugar} data-tipo={x.tipo}>
                  <span className="nota">{x.rotulo}:</span> «{x.texto}»{' '}
                  <button type="button" className="boton boton--discreto" onClick={() => onVaciar(x)} aria-label={`${accion}: ${x.rotulo}`}>
                    {accion}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
