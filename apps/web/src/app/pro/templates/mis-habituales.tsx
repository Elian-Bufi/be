'use client';

/**
 * «Mis habituales» de entrenamiento (PF-09 bis; DL-109), junto a «Mis plantillas»: solo lo propio.
 * - **Sesiones habituales**: lista con ejercicios, cargas y fecha; detalle en solo lectura con los nombres vigentes de
 *   los ejercicios (`exercises`); renombrar con `expectedVersion`; «Quitar» la saca de la lista (los planes donde se
 *   insertó no cambian: lo insertado ya es del plan). La estructura no se edita acá: se vuelve a guardar desde el
 *   editor de un plan, que es donde se trabaja, y con el mismo nombre reemplaza (D-2).
 * - **Ejercicios habituales**: la lista por nombre, con «Quitar».
 * Un profesional sin Entrenamiento recibe 403: la sección no es para él y no se muestra (mostrar u ocultar no autoriza nada).
 */
import { COPY_HABITUALES, type EjercicioDeCatalogo, type SesionHabitual } from '@be/domain';
import { useEffect, useMemo, useState } from 'react';
import { Cargando, ErrorConReintento, VerMas } from '../../../components/estados';
import { Aviso, Campo } from '../../../components/formulario';
import { api, type Resultado } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { mensajeDeFallo } from '../../../lib/intento';
import { useListaPaginada } from '../../../lib/lista';

const nunca = () => false;
// Textos propios de esta sección (el resto sale de COPY_HABITUALES, compartido con el editor).
const TITULO = 'Habituales de entrenamiento';
const RENOMBRADA = 'Sesión habitual renombrada.';

