import type { Metadata } from 'next';
import { COPY_RECETARIO } from '@be/domain';
import { PuertaAdministrativa } from '../puerta';
import { PropuestasAlRecetario } from './propuestas-al-recetario';

export const metadata: Metadata = { title: 'Recetario de BE · Administración · BE' };

/**
 * Website `/admin/recipes` (DL-191, REC-08): las recetas que los profesionales propusieron al Recetario de BE, con su
 * autor y las parecidas, para sumarlas o no.
 */
export default function PaginaDeLasPropuestas() {
  return (
    <main id="contenido" className="contenido contenido--ancho">
      <PuertaAdministrativa>
        <h1>{COPY_RECETARIO.propuestas}</h1>
        <p className="bajada">{COPY_RECETARIO.propuestasQueVe}</p>
        <PropuestasAlRecetario />
      </PuertaAdministrativa>
    </main>
  );
}
