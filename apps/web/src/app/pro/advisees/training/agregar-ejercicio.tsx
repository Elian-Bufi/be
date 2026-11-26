'use client';

/**
 * «Agregar ejercicio» (WP-ESCRITORIO-AREAS, parte 8): el buscador del catálogo, en un cajón al costado del editor del
 * plan de entrenamiento, que sigue a la vista por detrás. Hace lo mismo que el recuadro que antes se abría dentro de
 * cada sesión —buscar en el catálogo BE, elegir un habitual, crear un ejercicio a mano e importar uno desde wger
 * (B10-06:485-498; WP-08)—, y nada más. Es el cajón de «Agregar ítem» del plan de comidas, con las mismas reglas:
 * - **Busca al enviar** (Enter o «Buscar»). Una búsqueda que falla dice su motivo y se reintenta: no es «No encontramos
 *   ejercicios con ese nombre» (B10-10:41). Una sin resultados dice qué se buscó y ofrece «Limpiar búsqueda», que vacía
 *   el campo (y el filtro de los habituales) y devuelve el foco al campo (bloque 5 del encargo de consolidación).
 * - **ED-21: se marcan varios y entran juntos.** Una casilla por fila (y los habituales, con un toque); lo creado a mano
 *   o importado queda marcado. Abajo, «Agregar 3 a Piernas A», con una prescripción opcional para todos (ED-22): entran
 *   en el orden marcado, y nada entra antes de «Agregar» (`varios-a-la-vez.ts`).
 * - «Crear un ejercicio propio» (con los parecidos del catálogo antes de crear, ED-21) e «Importar desde wger» se abren
 *   adentro, con «Volver a la búsqueda».
 * - Al abrirse, el foco va al campo de búsqueda; cada vez que se abre, empieza vacío.
 * - Si los ejercicios habituales no se pueden leer, se dice: no es «todavía no marcaste ninguno».
 * - Si un ejercicio apareció por un nombre alternativo, se dice cuál: «Press de banca (bench press)» (DL-141).
 * - WP-CATALOGO-VISUAL (etapa 2; DL-081 y DL-162): cada fila dice sus zonas musculares en un renglón (vienen en la
 *   búsqueda), y el botón del ojo abre debajo el detalle del ejercicio: su imagen y la figura de sus zonas (la ficha
 *   visual, API-EJE-05). Uno abierto por vez; una búsqueda nueva lo cierra.
 * - WP-GRAFICOS GR-04 (DL-174, fase 1): si la persona ya hizo el ejercicio, la fila lo dice en un renglón más: «Con
 *   historial · 9 sesiones · la última el mar 3 nov». Sale del índice de API-PRJ-01 del último año, que se lee una vez al
 *   abrir el cajón (`historial-del-buscador.ts`). Sin flecha, sin el primer valor ni el último y sin color: la vista previa
 *   con el último valor y el mínimo y el máximo es de la fase 2. Si la lectura falla, se dice y se reintenta; los
 *   resultados se ven igual.
 *   La pasada visual (15/11; DISENO-VISUAL §2, GR-04): la marca es una ficha compacta en el renglón del origen («47
 *   sesiones · la última, 9 nov», con su ícono; el lector de pantalla oye la frase entera), y qué cuenta va en una sola
 *   línea, con «Cómo se cuenta» al lado: en 1440 × 900 se ven al menos seis resultados sin desplazar.
 *   Revisión del 15/11: la ficha dice que la fecha es la última (no «desde el 9 nov»); la línea dice a la vista que cuentan
 *   también las registradas como no realizadas o hechas con otro ejercicio (por eso «Analizar» puede contar menos filas);
 *   «Cómo se cuenta» se ve escrito, no solo como una «i» con su nombre en un globo que no llega con el teclado ni al tocar.
 */
import {
  COPY_ENTRENAMIENTO,
  COPY_HABITUALES,
  COPY_HISTORIAL_DEL_BUSCADOR,
  COPY_INTEGRACIONES,
  historialPorEjercicio,
  marcaDeHistorial,
  type EjercicioDelPeriodo,
  leerPrescripcion,
  vistaPreviaDePrescripcion,
  type PrescripcionLeida,
  type EjercicioDeCatalogo,
  type EjercicioEncontrado,
  clasificacionEnUnRenglon,
  enOrdenAlfabetico,
  filtrarElCatalogo,
  NOMBRE_DE_LAS_ARTICULACIONES,
  NOMBRE_DEL_EQUIPAMIENTO,
  NOMBRE_DEL_GRUPO_MUSCULAR,
  NOMBRE_DEL_PATRON,
  SIN_FILTROS,
  type Articulaciones,
  type Equipamiento,
  type FiltrosDelCatalogo,
  type GrupoMuscular,
  type PatronDeMovimiento,
} from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Ayuda } from '../../../../components/ayuda';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { Cargando } from '../../../../components/estados';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { ComoLeerlo } from '../graficos/como-leerlo';
import { diaYMes } from '../graficos/eje-de-fechas';
import { unAnioAntes } from '../fuerza/lectura-de-fuerza';
import { COPY_CATALOGO_EN_LA_SESION, invalidarElCatalogo } from './catalogo-en-la-sesion';
import { leerElCatalogoDeLaSesion } from '../../exercises/catalogo-de-be';
import { hoyEn } from '../seguimiento/estado';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useEditorDeEntrenamiento } from './entrenamiento';
import type { EjerciciosHabituales } from './habituales';
import { ImportacionDeWger } from './importacion';
import { alternarMarcado, COPY_VARIOS_A_LA_VEZ as V } from './varios-a-la-vez';
import { busquedasDeParecidos, COPY_EJERCICIO_PROPIO as EP, elQueSeLlamaIgual, haySugerencias, parecidos, PAUSA_DE_LAS_SUGERENCIAS, POCOS_RESULTADOS } from './parecidos-del-catalogo';

