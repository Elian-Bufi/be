'use client';

/**
 * «Mis habituales» en el plan de entrenamiento (PF-09 bis; DL-109):
 * - **Ejercicios habituales**: los que el profesional marca en el buscador quedan a mano, arriba de los resultados, y
 *   se agregan con un clic. Marcar y quitar es la misma operación (API-HAB-02) y la lista se actualiza al instante,
 *   con vuelta atrás si la API falla.
 * - **Sesiones habituales**: «Guardar como habitual» en una sesión abre un diálogo con el nombre (el rótulo de la
 *   sesión), el interruptor de cargas apagado (DL-108 D-2) y cada nota de texto libre para vaciarla una por una
 *   (D-3). Si ya hay una sesión habitual con ese nombre, se avisa que se reemplaza (DL-109 D-2) y el botón lo dice.
 *   «Agregar una sesión habitual» inserta una copia sin identificadores de nodo en el borrador: el servidor asigna
 *   los ids al guardar, así la misma sesión se puede insertar dos veces.
 */
import {
  COPY_HABITUALES,
  nombreNormalizadoDePlantilla,
  notasDeLaSesion,
  sinIdentificadoresDeSesion,
  vaciarNota,
  type EjercicioDeCatalogo,
  type SesionEntrada,
  type SesionHabitual,
} from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Ayuda } from '../../../../components/ayuda';
import { DialogoDeConfirmacion } from '../../../../components/dialogo';
import { Aviso, Campo } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';

// ─── Ejercicios habituales ─────────────────────────────────────────────────────────────────────

/** La lista de ejercicios habituales del profesional, cargada una vez por editor; marcar y quitar con vuelta atrás si falla. */
export function useEjerciciosHabituales(token: string) {
  const [habituales, setHabituales] = useState<readonly EjercicioDeCatalogo[]>([]);
  // La lista vigente, para que alternar no dependa de un cierre viejo.
  const vigentes = useRef<readonly EjercicioDeCatalogo[]>([]);
  vigentes.current = habituales;
  useEffect(() => {
    let vigente = true;
    // Un 403 (profesional sin Entrenamiento) o cualquier fallo deja la lista vacía y sin aviso: el bloque es una comodidad.
    void api.listarEjerciciosHabituales(token).then((r) => {
      if (vigente) setHabituales(r.ok ? r.datos.data : []);
    });
    return () => {
      vigente = false;
    };
  }, [token]);
  const esHabitual = useCallback((exerciseId: string) => habituales.some((h) => h.exerciseId === exerciseId), [habituales]);
  const alternar = useCallback(
    async (ejercicio: EjercicioDeCatalogo): Promise<boolean> => {
      const anterior = vigentes.current;
      const marcado = anterior.some((h) => h.exerciseId === ejercicio.exerciseId);
      setHabituales(marcado ? anterior.filter((h) => h.exerciseId !== ejercicio.exerciseId) : [ejercicio, ...anterior]);
      const r = await api.marcarEjercicioHabitual(token, ejercicio.exerciseId, { state: marcado ? 'REMOVED' : 'MARKED' });
      if (!r.ok) {
        setHabituales(anterior);
        return false;
      }
      return true;
    },
    [token],
  );
  return { habituales, esHabitual, alternar };
}
export type EjerciciosHabituales = ReturnType<typeof useEjerciciosHabituales>;

