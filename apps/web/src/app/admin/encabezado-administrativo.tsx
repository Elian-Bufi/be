'use client';

/**
 * La barra de la consola de Administración: la marca con «Administración» al lado, las dos secciones (solo con el segundo
 * factor vigente) y, en la esquina, el menú de la cuenta administrativa. Usa las mismas clases que la barra del website
 * (`Encabezado`), pero no la sesión común: ni la campana de novedades ni «Datos de la cuenta», que son de profesionales y
 * personas.
 */
import { COPY_ADMINISTRACION } from '@be/domain';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import isotipo from '../../marca/isotipo-96.png';
import { useAdministracion } from '../../lib/sesion-administrativa';
import { MenuAdministrativo } from './menu-administrativo';

const C = COPY_ADMINISTRACION.consola;

export function EncabezadoAdministrativo() {
  const { sesion } = useAdministracion();
  const ruta = usePathname();
  const vigente = sesion?.segundoFactor.state === 'VERIFIED';
  const enLaLista = ruta === '/admin';
  const enUnaFicha = ruta.startsWith('/admin/professional');
  return (
    <header className="encabezado encabezado--administracion">
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>
      <Link href="/admin" className="encabezado__marca" aria-label={`BE · ${C.nombre}, ir a ${C.profesionales}`}>
        {/* El isotipo es decorativo: el nombre accesible del enlace ya dice «BE · Administración». */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={isotipo.src} width={36} height={36} alt="" />
        <span aria-hidden="true">BE</span>
        <span className="encabezado__ambito" aria-hidden="true">
          {C.nombre}
        </span>
      </Link>
      {vigente ? (
        <nav aria-label={C.navegacion} className="navegacion">
          <ul>
            <li>
              <Link href="/admin" aria-current={enLaLista ? 'page' : enUnaFicha ? 'location' : undefined}>
                {C.profesionales}
              </Link>
            </li>
            <li>
              <Link href="/admin/security" aria-current={ruta === '/admin/security' ? 'page' : undefined}>
                {C.seguridad}
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
      <MenuAdministrativo />
    </header>
  );
}
