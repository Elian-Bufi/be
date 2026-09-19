'use client';

/**
 * Editor del borrador (B05:404-624; CAND-NUT-B): la jerarquía Día tipo → Comida → Opción → Ítem, nunca una tabla plana.
 * - El día tipo no es una fecha (B05:435-443). Las comidas son rótulos libres: se agregan, se renombran, se ordenan y se
 *   quitan, sin fijar cuatro (B05:447-467).
 * - Cada ítem lleva cantidad, unidad y estado de preparación; con cantidad, el estado es obligatorio (REG-06-122).
 * - «Guardar cambios» no activa (B05:607-624). Validar informa cada problema en su lugar; activar pide confirmación
 *   con el texto literal de B05:685-695 y la API revalida todo en la misma transacción.
 * - La modalidad B no se ofrece, ni como «Próximamente» (B05:503-518).
 */
import {
  COPY,
  COPY_NUTRICION,
  ETIQUETA_DE_PREPARACION,
  ETIQUETA_DE_UNIDAD,
  type ElementoDeCatalogo,
  type EstructuraDePlanEntrada,
  type ValidationIssue,
  type VersionDePlan,
} from '@be/domain';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { DialogoDeConfirmacion } from '../../../../components/dialogo';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Aviso, Campo } from '../../../../components/formulario';
import { api } from '../../../../lib/api';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { NoDisponible, useNutricion } from './nutricion';

type Estructura = EstructuraDePlanEntrada['dayTypes'];
type Item = Estructura[number]['meals'][number]['options'][number]['items'][number];
type Preparacion = 'RAW' | 'COOKED' | 'AS_PURCHASED';
type Unidad = 'g' | 'ml' | 'unit';

/** La jerarquía de la respuesta, como entrada del PATCH (sin `order`, nombres ni versión de catálogo). */
function aEntrada(v: VersionDePlan): Estructura {
  return v.dayTypes.map((d) => ({
    dayTypeId: d.dayTypeId,
    label: d.label,
    meals: d.meals.map((m) => ({
      mealId: m.mealId,
      label: m.label,
      prescriptionMode: m.prescriptionMode,
      options: m.options.map((o) => ({
        optionId: o.optionId,
        label: o.label,
        items: o.items.map((i) => ({ itemId: i.itemId, catalogItemId: i.catalogItemId, quantity: i.quantity, preparationState: i.preparationState, note: i.note })),
      })),
    })),
  }));
}

function nombresDe(v: VersionDePlan): Record<string, string> {
  const n: Record<string, string> = {};
  for (const d of v.dayTypes) for (const m of d.meals) for (const o of m.options) for (const i of o.items) n[i.catalogItemId] = i.name;
  return n;
}

/** Texto de la ubicación de un problema, sin rutas técnicas: «Día habitual → Almuerzo → Opción 2 → …» (B05:654-659). */
function ubicacion(path: string, e: Estructura): string {
  const m = path.match(/^dayTypes\[(\d+)\](?:\.meals\[(\d+)\])?(?:\.options\[(\d+)\])?(?:\.items\[(\d+)\])?/);
  if (!m) return 'Plan';
  const d = e[Number(m[1])];
  const partes = [d?.label ?? 'Día tipo'];
  if (m[2] !== undefined) partes.push(d?.meals[Number(m[2])]?.label ?? 'Comida');
  if (m[3] !== undefined) partes.push(`Opción ${Number(m[3]) + 1}`);
  if (m[4] !== undefined) partes.push(`Ítem ${Number(m[4]) + 1}`);
  return partes.join(' → ');
}

const PROBLEMA: Readonly<Record<string, string>> = {
  DAY_TYPE_REQUIRED: 'falta al menos un día tipo',
  MEAL_REQUIRED: 'falta al menos una comida',
  MEAL_OPTION_REQUIRED: 'falta al menos una opción',
  OPTION_ITEM_REQUIRED: 'falta al menos un ítem',
  PREPARATION_STATE_REQUIRED: 'falta estado de preparación',
  CATALOG_REFERENCE_INVALID: 'el alimento ya no está disponible en el catálogo',
  EXCHANGE_MODE_NOT_AVAILABLE: 'la modalidad por intercambios no está habilitada',
  DUPLICATE_NODE_ID: 'hay un elemento repetido',
  OBJECTIVE_NOT_EFFECTIVE: 'el borrador usa un objetivo que ya no es el vigente',
  SNAPSHOT_NOT_PRESERVABLE: 'no se pudo preservar la versión para el asesorado',
};

