import type { Metadata } from 'next';
import { Encabezado } from '../../../components/encabezado';
import { Migas } from '../../../components/migas';
import { NavegacionProfesional } from '../../../components/navegacion';
import { Guia } from './guia';

export const metadata: Metadata = { title: 'Guía del espacio profesional · BE' };

/**
 * Website `/pro/guia` (DL-145; Dirección, 2026-10-18): cómo se lee cada pantalla del espacio profesional, todo junto.
 * Las pantallas ya no tienen su «Cómo se lee esta vista»: tienen que entenderse solas. Lo que esas ayudas explicaban, y
 * lo que el legajo exige poder leer (DL-113), queda acá. No lee datos ni pide sesión: es texto.
 */
export default function PaginaDeLaGuia() {
  return (
    <>
      <Encabezado navegacion={<NavegacionProfesional />} />
      <main id="contenido" className="contenido contenido--ancho">
        <Migas pasos={[{ texto: 'Espacio profesional', href: '/pro' }, { texto: 'Guía' }]} />
        <h1>Guía del espacio profesional</h1>
        <Guia />
      </main>
    </>
  );
}
