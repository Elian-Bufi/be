'use client';

/**
 * La evidencia de una revisión registrada (DL-154; hallazgo UX-02 de la auditoría): lo que el profesional marcó al
 * registrarla, consultable después, en Nutrición y en Entrenamiento.
 * - **El resumen va siempre a la vista** y sale de las referencias que la revisión guardó («12 comidas · 1 versión del
 *   plan · el objetivo»), sin otra lectura. Una revisión que no guardó evidencia lo dice; no se completa con el período.
 * - **«Ver la evidencia»** pide API-NUT-19-EVIDENCIA o API-TRN-23-EVIDENCIA, que resuelven en el servidor cada
 *   referencia con el permiso de hoy: sin acceso, se dice «No disponible con tu acceso actual», sin ningún detalle.
 * - **Cada elemento dice lo que es y cuándo**, y lo que cambió después de la revisión (una rectificación, una
 *   corrección, una anulación, una versión sucesora): lo que se abre hoy puede no ser lo que se revisó.
 * - **«Abrir»** muestra el origen en el panel de siempre (un `<dialog>` modal): retiene el foco, Escape lo cierra y el
 *   foco vuelve al botón que lo abrió. La lista sigue abierta donde estaba: nada navegó. El origen vuelve a pedir permiso.
 */
import {
  avisoAlAbrir,
  cambioEnPalabras,
  COPY_EVIDENCIA_REGISTRADA,
  cuandoDeLaEvidencia,
  gruposDeLaEvidencia,
  nombreDeLaEvidencia,
  resumenDeLaEvidencia,
  type AreaDeLaRevision,
  type EvidenciaDeRevisionResponse,
  type EvidenciaResuelta,
  type FormatoDeLaEvidencia,
  type OrigenDeDato,
  type Resultado,
} from '@be/domain';
import { useId, useState, type ReactNode } from 'react';
import { Cargando, ErrorConReintento } from '../../../components/estados';
import { Panel } from '../../../components/panel';
import { motivoDeFalla, textoDeFalla } from '../../../lib/fallas';
import { diaCivil, fecha } from '../../../lib/formato';

const FORMATO: FormatoDeLaEvidencia = { dia: diaCivil, momento: fecha };

/** Una revisión, con lo que hace falta para su evidencia. */
interface RevisionConEvidencia {
  readonly reviewId: string;
  readonly evidenceReferences: readonly { readonly type: 'EXECUTION' | 'PLAN_VERSION' | 'OBJECTIVE_VERSION' | 'EVALUATION'; readonly id: string }[];
}

