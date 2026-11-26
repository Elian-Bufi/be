'use client';

/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3, ET3-05) · Las Plantillas de BE de Entrenamiento en la consola de
 * Administración (API-TPB-03 y 04), con el patrón de las propuestas al Recetario de BE:
 * - **Cada plantilla** dice su división, sus días y semanas, si es una propuesta a validar, su estado y su historia (quién,
 *   cuándo y por qué), y abre sus fases con las sesiones y los ejercicios.
 * - **Retirarla** (con un motivo opcional) la saca del diálogo de los profesionales; **ofrecerla** la vuelve a poner. Los
 *   planes que ya salieron de ella no cambian. El contenido no se edita acá: lo cura Dirección (ET3-D01).
 * Toda acción va con la sesión administrativa y el segundo factor, y queda auditada (la API lo exige en cada ruta).
 */
import { COPY, COPY_PLANTILLAS_DE_BE, COPY_PLANTILLAS_DE_BE_EN_ADMINISTRACION as C, NOMBRE_DE_LA_DIVISION, type PlantillaDeBeApi } from '@be/domain';
import { useCallback, useEffect, useId, useState } from 'react';
import { Campo } from '../../../components/formulario';
import { apiAdministrativa } from '../../../lib/api-administrativa';
import { fecha } from '../../../lib/formato';
import { nuevaClaveAdministrativa, useAdministracion } from '../../../lib/sesion-administrativa';

type Administrada = PlantillaDeBeApi & {
  readonly history: readonly { readonly state: 'PUBLISHED' | 'WITHDRAWN'; readonly reason: string | null; readonly decidedAt: string; readonly administratorName: string | null }[];
};

function Plantilla({ p, alDecidir }: { p: Administrada; alDecidir: (actualizada: Administrada, texto: string) => void }) {
  const id = useId();
  const { sesion, revisar } = useAdministracion();
  const [clave] = useState(nuevaClaveAdministrativa);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const retirada = p.state === 'WITHDRAWN';
  async function decidir() {
    if (!sesion?.token) return;
    setEnviando(true);
    setFallo(null);
    const decision = retirada ? 'PUBLISH' : 'WITHDRAW';
    const res = await apiAdministrativa.decidirSobrePlantillaDeBe(sesion.token, p.key, { decision, ...(decision === 'WITHDRAW' && motivo.trim() ? { reason: motivo.trim() } : {}) }, `${clave}-${decision}-${p.history.length}`);
    setEnviando(false);
    if (res.ok) {
      setMotivo('');
      return alDecidir(res.datos.data, decision === 'PUBLISH' ? C.ofrecida(p.name) : C.retirada(p.name));
    }
    if (revisar(res)) return;
    setFallo(res.tipo === 'API' && res.codigo === 'INVALID_STATE_TRANSITION' ? C.yaEstaba : COPY.noDisponible);
  }
  return (
    <li className="lista__item plantilla-de-be-admin" data-plantilla-de-be={p.key} data-estado={p.state}>
      <div className="plantilla-de-be-admin__cabecera">
        <p className="lista__titulo">{p.name}</p>
        <span className="plantilla-de-be__propuesta">{retirada ? C.estado.WITHDRAWN : C.estado.PUBLISHED}</span>
        {p.validation === 'PROPOSAL' ? <span className="plantilla-de-be__propuesta">{COPY_PLANTILLAS_DE_BE.propuesta}</span> : null}
      </div>
      <p className="nota">
        {COPY_PLANTILLAS_DE_BE.detalle(NOMBRE_DE_LA_DIVISION[p.split], p.daysPerWeek, p.weeks)} · {C.version(p.version)}
      </p>
      <details>
        <summary>{C.verContenido}</summary>
        <p>{p.description}</p>
        {p.phases.map((f, i) => (
          <div key={i} className="plantilla-de-be__fase">
            <p className="lista__titulo">
              {f.name} <span className="nota">· {COPY_PLANTILLAS_DE_BE.semanas(f.weeks)}{f.progression ? ` · ${f.progression}` : ''}</span>
            </p>
            <div className="plantilla-de-be__sesiones">
              {f.sessions.map((s, j) => (
                <div key={j}>
                  <p className="plantilla-de-be__nombre-de-sesion">{s.label}</p>
                  <ul className="plantilla-de-be__ejercicios">
                    {s.exercises.map((e, k) => (
                      <li key={k}>
                        {e.name} <span className="nota">{e.prescription}</span>
                        {e.exerciseId ? null : <span className="nota"> · {COPY_PLANTILLAS_DE_BE.noDisponible}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </details>
      <div className="plantilla-de-be-admin__historia" data-historia>
        <p className="lista__titulo">{C.historia}</p>
        {p.history.length === 0 ? (
          <p className="nota">{C.sinHistoria}</p>
        ) : (
          <ul className="lista-compacta">
            {p.history.map((h, n) => (
              <li key={n}>
                {C.estado[h.state]} · {fecha(h.decidedAt)} · {h.administratorName ?? 'Sin indicar'}
                {h.reason ? ` · ${h.reason}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="propuesta-al-recetario__decision">
        {retirada ? null : <Campo id={`${id}-motivo`} etiqueta={C.motivo} value={motivo} maxLength={500} onChange={(e) => setMotivo(e.target.value)} />}
        <div className="acciones">
          <button type="button" className={`boton ${retirada ? 'boton--primario' : 'boton--secundario'}`} disabled={enviando} onClick={() => void decidir()} data-decidir-plantilla-de-be>
            {enviando ? 'Guardando…' : retirada ? C.ofrecer : C.retirar}
          </button>
        </div>
      </div>
      {/* El renglón del error ocupa su lugar: que aparezca no corre la lista (RP-19). */}
      <p className="nota nota--error recetario__lugar-del-aviso" role="alert">
        {fallo ?? ''}
      </p>
    </li>
  );
}

export function PlantillasDeBeEnAdministracion() {
  const { sesion, revisar } = useAdministracion();
  const token = sesion?.token ?? null;
  const [lista, setLista] = useState<readonly Administrada[] | 'falla' | null>(null);
  const [hecho, setHecho] = useState('');
  const leer = useCallback(async () => {
    if (!token) return;
    setLista(null);
    const r = await apiAdministrativa.plantillasDeBe(token);
    if (r.ok) return setLista(r.datos.data);
    if (!revisar(r)) setLista('falla');
  }, [token, revisar]);
  useEffect(() => {
    void leer();
  }, [leer]);
  return (
    <>
      <p className="nota recetario__lugar-del-aviso" role="status" data-decision-hecha>
        {hecho}
      </p>
      {lista === 'falla' ? <p role="alert">{COPY.noDisponible}</p> : null}
      {lista === null ? <p aria-busy="true">Cargando…</p> : null}
      {lista && lista !== 'falla' ? (
        <ul className="lista plantillas-de-be-admin">
          {lista.map((p) => (
            <Plantilla
              key={p.key}
              p={p}
              alDecidir={(actualizada, texto) => {
                setHecho(texto);
                setLista((l) => (l && l !== 'falla' ? l.map((x) => (x.key === actualizada.key ? actualizada : x)) : l));
              }}
            />
          ))}
        </ul>
      ) : null}
    </>
  );
}
