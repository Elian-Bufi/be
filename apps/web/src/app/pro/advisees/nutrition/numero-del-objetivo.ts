/**
 * EDC-12: el número de la versión del objetivo, contado entre todas sus versiones (todas las páginas: la API da 20 por
 * página, de la más nueva a la más vieja). Si la lista no se pudo leer entera, `null`: se dice solo la fecha, nunca un
 * número contado a medias. Con `objetivo` en `null` no lee nada.
 *
 * Vivía en el asistente de Nutrición (ED-30); con DL-193 (SAN-04) lo usan el cuadro de la opción y el objetivo del editor.
 */
import { todasLasPaginas, type VersionDeObjetivo } from '@be/domain';
import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api';
import { useNutricion } from './nutricion';
import { numeroDeLaVersionDelObjetivo } from './version-del-objetivo';

export function useNumeroDelObjetivo(objetivo: VersionDeObjetivo | null): number | null {
  const { token, asesoradoId, sesionPerdida } = useNutricion();
  const [numero, setNumero] = useState<{ readonly de: string; readonly n: number | null } | null>(null);
  useEffect(() => {
    if (!objetivo) return;
    let vigente = true;
    void todasLasPaginas((f) => api.listarObjetivos(token, asesoradoId, f)).then((r) => {
      if (!vigente || sesionPerdida(r) || !r.ok) return;
      setNumero({ de: objetivo.versionId, n: r.datos.completa ? numeroDeLaVersionDelObjetivo(r.datos.data, objetivo.versionId) : null });
    });
    return () => {
      vigente = false;
    };
  }, [objetivo, token, asesoradoId, sesionPerdida]);
  return objetivo && numero?.de === objetivo.versionId ? numero.n : null;
}
