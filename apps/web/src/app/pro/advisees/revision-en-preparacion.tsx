'use client';

/**
 * Una revisión en preparación, en Nutrición y en Entrenamiento (WP-ESCRITORIO-AREAS, parte 10; maqueta 06; C-14, C-15;
 * DEC-17 a DEC-20). Son las piezas comunes de la pantalla: la lectura del contexto con su período, la cabecera, los tres
 * pasos (lo que miraste, lo que observaste, lo que decidís), el resultado con el efecto del elegido y la barra fija con
 * «Registrar revisión». Cada área arma su formulario con ellas y conserva lo suyo (sus identificadores, sus textos, el
 * nuevo objetivo).
 * - **Ver no es revisar:** la barra lo dice todo el tiempo, nada viene marcado ni elegido, y abrir no escribe.
 * - **Un solo control de período** (el de la ficha, con el tope de 92 días). Vive en la dirección de la página, así que
 *   «Actualizar» y volver atrás lo conservan, y queda fuera del formulario: sus campos de fecha no lo envían con Enter.
 * - **Cambiar el período no borra lo escrito:** el formulario sigue montado mientras se lee el período nuevo; se quita
 *   solo lo marcado que quedó afuera, y se dice (DEC-20). Mientras se lee, o si la lectura falla, no se puede registrar:
 *   lo que se ve todavía es del período anterior.
 * - **Los efectos de los resultados no se reescriben** (vienen del dominio): el del elegido se lee al lado, y los de
 *   todos, a un clic (C-15).
 * - **Un error se dice en el resumen y en su campo** (B10-10:164-165; DL-091 punto 3): las dos áreas igual.
 */
import { COPY_NUTRICION } from '@be/domain';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { motivoDeFalla, textoDeFalla } from '../../../lib/fallas';
import type { Resultado } from '../../../lib/api';
import { diaDelAnioEnCurso } from '../../../lib/formato';
import { ControlDePeriodo } from './control-de-periodo';
import { periodoPreparado, procedenciaDelPeriodo } from './periodo-de-la-revision';
import { ATAJOS_DE_UN_AREA, cambiosDePeriodo, MAXIMO_DE_DIAS_DE_UN_AREA, periodoALaVista, periodoPedidoEnUnArea, type PeriodoDeUnArea } from './periodo-de-un-area';
import { hoyEn } from './seguimiento/estado';

/** Lo que una revisión en preparación necesita de su contexto, en las dos áreas. */
export interface ContextoDeUnaRevision {
  readonly period: { readonly start: string; readonly end: string };
  readonly previousReviews: readonly { readonly recordedAt: string }[];
}

/** Lo que el área le da a la lectura: cómo leer el contexto y su dirección. */
interface DelArea {
  readonly parametros: { get(clave: string): string | null };
  readonly ir: (cambios: Readonly<Record<string, string | null>>, opciones?: { readonly agregarAlHistorial?: boolean }) => void;
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
}

/**
 * La ayuda de la interpretación, en las dos áreas: describe lo observado y no es un diagnóstico. Es la frase de BE
 * (`COPY_NUTRICION`); Entrenamiento no tenía ninguna, y la toma.
 */
export const AYUDA_DE_LA_INTERPRETACION = COPY_NUTRICION.interpretacionNoDiagnostica;

/** Lo que la dirección pierde al salir de una revisión en preparación: vuelve a la lista (DEC-17). */
export const SALIR_DE_LA_REVISION: Readonly<Record<string, null>> = { preparar: null, p: null, desde: null, hasta: null };

/**
 * El contexto de una revisión en preparación, leído para el período de la dirección. Sin período en la dirección, BE lo
 * prepara desde la última revisión y lo deja ahí (sin sumar una entrada al historial). El último contexto leído bien se
 * conserva mientras se lee otro: el formulario no se desmonta.
 */
