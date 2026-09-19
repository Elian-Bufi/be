/**
 * Estados de carga compartidos (10-B10:343-378): «Cargando…» sin datos ficticios, error con «Reintentar» (offline en el
 * APK = «Sin conexión», 10-B10:68-82) y «Ver más» para las listas por cursor.
 */
import { COPY } from '@be/domain';
import type { EstadoDeLista } from './lista';
import { Aviso, Boton, Parrafo } from './ui';

export function Cargando() {
  return <Parrafo tenue>Cargando…</Parrafo>;
}

export function ErrorConReintento({ mensaje = COPY.errorDeVista, sinConexion, onReintentar }: { mensaje?: string; sinConexion: boolean; onReintentar: () => void }) {
  return (
    <Aviso tipo="error" titulo={sinConexion ? 'Sin conexión' : mensaje}>
      <Boton texto={COPY.reintentar} tipo="secundario" onPress={onReintentar} />
    </Aviso>
  );
}

/** Estado de una lista: «Cargando…», el error con «Reintentar», o nada (la pantalla dibuja los ítems). */
export function EstadoDeCarga<T>({ estado, onReintentar }: { estado: EstadoDeLista<T>; onReintentar: () => void }) {
  if (estado.tipo === 'cargando') return <Cargando />;
  if (estado.tipo === 'error') return <ErrorConReintento sinConexion={estado.sinConexion} onReintentar={onReintentar} />;
  return null;
}

/** «Ver más» mientras la API diga que hay más (`page.hasMore`). Si la página siguiente falla, se reintenta desde acá. */
export function VerMas<T>({ estado, onVerMas }: { estado: EstadoDeLista<T>; onVerMas: () => void }) {
  if (estado.tipo !== 'listo' || !estado.siguiente) return null;
  const fallo = estado.mas === 'error' || estado.mas === 'sin-conexion';
  return (
    <>
      {fallo ? <Aviso tipo="error" titulo={estado.mas === 'sin-conexion' ? 'Sin conexión' : COPY.errorDeVista} /> : null}
      <Boton
        texto={estado.mas === 'cargando' ? 'Cargando…' : fallo ? COPY.reintentar : 'Ver más'}
        tipo="secundario"
        onPress={onVerMas}
        ocupado={estado.mas === 'cargando'}
      />
    </>
  );
}
