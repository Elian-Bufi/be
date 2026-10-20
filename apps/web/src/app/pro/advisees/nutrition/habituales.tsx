'use client';

/**
 * «Mis habituales» en el plan de comidas (PF-09 bis; DL-109), el mismo juego que en entrenamiento:
 * - **alimentos habituales**: los que el profesional marca en «Agregar ítem» quedan arriba de los resultados, para
 *   elegirlos sin buscar (`agregar-item.tsx`); marcar y quitar es una sola operación (API-HAN-02), con actualización
 *   optimista; acá está la lectura, que dice si falló;
 * - **comidas habituales**: «Guardar como habitual» sobre una comida del borrador (nombre, el interruptor de cantidades
 *   apagado —DL-108 D-2— y cada nota de ítem para confirmarla o vaciarla —D-3—); guardar otra con el mismo nombre la
 *   **reemplaza**, con aviso (DL-109 D-2); «Agregar esta comida habitual» inserta una copia sin identificadores de nodo
 *   en el día tipo, así que se puede insertar dos veces: lo insertado ya es del plan.
 * Un profesional sin Nutrición recibe 403 en las comidas habituales: ese bloque queda vacío, sin aviso. Cualquier otra
 * falla de esa lectura se dice (`falla`): no es «todavía no guardaste ninguna» (encargo de consolidación, bloque 5).
 */
import {
  COPY_HABITUALES,
  nombreNormalizadoDePlantilla,
  notasDeLaComida,
  sinIdentificadoresDeComida,
  vaciarNota,
  type ComidaEntrada,
  type ComidaHabitual,
  type ElementoDeCatalogo,
} from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Ayuda } from '../../../../components/ayuda';
import { DialogoDeConfirmacion } from '../../../../components/dialogo';
import { Aviso, Campo } from '../../../../components/formulario';
import { api } from '../../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';

export type Comida = ComidaEntrada;

const COMIDA_VACIA: Comida = { label: '', prescriptionMode: 'DISH_OPTIONS', options: [] };

// ─── Alimentos habituales ───────────────────────────────────────────────────────────────────────────────────────────

export interface AlimentosHabituales {
  readonly habituales: readonly ElementoDeCatalogo[];
  readonly esHabitual: (catalogItemId: string) => boolean;
  /** Marca o quita, con actualización optimista; si la API falla, vuelve atrás y deja el motivo en `fallo`. */
  readonly alternar: (elemento: ElementoDeCatalogo) => Promise<void>;
  readonly fallo: string | null;
  /** Si la lista se pudo leer: una lectura que falla no es «todavía no marcaste ninguno». */
  readonly lectura: 'cargando' | 'lista' | 'falla';
  readonly motivoDeLectura: string | null;
  readonly recargar: () => void;
}

/** Carga una vez los alimentos habituales del profesional, para todo el borrador. */
export function useAlimentosHabituales(token: string): AlimentosHabituales {
  const [habituales, setHabituales] = useState<readonly ElementoDeCatalogo[]>([]);
  const [fallo, setFallo] = useState<string | null>(null);
  const [lectura, setLectura] = useState<{ readonly estado: 'cargando' | 'lista' | 'falla'; readonly motivo: string | null }>({ estado: 'cargando', motivo: null });
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    let vigente = true;
    setLectura({ estado: 'cargando', motivo: null });
    void api.listarAlimentosHabituales(token).then((r) => {
      if (!vigente) return;
      setHabituales(r.ok ? r.datos.data : []);
      setLectura(r.ok ? { estado: 'lista', motivo: null } : { estado: 'falla', motivo: mensajeDeFallo(r) });
    });
    return () => {
      vigente = false;
    };
  }, [token, vuelta]);
  const recargar = useCallback(() => setVuelta((v) => v + 1), []);
  const esHabitual = useCallback((catalogItemId: string) => habituales.some((h) => h.catalogItemId === catalogItemId), [habituales]);
  const alternar = useCallback(
    async (elemento: ElementoDeCatalogo) => {
      const marcado = habituales.some((h) => h.catalogItemId === elemento.catalogItemId);
      const previos = habituales;
      setFallo(null);
      // El marcado más reciente va primero, como lo ordena la API.
      setHabituales(marcado ? previos.filter((h) => h.catalogItemId !== elemento.catalogItemId) : [elemento, ...previos]);
      const r = await api.marcarAlimentoHabitual(token, elemento.catalogItemId, { state: marcado ? 'REMOVED' : 'MARKED' });
      if (!r.ok) {
        setHabituales(previos);
        setFallo(mensajeDeFallo(r));
      }
    },
    [habituales, token],
  );
  return { habituales, esHabitual, alternar, fallo, lectura: lectura.estado, motivoDeLectura: lectura.motivo, recargar };
}

