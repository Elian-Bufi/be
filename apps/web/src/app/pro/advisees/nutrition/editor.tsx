'use client';

/**
 * Editor del borrador (B05:404-624; CAND-NUT-B): la jerarquía Día tipo → Comida → Opción → Ítem, nunca una tabla plana.
 * - El día tipo no es una fecha (B05:435-443). Las comidas son rótulos libres: se agregan, se renombran, se ordenan y se
 *   quitan, sin fijar cuatro (B05:447-467).
 * - Cada ítem lleva cantidad, unidad y estado de preparación; con cantidad, el estado es obligatorio (REG-06-122).
 * - «Guardar cambios» no activa (B05:607-624). Validar informa cada problema en su lugar; activar pide confirmación
 *   con el texto literal de B05:685-695 y la API revalida todo en la misma transacción.
 * - La modalidad B no se ofrece, ni como «Próximamente» (B05:503-518).
 * - DL-119: «Agregar receta como opción» suma una opción `{label, recipeVersionId}`. Sus ítems los arma la API con los
 *   ingredientes de una porción de esa versión de la receta: en el editor se ven en lectura, y para cambiarlos se edita
 *   la receta y se vuelve a agregar. Las opciones no se presentan como equivalentes.
 */
import {
  estructuraNutricionalComoEntrada,
  cantidad as formatearCantidad,
  COPY,
  COPY_RECETAS,
  nutrienteParaMostrar,
  COPY_INTEGRACIONES,
  COPY_NUTRICION,
  ETIQUETA_DE_PREPARACION,
  ETIQUETA_DE_UNIDAD,
  leerNumero,
  motivoDeNumeroIlegible,
  type ElementoDeCatalogo,
  type EstructuraDePlanEntrada,
  type Receta,
  type RecetaDeOpcion,
  type ValidationIssue,
  type VersionDePlan,
} from '@be/domain';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Ayuda, AvisoFlotante } from '../../../../components/ayuda';
import { DialogoDeConfirmacion } from '../../../../components/dialogo';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { numeroEnCampo } from '../../../../lib/formato';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useCambiosSinGuardar } from '../marco-del-area';
import { NoDisponible, useNutricion } from './nutricion';
import { DialogoGuardarPlantillaNutricional, NotaDeOrigenNutricional } from './plantillas';
import { COPY_HABITUALES, COPY_PLANTILLAS } from '@be/domain';
import { AgregarItem } from './agregar-item';
import { DialogoGuardarComidaHabitual, InsertarComidaHabitual, useAlimentosHabituales, useComidasHabituales } from './habituales';

type Estructura = EstructuraDePlanEntrada['dayTypes'];
type Item = Estructura[number]['meals'][number]['options'][number]['items'][number];
type Preparacion = 'RAW' | 'COOKED' | 'AS_PURCHASED';
type Unidad = 'g' | 'ml' | 'unit';

/**
 * La jerarquía de la respuesta, como entrada del PATCH: el helper compartido con las plantillas (PF-09). Una opción que
 * nació de una receta vuelve como `{label, recipeVersionId}`, sin ítems: los vuelve a armar la API (DL-119).
 */
function aEntrada(v: VersionDePlan): Estructura {
  return estructuraNutricionalComoEntrada(v).dayTypes.map((d, i) => ({
    ...d,
    meals: d.meals.map((m, j) => ({
      ...m,
      options: m.options.map((o, k) => {
        const receta = v.dayTypes[i]?.meals[j]?.options[k]?.recipe;
        return receta ? { ...(o.optionId ? { optionId: o.optionId } : {}), label: o.label, items: [], recipeVersionId: receta.recipeVersionId } : o;
      }),
    })),
  }));
}

/** Las recetas de las opciones guardadas, por versión: para nombrarlas en el editor. */
function recetasDe(v: VersionDePlan): Record<string, RecetaDeOpcion> {
  const r: Record<string, RecetaDeOpcion> = {};
  for (const d of v.dayTypes) for (const m of d.meals) for (const o of m.options) if (o.recipe) r[o.recipe.recipeVersionId] = o.recipe;
  return r;
}

/** Los ítems que la API armó para una opción ya guardada (una porción de la receta). */
function itemsGuardados(v: VersionDePlan, optionId: string | undefined) {
  if (!optionId) return null;
  for (const d of v.dayTypes) for (const m of d.meals) for (const o of m.options) if (o.optionId === optionId) return o.items;
  return null;
}

