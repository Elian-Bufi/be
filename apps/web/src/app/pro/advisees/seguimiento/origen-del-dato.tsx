'use client';

/**
 * «De dónde sale este dato» (WP-ESCRITORIO-AMABLE, C-13; encargo §5 y §8; PRO-05): el origen de un punto de «Analizar».
 * - **Qué dice:** la métrica y la fecha, el valor con su clase, qué es ese número (la frase del dominio) y sus fuentes.
 * - **Las comidas de un día, con lo que aporta cada una.** Un punto diario de nutrición sale de varios registros. Antes
 *   eran «Registro 1» y «Registro 2», y había que abrir cada uno para saber qué comida era. Ahora se leen todos —cada
 *   uno por su propia operación (API-ING-03), que vuelve a decidir con el PDP— y se listan con su hora, su comida, la
 *   opción y lo que aportan a la métrica. El total es el valor del punto, el que dio la API: acá no se vuelve a sumar.
 * - **Hasta ocho fuentes se leen de una vez.** Con más (una semana agrupada trae decenas) se elige cuál abrir, como
 *   antes: leerlas todas serían decenas de lecturas protegidas para mirar una.
 * - **Dónde va:** en una ventana ancha, en el lugar de la lectura, al costado de los gráficos, que siguen a la vista; en
 *   una angosta, encima, en el panel de siempre (`PanelDeRegistro`). El contenido es este mismo componente.
 * Si el PDP ya no deja leer un registro se dice en su lugar, y se avisa a quien abrió (`onNoDisponible`): lo que hay en
 * pantalla puede ser viejo y se vuelve a pedir.
 *
 * WP-NUTRICION-COMPARACION (DL-158, C-D1 opción A): cada comida dice también lo indicado en el plan para la opción que se
 * registró (con la versión que cita el registro), o por qué no tiene: una comida diferente no es una opción del plan. El
 * día dice su indicado del día, si el plan no dejaba elegir. Lo indicado no se resta de lo registrado.
 */
import {
  CAPAS_DE_LA_COMPARACION,
  indicadoDeLaComidaEnPalabras,
  indicadoDelDiaEnCelda,
  COPY_REGISTRO_DE_COMIDAS,
  COPY_REGISTRO_PARA_EL_PROFESIONAL,
  NUTRIENTE_DE_LA_METRICA,
  nutrienteParaMostrar,
  numero,
  UNIDAD_DE_NUTRIENTE,
  type MetricaNutricional,
  type OrigenDeDato,
  type PuntoAnalitico,
  type RegistroDeComida,
} from '@be/domain';
import { useEffect, useId, useRef, useState } from 'react';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { horaEnZona } from '../../../../lib/formato';
import { CuerpoDelRegistroDeComida } from '../nutrition/detalle-de-registro';
import { limitarLectura, motivoDeFalla, textoDeFalla, useSeguimiento, type MotivoDeFalla } from './contexto';
import { ICONO_DE_CLASE } from './iconos-de-metrica';
import { Marca } from './marca';
import { ContenidoDelRegistro, EnlaceAlArea } from './registro-original';
import type { SerieDelAnalisis } from './series';
import { valorParaMostrar } from './valores';

/** Cuántas fuentes se leen de una vez para decir qué aporta cada una: las comidas de un día, con margen. */
export const FUENTES_DE_UNA_VEZ = 8;

/** Si las fuentes de un punto se listan todas, con su aporte: son comidas, más de una y no más de las que se leen de una vez. */
export const seListanLasFuentes = (p: PuntoAnalitico): boolean => p.sources.length > 1 && p.sources.length <= FUENTES_DE_UNA_VEZ && !p.sourcesTruncated && p.sources.every((o) => o.type === 'MEAL_RECORD');

