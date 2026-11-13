'use client';

/**
 * ED-13 (WP-EDITORES-PROFESIONAL; DL-167) · Las prescripciones habituales en el website: «Estas series, como prescripción
 * habitual» (ED-12) y la lectura para la galería (ED-11, «Tuyos»). Las guarda API-HAB-07 sin cargas ni notas (las cargas
 * son de cada persona y de cada ejercicio; las notas pueden nombrarla), y lo dice antes. Un nombre en uso se reemplaza
 * solo si el profesional lo elige, con la versión que leyó (`replaces` y `expectedVersion`).
 */
import { nombreNormalizadoDePlantilla, prescripcionHabitualDe, type EstructuraDePlanDeEntrenamientoEntrada, type GuardarPrescripcionHabitualRequest, type PrescripcionHabitual } from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { DialogoDeConfirmacion } from '../../../../components/dialogo';
import { Aviso, Campo } from '../../../../components/formulario';
import { api } from '../../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';

type SesionE = NonNullable<EstructuraDePlanDeEntrenamientoEntrada['blocks'][number]['sessions']>[number];
type PrescripcionE = SesionE['prescriptions'][number];

export const COPY_PRESCRIPCION_HABITUAL = {
  titulo: 'Guardar como prescripción habitual',
  deQueEjercicio: 'Las series de',
  nombre: 'Nombre',
  ejemplo: 'Por ejemplo, «Mi fuerza 5×3 · RIR 1».',
  seGuarda: 'Se guardan las series, sus repeticiones y objetivos, el criterio de intensidad, el descanso y las bases. Lo ves solo vos.',
  noSeGuarda: (que: readonly string[]) => `No se guardan ${que.join(' ni ')}.`,
  guardar: 'Guardar la prescripción',
  reemplazar: 'Reemplazar la que se llama así',
  seReemplaza: (nombre: string) => `Ya tenés una prescripción habitual llamada «${nombre}»: se reemplaza por esta.`,
  nombreTomado: 'Ya tenés una prescripción habitual con ese nombre. Elegí otro nombre o reemplazala.',
  sinSeries: 'Este ejercicio todavía no tiene series.',
  cancelar: 'Cancelar',
  guardada: (nombre: string) => `Se guardó «${nombre}» en tus presets de prescripción.`,
} as const;

const mismoNombre = (a: string, b: string): boolean => nombreNormalizadoDePlantilla(a) === nombreNormalizadoDePlantilla(b);

/** API-HAB-06: las propias y activas, hasta 200. Sin permiso (403), la lista queda vacía y no es una falla. */
export function usePrescripcionesHabituales(token: string) {
  const [estado, setEstado] = useState<{ readonly lista: readonly PrescripcionHabitual[]; readonly lectura: 'cargando' | 'lista' | 'falla' }>({ lista: [], lectura: 'cargando' });
  const generacion = useRef(0);
  const recargar = useCallback(async () => {
    const esta = ++generacion.current;
    const r = await api.listarPrescripcionesHabituales(token);
    if (esta !== generacion.current) return;
    if (r.ok) setEstado({ lista: r.datos.data, lectura: 'lista' });
    else setEstado((e) => ({ lista: e.lista, lectura: r.tipo === 'API' && r.status === 403 ? 'lista' : 'falla' }));
  }, [token]);
  useEffect(() => {
    void recargar();
  }, [recargar]);
  return { ...estado, recargar };
}

export function DialogoGuardarPrescripcionHabitual({
  token,
  abierto,
  ejercicios,
  existentes,
  onCerrar,
  onGuardada,
}: {
  token: string;
  abierto: boolean;
  /** Los ejercicios de la sesión que se mira, con su nombre. */
  ejercicios: readonly { readonly nombre: string; readonly prescripcion: PrescripcionE }[];
  existentes: readonly PrescripcionHabitual[];
  onCerrar: () => void;
  onGuardada: (guardada: PrescripcionHabitual) => void;
}) {
  const id = useId();
  const intento = useClaveDeIntento();
  const C = COPY_PRESCRIPCION_HABITUAL;
  const [elegido, setElegido] = useState(0);
  const [nombre, setNombre] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicto, setConflicto] = useState<PrescripcionHabitual | null>(null);
  useEffect(() => {
    if (!abierto) return;
    const conSeries = ejercicios.findIndex((e) => e.prescripcion.sets.length > 0);
    setElegido(conSeries < 0 ? 0 : conSeries);
    setNombre('');
    setError(null);
    setConflicto(null);
    // Se elige al abrir: lo que cambie la sesión mientras está abierto no mueve la elección.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);
  const ejercicio = ejercicios[elegido] ?? null;
  const guardado = ejercicio && ejercicio.prescripcion.sets.length > 0 ? prescripcionHabitualDe(ejercicio.prescripcion) : null;
  const existente = nombre.trim() ? (existentes.find((h) => mismoNombre(h.name, nombre)) ?? (conflicto && mismoNombre(conflicto.name, nombre) ? conflicto : null)) : null;

  async function guardar() {
    if (!guardado) return;
    setEnviando(true);
    setError(null);
    const cuerpo = { name: nombre.trim(), prescription: guardado.contenido, ...(existente ? { replaces: existente.presetId, expectedVersion: existente.version } : {}) } as GuardarPrescripcionHabitualRequest;
    const r = await api.guardarPrescripcionHabitual(token, cuerpo, intento.actual());
    intento.registrar(r);
    if (!r.ok && r.tipo === 'API' && r.codigo === 'PRESET_NAME_TAKEN') {
      // La lista que teníamos no la conocía: se vuelve a leer para ofrecer el reemplazo.
      const lista = await api.listarPrescripcionesHabituales(token);
      const encontrada = lista.ok ? lista.datos.data.find((h) => mismoNombre(h.name, nombre)) : undefined;
      setEnviando(false);
      if (encontrada) return setConflicto(encontrada);
      return setError(C.nombreTomado);
    }
    setEnviando(false);
    if (!r.ok) return setError(mensajeDeFallo(r));
    onGuardada(r.datos.data);
  }

  return (
    <DialogoDeConfirmacion
      abierto={abierto}
      titulo={C.titulo}
      textoVolver={C.cancelar}
      textoConfirmar={existente ? C.reemplazar : C.guardar}
      textoEnviando="Guardando…"
      enviando={enviando}
      error={error}
      confirmarDeshabilitado={nombre.trim().length === 0 || !guardado}
      onVolver={onCerrar}
      onConfirmar={() => void guardar()}
    >
      <div className="campo">
        <label htmlFor={`${id}-ejercicio`}>{C.deQueEjercicio}</label>
        <select id={`${id}-ejercicio`} value={elegido} onChange={(e) => setElegido(Number(e.target.value))}>
          {ejercicios.map((e, n) => (
            <option key={n} value={n}>
              {n + 1}. {e.nombre}
            </option>
          ))}
        </select>
      </div>
      <Campo id={`${id}-nombre`} etiqueta={C.nombre} ayuda={C.ejemplo} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />
      {existente ? (
        <Aviso tipo="info">
          <p>{C.seReemplaza(existente.name)}</p>
        </Aviso>
      ) : null}
      {guardado ? (
        <>
          <p className="nota">{C.seGuarda}</p>
          {guardado.seQuita.length > 0 ? (
            <p className="nota" data-no-se-guarda>
              {C.noSeGuarda(guardado.seQuita)}
            </p>
          ) : null}
        </>
      ) : (
        <p className="nota">{C.sinSeries}</p>
      )}
    </DialogoDeConfirmacion>
  );
}
