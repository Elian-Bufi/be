'use client';

/**
 * «Mis habituales» en el plan de comidas (PF-09 bis; DL-109), el mismo juego que en entrenamiento:
 * - **alimentos habituales**: los que el profesional marca en el buscador quedan en un bloque arriba de los resultados,
 *   para elegirlos sin buscar; marcar y quitar es una sola operación (API-HAN-02), con actualización optimista;
 * - **comidas habituales**: «Guardar como habitual» sobre una comida del borrador (nombre, el interruptor de cantidades
 *   apagado —DL-108 D-2— y cada nota de ítem para confirmarla o vaciarla —D-3—); guardar otra con el mismo nombre la
 *   **reemplaza**, con aviso (DL-109 D-2); «Agregar esta comida habitual» inserta una copia sin identificadores de nodo
 *   en el día tipo, así que se puede insertar dos veces: lo insertado ya es del plan.
 * Un profesional sin Nutrición recibe 403: los bloques quedan vacíos, sin aviso (el buscador sigue funcionando).
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
import { useCallback, useEffect, useId, useState } from 'react';
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
}

/** Carga una vez los alimentos habituales del profesional. Un 403 (sin Nutrición) o cualquier fallo: lista vacía, sin aviso. */
export function useAlimentosHabituales(token: string): AlimentosHabituales {
  const [habituales, setHabituales] = useState<readonly ElementoDeCatalogo[]>([]);
  const [fallo, setFallo] = useState<string | null>(null);
  useEffect(() => {
    let vigente = true;
    void api.listarAlimentosHabituales(token).then((r) => {
      if (vigente) setHabituales(r.ok ? r.datos.data : []);
    });
    return () => {
      vigente = false;
    };
  }, [token]);
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
  return { habituales, esHabitual, alternar, fallo };
}

/** El bloque arriba de los resultados del buscador: un botón por alimento habitual; elegirlo es como elegir un resultado. */
export function BloqueDeHabituales({ habituales, fallo, onElegir }: { habituales: readonly ElementoDeCatalogo[]; fallo: string | null; onElegir: (e: ElementoDeCatalogo) => void }) {
  return (
    <fieldset className="grupo habituales" data-habituales="alimentos">
      <legend>{COPY_HABITUALES.misHabituales}</legend>
      {habituales.length === 0 ? (
        <p className="nota">{COPY_HABITUALES.sinAlimentosHabituales}</p>
      ) : (
        <ul className="lista-compacta">
          {habituales.map((el) => (
            <li key={el.catalogItemId}>
              <button type="button" className="boton boton--enlace" onClick={() => onElegir(el)}>
                {el.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {fallo ? (
        <p className="nota" role="status">
          {fallo}
        </p>
      ) : null}
    </fieldset>
  );
}

/** En cada resultado del buscador: «Marcar como habitual» / «Quitar de habituales», con `aria-pressed`. */
export function BotonHabitual({ elemento, marcado, onAlternar }: { elemento: ElementoDeCatalogo; marcado: boolean; onAlternar: (e: ElementoDeCatalogo) => void }) {
  const texto = marcado ? COPY_HABITUALES.quitarMarca : COPY_HABITUALES.marcar;
  return (
    <button type="button" className="boton boton--enlace" aria-pressed={marcado} aria-label={`${texto}: ${elemento.name}`} onClick={() => onAlternar(elemento)}>
      {texto}
    </button>
  );
}

// ─── Comidas habituales ─────────────────────────────────────────────────────────────────────────────────────────────

export interface ComidasHabituales {
  /** `null` mientras carga; vacía si no hay o si el profesional no tiene Nutrición (403). */
  readonly lista: readonly ComidaHabitual[] | null;
  readonly recargar: () => Promise<void>;
}

/** Las comidas habituales del profesional (primera página, tope de la API): para el selector y para avisar el reemplazo. */
export function useComidasHabituales(token: string): ComidasHabituales {
  const [lista, setLista] = useState<readonly ComidaHabitual[] | null>(null);
  const recargar = useCallback(async () => {
    const r = await api.listarComidasHabituales(token, {});
    setLista(r.ok ? r.datos.data : []);
  }, [token]);
  useEffect(() => {
    let vigente = true;
    void api.listarComidasHabituales(token, {}).then((r) => {
      if (vigente) setLista(r.ok ? r.datos.data : []);
    });
    return () => {
      vigente = false;
    };
  }, [token]);
  return { lista, recargar };
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
export function InsertarComidaHabitual({ comidas, onInsertar }: { comidas: readonly ComidaHabitual[] | null; onInsertar: (comida: Comida, nombres: Readonly<Record<string, string>>) => void }) {
  const id = useId();
  const [elegida, setElegida] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  if (comidas === null || comidas.length === 0) return null;
  return (
    <div className="campo" data-habituales="comidas">
      <label htmlFor={`${id}-comida`}>{COPY_HABITUALES.agregarComida}</label>
      <select id={`${id}-comida`} value={elegida} onChange={(e) => setElegida(e.target.value)}>
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
          setAviso(COPY_HABITUALES.insertadaComida);
        }}
      >
        {COPY_HABITUALES.insertarComida}
      </button>
      {aviso ? (
        <p className="nota" role="status">
          {aviso}
        </p>
      ) : null}
    </div>
  );
}
