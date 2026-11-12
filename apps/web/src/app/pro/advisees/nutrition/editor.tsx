'use client';

/**
 * La versión en preparación del plan de comidas (B05:404-624; CAND-NUT-B): la jerarquía Día tipo → Comida → Opción →
 * Ítem, nunca una tabla plana.
 * - El día tipo no es una fecha (B05:435-443). Las comidas son rótulos libres: se agregan, se renombran, se ordenan y se
 *   quitan, sin fijar cuatro (B05:447-467).
 * - Cada ítem lleva cantidad, unidad y estado de preparación; con cantidad, el estado es obligatorio (REG-06-122).
 * - «Guardar ahora» no activa (B05:607-624; ED-03). Validar informa cada problema en su lugar; activar pide confirmación
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
 * - **«Revisar y activar…» (ED-07, DJ-6) abre «Antes de activar» siempre:** lo que impide activar, lo que queda sin
 *   completar, lo que cambia frente a la vigente y lo que va a ver la persona, y ahí se fija la próxima revisión, que es
 *   parte de ese acto. Con cambios sin guardar, primero se guardan.
 * - **Cada cosa por corregir lleva a su lugar:** elige el día tipo, abre la comida y la opción.
 *
 * **ED-31, ED-33 y ED-34 (WP-EDITORES-PROFESIONAL, etapa 3 del website).**
 * - Al costado, un panel con dos pestañas: «Rangos y totales» (el rango del día tipo que se mira, «El día va de 1.850 a
 *   2.420 kcal según lo que elija», DJ-4, y una fila por comida, sin «%» y sin semáforo: `rangos.ts`) y «Antes de
 *   activar», en vivo, como ED-25 en Entrenamiento. Los totales son una estimación del editor hasta API-PLN-01 (§8.2):
 *   la composición de cada alimento sale del catálogo (la que trae el buscador al elegirlo, la de los habituales o, para
 *   lo que ya estaba en el plan, una lectura del buscador por su nombre que se queda solo con el mismo alimento).
 * - «+ Comida» nace con su opción 1 lista; las opciones de alimentos y de receta se agregan por separado.
 * - ED-32: «Opción de receta» ofrece «Receta nueva»: la receta se crea en un cuadro, sin salir del plan, con dos salidas
 *   («Guardar la receta y agregarla a Merienda» y «Guardar solo en Mis recetas»); si el agregado no se puede, el cuadro
 *   lo dice y lo reintenta con la misma versión (`receta-en-el-plan.ts`).
 * - Quitar un día tipo, una comida o una opción con contenido pregunta, con lo que se va (`quitar-con-contenido.ts`);
 *   «Cancelar» no toca nada. Sin contenido, se quita en el acto, como antes.
 */
import {
  COPY_DE_ACTIVAR_EL_PLAN,
  COPY_DESCARTAR_LA_VERSION,
  COPY_DE_VERSIONES,
  COPY_GUARDADO,
  COPY_DEL_PLAN,
  COPY_HABITUALES,
  COPY_PLANTILLAS,
  COPY_RECETAS,
  PROBLEMA_DEL_EDITOR,
  avisoDeLoQueNoDejaGuardar,
  comidasAbiertasEnElEditor,
  detalleDelFallo,
  estructuraNutricionalComoEntrada,
  falloDeGuardado,
  loQueNoDejaGuardar,
  lugarDelProblema,
  motivoSinGuardarAhora,
  nutrienteParaMostrar,
  pedidoDeComidasDelEditor,
  pedidoDeLaPosicion,
  posicionPedida,
  problemasDeLaComida,
  ubicacionDelProblema,
  type DetalleDelFallo,
  type Receta,
  type RecetaDeOpcion,
  type ValidationIssue,
  type VersionDeObjetivo,
  type VersionDePlan,
} from '@be/domain';
import { Enlace } from '../../../../components/enlace';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { AvisoFlotante } from '../../../../components/ayuda';
import { Cajon } from '../../../../components/cajon';
import { CampoDeNombre } from '../../../../components/campo-de-nombre';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { MenuDeAcciones } from '../../../../components/menu-de-acciones';
import { api } from '../../../../lib/api';
import { EstadoDeGuardado } from '../../../../components/estado-de-guardado';
import { useAutoguardado } from '../../../../lib/autoguardado';
import { diaEnUnaFrase, horaDelDia } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { eleccionAlActivar, fechaQueResulta, loQueFalta, NADA_ELEGIDO, type EleccionDeLaProxima } from '../../../../lib/cuando-la-revisas';
import { CuandoLaRevisas } from '../cuando-la-revisas';
import { COPY_ANTES_DE_ACTIVAR } from '../antes-de-activar';
import { compararNutricion } from '../comparar-versiones';
import { AntesDeActivar } from '../cuadro-antes-de-activar';
import { CuadroDelDescarte } from '../cuadro-del-descarte';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { COPY_ESTACION as CE } from '../estacion/estacion';
import { alimentosSinComposicion, COPY_RANGOS, itemsParaElTotal, nombreDeLaComida, nombreDelDiaTipo, NUTRIENTES_DEL_RANGO, queFaltaEnPalabras, rangoDelDiaEnPalabras, rangoEnUnaCelda, rangosDelDia, type ComposicionConocida } from './rangos';
import { alQuitarElDia, alQuitarLaComida, alQuitarLaOpcion, COPY_QUITAR } from './quitar-con-contenido';
import { agregarLaReceta, COPY_RECETA_NUEVA, OPCION_INICIAL, opcionesConLaReceta, type LugarDeLaReceta } from './receta-en-el-plan';
import { EditorDeReceta } from '../../recipes/editor-de-receta';
import { ofreceDescartar, resultadoDelDescarte, textoDelDescarteQueNoSeHizo } from '../descartar-el-borrador';
import { conLosIdentificadoresNuevos, cualMande, huellaDelGuardado, type CuerpoDelGuardado } from '../es-lo-que-mande';
import { COPY_RESULTADO_DE_ACTIVAR, hayQueReleer, loQuePasoAlActivar, type VersionReleida } from '../resultado-de-activar';
import { useCambiosSinGuardar, usePersonaDelArea } from '../marco-del-area';
import { AVISO_DE_LOS_TOPES, esUnTope, TEXTO_DE_LOS_TOPES, topesPasadosDeNutricion } from '../topes-del-plan';
import { loQueQuedaSinCompletarEnNutricion, TEXTO_DE_LO_INCOMPLETO } from '../revisar-el-plan';
import { COPY_DE_LOS_EDITORES as E, copiaDeLaComida, copiaDeLaOpcion, copiaDelDiaTipo, duplicarEn, mover, posicionesTrasInsertar, posicionesTrasMover, posicionesTrasQuitar } from '../editar-la-estructura';
import { hoyEn } from '../seguimiento/estado';
import { TiraDelObjetivo } from '../seguimiento/tira-del-objetivo';
import { CuadroDeLaOpcion } from './cuadro-de-la-opcion';
import { opcionAlGuardar, subtituloDelCuadro, tituloDelCuadro } from './opcion-en-un-cuadro';
import { CuadroCopiarDesdeOtraComida, CuadroUsarComidaHabitual } from './copiar-desde-otra-comida';
import { COPY_DE_OTRA_COMIDA, copiaDesdeOtraComida, MAXIMO_DE_OPCIONES, opcionesDeLaHabitual, origenesDeLaCopia } from './opcion-de-otra-comida';
import { ComidaDelEditor, type ComidaEnEdicion, type Estructura } from './comida-del-editor';
import { DialogoGuardarComidaHabitual, InsertarComidaHabitual, useAlimentosHabituales, useComidasHabituales } from './habituales';
import { NoDisponible, useNutricion } from './nutricion';
import { COPY_ELEGIR_RECETA, PAGINAS_DE_RECETAS, RECETAS_POR_PAGINA, recetasQueCoinciden } from './recetas-para-elegir';
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

/** ED-61: lo que quedó guardado en una versión, en la forma en que se compara con lo que mandó esta pantalla. */
const cuerpoGuardado = (v: VersionDePlan): CuerpoDelGuardado => ({ estructura: aEntrada(v), proximaRevision: v.nextReviewAt, objetivo: v.objectiveVersionId });

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
  SNAPSHOT_NOT_PRESERVABLE: 'no se pudo preservar la versión para la persona',
  // Lo que el editor ve solo, antes de guardar.
  [PROBLEMA_DEL_EDITOR.faltaElNombre]: 'falta el nombre',
  [PROBLEMA_DEL_EDITOR.cantidadIlegible]: 'la cantidad no se entiende',
  // TB-48: los topes del contrato, avisados antes de guardar.
  ...TEXTO_DE_LOS_TOPES,
};

/** Lo que no deja guardar: lo que el editor ve solo y, desde TB-48, los topes del contrato que se pasan. */
const loQueNoDejaGuardarElPlan = (e: Estructura) => [...loQueNoDejaGuardar(e), ...topesPasadosDeNutricion(e)];