type Modo = 'buscar' | 'manual' | 'importar';

/** DL-197: el catálogo entero, leído al abrir. */
/** DL-199 (ET3-25): la lista dice si quedó entera; si cortó a mitad, se avisa con «Reintentar». */
type LecturaDelCatalogo = { readonly tipo: 'cargando' } | { readonly tipo: 'lista'; readonly ejercicios: readonly EjercicioEncontrado[]; readonly completo?: boolean } | { readonly tipo: 'falla'; readonly motivo: string };

/** DL-197 (ET1-09): los textos de «Agregar ejercicios», como en el prototipo que eligió Dirección. */
export const COPY_CATALOGO_PARA_ELEGIR = {
  titulo: 'Agregar ejercicios',
  buscar: 'Buscar por ejercicio, músculo o equipo…',
  filtros: 'Filtrar el catálogo',
  grupo: 'Grupo muscular',
  equipamiento: 'Equipamiento',
  patron: 'Patrón',
  articulaciones: 'Articulaciones',
  favoritos: 'Favoritos',
  limpiar: 'Limpiar filtros',
  lista: 'Ejercicios del catálogo',
  leyendo: 'Leyendo el catálogo…',
  cuenta: (n: number, de: number) => (n === de ? `${de} ejercicios: los del catálogo de BE y los tuyos` : `${n} de ${de} ejercicios`),
  ninguno: 'Ningún ejercicio coincide con lo elegido.',
  sinClasificar: 'Sin clasificar',
  elegir: 'Elegir',
  elegido: 'Elegido',
  seleccionados: (n: number) => (n === 1 ? '1 seleccionado' : `${n} seleccionados`),
  /** Revisión adversaria (DL-197): un ejercicio que la sesión ya tiene se puede sumar otra vez, pero se dice. */
  yaEnLaSesion: 'ya está en la sesión',
  repetidos: (n: number) => (n === 1 ? '1 ya está en la sesión: entra otra vez' : `${n} ya están en la sesión: entran otra vez`),
  agregarALaSesion: 'Agregar a la sesión',
} as const;

/**
 * GR-04: lo que la persona ya hizo, por ejercicio del catálogo: el índice de API-PRJ-01 (`TRAINING_PROGRESSION_BY_EXERCISE`
 * sin ejercicio) del último año, con el «hoy» de la API para decir la fecha de la última. `sin-acceso`: con el acceso de
 * ahora no se ven los registros de Entrenamiento, y los resultados van sin marca y sin aviso.
 */
/** GR-04 en una línea (pasada visual del 15/11): qué cuenta la marca, corto; el detalle, detrás de «Cómo se cuenta». */
export const COPY_MARCA_DEL_BUSCADOR = {
  /** Del dominio, con el resto del texto de la marca: «no realizadas» no se escribe en las pantallas (WP-06 §9.2). */
  enUnaLinea: COPY_HISTORIAL_DEL_BUSCADOR.enUnaLinea,
  comoSeCuenta: 'Cómo se cuenta',
} as const;

type HistorialDelBuscador =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'listo'; readonly porEjercicio: ReadonlyMap<string, EjercicioDelPeriodo>; readonly hoy: string }
  | { readonly tipo: 'sin-acceso' }
  // PLT (DL-182): el editor de una plantilla no tiene persona: no hay lo que hizo, y el buscador no marca nada.
  | { readonly tipo: 'sin-persona' }
  | { readonly tipo: 'falla' };

/** Lee el índice una vez, al abrirse el cajón (lo de adentro vive solo mientras está abierto), y con «Reintentar». */
function useHistorialDelBuscador(): { readonly historial: HistorialDelBuscador; readonly recargar: () => void } {
  const { token, asesoradoId, sesionPerdida } = useEditorDeEntrenamiento();
  const [historial, setHistorial] = useState<HistorialDelBuscador>({ tipo: 'cargando' });
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    let vigente = true;
    if (asesoradoId === null) {
      setHistorial({ tipo: 'sin-persona' });
      return;
    }
    setHistorial({ tipo: 'cargando' });
    // Sin `periodEnd`: la API toma su hoy (el del navegador puede ir un día adelante).
    void api.proyeccion(token, asesoradoId, 'TRAINING_PROGRESSION_BY_EXERCISE', { periodStart: unAnioAntes(hoyEn()) }).then((r) => {
      if (!vigente || sesionPerdida(r)) return;
      if (!r.ok) return setHistorial(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'sin-acceso' } : { tipo: 'falla' });
      const x = r.datos.data.result;
      setHistorial({ tipo: 'listo', porEjercicio: historialPorEjercicio(x?.kind === 'TRAINING_PROGRESSION_BY_EXERCISE' ? x.exercises : []), hoy: r.datos.data.period.end });
    });
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId, sesionPerdida, vuelta]);
  const recargar = useCallback(() => setVuelta((v) => v + 1), []);
  return { historial, recargar };
}

/** ED-21: los textos de los chips por zona. */

