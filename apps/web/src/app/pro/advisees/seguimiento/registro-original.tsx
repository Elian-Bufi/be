'use client';

/**
 * «Abrir registro» (encargo §5 y §8; PRO-05): el registro de origen de una entrada de la línea de tiempo o de un punto de
 * Analizar, leído por su propia operación —API-ING-03 para una comida, API-TRN-19 para una sesión, la evaluación para una
 * toma—, que vuelve a decidir con el PDP. Se abre en un `<dialog>` modal: retiene el foco, Esc lo cierra y el foco vuelve
 * al disparador. Al cerrarlo, la vista sigue como estaba (período, filtros, métricas y posición), porque nada navegó.
 * La pestaña del dominio sigue a un clic, para ver el registro en su contexto completo.
 * Si el PDP ya no deja leer el registro (un permiso revocado después de cargar la pantalla), el panel lo dice y avisa a
 * quien lo abrió (`onNoDisponible`): lo que hay en pantalla puede ser viejo y se vuelve a pedir.
 */
import {
  cantidad,
  ETIQUETA_DE_CLASE_DE_DATO,
  nombreDeMetrica,
  numero,
  type EjecucionDeEntrenamiento,
  type EvaluacionAntropometricaApi,
  type OrigenDeDato,
  type RegistroDeEjecucion,
} from '@be/domain';
import Link from 'next/link';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { api } from '../../../../lib/api';
import { fecha } from '../../../../lib/formato';
import { DetalleDeRegistroDeComida } from '../nutrition/detalle-de-registro';
import { Registro } from '../training/ejecuciones';
import { textoDeFalla, useLectura, useSeguimiento } from './contexto';

const DESTINO: Readonly<Partial<Record<OrigenDeDato['type'], { readonly ruta: string; readonly vista: string; readonly texto: string }>>> = {
  MEAL_RECORD: { ruta: '/pro/advisees/nutrition', vista: 'registros', texto: 'Ver en Nutrición · Registros' },
  NUTRITION_PLAN_VERSION: { ruta: '/pro/advisees/nutrition', vista: 'plan', texto: 'Ver en Nutrición · Plan' },
  NUTRITION_OBJECTIVE_VERSION: { ruta: '/pro/advisees/nutrition', vista: 'resumen', texto: 'Ver en Nutrición' },
  NUTRITION_REVIEW: { ruta: '/pro/advisees/nutrition', vista: 'revisiones', texto: 'Ver en Nutrición · Revisiones' },
  TRAINING_EXECUTION: { ruta: '/pro/advisees/training', vista: 'ejecuciones', texto: 'Ver en Entrenamiento · Ejecuciones' },
  TRAINING_PLAN_VERSION: { ruta: '/pro/advisees/training', vista: 'plan', texto: 'Ver en Entrenamiento · Plan' },
  TRAINING_OBJECTIVE_VERSION: { ruta: '/pro/advisees/training', vista: 'resumen', texto: 'Ver en Entrenamiento' },
  TRAINING_REVIEW: { ruta: '/pro/advisees/training', vista: 'revisiones', texto: 'Ver en Entrenamiento · Revisiones' },
  ANTHROPOMETRIC_EVALUATION: { ruta: '/pro/advisees/anthropometry', vista: 'evaluaciones', texto: 'Ver en Antropometría · Evaluaciones' },
  ANTHROPOMETRIC_MEASUREMENT: { ruta: '/pro/advisees/anthropometry', vista: 'evaluaciones', texto: 'Ver en Antropometría · Evaluaciones' },
  FOLLOW_UP_PROCESS: { ruta: '/pro/advisees', vista: '', texto: 'Ver el resumen' },
};

export function PanelDeRegistro({
  origen,
  titulo,
  onCerrar,
  onNoDisponible,
  children,
}: {
  origen: OrigenDeDato | null;
  titulo: string;
  onCerrar: () => void;
  onNoDisponible?: () => void;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const { asesoradoId } = useSeguimiento();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (origen && !d.open) d.showModal();
    if (!origen && d.open) d.close();
  }, [origen]);
  const destino = origen ? DESTINO[origen.type] : undefined;
  return (
    <dialog
      ref={ref}
      className="dialogo dialogo--panel"
      aria-labelledby={`${id}-titulo`}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
    >
      <div className="dialogo__encabezado">
        <h2 id={`${id}-titulo`}>{titulo}</h2>
        <button type="button" className="boton boton--secundario" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
      {children}
      {origen ? <ContenidoDelRegistro origen={origen} onNoDisponible={onNoDisponible} /> : null}
      {origen && destino ? (
        <p>
          <Link href={`${destino.ruta}?id=${encodeURIComponent(asesoradoId)}${destino.vista ? `&vista=${destino.vista}` : ''}`}>{destino.texto}</Link>
        </p>
      ) : null}
    </dialog>
  );
}

