'use client';

/**
 * La versión en preparación del plan de comidas (B05:404-624; CAND-NUT-B): la jerarquía Día tipo → Comida → Opción →
 * Ítem, nunca una tabla plana.
 * - El día tipo no es una fecha (B05:435-443). Las comidas son rótulos libres: se agregan, se renombran, se ordenan y se
 *   quitan, sin fijar cuatro (B05:447-467).
 * - Cada ítem lleva cantidad, unidad y estado de preparación; con cantidad, el estado es obligatorio (REG-06-122).
 * - «Guardar cambios» no activa (B05:607-624). Validar informa cada problema en su lugar; activar pide confirmación
 *   con el texto literal de B05:685-695 y la API revalida todo en la misma transacción.
 * - La modalidad B no se ofrece, ni como «Próximamente» (B05:503-518).
 * - DL-119: «Agregar receta como opción» suma una opción `{label, recipeVersionId}`. Sus ítems los arma la API con los
 *   ingredientes de una porción de esa versión de la receta: en el editor se ven en lectura, y para cambiarlos se edita
 *   la receta y se vuelve a agregar. Las opciones no se presentan como equivalentes.
 *
 * **La composición (WP-ESCRITORIO-AREAS, parte 7; maquetas 17 y 18).** Se mira un día tipo por vez, con sus comidas
 * plegadas; adentro de una comida, sus opciones en pestañas y los ítems en una tabla. Lo que se usa de vez en cuando
 * (cambiar un nombre, quitar, guardar como plantilla o como habitual) va en un menú. Hace lo mismo que antes:
 * - **Lo que se mira vive en la dirección,** por su posición: el día tipo (`dia`) y las comidas abiertas (`comidas`).
 *   «Actualizar» y volver atrás lo conservan. Al entrar no hay ninguna comida abierta: el día se lee de un vistazo.
 * - **«Activar plan» guarda antes, si hace falta,** y recién entonces pregunta. El diálogo dice qué entra y qué queda, y
 *   ahí se fija la próxima revisión, que es parte de ese acto. Si no se puede guardar, no se abre, y se dice por qué.
 * - **Cada problema de «Validar» lleva a su lugar:** elige el día tipo, abre la comida y la opción.
 */
import {
  COPY,
  COPY_DE_ACTIVAR_EL_PLAN,
  COPY_GUARDADO,
  COPY_DEL_PLAN,
  COPY_HABITUALES,
  COPY_NUTRICION,
  COPY_PLANTILLAS,
  COPY_RECETAS,
  PROBLEMA_DEL_EDITOR,
  avisoDeLoQueNoDejaGuardar,
  comidasAbiertasEnElEditor,
  estructuraNutricionalComoEntrada,
  loQueEntraAlActivar,
  loQueNoDejaGuardar,
  lugarDelProblema,
  nutrienteParaMostrar,
  pedidoDeComidasDelEditor,
  pedidoDeLaPosicion,
  posicionPedida,
  problemasDeLaComida,
  ubicacionDelProblema,
  type Receta,
  type RecetaDeOpcion,
  type ValidationIssue,
  type VersionDeObjetivo,
  type VersionDePlan,
} from '@be/domain';
import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AvisoFlotante } from '../../../../components/ayuda';
import { Cajon } from '../../../../components/cajon';
import { CampoDeNombre } from '../../../../components/campo-de-nombre';
import { DialogoDeConfirmacion } from '../../../../components/dialogo';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { MenuDeAcciones } from '../../../../components/menu-de-acciones';
import { api } from '../../../../lib/api';
import { EstadoDeGuardado } from '../../../../components/estado-de-guardado';
import { useAutoguardado } from '../../../../lib/autoguardado';
import { diaSinElAnioEnCurso, horaDelDia } from '../../../../lib/formato';
import { esIncierto, mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useCambiosSinGuardar } from '../marco-del-area';
import { TiraDelObjetivo } from '../seguimiento/tira-del-objetivo';
import { AgregarItem } from './agregar-item';
import { ComidaDelEditor, type ComidaEnEdicion, type Estructura } from './comida-del-editor';
import { DialogoGuardarComidaHabitual, InsertarComidaHabitual, useAlimentosHabituales, useComidasHabituales } from './habituales';
import { NoDisponible, useNutricion } from './nutricion';
import { DialogoGuardarPlantillaNutricional, NotaDeOrigenNutricional } from './plantillas';

/** El contrato admite hasta siete días tipo en un plan. */
const MAXIMO_DE_DIAS_TIPO = 7;

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

const tieneRecetas = (comidas: readonly ComidaEnEdicion[]) => comidas.some((m) => m.options.some((o) => o.recipeVersionId));

