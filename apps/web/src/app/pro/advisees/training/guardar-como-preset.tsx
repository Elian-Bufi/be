'use client';

/**
 * DL-203 (WP-PRESETS-POR-NIVEL) · «Guardar como preset» desde el «…» de una sesión o de una fase. Lo guarda API-HAB-07 con
 * su nivel (`SESION` o `FASE`), sin cargas ni notas, y lo dice antes, como «Guardar como prescripción habitual» (ED-13):
 * qué no se guarda y qué textos escritos viajan con el preset, para revisar que no nombren a la persona. Un nombre en uso
 * por un preset del mismo nivel se reemplaza solo si el profesional lo elige, con la versión que leyó.
 */
import {
  nombreNormalizadoDePlantilla,
  type GuardarPrescripcionHabitualRequest,
  type PresetDeFaseContenido,
  type PresetDeSesionContenido,
  type PresetParaGuardar,
  type PresetPropioDeEntrenamiento,
} from '@be/domain';
import { useEffect, useId, useState } from 'react';
import { DialogoDeConfirmacion } from '../../../../components/dialogo';
import { Aviso, Campo } from '../../../../components/formulario';
import { api } from '../../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';

export type QueSeGuardaComoPreset =
  | { readonly tipo: 'SESION'; readonly de: string; readonly armado: PresetParaGuardar<PresetDeSesionContenido> }
  | { readonly tipo: 'FASE'; readonly de: string; readonly armado: PresetParaGuardar<PresetDeFaseContenido> };

export const COPY_GUARDAR_COMO_PRESET = {
  accion: 'Guardar como preset',
  titulo: (tipo: 'SESION' | 'FASE', de: string) => (tipo === 'SESION' ? `Guardar la sesión «${de}» como preset` : `Guardar la fase «${de}» como preset`),
  nombre: 'Nombre del preset',
  ejemplo: (tipo: 'SESION' | 'FASE') => (tipo === 'SESION' ? 'Por ejemplo, «Torso A · fuerza».' : 'Por ejemplo, «Base de 4 semanas · 3 días».'),
  seGuarda: (tipo: 'SESION' | 'FASE') =>
    tipo === 'SESION'
      ? 'Se guardan los ejercicios con sus series, repeticiones y objetivos, el criterio de intensidad (en % RM, el %), los descansos, los bloques, las aproximaciones y las indicaciones. Lo ves solo vos.'
      : 'Se guardan el nombre, las semanas, las sesiones con sus ejercicios y sus series, los días de cada sesión, la progresión de la fase y las aproximaciones. En % RM se guarda el %. Lo ves solo vos.',
  noSeGuarda: (que: readonly string[]) => `No se guardan ${que.join(' ni ')}.`,
  escritos: (cuales: readonly string[]) => `Se guardan también ${cuales.join(', ')}: revisá que no nombren a la persona, porque el preset se usa en otros planes.`,
  guardar: 'Guardar el preset',
  reemplazar: 'Reemplazar el que se llama así',
  seReemplaza: (nombre: string) => `Ya tenés un preset llamado «${nombre}»: se reemplaza por este.`,
  deOtroNivel: (nombre: string, nivel: string) => `Ya tenés un preset ${nivel} llamado «${nombre}». Elegí otro nombre.`,
  nombreTomado: 'Ya tenés un preset con ese nombre. Elegí otro nombre o reemplazalo.',
  cancelar: 'Cancelar',
  guardado: (nombre: string, tipo: 'SESION' | 'FASE') => `Se guardó «${nombre}» en tus presets de ${tipo === 'SESION' ? 'sesión' : 'fase'}.`,
} as const;

/** DL-203: los textos del editor al usar un preset de sesión o de fase, y las acciones de los menús. */
export const COPY_PRESETS_EN_EL_EDITOR = {
  usarPresetDeSesion: 'Usar un preset de sesión',
  agregarFaseDesdePreset: 'Agregar una fase desde un preset',
  topeDeFases: (n: number) => `Un plan lleva hasta ${n} fases.`,
  topeDeSesiones: (n: number) => `Esta fase ya tiene ${n} sesiones, el máximo.`,
  sesionAplicada: (preset: string, en: string | null) => (en ? `«${preset}» quedó en «${en}». Ctrl+Z lo deshace.` : `«${preset}» quedó como sesión nueva, al final de la fase. Ctrl+Z lo deshace.`),
  faseAplicada: (preset: string, sinDias: boolean) =>
    sinDias
      ? `«${preset}» quedó como fase nueva, con sus sesiones y sus semanas. Los días no se pusieron: sin el inicio del plan y las semanas de cada fase, las dos fases irían a la vez. Ctrl+Z lo deshace.`
      : `«${preset}» quedó como fase nueva, con sus sesiones, sus semanas y sus días. Ctrl+Z lo deshace.`,
} as const;