/** DL-197 (F19): el «?» del cuadro, con un ejemplo resuelto. */
const AYUDA_DE_AGREGAR = {
  que: 'Acá está todo el catálogo: los ejercicios de BE y los que cargaste vos. Elegís varios y entran juntos, en el orden en que los elegiste.',
  pasos: [
    'Escribí parte del nombre, un músculo o un equipo («banca», «pecho», «polea»), o usá los filtros.',
    '«Favoritos» deja solo tus habituales; la estrella de cada renglón lo suma o lo saca.',
    'Tocá «Elegir» en cada uno que quieras: arriba del botón se cuentan los seleccionados.',
    '«Agregar a la sesión» los suma, con la prescripción para todos si la escribiste.',
  ],
  ejemplo: 'Ejemplo: Grupo muscular «Pecho» + Equipamiento «Mancuernas» deja el press y las aperturas con mancuernas; elegís los dos, escribís «3x10 @2» en la prescripción para todos y entran con 3 series de 10 y RIR 2.',
} as const;

const SIN_NINGUNO: ReadonlySet<string> = new Set();
const yaEsta = (enLaSesion: ReadonlySet<string>, e: { readonly versionId: string; readonly exerciseId: string }): boolean => enLaSesion.has(e.versionId) || enLaSesion.has(e.exerciseId);