function nombresDe(v: VersionDePlan): Record<string, string> {
  const n: Record<string, string> = {};
  for (const d of v.dayTypes) for (const m of d.meals) for (const o of m.options) for (const i of o.items) n[i.catalogItemId] = i.name;
  return n;
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
  // Lo que el editor ve solo, antes de guardar.
  [PROBLEMA_DEL_EDITOR.faltaElNombre]: 'falta el nombre',
  [PROBLEMA_DEL_EDITOR.cantidadIlegible]: 'la cantidad no se entiende',
};

const esDelEditor = (codigo: string): boolean => codigo === PROBLEMA_DEL_EDITOR.faltaElNombre || codigo === PROBLEMA_DEL_EDITOR.cantidadIlegible;

/** Qué nombre se está cambiando: el de un día tipo, el de una comida o el de una opción, por sus posiciones. */
type NombreQueSeCambia = { readonly de: 'dia'; readonly i: number } | { readonly de: 'comida'; readonly i: number; readonly j: number } | { readonly de: 'opcion'; readonly i: number; readonly j: number; readonly k: number } | null;

export function EditorDeBorrador({
  planId,
  objetivo,
  vigente = null,
  onActivado,
}: {
  planId: string;
  /**
   * El objetivo vigente, que ya leyó la sección: lo que la versión usa, o va a usar al guardar si hay uno más nuevo.
   * El editor no lo vuelve a pedir: sin esa lectura, la sección no llega a mostrarlo.
   */
  objetivo: VersionDeObjetivo | null;
  /** La versión que rige hoy, que al activar esta queda en el historial; `null` si es la primera. */
  vigente?: { readonly numero: number; readonly desde: string } | null;
  onActivado: () => void;
}) {
  const { token, sesionPerdida, accesoRetirado, parametros, ir } = useNutricion();
  const propio = useId();
  const [version, setVersion] = useState<VersionDePlan | null>(null);
  const [error, setError] = useState<'no-disponible' | 'error' | null>(null);
  const [estructura, setEstructura] = useState<Estructura>([]);
  const [proximaRevision, setProximaRevision] = useState('');
  const [nombres, setNombres] = useState<Record<string, string>>({});
  // DL-119: la receta de cada opción de receta, por la versión que cita.
  const [recetas, setRecetas] = useState<Record<string, RecetaDeOpcion>>({});
  const [eligiendoReceta, setEligiendoReceta] = useState<{ readonly i: number; readonly j: number } | null>(null);
  const [sucio, setSucio] = useState(false);
  useCambiosSinGuardar(sucio, 'el plan en preparación');
  const [guardando, setGuardando] = useState(false);
  // Bloque 3 del encargo de consolidación (2026-10-19): el estado de escritura inequívoco, el conflicto con otra pestaña y
  // el autoguardado. «Guardado» solo con la respuesta del servidor; un 409 por versión no pisa nada.
  const [fallo, setFallo] = useState(false);
  const [conflicto, setConflicto] = useState(false);
  const [guardadoA, setGuardadoA] = useState<string | null>(null);
  // Cuántas ediciones hubo: lo que se escribe mientras viaja un guardado no se pisa con la respuesta.
  const ediciones = useRef(0);
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'exito' | 'info'; texto: string } | null>(null);
  const [problemas, setProblemas] = useState<readonly ValidationIssue[] | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  // «Guardar como plantilla» sobre el borrador tal como está en pantalla (PF-09; DL-108); sin origen: no es una versión activada.
  const [guardarPlantilla, setGuardarPlantilla] = useState(false);
  // «Guardar como habitual» sobre una comida del borrador (DL-109): la posición de la comida elegida, o nada.
  const [guardarHabitual, setGuardarHabitual] = useState<{ readonly i: number; readonly j: number } | null>(null);
  // «Agregar comida ▾ → Una comida habitual» (bloque 5 del encargo de consolidación): el selector aparece a pedido, como en
  // Entrenamiento.
  const [insertandoComida, setInsertandoComida] = useState(false);
  const comidasHabituales = useComidasHabituales(token);
  // Los alimentos habituales se cargan una vez para todo el borrador.
  const alimentosHabituales = useAlimentosHabituales(token);
  // «Agregar ítem» (maqueta 21): la opción a la que se le suma, o nada si el cajón está cerrado.
  const [agregando, setAgregando] = useState<{ readonly i: number; readonly j: number; readonly k: number } | null>(null);
  const [activando, setActivando] = useState(false);
  const [falloDeActivacion, setFalloDeActivacion] = useState<string | null>(null);
  const intentoDeActivar = useClaveDeIntento();
  // La opción que se edita en cada comida (por «día-comida»); el nombre que se está cambiando; y el campo que hay que
  // enfocar después de ir a un problema.
  const [pestanas, setPestanas] = useState<Readonly<Record<string, number>>>({});
  const [nombreQueSeCambia, setNombreQueSeCambia] = useState<NombreQueSeCambia>(null);
  const [paraEnfocar, setParaEnfocar] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    const r = await api.consultarPlan(token, planId);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setError(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? 'no-disponible' : 'error');
    setVersion(r.datos.data);
    setEstructura(aEntrada(r.datos.data));
    setNombres(nombresDe(r.datos.data));
    setRecetas(recetasDe(r.datos.data));
    setProximaRevision(r.datos.data.nextReviewAt ?? '');
    setSucio(false);
    setFallo(false);
    setConflicto(false);
  }, [token, planId, sesionPerdida]);

  useEffect(() => {
    ediciones.current += 1;
  }, [estructura, proximaRevision]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Después de ir a un problema, el foco va a su lugar en cuanto está dibujado (el día tipo puede tardar un instante
  // en cambiar). Si la persona hace otra cosa antes, ese foco pendiente se olvida: no salta más tarde.
  useEffect(() => {
    if (!paraEnfocar) return;
    const campo = document.getElementById(paraEnfocar);
    if (!campo) return;
    campo.focus();
    setParaEnfocar(null);
  });

  const cambiar = (f: (e: Estructura) => Estructura) => {
    setEstructura((e) => f(structuredClone(e)));
    setSucio(true);
    setProblemas(null);
    setMensaje(null);
    setParaEnfocar(null);
  };

  const objetivoVigente = objetivo?.versionId ?? null;

  /** Guarda (PATCH) y devuelve la versión nueva, o `null` si falló. */
  async function guardar(automatico = false): Promise<VersionDePlan | null> {
    if (!version) return null;
    // Un nombre vacío o una cantidad que no se entiende pueden estar en otro día tipo, en una comida plegada o en otra
    // pestaña: se listan, y cada uno lleva a su lugar.
    const impide = loQueNoDejaGuardar(estructura);
    if (impide.length > 0) {
      // El autoguardado espera a que se pueda guardar: no abre avisos mientras se escribe.
      if (automatico) return null;
      setProblemas(impide);
      setMensaje({ tipo: 'error', texto: avisoDeLoQueNoDejaGuardar(impide) });
      return null;
    }
    const edicionesAlEnviar = ediciones.current;
    const estructuraEnviada = estructura;
    setGuardando(true);
    if (!automatico) setMensaje(null);
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
      if (r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') {
        // Si el intento anterior se perdió en la red, lo guardado puede ser lo nuestro: entonces no hay conflicto.
        const actual = fallo ? await api.consultarPlan(token, planId) : null;
        if (actual?.ok && JSON.stringify(aEntrada(actual.datos.data)) === JSON.stringify(estructuraEnviada) && (actual.datos.data.nextReviewAt ?? '') === proximaRevision) {
          setVersion(actual.datos.data);
          setFallo(false);
          setGuardadoA(horaDelDia(new Date()));
          if (ediciones.current === edicionesAlEnviar) setSucio(false);
          return actual.datos.data;
        }
        setConflicto(true);
        return null;
      }
      setFallo(true);
      if (automatico) return null;
      if (r.tipo === 'API' && r.issues.length > 0) setProblemas(r.issues);
      setMensaje({ tipo: 'error', texto: r.tipo === 'API' && r.issues.length > 0 ? 'Hay elementos del plan que no se pueden guardar.' : mensajeDeFallo(r) });
      return null;
    }
    setVersion(r.datos.data);
    setFallo(false);
    setConflicto(false);
    setGuardadoA(horaDelDia(new Date()));
    // Lo escrito mientras viajaba el guardado se conserva: sigue pendiente y viaja en el próximo, con la versión nueva.
    const sinCambiosDespues = ediciones.current === edicionesAlEnviar;
    if (sinCambiosDespues) setEstructura(aEntrada(r.datos.data));
    setNombres((n) => ({ ...n, ...nombresDe(r.datos.data) }));
    setRecetas((x) => ({ ...x, ...recetasDe(r.datos.data) }));
    if (sinCambiosDespues) setSucio(false);
    return r.datos.data;
  }

  // El autoguardado: la preparación se guarda sola en la primera pausa, si se puede y si no hay un acto abierto.
  const puedeGuardar = loQueNoDejaGuardar(estructura).length === 0;
  const cambiosParaGuardar = useMemo(() => [estructura, proximaRevision], [estructura, proximaRevision]);
  useAutoguardado({
    habilitado: !!version && sucio && puedeGuardar && !guardando && !conflicto && !confirmar && !activando,
    cambios: cambiosParaGuardar,
    guardar: () => void guardar(true),
  });

  async function validar() {
    const v = sucio ? await guardar() : version;
    if (!v) return;
    const r = await api.validarPlan(token, planId, v.version);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) return setMensaje({ tipo: 'error', texto: mensajeDeFallo(r) });
    setProblemas(r.datos.data.issues);
    setMensaje(r.datos.data.valid ? { tipo: 'exito', texto: COPY_NUTRICION.planValido } : { tipo: 'error', texto: COPY_NUTRICION.hayElementosPorCorregir });
  }

  /** «Activar plan»: con cambios, guarda antes; si no se puede guardar, no pregunta nada (el motivo queda a la vista). */
  async function abrirLaActivacion() {
    const v = sucio ? await guardar() : version;
    if (!v) return;
    setFalloDeActivacion(null);
    setConfirmar(true);
  }

  async function activar() {
    if (!version) return;
    setActivando(true);
    setFalloDeActivacion(null);
    // La próxima revisión se fija en este acto: si cambió, se guarda antes, y se activa la versión que eso deja.
    let v: VersionDePlan | null = version;
    if (proximaRevision !== (version.nextReviewAt ?? '')) {
      v = await guardar();
      if (!v) {
        setActivando(false);
        return setFalloDeActivacion(COPY_DE_ACTIVAR_EL_PLAN.noSePudoGuardarAntes);
      }
    }
    const r = await api.activarPlan(token, planId, v.version, intentoDeActivar.actual());
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

  // ── Lo que se mira: el día tipo y las comidas abiertas, por su posición, según la dirección ────────────────────
  const i = posicionPedida(estructura.length, parametros.get('dia'));
  const dia = i >= 0 ? estructura[i] : undefined;
  const abiertas = comidasAbiertasEnElEditor(dia?.meals.length ?? 0, parametros.get('comidas'));
  const nombreDelDia = dia ? dia.label.trim() || `Día tipo ${i + 1}` : '';
  // Lo que el editor ve solo ya lo dice cada comida con sus palabras («Falta el nombre»): acá van los de «Validar».
  const rutasConProblemas = (problemas ?? []).filter((p) => !esDelEditor(p.code)).map((p) => p.path);
  const elegirDia = (n: number) => {
    setParaEnfocar(null);
    ir({ dia: pedidoDeLaPosicion(n), comidas: null });
  };
  const dejarAbiertas = (s: ReadonlySet<number>) => {
    setParaEnfocar(null);
    ir({ comidas: pedidoDeComidasDelEditor(s) });
  };
  const cambiandoElNombreDelDia = nombreQueSeCambia?.de === 'dia' && nombreQueSeCambia.i === i;
  const pestana = (j: number) => pestanas[`${i}-${j}`] ?? 0;
  const elegirPestana = (j: number, k: number) => setPestanas((p) => ({ ...p, [`${i}-${j}`]: k }));

  const agregarDia = () => {
    const n = estructura.length;
    cambiar((x) => (x.push({ label: `Día tipo ${n + 1}`, meals: [] }), x));
    elegirDia(n);
    setNombreQueSeCambia({ de: 'dia', i: n });
  };
  const quitarDia = () => {
    cambiar((x) => (x.splice(i, 1), x));
    setPestanas({});
    elegirDia(Math.max(0, i - 1));
  };
  const agregarComida = () => {
    const j = dia?.meals.length ?? 0;
    cambiar((x) => (x[i]!.meals.push({ label: '', prescriptionMode: 'DISH_OPTIONS', options: [] }), x));
    dejarAbiertas(new Set([...abiertas, j]));
    // Una comida sin nombre no se puede guardar: nace con el campo abierto.
    setNombreQueSeCambia({ de: 'comida', i, j });
  };
  const subirComida = (j: number) => {
    cambiar((x) => ([x[i]!.meals[j - 1], x[i]!.meals[j]] = [x[i]!.meals[j]!, x[i]!.meals[j - 1]!], x));
    // Lo abierto y la opción elegida acompañan a su comida.
    dejarAbiertas(new Set([...abiertas].map((p) => (p === j ? j - 1 : p === j - 1 ? j : p))));
    setPestanas((p) => ({ ...p, [`${i}-${j - 1}`]: p[`${i}-${j}`] ?? 0, [`${i}-${j}`]: p[`${i}-${j - 1}`] ?? 0 }));
  };
  const quitarComida = (j: number) => {
    cambiar((x) => (x[i]!.meals.splice(j, 1), x));
    dejarAbiertas(new Set([...abiertas].filter((p) => p !== j).map((p) => (p > j ? p - 1 : p))));
    setPestanas({});
  };
  /**
   * Lleva a donde está un problema: elige su día tipo, abre su comida y su opción, y deja el foco ahí (en el campo del
   * ítem, en el renglón de la comida o en el día tipo). Si lo que falta es un nombre, abre su campo.
   */
  const irAlProblema = (p: ValidationIssue) => {
    const l = lugarDelProblema(p.path);
    if (l.dia === null) return;
    ir({ dia: pedidoDeLaPosicion(l.dia), comidas: l.comida === null ? null : pedidoDeComidasDelEditor(new Set([l.comida])) });
    if (l.comida !== null && l.opcion !== null) setPestanas((x) => ({ ...x, [`${l.dia}-${l.comida}`]: l.opcion! }));
    if (p.code === PROBLEMA_DEL_EDITOR.faltaElNombre) {
      return setNombreQueSeCambia(l.comida === null ? { de: 'dia', i: l.dia } : l.opcion === null ? { de: 'comida', i: l.dia, j: l.comida } : { de: 'opcion', i: l.dia, j: l.comida, k: l.opcion });
    }
    if (l.comida === null) return setParaEnfocar(`dia-tipo-${l.dia}`);
    if (l.opcion === null || l.item === null) return setParaEnfocar(`abrir-comida-${l.dia}-${l.comida}`);
    setParaEnfocar(`item-${l.dia}-${l.comida}-${l.opcion}-${l.item}-${p.path.endsWith('.preparationState') ? 'preparacion' : 'cantidad'}`);
  };

  // «Almuerzo · opción 1: Pollo, arroz y verduras»: el cajón tapa la opción, y lo dice arriba.
  const comidaDondeSeAgrega = agregando ? estructura[agregando.i]?.meals[agregando.j] : undefined;
  const opcionDondeSeAgrega = agregando ? comidaDondeSeAgrega?.options[agregando.k] : undefined;
  const dondeSeAgrega =
    agregando && comidaDondeSeAgrega && opcionDondeSeAgrega
      ? `${comidaDondeSeAgrega.label.trim() || `Comida ${agregando.j + 1}`} · opción ${agregando.k + 1}${opcionDondeSeAgrega.label.trim() ? `: ${opcionDondeSeAgrega.label.trim()}` : ''}`
      : null;
  const comidaDeLaReceta = eligiendoReceta ? estructura[eligiendoReceta.i]?.meals[eligiendoReceta.j] : undefined;

  return (
    <section className="seccion editor-del-plan" aria-labelledby="titulo-borrador">
      <div className="editor-del-plan__cabecera">
        <h2 id="titulo-borrador">
          Versión en preparación{' '}
          <span className="etiqueta-de-dato">
            <Icono nombre="borrador" tamano={15} />
            {COPY_NUTRICION.borrador}
          </span>
        </h2>
        <div className="editor-del-plan__acciones">
          <EstadoDeGuardado className="editor-del-plan__estado" guardando={guardando} sucio={sucio} puedeGuardar={puedeGuardar} fallo={fallo} conflicto={conflicto} guardadoA={guardadoA} />
          <MenuDeAcciones
            rotulo="Más acciones de esta versión"
            acciones={[
              {
                clave: 'plantilla',
                texto: COPY_PLANTILLAS.guardarComoPlantilla,
                alElegir: () => setGuardarPlantilla(true),
                noSePuede: estructura.some((d) => tieneRecetas(d.meals)) ? COPY_RECETAS.recetaEnPlantilla : null,
              },
            ]}
          />
          {/* Los tres se apagan con `aria-disabled`, no con `disabled`: un botón deshabilitado pierde el foco, y quien
              guarda con el teclado quedaría fuera de lugar (y «Volver», en el diálogo, no tendría a dónde volver). */}
          <button
            type="button"
            className="boton boton--quieto"
            aria-disabled={guardando || undefined}
            onClick={() => {
              if (!guardando) void validar();
            }}
          >
            {COPY_NUTRICION.validarPlan}
          </button>
          {/* Un solo botón lleno (crítica de diseño del 2026-10-15): «Guardar cambios» si hay algo sin guardar; si no, «Activar plan». */}
          <button
            type="button"
            className={`boton ${sucio ? 'boton--secundario' : 'boton--primario'}`}
            aria-disabled={guardando || undefined}
            onClick={() => {
              if (!guardando) void abrirLaActivacion();
            }}
          >
            <Icono nombre="activar" tamano={18} />
            {COPY_NUTRICION.activarPlan}
          </button>
          <button
            type="button"
            className={`boton ${sucio ? 'boton--primario' : 'boton--secundario'}`}
            aria-disabled={guardando || !sucio || undefined}
            onClick={() => {
              if (!guardando && sucio) void guardar();
            }}
          >
            {COPY_NUTRICION.guardarCambios}
          </button>
        </div>
      </div>
      <p className="nota editor-del-plan__que-es">
        El asesorado no ve esta versión, y guardar no la activa{version.predecessorPlanId ? ': la versión activa no cambia hasta que actives esta' : ''}.
      </p>
      {conflicto ? (
        <Aviso tipo="error" enfocar>
          <p>{COPY_GUARDADO.conflicto}</p>
          <p className="nota">{COPY_GUARDADO.cargarGuardadaAclaracion}</p>
          <button type="button" className="boton boton--secundario" onClick={() => void cargar()}>
            {COPY_GUARDADO.cargarGuardada}
          </button>
        </Aviso>
      ) : null}
      {version.templateOrigin ? <NotaDeOrigenNutricional token={token} origen={version.templateOrigin} /> : null}
      {objetivoVigente && objetivoVigente !== version.objectiveVersionId ? (
        <Aviso tipo="info">
          <p>Hay una versión de objetivo más nueva. Al guardar, el borrador pasa a usarla.</p>
        </Aviso>
      ) : null}

      {mensaje && mensaje.tipo === 'exito' ? (
        <AvisoFlotante onCerrar={() => setMensaje(null)}>
          <p>{mensaje.texto}</p>
        </AvisoFlotante>
      ) : null}
      {mensaje && mensaje.tipo !== 'exito' ? (
        <Aviso tipo={mensaje.tipo} enfocar={mensaje.tipo !== 'info'}>
          <p>{mensaje.texto}</p>
          {problemas && problemas.length > 0 ? (
            <ul className="problemas-del-plan">
              {problemas.map((p, n) => (
                <li key={n}>
                  {/* Cada problema lleva a su lugar: con las comidas plegadas, no hay que ir a buscarlo. */}
                  {lugarDelProblema(p.path).dia === null ? (
                    <>
                      {ubicacionDelProblema(p.path, estructura)} → {PROBLEMA[p.code] ?? 'revisá este elemento'}
                    </>
                  ) : (
                    <button type="button" className="boton boton--enlace" data-problema onClick={() => irAlProblema(p)}>
                      {ubicacionDelProblema(p.path, estructura)} → {PROBLEMA[p.code] ?? 'revisá este elemento'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </Aviso>
      ) : null}

      <div className="editor-del-plan__dia">
        {estructura.length > 0 ? (
          <fieldset className="segmentos segmentos--que-bajan" data-dia-tipo="varios">
            <legend>Día tipo</legend>
            <div className="segmentos__fila">
              {estructura.map((d, n) => (
                <label key={d.dayTypeId ?? `nuevo-${n}`} className="segmento">
                  <input type="radio" id={`dia-tipo-${n}`} name={`${propio}-dia`} checked={n === i} onChange={() => elegirDia(n)} />
                  {d.label.trim() || `Día tipo ${n + 1}`}
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="nota">Esta versión todavía no tiene días tipo.</p>
        )}
        <button type="button" className="boton boton--quieto boton--compacto" data-agregar-dia onClick={agregarDia} disabled={estructura.length >= MAXIMO_DE_DIAS_TIPO}>
          <Icono nombre="mas" tamano={18} />
          Agregar<span className="visualmente-oculto"> un día tipo</span>
        </button>
        {estructura.length >= MAXIMO_DE_DIAS_TIPO ? <span className="nota">Un plan lleva hasta {MAXIMO_DE_DIAS_TIPO} días tipo.</span> : null}
        {dia ? (
          <MenuDeAcciones
            rotulo={`más acciones del día tipo ${nombreDelDia}`}
            acciones={[
              { clave: 'nombre', texto: 'Cambiar el nombre', alElegir: () => setNombreQueSeCambia({ de: 'dia', i }) },
              { clave: 'quitar', texto: 'Quitar este día tipo', alElegir: quitarDia, noSePuede: estructura.length <= 1 ? 'Es el único día tipo de la versión.' : null },
            ]}
          />
        ) : null}
        {objetivo ? (
          <div className="plan__objetivo" data-objetivo="listo">
            <p className="plan__objetivo-titulo">
              <Icono nombre="objetivo" tamano={18} />
              {COPY_DEL_PLAN.objetivoDelDia}
            </p>
            {/* Los macros ya llegaron con el objetivo: acá no hay una lectura que reintentar. */}
            <TiraDelObjetivo calorias={objetivo.estimatedEnergyRequirement.value} macros={{ estado: 'listos', valor: objetivo.macronutrientDistribution }} onReintentar={() => undefined} />
          </div>
        ) : null}
      </div>

      {dia ? (
        <div className="comidas-del-plan comidas-del-editor" data-dia={i + 1}>
          {cambiandoElNombreDelDia || dia.label.trim() === '' ? (
            <CampoDeNombre
              id={`dia-${i}`}
              etiqueta="Nombre del día tipo"
              valor={dia.label}
              maximo={80}
              enfocar={cambiandoElNombreDelDia}
              despues={`dia-tipo-${i}`}
              alEmpezar={() => setNombreQueSeCambia({ de: 'dia', i })}
              alCambiar={(v) => cambiar((x) => ((x[i]!.label = v), x))}
              alTerminar={() => setNombreQueSeCambia(null)}
            />
          ) : null}
          {dia.meals.length === 0 ? <p className="nota">Este día tipo todavía no tiene comidas.</p> : null}
          {dia.meals.map((m, j) => (
            <ComidaDelEditor
              key={m.mealId ?? `nueva-${j}`}
              id={`${i}-${j}`}
              posicion={j}
              comida={m}
              abierta={abiertas.has(j)}
              problemas={problemasDeLaComida(rutasConProblemas, i, j)}
              esLaPrimera={j === 0}
              opcionElegida={pestana(j)}
              nombreEnEdicion={
                nombreQueSeCambia?.de === 'comida' && nombreQueSeCambia.i === i && nombreQueSeCambia.j === j
                  ? { de: 'comida' }
                  : nombreQueSeCambia?.de === 'opcion' && nombreQueSeCambia.i === i && nombreQueSeCambia.j === j
                    ? { de: 'opcion', opcion: nombreQueSeCambia.k }
                    : null
              }
              nombres={nombres}
              recetas={recetas}
              itemsDeLaReceta={(optionId) => itemsGuardados(version, optionId)}
              alAlternar={() => {
                const s = new Set(abiertas);
                if (!s.delete(j)) s.add(j);
                dejarAbiertas(s);
              }}
              alElegirOpcion={(k) => elegirPestana(j, k)}
              alEditarNombre={(que) => setNombreQueSeCambia(que === null ? null : que.de === 'comida' ? { de: 'comida', i, j } : { de: 'opcion', i, j, k: que.opcion })}
              alCambiar={(f) => cambiar((x) => (f(x[i]!.meals[j]!), x))}
              alSubir={() => subirComida(j)}
              alQuitar={() => quitarComida(j)}
              alGuardarComoHabitual={() => setGuardarHabitual({ i, j })}
              alAgregarItem={(k) => setAgregando({ i, j, k })}
              alAgregarReceta={() => setEligiendoReceta({ i, j })}
            />
          ))}
          <div className="editor-del-plan__al-pie">
            {/* Una sola entrada para sumar una comida, como «Agregar ▾» en Entrenamiento: vacía o una habitual. Sin
                habituales guardadas, la opción queda apagada y dice cómo se guardan. Si no se pudieron leer, apagada con
                ese motivo, y una acción más para volver a leerlas (no es «todavía no guardaste ninguna»). */}
            <MenuDeAcciones
              id="agregar-comida"
              rotulo="agregar una comida"
              texto="Agregar comida"
              icono="mas"
              conFlecha
              alineado="izquierda"
              acciones={[
                { clave: 'nueva', texto: 'Una comida vacía', alElegir: agregarComida },
                {
                  clave: 'habitual',
                  texto: 'Una comida habitual',
                  alElegir: () => setInsertandoComida(true),
                  noSePuede:
                    comidasHabituales.lista === null
                      ? 'Leyendo tus comidas habituales…'
                      : comidasHabituales.falla
                        ? COPY_HABITUALES.comidasNoSeLeyeron
                        : comidasHabituales.lista.length === 0
                          ? COPY_HABITUALES.sinComidas
                          : null,
                },
                ...(comidasHabituales.falla ? [{ clave: 'releer', texto: COPY_HABITUALES.volverALeerComidas, alElegir: () => void comidasHabituales.recargar() }] : []),
              ]}
            />
            {insertandoComida ? (
              <div
                className="comida-habitual-a-pedido"
                onKeyDown={(e) => {
                  if (e.key !== 'Escape') return;
                  e.stopPropagation();
                  setInsertandoComida(false);
                  document.getElementById('agregar-comida')?.focus();
                }}
              >
                <InsertarComidaHabitual
                  comidas={comidasHabituales.lista}
                  onInsertar={(comida, nombresNuevos) => {
                    const j = dia?.meals.length ?? 0;
                    setNombres((n) => ({ ...n, ...nombresNuevos }));
                    cambiar((x) => (x[i]!.meals.push(comida), x));
                    dejarAbiertas(new Set([...abiertas, j]));
                    setInsertandoComida(false);
                    // DL-113: el resultado de una acción, donde se está mirando; el foco vuelve a «Agregar comida».
                    setMensaje({ tipo: 'exito', texto: COPY_HABITUALES.insertadaComida });
                    document.getElementById('agregar-comida')?.focus();
                  }}
                />
                <button
                  type="button"
                  className="boton boton--enlace"
                  onClick={() => {
                    setInsertandoComida(false);
                    document.getElementById('agregar-comida')?.focus();
                  }}
                >
                  {COPY_HABITUALES.cancelar}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

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
          const { i: di, j, k } = agregando;
          setNombres((n) => ({ ...n, [el.catalogItemId]: el.name }));
          // El ítem nace sin cantidad ni estado: se completan en la opción (REG-06-122).
          cambiar((x) => (x[di]!.meals[j]!.options[k]!.items.push({ catalogItemId: el.catalogItemId, quantity: null, preparationState: null, note: null }), x));
        }}
        onCerrar={() => setAgregando(null)}
      />

      {/* Las recetas, en el mismo cajón que los alimentos: no hay un diálogo encima de otro. */}
      <Cajon abierto={eligiendoReceta !== null} titulo={COPY_RECETAS.agregarComoOpcion} sobretitulo={comidaDeLaReceta ? comidaDeLaReceta.label.trim() || `Comida ${(eligiendoReceta?.j ?? 0) + 1}` : null} onCerrar={() => setEligiendoReceta(null)}>
        <ElegirReceta
          onElegir={(receta) => {
            if (!eligiendoReceta) return;
            const { i: di, j } = eligiendoReceta;
            const nueva = estructura[di]?.meals[j]?.options.length ?? 0;
            setRecetas((x) => ({
              ...x,
              [receta.recipeVersionId]: { recipeId: receta.recipeId, recipeVersionId: receta.recipeVersionId, versionNumber: receta.versionNumber, name: receta.name, servings: receta.servings },
            }));
            cambiar((x) => (x[di]!.meals[j]!.options.push({ label: receta.name, items: [], recipeVersionId: receta.recipeVersionId }), x));
            setPestanas((p) => ({ ...p, [`${di}-${j}`]: nueva }));
            setEligiendoReceta(null);
          }}
        />
      </Cajon>

      <DialogoDeConfirmacion
        abierto={confirmar}
        titulo={COPY_NUTRICION.activarPlan}
        textoVolver={COPY_DE_ACTIVAR_EL_PLAN.volver}
        textoConfirmar={COPY_DE_ACTIVAR_EL_PLAN.activarEstaVersion}
        textoEnviando={COPY_DE_ACTIVAR_EL_PLAN.activando}
        enviando={activando}
        error={falloDeActivacion}
        focoEnVolver
        onVolver={() => {
          setConfirmar(false);
          setFalloDeActivacion(null);
          // La fecha es de este acto: si no se activa, vuelve a la que estaba guardada.
          setProximaRevision(version.nextReviewAt ?? '');
          intentoDeActivar.descartar();
        }}
        onConfirmar={() => void activar()}
      >
        <p>{COPY_NUTRICION.confirmarActivacion}</p>
        <div className="lo-que-cambia-al-activar" data-lo-que-cambia>
          {[COPY_DE_ACTIVAR_EL_PLAN.entra(loQueEntraAlActivar(estructura)), ...(vigente ? [COPY_DE_ACTIVAR_EL_PLAN.queda(vigente.numero, diaSinElAnioEnCurso(vigente.desde))] : [])].map((frase) => (
            <p key={frase.quien}>
              <strong>{frase.quien}</strong>
              {frase.que}
            </p>
          ))}
        </div>
        <Campo
          id="proxima-revision"
          etiqueta={`${COPY_DE_ACTIVAR_EL_PLAN.proximaRevision} (${COPY_DE_ACTIVAR_EL_PLAN.opcional})`}
          ayuda={COPY_DE_ACTIVAR_EL_PLAN.ayudaDeLaRevision}
          type="date"
          value={proximaRevision}
          onChange={(e) => setProximaRevision(e.target.value)}
        />
      </DialogoDeConfirmacion>
    </section>
  );
}

/** La lista de recetas propias, para sumar una como opción de una comida (DL-119). Va dentro de un cajón. */
function ElegirReceta({ onElegir }: { onElegir: (r: Receta) => void }) {
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
    <div className="recetas-para-elegir">
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
    </div>
  );
}