export function OrigenDelDato({
  punto,
  serie,
  nombre,
  indice,
  fecha,
  calidad,
  elegido,
  onElegir,
  onNoDisponible,
  conEncabezado = true,
}: {
  punto: PuntoAnalitico;
  serie: SerieDelAnalisis | undefined;
  /** El nombre entero de la métrica («Calorías registradas»). */
  nombre: string;
  /** Si dice qué métrica y qué fecha son: en el panel no, porque ya es su título. */
  conEncabezado?: boolean;
  /** El lugar de la métrica entre las elegidas: de ahí sale su color. */
  indice: number;
  /** La fecha del punto, ya escrita. */
  fecha: string;
  /** La calidad del punto en palabras, las del dominio (`calidadEnPalabras`): «subtotal de lo registrado», «cada comida del plan registrada, con cantidades»… */
  calidad: string;
  /** La fuente abierta cuando se elige de a una. */
  elegido: OrigenDeDato | null;
  onElegir: (o: OrigenDeDato) => void;
  onNoDisponible?: () => void;
}) {
  const unidad = serie?.estado.tipo === 'lista' ? serie.estado.serie.unit : (serie?.definicion.unidad ?? '');
  const valor = punto.value === null || !serie ? null : valorParaMostrar(punto.value, serie.definicion, unidad);
  const corte = valor ? valor.lastIndexOf(' ') : -1;
  const clase = punto.detail.find((d) => d.label === 'Clase de dato');
  const actual = elegido ?? punto.sources[0] ?? null;
  return (
    <div className="origen-del-dato__cuerpo">
      {conEncabezado ? (
        <p className="origen-del-dato__metrica">
          <Marca indice={indice} />
          <span>
            {nombre} · {fecha}
          </span>
        </p>
      ) : null}
      <p className="origen-del-dato__valor">
        <span className="dato-de-lectura__valor">
          {valor === null ? (
            'Sin valor conocido'
          ) : corte > 0 ? (
            <>
              {valor.slice(0, corte)} <small>{valor.slice(corte + 1)}</small>
            </>
          ) : (
            valor
          )}
        </span>
        {clase ? (
          <span className="etiqueta-de-dato">
            {punto.dataClass ? <Icono nombre={ICONO_DE_CLASE[punto.dataClass]} tamano={15} /> : null}
            <span className="visualmente-oculto">Clase de dato: </span>
            {clase.value}
          </span>
        ) : null}
      </p>
      {serie ? <p className="origen-del-dato__que">{serie.definicion.explicacion}</p> : null}
      <p className="origen-del-dato__nota">
        {calidad.replace(/^./, (c) => c.toUpperCase())} · n = {numero(punto.n)}
        {punto.corrected ? ' · con una corrección vigente' : ''}
      </p>
      {seListanLasFuentes(punto) && serie ? (
        <ComidasDelPunto punto={punto} serie={serie} total={valor} onNoDisponible={onNoDisponible} />
      ) : (
        <>
          {punto.sources.length > 1 ? (
            <>
              <p className="origen-del-dato__nota">
                Este dato sale de {numero(punto.sources.length)} registros{punto.sourcesTruncated ? ' (y más, que no se listan)' : ''}. Elegí cuál abrir:
              </p>
              <ul className="selector-de-series">
                {punto.sources.map((o, i) => (
                  <li key={o.id}>
                    <button type="button" className="chip" aria-pressed={actual?.id === o.id} onClick={() => onElegir(o)}>
                      Registro {i + 1}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {/* La clave hace que cada fuente monte su registro de cero: una respuesta lenta de otra no lo pinta. */}
          {actual ? <ContenidoDelRegistro key={actual.id} origen={actual} onNoDisponible={onNoDisponible} /> : <p className="nota">Este dato no tiene un registro propio para abrir acá.</p>}
        </>
      )}
      {actual ? <EnlaceAlArea origen={actual} /> : null}
    </div>
  );
}

type LecturaDeComida = { readonly tipo: 'cargando' } | { readonly tipo: 'lista'; readonly registro: RegistroDeComida } | { readonly tipo: 'no-disponible' } | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla };

/**
 * Las comidas de las que sale un punto diario de nutrición, cada una con lo que aporta a la métrica. Se leen todas al
 * abrir (son las de un día) y ninguna se vuelve a pedir al desplegarla.
 */
function ComidasDelPunto({ punto, serie, total, onNoDisponible }: { punto: PuntoAnalitico; serie: SerieDelAnalisis; total: string | null; onNoDisponible?: () => void }) {
  const { token, sesionPerdida } = useSeguimiento();
  const id = useId();
  const [lecturas, setLecturas] = useState<Readonly<Record<string, LecturaDeComida>>>({});
  const [vuelta, setVuelta] = useState(0);
  const [abierta, setAbierta] = useState<string | null>(null);
  const aviso = useRef(onNoDisponible);
  aviso.current = onNoDisponible;
  // Se avisa una sola vez, aunque varias fuentes digan lo mismo: quien abrió vuelve a pedir las series una vez.
  const avisado = useRef(false);
  // Lo que ya se leyó no se vuelve a pedir en un reintento: sigue a la vista y no gasta otra lectura.
  const leidas = useRef(new Set<string>());
  const fuentes = punto.sources;
  const clave = `${punto.pointId}|${fuentes.map((o) => o.id).join(',')}|${vuelta}`;
  useEffect(() => {
    let vigente = true;
    setLecturas((antes) => Object.fromEntries(Object.entries(antes).filter(([, l]) => l.tipo === 'lista')));
    for (const o of fuentes) {
      if (leidas.current.has(o.id)) continue;
      void limitarLectura(() => api.consultarRegistroDeComida(token, o.id)).then((r) => {
        if (!vigente || sesionPerdida(r)) return;
        const sinAcceso = !r.ok && r.tipo === 'API' && (r.codigo === 'RESOURCE_NOT_FOUND' || r.status === 403);
        if (sinAcceso && !avisado.current) {
          avisado.current = true;
          aviso.current?.();
        }
        if (r.ok) leidas.current.add(o.id);
        setLecturas((l) => ({ ...l, [o.id]: r.ok ? { tipo: 'lista', registro: r.datos.data } : sinAcceso ? { tipo: 'no-disponible' } : { tipo: 'error', motivo: motivoDeFalla(r) } }));
      });
    }
    return () => {
      vigente = false;
    };
    // `clave` resume lo que cambia la lectura: el punto, sus fuentes y cada reintento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, token]);

  const parametro = serie.definicion.parametro as MetricaNutricional;
  const nutriente = parametro === 'RECORDS' ? null : NUTRIENTE_DE_LA_METRICA[parametro];
  // DL-158: lo indicado de cada comida registrada y el del día, de la misma lectura de la serie.
  const indicado = serie.estado.tipo === 'lista' ? serie.estado.indicado : null;
  const indicadoDeLaComida = (recordId: string): string | null => {
    if (!indicado || parametro === 'RECORDS') return null;
    const c = indicado.comidas.find((x) => x.recordId === recordId);
    return c ? indicadoDeLaComidaEnPalabras(c, parametro) : null;
  };
  const indicadoDelDia = indicado && parametro !== 'RECORDS' && !punto.dateEnd ? (indicado.dias.find((d) => d.date === punto.date) ?? null) : null;
  /** Lo que el registro aporta a la métrica, como lo escribe la pantalla del registro; sin cantidades, se dice. */
  const aporteDe = (r: RegistroDeComida): string | null => {
    if (nutriente === null) return null;
    if (!r.consumed) return COPY_REGISTRO_DE_COMIDAS.macrosSinCalcular;
    const texto = nutrienteParaMostrar(r.consumed[nutriente], nutriente);
    return texto === null ? 'Sin dato' : `${texto} ${UNIDAD_DE_NUTRIENTE[nutriente]}`;
  };
  // En el orden en que ocurrieron; lo que todavía no llegó (o no se pudo leer) queda al final, en el orden de la API.
  const filas = fuentes
    .map((o, i) => ({ o, i, l: lecturas[o.id] ?? ({ tipo: 'cargando' } as LecturaDeComida) }))
    .sort((a, b) => (a.l.tipo === 'lista' && b.l.tipo === 'lista' ? a.l.registro.occurredAt.localeCompare(b.l.registro.occurredAt) || a.i - b.i : a.l.tipo === 'lista' ? -1 : b.l.tipo === 'lista' ? 1 : a.i - b.i));
  const fallaron = filas.some((f) => f.l.tipo === 'error');
  return (
    <div className="fuentes-del-dato">
      <h4 className="fuentes-del-dato__titulo">
        Sale de {numero(fuentes.length)} registros de comida
      </h4>
      <ul className="fuentes-del-dato__lista">
        {filas.map(({ o, l }) => {
          if (l.tipo !== 'lista') {
            return (
              <li key={o.id} className="fuente fuente--sin-leer" data-estado={l.tipo}>
                {l.tipo === 'cargando' ? 'Cargando el registro…' : l.tipo === 'no-disponible' ? 'Este registro no está disponible con tu acceso actual.' : textoDeFalla(l.motivo, 'el registro de comida')}
              </li>
            );
          }
          const r = l.registro;
          const estaAbierta = abierta === o.id;
          const aporte = aporteDe(r);
          const delPlan = indicadoDeLaComida(o.id);
          return (
            <li key={o.id} className="fuente" data-registro={o.id}>
              <button type="button" className="fuente__fila" aria-expanded={estaAbierta} aria-controls={estaAbierta ? `${id}-${o.id}` : undefined} onClick={() => setAbierta(estaAbierta ? null : o.id)}>
                <span className="fuente__hora">{horaEnZona(r.occurredAt, r.timeZone)}</span>
                <span className="fuente__que">
                  {r.meal ? <strong>{r.meal.label}</strong> : null}
                  <span>{r.kind === 'PLAN_OPTION' && r.option ? r.option.label : `${COPY_REGISTRO_PARA_EL_PROFESIONAL.algoDiferente}${r.description ? `: «${r.description}»` : ''}`}</span>
                  {delPlan ? <span className="fuente__indicado">{delPlan}</span> : null}
                </span>
                {aporte !== null ? <span className="fuente__aporte">{aporte}</span> : null}
                <Icono nombre={estaAbierta ? 'arriba' : 'abajo'} tamano={18} />
              </button>
              {estaAbierta ? (
                <div id={`${id}-${o.id}`} className="fuente__registro">
                  <CuerpoDelRegistroDeComida registro={r} token={token} sesionPerdida={sesionPerdida} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {fallaron ? (
        <p className="origen-del-dato__nota">
          <button type="button" className="boton boton--enlace" onClick={() => setVuelta((v) => v + 1)}>
            Reintentar
          </button>
        </p>
      ) : null}
      {/* El total es el valor del punto, el que dio la API: no es una suma hecha acá con lo que se pudo leer. */}
      {nutriente !== null ? (
        <p className="fuentes-del-dato__total">
          <span>{punto.dateEnd ? 'Valor del punto' : 'Total del día'}</span>
          <strong>{total ?? 'Sin valor conocido'}</strong>
        </p>
      ) : null}
      {/* Lo indicado del día, al lado del total: otra capa, no una meta que se resta. Sin indicado, el motivo va en letra
          normal: la negrita es para los números. */}
      {indicadoDelDia && parametro !== 'RECORDS' ? (
        <p className="fuentes-del-dato__total fuentes-del-dato__indicado">
          <span>{CAPAS_DE_LA_COMPARACION.indicado} para el día</span>
          {indicadoDelDia.state === 'DETERMINED' ? <strong>{indicadoDelDiaEnCelda(indicadoDelDia, parametro)}</strong> : <span className="fuentes-del-dato__motivo">{indicadoDelDiaEnCelda(indicadoDelDia, parametro)}</span>}
        </p>
      ) : null}
    </div>
  );
}
