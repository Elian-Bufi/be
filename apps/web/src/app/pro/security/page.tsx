import type { Metadata } from 'next';
import { Encabezado } from '../../../components/encabezado';
import { Migas } from '../../../components/migas';
import { NavegacionProfesional } from '../../../components/navegacion';
import { SeguridadDelProfesional } from './seguridad';

export const metadata: Metadata = { title: 'Seguridad de tu acceso · BE' };

/**
 * Website `/pro/security` (WP-USO-FINAL UF-11; DL-169): el segundo factor del profesional. Llega con el segundo factor
 * verificado, porque la compuerta de `/pro` lo pide antes.
 */
export default function PaginaDeSeguridad() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido">
        <Migas pasos={[{ texto: 'Espacio profesional', href: '/pro' }, { texto: 'Seguridad' }]} />
        <h1>Seguridad de tu acceso</h1>
        <SeguridadDelProfesional />
      </main>
    </>
  );
}