// ─── Comidas habituales ─────────────────────────────────────────────────────────────────────────────────────────────

export interface ComidasHabituales {
  /** `null` mientras carga; vacía si no hay, si el profesional no tiene Nutrición (403) o si la lectura falló. */
  readonly lista: readonly ComidaHabitual[] | null;
  /** La lectura falló (y no fue un 403): la lista vacía no quiere decir que no haya. */
  readonly falla: boolean;
  /** Vuelve a leer. Después de una falla, mientras lee, la lista vuelve a «leyendo». */
  readonly recargar: () => Promise<void>;
}

/** Las comidas habituales del profesional (primera página, tope de la API): para el selector y para avisar el reemplazo. */
export function useComidasHabituales(token: string): ComidasHabituales {
  const [estado, setEstado] = useState<{ readonly lista: readonly ComidaHabitual[] | null; readonly falla: boolean }>({ lista: null, falla: false });
  // Una respuesta vieja no pisa una lectura posterior.
  const generacion = useRef(0);
  const recargar = useCallback(async () => {
    const esta = ++generacion.current;
    setEstado((e) => (e.falla ? { lista: null, falla: false } : e));
    const r = await api.listarComidasHabituales(token, {});
    if (esta !== generacion.current) return;
    const sinNutricion = !r.ok && r.tipo === 'API' && r.status === 403;
    setEstado(r.ok ? { lista: r.datos.data, falla: false } : { lista: [], falla: !sinNutricion });
  }, [token]);
  useEffect(() => {
    void recargar();
    return () => {
      generacion.current += 1;
    };
  }, [recargar]);
  return { lista: estado.lista, falla: estado.falla, recargar };
}

const normalizar = nombreNormalizadoDePlantilla;

