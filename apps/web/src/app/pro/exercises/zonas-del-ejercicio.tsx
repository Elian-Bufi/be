'use client';

/**
 * Cargar o cambiar las zonas de un ejercicio propio (WP-TABLERO-ALTA-GAMA TB-48), en «Mis ejercicios». Las 17 zonas del
 * catálogo, cada una con «No la nombra», «Principal» o «Secundaria», y al lado la figura de siempre con lo elegido, que
 * cambia mientras se elige. Guarda con API-EJE-04 (la lista completa, para la versión vigente del ejercicio y con la
 * asignación que se vio), con la clave del intento. Las reglas y los textos, en `zonas-propias.ts`.
 */
import { COPY_FIGURA_DE_ZONAS, ZONAS_MUSCULARES, type FichaVisualDeEjercicio } from '@be/domain';
import { useEffect, useId, useMemo, useState } from 'react';
import { FiguraDeZonas } from '../../../components/figura-de-zonas';
import { Aviso } from '../../../components/formulario';
import { api, type Resultado } from '../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../lib/intento';
import { COPY_ZONAS_PROPIAS as C, cambiaronLasZonas, eleccionDe, pedidoDeZonas, zonasElegidas, type EleccionDeZonas, type RolDeZona } from './zonas-propias';

export function ZonasDelEjercicio({
  token,
  nombre,
  ficha,
  sesionPerdida,
  onGuardadas,
  onCancelar,
}: {
  token: string;
  nombre: string;
  /** La ficha visual que ya se leyó: sus zonas de hoy, la versión vigente y el número de la última asignación. */
  ficha: FichaVisualDeEjercicio;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  onGuardadas: () => void;
  onCancelar: () => void;
}) {
  const propio = useId();
  const inicial = useMemo(() => eleccionDe(ficha.muscleZones), [ficha]);
  const [eleccion, setEleccion] = useState<EleccionDeZonas>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const intento = useClaveDeIntento();
  const idDe = (zona: string) => `${propio}-${zona}`;

  // Al abrir, el foco va a la primera zona: es lo que se viene a cambiar.
  useEffect(() => {
    document.getElementById(idDe(ZONAS_MUSCULARES[0].zoneId))?.focus();
    // Solo al abrir.
  }, []);

  async function guardar() {
    if (guardando) return;
    if (!cambiaronLasZonas(inicial, eleccion)) return setFallo(C.sinCambios);
    setGuardando(true);
    setFallo(null);
    const r = await api.cambiarZonasDeEjercicio(token, ficha.exerciseId, pedidoDeZonas(eleccion, ficha), intento.actual());
    intento.registrar(r);
    setGuardando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT' ? C.conflicto : mensajeDeFallo(r));
    onGuardadas();
  }

  return (
    <div className="zonas-propias" data-zonas-propias={ficha.exerciseId}>
      <fieldset className="grupo zonas-propias__eleccion">
        <legend>{C.titulo(nombre)}</legend>
        <p className="nota">{C.queEs}</p>
        <div className="zonas-propias__lista">
          {ZONAS_MUSCULARES.map((z) => (
            <div key={z.zoneId} className="campo">
              <label htmlFor={idDe(z.zoneId)}>{z.name}</label>
              <select
                id={idDe(z.zoneId)}
                value={eleccion[z.zoneId] ?? ''}
                data-zona={z.zoneId}
                onChange={(e) => {
                  const rol = e.target.value as RolDeZona | '';
                  setFallo(null);
                  setEleccion((x) => ({ ...x, [z.zoneId]: rol }));
                }}
              >
                <option value="">{C.noLaNombra}</option>
                <option value="PRIMARY">{COPY_FIGURA_DE_ZONAS.principal}</option>
                <option value="SECONDARY">{COPY_FIGURA_DE_ZONAS.secundaria}</option>
              </select>
            </div>
          ))}
        </div>
      </fieldset>
      <section className="zonas-propias__vista" aria-label={C.asiSeVe}>
        <p className="detalle-visual__titulo">{C.asiSeVe}</p>
        <FiguraDeZonas zonas={zonasElegidas(eleccion)} sinZonas={C.ningunaElegida} chica nota={COPY_FIGURA_DE_ZONAS.queMuestra} />
      </section>
      {fallo ? (
        <Aviso tipo="error" enfocar>
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <div className="acciones zonas-propias__acciones">
        <button type="button" className="boton boton--primario" aria-disabled={guardando || undefined} onClick={() => void guardar()}>
          {guardando ? C.guardando : C.guardar}
        </button>
        <button type="button" className="boton boton--enlace" onClick={onCancelar}>
          {C.cancelar}
        </button>
      </div>
    </div>
  );
}