export function MisHabitualesDeEntrenamiento({ token, sesionPerdida = nunca }: { token: string; sesionPerdida?: (r: Resultado<unknown>) => boolean }) {
  const [abiertaId, setAbiertaId] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [sinArea, setSinArea] = useState(false);
  const [quitando, setQuitando] = useState<string | null>(null);
  const lista = useListaPaginada(
    useMemo(
      () => (cursor?: string) =>
        api.listarSesionesHabituales(token, cursor ? { cursor } : {}).then((r) => {
          if (!r.ok && r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN') setSinArea(true);
          return r;
        }),
      [token],
    ),
    sesionPerdida,
  );

  async function quitar(h: SesionHabitual) {
    setQuitando(h.presetId);
    setAviso(null);
    const r = await api.editarSesionHabitual(token, h.presetId, { expectedVersion: h.version, state: 'REMOVED' });
    setQuitando(null);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setAviso({ tipo: 'error', texto: mensajeDeFallo(r) });
    setAbiertaId((a) => (a === h.presetId ? null : a));
    setAviso({ tipo: 'exito', texto: COPY_HABITUALES.quitado });
    void lista.recargar();
  }

  if (sinArea) return null;
  return (
    <section className="seccion" aria-labelledby="titulo-habituales-entrenamiento">
      <h2 id="titulo-habituales-entrenamiento">{TITULO}</h2>
      <p className="nota">{COPY_HABITUALES.soloTuyos}</p>
      {aviso ? (
        <Aviso tipo={aviso.tipo} enfocar>
          <p>{aviso.texto}</p>
        </Aviso>
      ) : null}

      <h3 id="titulo-sesiones-habituales">{COPY_HABITUALES.sesionesHabituales}</h3>
      {lista.estado.tipo === 'cargando' ? <Cargando /> : null}
      {lista.estado.tipo === 'error' ? <ErrorConReintento onReintentar={lista.recargar} /> : null}
      {lista.estado.tipo === 'listo' ? (
        lista.estado.items.length === 0 ? (
          <p>{COPY_HABITUALES.sinSesiones}</p>
        ) : (
          <ul className="lista" aria-labelledby="titulo-sesiones-habituales">
            {lista.estado.items.map((h) => (
              <li key={h.presetId} className="lista__item">
                <p className="lista__titulo">{h.name}</p>
                <p className="nota">
                  {COPY_HABITUALES.ejercicios(h.prescriptionCount)} · {h.copiedLoads ? COPY_HABITUALES.conCargas : COPY_HABITUALES.sinCargas} · {COPY_HABITUALES.actualizada(fecha(h.updatedAt))}
                </p>
                <div className="acciones">
                  <button type="button" className="boton boton--enlace" aria-expanded={abiertaId === h.presetId} onClick={() => setAbiertaId(abiertaId === h.presetId ? null : h.presetId)}>
                    {abiertaId === h.presetId ? 'Cerrar' : 'Ver'}
                  </button>
                  <button type="button" className="boton boton--enlace" disabled={quitando === h.presetId} onClick={() => void quitar(h)}>
                    {COPY_HABITUALES.quitar}
                  </button>
                </div>
                {abiertaId === h.presetId ? (
                  <DetalleDeSesionHabitual
                    token={token}
                    habitual={h}
                    sesionPerdida={sesionPerdida}
                    onCambio={(texto) => {
                      setAviso({ tipo: 'exito', texto });
                      void lista.recargar();
                    }}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : null}
      <VerMas estado={lista.estado} onVerMas={lista.verMas} />

      <EjerciciosHabituales token={token} onAviso={setAviso} />
    </section>
  );
}

/** La sesión en solo lectura, con los nombres vigentes del catálogo; renombrar con `expectedVersion`. */
function DetalleDeSesionHabitual({ token, habitual: h, sesionPerdida, onCambio }: { token: string; habitual: SesionHabitual; sesionPerdida: (r: Resultado<unknown>) => boolean; onCambio: (texto: string) => void }) {
  const [nombre, setNombre] = useState(h.name);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const s = h.structure;

  async function renombrar() {
    setEnviando(true);
    setError(null);
    const r = await api.editarSesionHabitual(token, h.presetId, { expectedVersion: h.version, name: nombre.trim() });
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setError(r.tipo === 'API' && r.codigo === 'PRESET_NAME_TAKEN' ? COPY_HABITUALES.nombreTomado : mensajeDeFallo(r));
    onCambio(RENOMBRADA);
  }

  return (
    <div className="detalle-de-valores">
      {error ? (
        <Aviso tipo="error">
          <p>{error}</p>
        </Aviso>
      ) : null}
      <div className="nodo nodo--comida">
        <h4>{s.label}</h4>
        {s.instructions ? <p className="nota">{s.instructions}</p> : null}
        <ul>
          {s.prescriptions.map((p, i) => {
            const e = h.exercises[p.exerciseVersionId];
            return (
              <li key={i}>
                <strong>{e ? e.exerciseName : 'Ejercicio no disponible en el catálogo'}</strong>
                {e && !e.available ? <span className="insignia"> no disponible</span> : null}
                <ul className="lista-compacta">
                  <li>
                    {p.sets.length} {p.sets.length === 1 ? 'serie' : 'series'}
                    {p.sets.length > 0 ? `: ${p.sets.map((x) => (x.repetitions === null ? '—' : 'value' in x.repetitions ? String(x.repetitions.value) : `${x.repetitions.min}-${x.repetitions.max}`)).join(' · ')} repeticiones` : ''}
                  </li>
                  {p.intensity ? <li>Intensidad: {p.intensity.criterion} {p.intensity.target.value}</li> : null}
                  {p.suggestedLoad ? (
                    <li>
                      Carga de referencia: {p.suggestedLoad.value} {p.suggestedLoad.unit}
                    </li>
                  ) : null}
                  {p.note ? <li>Nota: {p.note}</li> : null}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
      <Campo id={`hab-${h.presetId}-nombre`} etiqueta={COPY_HABITUALES.nombre} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />
      <div className="acciones">
        <button type="button" className="boton boton--secundario" disabled={enviando || nombre.trim().length === 0 || nombre.trim() === h.name} onClick={() => void renombrar()}>
          {COPY_HABITUALES.renombrar}
        </button>
      </div>
    </div>
  );
}

/** Los ejercicios habituales por nombre, con «Quitar». Un fallo de lectura se dice; un 403 no llega acá (la sección ya se ocultó). */
function EjerciciosHabituales({ token, onAviso }: { token: string; onAviso: (a: { tipo: 'exito' | 'error'; texto: string } | null) => void }) {
  const [ejercicios, setEjercicios] = useState<readonly EjercicioDeCatalogo[] | null | 'error'>(null);
  const [quitando, setQuitando] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    let vigente = true;
    setEjercicios(null);
    void api.listarEjerciciosHabituales(token).then((r) => {
      if (vigente) setEjercicios(r.ok ? r.datos.data : 'error');
    });
    return () => {
      vigente = false;
    };
  }, [token, intento]);

  async function quitar(e: EjercicioDeCatalogo) {
    setQuitando(e.exerciseId);
    onAviso(null);
    const r = await api.marcarEjercicioHabitual(token, e.exerciseId, { state: 'REMOVED' });
    setQuitando(null);
    if (!r.ok) return onAviso({ tipo: 'error', texto: mensajeDeFallo(r) });
    setEjercicios((lista) => (Array.isArray(lista) ? lista.filter((x) => x.exerciseId !== e.exerciseId) : lista));
    onAviso({ tipo: 'exito', texto: COPY_HABITUALES.quitado });
  }

  return (
    <>
      <h3 id="titulo-ejercicios-habituales">{COPY_HABITUALES.ejerciciosHabituales}</h3>
      {ejercicios === null ? <Cargando /> : null}
      {ejercicios === 'error' ? <ErrorConReintento onReintentar={() => setIntento((n) => n + 1)} /> : null}
      {Array.isArray(ejercicios) ? (
        ejercicios.length === 0 ? (
          <p>{COPY_HABITUALES.sinEjerciciosHabituales}</p>
        ) : (
          <ul className="lista" aria-labelledby="titulo-ejercicios-habituales">
            {ejercicios.map((e) => (
              <li key={e.exerciseId} className="lista__item">
                <span>
                  {e.name}
                  {e.provenance === 'PROFESSIONAL_MANUAL' ? <span className="nota"> · cargado por vos</span> : null}
                  {!e.available ? <span className="insignia"> no disponible</span> : null}
                </span>
                <button type="button" className="boton boton--enlace" disabled={quitando === e.exerciseId} onClick={() => void quitar(e)}>
                  {COPY_HABITUALES.quitar}
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </>
  );
}
