'use client';

/**
 * Lo que va antes de cualquier pantalla de la consola: sin sesión, la entrada; con la sesión abierta pero sin el segundo
 * factor vigente, el paso que falta (configurar el autenticador o escribir un código); con códigos de recuperación recién
 * generados, esos códigos. Recién con el segundo factor vigente se ve la pantalla pedida, y la dirección se conserva: una
 * ficha abierta desde un enlace se muestra después de entrar.
 *
 * Mostrar u ocultar acá no autoriza nada: la API exige la sesión administrativa, el rol y el segundo factor en cada
 * operación, y esta puerta solo acompaña lo que la API dice.
 */
import { COPY_ADMINISTRACION } from '@be/domain';
import type { ReactNode } from 'react';
import { AvisoFlotante } from '../../components/ayuda';
import { useAdministracion } from '../../lib/sesion-administrativa';
import { CodigosParaGuardar, ConfiguracionDelAutenticador, EntradaAdministrativa, PasoDelSegundoFactor } from './acceso';

export function PuertaAdministrativa({ children }: { children: ReactNode }) {
  const { sesion, restaurando, codigosPorGuardar, aviso, avisar } = useAdministracion();
  if (restaurando) {
    return (
      <p className="cargando" role="status">
        {COPY_ADMINISTRACION.sesion.recuperando}
      </p>
    );
  }
  if (!sesion) return <EntradaAdministrativa />;
  if (codigosPorGuardar) return <CodigosParaGuardar />;
  if (sesion.segundoFactor.state === 'ENROLLMENT_REQUIRED') return <ConfiguracionDelAutenticador modo="incorporacion" />;
  if (sesion.segundoFactor.state === 'REQUIRED') return <PasoDelSegundoFactor />;
  return (
    <>
      {children}
      {aviso ? (
        <AvisoFlotante seQueda onCerrar={() => avisar(null)}>
          <p>{aviso}</p>
        </AvisoFlotante>
      ) : null}
    </>
  );
}