const esDelEditor = (codigo: string): boolean => codigo === PROBLEMA_DEL_EDITOR.faltaElNombre || codigo === PROBLEMA_DEL_EDITOR.cantidadIlegible;

/** Qué nombre se está cambiando: el de un día tipo, el de una comida o el de una opción, por sus posiciones. */
type NombreQueSeCambia = { readonly de: 'dia'; readonly i: number } | { readonly de: 'comida'; readonly i: number; readonly j: number } | { readonly de: 'opcion'; readonly i: number; readonly j: number; readonly k: number } | null;

export function EditorDeBorrador({
  planId,
  numero,
  objetivo,
  vigente = null,
  onActivado,
  onDescartado,
}: {
  planId: string;
  /** El número de esta versión en preparación: el de las activadas más uno (DJ-6). */
  numero: number;
  /**
   * El objetivo vigente, que ya leyó la sección: lo que la versión usa, o va a usar al guardar si hay uno más nuevo.
   * El editor no lo vuelve a pedir: sin esa lectura, la sección no llega a mostrarlo.
   */
  objetivo: VersionDeObjetivo | null;
  /**
   * La versión que rige hoy, que al activar esta queda en el historial; `null` si es la primera. Con su plan, «Antes de
   * activar» dice lo que cambia (ED-07).
   */
  vigente?: { readonly numero: number; readonly desde: string; readonly plan?: VersionDePlan | null } | null;
  /** Se activó. `texto`: lo que se dice si ya estaba activa (ED-62: un pedido anterior la había activado). */
  /** Activada (o ya activa): el texto del resultado, con el número y el nombre (ED-07). */
  onActivado: (texto: string) => void;
  /**
   * ED-01: la versión en preparación se descartó (o ya no estaba): la sección vuelve a leer el plan. `porOtraPestana`:
   * lo que se dice si la descartó otra pestaña (ED-62).
   */
  onDescartado: (porOtraPestana?: string) => void;
}) {
  const { token, sesionPerdida, accesoRetirado, parametros, ir } = useNutricion();
  // DL-169: el nombre de la persona, o la referencia neutral, para decir quién no ve la versión y quién la va a ver.
  const persona = usePersonaDelArea();
  const propio = useId();
  const [version, setVersion] = useState<VersionDePlan | null>(null);
  const [error, setError] = useState<'no-disponible' | 'error' | null>(null);
  const [estructura, setEstructura] = useState<Estructura>([]);
  // ED-32: la receta nueva vuelve después de un `await`; con esto lee la estructura de ahora y no la del clic.
  const estructuraDeAhora = useRef(estructura);
  estructuraDeAhora.current = estructura;
  const [proximaRevision, setProximaRevision] = useState('');
  // TB-15: «¿Cuándo la revisás?» al activar, con nada elegido (o la fecha que ya tenía la versión); la fecha que resulta
  // es la que se guarda en la versión antes de activarla.
  const [cuando, setCuando] = useState<EleccionDeLaProxima>(NADA_ELEGIDO);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  // DL-119: la receta de cada opción de receta, por la versión que cita.
  const [recetas, setRecetas] = useState<Record<string, RecetaDeOpcion>>({});
  const [eligiendoReceta, setEligiendoReceta] = useState<{ readonly i: number; readonly j: number } | null>(null);
  const [sucio, setSucio] = useState(false);
  const [guardando, setGuardando] = useState(false);
  // Bloque 3 del encargo de consolidación (2026-10-19): el estado de escritura inequívoco, el conflicto con otra pestaña y
  // el autoguardado. «Guardado» solo con la respuesta del servidor; un 409 por versión no pisa nada.
  const [fallo, setFallo] = useState(false);
  // ED-03: el detalle técnico del último fallo (se ve plegado mientras dura el fallo).
  const [detalle, setDetalle] = useState<DetalleDelFallo | null>(null);
  const [conflicto, setConflicto] = useState(false);
  const [guardadoA, setGuardadoA] = useState<string | null>(null);
  // Cuántas ediciones hubo: lo que se escribe mientras viaja un guardado no se pisa con la respuesta.
  const ediciones = useRef(0);
  // ED-61: lo que esta pantalla mandó y no tuvo respuesta; ante un 409, se compara con lo guardado.
  const sinRespuesta = useRef<CuerpoDelGuardado[]>([]);
  // `sinFoco`: un aviso del autoguardado (DL-168) se anuncia sin sacarle el foco a lo que se está editando.
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'exito' | 'info'; texto: string; deRevisar?: boolean; sinFoco?: boolean } | null>(null);
  const [problemas, setProblemas] = useState<readonly ValidationIssue[] | null>(null);
  // ED-07: la revisión de la API de lo guardado, para «Antes de activar» (`null`: todavía no se pidió).
  const [revision, setRevision] = useState<{ readonly estado: 'revisando' | 'lista' | 'fallo'; readonly problemas: readonly ValidationIssue[] } | null>(null);
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
  // ED-31: «Agregar ítem» abre la opción en un cuadro, con el buscador adentro (maqueta 06); la opción que se edita.
  const [agregando, setAgregando] = useState<{ readonly i: number; readonly j: number; readonly k: number } | null>(null);
  const [activando, setActivando] = useState(false);
  const [falloDeActivacion, setFalloDeActivacion] = useState<string | null>(null);
  const intentoDeActivar = useClaveDeIntento();
  // ED-01: «Descartar la versión en preparación», con su cuadro y su intento (la misma clave en un reintento).
  const [descartar, setDescartar] = useState(false);
  const [descartando, setDescartando] = useState(false);
  const [falloDelDescarte, setFalloDelDescarte] = useState<string | null>(null);
  const intentoDeDescartar = useClaveDeIntento();
  // La opción que se edita en cada comida (por «día-comida»); el nombre que se está cambiando; y el campo que hay que
  // enfocar después de ir a un problema.
  const [pestanas, setPestanas] = useState<Readonly<Record<string, number>>>({});
  const [nombreQueSeCambia, setNombreQueSeCambia] = useState<NombreQueSeCambia>(null);
  const [paraEnfocar, setParaEnfocar] = useState<string | null>(null);
  // ED-31 y ED-34: la composición de cada alimento, por su identidad, para estimar los totales en el editor.
  const [composiciones, setComposiciones] = useState<ReadonlyMap<string, ComposicionConocida>>(() => new Map());
  // ED-33: lo que se quita con contenido espera la confirmación, con lo que se va.
  const [porQuitar, setPorQuitar] = useState<{ readonly texto: string; readonly hacer: () => void } | null>(null);
  // ED-33: el cuadro del «⋯» de la comida que está abierto («Copiar desde otra comida» o «Usar una comida habitual»).
  const [otraComida, setOtraComida] = useState<{ readonly que: 'copiar' | 'habitual'; readonly i: number; readonly j: number } | null>(null);
  // ED-34: la pestaña del panel.
  const [pestanaDelPanel, setPestanaDelPanel] = useState<'antes' | 'rangos'>('rangos');
  // ED-32: la receta nueva que se crea desde una comida (en un cuadro), si tiene algo escrito, y lo que quedó por
  // recuperar si se guardó pero no se pudo agregar.
  const [recetaNueva, setRecetaNueva] = useState<LugarDeLaReceta | null>(null);
  const [recetaSucia, setRecetaSucia] = useState(false);
  const [recuperar, setRecuperar] = useState<{ readonly receta: Receta; readonly motivo: 'YA_NO_ESTA' | 'TOPE' } | null>(null);

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
    sinRespuesta.current = [];
  }, [token, planId, sesionPerdida]);

  useEffect(() => {
    ediciones.current += 1;
  }, [estructura, proximaRevision]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // ED-34: los habituales ya traen su composición.
  useEffect(() => {
    if (alimentosHabituales.habituales.length === 0) return;
    setComposiciones((m) => {
      const n = new Map(m);
      for (const h of alimentosHabituales.habituales) if (typeof n.get(h.catalogItemId) !== 'object') n.set(h.catalogItemId, h.composition);
      return n;
    });
  }, [alimentosHabituales.habituales]);

  // ED-34: lo que ya estaba en el día tipo que se mira y todavía no tiene composición conocida se lee del buscador, por su
  // nombre, y se toma solo si vuelve el mismo alimento (por su identidad). De a tres lecturas a la vez, una vez cada uno.
  const diaMirado = estructura[posicionPedida(estructura.length, parametros.get('dia'))];
  const porLeer = useMemo(
    () =>
      diaMirado && version
        ? alimentosSinComposicion(
            diaMirado.meals.flatMap((m) => m.options.flatMap((o) => itemsParaElTotal(o, nombres, (id) => itemsGuardados(version, id)) ?? [])),
            composiciones,
          )
        : [],
    [diaMirado, version, nombres, composiciones],
  );
  useEffect(() => {
    if (porLeer.length === 0) return;
    setComposiciones((m) => {
      const n = new Map(m);
      for (const a of porLeer) n.set(a.catalogItemId, 'leyendo');
      return n;
    });
    const cola = [...porLeer];
    const leer = async () => {
      for (let a = cola.shift(); a; a = cola.shift()) {
        const { catalogItemId, nombre } = a;
        const r = await api.buscarEnCatalogo(token, nombre.slice(0, 80));
        if (sesionPerdida(r)) return;
        const encontrado = r.ok ? r.datos.data.find((e) => e.catalogItemId === catalogItemId) : undefined;
        setComposiciones((m) => new Map(m).set(catalogItemId, encontrado ? encontrado.composition : 'sin-composicion'));
      }
    };
    void Promise.all([leer(), leer(), leer()]);
  }, [porLeer, token, sesionPerdida]);

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

  /**
   * Guarda (PATCH) y devuelve la versión nueva, o `null` si falló. `reenvio` (ED-61): lo escrito después de un guardado
   * cuya respuesta se perdió, que se manda otra vez sobre la versión que ese guardado dejó, con las ediciones contadas
   * desde el primer envío.
   */
  async function guardar(automatico = false, reenvio: { readonly base: VersionDePlan; readonly estructura: Estructura; readonly ediciones: number } | null = null): Promise<VersionDePlan | null> {
    const base = reenvio?.base ?? version;
    if (!base) return null;
    const estructuraEnviada = reenvio?.estructura ?? estructura;
    // Un nombre vacío o una cantidad que no se entiende pueden estar en otro día tipo, en una comida plegada o en otra
    // pestaña: se listan, y cada uno lleva a su lugar.
    const impide = loQueNoDejaGuardarElPlan(estructuraEnviada);
    if (impide.length > 0) {
      // El autoguardado espera a que se pueda guardar: no abre avisos mientras se escribe.
      if (automatico) return null;
      setProblemas(impide);
      setMensaje({ tipo: 'error', texto: impide.some((p) => esUnTope(p.code)) ? AVISO_DE_LOS_TOPES : avisoDeLoQueNoDejaGuardar(impide) });
      return null;
    }
    const edicionesAlEnviar = reenvio?.ediciones ?? ediciones.current;
    setGuardando(true);
    if (!automatico) setMensaje(null);
    const actualizarObjetivo = objetivoVigente && objetivoVigente !== base.objectiveVersionId ? { objectiveVersionId: objetivoVigente } : {};
    // ED-61: lo que se manda, por si la respuesta se pierde y el guardado siguiente da 409.
    const cuerpo: CuerpoDelGuardado = { estructura: estructuraEnviada, proximaRevision: proximaRevision || null, objetivo: actualizarObjetivo.objectiveVersionId ?? base.objectiveVersionId };
    const r = await api.guardarBorrador(token, planId, {
      expectedVersion: base.version,
      changes: { dayTypes: estructuraEnviada },
      nextReviewAt: proximaRevision || null,
      ...actualizarObjetivo,
    });
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(r) || accesoRetirado(r)) {
      setGuardando(false);
      return null;
    }
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') {
        // ED-61: si un guardado de esta pantalla se quedó sin respuesta, lo guardado puede ser lo que mandó. Se relee y
        // se compara con cada cuerpo sin respuesta, sin los identificadores que puso el servidor.
        const mandados = sinRespuesta.current;
        const actual = mandados.length > 0 && !reenvio ? await api.consultarPlan(token, planId) : null;
        if (actual && (sesionPerdida(actual) || accesoRetirado(actual))) {
          setGuardando(false);
          return null;
        }
        // Si la relectura tampoco respondió (sin red o un 5xx), no se sabe qué quedó guardado: no es un conflicto. Queda
        // como un guardado sin respuesta. Lo mandado sigue en la lista, y el intento siguiente vuelve a dar 409 y a releer.
        if (actual && !actual.ok) {
          setGuardando(false);
          setFallo(true);
          setDetalle({ ...detalleDelFallo(actual, horaDelDia(new Date())), motivo: 'SIN_RESPUESTA' });
          autoguardado.informar('SIN_RESPUESTA');
          return null;
        }
        const cual = actual?.ok ? cualMande(cuerpoGuardado(actual.datos.data), mandados) : -1;
        if (actual?.ok && cual >= 0) {
          // Lo guardado es de esta pantalla: no hay conflicto. Se adopta la versión que quedó (su token y sus
          // identificadores) y, si se escribió algo después, se manda sobre ella.
          sinRespuesta.current = [];
          const guardada = actual.datos.data;
          const mandado = mandados[cual]!;
          setVersion(guardada);
          setFallo(false);
          setNombres((n) => ({ ...n, ...nombresDe(guardada) }));
          setRecetas((x) => ({ ...x, ...recetasDe(guardada) }));
          if (huellaDelGuardado(cuerpo) !== huellaDelGuardado(mandado)) {
            return guardar(automatico, { base: guardada, estructura: conLosIdentificadoresNuevos(estructuraEnviada, mandado.estructura, aEntrada(guardada)), ediciones: edicionesAlEnviar });
          }
          setGuardando(false);
          setGuardadoA(horaDelDia(new Date()));
          autoguardado.informar('GUARDADO');
          if (ediciones.current === edicionesAlEnviar) {
            setEstructura(aEntrada(guardada));
            setSucio(false);
          }
          return guardada;
        }
        setGuardando(false);
        setConflicto(true);
        autoguardado.informar('OTRO');
        return null;
      }
      setGuardando(false);
      // Lo escrito queda como está: ni la estructura ni «sucio» cambian, y el próximo guardado lo vuelve a mandar.
      setFallo(true);
      setDetalle(detalleDelFallo(r, horaDelDia(new Date())));
      const motivo = falloDeGuardado(r);
      // ED-61: sin respuesta, el guardado pudo haber llegado. Se recuerda lo que se mandó, para reconocerlo ante un 409.
      if (motivo === 'SIN_RESPUESTA') sinRespuesta.current = [...sinRespuesta.current, cuerpo];
      // ED-60: un rechazo que no se arregla solo no se reintenta sin un cambio; sin respuesta, la espera crece.
      autoguardado.informar(motivo, ediciones.current !== edicionesAlEnviar);
      // DL-168: si el plan no entra, reintentar no lo arregla: se dice también en el autoguardado, sin mover el foco.
      if (motivo === 'DEMASIADO_GRANDE') {
        setProblemas(null);
        setMensaje({ tipo: 'error', texto: COPY_GUARDADO.demasiadoGrande, sinFoco: automatico });
        return null;
      }
      // Sin respuesta, lo dice la barra, con «Reintentar» al lado (ED-03): también en el autoguardado, y sin un segundo
      // aviso igual que se lleve el foco.
      if (automatico || motivo === 'SIN_RESPUESTA') return null;
      if (r.tipo === 'API' && r.issues.length > 0) setProblemas(r.issues);
      setMensaje({ tipo: 'error', texto: r.tipo === 'API' && r.issues.length > 0 ? 'Hay elementos del plan que no se pueden guardar.' : mensajeDeFallo(r) });
      return null;
    }
    setGuardando(false);
    // ED-61: con una respuesta, lo que se mandó antes sin respuesta ya no es candidato (el token avanzó).
    sinRespuesta.current = [];
    setVersion(r.datos.data);
    setFallo(false);
    setConflicto(false);
    setGuardadoA(horaDelDia(new Date()));
    autoguardado.informar('GUARDADO');
    // Lo escrito mientras viajaba el guardado se conserva: sigue pendiente y viaja en el próximo, con la versión nueva.
    const sinCambiosDespues = ediciones.current === edicionesAlEnviar;
    if (sinCambiosDespues) setEstructura(aEntrada(r.datos.data));
    setNombres((n) => ({ ...n, ...nombresDe(r.datos.data) }));
    setRecetas((x) => ({ ...x, ...recetasDe(r.datos.data) }));
    if (sinCambiosDespues) setSucio(false);
    return r.datos.data;
  }

  // El autoguardado: la preparación se guarda sola en la primera pausa, si se puede y si no hay un acto abierto.
  const puedeGuardar = loQueNoDejaGuardarElPlan(estructura).length === 0;
  // ED-03: por qué «Guardar ahora» está apagado, o `null`.
  const sinGuardarAhora = motivoSinGuardarAhora({ guardando, sucio, conflicto });
  const cambiosParaGuardar = useMemo(() => [estructura, proximaRevision], [estructura, proximaRevision]);
  const autoguardado = useAutoguardado({
    habilitado: !!version && sucio && puedeGuardar && !guardando && !conflicto && !confirmar && !activando && !descartar,
    cambios: cambiosParaGuardar,
    guardar: () => void guardar(true),
  });
  // ED-02: un enlace interno con cambios guarda antes de salir (si se puede: nada a medio escribir ni un conflicto) o
  // pregunta; recargar o cerrar la pestaña, también pregunta.
  useCambiosSinGuardar(sucio, 'el plan en preparación', { sePuede: puedeGuardar && !conflicto, ocupado: guardando, guardar: async () => (await guardar()) !== null });

  /**
   * ED-07: la revisión de la API de la versión guardada (API-NUT-11). Lo que dice entra en «Lo que impide activar»; la
   * validación final sigue siendo la de la API al activar. Revisar mira la forma, no la calidad.
   */
  async function revisar(v: VersionDePlan) {
    setRevision({ estado: 'revisando', problemas: [] });
    const r = await api.validarPlan(token, planId, v.version);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    setRevision(r.ok ? { estado: 'lista', problemas: r.datos.data.issues } : { estado: 'fallo', problemas: [] });
  }

  /** ED-07 (DJ-6): «Revisar y activar…» abre el cuadro siempre, también con algo por corregir o sin guardar. */
  function abrirAntesDeActivar() {
    if (!version) return;
    setFalloDeActivacion(null);
    setCuando(eleccionAlActivar(version.nextReviewAt));
    setProximaRevision(version.nextReviewAt ?? '');
    setRevision(null);
    setConfirmar(true);
  }

  /** ED-07: cerrar el cuadro sin activar. La fecha es de este acto: vuelve a la que estaba guardada. */
  function cerrarAntesDeActivar() {
    setConfirmar(false);
    setFalloDeActivacion(null);
    setProximaRevision(version?.nextReviewAt ?? '');
    setCuando(NADA_ELEGIDO);
    setRevision(null);
    // ED-62: con el resultado incierto, la clave se conserva: el intento siguiente (el mismo pedido) la reusa.
    if (!intentoDeActivar.quedoIncierto()) intentoDeActivar.descartar();
  }

  // ED-07: con el cuadro abierto y todo guardado, la API revisa lo guardado (al abrirlo, o apenas llega la respuesta de
  // un guardado). Con cambios sin guardar, el cuadro ofrece primero «Guardar ahora».
  useEffect(() => {
    if (confirmar && version && !sucio && !guardando && revision === null) void revisar(version);
    // `revisar` es de este render y lee lo mismo que estas dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmar, version, sucio, guardando, revision]);

  async function activar() {
    if (!version || fechaQueResulta(cuando, hoyEn()) === undefined) return;
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
    // ED-62: la clave es la de este pedido (la versión que se activa); un resultado incierto la conserva.
    const r = await api.activarPlan(token, planId, v.version, intentoDeActivar.actual(`${planId}:${v.version}`));
    intentoDeActivar.registrar(r);
    if (sesionPerdida(r) || accesoRetirado(r)) return setActivando(false);
    // ED-62: con un 409, un 422 sin lugar o sin respuesta, se relee la versión antes de decir qué pasó.
    let releida: VersionReleida | null = null;
    if (hayQueReleer(r)) {
      const actual = await api.consultarPlan(token, planId);
      if (sesionPerdida(actual)) return setActivando(false);
      releida = actual.ok ? { estado: actual.datos.data.state, version: actual.datos.data.version } : actual.tipo === 'API' && actual.codigo === 'RESOURCE_NOT_FOUND' ? { estado: 'NO_ESTA' } : null;
    }
    setActivando(false);
    const que = loQuePasoAlActivar(r, releida, v.version);
    switch (que.tipo) {
      case 'ACTIVADA':
      case 'YA_QUEDO_ACTIVA':
        setConfirmar(false);
        return onActivado(que.tipo === 'YA_QUEDO_ACTIVA' ? COPY_RESULTADO_DE_ACTIVAR.yaQuedoActiva(numero, persona) : COPY_RESULTADO_DE_ACTIVAR.activada(numero, persona));
      case 'YA_NO_ESTA':
        // Se descartó en otra pestaña: no hay nada que activar ni que guardar; la sección vuelve a leer el plan.
        setConfirmar(false);
        setSucio(false);
        return onDescartado(COPY_RESULTADO_DE_ACTIVAR.yaNoEsta);
      case 'IMPIDE':
        // Lo que impide activar, con su lugar, en el mismo cuadro.
        setRevision({ estado: 'lista', problemas: que.problemas });
        return setFalloDeActivacion(COPY_RESULTADO_DE_ACTIVAR.impide);
      case 'CAMBIO_EN_OTRA_PESTANA':
        // Al volver al plan, el aviso del conflicto ofrece «Cargar la versión guardada».
        setConflicto(true);
        return setFalloDeActivacion(COPY_RESULTADO_DE_ACTIVAR.cambioEnOtraPestana);
      case 'OTRO_PLAN_VIGENTE':
        return setFalloDeActivacion(COPY_RESULTADO_DE_ACTIVAR.otroPlanVigente('nutrición'));
      case 'SIN_CAPACIDAD':
        return setFalloDeActivacion(COPY_RESULTADO_DE_ACTIVAR.sinCapacidad);
      case 'INCIERTO':
        return setFalloDeActivacion(COPY_RESULTADO_DE_ACTIVAR.incierto);
      default:
        return setFalloDeActivacion(COPY_RESULTADO_DE_ACTIVAR.otro);
    }
  }

  /**
   * ED-01: descarta la versión en preparación con la versión que muestra la pantalla. Descartada, o si ya no estaba (se
   * descartó o se activó en otra pestaña), la sección vuelve a leer el plan; si no, el cuadro dice por qué.
   */
  async function descartarLaVersion() {
    if (!version || descartando) return;
    setDescartando(true);
    setFalloDelDescarte(null);
    const r = await api.descartarBorradorDePlanNutricional(token, planId, version.version, intentoDeDescartar.actual());
    intentoDeDescartar.registrar(r);
    setDescartando(false);
    if (sesionPerdida(r)) return;
    const queNoSeHizo = textoDelDescarteQueNoSeHizo(resultadoDelDescarte(r));
    if (queNoSeHizo) return setFalloDelDescarte(queNoSeHizo);
    // Lo que no se guardó se fue con la versión: salir ya no pregunta.
    setSucio(false);
    setDescartar(false);
    onDescartado();
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
  /** ED-33: con contenido, primero se confirma, con lo que se va; sin contenido, se hace en el acto. */
  const pedirQuitar = (texto: string | null, hacer: () => void) => (texto ? setPorQuitar({ texto, hacer }) : hacer());
  /** ED-32: cierra el cuadro de la receta nueva (y lo que quedaba por recuperar). */
  const cerrarLaRecetaNueva = () => {
    setRecetaNueva(null);
    setRecuperar(null);
    setRecetaSucia(false);
  };
  /**
   * ED-32: la receta ya está en Mis recetas; se suma como opción de su comida y se la deja elegida, en el mismo día. Si no
   * se puede, el cuadro lo dice y ofrece reintentarlo con la misma versión, sin crear otra receta.
   */
  const agregarLaRecetaNueva = (r: Receta) => {
    if (!recetaNueva) return;
    const lugar = recetaNueva;
    const res = agregarLaReceta(estructuraDeAhora.current, lugar, r);
    if (res.tipo === 'no-se-pudo') return setRecuperar({ receta: r, motivo: res.motivo });
    // Se aplica sobre la estructura vigente: si mientras tanto llegó un guardado, sus identificadores no se pierden.
    if (res.tipo === 'agregada') {
      cambiar((e) => {
        const x = agregarLaReceta(e, lugar, r);
        return x.tipo === 'agregada' ? x.estructura : e;
      });
    }
    ir({ dia: pedidoDeLaPosicion(res.i), comidas: pedidoDeComidasDelEditor(new Set([...(res.i === i ? abiertas : []), res.j])) });
    setPestanas((p) => ({ ...p, [`${res.i}-${res.j}`]: res.k }));
    cerrarLaRecetaNueva();
    setMensaje({ tipo: 'exito', texto: COPY_RECETA_NUEVA.agregada(r.name, res.k, recetaNueva.nombre) });
  };
  const alGuardarLaRecetaNueva = (r: Receta, agregar: boolean) => {
    setRecetas((x) => ({ ...x, [r.recipeVersionId]: { recipeId: r.recipeId, recipeVersionId: r.recipeVersionId, versionNumber: r.versionNumber, name: r.name, servings: r.servings } }));
    if (agregar) return agregarLaRecetaNueva(r);
    cerrarLaRecetaNueva();
    setMensaje({ tipo: 'exito', texto: COPY_RECETA_NUEVA.soloGuardada(r.name) });
  };
  /** ED-33: suma opciones a la comida `j` del día que se mira, elige la primera nueva y lo dice. */
  const sumarOpciones = (di: number, j: number, opciones: ComidaEnEdicion['options'], texto: string) => {
    const k = estructura[di]?.meals[j]?.options.length ?? 0;
    cambiar((x) => (x[di]!.meals[j]!.options.push(...opciones), x));
    setPestanas((p) => ({ ...p, [`${di}-${j}`]: k }));
    setOtraComida(null);
    setMensaje({ tipo: 'exito', texto });
  };
  const agregarComida = () => {
    const j = dia?.meals.length ?? 0;
    // ED-33: la comida nace con su opción 1 lista, para empezar a sumarle alimentos.
    cambiar((x) => (x[i]!.meals.push({ label: '', prescriptionMode: 'DISH_OPTIONS', options: [{ label: OPCION_INICIAL, items: [] }] }), x));
    dejarAbiertas(new Set([...abiertas, j]));
    // Una comida sin nombre no se puede guardar: nace con el campo abierto.
    setNombreQueSeCambia({ de: 'comida', i, j });
  };
  /** TB-48: mueve el día tipo que se mira, y se lo sigue mirando en su lugar nuevo, con sus comidas abiertas. */
  const moverDia = (hacia: number) => {
    cambiar((x) => mover(x, i, hacia));
    setPestanas({});
    setParaEnfocar(null);
    ir({ dia: pedidoDeLaPosicion(hacia) });
  };
  /** TB-48: la copia del día tipo va justo después, y se la mira con su nombre a la vista para cambiarlo. */
  const duplicarDia = () => {
    cambiar((x) => duplicarEn(x, i, copiaDelDiaTipo(x[i]!, i)));
    setPestanas({});
    elegirDia(i + 1);
    setNombreQueSeCambia({ de: 'dia', i: i + 1 });
  };
  /** Sube o baja una comida (TB-48 suma «Bajar»): lo abierto y la opción elegida acompañan a su comida. */
  const moverComida = (j: number, hacia: number) => {
    cambiar((x) => (mover(x[i]!.meals, j, hacia), x));
    dejarAbiertas(posicionesTrasMover(abiertas, j, hacia));
    setPestanas((p) => ({ ...p, [`${i}-${hacia}`]: p[`${i}-${j}`] ?? 0, [`${i}-${j}`]: p[`${i}-${hacia}`] ?? 0 }));
  };
  /** TB-48: la copia de la comida va justo después, abierta y con su nombre a la vista para cambiarlo. */
  const duplicarComida = (j: number) => {
    cambiar((x) => (duplicarEn(x[i]!.meals, j, copiaDeLaComida(x[i]!.meals[j]!, j)), x));
    dejarAbiertas(new Set([...posicionesTrasInsertar(abiertas, j + 1), j + 1]));
    setPestanas((p) => Object.fromEntries(Object.entries(p).map(([clave, k]) => {
      const [d, m] = clave.split('-').map(Number);
      return [d === i && m! > j ? `${d}-${m! + 1}` : clave, k];
    })));
    setNombreQueSeCambia({ de: 'comida', i, j: j + 1 });
  };
  const quitarComida = (j: number) => {
    cambiar((x) => (x[i]!.meals.splice(j, 1), x));
    dejarAbiertas(posicionesTrasQuitar(abiertas, j));
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

  // ED-31: la opción del cuadro, su comida y su día tipo.
  const comidaDondeSeAgrega = agregando ? estructura[agregando.i]?.meals[agregando.j] : undefined;
  const opcionDondeSeAgrega = agregando ? comidaDondeSeAgrega?.options[agregando.k] : undefined;
  const comidaDeLaReceta = eligiendoReceta ? estructura[eligiendoReceta.i]?.meals[eligiendoReceta.j] : undefined;
  // ── ED-07: lo que dice «Antes de activar» ─────────────────────────────────────────────────────────────────────
  /** Cerrar el cuadro y llevar a una cosa por corregir: a su lugar, con el foco ahí. */
  const irDesdeElCuadro = (p: ValidationIssue) => () => {
    cerrarAntesDeActivar();
    irAlProblema(p);
  };
  const conSuLugar = (p: ValidationIssue, texto: string) => ({ texto: `${ubicacionDelProblema(p.path, estructura)}: ${texto}`, ir: lugarDelProblema(p.path).dia === null ? null : irDesdeElCuadro(p) });
  // Lo que impide activar: lo que el editor ve solo (al instante) y lo que dijo la API de lo guardado.
  const impidenActivar = [
    ...loQueNoDejaGuardarElPlan(estructura).map((p) => conSuLugar(p, PROBLEMA[p.code] ?? 'revisá este elemento')),
    ...(revision?.estado === 'lista' ? revision.problemas.map((p) => conSuLugar(p, PROBLEMA[p.code] ?? 'revisá este elemento')) : []),
  ];
  // TB-48: lo que queda sin completar no impide nada; se dice aparte, cada cosa con su lugar.
  const sinCompletarAlActivar = confirmar ? loQueQuedaSinCompletarEnNutricion(estructura).map((p) => conSuLugar(p, TEXTO_DE_LO_INCOMPLETO[p.code] ?? 'revisá este elemento')) : [];
  // Lo que va a ver la persona: cada día tipo, con sus comidas.
  const loQueVeLaPersona = confirmar ? estructura.map((d, n) => `${d.label.trim() || `Día tipo ${n + 1}`}: ${d.meals.length === 1 ? '1 comida incluida' : `${d.meals.length} comidas incluidas`}`) : [];

  // ── ED-25 en Nutrición: «Antes de activar», en vivo en el panel; «Ir a corregir» va directo ──────────────────────
  const enElPanel = (p: ValidationIssue, texto: string) => ({ texto: `${ubicacionDelProblema(p.path, estructura)}: ${texto}`, ir: lugarDelProblema(p.path).dia === null ? null : () => irAlProblema(p) });
  const impidenEnVivo = [
    ...loQueNoDejaGuardarElPlan(estructura).map((p) => enElPanel(p, PROBLEMA[p.code] ?? 'revisá este elemento')),
    ...(revision?.estado === 'lista' && !sucio ? revision.problemas.map((p) => enElPanel(p, PROBLEMA[p.code] ?? 'revisá este elemento')) : []),
  ];
  const sinCompletarEnVivo = loQueQuedaSinCompletarEnNutricion(estructura).map((p) => enElPanel(p, TEXTO_DE_LO_INCOMPLETO[p.code] ?? 'revisá este elemento'));
  // ── ED-31 y ED-34: los totales de cada opción y los rangos del día tipo que se mira ─────────────────────────
  const rangos = dia ? rangosDelDia(dia, i, composiciones, nombres, (id) => itemsGuardados(version, id), (rv) => recetas[rv]?.name ?? null) : null;
  const leyendoComposiciones = [...composiciones.values()].filter((c) => c === 'leyendo').length;
  const huecosDelDia = rangos
    ? [
        ...new Set(
          NUTRIENTES_DEL_RANGO.flatMap((n) => {
            const r = rangos.dia[n];
            return r.tipo === 'sin-dato' ? r.faltan.map(queFaltaEnPalabras) : [];
          }),
        ),
      ]
    : [];

  // Una plantilla no guarda recetas (DL-119): con una opción de receta, «Guardar como plantilla» dice por qué no.
  const sinPlantilla = estructura.some((d) => tieneRecetas(d.meals)) ? COPY_RECETAS.recetaEnPlantilla : null;

  return (
    <section className="seccion editor-del-plan" aria-labelledby="titulo-borrador">
      <div className="editor-del-plan__cabecera">
        {/* DJ-6: la versión en preparación lleva número (el de las activadas más uno) y dice que la persona no la ve. */}
        <h2 id="titulo-borrador">
          {COPY_DE_VERSIONES.versionEnPreparacion(numero)}{' '}
          <span className="etiqueta-de-dato">
            <Icono nombre="borrador" tamano={15} />
            {COPY_DE_VERSIONES.noLaVe(persona)}
          </span>
        </h2>
        <div className="editor-del-plan__acciones">
          <EstadoDeGuardado
            className="editor-del-plan__estado"
            guardando={guardando}
            sucio={sucio}
            puedeGuardar={puedeGuardar}
            fallo={fallo}
            conflicto={conflicto}
            guardadoA={guardadoA}
            detalle={detalle}
            onReintentar={() => void guardar()}
          />
          {/* ED-03 (DJ-6): «Guardar ahora», fijo y secundario junto al estado: guarda sin esperar la pausa. Apagado (con
              `aria-disabled`, que conserva el foco), dice por qué. */}
          <button
            type="button"
            className="boton boton--secundario"
            data-guardar-ahora
            aria-disabled={sinGuardarAhora ? true : undefined}
            aria-describedby={sinGuardarAhora ? 'motivo-sin-guardar-ahora' : undefined}
            onClick={() => {
              if (!sinGuardarAhora) void guardar();
            }}
          >
            <Icono nombre="guardar" tamano={18} />
            {COPY_GUARDADO.guardarAhora}
          </button>
          {sinGuardarAhora ? (
            <span id="motivo-sin-guardar-ahora" className="visualmente-oculto">
              {sinGuardarAhora}
            </span>
          ) : null}
          {/* TB-48: «Guardar como plantilla», con su texto y a la vista (antes, sola en un menú «⋯» sin texto). Si no se
              puede, está apagado (con `aria-disabled`, que conserva el foco) y dice por qué, al lector y al tocarlo. */}
          <button
            type="button"
            className="boton boton--quieto"
            data-guardar-como-plantilla
            aria-disabled={sinPlantilla ? true : undefined}
            aria-describedby={sinPlantilla ? 'motivo-sin-plantilla' : undefined}
            onClick={() => (sinPlantilla ? setMensaje({ tipo: 'info', texto: sinPlantilla }) : setGuardarPlantilla(true))}
          >
            <Icono nombre="plantillas" tamano={18} />
            {COPY_PLANTILLAS.guardarComoPlantilla}
          </button>
          {sinPlantilla ? (
            <span id="motivo-sin-plantilla" className="visualmente-oculto">
              {sinPlantilla}
            </span>
          ) : null}
          {/* ED-07 (DJ-6): «Revisar y activar…», la única entrada a activar, fija y llena (el único botón lleno de la
              barra). Abre «Antes de activar» siempre, también con algo por corregir o sin guardar, y no cambia de nombre
              ni de lugar mientras se escribe. */}
          <button type="button" className="boton boton--primario" data-revisar-y-activar onClick={abrirAntesDeActivar}>
            <Icono nombre="activar" tamano={18} />
            {COPY_ANTES_DE_ACTIVAR.revisarYActivar}
          </button>
          {/* ED-01: el «⋯» de la versión, con «Descartar la versión en preparación». La vigente nunca lo ofrece. */}
          {ofreceDescartar(version) ? (
            <MenuDeAcciones
              id="mas-de-la-version"
              rotulo={COPY_DESCARTAR_LA_VERSION.menu}
              acciones={[
                {
                  clave: 'descartar',
                  texto: COPY_DESCARTAR_LA_VERSION.accion,
                  alElegir: () => {
                    setFalloDelDescarte(null);
                    setDescartar(true);
                  },
                },
              ]}
            />
          ) : null}
        </div>
      </div>
      <p className="nota editor-del-plan__que-es">
        La persona no ve esta versión, y guardar no la activa{version.predecessorPlanId ? ': la versión activa no cambia hasta que actives esta' : ''}.
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
        <Aviso tipo={mensaje.tipo} enfocar={(mensaje.tipo !== 'info' || !!mensaje.deRevisar) && !mensaje.sinFoco}>
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

      <div className="editor-de-nutricion__zonas">
      <div className="editor-de-nutricion__principal">
      <div className="editor-del-plan__dia">
        {estructura.length > 0 ? (
          <fieldset className="segmentos segmentos--que-bajan" data-dia-tipo="varios">
            <legend>Día tipo</legend>
            <div className="segmentos__fila">
              {estructura.map((d, n) => (
                <label key={d.dayTypeId ?? `nuevo-${n}`} className="segmento">
                  <input type="radio" id={`dia-tipo-${n}`} name={`${propio}-dia`} checked={n === i} onChange={() => elegirDia(n)} />
                  {d.label.trim() || `Día tipo ${n + 1}`}
                  {/* ED-33 (ED-D4): cuántas comidas tiene, sin color y sin bloquear. */}
                  <span className="segmento__nota"> · {d.meals.length === 0 ? 'Sin comidas' : d.meals.length === 1 ? '1 comida incluida' : `${d.meals.length} comidas incluidas`}</span>
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
              // TB-48: duplicar y mover el día tipo que se mira.
              { clave: 'duplicar', texto: E.duplicarDiaTipo, alElegir: duplicarDia, noSePuede: estructura.length >= MAXIMO_DE_DIAS_TIPO ? E.topeDeDiasTipo(MAXIMO_DE_DIAS_TIPO) : null },
              { clave: 'antes', texto: E.moverAntes, alElegir: () => moverDia(i - 1), noSePuede: i === 0 ? E.yaEsElPrimero : null },
              { clave: 'despues', texto: E.moverDespues, alElegir: () => moverDia(i + 1), noSePuede: i === estructura.length - 1 ? E.yaEsElUltimo : null },
              { clave: 'quitar', texto: 'Quitar este día tipo', alElegir: () => pedirQuitar(alQuitarElDia(dia, i), quitarDia), noSePuede: estructura.length <= 1 ? 'Es el único día tipo de la versión.' : null },
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
              esLaUltima={j === dia.meals.length - 1}
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
              alSubir={() => moverComida(j, j - 1)}
              alBajar={() => moverComida(j, j + 1)}
              alDuplicar={() => duplicarComida(j)}
              alDuplicarOpcion={(k) => {
                cambiar((x) => (duplicarEn(x[i]!.meals[j]!.options, k, copiaDeLaOpcion(x[i]!.meals[j]!.options[k]!, k)), x));
                elegirPestana(j, k + 1);
                setNombreQueSeCambia({ de: 'opcion', i, j, k: k + 1 });
              }}
              alQuitar={() => pedirQuitar(alQuitarLaComida(m, j), () => quitarComida(j))}
              alQuitarOpcion={(k) =>
                pedirQuitar(alQuitarLaOpcion(m.options[k]!, k), () => {
                  cambiar((x) => (x[i]!.meals[j]!.options.splice(k, 1), x));
                  elegirPestana(j, Math.max(0, k - 1));
                })
              }
              totalDeLaOpcion={(k) => rangos?.comidas[j]?.opciones[k]?.total ?? null}
              alGuardarComoHabitual={() => setGuardarHabitual({ i, j })}
              noSePuedeCopiar={m.options.length >= MAXIMO_DE_OPCIONES ? COPY_DE_OTRA_COMIDA.tope(MAXIMO_DE_OPCIONES) : origenesDeLaCopia(estructura, i, j).length === 0 ? COPY_DE_OTRA_COMIDA.sinOtras : null}
              noSePuedeUsarHabitual={
                m.options.length >= MAXIMO_DE_OPCIONES
                  ? COPY_DE_OTRA_COMIDA.tope(MAXIMO_DE_OPCIONES)
                  : comidasHabituales.lista === null
                    ? 'Leyendo tus comidas habituales…'
                    : comidasHabituales.falla
                      ? COPY_HABITUALES.comidasNoSeLeyeron
                      : comidasHabituales.lista.length === 0
                        ? COPY_HABITUALES.sinComidas
                        : null
              }
              alCopiarDesdeOtra={() => setOtraComida({ que: 'copiar', i, j })}
              alUsarHabitual={() => setOtraComida({ que: 'habitual', i, j })}
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
      </div>
      <PanelDeNutricion
        pestana={pestanaDelPanel}
        alElegir={setPestanaDelPanel}
        impiden={impidenEnVivo}
        sinCompletar={sinCompletarEnVivo}
        persona={persona}
        rangos={
          rangos ? (
            <>
              <h3>{COPY_RANGOS.tituloDelDia(nombreDelDia)}</h3>
              <p className="panel-de-nutricion__del-dia" data-rango-del-dia>
                {rangoDelDiaEnPalabras(rangos.dia.energyKcal)}
              </p>
              {rangos.comidas.length > 0 ? (
                <div className="desplazable-x">
                  <table className="tabla panel-de-nutricion__tabla" data-rangos-por-comida>
                    <caption className="visualmente-oculto">{COPY_RANGOS.tituloDeLasComidas}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{COPY_RANGOS.comida}</th>
                        {NUTRIENTES_DEL_RANGO.map((n) => (
                          <th key={n} scope="col">
                            {COPY_RANGOS.nutriente[n]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rangos.comidas.map((c, j) => (
                        <tr key={j}>
                          <th scope="row">
                            {c.nombre} <span className="nota">· {c.opciones.length === 1 ? '1 opción' : `${c.opciones.length} opciones`}</span>
                          </th>
                          {NUTRIENTES_DEL_RANGO.map((n) => (
                            <td key={n}>{rangoEnUnaCelda(c.rango[n], n)}</td>
                          ))}
                        </tr>
                      ))}
                      <tr className="panel-de-nutricion__fila-del-dia">
                        <th scope="row">{COPY_RANGOS.elDia}</th>
                        {NUTRIENTES_DEL_RANGO.map((n) => (
                          <td key={n}>{rangoEnUnaCelda(rangos.dia[n], n)}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : null}
              {huecosDelDia.length > 0 ? (
                <ul className="estacion__lista-del-panel" data-huecos>
                  {huecosDelDia.slice(0, 6).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                  {huecosDelDia.length > 6 ? <li>{COPY_RANGOS.yMas(huecosDelDia.length - 6)}</li> : null}
                </ul>
              ) : null}
              {leyendoComposiciones > 0 ? (
                <p className="nota" role="status">
                  {COPY_RANGOS.leyendo(leyendoComposiciones)}
                </p>
              ) : null}
              <p className="nota">{COPY_RANGOS.comoSeLee}</p>
              <p className="nota">{COPY_RANGOS.estimacion}</p>
            </>
          ) : (
            <p className="nota">{COPY_RANGOS.sinDiaTipo}</p>
          )
        }
      />
      </div>

      {/* ED-33: lo que se quita con contenido se confirma, con lo que se va; «Cancelar» tiene el foco y no toca nada. */}
      <CuadroEnfocado
        abierto={porQuitar !== null}
        forma="dialogo"
        titulo={COPY_QUITAR.titulo}
        focoEnCancelar
        principal={{
          texto: COPY_QUITAR.quitar,
          alTocar: () => {
            porQuitar?.hacer();
            setPorQuitar(null);
          },
        }}
        onCerrar={() => setPorQuitar(null)}
      >
        <p data-lo-que-se-va>{porQuitar?.texto}</p>
        <p className="nota">{COPY_QUITAR.queSeVa}</p>
      </CuadroEnfocado>

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

      {/* ED-33: los dos cuadros del «⋯» de la comida. Cambian el borrador; el autoguardado lo lleva. */}
      <CuadroCopiarDesdeOtraComida
        abierto={otraComida?.que === 'copiar'}
        comida={otraComida ? nombreDeLaComida(estructura[otraComida.i]?.meals[otraComida.j] ?? { label: '' }, otraComida.j) : ''}
        numeroDeLaNueva={(otraComida ? (estructura[otraComida.i]?.meals[otraComida.j]?.options.length ?? 0) : 0) + 1}
        origenes={otraComida?.que === 'copiar' ? origenesDeLaCopia(estructura, otraComida.i, otraComida.j) : []}
        alCopiar={(o) => {
          const fuente = estructura[o.i]?.meals[o.j]?.options[o.k];
          if (!otraComida || !fuente) return;
          const comida = nombreDeLaComida(estructura[otraComida.i]?.meals[otraComida.j] ?? { label: '' }, otraComida.j);
          sumarOpciones(otraComida.i, otraComida.j, [copiaDesdeOtraComida(fuente, o.k)], COPY_DE_OTRA_COMIDA.copiada(o.opcion, comida));
        }}
        onCerrar={() => setOtraComida(null)}
      />
      <CuadroUsarComidaHabitual
        abierto={otraComida?.que === 'habitual'}
        comida={otraComida ? nombreDeLaComida(estructura[otraComida.i]?.meals[otraComida.j] ?? { label: '' }, otraComida.j) : ''}
        habituales={comidasHabituales.lista ?? []}
        alUsar={(h) => {
          const m = otraComida ? estructura[otraComida.i]?.meals[otraComida.j] : undefined;
          if (!otraComida || !m) return;
          const comida = nombreDeLaComida(m, otraComida.j);
          const { opciones, quedanAfuera } = opcionesDeLaHabitual(h, MAXIMO_DE_OPCIONES - m.options.length);
          setNombres((n) => ({ ...n, ...Object.fromEntries(Object.entries(h.items).map(([id, it]) => [id, it.name])) }));
          sumarOpciones(otraComida.i, otraComida.j, opciones, `${COPY_DE_OTRA_COMIDA.usada(h.name, comida, opciones.length)}${quedanAfuera > 0 ? ` ${COPY_DE_OTRA_COMIDA.quedanAfuera(quedanAfuera)}` : ''}`);
        }}
        onCerrar={() => setOtraComida(null)}
      />

      <CuadroDeLaOpcion
        abierto={agregando !== null && opcionDondeSeAgrega !== undefined}
        titulo={agregando && comidaDondeSeAgrega ? tituloDelCuadro(nombreDeLaComida(comidaDondeSeAgrega, agregando.j), agregando.k) : ''}
        subtitulo={agregando && comidaDondeSeAgrega ? subtituloDelCuadro(nombreDelDiaTipo(estructura[agregando.i]!, agregando.i), comidaDondeSeAgrega.options.length) : ''}
        opcion={opcionDondeSeAgrega ?? null}
        comida={agregando && comidaDondeSeAgrega ? nombreDeLaComida(comidaDondeSeAgrega, agregando.j) : ''}
        otrasOpciones={agregando && agregando.i === i ? (rangos?.comidas[agregando.j]?.opciones.filter((_, k) => k !== agregando.k) ?? []) : []}
        nombres={nombres}
        composiciones={composiciones}
        objetivo={objetivo}
        habituales={alimentosHabituales}
        alGuardar={(copia, nuevos) => {
          if (!agregando) return;
          const { i: di, j, k } = agregando;
          setNombres((n) => ({ ...n, ...nuevos.nombres }));
          // El buscador ya trajo su composición: los totales de la estación siguen al instante.
          setComposiciones((m) => new Map([...m, ...nuevos.composiciones]));
          // Sobre la estructura de ahora: si un guardado le dio identidad a la opción con el cuadro abierto, la conserva.
          cambiar((x) => {
            const m = x[di]?.meals[j];
            if (m && m.options[k]) m.options[k] = opcionAlGuardar(m.options[k], copia);
            return x;
          });
          setAgregando(null);
        }}
        onCerrar={() => setAgregando(null)}
      />

      {/* Las recetas, en el mismo cajón que los alimentos: no hay un diálogo encima de otro. */}
      <Cajon abierto={eligiendoReceta !== null} titulo={COPY_RECETAS.agregarComoOpcion} sobretitulo={comidaDeLaReceta ? comidaDeLaReceta.label.trim() || `Comida ${(eligiendoReceta?.j ?? 0) + 1}` : null} onCerrar={() => setEligiendoReceta(null)}>
        <ElegirReceta
          alCrearNueva={() => {
            if (!eligiendoReceta) return;
            const { i: di, j } = eligiendoReceta;
            const m = estructura[di]?.meals[j];
            if (!m) return;
            // El cajón se cierra y se abre el cuadro de la receta: nunca uno encima del otro (§2.3).
            setEligiendoReceta(null);
            setRecetaNueva({ i: di, j, mealId: m.mealId ?? null, label: m.label, nombre: nombreDeLaComida(m, j) });
          }}
          onElegir={(receta) => {
            if (!eligiendoReceta) return;
            const { i: di, j } = eligiendoReceta;
            const opciones = estructura[di]?.meals[j]?.options;
            if (!opciones) return;
            // ED-33: la opción inicial sin tocar de una comida nueva se reemplaza; si no, la receta va al final.
            const { k: nueva } = opcionesConLaReceta(opciones, receta);
            setRecetas((x) => ({
              ...x,
              [receta.recipeVersionId]: { recipeId: receta.recipeId, recipeVersionId: receta.recipeVersionId, versionNumber: receta.versionNumber, name: receta.name, servings: receta.servings },
            }));
            cambiar((x) => ((x[di]!.meals[j]!.options = opcionesConLaReceta(x[di]!.meals[j]!.options, receta).opciones), x));
            setPestanas((p) => ({ ...p, [`${di}-${j}`]: nueva }));
            setEligiendoReceta(null);
          }}
        />
      </Cajon>

      {/* ED-32: la receta nueva, en un cuadro grande, sin salir del plan; dos salidas y, si el agregado no se pudo, el
          reintento con la misma versión. */}
      <CuadroEnfocado
        abierto={recetaNueva !== null}
        forma="dialogo"
        ancho
        titulo={COPY_RECETA_NUEVA.titulo(recetaNueva?.nombre ?? '')}
        sobretitulo={persona}
        conCambios={recetaSucia && !recuperar}
        onCerrar={cerrarLaRecetaNueva}
      >
        {recuperar && recetaNueva ? (
          <div data-recuperar-la-receta>
            <Aviso tipo="error" enfocar>
              <p>{COPY_RECETA_NUEVA.quedoGuardada(recuperar.receta.name, recuperar.receta.versionNumber)}</p>
              <p>{COPY_RECETA_NUEVA.noSeAgrego(recetaNueva.nombre, recuperar.motivo)}</p>
            </Aviso>
            <div className="acciones">
              <button type="button" className="boton boton--primario" onClick={() => agregarLaRecetaNueva(recuperar.receta)}>
                {COPY_RECETA_NUEVA.agregarla(recetaNueva.nombre)}
              </button>
              <button type="button" className="boton boton--secundario" onClick={cerrarLaRecetaNueva}>
                {COPY_RECETA_NUEVA.cerrar}
              </button>
            </div>
          </div>
        ) : recetaNueva ? (
          <EditorDeReceta
            token={token}
            sesionPerdida={sesionPerdida}
            recetaId={null}
            enElPlan={{ destino: recetaNueva.nombre }}
            alCambiarLoEscrito={setRecetaSucia}
            onGuardada={(r, _aviso, agregar) => alGuardarLaRecetaNueva(r, agregar)}
            onVolver={cerrarLaRecetaNueva}
          />
        ) : null}
      </CuadroEnfocado>

      <AntesDeActivar
        abierto={confirmar}
        area="Nutrición"
        persona={persona}
        numero={numero}
        vigente={vigente?.numero ?? null}
        primera={!version.predecessorPlanId}
        impiden={impidenActivar}
        sinCompletar={sinCompletarAlActivar}
        revisando={revision?.estado === 'revisando'}
        sinRevisar={revision?.estado === 'fallo'}
        onVolverARevisar={() => void revisar(version)}
        sinGuardar={sucio}
        guardando={guardando}
        conflicto={conflicto}
        onGuardarAhora={() => void guardar()}
        cambios={confirmar && (vigente?.plan || !version.predecessorPlanId) ? compararNutricion(vigente?.plan ? aEntrada(vigente.plan) : [], estructura) : null}
        loQueVe={loQueVeLaPersona}
        eligioCuando={fechaQueResulta(cuando, hoyEn()) !== undefined}
        activando={activando}
        error={falloDeActivacion}
        onActivar={() => void activar()}
        onVolver={cerrarAntesDeActivar}
        cuando={
          <CuandoLaRevisas
            id="proxima-revision"
            hoy={hoyEn()}
            momento="ACTIVAR"
            conSinFecha
            primerPlan={!vigente}
            eleccion={cuando}
            alElegir={(e) => {
              setCuando(e);
              setProximaRevision(fechaQueResulta(e, hoyEn()) ?? '');
            }}
            aviso={loQueFalta(cuando, hoyEn())}
          />
        }
      />

      <CuadroDelDescarte
        abierto={descartar}
        persona={persona}
        numero={numero}
        vigente={vigente ? { numero: vigente.numero, desde: diaEnUnaFrase(vigente.desde) } : null}
        sinGuardar={sucio}
        enviando={descartando}
        error={falloDelDescarte}
        onCancelar={() => {
          // La clave no se descarta: si el último intento quedó incierto, el próximo la reusa (`registrar` la libera
          // después de una respuesta definitiva).
          setDescartar(false);
          setFalloDelDescarte(null);
        }}
        onDescartar={() => void descartarLaVersion()}
      />
    </section>
  );
}

/**
 * ED-25 y ED-34 en Nutrición · El panel al costado, con dos pestañas: «Rangos y totales» y «Antes de activar», en vivo.
 * Las pestañas se recorren con las flechas, Inicio y Fin (el patrón de pestañas de ARIA).
 */
function PanelDeNutricion({
  pestana,
  alElegir,
  impiden,
  sinCompletar,
  persona,
  rangos,
}: {
  pestana: 'antes' | 'rangos';
  alElegir: (p: 'antes' | 'rangos') => void;
  impiden: readonly ParaCorregir[];
  sinCompletar: readonly ParaCorregir[];
  persona: string | null;
  rangos: ReactNode;
}) {
  const lista = (cosas: readonly ParaCorregir[]) => (
    <ul className="estacion__lista-del-panel">
      {cosas.map((x, n) => (
        <li key={n}>
          {x.texto}{' '}
          {x.ir ? (
            <button type="button" className="boton boton--enlace" onClick={x.ir}>
              {CE.irACorregir}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
  const pestanas = [
    ['rangos', COPY_RANGOS.pestana],
    ['antes', CE.pestanaAntes],
  ] as const;
  return (
    <aside className="panel-de-nutricion" aria-label={CE.panel} data-panel-de-nutricion>
      <div
        className="estacion__pestanas"
        role="tablist"
        aria-label={CE.panel}
        onKeyDown={(e) => {
          const otra = pestana === 'rangos' ? 'antes' : 'rangos';
          const destino = e.key === 'ArrowRight' || e.key === 'ArrowLeft' ? otra : e.key === 'Home' ? 'rangos' : e.key === 'End' ? 'antes' : null;
          if (!destino) return;
          e.preventDefault();
          alElegir(destino);
          document.getElementById(`pestana-nut-${destino}`)?.focus();
        }}
      >
        {pestanas.map(([clave, texto]) => (
          <button key={clave} type="button" role="tab" id={`pestana-nut-${clave}`} aria-selected={pestana === clave} aria-controls={`panel-nut-${clave}`} tabIndex={pestana === clave ? 0 : -1} onClick={() => alElegir(clave)}>
            {texto}
            {clave === 'antes' && impiden.length > 0 ? <span className="estacion__cuenta"> {impiden.length}</span> : null}
          </button>
        ))}
      </div>
      {pestana === 'antes' ? (
        <div role="tabpanel" id="panel-nut-antes" aria-labelledby="pestana-nut-antes" data-panel-en-vivo>
          <h3>
            <Icono nombre="aviso" tamano={15} />
            {CE.impide}
          </h3>
          {impiden.length === 0 ? <p className="nota">{CE.nadaImpide}</p> : lista(impiden)}
          <h3>
            {CE.quedaSinCompletar} <span className="nota">· {CE.noImpide}</span>
          </h3>
          {sinCompletar.length === 0 ? <p className="nota">{CE.nadaSinCompletar}</p> : lista(sinCompletar)}
          <p className="nota">{CE.enVivo(persona)}</p>
        </div>
      ) : (
        <div role="tabpanel" id="panel-nut-rangos" aria-labelledby="pestana-nut-rangos" data-rangos>
          {rangos}
        </div>
      )}
    </aside>
  );
}

/** Una cosa por corregir o por completar, con el camino a su lugar. */
type ParaCorregir = { readonly texto: string; readonly ir: (() => void) | null };

/**
 * La lista de recetas propias, para sumar una como opción de una comida (DL-119). Va dentro de un cajón. Desde TB-48,
 * con un buscador: lee todas las propias de a 50 al abrir el cajón y las filtra por su nombre mientras se escribe
 * (`recetas-para-elegir.ts`). API-REC-02 no busca por texto, así que no le pide nada nuevo.
 */
function ElegirReceta({ onElegir, alCrearNueva }: { onElegir: (r: Receta) => void; alCrearNueva: () => void }) {
  const { token, sesionPerdida } = useNutricion();
  const [estado, setEstado] = useState<{ tipo: 'cargando' } | { tipo: 'error'; texto: string } | { tipo: 'lista'; recetas: readonly Receta[]; mas: string | null }>({ tipo: 'cargando' });
  const [texto, setTexto] = useState('');

  /** Lee desde el cursor hasta el final, o hasta `PAGINAS_DE_RECETAS` páginas: lo que queda se ofrece con «Ver más». */
  const cargar = useCallback(
    async (cursor?: string) => {
      const leidas: Receta[] = [];
      let siguiente = cursor;
      for (let pagina = 0; pagina < PAGINAS_DE_RECETAS; pagina++) {
        const r = await api.listarRecetas(token, { limit: String(RECETAS_POR_PAGINA), ...(siguiente ? { cursor: siguiente } : {}) });
        if (sesionPerdida(r)) return;
        if (!r.ok) return setEstado({ tipo: 'error', texto: r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN' ? COPY_RECETAS.soloNutricion : mensajeDeFallo(r) });
        leidas.push(...r.datos.data);
        siguiente = r.datos.page.hasMore ? (r.datos.page.nextCursor ?? undefined) : undefined;
        if (!siguiente) break;
      }
      setEstado((e) => ({ tipo: 'lista', recetas: cursor && e.tipo === 'lista' ? [...e.recetas, ...leidas] : leidas, mas: siguiente ?? null }));
    },
    [token, sesionPerdida],
  );
  useEffect(() => {
    void cargar();
  }, [cargar]);

  const visibles = estado.tipo === 'lista' ? recetasQueCoinciden(estado.recetas, texto) : [];
  return (
    <div className="recetas-para-elegir">
      {/* ED-32: crear una receta sin salir del plan; entra como opción de esta comida. */}
      <p>
        <button type="button" className="boton boton--secundario" onClick={alCrearNueva} data-receta-nueva>
          <Icono nombre="mas" tamano={18} />
          {COPY_RECETA_NUEVA.recetaNueva}
        </button>{' '}
        <span className="nota">{COPY_RECETA_NUEVA.queEs}</span>
      </p>
      {estado.tipo === 'cargando' ? <Cargando /> : null}
      {estado.tipo === 'error' ? (
        <Aviso tipo="error">
          <p>{estado.texto}</p>
        </Aviso>
      ) : null}
      {estado.tipo === 'lista' && estado.recetas.length === 0 ? (
        <p>
          {COPY_RECETAS.sinRecetasParaElegir} <Enlace href="/pro/recipes">{COPY_RECETAS.irAMisRecetas}</Enlace>
        </p>
      ) : null}
      {estado.tipo === 'lista' && estado.recetas.length > 0 ? (
        <>
          <Campo id="buscar-receta" type="search" autoComplete="off" etiqueta={COPY_ELEGIR_RECETA.buscar} ayuda={COPY_ELEGIR_RECETA.ayuda} value={texto} onChange={(e) => setTexto(e.target.value)} data-buscar-receta />
          {/* Cuántas quedan se dice al escribir, sin mover el foco del buscador. */}
          <p className="nota" role="status" data-cuantas-recetas>
            {visibles.length === 0 ? COPY_ELEGIR_RECETA.ninguna(texto) : COPY_ELEGIR_RECETA.cuantas(visibles.length, estado.recetas.length)}
          </p>
          {visibles.length === 0 ? (
            <button type="button" className="boton boton--enlace" onClick={() => setTexto('')}>
              {COPY_ELEGIR_RECETA.borrar}
            </button>
          ) : null}
          <ul className="lista">
            {visibles.map((r) => (
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
        </>
      ) : null}
      {estado.tipo === 'lista' && estado.mas ? (
        <>
          {texto.trim() ? <p className="nota">{COPY_ELEGIR_RECETA.hayMas}</p> : null}
          <button type="button" className="boton boton--secundario" onClick={() => void cargar(estado.mas ?? undefined)}>
            Ver más
          </button>
        </>
      ) : null}
    </div>
  );
}