export function EvidenciaRegistrada({
  area,
  revision,
  leer,
  sesionPerdida,
  abrible,
  contenidoDelOrigen,
}: {
  area: AreaDeLaRevision;
  revision: RevisionConEvidencia;
  /** API-NUT-19-EVIDENCIA o API-TRN-23-EVIDENCIA de esta revisión. */
  leer: () => Promise<Resultado<EvidenciaDeRevisionResponse>>;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** Si el área tiene una lectura para abrir ese elemento acá (una comida, una sesión, una versión del plan). */
  abrible: (origen: OrigenDeDato, item: EvidenciaResuelta) => boolean;
  /** Lo que muestra el panel para un elemento abrible. `alNoEstarDisponible`: el permiso de hoy ya no lo deja leer. */
  contenidoDelOrigen: (origen: OrigenDeDato, item: EvidenciaResuelta, alNoEstarDisponible: () => void) => ReactNode;
}) {
  const id = useId();
  const [abierta, setAbierta] = useState(false);
  const [lectura, setLectura] = useState<Resultado<EvidenciaDeRevisionResponse> | null>(null);
  const [abierto, setAbierto] = useState<EvidenciaResuelta | null>(null);
  const partes = resumenDeLaEvidencia(revision.evidenceReferences, area);

  async function cargar() {
    setLectura(null);
    const r = await leer();
    if (sesionPerdida(r)) return;
    setLectura(r);
  }

  if (revision.evidenceReferences.length === 0) return <p className="nota evidencia-registrada__vacia">{COPY_EVIDENCIA_REGISTRADA.sinEvidencia}</p>;

  // El mismo 404 (o un 403) para lo ajeno, lo inexistente y lo que el permiso de hoy ya no deja ver: «sin acceso».
  const sinAcceso = lectura !== null && !lectura.ok && lectura.tipo === 'API' && (lectura.codigo === 'RESOURCE_NOT_FOUND' || lectura.status === 403);
  // Si el origen ya no se puede leer con el permiso de hoy, el panel lo dice y la evidencia se vuelve a pedir.
  const contenido = abierto?.source && abrible(abierto.source, abierto) ? contenidoDelOrigen(abierto.source, abierto, () => void cargar()) : null;
  const aviso = abierto ? avisoAlAbrir(abierto) : null;

  return (
    <div className="evidencia-registrada" data-evidencia-de={revision.reviewId}>
      <p className="evidencia-registrada__resumen">
        <strong>{COPY_EVIDENCIA_REGISTRADA.titulo}:</strong> {partes.join(' · ')}
      </p>
      <button
        type="button"
        className="boton boton--enlace"
        aria-expanded={abierta}
        aria-controls={`${id}-lista`}
        onClick={() => {
          const siguiente = !abierta;
          setAbierta(siguiente);
          if (siguiente && (lectura === null || !lectura.ok)) void cargar();
        }}
      >
        {abierta ? COPY_EVIDENCIA_REGISTRADA.ocultar : COPY_EVIDENCIA_REGISTRADA.ver}
      </button>
      <div id={`${id}-lista`} hidden={!abierta}>
        {abierta ? (
          <>
            <p className="nota">{COPY_EVIDENCIA_REGISTRADA.queEs}</p>
            {lectura === null ? <Cargando /> : null}
            {sinAcceso ? <p className="nota">{COPY_EVIDENCIA_REGISTRADA.noDisponible}</p> : null}
            {lectura !== null && !lectura.ok && !sinAcceso ? <ErrorConReintento mensaje={textoDeFalla(motivoDeFalla(lectura), 'la evidencia de esta revisión')} onReintentar={() => void cargar()} /> : null}
            {lectura?.ok ? <ListaDeEvidencia area={area} items={lectura.datos.data.items} onAbrir={setAbierto} puedeAbrir={(i) => i.source !== null && abrible(i.source, i)} /> : null}
          </>
        ) : null}
      </div>
      <Panel abierto={abierto !== null && contenido !== null} titulo={abierto ? nombreDeLaEvidencia(abierto) : ''} onCerrar={() => setAbierto(null)}>
        {/* DL-154, D-2: si cambió después de la revisión, se dice antes del contenido, con qué cambió y cuándo. Una versión
            reemplazada no cambió: el aviso dice que es la misma y que ya no es la vigente, no que está «como hoy». */}
        {abierto && aviso ? (
          <div className="aviso" role="note">
            <p>{aviso}</p>
            {abierto.changesAfterReview.map((c) => (
              <p key={`${c.kind}|${c.at}`}>{cambioEnPalabras(c, abierto, FORMATO)}</p>
            ))}
          </div>
        ) : null}
        {contenido}
      </Panel>
    </div>
  );
}

function ListaDeEvidencia({ area, items, onAbrir, puedeAbrir }: { area: AreaDeLaRevision; items: readonly EvidenciaResuelta[]; onAbrir: (i: EvidenciaResuelta) => void; puedeAbrir: (i: EvidenciaResuelta) => boolean }) {
  const grupos = gruposDeLaEvidencia(items, area);
  if (grupos.length === 0) return <p className="nota">{COPY_EVIDENCIA_REGISTRADA.sinEvidencia}</p>;
  return (
    <div className="evidencia-registrada__grupos">
      {grupos.map((g) => (
        <section key={g.clave} className="evidencia-registrada__grupo" aria-label={g.titulo}>
          <h4>{g.titulo}</h4>
          <ul className="evidencia-registrada__lista">
            {g.items.map((i) => {
              const cuando = cuandoDeLaEvidencia(i, FORMATO);
              const nombre = nombreDeLaEvidencia(i);
              return (
                <li key={`${i.reference.type}|${i.reference.id}`} className="evidencia-registrada__item" data-estado={i.changesAfterReview.length > 0 ? 'cambio-despues' : i.state === 'NOT_FOUND' ? 'no-encontrada' : 'sin-cambios'}>
                  <span className="evidencia-registrada__que">
                    {/* El separador va en el texto, no solo en el margen: un lector de pantalla lee «22 oct · Desayuno…». */}
                    {cuando ? <span className="evidencia-registrada__cuando">{cuando} · </span> : null}
                    {nombre}
                  </span>
                  {puedeAbrir(i) ? (
                    <button type="button" className="boton boton--quieto boton--compacto" onClick={() => onAbrir(i)}>
                      {COPY_EVIDENCIA_REGISTRADA.abrir}
                      <span className="visualmente-oculto">
                        {' '}
                        {nombre}
                        {cuando ? `, ${cuando}` : ''}
                      </span>
                    </button>
                  ) : null}
                  {i.changesAfterReview.map((c) => (
                    <p key={`${c.kind}|${c.at}`} className="nota evidencia-registrada__cambio">
                      {cambioEnPalabras(c, i, FORMATO)}
                    </p>
                  ))}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