export function AgregarEjercicio({
  abierto,
  deDonde,
  habituales,
  onAgregar,
  onCerrar,
  prescripcionDeLaSesion = null,
  enLaSesion = SIN_NINGUNO,
}: {
  /** Los ejercicios que la sesión ya tiene (por versión o por ejercicio del catálogo): se marcan, y elegirlos se dice. */
  enLaSesion?: ReadonlySet<string>;
  /** ENP-D10: el preset elegido con la sesión vacía; sin una prescripción escrita acá, los ejercicios entran con él. */
  prescripcionDeLaSesion?: string | null;
  abierto: boolean;
  /** A qué sesión se le suma: «Fuerza: progresión · A · Tren inferior». */
  deDonde: string | null;
  habituales: EjerciciosHabituales;
  /** ED-21: los marcados, en el orden en que se marcaron, y la prescripción para todos (o `null`). */
  onAgregar: (marcados: readonly EjercicioDeCatalogo[], prescripcion: PrescripcionLeida | null) => void;
  onCerrar: () => void;
}) {
  const [modo, setModo] = useState<Modo>('buscar');
  const [marcados, setMarcados] = useState<readonly EjercicioDeCatalogo[]>([]);
  const [linea, setLinea] = useState('');
  const [falta, setFalta] = useState(false);
  // Ratificación del 19/11 (a 1280 × 800 el pie tapaba los resultados): «Prescripción para todos» va plegada; se abre a
  // pedido, y se abre sola si lo escrito no se entiende al agregar.
  const [paraTodosAbierta, setParaTodosAbierta] = useState(false);
  // El campo de búsqueda: al abrirse el cajón, el foco va ahí.
  const campo = useRef<HTMLInputElement>(null);
  // Cada vez que se abre, empieza por la búsqueda, sin nada marcado.
  useEffect(() => {
    if (!abierto) return;
    setModo('buscar');
    setMarcados([]);
    setLinea('');
    setFalta(false);
    setParaTodosAbierta(false);
  }, [abierto]);
  const lectura = linea.trim() === '' ? null : leerPrescripcion(linea);
  const repetidos = marcados.filter((m) => yaEsta(enLaSesion, m)).length;
  const agregar = () => {
    if (marcados.length === 0) return setFalta(true);
    // Lo que no se entiende no se aplica: se corrige o se borra antes (ED-22, nunca adivina). Nunca un return mudo: el
    // pliegue se abre para que se vea el motivo, aunque se haya cerrado con algo escrito (revisión adversaria del 19/11).
    if (lectura && !lectura.ok) return setParaTodosAbierta(true);
    onAgregar(marcados, lectura?.ok ? lectura.leida : null);
    onCerrar();
  };
  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="dialogo"
      ancho
      className="agregar-ejercicios"
      titulo={COPY_CATALOGO_PARA_ELEGIR.titulo}
      sobretitulo={deDonde}
      focoInicial={campo}
      ayuda={{
        nombre: 'Cómo se agregan ejercicios',
        contenido: (
          <>
            <p>{AYUDA_DE_AGREGAR.que}</p>
            <ol>
              {AYUDA_DE_AGREGAR.pasos.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
            <p className="ayuda-con-ejemplo__ejemplo" data-ejemplo-resuelto>
              {AYUDA_DE_AGREGAR.ejemplo}
            </p>
          </>
        ),
      }}
      principal={modo === 'buscar' ? { texto: COPY_CATALOGO_PARA_ELEGIR.agregarALaSesion, alTocar: agregar } : null}
      // ED-10 (§2.3): con ejercicios marcados o una prescripción escrita, cerrar pregunta antes de perderlos.
      conCambios={marcados.length > 0 || linea.trim() !== ''}
      onCerrar={onCerrar}
      pie={
        modo === 'buscar' ? (
          <>
            {/* C6: los elegidos, a la vista en el pie fijo y en el orden en que entran; cada uno se quita sin perder la
                búsqueda. */}
            {/* RP-22: tocar «Agregar» sin nada marcado lo dice en el mismo renglón del título de los elegidos (antes, un
                párrafo nuevo arriba del botón agrandaba el pie y tapaba otro resultado). */}
            <div className="agregar-ejercicio__elegidos" data-elegidos={marcados.length}>
              <p className={`agregar-ejercicio__elegidos-titulo${falta && marcados.length === 0 ? ' campo__error' : ''}`} role={falta && marcados.length === 0 ? 'alert' : undefined} data-sin-marcados={falta && marcados.length === 0 ? '' : undefined} data-seleccionados={marcados.length}>
                {falta && marcados.length === 0 ? V.sinMarcados : COPY_CATALOGO_PARA_ELEGIR.seleccionados(marcados.length)}
                {repetidos > 0 ? <span className="nota" data-repetidos-en-la-sesion={repetidos}> · {COPY_CATALOGO_PARA_ELEGIR.repetidos(repetidos)}</span> : null}
              </p>
              {marcados.length > 0 ? (
                <ul className="agregar-item__fichas agregar-ejercicio__fichas-elegidas">
                  {marcados.map((m) => (
                    <li key={m.versionId}>
                      <button type="button" className="boton boton--quieto boton--compacto" aria-label={V.quitarDeLosElegidos(m.name)} title={m.name} onClick={() => setMarcados((x) => alternarMarcado(x, m))} data-quitar-elegido>
                        {/* Revisión del tramo 2: las fichas bajan de renglón y ninguna queda cortada a medias; un nombre largo
                            se recorta con «…» dentro de su ficha (entero en `title` y en lo que oye el lector). */}
                        <span className="agregar-ejercicio__nombre-elegido">{m.name}</span>
                        <Icono nombre="cerrar" tamano={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {/* Ratificación del 19/11: a 1280 × 800 el pie (los elegidos, la prescripción para todos y el botón) tapaba la
                lista: se veía el título del catálogo y no los ejercicios. La prescripción para todos va plegada, en el mismo
                renglón que el aviso del catálogo y el botón; abierta, ocupa su renglón. */}
            <details
              className="agregar-ejercicio__para-todos-pliegue"
              open={paraTodosAbierta}
              onToggle={(e) => setParaTodosAbierta(e.currentTarget.open)}
              data-para-todos-pliegue
            >
              <summary>
                {V.prescripcionParaTodosCorta}
                {lectura?.ok ? <span className="nota"> · {vistaPreviaDePrescripcion(lectura.leida)}</span> : lectura && !paraTodosAbierta ? <span className="campo__error"> · {V.prescripcionNoSeEntiende}</span> : null}
              </summary>
              <label className="agregar-ejercicio__para-todos" data-para-todos>
                <span className="agregar-ejercicio__para-todos-rotulo visualmente-oculto">{V.prescripcionParaTodos}</span>
                <input type="text" value={linea} maxLength={80} placeholder={V.prescripcionEjemplo} onChange={(e) => setLinea(e.target.value)} aria-invalid={lectura && !lectura.ok ? true : undefined} aria-describedby="prescripcion-para-todos" autoComplete="off" spellCheck={false} />
                <span id="prescripcion-para-todos" className={lectura && !lectura.ok ? 'campo__error' : 'nota'}>
                  {!lectura ? (prescripcionDeLaSesion ? `Vacía, cada uno entra con «${prescripcionDeLaSesion}», la de la sesión.` : V.prescripcionAyuda) : lectura.ok ? vistaPreviaDePrescripcion(lectura.leida) : lectura.noSeEntiende}
                </span>
              </label>
            </details>
          </>
        ) : null
      }
    >
      <ContenidoDeAgregarEjercicio
        modo={modo}
        alCambiarDeModo={setModo}
        campo={campo}
        habituales={habituales}
        marcados={marcados}
        enLaSesion={enLaSesion}
        onMarcar={(e) => setMarcados((m) => alternarMarcado(m, e))}
        onCreado={(e) => setMarcados((m) => (m.some((x) => x.versionId === e.versionId) ? m : [...m, e]))}
      />
    </CuadroEnfocado>
  );
}

/** Lo de adentro del cajón: vive solo mientras está abierto, así que cada apertura empieza con el buscador vacío. */
function ContenidoDeAgregarEjercicio({
  modo,
  alCambiarDeModo,
  campo,
  habituales,
  marcados,
  enLaSesion,
  onMarcar,
  onCreado,
}: {
  enLaSesion: ReadonlySet<string>;
  modo: Modo;
  alCambiarDeModo: (m: Modo) => void;
  campo: RefObject<HTMLInputElement | null>;
  habituales: EjerciciosHabituales;
  marcados: readonly EjercicioDeCatalogo[];
  onMarcar: (e: EjercicioDeCatalogo) => void;
  /** Lo creado a mano o importado queda marcado. */
  onCreado: (e: EjercicioDeCatalogo) => void;
}) {
  const { token, sesionPerdida } = useEditorDeEntrenamiento();
  const id = useId();
  const [texto, setTexto] = useState('');
  // DL-197 (ET1-09): al abrir, el catálogo entero (los 186 de BE y los propios), con su clasificación; se filtra acá.
  const [catalogo, setCatalogo] = useState<LecturaDelCatalogo>({ tipo: 'cargando' });
  const [grupo, setGrupo] = useState<GrupoMuscular | null>(null);
  const [equipamiento, setEquipamiento] = useState<Equipamiento | null>(null);
  const [patron, setPatron] = useState<PatronDeMovimiento | null>(null);
  const [articulaciones, setArticulaciones] = useState<Articulaciones | null>(null);
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [creado, setCreado] = useState<string | null>(null);
  const estaMarcado = (versionId: string) => marcados.some((m) => m.versionId === versionId);
  // GR-04: qué ejercicios ya hizo la persona, para la marca «Con historial» de cada resultado.
  const { historial, recargar: releerElHistorial } = useHistorialDelBuscador();
  // C6: «No encuentro el ejercicio», plegado; sin resultados, abierto.
  const [noEncuentro, setNoEncuentro] = useState(false);
  const pedido = useRef(0);

  // Al volver de crear o de importar, el foco vuelve al campo. Al abrirse, lo pone el cajón (`focoInicial`).
  useEffect(() => {
    if (modo === 'buscar') campo.current?.focus({ preventScroll: true });
  }, [modo, campo]);

  /**
   * El catálogo entero, página por página (de a 50, con el cursor). DL-199 (ET3-24): una vez por sesión
   * (`catalogo-en-la-sesion.ts`); `reintentar` lo vuelve a pedir. Una lectura que falla lo dice y se reintenta.
   */
  const leerElCatalogo = useCallback(
    async (reintentar = false) => {
      const esta = ++pedido.current;
      if (reintentar) invalidarElCatalogo(token);
      setCatalogo((c) => (c.tipo === 'lista' ? c : { tipo: 'cargando' }));
      const r = await leerElCatalogoDeLaSesion(token, sesionPerdida);
      if (esta !== pedido.current || r.tipo === 'sesion-perdida') return;
      setCatalogo(r.tipo === 'falla' ? r : { tipo: 'lista', ejercicios: r.ejercicios, completo: r.completo });
    },
    [token, sesionPerdida],
  );
  useEffect(() => {
    void leerElCatalogo();
    return () => {
      pedido.current += 1;
    };
  }, [leerElCatalogo]);
  /** «Limpiar»: sin texto ni filtros, el foco en el campo. */
  const limpiar = () => {
    setTexto('');
    setGrupo(null);
    setEquipamiento(null);
    setPatron(null);
    setArticulaciones(null);
    setSoloFavoritos(false);
    campo.current?.focus();
  };
  const elegir = (e: EjercicioDeCatalogo) => {
    // DL-199 (ET3-24): lo creado o importado hace que la próxima lectura del catálogo vaya a la API.
    invalidarElCatalogo(token);
    onCreado(e);
    setCreado(e.name);
    setCatalogo((c) => (c.tipo === 'lista' && !c.ejercicios.some((x) => x.exerciseId === e.exerciseId) ? { ...c, ejercicios: enOrdenAlfabetico([...c.ejercicios, { ...e, matchedAlternativeName: null, origin: { loadedBy: 'YOU', approximateCorrespondence: null }, loadedByProfessional: true }]) } : c));
  };

  if (modo === 'manual') {
    return (
      <CrearManualmente
        id={`${id}-nuevo`}
        nombreInicial={catalogo.tipo === 'lista' && filtrarElCatalogo(catalogo.ejercicios, { ...SIN_FILTROS, texto }).length === 0 ? texto.trim() : ''}
        onCreado={(e) => {
          elegir(e);
          alCambiarDeModo('buscar');
        }}
        onVolver={() => alCambiarDeModo('buscar')}
      />
    );
  }
  if (modo === 'importar') {
    return (
      <div className="agregar-item__otro">
        <button type="button" className="boton boton--discreto agregar-item__volver" onClick={() => alCambiarDeModo('buscar')}>
          <Icono nombre="izquierda" tamano={18} />
          Volver a la búsqueda
        </button>
        <ImportacionDeWger
          id={`${id}-importar`}
          onIncorporado={(e) => {
            elegir(e);
            alCambiarDeModo('buscar');
          }}
          onCargarManualmente={() => alCambiarDeModo('manual')}
        />
      </div>
    );
  }

  // DL-197 (ET1-09): el catálogo entero, filtrado en el navegador mientras se escribe o se elige un filtro.
  const filtros: FiltrosDelCatalogo = { texto, grupo, equipamiento, patron, articulaciones, favoritos: soloFavoritos ? new Set(habituales.habituales.map((h) => h.exerciseId)) : null };
  const todos = catalogo.tipo === 'lista' ? catalogo.ejercicios : [];
  const ejercicios = filtrarElCatalogo(todos, filtros);
  const hayFiltros = texto.trim() !== '' || grupo !== null || equipamiento !== null || patron !== null || articulaciones !== null || soloFavoritos;
  const sinResultados = catalogo.tipo === 'lista' && ejercicios.length === 0;
  const noEncuentroAbierto = noEncuentro || sinResultados;
  // GR-04: la marca de cada resultado, si la persona ya lo hizo.
  const marcaDe = (exerciseId: string): string | null => (historial.tipo === 'listo' ? marcaDeHistorial(historial.porEjercicio, exerciseId, historial.hoy) : null);
  const marcaCortaDe = (exerciseId: string): string | null => {
    const e = historial.tipo === 'listo' ? historial.porEjercicio.get(exerciseId.toLowerCase()) : undefined;
    if (!e || e.sessions <= 0 || historial.tipo !== 'listo') return null;
    const sesiones = `${e.sessions} ${e.sessions === 1 ? 'sesión' : 'sesiones'}`;
    return e.lastDate ? `${sesiones} · la última, ${e.lastDate === historial.hoy ? 'hoy' : diaYMes(e.lastDate, historial.hoy)}` : sesiones;
  };
  const algunoConHistorial = ejercicios.some((ej) => marcaDe(ej.exerciseId) !== null);
  const filtro = <T extends string>(clave: string, rotulo: string, valor: T | null, opciones: Readonly<Record<T, string>>, alElegir: (v: T | null) => void) => (
    <label className="catalogo-para-elegir__filtro" data-filtro={clave}>
      <span className="visualmente-oculto">{rotulo}</span>
      <select value={valor ?? ''} onChange={(e) => alElegir((e.target.value || null) as T | null)} data-valor={valor ?? ''}>
        <option value="">{rotulo}</option>
        {(Object.keys(opciones) as T[]).map((k) => (
          <option key={k} value={k}>
            {opciones[k]}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="agregar-item agregar-ejercicio catalogo-para-elegir">
      <form onSubmit={(e) => e.preventDefault()} className="catalogo-para-elegir__buscador" role="search">
        <label htmlFor={`${id}-texto`} className="visualmente-oculto">
          {COPY_CATALOGO_PARA_ELEGIR.buscar}
        </label>
        <span className="agregar-item__campo">
          <Icono nombre="buscar" tamano={20} />
          <input ref={campo} id={`${id}-texto`} type="search" value={texto} maxLength={80} onChange={(e) => setTexto(e.target.value)} placeholder={COPY_CATALOGO_PARA_ELEGIR.buscar} autoComplete="off" spellCheck={false} data-buscar-en-el-catalogo />
        </span>
      </form>
      <div className="catalogo-para-elegir__filtros" role="group" aria-label={COPY_CATALOGO_PARA_ELEGIR.filtros} data-filtros-del-catalogo>
        {filtro('grupo', COPY_CATALOGO_PARA_ELEGIR.grupo, grupo, NOMBRE_DEL_GRUPO_MUSCULAR, setGrupo)}
        {filtro('equipamiento', COPY_CATALOGO_PARA_ELEGIR.equipamiento, equipamiento, NOMBRE_DEL_EQUIPAMIENTO, setEquipamiento)}
        {filtro('patron', COPY_CATALOGO_PARA_ELEGIR.patron, patron, NOMBRE_DEL_PATRON, setPatron)}
        {filtro('articulaciones', COPY_CATALOGO_PARA_ELEGIR.articulaciones, articulaciones, NOMBRE_DE_LAS_ARTICULACIONES, setArticulaciones)}
        <button type="button" className="boton boton--quieto boton--compacto catalogo-para-elegir__favoritos" aria-pressed={soloFavoritos} onClick={() => setSoloFavoritos((x) => !x)} data-solo-favoritos>
          <Icono nombre="habitual" tamano={18} />
          {COPY_CATALOGO_PARA_ELEGIR.favoritos}
          {habituales.habituales.length > 0 ? <span className="nota"> · {habituales.habituales.length}</span> : null}
        </button>
        {hayFiltros ? (
          <button type="button" className="boton boton--discreto boton--compacto" onClick={limpiar} data-limpiar-filtros>
            {COPY_CATALOGO_PARA_ELEGIR.limpiar}
          </button>
        ) : null}
      </div>
      {/* RP-19: la cuenta y lo que se acaba de crear, en un renglón reservado: la lista no salta. */}
      <p className="nota catalogo-para-elegir__cuenta" role="status" aria-live="polite" data-cuenta-del-catalogo={catalogo.tipo === 'lista' ? ejercicios.length : ''}>
        {catalogo.tipo === 'lista' ? COPY_CATALOGO_PARA_ELEGIR.cuenta(ejercicios.length, todos.length) : catalogo.tipo === 'cargando' ? COPY_CATALOGO_PARA_ELEGIR.leyendo : ' '}
        {creado ? ` · ${V.creadoYMarcado(creado)}` : ''}
        {/* DL-199 (ET3-25): si la lectura cortó a mitad, se dice en el mismo renglón, con «Reintentar». */}
        {catalogo.tipo === 'lista' && catalogo.completo === false ? (
          <span data-catalogo-incompleto>
            {' · '}
            {COPY_CATALOGO_EN_LA_SESION.incompleto(catalogo.ejercicios.length)}{' '}
            <button type="button" className="boton boton--discreto boton--compacto" onClick={() => void leerElCatalogo(true)}>
              {COPY_CATALOGO_EN_LA_SESION.reintentar}
            </button>
          </span>
        ) : null}
        {marcados.length > 0 ? <span className="visualmente-oculto">{` · ${V.marcados(marcados.length)}: ${marcados.map((m) => m.name).join(', ')}.`}</span> : null}
      </p>
      {soloFavoritos && habituales.lectura === 'falla' ? (
        <Aviso tipo="error">
          <p>No pudimos leer tus ejercicios habituales. {habituales.motivoDeLectura}</p>
          <button type="button" className="boton boton--secundario" onClick={() => void habituales.recargar()}>
            Reintentar
          </button>
        </Aviso>
      ) : null}
      {soloFavoritos && habituales.lectura === 'lista' && habituales.habituales.length === 0 ? <p className="nota">{COPY_HABITUALES.sinEjerciciosHabituales}</p> : null}
      {catalogo.tipo === 'cargando' ? <Cargando /> : null}
      {catalogo.tipo === 'falla' ? (
        <Aviso tipo="error">
          <p>No pudimos leer el catálogo. {catalogo.motivo}</p>
          <button type="button" className="boton boton--secundario" onClick={() => void leerElCatalogo(true)}>
            Reintentar
          </button>
        </Aviso>
      ) : null}
      {catalogo.tipo === 'lista' && historial.tipo === 'falla' ? (
        <p className="nota ejercicios-del-catalogo__sin-historial" role="status" data-historial-sin-leer>
          {COPY_HISTORIAL_DEL_BUSCADOR.noSeLeyo}{' '}
          <button type="button" className="boton boton--discreto" onClick={releerElHistorial}>
            {COPY_HISTORIAL_DEL_BUSCADOR.reintentar}
          </button>
        </p>
      ) : null}
      {catalogo.tipo === 'lista' && algunoConHistorial ? (
        <div className="ejercicios-del-catalogo__que-cuenta" data-que-cuenta-el-historial>
          <span className="nota">
            <Icono nombre="linea-de-tiempo" tamano={15} />
            {COPY_MARCA_DEL_BUSCADOR.enUnaLinea}
          </span>
          <ComoLeerlo titulo={COPY_MARCA_DEL_BUSCADOR.comoSeCuenta}>
            <p>{COPY_HISTORIAL_DEL_BUSCADOR.queCuenta}</p>
          </ComoLeerlo>
        </div>
      ) : null}
      {sinResultados ? (
        <p data-sin-resultados>
          {hayFiltros ? COPY_CATALOGO_PARA_ELEGIR.ninguno : 'El catálogo no trajo ejercicios.'} Podés crearlo o importarlo, en «{V.noEncuentro}».
        </p>
      ) : null}
      {catalogo.tipo === 'lista' && ejercicios.length > 0 ? (
        <ul className="catalogo-para-elegir__lista" aria-label={COPY_CATALOGO_PARA_ELEGIR.lista} data-resultados="lista">
          {ejercicios.map((ej) => {
            const favorito = habituales.esHabitual(ej.exerciseId);
            const elegido = estaMarcado(ej.versionId);
            const renglon = clasificacionEnUnRenglon(ej.classification);
            const conHistorial = marcaDe(ej.exerciseId);
            return (
              <li key={ej.versionId} className="catalogo-para-elegir__ejercicio" data-ejercicio-del-catalogo={ej.versionId} data-elegido={elegido ? '' : undefined}>
                <span className="catalogo-para-elegir__textos">
                  <span className="catalogo-para-elegir__nombre">{ej.name}</span>
                  <span className="nota catalogo-para-elegir__clasificacion" data-clasificacion>
                    {renglon ?? COPY_CATALOGO_PARA_ELEGIR.sinClasificar}
                    {yaEsta(enLaSesion, ej) ? <span data-ya-en-la-sesion> · {COPY_CATALOGO_PARA_ELEGIR.yaEnLaSesion}</span> : null}
                    {conHistorial ? (
                      <span className="ejercicios-del-catalogo__historial" data-con-historial>
                        <Icono nombre="linea-de-tiempo" tamano={15} />
                        <span aria-hidden="true">{marcaCortaDe(ej.exerciseId) ?? conHistorial}</span>
                        <span className="visualmente-oculto">{conHistorial}</span>
                      </span>
                    ) : null}
                  </span>
                </span>
                <button
                  type="button"
                  className="boton boton--quieto catalogo-para-elegir__estrella"
                  aria-pressed={favorito}
                  aria-label={`${favorito ? COPY_HABITUALES.quitarMarca : COPY_HABITUALES.marcar}: ${ej.name}`}
                  title={favorito ? COPY_HABITUALES.quitarMarca : COPY_HABITUALES.marcar}
                  onClick={() => void habituales.alternar(ej)}
                  data-estrella-del-ejercicio
                >
                  <Icono nombre="habitual" tamano={18} />
                </button>
                <button type="button" className="boton boton--compacto catalogo-para-elegir__elegir" aria-pressed={elegido} onClick={() => onMarcar(ej)} data-marcar-ejercicio>
                  <Icono nombre={elegido ? 'tilde' : 'mas'} tamano={18} />
                  {elegido ? COPY_CATALOGO_PARA_ELEGIR.elegido : COPY_CATALOGO_PARA_ELEGIR.elegir}
                  <span className="visualmente-oculto"> {ej.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* C6: crear o importar, bajo «No encuentro el ejercicio», al final de la búsqueda: siguen disponibles sin competir
          con terminar la selección. Sin resultados, ya abierto. */}
      <section className="agregar-ejercicio__no-encuentro" aria-labelledby={`${id}-no-encuentro`} data-no-encuentro>
        <h3 className="agregar-item__titulo">
          {sinResultados ? (
            <span id={`${id}-no-encuentro`}>{V.noEncuentro}</span>
          ) : (
            <button type="button" id={`${id}-no-encuentro`} className="boton boton--discreto" aria-expanded={noEncuentroAbierto} aria-controls={`${id}-crear-o-importar`} onClick={() => setNoEncuentro((x) => !x)} data-abrir-no-encuentro>
              <Icono nombre={noEncuentroAbierto ? 'abajo' : 'derecha'} tamano={18} />
              {V.noEncuentro}
            </button>
          )}
        </h3>
        {noEncuentroAbierto ? (
          <div id={`${id}-crear-o-importar`} className="agregar-ejercicio__crear-o-importar">
            <p className="nota">{V.noEncuentroAyuda}</p>
            <div className="acciones">
              <button type="button" className="boton boton--quieto" onClick={() => alCambiarDeModo('manual')} data-crear-ejercicio>
                <Icono nombre="mas" tamano={18} />
                {EP.crear}
              </button>
              <button type="button" className="boton boton--quieto" onClick={() => alCambiarDeModo('importar')} data-importar-ejercicio>
                <Icono nombre="descargar" tamano={18} />
                {COPY_INTEGRACIONES.importarDesdeWger}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

/**
 * «Crear un ejercicio propio» (ED-21): solo se pide el nombre y, mientras se escribe, se muestran los parecidos del
 * catálogo, para usar uno en vez de duplicarlo (`parecidos-del-catalogo.ts`). Lo creado, o el parecido elegido, queda
 * marcado y entra con «Agregar», como lo demás (EDT-17).
 */
function CrearManualmente({ id, nombreInicial, onCreado, onVolver }: { id: string; nombreInicial: string; onCreado: (e: EjercicioDeCatalogo) => void; onVolver: () => void }) {
  const { token, sesionPerdida, accesoRetirado } = useEditorDeEntrenamiento();
  const intento = useClaveDeIntento();
  const [nombre, setNombre] = useState(nombreInicial);
  const [falta, setFalta] = useState<string | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  // ED-21: los parecidos del catálogo para el nombre escrito; una respuesta vieja no pisa a la nueva.
  const [sugerencias, setSugerencias] = useState<{ readonly para: string; readonly estado: 'buscando' | 'falla' | 'listas'; readonly ejercicios: readonly EjercicioDeCatalogo[] } | null>(null);
  const pedidoDeParecidos = useRef(0);
  useEffect(() => {
    const este = ++pedidoDeParecidos.current;
    if (!haySugerencias(nombre)) return setSugerencias(null);
    const espera = window.setTimeout(() => {
      const { principal, otra } = busquedasDeParecidos(nombre);
      setSugerencias({ para: nombre, estado: 'buscando', ejercicios: [] });
      void (async () => {
        const r = await api.buscarEjercicios(token, principal.slice(0, 80));
        if (este !== pedidoDeParecidos.current || sesionPerdida(r)) return;
        if (!r.ok) return setSugerencias({ para: nombre, estado: 'falla', ejercicios: [] });
        let todos: readonly EjercicioDeCatalogo[] = r.datos.data;
        if (todos.length < POCOS_RESULTADOS && otra) {
          const r2 = await api.buscarEjercicios(token, otra);
          if (este !== pedidoDeParecidos.current || sesionPerdida(r2)) return;
          if (r2.ok) todos = [...todos, ...r2.datos.data];
        }
        setSugerencias({ para: nombre, estado: 'listas', ejercicios: todos });
      })();
    }, PAUSA_DE_LAS_SUGERENCIAS);
    return () => window.clearTimeout(espera);
  }, [nombre, token, sesionPerdida]);
  const vigentes = sugerencias && sugerencias.para === nombre ? sugerencias : null;
  const losParecidos = vigentes?.estado === 'listas' ? parecidos(nombre, vigentes.ejercicios) : [];
  const igual = vigentes?.estado === 'listas' ? elQueSeLlamaIgual(nombre, vigentes.ejercicios) : null;

  async function crear(e: FormEvent) {
    e.preventDefault();
    setFallo(null);
    if (!nombre.trim()) return setFalta('Escribí el nombre del ejercicio.');
    setFalta(null);
    setCreando(true);
    const r = await api.crearEjercicio(token, nombre.trim(), intento.actual());
    intento.registrar(r);
    setCreando(false);
    if (sesionPerdida(r) || accesoRetirado(r)) return;
    if (!r.ok) return setFallo(mensajeDeFallo(r));
    onCreado(r.datos.data);
  }

  return (
    <form className="agregar-item__otro" onSubmit={(e) => void crear(e)} noValidate>
      <button type="button" className="boton boton--discreto agregar-item__volver" onClick={onVolver}>
        <Icono nombre="izquierda" tamano={18} />
        Volver a la búsqueda
      </button>
      <h3 className="agregar-item__titulo">{EP.crear}</h3>
      <p className="nota">{EP.queEs}</p>
      <Campo id={`${id}-nombre`} etiqueta="Nombre del ejercicio" value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} error={falta} autoComplete="off" />
      {/* ED-21: los parecidos, antes de crear. Elegir uno lo marca y vuelve a la búsqueda; crear sigue siendo un botón. */}
      {/* La sección tiene un rótulo fijo; la región viva es solo la frase de estado: en cada tecla, el lector dice una
          frase y no repite cada «Usar este». */}
      <section className="parecidos-del-catalogo" aria-label={EP.parecidosDelCatalogo}>
        <p className="nota parecidos-del-catalogo__estado" role="status">
          {vigentes?.estado === 'buscando' ? EP.buscandoParecidos : null}
          {vigentes?.estado === 'falla' ? EP.noSePudieronBuscar : null}
          {vigentes?.estado === 'listas' && losParecidos.length === 0 ? EP.sinParecidos(nombre) : null}
          {losParecidos.length > 0 ? <span className="visualmente-oculto">{EP.cuantosParecidos(losParecidos.length)}</span> : null}
        </p>
        {losParecidos.length > 0 ? (
          <>
            <h4 id={`${id}-parecidos`} className="parecidos-del-catalogo__titulo">
              {EP.antesDeCrear}
            </h4>
            {igual ? <p className="parecidos-del-catalogo__igual">{EP.yaExiste(igual.name)}</p> : null}
            <ul className="parecidos-del-catalogo__lista">
              {losParecidos.map((p) => (
                <li key={p.versionId}>
                  <span>{p.name}</span>
                  <button type="button" className="boton boton--secundario boton--compacto" aria-label={`${EP.usarEste}: ${p.name}`} onClick={() => onCreado(p)}>
                    {EP.usarEste}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
      <Ayuda titulo="Por qué solo se pide el nombre">
        <p>Las zonas musculares y el material didáctico se suman más adelante.</p>
      </Ayuda>
      {fallo ? (
        <Aviso tipo="error">
          <p>{fallo}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={creando}>
          {creando ? 'Creando…' : igual ? EP.crearIgual : EP.crearYMarcar}
        </button>
      </div>
    </form>
  );
}