export function useContextoDeLaRevision<C extends ContextoDeUnaRevision>(leer: (periodo: { periodStart?: string; periodEnd?: string }) => Promise<Resultado<{ data: C }>>, area: DelArea) {
  const { parametros, sesionPerdida } = area;
  const hoy = hoyEn();
  const claveDelPeriodo = `${parametros.get('p') ?? ''}|${parametros.get('desde') ?? ''}|${parametros.get('hasta') ?? ''}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pedido = useMemo(() => periodoPedidoEnUnArea(parametros, hoy), [claveDelPeriodo, hoy]);
  const [contexto, setContexto] = useState<C | null>(null);
  const [primera, setPrimera] = useState<Resultado<unknown> | null>(null);
  const [leyendo, setLeyendo] = useState(true);
  const [falloDelPeriodo, setFalloDelPeriodo] = useState<string | null>(null);
  const generacion = useRef(0);
  // La función de lectura y `ir` cambian de identidad con cada render o cada cambio de dirección: no son motivo para leer.
  const leerAhora = useRef(leer);
  leerAhora.current = leer;
  const irAhora = useRef(area.ir);
  irAhora.current = area.ir;
  const hayContexto = useRef(false);

  const cargar = useCallback(async () => {
    const esta = ++generacion.current;
    setLeyendo(true);
    setFalloDelPeriodo(null);
    if (!hayContexto.current) setPrimera(null);
    const res = await leerAhora.current(pedido ? { periodStart: pedido.desde, periodEnd: pedido.hasta } : {});
    if (esta !== generacion.current || sesionPerdida(res)) return;
    if (!res.ok) {
      setLeyendo(false);
      // Sin nada leído todavía, la falla es la de la sección; con un período anterior a la vista, se dice en el paso 1.
      if (hayContexto.current) setFalloDelPeriodo(textoDeFalla(motivoDeFalla(res), 'el período elegido'));
      else setPrimera(res);
      return;
    }
    if (!pedido) {
      const preparado = periodoPreparado(res.datos.data.previousReviews, hoy);
      if (preparado && (preparado.desde !== res.datos.data.period.start || preparado.hasta !== res.datos.data.period.end)) {
        irAhora.current({ desde: preparado.desde, hasta: preparado.hasta, p: null });
        return;
      }
    }
    hayContexto.current = true;
    setContexto(res.datos.data);
    setPrimera(res);
    setLeyendo(false);
  }, [pedido, hoy, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);

  const periodo = periodoALaVista(pedido, contexto?.period ?? null, hoy);
  const procedencia = contexto ? procedenciaDelPeriodo(contexto.period, periodoPreparado(contexto.previousReviews, hoy), pedido !== null, (d) => diaDelAnioEnCurso(d, hoy)) : null;
  const elegirPeriodo = (p: PeriodoDeUnArea) => area.ir(cambiosDePeriodo(p), { agregarAlHistorial: true });
  /** Por qué todavía no se puede registrar: lo que se ve no es del período elegido. */
  const bloqueo = leyendo && contexto ? 'Leyendo el período elegido…' : falloDelPeriodo ? 'Lo que ves es del período anterior: reintentá la lectura o elegí otro período.' : null;
  return { hoy, contexto, primera, leyendo, falloDelPeriodo, periodo, procedencia, elegirPeriodo, bloqueo, reintentar: () => void cargar() };
}

/** Los errores del formulario por campo, y los atributos que un campo con error lleva. */
export function campoConError(porCampo: Readonly<Record<string, string | undefined>>, id: string, ayuda?: string) {
  const texto = porCampo[id];
  const describe = [ayuda, texto ? `${id}-error` : null].filter(Boolean).join(' ');
  return {
    texto: texto ?? null,
    clase: `campo${texto ? ' campo--error' : ''}`,
    atributos: { 'aria-invalid': texto ? true : undefined, 'aria-describedby': describe || undefined } as const,
  };
}

/** El aviso de un campo con error, con el mismo texto que el resumen. */
export function ErrorDelCampo({ id, texto }: { id: string; texto: string | null }) {
  if (!texto) return null;
  return (
    <p id={`${id}-error`} className="campo__error">
      <span aria-hidden="true">⚠ </span>
      {texto}
    </p>
  );
}

/** Un texto largo con su rótulo, su ayuda (si tiene) y su error en el campo. */
export function AreaDeTexto({
  id,
  etiqueta,
  ayuda = null,
  valor,
  onCambiar,
  filas = 3,
  maximo,
  porCampo,
}: {
  id: string;
  etiqueta: ReactNode;
  ayuda?: string | null;
  valor: string;
  onCambiar: (v: string) => void;
  filas?: number;
  maximo: number;
  porCampo: Readonly<Record<string, string | undefined>>;
}) {
  const c = campoConError(porCampo, id, ayuda ? `${id}-ayuda` : undefined);
  return (
    <div className={c.clase}>
      <div className="campo__rotulo">
        <label htmlFor={id}>{etiqueta}</label>
        {ayuda ? (
          <span id={`${id}-ayuda`} className="campo__ayuda">
            {ayuda}
          </span>
        ) : null}
      </div>
      <textarea id={id} rows={filas} value={valor} onChange={(e) => onCambiar(e.target.value)} maxLength={maximo} {...c.atributos} />
      <ErrorDelCampo id={id} texto={c.texto} />
    </div>
  );
}

/**
 * «Nueva revisión de Nutrición · En preparación · sin registrar» y, a la derecha, el período con su control y de dónde
 * salió. Va fuera del formulario.
 */
export function CabeceraDeLaRevision({
  titulo,
  idDelTitulo,
  periodo,
  procedencia,
  onElegirPeriodo,
}: {
  titulo: string;
  idDelTitulo: string;
  periodo: PeriodoDeUnArea | null;
  procedencia: string | null;
  onElegirPeriodo: (p: PeriodoDeUnArea) => void;
}) {
  return (
    <div className="revision-nueva__cabecera">
      <div className="revision-nueva__titulo">
        <h2 id={idDelTitulo}>{titulo}</h2>
        <span className="insignia revision-nueva__estado">En preparación · sin registrar</span>
      </div>
      <div className="revision-nueva__periodo">
        {periodo ? <ControlDePeriodo periodo={periodo} atajos={ATAJOS_DE_UN_AREA} maximoDeDias={MAXIMO_DE_DIAS_DE_UN_AREA} onElegir={onElegirPeriodo} /> : null}
        {procedencia ? <p className="nota revision-nueva__procedencia">{procedencia}</p> : null}
      </div>
    </div>
  );
}

/** Un paso de la revisión, con su número y, en la misma línea, lo que pide: «1 Lo que miraste · Marcá solo lo que…». */
export function PasoDeLaRevision({ numero, titulo, ayuda = null, idDeLaAyuda, children }: { numero: number; titulo: string; ayuda?: ReactNode; idDeLaAyuda?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section className="paso-de-revision" aria-labelledby={`${id}-titulo`} data-paso={numero}>
      <div className="paso-de-revision__cabecera">
        <h3 id={`${id}-titulo`} className="paso-de-revision__titulo">
          <span className="paso-de-revision__numero" aria-hidden="true">
            {numero}
          </span>
          <span className="visualmente-oculto">Paso {numero}: </span>
          {titulo}
        </h3>
        {ayuda ? (
          <p id={idDeLaAyuda} className="nota paso-de-revision__ayuda">
            {ayuda}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/**
 * El resultado: seis, en dos columnas, sin ninguno elegido (BE no sugiere un resultado). El efecto del elegido se lee
 * debajo, en un recuadro; los de todos, a un clic, en «Qué hace cada resultado».
 */
export function ResultadoDeLaRevision<R extends string>({
  id,
  nombre,
  resultados,
  etiquetas,
  efectos,
  valor,
  alElegir,
  error,
  explicacion = null,
}: {
  id: string;
  /** El `name` de los botones de radio. */
  nombre: string;
  resultados: readonly R[];
  etiquetas: Readonly<Record<R, string>>;
  efectos: Readonly<Record<R, string>>;
  valor: R | '';
  alElegir: (r: R) => void;
  error: string | null;
  /** Lo que el área aclara sobre los resultados («Una progresión que conserva la estructura se registra como…»). */
  explicacion?: string | null;
}) {
  const propio = useId();
  const [todos, setTodos] = useState(false);
  const describe = [explicacion ? `${id}-explicacion` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  return (
    <fieldset className={`resultado-de-revision${error ? ' campo--error' : ''}`} id={id} tabIndex={-1} aria-invalid={error ? true : undefined} aria-describedby={describe}>
      {/* El nombre del grupo es la leyenda; el título que se ve va en una fila con «Qué hace cada resultado» (una
          leyenda no se acomoda en una fila con otra cosa: el botón se le montaba encima a la primera opción). */}
      <legend className="visualmente-oculto">Resultado</legend>
      <div className="resultado-de-revision__cabecera">
        <span className="resultado-de-revision__titulo" aria-hidden="true">
          Resultado
        </span>
        <button type="button" className="boton boton--enlace resultado-de-revision__todos" aria-expanded={todos} aria-controls={`${propio}-efectos`} onClick={() => setTodos((t) => !t)}>
          Qué hace cada resultado
        </button>
      </div>
      {explicacion ? (
        <p id={`${id}-explicacion`} className="campo__ayuda">
          {explicacion}
        </p>
      ) : null}
      <ErrorDelCampo id={id} texto={error} />
      <div className="resultado-de-revision__opciones">
        {resultados.map((r) => (
          <label key={r} className="resultado-de-revision__opcion">
            <input type="radio" name={nombre} value={r} checked={valor === r} onChange={() => alElegir(r)} />
            <span>{etiquetas[r]}</span>
          </label>
        ))}
      </div>
      {valor ? (
        <p className="resultado-de-revision__efecto" data-resultado={valor}>
          <strong>{etiquetas[valor]}.</strong> {efectos[valor]}
        </p>
      ) : null}
      {todos ? (
        <dl id={`${propio}-efectos`} className="resultado-de-revision__lista">
          {resultados.map((r) => (
            <div key={r}>
              <dt>{etiquetas[r]}</dt>
              <dd>{efectos[r]}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </fieldset>
  );
}

/**
 * La barra al pie del formulario, pegada abajo mientras se escribe: lo que pasa y lo que no pasa al registrar. Con un
 * motivo para no registrar (se está leyendo el período, o falló), el botón sigue en su lugar, apagado y con el motivo.
 */
export function BarraDeLaRevision({ enviando, bloqueo, textoDelBoton, alCancelar }: { enviando: boolean; bloqueo: string | null; textoDelBoton: string; alCancelar: () => void }) {
  const id = useId();
  return (
    <div className="acciones acciones--fijas barra-de-revision">
      <p className="barra-de-revision__texto">
        <strong>Todavía no se registró nada.</strong> Registrar deja asentada la revisión; no cambia el plan.
        {bloqueo ? (
          <span id={`${id}-motivo`} className="barra-de-revision__motivo">
            {' '}
            {bloqueo}
          </span>
        ) : null}
      </p>
      <div className="barra-de-revision__acciones">
        <button type="button" className="boton boton--secundario" onClick={alCancelar} disabled={enviando}>
          Cancelar
        </button>
        <button type="submit" className="boton boton--primario" disabled={enviando} aria-busy={enviando} aria-disabled={bloqueo ? true : undefined} aria-describedby={bloqueo ? `${id}-motivo` : undefined}>
          {enviando ? 'Registrando…' : textoDelBoton}
        </button>
      </div>
    </div>
  );
}

/** Lo que se dice en el paso 1 mientras se lee otro período, o si esa lectura falló (con «Reintentar»). */
export function LecturaDelPeriodo({ leyendo, fallo, onReintentar }: { leyendo: boolean; fallo: string | null; onReintentar: () => void }) {
  if (fallo) {
    return (
      <div className="aviso aviso--error revision-nueva__lectura" role="alert">
        <p>{fallo}</p>
        <p>Lo que ves todavía es del período anterior.</p>
        <button type="button" className="boton boton--secundario" onClick={onReintentar}>
          Reintentar
        </button>
      </div>
    );
  }
  return leyendo ? (
    <p className="nota revision-nueva__lectura" role="status">
      Leyendo el período elegido…
    </p>
  ) : null;
}
