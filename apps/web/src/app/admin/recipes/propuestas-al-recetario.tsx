'use client';

/**
 * DL-191 (WP-RECETARIO-E-IMAGENES, REC-08) · Las propuestas al Recetario de BE, en la consola de Administración
 * (API-RCT-04 y 05), con el patrón de «Sumar al canon» de los alimentos (DL-180):
 * - **Cada propuesta** dice quién la propuso (su nombre de profesional; nunca a quién se la indicó), la receta entera (la
 *   foto, las porciones, los ingredientes, los pasos y el cálculo), la cesión de la foto aceptada y las **parecidas** que
 *   ya hay en el recetario o en otras propuestas.
 * - **Sumarla** crea una receta del recetario, de todos los profesionales de Nutrición; **no sumarla** puede llevar un
 *   motivo, que ve quien la propuso. Una sola vez: lo decidido no se cambia.
 * - La foto viene con su ruta firmada de 15 minutos (todavía es de quien la propuso): se baja una vez y se muestra.
 * Toda acción va con la sesión administrativa y el segundo factor, y queda auditada (la API lo exige en cada ruta).
 */
import {
  COPY,
  COPY_RECETARIO as C,
  COPY_RECETAS,
  ETIQUETA_DE_PREPARACION,
  ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN,
  cantidad,
  nutrienteParaMostrar,
  type EstadoDePropuesta,
  type PropuestaParaRevisar,
} from '@be/domain';
import { useCallback, useEffect, useId, useState } from 'react';
import { Campo } from '../../../components/formulario';
import { Icono } from '../../../components/icono';
import { api } from '../../../lib/api';
import { apiAdministrativa } from '../../../lib/api-administrativa';
import { fecha } from '../../../lib/formato';
import { leerComoDataUrl } from '../../../lib/medios';
import { nuevaClaveAdministrativa, useAdministracion } from '../../../lib/sesion-administrativa';

/** La foto de una propuesta, por su ruta ya firmada; sin foto, el ícono de la comida. */
function FotoDeLaPropuesta({ ruta, nombre }: { ruta: string | null; nombre: string }) {
  const [dataUrl, setDataUrl] = useState<string | null | 'falla'>(null);
  useEffect(() => {
    if (!ruta) return;
    let vigente = true;
    void fetch(api.urlDe(ruta), { credentials: 'omit', cache: 'no-store' })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`status ${r.status}`))))
      .then(leerComoDataUrl)
      .then((d) => vigente && setDataUrl(d))
      .catch(() => vigente && setDataUrl('falla'));
    return () => {
      vigente = false;
    };
  }, [ruta]);
  if (ruta && typeof dataUrl === 'string' && dataUrl !== 'falla') return <img className="imagen-de-receta imagen-de-receta--chica" src={dataUrl} alt={`${COPY_RECETAS.imagenDeReferencia}: ${nombre}`} decoding="async" />;
  return (
    <div className="imagen-de-receta imagen-de-receta--chica imagen-de-receta--respaldo" role="img" aria-label={`${nombre}: ${ruta ? COPY.noDisponible : C.sinFoto}`}>
      <Icono nombre="comida" tamano={24} />
    </div>
  );
}

/**
 * RP-24 (RP-D94) · Lo que respondió la API al decidir, en palabras. Antes, todo lo que no era la sesión decía «no
 * disponible», también un 422 que tenía explicación: una propuesta ya decidida o con alimentos cargados a mano.
 */
export function textoDeLaDecision(res: { readonly ok: false; readonly tipo: string; readonly codigo?: string; readonly issues?: readonly { readonly code: string }[] }): string {
  if (res.tipo !== 'API') return COPY.noDisponible;
  if (res.codigo === 'INVALID_STATE_TRANSITION') return C.yaDecidida;
  if (res.codigo === 'VALIDATION_FAILED' && res.issues?.some((i) => i.code === 'OWN_FOOD_NOT_PROPOSABLE')) return C.conAlimentosAMano;
  if (res.codigo === 'VALIDATION_FAILED') return C.noSeDecidio;
  return COPY.noDisponible;
}