const tieneRecetas = (comidas: readonly Estructura[number]['meals'][number][]) => comidas.some((m) => m.options.some((o) => o.recipeVersionId));

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
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useNutricion();
  const [version, setVersion] = useState<VersionDePlan | null>(null);
  const [error, setError] = useState<'no-disponible' | 'error' | null>(null);
  const [estructura, setEstructura] = useState<Estructura>([]);
  const [proximaRevision, setProximaRevision] = useState('');
  const [nombres, setNombres] = useState<Record<string, string>>({});
  // DL-119: la receta de cada opción de receta, por la versión que cita.
  const [recetas, setRecetas] = useState<Record<string, RecetaDeOpcion>>({});
  const [eligiendoReceta, setEligiendoReceta] = useState<{ i: number; j: number } | null>(null);
  const [sucio, setSucio] = useState(false);
  useCambiosSinGuardar(sucio, 'el plan en preparación');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'exito' | 'info'; texto: string } | null>(null);
  const [problemas, setProblemas] = useState<readonly ValidationIssue[] | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  // «Guardar como plantilla» sobre el borrador tal como está en pantalla (PF-09; DL-108); sin origen: no es una versión activada.
  const [guardarPlantilla, setGuardarPlantilla] = useState(false);
  // «Guardar como habitual» sobre una comida del borrador (DL-109): la posición de la comida elegida, o nada.
  const [guardarHabitual, setGuardarHabitual] = useState<{ i: number; j: number } | null>(null);
  const comidasHabituales = useComidasHabituales(token);
  // Los alimentos habituales se cargan una vez para todo el borrador.
  const alimentosHabituales = useAlimentosHabituales(token);
  // «Agregar ítem» (maqueta 21): la opción a la que se le suma, o nada si el cajón está cerrado.
  const [agregando, setAgregando] = useState<{ readonly i: number; readonly j: number; readonly k: number } | null>(null);
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
    setRecetas(recetasDe(r.datos.data));
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
    if (hayCantidadesIlegibles(estructura)) {
      setMensaje({ tipo: 'error', texto: 'Hay cantidades que no se entienden. Corregí los campos marcados antes de guardar.' });
      return null;
    }
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
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(r) || accesoRetirado(r)) return null;
    if (!r.ok) {
      if (r.tipo === 'API' && r.issues.length > 0) setProblemas(r.issues);
      setMensaje({ tipo: 'error', texto: r.tipo === 'API' && r.issues.length > 0 ? 'Hay elementos del plan que no se pueden guardar.' : mensajeDeFallo(r) });
      return null;
    }
    setVersion(r.datos.data);
    setEstructura(aEntrada(r.datos.data));
    setNombres((n) => ({ ...n, ...nombresDe(r.datos.data) }));
    setRecetas((x) => ({ ...x, ...recetasDe(r.datos.data) }));
    setSucio(false);
    return r.datos.data;
  }

  async function validar() {
    const v = sucio ? await guardar() : version;
    if (!v) return;
    const r = await api.validarPlan(token, planId, v.version);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
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
    if (sesionPerdida(r) || accesoRetirado(r)) return;
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

  // «Almuerzo · opción 1: Pollo, arroz y verduras»: el cajón tapa la opción, y lo dice arriba.
  const comidaDondeSeAgrega = agregando ? estructura[agregando.i]?.meals[agregando.j] : undefined;
  const opcionDondeSeAgrega = agregando ? comidaDondeSeAgrega?.options[agregando.k] : undefined;
  const dondeSeAgrega =
    agregando && comidaDondeSeAgrega && opcionDondeSeAgrega
      ? `${comidaDondeSeAgrega.label.trim() || `Comida ${agregando.j + 1}`} · opción ${agregando.k + 1}${opcionDondeSeAgrega.label.trim() ? `: ${opcionDondeSeAgrega.label.trim()}` : ''}`
      : null;

  return (
    <section className="seccion" aria-labelledby="titulo-borrador">
      <h2 id="titulo-borrador">
        Versión en preparación <span className="insignia">{COPY_NUTRICION.borrador}</span>
      </h2>
      <Ayuda titulo="Qué es una versión en preparación">
        <p>El borrador no es visible para el asesorado. Guardar no activa.</p>
        {version.predecessorPlanId ? <p>Nueva versión a partir de la versión activa. La versión activa no cambia hasta que actives esta.</p> : null}
      </Ayuda>
      {version.templateOrigin ? <NotaDeOrigenNutricional token={token} origen={version.templateOrigin} /> : null}
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
                    {o.recipeVersionId ? (
                      <OpcionDeReceta receta={recetas[o.recipeVersionId] ?? null} items={itemsGuardados(version, o.optionId)} nombres={nombres} />
                    ) : (
                    <>
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
                    <button type="button" className="boton boton--secundario" data-agregar-item onClick={() => setAgregando({ i, j, k })}>
                      <Icono nombre="mas" tamano={18} />
                      Agregar ítem
                    </button>
                    </>
                    )}
                    <button type="button" className="boton boton--enlace" onClick={() => cambiar((x) => (x[i]!.meals[j]!.options.splice(k, 1), x))}>
                      Quitar opción {k + 1}
                    </button>
                  </fieldset>
                ))}
                <div className="acciones">
                  <button type="button" className="boton boton--secundario" onClick={() => cambiar((x) => (x[i]!.meals[j]!.options.push({ label: `Opción ${m.options.length + 1}`, items: [] }), x))}>
                    Agregar opción
                  </button>
                  <button
                    type="button"
                    className="boton boton--secundario"
                    aria-expanded={eligiendoReceta?.i === i && eligiendoReceta.j === j}
                    onClick={() => setEligiendoReceta(eligiendoReceta?.i === i && eligiendoReceta.j === j ? null : { i, j })}
                  >
                    {COPY_RECETAS.agregarComoOpcion}
                  </button>
                  <button type="button" className="boton boton--enlace" disabled={j === 0} onClick={() => cambiar((x) => ([x[i]!.meals[j - 1], x[i]!.meals[j]] = [x[i]!.meals[j]!, x[i]!.meals[j - 1]!], x))}>
                    Subir
                  </button>
                  <button type="button" className="boton boton--enlace" onClick={() => cambiar((x) => (x[i]!.meals.splice(j, 1), x))}>
                    Quitar comida
                  </button>
                  <button
                    type="button"
                    className="boton boton--enlace"
                    onClick={() => (tieneRecetas([m]) ? setMensaje({ tipo: 'info', texto: COPY_RECETAS.recetaEnPlantilla }) : setGuardarHabitual({ i, j }))}
                  >
                    {COPY_HABITUALES.guardarComoHabitual}
                  </button>
                </div>
                {eligiendoReceta?.i === i && eligiendoReceta.j === j ? (
                  <ElegirReceta
                    onCerrar={() => setEligiendoReceta(null)}
                    onElegir={(receta) => {
                      setRecetas((x) => ({
                        ...x,
                        [receta.recipeVersionId]: { recipeId: receta.recipeId, recipeVersionId: receta.recipeVersionId, versionNumber: receta.versionNumber, name: receta.name, servings: receta.servings },
                      }));
                      cambiar((x) => (x[i]!.meals[j]!.options.push({ label: receta.name, items: [], recipeVersionId: receta.recipeVersionId }), x));
                      setEligiendoReceta(null);
                    }}
                  />
                ) : null}
                {m.options.some((o) => o.recipeVersionId) ? <p className="nota">{COPY_RECETAS.avisoDeOpciones}</p> : null}
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
            <InsertarComidaHabitual
              comidas={comidasHabituales.lista}
              onInsertar={(comida, nombresNuevos) => {
                setNombres((n) => ({ ...n, ...nombresNuevos }));
                cambiar((x) => (x[i]!.meals.push(comida), x));
              }}
            />
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
      {mensaje && mensaje.tipo === 'exito' ? (
        <AvisoFlotante onCerrar={() => setMensaje(null)}>
          <p>{mensaje.texto}</p>
        </AvisoFlotante>
      ) : null}
      {mensaje && mensaje.tipo !== 'exito' ? (
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
        <button
          type="button"
          className="boton boton--secundario"
          onClick={() => (estructura.some((d) => tieneRecetas(d.meals)) ? setMensaje({ tipo: 'info', texto: COPY_RECETAS.recetaEnPlantilla }) : setGuardarPlantilla(true))}
          disabled={guardando}
        >
          {COPY_PLANTILLAS.guardarComoPlantilla}
        </button>
      </div>
      {sucio ? <p className="nota">Guardá los cambios antes de activar.</p> : null}
      <DialogoGuardarPlantillaNutricional
        token={token}
        abierto={guardarPlantilla}
        estructura={{ dayTypes: estructura }}
        origen={null}
        onCerrar={() => setGuardarPlantilla(false)}
        onGuardada={() => {
          setGuardarPlantilla(false);
          setMensaje({ tipo: 'exito', texto: COPY_PLANTILLAS.guardada });
        }}
      />
      <DialogoGuardarComidaHabitual
        token={token}
        abierto={guardarHabitual !== null}
        comida={guardarHabitual ? (estructura[guardarHabitual.i]?.meals[guardarHabitual.j] ?? null) : null}
        existentes={comidasHabituales.lista ?? []}
        onCerrar={() => setGuardarHabitual(null)}
        onGuardada={() => {
          setGuardarHabitual(null);
          setMensaje({ tipo: 'exito', texto: COPY_HABITUALES.guardadaComida });
          void comidasHabituales.recargar();
        }}
      />

      <AgregarItem
        abierto={agregando !== null}
        deDonde={dondeSeAgrega}
        habituales={alimentosHabituales}
        onElegir={(el) => {
          if (!agregando) return;
          const { i, j, k } = agregando;
          setNombres((n) => ({ ...n, [el.catalogItemId]: el.name }));
          // El ítem nace sin cantidad ni estado: se completan en la opción (REG-06-122).
          cambiar((x) => (x[i]!.meals[j]!.options[k]!.items.push({ catalogItemId: el.catalogItemId, quantity: null, preparationState: null, note: null }), x));
        }}
        onCerrar={() => setAgregando(null)}
      />

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

/** Una cantidad escrita que no es un número queda como NaN en la estructura (ver `FilaDeItem`). */
function hayCantidadesIlegibles(e: Estructura): boolean {
  return e.some((d) => d.meals.some((m) => m.options.some((o) => o.items.some((i) => i.quantity !== null && Number.isNaN(i.quantity.value)))));
}

function FilaDeItem({ id, item, nombre, onCambiar, onQuitar }: { id: string; item: Item; nombre: string; onCambiar: (c: Partial<Item>) => void; onQuitar: () => void }) {
  const magnitud = item.quantity;
  /**
   * El campo guarda el texto tal como se escribe y propaga lo interpretado: si mostrara siempre el número
   * interpretado, «72,» se borraría a mitad de camino y no se podría escribir un decimal. Se resincroniza cuando el
   * valor cambia desde afuera (al guardar, al quitar un ítem).
   */
  const externo = numeroEnCampo(magnitud?.value);
  const [escrito, setEscrito] = useState(externo);
  useEffect(() => {
    setEscrito((t) => (numeroEnCampo(leerNumero(t)) === externo ? t : externo));
  }, [externo]);
  // Lo que no es un número se señala en el campo, en vez de guardarse como cero en silencio (B10-10:164-165).
  const error = escrito.trim() !== '' && leerNumero(escrito) === null ? motivoDeNumeroIlegible(escrito) : null;

  return (
    <li className="fila-de-item">
      <strong>{nombre}</strong>
      <Campo
        id={`${id}-cantidad`}
        etiqueta="Cantidad"
        inputMode="decimal"
        value={escrito}
        error={error}
        onChange={(e) => {
          setEscrito(e.target.value);
          const n = leerNumero(e.target.value);
          if (e.target.value.trim() === '') return onCambiar({ quantity: null });
          // Lo que no se entiende viaja como NaN, igual que en entrenamiento: el guardado se niega y lo señala, en
          // vez de guardar en silencio el último número válido que había en el campo.
          onCambiar({ quantity: { value: n ?? Number.NaN, unit: magnitud?.unit ?? 'g' } });
        }}
      />
      <div className="campo">
        <label htmlFor={`${id}-unidad`}>Unidad</label>
        <select id={`${id}-unidad`} value={magnitud?.unit ?? 'g'} disabled={!magnitud} onChange={(e) => magnitud && onCambiar({ quantity: { ...magnitud, unit: e.target.value as Unidad } })}>
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

/**
 * Una opción que nació de una receta (DL-119): la receta y su versión, y los ítems de una porción que armó la API, en
 * lectura. Antes de guardar, todavía no hay ítems: se dice.
 */
function OpcionDeReceta({ receta, items, nombres }: { receta: RecetaDeOpcion | null; items: VersionDePlan['dayTypes'][number]['meals'][number]['options'][number]['items'] | null; nombres: Record<string, string> }) {
  return (
    <div className="opcion-de-receta">
      <p>
        <span className="insignia">{receta ? COPY_RECETAS.opcionDeReceta(receta.name, receta.versionNumber) : 'Receta'}</span>
      </p>
      <p className="nota">{COPY_RECETAS.porcionDeLaOpcion}</p>
      {items ? (
        <ul className="lista-compacta">
          {items.map((it) => (
            <li key={it.itemId}>
              <strong>{it.name || nombres[it.catalogItemId] || 'Elemento'}</strong>
              {it.quantity ? ` · ${formatearCantidad(it.quantity.value, ETIQUETA_DE_UNIDAD[it.quantity.unit])}` : ''}
              {it.preparationState ? ` · ${ETIQUETA_DE_PREPARACION[it.preparationState].toLowerCase()}` : ''}
            </li>
          ))}
        </ul>
      ) : (
        <p className="nota">{COPY_RECETAS.ingredientesAlGuardar}</p>
      )}
    </div>
  );
}

/** Elegir una de mis recetas para ofrecerla como opción: se agrega su versión vigente (API-REC-02). */
function ElegirReceta({ onElegir, onCerrar }: { onElegir: (r: Receta) => void; onCerrar: () => void }) {
  const { token, sesionPerdida } = useNutricion();
  const [estado, setEstado] = useState<{ tipo: 'cargando' } | { tipo: 'error'; texto: string } | { tipo: 'lista'; recetas: readonly Receta[]; mas: string | null }>({ tipo: 'cargando' });

  const cargar = useCallback(
    async (cursor?: string) => {
      const r = await api.listarRecetas(token, cursor ? { cursor } : {});
      if (sesionPerdida(r)) return;
      if (!r.ok) return setEstado({ tipo: 'error', texto: r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN' ? COPY_RECETAS.soloNutricion : mensajeDeFallo(r) });
      setEstado((e) => ({
        tipo: 'lista',
        recetas: cursor && e.tipo === 'lista' ? [...e.recetas, ...r.datos.data] : r.datos.data,
        mas: r.datos.page.hasMore ? r.datos.page.nextCursor : null,
      }));
    },
    [token, sesionPerdida],
  );
  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <div className="buscador">
      <p className="lista__titulo">{COPY_RECETAS.elegirReceta}</p>
      {estado.tipo === 'cargando' ? <Cargando /> : null}
      {estado.tipo === 'error' ? (
        <Aviso tipo="error">
          <p>{estado.texto}</p>
        </Aviso>
      ) : null}
      {estado.tipo === 'lista' && estado.recetas.length === 0 ? (
        <p>
          {COPY_RECETAS.sinRecetasParaElegir} <Link href="/pro/recipes">{COPY_RECETAS.irAMisRecetas}</Link>
        </p>
      ) : null}
      {estado.tipo === 'lista' && estado.recetas.length > 0 ? (
        <ul className="lista">
          {estado.recetas.map((r) => (
            <li key={r.recipeId} className="lista__item">
              <p className="lista__titulo">{r.name}</p>
              <p className="nota">
                {COPY_RECETAS.version(r.versionNumber)} · {COPY_RECETAS.porcionesYEnergia(r.servings, nutrienteParaMostrar(r.calculation.perServing.energyKcal, 'energyKcal'))}
              </p>
              <button type="button" className="boton boton--enlace" onClick={() => onElegir(r)}>
                {COPY_RECETAS.agregarComoOpcion}: {r.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {estado.tipo === 'lista' && estado.mas ? (
        <button type="button" className="boton boton--secundario" onClick={() => void cargar(estado.mas ?? undefined)}>
          Ver más
        </button>
      ) : null}
      <button type="button" className="boton boton--enlace" onClick={onCerrar}>
        Cerrar
      </button>
    </div>
  );
}