export function DialogoGuardarComidaHabitual({
  token,
  abierto,
  comida,
  existentes,
  onCerrar,
  onGuardada,
}: {
  token: string;
  abierto: boolean;
  /** La comida tal como está en el editor (`null` mientras el diálogo está cerrado). */
  comida: Comida | null;
  /** Las comidas habituales que ya tiene el profesional, para avisar que el nombre repetido reemplaza. */
  existentes: readonly ComidaHabitual[];
  onCerrar: () => void;
  onGuardada: (habitual: ComidaHabitual) => void;
}) {
  const id = useId();
  const intento = useClaveDeIntento();
  const [nombre, setNombre] = useState('');
  const [conCantidades, setConCantidades] = useState(false);
  const [estructura, setEstructura] = useState<Comida>(COMIDA_VACIA);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Un 409 inesperado (la lista estaba vieja): la comida que ya tiene ese nombre, recuperada de la API para ofrecer reemplazarla.
  const [conflicto, setConflicto] = useState<ComidaHabitual | null>(null);
  useEffect(() => {
    if (abierto) {
      setEstructura(comida ?? COMIDA_VACIA);
      setNombre(comida?.label ?? '');
      setConCantidades(false);
      setError(null);
      setConflicto(null);
      intento.descartar();
    }
    // `intento` es estable entre renders y no va en las dependencias: la clave se reinicia solo al abrir.
  }, [abierto, comida]);
  const notas = notasDeLaComida(estructura);
  const reemplaza = conflicto ?? existentes.find((h) => normalizar(h.name) === normalizar(nombre)) ?? null;

  async function guardar() {
    setEnviando(true);
    setError(null);
    const r = await api.guardarComidaHabitual(
      token,
      { name: nombre.trim(), structure: sinIdentificadoresDeComida(estructura), copyQuantities: conCantidades, ...(reemplaza ? { replaces: reemplaza.presetId } : {}) },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    if (r.ok) return onGuardada(r.datos.data);
    if (r.tipo === 'API' && r.codigo === 'PRESET_NAME_TAKEN') {
      // La lista con la que se avisó estaba vieja: se busca la que tiene el nombre y se ofrece reemplazarla.
      const lista = await api.listarComidasHabituales(token, {});
      const tomada = lista.ok ? lista.datos.data.find((h) => normalizar(h.name) === normalizar(nombre)) : undefined;
      if (tomada) {
        setConflicto(tomada);
        intento.descartar();
        return;
      }
      return setError(COPY_HABITUALES.nombreTomado);
    }
    setError(mensajeDeFallo(r));
  }

  return (
    <DialogoDeConfirmacion
      abierto={abierto}
      titulo={COPY_HABITUALES.guardarComoHabitual}
      textoVolver={COPY_HABITUALES.cancelar}
      textoConfirmar={reemplaza ? COPY_HABITUALES.reemplazar : COPY_HABITUALES.guardarComida}
      textoEnviando="Guardando…"
      enviando={enviando}
      error={error}
      confirmarDeshabilitado={nombre.trim().length === 0}
      onVolver={onCerrar}
      onConfirmar={() => void guardar()}
    >
      <Campo id={`${id}-nombre`} etiqueta={COPY_HABITUALES.nombre} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />
      {reemplaza ? (
        <Aviso tipo="info">
          <p>{COPY_HABITUALES.seReemplazaComida(reemplaza.name)}</p>
        </Aviso>
      ) : null}
      <div className="campo">
        <label>
          <input type="checkbox" checked={conCantidades} onChange={(e) => setConCantidades(e.target.checked)} /> {COPY_HABITUALES.cantidades}
        </label>
        <p className="nota">{COPY_HABITUALES.cantidadesAyuda}</p>
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
                <button type="button" className="boton boton--enlace" onClick={() => setEstructura((e) => vaciarNota(e, n.lugar))} aria-label={`${COPY_HABITUALES.vaciarNota}: ${n.rotulo}`}>
                  {COPY_HABITUALES.vaciarNota}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {/* DL-113: lo que explica el habitual, plegado y al final: así el foco del diálogo abre en el nombre. */}
      <Ayuda titulo="Qué se copia y quién lo ve">
        <p>{COPY_HABITUALES.queCopiaComida}</p>
        <p>{COPY_HABITUALES.soloTuyos}</p>
      </Ayuda>
    </DialogoDeConfirmacion>
  );
}

/**
 * Selector + «Agregar esta comida habitual»: inserta una copia sin identificadores de nodo (el servidor los asigna al
 * guardar el borrador) y entrega los nombres vigentes de sus alimentos para mostrarlos en el editor. Sin comidas
 * habituales no se muestra: la entrada a la función es «Guardar como habitual» sobre una comida.
 */
/**
 * Elegir una comida habitual e insertar una copia (sin identificadores) al final del día tipo. Se abre a pedido, desde
 * «Agregar comida ▾ → Una comida habitual»: al aparecer, el foco va a la lista; lo agregado lo anuncia el editor.
 */
export function InsertarComidaHabitual({ comidas, onInsertar }: { comidas: readonly ComidaHabitual[] | null; onInsertar: (comida: Comida, nombres: Readonly<Record<string, string>>) => void }) {
  const id = useId();
  const [elegida, setElegida] = useState('');
  if (comidas === null || comidas.length === 0) return null;
  return (
    <div className="campo" data-habituales="comidas">
      <label htmlFor={`${id}-comida`}>{COPY_HABITUALES.agregarComida}</label>
      {/* Se muestra porque la persona lo acaba de pedir: el foco va a la lista. */}
      <select id={`${id}-comida`} value={elegida} onChange={(e) => setElegida(e.target.value)} autoFocus>
        <option value="">—</option>
        {comidas.map((c) => (
          <option key={c.presetId} value={c.presetId}>
            {c.name} · {COPY_HABITUALES.alimentos(c.itemCount)} · {c.copiedQuantities ? COPY_HABITUALES.conCantidades : COPY_HABITUALES.sinCantidades}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="boton boton--secundario"
        disabled={!elegida}
        onClick={() => {
          const c = comidas.find((x) => x.presetId === elegida);
          if (!c) return;
          const nombres: Record<string, string> = {};
          for (const [catalogItemId, it] of Object.entries(c.items)) nombres[catalogItemId] = it.name;
          onInsertar(sinIdentificadoresDeComida(structuredClone(c.structure)), nombres);
        }}
      >
        {COPY_HABITUALES.insertarComida}
      </button>
    </div>
  );
}