export function EditorDeBorrador({ planId, onActivado }: { planId: string; onActivado: () => void }) {
  const { token, asesoradoId, sesionPerdida } = useNutricion();
  const [version, setVersion] = useState<VersionDePlan | null>(null);
  const [error, setError] = useState<'no-disponible' | 'error' | null>(null);
  const [estructura, setEstructura] = useState<Estructura>([]);
  const [proximaRevision, setProximaRevision] = useState('');
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [sucio, setSucio] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'exito' | 'info'; texto: string } | null>(null);
  const [problemas, setProblemas] = useState<readonly ValidationIssue[] | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [activando, setActivando] = useState(false);
  const [falloDeActivacion, setFalloDeActivacion] = useState<string | null>(null);
  const [objetivoVigente, setObjetivoVigente] = useState<string | null>(null);
  const intentoDeActivar = useClaveDeIntento();

  const cargar = useCallback(async () => {
    setError(null);
    const [r, ob] = await Promise.all([api.consultarPlan(token, planId), api.objetivoEfectivo(token, asesoradoId)]);
    if (sesionPerdida(r) || sesionPerdida(ob)) return;
    if (!r.ok) return setError(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? 'no-disponible' : 'error');
    setVersion(r.datos.data);
    setEstructura(aEntrada(r.datos.data));
    setNombres(nombresDe(r.datos.data));
    setProximaRevision(r.datos.data.nextReviewAt ?? '');
    setSucio(false);
    setObjetivoVigente(ob.ok ? (ob.datos.data.objective?.versionId ?? null) : null);
  }, [token, planId, asesoradoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const cambiar = (f: (e: Estructura) => Estructura) => {
    setEstructura((e) => f(structuredClone(e)));
    setSucio(true);
    setProblemas(null);
    setMensaje(null);
  };

  /** Guarda (PATCH) y devuelve la versión nueva, o `null` si falló. */
  async function guardar(): Promise<VersionDePlan | null> {
    if (!version) return null;
    setGuardando(true);
    setMensaje(null);
    const actualizarObjetivo = objetivoVigente && objetivoVigente !== version.objectiveVersionId ? { objectiveVersionId: objetivoVigente } : {};
    const r = await api.guardarBorrador(token, planId, {
      expectedVersion: version.version,
      changes: { dayTypes: estructura },
      nextReviewAt: proximaRevision || null,
      ...actualizarObjetivo,
    });
    setGuardando(false);
    if (sesionPerdida(r)) return null;
    if (!r.ok) {
      if (r.tipo === 'API' && r.issues.length > 0) setProblemas(r.issues);
      setMensaje({ tipo: 'error', texto: r.tipo === 'API' && r.issues.length > 0 ? 'Hay elementos del plan que no se pueden guardar.' : mensajeDeFallo(r) });
      return null;
    }
    setVersion(r.datos.data);
    setEstructura(aEntrada(r.datos.data));
    setNombres((n) => ({ ...n, ...nombresDe(r.datos.data) }));
    setSucio(false);
    return r.datos.data;
  }

  async function validar() {
    const v = sucio ? await guardar() : version;
    if (!v) return;
    const r = await api.validarPlan(token, planId, v.version);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setMensaje({ tipo: 'error', texto: mensajeDeFallo(r) });
    setProblemas(r.datos.data.issues);
    setMensaje(r.datos.data.valid ? { tipo: 'exito', texto: COPY_NUTRICION.planValido } : { tipo: 'error', texto: COPY_NUTRICION.hayElementosPorCorregir });
  }

  async function activar() {
    if (!version) return;
    setActivando(true);
    setFalloDeActivacion(null);
    const r = await api.activarPlan(token, planId, version.version, intentoDeActivar.actual());
    intentoDeActivar.registrar(r);
    setActivando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) {
      if (r.tipo === 'API' && r.issues.length > 0) {
        setConfirmar(false);
        setProblemas(r.issues);
        return setMensaje({ tipo: 'error', texto: COPY_NUTRICION.hayElementosPorCorregir });
      }
      if (r.tipo === 'API' && r.codigo === 'CAPACITY_NOT_AVAILABLE') return setFalloDeActivacion(COPY_NUTRICION.sinCapacidad);
      if (r.tipo === 'API' && r.codigo === 'ACTIVE_PLAN_CONFLICT') return setFalloDeActivacion('El asesorado ya tiene un plan nutricional vigente con otro profesional.');
      return setFalloDeActivacion(esIncierto(r) ? COPY.resultadoIncierto : COPY_NUTRICION.noPudimosActivar);
    }
    setConfirmar(false);
    onActivado();
  }

  if (error === 'no-disponible') return <NoDisponible />;
  if (error === 'error') return <ErrorConReintento onReintentar={cargar} />;
  if (!version) return <Cargando />;

  return (
    <section className="seccion" aria-labelledby="titulo-borrador">
      <h2 id="titulo-borrador">
        Versión en preparación <span className="insignia">{COPY_NUTRICION.borrador}</span>
      </h2>
      <p className="nota">El borrador no es visible para el asesorado. Guardar no activa.</p>
      {version.predecessorPlanId ? <p className="nota">Nueva versión a partir de la versión activa. La versión activa no cambia hasta que actives esta.</p> : null}
      {objetivoVigente && objetivoVigente !== version.objectiveVersionId ? (
        <Aviso tipo="info">
          <p>Hay una versión de objetivo más nueva. Al guardar, el borrador pasa a usarla.</p>
        </Aviso>
      ) : null}

      <div className="jerarquia">
        {estructura.map((d, i) => (
          <fieldset key={d.dayTypeId ?? i} className="nodo nodo--dia">
            <legend>Día tipo {i + 1}</legend>
            <Campo id={`dia-${i}`} etiqueta="Nombre del día tipo" value={d.label} onChange={(e) => cambiar((x) => ((x[i]!.label = e.target.value), x))} maxLength={80} />
            {d.meals.map((m, j) => (
              <fieldset key={m.mealId ?? j} className="nodo nodo--comida">
                <legend>{m.label || `Comida ${j + 1}`}</legend>
                <Campo id={`comida-${i}-${j}`} etiqueta="Nombre de la comida" value={m.label} onChange={(e) => cambiar((x) => ((x[i]!.meals[j]!.label = e.target.value), x))} maxLength={80} />
                {m.options.map((o, k) => (
                  <fieldset key={o.optionId ?? k} className="nodo nodo--opcion">
                    <legend>Opción {k + 1}</legend>
                    <Campo id={`opcion-${i}-${j}-${k}`} etiqueta="Nombre de la opción" value={o.label} onChange={(e) => cambiar((x) => ((x[i]!.meals[j]!.options[k]!.label = e.target.value), x))} maxLength={120} />
                    <ul className="items">
                      {o.items.map((it, l) => (
                        <FilaDeItem
                          key={it.itemId ?? l}
                          id={`item-${i}-${j}-${k}-${l}`}
                          item={it}
                          nombre={nombres[it.catalogItemId] ?? 'Elemento'}
                          onCambiar={(cambio) => cambiar((x) => ((x[i]!.meals[j]!.options[k]!.items[l] = { ...it, ...cambio }), x))}
                          onQuitar={() => cambiar((x) => (x[i]!.meals[j]!.options[k]!.items.splice(l, 1), x))}
                        />
                      ))}
                    </ul>
                    <BuscadorDeCatalogo
                      id={`buscar-${i}-${j}-${k}`}
                      onElegir={(el) => {
                        setNombres((n) => ({ ...n, [el.catalogItemId]: el.name }));
                        cambiar((x) => (x[i]!.meals[j]!.options[k]!.items.push({ catalogItemId: el.catalogItemId, quantity: null, preparationState: null, note: null }), x));
                      }}
                    />
                    <button type="button" className="boton boton--enlace" onClick={() => cambiar((x) => (x[i]!.meals[j]!.options.splice(k, 1), x))}>
                      Quitar opción {k + 1}
                    </button>
                  </fieldset>
                ))}
                <div className="acciones">
                  <button type="button" className="boton boton--secundario" onClick={() => cambiar((x) => (x[i]!.meals[j]!.options.push({ label: `Opción ${m.options.length + 1}`, items: [] }), x))}>
                    Agregar opción
                  </button>
                  <button type="button" className="boton boton--enlace" disabled={j === 0} onClick={() => cambiar((x) => ([x[i]!.meals[j - 1], x[i]!.meals[j]] = [x[i]!.meals[j]!, x[i]!.meals[j - 1]!], x))}>
                    Subir
                  </button>
                  <button type="button" className="boton boton--enlace" onClick={() => cambiar((x) => (x[i]!.meals.splice(j, 1), x))}>
                    Quitar comida
                  </button>
                </div>
              </fieldset>
            ))}
            <div className="acciones">
              <button type="button" className="boton boton--secundario" onClick={() => cambiar((x) => (x[i]!.meals.push({ label: '', prescriptionMode: 'DISH_OPTIONS', options: [] }), x))}>
                Agregar comida
              </button>
              {estructura.length > 1 ? (
                <button type="button" className="boton boton--enlace" onClick={() => cambiar((x) => (x.splice(i, 1), x))}>
                  Quitar día tipo
                </button>
              ) : null}
            </div>
          </fieldset>
        ))}
        <button type="button" className="boton boton--secundario" onClick={() => cambiar((x) => (x.push({ label: `Día tipo ${x.length + 1}`, meals: [] }), x))}>
          Agregar día tipo
        </button>
      </div>

      <Campo
        id="proxima-revision"
        etiqueta="Próxima revisión (opcional)"
        ayuda="Si la fijás, al activar queda como revisión pendiente del seguimiento a partir de esa fecha."
        type="date"
        value={proximaRevision}
        onChange={(e) => {
          setProximaRevision(e.target.value);
          setSucio(true);
        }}
      />

      <p className="nota" aria-live="polite">
        {guardando ? COPY_NUTRICION.guardando : sucio ? COPY_NUTRICION.cambiosSinGuardar : COPY_NUTRICION.guardado}
      </p>
      {mensaje ? (
        <Aviso tipo={mensaje.tipo} enfocar={mensaje.tipo !== 'info'}>
          <p>{mensaje.texto}</p>
          {problemas && problemas.length > 0 ? (
            <ul>
              {problemas.map((p, i) => (
                <li key={i}>
                  {ubicacion(p.path, estructura)} → {PROBLEMA[p.code] ?? 'revisá este elemento'}
                </li>
              ))}
            </ul>
          ) : null}
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="button" className="boton boton--primario" onClick={() => void guardar()} disabled={guardando || !sucio}>
          {COPY_NUTRICION.guardarCambios}
        </button>
        <button type="button" className="boton boton--secundario" onClick={() => void validar()} disabled={guardando}>
          {COPY_NUTRICION.validarPlan}
        </button>
        <button type="button" className="boton boton--secundario" onClick={() => setConfirmar(true)} disabled={guardando || sucio}>
          {COPY_NUTRICION.activarPlan}
        </button>
      </div>
      {sucio ? <p className="nota">Guardá los cambios antes de activar.</p> : null}

      <DialogoDeConfirmacion
        abierto={confirmar}
        titulo={COPY_NUTRICION.activarPlan}
        textoVolver="Volver"
        textoConfirmar="Activar esta versión"
        textoEnviando="Activando…"
        enviando={activando}
        error={falloDeActivacion}
        onVolver={() => {
          setConfirmar(false);
          setFalloDeActivacion(null);
          intentoDeActivar.descartar();
        }}
        onConfirmar={() => void activar()}
      >
        <p>{COPY_NUTRICION.confirmarActivacion}</p>
      </DialogoDeConfirmacion>
    </section>
  );
}

function FilaDeItem({ id, item, nombre, onCambiar, onQuitar }: { id: string; item: Item; nombre: string; onCambiar: (c: Partial<Item>) => void; onQuitar: () => void }) {
  const cantidad = item.quantity;
  return (
    <li className="fila-de-item">
      <strong>{nombre}</strong>
      <Campo
        id={`${id}-cantidad`}
        etiqueta="Cantidad"
        inputMode="decimal"
        value={cantidad ? String(cantidad.value) : ''}
        onChange={(e) => {
          const v = e.target.value.replace(',', '.');
          onCambiar({ quantity: v === '' ? null : { value: Number(v) || 0, unit: cantidad?.unit ?? 'g' } });
        }}
      />
      <div className="campo">
        <label htmlFor={`${id}-unidad`}>Unidad</label>
        <select id={`${id}-unidad`} value={cantidad?.unit ?? 'g'} disabled={!cantidad} onChange={(e) => cantidad && onCambiar({ quantity: { ...cantidad, unit: e.target.value as Unidad } })}>
          {(Object.keys(ETIQUETA_DE_UNIDAD) as Unidad[]).map((u) => (
            <option key={u} value={u}>
              {ETIQUETA_DE_UNIDAD[u]}
            </option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor={`${id}-preparacion`}>{COPY_NUTRICION.estadoDePreparacion}</label>
        <select id={`${id}-preparacion`} value={item.preparationState ?? ''} onChange={(e) => onCambiar({ preparationState: (e.target.value || null) as Preparacion | null })}>
          <option value="">Sin indicar</option>
          {(Object.keys(ETIQUETA_DE_PREPARACION) as Preparacion[]).map((p) => (
            <option key={p} value={p}>
              {ETIQUETA_DE_PREPARACION[p]}
            </option>
          ))}
        </select>
      </div>
      <button type="button" className="boton boton--enlace" onClick={onQuitar}>
        Quitar {nombre}
      </button>
    </li>
  );
}

/** «Agregar ítem → buscar catálogo BE» y «Crear manualmente» (B05:535-552). Sin proveedor externo en WP-04 (DL-056). */
function BuscadorDeCatalogo({ id, onElegir }: { id: string; onElegir: (e: ElementoDeCatalogo) => void }) {
  const { token, sesionPerdida } = useNutricion();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<ElementoDeCatalogo[] | null>(null);
  const [manual, setManual] = useState(false);
  const intento = useClaveDeIntento();
  const [nuevo, setNuevo] = useState({ nombre: '', kcal: '', p: '', c: '', g: '' });
  const [fallo, setFallo] = useState<string | null>(null);

  async function buscar(e: FormEvent) {
    e.preventDefault();
    const r = await api.buscarEnCatalogo(token, texto.trim());
    if (sesionPerdida(r)) return;
    setResultados(r.ok ? r.datos.data : []);
  }

  async function crear() {
    const n = (s: string) => Number(s.replace(',', '.'));
    if (!nuevo.nombre.trim() || [nuevo.kcal, nuevo.p, nuevo.c, nuevo.g].some((s) => s.trim() === '' || !Number.isFinite(n(s)) || n(s) < 0)) {
      return setFallo('Completá el nombre y los valores cada 100 g (números mayores o iguales a cero).');
    }
    const r = await api.crearElementoDeCatalogo(
      token,
      { name: nuevo.nombre.trim(), itemType: 'FOOD', composition: { referenceAmount: '100g', energyKcal: n(nuevo.kcal), proteinG: n(nuevo.p), carbohydrateG: n(nuevo.c), fatG: n(nuevo.g) } },
      intento.actual(),
    );
    intento.registrar(r);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    onElegir(r.datos.data);
    setManual(false);
    setAbierto(false);
  }

  if (!abierto) {
    return (
      <button type="button" className="boton boton--secundario" onClick={() => setAbierto(true)}>
        Agregar ítem
      </button>
    );
  }
  return (
    <div className="buscador">
      <form onSubmit={buscar} className="fila-de-dato">
        <Campo id={`${id}-texto`} etiqueta="Buscar en el catálogo BE" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <button type="submit" className="boton boton--secundario">
          Buscar
        </button>
      </form>
      <p className="nota">{COPY_NUTRICION.catalogoSintetico}</p>
      {resultados ? (
        resultados.length === 0 ? (
          <p>No encontramos alimentos con ese nombre.</p>
        ) : (
          <ul className="lista">
            {resultados.map((el) => (
              <li key={el.catalogItemId} className="lista__item">
                <span>
                  {el.name} · {el.composition.energyKcal} kcal cada {el.composition.referenceAmount === '100ml' ? '100 ml' : '100 g'}
                </span>
                <button
                  type="button"
                  className="boton boton--enlace"
                  onClick={() => {
                    onElegir(el);
                    setAbierto(false);
                    setResultados(null);
                    setTexto('');
                  }}
                >
                  Elegir {el.name}
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}
      {manual ? (
        <fieldset className="grupo">
          <legend>{COPY_NUTRICION.crearManualmente}</legend>
          <Campo id={`${id}-nombre`} etiqueta="Nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
          <div className="fila-de-dato">
            <Campo id={`${id}-kcal`} etiqueta="kcal cada 100 g" inputMode="decimal" value={nuevo.kcal} onChange={(e) => setNuevo({ ...nuevo, kcal: e.target.value })} />
            <Campo id={`${id}-p`} etiqueta="Proteínas (g)" inputMode="decimal" value={nuevo.p} onChange={(e) => setNuevo({ ...nuevo, p: e.target.value })} />
            <Campo id={`${id}-c`} etiqueta="Carbohidratos (g)" inputMode="decimal" value={nuevo.c} onChange={(e) => setNuevo({ ...nuevo, c: e.target.value })} />
            <Campo id={`${id}-g`} etiqueta="Grasas (g)" inputMode="decimal" value={nuevo.g} onChange={(e) => setNuevo({ ...nuevo, g: e.target.value })} />
          </div>
          {fallo ? (
            <Aviso tipo="error">
              <p>{fallo}</p>
            </Aviso>
          ) : null}
          <div className="acciones">
            <button type="button" className="boton boton--primario" onClick={() => void crear()}>
              Crear y agregar
            </button>
          </div>
        </fieldset>
      ) : (
        <button type="button" className="boton boton--enlace" onClick={() => setManual(true)}>
          {COPY_NUTRICION.crearManualmente}
        </button>
      )}
      <button type="button" className="boton boton--enlace" onClick={() => setAbierto(false)}>
        Cerrar búsqueda
      </button>
    </div>
  );
}