const NIVEL: Record<PresetPropioDeEntrenamiento['kind'], string> = { SERIES: 'de series', SESION: 'de sesión', FASE: 'de fase' };
const mismoNombre = (a: string, b: string): boolean => nombreNormalizadoDePlantilla(a) === nombreNormalizadoDePlantilla(b);

export function DialogoGuardarComoPreset({
  token,
  que,
  existentes,
  onCerrar,
  onGuardado,
}: {
  token: string;
  /** Lo que se guarda, ya armado (`presetDeSesionDe` o `presetDeFaseDe`); `null`, cerrado. */
  que: QueSeGuardaComoPreset | null;
  /** Los presets propios de los tres niveles: el nombre es único entre todos (PN-D09). */
  existentes: readonly PresetPropioDeEntrenamiento[];
  onCerrar: () => void;
  onGuardado: (guardado: PresetPropioDeEntrenamiento) => void;
}) {
  const id = useId();
  const intento = useClaveDeIntento();
  const C = COPY_GUARDAR_COMO_PRESET;
  const [nombre, setNombre] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!que) return;
    setNombre(que.de);
    setError(null);
    // Se arma al abrir: lo que cambie en el plan mientras está abierto no cambia lo que se guarda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [que === null]);
  const homonimo = nombre.trim() ? (existentes.find((p) => mismoNombre(p.name, nombre)) ?? null) : null;
  const reemplaza = homonimo && que && homonimo.kind === que.tipo ? homonimo : null;
  const deOtroNivel = homonimo && que && homonimo.kind !== que.tipo ? homonimo : null;

  async function guardar() {
    if (!que || deOtroNivel) return;
    setEnviando(true);
    setError(null);
    const base = { name: nombre.trim(), ...(reemplaza ? { replaces: reemplaza.presetId, expectedVersion: reemplaza.version } : {}) };
    const cuerpo: GuardarPrescripcionHabitualRequest = que.tipo === 'SESION' ? { ...base, kind: 'SESION', session: que.armado.contenido } : { ...base, kind: 'FASE', phase: que.armado.contenido };
    const r = await api.guardarPrescripcionHabitual(token, cuerpo, intento.actual());
    intento.registrar(r);
    setEnviando(false);
    if (!r.ok && r.tipo === 'API' && r.codigo === 'PRESET_NAME_TAKEN') return setError(C.nombreTomado);
    if (!r.ok) return setError(mensajeDeFallo(r));
    onGuardado(r.datos.data);
  }

  return (
    <DialogoDeConfirmacion
      abierto={que !== null}
      titulo={que ? C.titulo(que.tipo, que.de) : C.accion}
      textoVolver={C.cancelar}
      textoConfirmar={reemplaza ? C.reemplazar : C.guardar}
      textoEnviando="Guardando…"
      enviando={enviando}
      error={error}
      confirmarDeshabilitado={nombre.trim().length === 0 || !!deOtroNivel}
      onVolver={onCerrar}
      onConfirmar={() => void guardar()}
    >
      {que ? (
        <>
          <Campo id={`${id}-nombre`} etiqueta={C.nombre} ayuda={C.ejemplo(que.tipo)} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />
          {reemplaza ? (
            <Aviso tipo="info">
              <p>{C.seReemplaza(reemplaza.name)}</p>
            </Aviso>
          ) : null}
          {deOtroNivel ? (
            <p className="campo__error" data-nombre-de-otro-nivel>
              {C.deOtroNivel(deOtroNivel.name, NIVEL[deOtroNivel.kind])}
            </p>
          ) : null}
          <p className="nota">{C.seGuarda(que.tipo)}</p>
          {que.armado.seQuita.length > 0 ? (
            <p className="nota" data-no-se-guarda>
              {C.noSeGuarda(que.armado.seQuita)}
            </p>
          ) : null}
          {que.armado.seGuardanEscritos.length > 0 ? (
            <p className="nota" data-se-guardan-escritos>
              {C.escritos(que.armado.seGuardanEscritos)}
            </p>
          ) : null}
        </>
      ) : null}
    </DialogoDeConfirmacion>
  );
}