/** «Mis habituales» arriba de los resultados del buscador: un botón por ejercicio, que lo agrega a la sesión. */
export function BloqueDeHabituales({ habituales, onElegir }: { habituales: readonly EjercicioDeCatalogo[]; onElegir: (e: EjercicioDeCatalogo) => void }) {
  const id = useId();
  return (
    <div className="grupo habituales" role="group" aria-labelledby={`${id}-titulo`}>
      <p id={`${id}-titulo`} className="lista__titulo">
        {COPY_HABITUALES.misHabituales}
      </p>
      {habituales.length === 0 ? (
        <p className="nota">{COPY_HABITUALES.sinEjerciciosHabituales}</p>
      ) : (
        <div className="acciones">
          {habituales.map((h) => (
            <button key={h.exerciseId} type="button" className="boton boton--secundario" onClick={() => onElegir(h)} aria-label={`Elegir ${h.name}`}>
              {h.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Marcar o quitar un ejercicio de los habituales, en cada resultado del buscador. */
export function BotonHabitual({ ejercicio, marcado, onAlternar }: { ejercicio: EjercicioDeCatalogo; marcado: boolean; onAlternar: (e: EjercicioDeCatalogo) => void }) {
  return (
    <button type="button" className="boton boton--enlace" aria-pressed={marcado} onClick={() => onAlternar(ejercicio)}>
      {marcado ? COPY_HABITUALES.quitarMarca : COPY_HABITUALES.marcar}
    </button>
  );
}

// ─── Sesiones habituales ───────────────────────────────────────────────────────────────────────

/** Todas las sesiones habituales del profesional (hasta cuatro páginas), para el selector y para detectar el nombre repetido. */
export function useSesionesHabituales(token: string) {
  const [sesiones, setSesiones] = useState<readonly SesionHabitual[]>([]);
  // Una respuesta vieja no pisa una recarga posterior.
  const generacion = useRef(0);
  const recargar = useCallback(async () => {
    const esta = ++generacion.current;
    const todas: SesionHabitual[] = [];
    let cursor: string | undefined;
    for (let pagina = 0; pagina < 4; pagina += 1) {
      const r = await api.listarSesionesHabituales(token, cursor ? { cursor } : {});
      // Un 403 (profesional sin Entrenamiento) o un fallo deja lo que se pudo leer: el selector es una comodidad.
      if (!r.ok) break;
      todas.push(...r.datos.data);
      if (!r.datos.page.hasMore || !r.datos.page.nextCursor) break;
      cursor = r.datos.page.nextCursor;
    }
    if (esta === generacion.current) setSesiones(todas);
  }, [token]);
  useEffect(() => {
    void recargar();
  }, [recargar]);
  return { sesiones, recargar };
}

const mismoNombre = (a: string, b: string): boolean => nombreNormalizadoDePlantilla(a) === nombreNormalizadoDePlantilla(b);

export function DialogoGuardarSesionHabitual({
  token,
  abierto,
  sesion,
  existentes,
  onCerrar,
  onGuardada,
}: {
  token: string;
  abierto: boolean;
  /** La sesión tal como está en el editor; `null` mientras el diálogo está cerrado. */
  sesion: SesionEntrada | null;
  existentes: readonly SesionHabitual[];
  onCerrar: () => void;
  onGuardada: (guardada: SesionHabitual) => void;
}) {
  const id = useId();
  const intento = useClaveDeIntento();
  const [nombre, setNombre] = useState('');
  const [conCargas, setConCargas] = useState(false);
  const [estructura, setEstructura] = useState<SesionEntrada | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Un 409 con la lista desactualizada: la que ya existe con ese nombre, leída de nuevo, para ofrecer reemplazarla.
  const [conflicto, setConflicto] = useState<SesionHabitual | null>(null);
  useEffect(() => {
    if (abierto) {
      setNombre(sesion?.label ?? '');
      setEstructura(sesion);
      setConCargas(false);
      setError(null);
      setConflicto(null);
    }
  }, [abierto, sesion]);
  const notas = estructura ? notasDeLaSesion(estructura) : [];
  const existente = nombre.trim() ? (existentes.find((h) => mismoNombre(h.name, nombre)) ?? (conflicto && mismoNombre(conflicto.name, nombre) ? conflicto : null)) : null;

  async function guardar() {
    if (!estructura) return;
    setEnviando(true);
    setError(null);
    const r = await api.guardarSesionHabitual(
      token,
      { name: nombre.trim(), structure: sinIdentificadoresDeSesion(estructura), copySuggestedLoads: conCargas, ...(existente ? { replaces: existente.presetId } : {}) },
      intento.actual(),
    );
    intento.registrar(r);
    if (!r.ok && esCodigo(r, 'PRESET_NAME_TAKEN')) {
      // La lista que teníamos no la conocía: se vuelve a leer para ofrecer el reemplazo con el mismo aviso.
      const lista = await api.listarSesionesHabituales(token, {});
      const encontrada = lista.ok ? lista.datos.data.find((h) => mismoNombre(h.name, nombre)) : undefined;
      setEnviando(false);
      if (encontrada) return setConflicto(encontrada);
      return setError(COPY_HABITUALES.nombreTomado);
    }
    setEnviando(false);
    if (!r.ok) return setError(mensajeDeFallo(r));
    onGuardada(r.datos.data);
  }

  return (
    <DialogoDeConfirmacion
      abierto={abierto}
      titulo={COPY_HABITUALES.guardarComoHabitual}
      textoVolver={COPY_HABITUALES.cancelar}
      textoConfirmar={existente ? COPY_HABITUALES.reemplazar : COPY_HABITUALES.guardarSesion}
      textoEnviando="Guardando…"
      enviando={enviando}
      error={error}
      confirmarDeshabilitado={nombre.trim().length === 0 || !estructura}
      onVolver={onCerrar}
      onConfirmar={() => void guardar()}
    >
      <Campo id={`${id}-nombre`} etiqueta={COPY_HABITUALES.nombre} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />
      {existente ? (
        <Aviso tipo="info">
          <p>{COPY_HABITUALES.seReemplazaSesion(existente.name)}</p>
        </Aviso>
      ) : null}
      <div className="campo">
        <label>
          <input type="checkbox" checked={conCargas} onChange={(e) => setConCargas(e.target.checked)} /> {COPY_HABITUALES.cargas}
        </label>
        <p className="nota">{COPY_HABITUALES.cargasAyuda}</p>
      </div>
      <h4>{COPY_HABITUALES.notasTitulo}</h4>
      {notas.length === 0 ? (
        <p className="nota">{COPY_HABITUALES.sinNotas}</p>
      ) : (
        <>
          <p className="nota">{COPY_HABITUALES.notasAyuda}</p>
          <ul className="lista-compacta">
            {notas.map((n) => (
              <li key={n.lugar}>
                <span className="nota">{n.rotulo}:</span> «{n.texto}»{' '}
                <button type="button" className="boton boton--enlace" onClick={() => setEstructura((e) => (e ? vaciarNota(e, n.lugar) : e))} aria-label={`${COPY_HABITUALES.vaciarNota}: ${n.rotulo}`}>
                  {COPY_HABITUALES.vaciarNota}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {/* DL-113: lo que explica el habitual, plegado y al final: así el foco del diálogo abre en el nombre. */}
      <Ayuda titulo="Qué se copia y quién lo ve">
        <p>{COPY_HABITUALES.queCopiaSesion}</p>
        <p>{COPY_HABITUALES.soloTuyos}</p>
      </Ayuda>
    </DialogoDeConfirmacion>
  );
}

/** Elegir una sesión habitual e insertar una copia (sin identificadores) donde está el botón «Agregar sesión». */
export function InsertarSesionHabitual({ id, sesiones, onInsertar }: { id: string; sesiones: readonly SesionHabitual[]; onInsertar: (h: SesionHabitual) => void }) {
  const [elegida, setElegida] = useState('');
  if (sesiones.length === 0) return null;
  return (
    <div className="campo">
      <label htmlFor={`${id}-habitual`}>{COPY_HABITUALES.agregarSesion}</label>
      <select id={`${id}-habitual`} value={elegida} onChange={(e) => setElegida(e.target.value)}>
        <option value="">—</option>
        {sesiones.map((h) => (
          <option key={h.presetId} value={h.presetId}>
            {h.name} · {COPY_HABITUALES.ejercicios(h.prescriptionCount)} · {h.copiedLoads ? COPY_HABITUALES.conCargas : COPY_HABITUALES.sinCargas}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="boton boton--secundario"
        disabled={!elegida}
        onClick={() => {
          const h = sesiones.find((x) => x.presetId === elegida);
          if (!h) return;
          onInsertar(structuredClone(h));
          setElegida('');
        }}
      >
        {COPY_HABITUALES.insertarSesion}
      </button>
    </div>
  );
}

/** Los nombres vigentes de los ejercicios de una sesión habitual, por versión, para el editor. */
export const nombresDeHabitual = (h: SesionHabitual): Record<string, string> => Object.fromEntries(Object.entries(h.exercises).map(([versionId, e]) => [versionId, e.exerciseName]));

function esCodigo(r: Resultado<unknown>, codigo: string): boolean {
  return !r.ok && r.tipo === 'API' && r.codigo === codigo;
}
