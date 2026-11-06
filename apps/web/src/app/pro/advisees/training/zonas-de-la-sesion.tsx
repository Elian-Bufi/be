'use client';

/**
 * Las zonas musculares de una sesión del plan (WP-CATALOGO-VISUAL, etapa 2; DL-081): la figura con las zonas de sus
 * ejercicios juntas, al lado de los ejercicios en el escritorio y debajo cuando no entran.
 * - **Se juntan con la regla del dominio** (`zonasJuntas`): cada zona una vez, principal si lo es en alguno de los
 *   ejercicios. No cuenta ni suma nada por zona (REG-06-139; B10-06 §59): cuántos ejercicios la nombran no es un dato.
 * - **Son las zonas vigentes de cada ejercicio** (la ficha visual, API-EJE-05), no parte de la instantánea de la versión.
 * - Si algún ejercicio todavía no tiene zonas cargadas, se dice cuántos: la figura no se completa sola (B10-06 §22).
 * - Una lectura que falla se dice, con su reintento. Sin el área de Entrenamiento no se muestra nada.
 */
import { COPY_FIGURA_DE_ZONAS as C, zonasJuntas, type SesionConObjetivos } from '@be/domain';
import { useId } from 'react';
import { Cargando } from '../../../../components/estados';
import { FiguraDeZonas } from '../../../../components/figura-de-zonas';
import { Aviso } from '../../../../components/formulario';
import { useFichasVisuales } from '../../../../lib/fichas-visuales';
import type { AccesoALasImagenes } from './estructura-del-plan';

export function ZonasDeLaSesion({ sesion, acceso, nivel }: { sesion: SesionConObjetivos; acceso: AccesoALasImagenes; nivel: 3 | 4 }) {
  const id = useId();
  const ids = [...new Set(sesion.prescriptions.map((p) => p.exerciseId.toLowerCase()))];
  const { lectura, releer } = useFichasVisuales(acceso.token, ids, acceso.sesionPerdida);
  if (ids.length === 0 || lectura.tipo === 'sin-area') return null;
  const Titulo = nivel === 3 ? 'h3' : 'h4';
  const sinZonas = lectura.tipo === 'lista' ? ids.filter((x) => (lectura.fichas.get(x)?.muscleZones.length ?? 0) === 0).length : 0;
  const juntas = lectura.tipo === 'lista' ? zonasJuntas(ids.map((x) => lectura.fichas.get(x)?.muscleZones ?? [])) : [];
  return (
    <section className="zonas-de-la-sesion" aria-labelledby={`${id}-titulo`} data-zonas-de-la-sesion={sesion.sessionId}>
      <Titulo id={`${id}-titulo`} className="zonas-de-la-sesion__titulo">
        {C.tituloDeLaSesion}
      </Titulo>
      {lectura.tipo === 'cargando' ? <Cargando /> : null}
      {lectura.tipo === 'falla' ? (
        <Aviso tipo="error">
          <p>
            {C.noSePudieronLeer} {lectura.motivo}
          </p>
          <button type="button" className="boton boton--secundario" onClick={releer}>
            Reintentar
          </button>
        </Aviso>
      ) : null}
      {lectura.tipo === 'lista' ? (
        <>
          <FiguraDeZonas zonas={juntas} sinZonas={C.sinZonasEnLaSesion} chica nota={juntas.length > 0 ? C.deLaSesion : null} />
          {juntas.length > 0 && sinZonas > 0 ? (
            <p className="nota" data-ejercicios-sin-zonas={sinZonas}>
              {C.ejerciciosSinZonas(sinZonas)}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