function ContenidoDelRegistro({ origen, onNoDisponible }: { origen: OrigenDeDato; onNoDisponible?: () => void }) {
  const { token, sesionPerdida } = useSeguimiento();
  if (origen.type === 'MEAL_RECORD') return <DetalleDeRegistroDeComida registroId={origen.id} token={token} sesionPerdida={sesionPerdida} />;
  if (origen.type === 'TRAINING_EXECUTION') return <SesionRegistrada executionId={origen.id} onNoDisponible={onNoDisponible} />;
  if (origen.type === 'ANTHROPOMETRIC_EVALUATION') return <TomaRegistrada evaluationId={origen.id} onNoDisponible={onNoDisponible} />;
  return <p className="nota">Este hecho no tiene un registro propio para abrir acá: el enlace lleva a su pestaña.</p>;
}

/** Avisa una vez cuando la lectura dice «no disponible» (el PDP denegó con el acceso de ahora). */
function useAvisoDeNoDisponible(tipo: string, onNoDisponible?: () => void) {
  const aviso = useRef(onNoDisponible);
  aviso.current = onNoDisponible;
  useEffect(() => {
    if (tipo === 'no-disponible') aviso.current?.();
  }, [tipo]);
}

function SesionRegistrada({ executionId, onNoDisponible }: { executionId: string; onNoDisponible?: () => void }) {
  const { token } = useSeguimiento();
  const { lectura, recargar } = useLectura<{ data: EjecucionDeEntrenamiento }>(`sesion|${executionId}`, () => api.consultarEjecucionDeEntrenamiento(token, executionId));
  useAvisoDeNoDisponible(lectura.tipo, onNoDisponible);
  if (lectura.tipo === 'cargando') return <Cargando />;
  if (lectura.tipo === 'no-disponible') return <p className="nota">Este registro no está disponible con tu acceso actual.</p>;
  if (lectura.tipo === 'error') return <ErrorConReintento mensaje={textoDeFalla(lectura.motivo, 'la sesión registrada')} onReintentar={recargar} />;
  const x = lectura.datos.data;
  const vigente: RegistroDeEjecucion | null =
    x.effectiveView.kind === 'ORIGINAL' ? x.original : x.effectiveView.kind === 'CORRECTED' ? (x.corrections.find((c) => c.correctionId === (x.effectiveView as { correctionId: string }).correctionId)?.correction ?? null) : null;
  return (
    <div className="detalle-de-valores">
      <p>
        <strong>{x.plannedSession.label}</strong> · ocurrió el {fecha(x.occurredAt)} · registrada el {fecha(x.recordedAt)}
      </p>
      {x.corrections.length > 0 ? (
        <p className="nota">
          {x.effectiveView.kind === 'CORRECTED' ? 'Se muestra la corrección vigente' : 'Tiene correcciones'}:{' '}
          {x.corrections.map((c) => `${c.author.displayName}, ${fecha(c.recordedAt)} («${c.reason}»)`).join(' · ')}
        </p>
      ) : null}
      {vigente ? <Registro registro={vigente} planificado={x.plannedSession.prescriptions} /> : <p className="nota">La cadena de correcciones no se puede resolver: no hay un registro vigente.</p>}
    </div>
  );
}

function TomaRegistrada({ evaluationId, onNoDisponible }: { evaluationId: string; onNoDisponible?: () => void }) {
  const { token } = useSeguimiento();
  const { lectura, recargar } = useLectura<{ data: EvaluacionAntropometricaApi }>(`toma|${evaluationId}`, () => api.consultarEvaluacionAntropometrica(token, evaluationId));
  useAvisoDeNoDisponible(lectura.tipo, onNoDisponible);
  if (lectura.tipo === 'cargando') return <Cargando />;
  if (lectura.tipo === 'no-disponible') return <p className="nota">Esta toma no está disponible con tu acceso actual.</p>;
  if (lectura.tipo === 'error') return <ErrorConReintento mensaje={textoDeFalla(lectura.motivo, 'la toma registrada')} onReintentar={recargar} />;
  const e = lectura.datos.data;
  return (
    <div className="detalle-de-valores">
      <p>
        Toma del {fecha(e.occurredAt)} · registrada el {fecha(e.registeredAt ?? e.recordedAt)} · {e.author.displayName}
      </p>
      <div className="desplazable-x">
        <table className="tabla">
          <caption className="visualmente-oculto">Mediciones de la toma</caption>
          <thead>
            <tr>
              <th scope="col">Medición</th>
              <th scope="col">Valor vigente</th>
              <th scope="col">Clase</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {e.measurements.map((m) => (
              <tr key={m.measurementId}>
                <th scope="row">{nombreDeMetrica(m.metric)}</th>
                <td className="numero">{m.effectiveMagnitude ? cantidad(m.effectiveMagnitude.value, m.effectiveMagnitude.unit) : 'Sin valor vigente'}</td>
                <td>{ETIQUETA_DE_CLASE_DE_DATO[m.dataClass]}</td>
                <td>
                  {m.annulment ? `Anulada (${m.annulment.reason})` : m.corrections.length > 0 ? `Corregida: era ${numero(m.magnitude.value)} ${m.magnitude.unit}` : 'Vigente'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="nota">Protocolo: {e.measurements[0]?.protocol.protocolName ?? 'sin dato'}</p>
    </div>
  );
}
