'use client';

import { useSearchParams } from 'next/navigation';
import { avisoDe } from '../lib/copy';
import { Aviso } from './formulario';

/** Muestra un aviso fijo según `?aviso=` (solo claves conocidas: el texto del query nunca se refleja). */
export function AvisoDeLlegada() {
  const aviso = avisoDe(useSearchParams().get('aviso'));
  return aviso ? (
    <Aviso tipo="info" enfocar>
      <p>{aviso}</p>
    </Aviso>
  ) : null;
}