function Propuesta({ p, alDecidir }: { p: PropuestaParaRevisar; alDecidir: (actualizada: PropuestaParaRevisar, texto: string) => void }) {
  const id = useId();
  const { sesion, revisar } = useAdministracion();
  const [clave] = useState(nuevaClaveAdministrativa);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState<'ADD' | 'REJECT' | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const r = p.recipe;
  async function decidir(decision: 'ADD' | 'REJECT') {
    if (!sesion?.token) return;
    setEnviando(decision);
    setFallo(null);
    const res = await apiAdministrativa.decidirPropuesta(sesion.token, p.proposalId, { decision, ...(decision === 'REJECT' && motivo.trim() ? { reason: motivo.trim() } : {}) }, `${clave}-${decision}`);
    setEnviando(null);
    if (res.ok) return alDecidir(res.datos.data, decision === 'ADD' ? C.sumada(p.name) : C.rechazada(p.name));
    if (revisar(res)) return;
    setFallo(textoDeLaDecision(res));
  }
  return (
    <li className="lista__item propuesta-al-recetario" data-propuesta={p.proposalId} data-estado={p.status}>
      <div className="propuesta-al-recetario__cabecera">
        <FotoDeLaPropuesta ruta={r.image?.paths?.thumbnail ?? null} nombre={p.name} />
        <div>
          <p className="lista__titulo">{p.name}</p>
          <p className="nota" data-propuesta-por>
            {C.propuestaPor(p.proposedBy.displayName)} · {COPY_RECETAS.version(p.versionNumber)} · {fecha(p.proposedAt)}
          </p>
          <p className="nota">
            {COPY_RECETAS.porcionesYEnergia(r.servings, nutrienteParaMostrar(r.calculation.perServing.energyKcal, 'energyKcal'))}
            {r.image ? ` · ${ETIQUETA_DE_PROCEDENCIA_DE_IMAGEN[r.image.provenance]}${r.image.authorship ? ` · ${r.image.authorship}` : ''}` : ''}
          </p>
          <p className="nota">{p.photoAssignment ? C.conCesion(p.photoAssignment.textVersion, fecha(p.photoAssignment.acceptedAt)) : C.sinFotoEnLaPropuesta}</p>
        </div>
      </div>
      <details>
        <summary>La receta: ingredientes y preparación</summary>
        <p>{r.description ?? 'Sin indicar'}</p>
        <ul className="lista-compacta">
          {r.ingredients.map((i) => (
            <li key={i.order}>
              {i.name} · {cantidad(i.quantity.value, i.quantity.unit)} · {ETIQUETA_DE_PREPARACION[i.preparationState]}
            </li>
          ))}
        </ul>
        {r.steps.length ? (
          <ol>
            {r.steps.map((s, n) => (
              <li key={n}>{s}</li>
            ))}
          </ol>
        ) : (
          <p>Preparación: Sin indicar</p>
        )}
      </details>
      <div className="propuesta-al-recetario__parecidas" data-parecidas>
        <p className="lista__titulo">{C.parecidas}</p>
        {p.similar.length === 0 ? (
          <p className="nota">{C.sinParecidas}</p>
        ) : (
          <ul className="lista-compacta">
            {p.similar.map((s) => (
              <li key={`${s.kind}-${s.proposalId ?? s.recipeId}`} data-parecida={s.kind}>
                {s.name} · <span className="nota">{s.kind === 'BE_RECIPE' ? C.parecidaDelRecetario : C.parecidaPropuesta}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {p.status === 'PENDING' ? (
        <div className="propuesta-al-recetario__decision">
          <Campo id={`${id}-motivo`} etiqueta={C.motivoDelRechazo} value={motivo} maxLength={300} onChange={(e) => setMotivo(e.target.value)} />
          <div className="acciones">
            <button type="button" className="boton boton--primario" disabled={enviando !== null} onClick={() => void decidir('ADD')} data-sumar-al-recetario>
              <Icono nombre="tilde" tamano={18} />
              {enviando === 'ADD' ? 'Sumando…' : C.sumar}
            </button>
            <button type="button" className="boton boton--secundario" disabled={enviando !== null} onClick={() => void decidir('REJECT')} data-no-sumar>
              {enviando === 'REJECT' ? 'Guardando…' : C.rechazar}
            </button>
          </div>
        </div>
      ) : (
        <p className="nota" data-decidida>
          {C.filtro[p.status]} · {p.decidedAt ? fecha(p.decidedAt) : 'Sin indicar'}
          {p.status === 'REJECTED' ? ` · ${C.motivo(p.reason)}` : ''}
        </p>
      )}
      {/* El renglón del error ocupa su lugar: que aparezca no corre la lista (RP-19). */}
      <p className="nota nota--error recetario__lugar-del-aviso" role="alert">
        {fallo ?? ''}
      </p>
    </li>
  );
}

export function PropuestasAlRecetario() {
  const { sesion, revisar } = useAdministracion();
  const token = sesion?.token ?? null;
  const [estado, setEstado] = useState<EstadoDePropuesta>('PENDING');
  const [lista, setLista] = useState<readonly PropuestaParaRevisar[] | 'falla' | null>(null);
  const [hecho, setHecho] = useState('');
  const leer = useCallback(async () => {
    if (!token) return;
    setLista(null);
    const r = await apiAdministrativa.propuestasAlRecetario(token, { state: estado, limit: 50 });
    if (r.ok) return setLista(r.datos.data);
    if (!revisar(r)) setLista('falla');
  }, [token, revisar, estado]);
  useEffect(() => {
    void leer();
  }, [leer]);
  return (
    <>
      <div className="selector-de-origen" role="group" aria-label="Qué propuestas ver">
        {(['PENDING', 'ADDED', 'REJECTED'] as const).map((e) => (
          <button key={e} type="button" className={`boton boton--compacto ${estado === e ? 'boton--primario' : 'boton--secundario'}`} aria-pressed={estado === e} onClick={() => setEstado(e)}>
            {C.filtro[e]}
          </button>
        ))}
      </div>
      {/* Lo que se decidió, en su renglón: la lista no se corre. */}
      <p className="nota recetario__lugar-del-aviso" role="status" data-decision-hecha>
        {hecho}
      </p>
      {lista === 'falla' ? <p role="alert">{COPY.noDisponible}</p> : null}
      {lista === null ? <p aria-busy="true">Cargando…</p> : null}
      {lista && lista !== 'falla' && lista.length === 0 ? <p>{C.sinPropuestas}</p> : null}
      {lista && lista !== 'falla' && lista.length > 0 ? (
        <ul className="lista propuestas-al-recetario">
          {lista.map((p) => (
            <Propuesta
              key={p.proposalId}
              p={p}
              alDecidir={(actualizada, texto) => {
                setHecho(texto);
                setLista((l) => (l && l !== 'falla' ? l.map((x) => (x.proposalId === actualizada.proposalId ? actualizada : x)) : l));
              }}
            />
          ))}
        </ul>
      ) : null}
    </>
  );
}
