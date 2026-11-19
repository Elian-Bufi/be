'use client';

/**
 * ED-30 (WP-EDITORES-PROFESIONAL, §5.5; maqueta 06) · El asistente de Nutrición: el paso 1 (sin borrador, en la vista del
 * plan) y los pasos 2 a 7 (sobre el borrador, en el editor). Usa el armazón común (`asistente/asistente.tsx`) con los
 * pasos de Nutrición, y las mismas operaciones que la estación: lo que escribe un paso es un cambio del borrador que
 * lleva el autoguardado, y «Siguiente» guarda y espera (TEST-EDP-017). La lógica está en `asistente-de-nutricion.ts`.
 *
 * **WP-NUTRICION-PLANIFICACION (primer tramo):** los rangos se ven y se indican mientras se arman los días tipo (paso 3) y
 * las comidas (pasos 4 y 5), y la suma de los rangos de las comidas se compara con el objetivo del día (NUP-05 y NUP-06);
 * el paso 5 ofrece también «+ Opción de receta», «Copiar desde otra comida» y «Usar una comida habitual» (NUP-13), con
 * las mismas operaciones que la comida del editor. El rediseño completo del asistente no entra en este tramo.
 */
import { todasLasPaginas, type ComidaHabitual, type EvaluacionNutricional, type VersionDeObjetivo } from '@be/domain';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { Icono } from '../../../../components/icono';
import { Pista } from '../../../../components/pista';
import { api } from '../../../../lib/api';
import { dia as fechaDelDia } from '../../../../lib/formato';
import { COPY_ANTES_DE_ACTIVAR } from '../antes-de-activar';
import { ArmazonDelAsistente } from '../asistente/asistente';
import { sePuedeAvanzar } from '../asistente/paso-que-sigue';
import { copiaDelDiaTipo, duplicarEn } from '../editar-la-estructura';
import { TiraDelObjetivo } from '../seguimiento/tira-del-objetivo';
import { COPY_ASISTENTE_DE_NUTRICION as C, loQueLlevasArmadoEnNutricion, numeroDeLaVersionDelObjetivo, PASOS_DE_NUTRICION, pasoQueSigueEnNutricion, type PasoDeNutricion } from './asistente-de-nutricion';
import type { Estructura } from './comida-del-editor';
import { FormularioDeObjetivo } from './formularios';
import { InsertarComidaHabitual } from './habituales';
import { useNutricion } from './nutricion';
import { nombreDeLaComida, nombreDelDiaTipo, totalEnUnaLinea, type RangosDelDia } from './rangos';
import { COPY_DE_OTRA_COMIDA, MAXIMO_DE_OPCIONES } from './opcion-de-otra-comida';
import { COPY_OPCIONES } from './comida-del-editor';
import { gramosDelObjetivo, macrosEnProporcion } from './planificacion';
import { KcalDelObjetivo, RangoEnUnRenglon, SumaDeLosRangosIndicados, type RangoParaIndicar } from './suma-de-los-rangos';
import { OPCION_INICIAL } from './receta-en-el-plan';

const siguiente = (n: PasoDeNutricion) => `Siguiente: ${PASOS_DE_NUTRICION[n - 1]}`;
const MAXIMO_DE_DIAS_TIPO = 7;

export type PuntoDePartidaDeNutricionElegido = 'vigente' | 'plantilla' | 'blanco';

/** El paso 1: desde dónde arranca la versión. «Siguiente» la crea con la operación de hoy y espera la respuesta. */
export function PuntoDePartidaDeNutricion({ hayVigente, creando, onElegir, onSalir }: { hayVigente: boolean; creando: boolean; onElegir: (p: PuntoDePartidaDeNutricionElegido) => void; onSalir: () => void }) {
  const [elegido, setElegido] = useState<PuntoDePartidaDeNutricionElegido | null>(null);
  const [falta, setFalta] = useState(false);
  const opciones: readonly { readonly clave: PuntoDePartidaDeNutricionElegido; readonly titulo: string; readonly detalle: string }[] = [
    ...(hayVigente ? [{ clave: 'vigente' as const, titulo: C.copiarLaVigente, detalle: C.copiarLaVigenteDetalle }] : []),
    { clave: 'plantilla', titulo: C.desdeUnaPlantilla, detalle: C.desdeUnaPlantillaDetalle },
    { clave: 'blanco', titulo: C.enBlanco, detalle: C.enBlancoDetalle },
  ];
  return (
    <ArmazonDelAsistente
      paso={1}
      sugerido={null}
      titulo={C.puntoDePartida}
      pasos={PASOS_DE_NUTRICION}
      onElegirPaso={null}
      onAtras={null}
      onEstacion={null}
      onSalir={creando ? null : onSalir}
      principal={{ texto: siguiente(2), ocupado: creando ? 'Creando la versión…' : null, onClick: () => (elegido ? onElegir(elegido) : setFalta(true)) }}
      noAvanzo={false}
      onReintentar={() => undefined}
    >
      <fieldset className="asistente__tarjetas" aria-describedby={falta && !elegido ? 'falta-punto-de-partida' : undefined}>
        <legend className="visualmente-oculto">{C.puntoDePartida}</legend>
        {opciones.map((o) => (
          <label key={o.clave} className="asistente__tarjeta" data-punto-de-partida={o.clave}>
            <input type="radio" name="punto-de-partida-nutricion" value={o.clave} checked={elegido === o.clave} onChange={() => setElegido(o.clave)} />
            <span className="asistente__tarjeta-titulo">{o.titulo}</span>
            <span className="nota">{o.detalle}</span>
          </label>
        ))}
      </fieldset>
      {falta && !elegido ? (
        <p id="falta-punto-de-partida" className="campo__error" role="alert">
          {C.elegiUnPuntoDePartida}
        </p>
      ) : null}
    </ArmazonDelAsistente>
  );
}

type Lugar = { readonly texto: string; readonly ir: (() => void) | null };

export function PasosDeNutricion({
  paso,
  estructura,
  cambiar,
  nombres,
  rangosDe,
  objetivo,
  persona,
  sucio,
  guardando,
  guardar,
  impiden,
  sinCompletar,
  comidasHabituales,
  onIrAPaso,
  onAbrirOpcion,
  onAgregarOpcion,
  onQuitarDia,
  onInsertarHabitual,
  onObjetivoNuevo,
  onRevisarYActivar,
  rangosIndicados = null,
  rangoDe = null,
  onAgregarReceta,
  onCopiarDesdeOtra,
  onUsarHabitual,
  noSePuedeCopiar,
  noSePuedeUsarHabitual,
}: {
  paso: Exclude<PasoDeNutricion, 1>;
  estructura: Estructura;
  cambiar: (f: (e: Estructura) => Estructura) => void;
  nombres: Readonly<Record<string, string>>;
  /** Los rangos y totales de un día tipo (ED-34), para decir el total de cada opción. */
  rangosDe: (i: number) => RangosDelDia | null;
  objetivo: VersionDeObjetivo | null;
  persona: string;
  sucio: boolean;
  guardando: boolean;
  guardar: () => Promise<unknown>;
  impiden: readonly Lugar[];
  sinCompletar: readonly Lugar[];
  comidasHabituales: readonly ComidaHabitual[] | null;
  /** Ir a un paso; \`null\`: salir a la estación. */
  onIrAPaso: (n: PasoDeNutricion | null) => void;
  onAbrirOpcion: (i: number, j: number, k: number) => void;
  /** Abre el cuadro con una opción nueva, que entra al borrador recién con «Guardar la opción». */
  onAgregarOpcion: (i: number, j: number) => void;
  onQuitarDia: (i: number) => void;
  onInsertarHabitual: (i: number, comida: ComidaHabitual['structure'], nombresNuevos: Readonly<Record<string, string>>) => void;
  /** El objetivo nuevo se escribió: vuelve a leerlo. «Siguiente» espera esa relectura (la carrera del paso 2). */
  onObjetivoNuevo: () => void | Promise<void>;
  onRevisarYActivar: () => void;
  /** Paso 6: los rangos indicados de cada día tipo (API-PLN-02 y 03), con el mismo cuadro que la estación. */
  rangosIndicados?: ReactNode;
  /** NUP-05: el rango indicado de un día tipo (`j` en `null`) o de una comida, y cómo indicarlo, mientras se arma. */
  rangoDe?: ((i: number, j: number | null) => RangoParaIndicar) | null;
  /** NUP-13: las demás formas de sumar una opción, las mismas que la comida del editor. */
  onAgregarReceta: (i: number, j: number) => void;
  onCopiarDesdeOtra: (i: number, j: number) => void;
  onUsarHabitual: (i: number, j: number) => void;
  noSePuedeCopiar: (i: number, j: number) => string | null;
  noSePuedeUsarHabitual: (i: number, j: number) => string | null;
}) {
  const id = useId();
  const [noAvanzo, setNoAvanzo] = useState(false);
  const [esperando, setEsperando] = useState<PasoDeNutricion | null>(null);
  // EDC-12: con un objetivo recién escrito, hasta que llegue su relectura no se sabe qué hay que guardar.
  const [releyendoElObjetivo, setReleyendoElObjetivo] = useState(false);
  const alObjetivoNuevo = () => {
    setReleyendoElObjetivo(true);
    void Promise.resolve(onObjetivoNuevo()).finally(() => setReleyendoElObjetivo(false));
  };
  const sugerido = pasoQueSigueEnNutricion(estructura);

  const avanzar = async (n: PasoDeNutricion) => {
    setNoAvanzo(false);
    const r = await sePuedeAvanzar({ sucio, guardando, guardar });
    if (r === 'espera') return setEsperando(n);
    if (r === 'no-avanza') return setNoAvanzo(true);
    onIrAPaso(n);
  };
  // Con un guardado en viaje, «Siguiente» espera a que termine y vuelve a preguntar (EDT-13).
  useEffect(() => {
    if (esperando === null || guardando) return;
    const n = esperando;
    setEsperando(null);
    void avanzar(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esperando, guardando]);
  useEffect(() => setNoAvanzo(false), [paso]);

  const titulo = { 2: C.objetivo, 3: C.dias, 4: C.comidas, 5: C.opciones, 6: C.revisar, 7: C.activar }[paso];
  const principal =
    paso === 7
      ? { texto: COPY_ANTES_DE_ACTIVAR.revisarYActivar, onClick: onRevisarYActivar }
      : {
          texto: siguiente((paso + 1) as PasoDeNutricion),
          onClick: () => void avanzar((paso + 1) as PasoDeNutricion),
          ocupado: releyendoElObjetivo ? C.leyendoElObjetivoNuevo : esperando !== null || (guardando && sucio) ? 'Guardando antes de seguir…' : null,
        };

  return (
    <ArmazonDelAsistente
      paso={paso}
      sugerido={sugerido}
      titulo={titulo}
      pasos={PASOS_DE_NUTRICION}
      onElegirPaso={(n) => (n === 1 ? undefined : onIrAPaso(n))}
      onAtras={paso > 2 ? () => onIrAPaso((paso - 1) as PasoDeNutricion) : null}
      onEstacion={() => onIrAPaso(null)}
      principal={principal}
      noAvanzo={noAvanzo}
      onReintentar={() => void avanzar((paso + 1) as PasoDeNutricion)}
      armado={loQueLlevasArmadoEnNutricion(estructura)}
    >
      {paso === 2 ? <PasoDelObjetivo objetivo={objetivo} onObjetivoNuevo={alObjetivoNuevo} /> : null}

      {paso === 3 ? (
        <>
          <p className="nota">{C.diasAyuda}</p>
          <ol className="asistente__sesiones">
            {estructura.map((d, i) => (
              <li key={d.dayTypeId ?? `nuevo-${i}`} className="asistente__sesion" data-dia-del-asistente={i + 1}>
                {/* NUA-07: el mismo campo común que el nombre de cada comida en el paso 4 (tenía el mismo borde suelto). */}
                <div className="campo asistente__nombre">
                  <label htmlFor={`${id}-dia-${i}`} className="visualmente-oculto">
                    {C.nombreDelDia(i + 1)}
                  </label>
                  <input id={`${id}-dia-${i}`} type="text" value={d.label} maxLength={80} placeholder={`Día tipo ${i + 1}`} onChange={(e) => cambiar((x) => ((x[i]!.label = e.target.value), x))} />
                </div>
                <span className="nota">{d.meals.length === 0 ? 'Sin comidas' : d.meals.length === 1 ? '1 comida incluida' : `${d.meals.length} comidas incluidas`}</span>
                {/* NUP-05: el rango del día, a la vista y a mano mientras se arman los días tipo. */}
                {rangoDe ? <RangoEnUnRenglon de={nombreDelDiaTipo(d, i)} rango={rangoDe(i, null)} /> : null}
                <span className="asistente__acciones">
                  <button type="button" className="boton boton--enlace" disabled={estructura.length >= MAXIMO_DE_DIAS_TIPO} onClick={() => cambiar((x) => (duplicarEn(x, i, copiaDelDiaTipo(x[i]!, i)), x))}>
                    {C.duplicarDia(nombreDelDiaTipo(d, i))}
                  </button>
                  {estructura.length > 1 ? (
                    <button type="button" className="boton boton--enlace" onClick={() => onQuitarDia(i)}>
                      {C.quitarDia(nombreDelDiaTipo(d, i))}
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="boton boton--quieto"
            data-asistente-agregar-dia
            disabled={estructura.length >= MAXIMO_DE_DIAS_TIPO}
            onClick={() => cambiar((x) => (x.push({ label: `Día tipo ${x.length + 1}`, meals: [] }), x))}
          >
            <Icono nombre="mas" tamano={18} />
            {C.agregarDia}
          </button>
          {estructura.length >= MAXIMO_DE_DIAS_TIPO ? <p className="nota">Un plan lleva hasta {MAXIMO_DE_DIAS_TIPO} días tipo.</p> : null}
        </>
      ) : null}

      {paso === 4
        ? estructura.map((d, i) => (
            <PasoDeLasComidas
              key={d.dayTypeId ?? `nuevo-${i}`}
              id={`${id}-dia-${i}`}
              dia={d}
              i={i}
              cambiar={cambiar}
              habituales={comidasHabituales}
              onInsertarHabitual={onInsertarHabitual}
              variosDias={estructura.length > 1}
              rangoDe={rangoDe}
              objetivo={objetivo}
            />
          ))
        : null}

      {paso === 5 ? (
        <>
          <p className="nota">{C.opcionesAyuda}</p>
          {estructura.map((d, i) => {
            const rangos = rangosDe(i);
            return (
              <div key={d.dayTypeId ?? `nuevo-${i}`} className="asistente__grupo" data-dia-del-asistente={i + 1}>
                {estructura.length > 1 ? <h4 className="asistente__grupo-titulo">{nombreDelDiaTipo(d, i)}</h4> : null}
                {d.meals.length === 0 ? <p className="nota">{C.sinComidas}</p> : null}
                {d.meals.map((m, j) => (
                  <div key={m.mealId ?? `nueva-${j}`} className="asistente__comida">
                    <p className="asistente__ejercicio-actual">
                      <strong>{nombreDeLaComida(m, j)}</strong>
                    </p>
                    {rangoDe ? <RangoEnUnRenglon de={nombreDeLaComida(m, j)} rango={rangoDe(i, j)} /> : null}
                    <ul className="asistente__opciones">
                      {m.options.map((o, k) => {
                        const nombre = o.label.trim() || `Opción ${k + 1}`;
                        const total = rangos?.comidas[j]?.opciones[k]?.total;
                        return (
                          <li key={o.optionId ?? `nueva-${k}`} data-opcion-del-asistente={k + 1}>
                            <span>
                              {nombre}
                              <span className="nota">
                                {' · '}
                                {o.recipeVersionId ? C.receta : o.items.length === 0 ? C.sinAlimentos : o.items.map((it) => nombres[it.catalogItemId] ?? 'Elemento').join(', ')}
                                {total && o.items.length > 0 ? ` · ${totalEnUnaLinea(total)}` : ''}
                              </span>
                            </span>
                            {o.recipeVersionId ? null : (
                              <button type="button" className="boton boton--secundario boton--compacto" aria-haspopup="dialog" data-armar-la-opcion onClick={() => onAbrirOpcion(i, j, k)}>
                                {C.editarLaOpcion(nombre)}
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    {/* NUP-13: las cuatro formas de sumar una opción, al lado, con las operaciones de la comida del editor. */}
                    <p className="asistente__formas-de-sumar" data-asistente-formas-de-sumar>
                      <button
                        type="button"
                        className="boton boton--enlace"
                        aria-haspopup="dialog"
                        data-asistente-agregar-opcion
                        disabled={m.options.length >= MAXIMO_DE_OPCIONES}
                        onClick={() => onAgregarOpcion(i, j)}
                      >
                        <Icono nombre="mas" tamano={18} />
                        {C.agregarOpcion(nombreDeLaComida(m, j))}
                      </button>
                      <button type="button" className="boton boton--enlace" aria-haspopup="dialog" data-asistente-opcion-de-receta disabled={m.options.length >= MAXIMO_DE_OPCIONES} onClick={() => onAgregarReceta(i, j)}>
                        <Icono nombre="receta" tamano={18} />
                        {C.opcionDeReceta}
                        <span className="visualmente-oculto"> {COPY_OPCIONES.en(nombreDeLaComida(m, j))}</span>
                      </button>
                      <BotonConMotivo texto={COPY_DE_OTRA_COMIDA.copiar} comida={nombreDeLaComida(m, j)} noSePuede={noSePuedeCopiar(i, j)} alTocar={() => onCopiarDesdeOtra(i, j)} />
                      <BotonConMotivo texto={COPY_DE_OTRA_COMIDA.usarHabitual} comida={nombreDeLaComida(m, j)} noSePuede={noSePuedeUsarHabitual(i, j)} alTocar={() => onUsarHabitual(i, j)} />
                    </p>
                  </div>
                ))}
              </div>
            );
          })}
        </>
      ) : null}

      {paso === 6 ? (
        <>
          <p className="nota">{C.revisarAyuda}</p>
          <ListaDeLugares titulo={C.impiden} vacia={C.nadaImpide} lugares={impiden} />
          <ListaDeLugares titulo={C.sinCompletar} vacia={C.nadaSinCompletar} lugares={sinCompletar} />
          {rangosIndicados ? (
            <>
              <h3>{C.rangosIndicados}</h3>
              <p className="nota">{C.rangosIndicadosAyuda}</p>
              {rangosIndicados}
            </>
          ) : null}
        </>
      ) : null}

      {paso === 7 ? <p>{C.activarAyuda(persona)}</p> : null}
    </ArmazonDelAsistente>
  );
}

/**
 * EDC-12: el número de la versión del objetivo, contado entre todas sus versiones (todas las páginas: la API da 20 por
 * página, de la más nueva a la más vieja). Si la lista no se pudo leer entera, `null`: se dice solo la fecha, nunca un
 * número contado a medias. Con `objetivo` en `null` no lee nada.
 */
export function useNumeroDelObjetivo(objetivo: VersionDeObjetivo | null): number | null {
  const { token, asesoradoId, sesionPerdida } = useNutricion();
  const [numero, setNumero] = useState<{ readonly de: string; readonly n: number | null } | null>(null);
  useEffect(() => {
    if (!objetivo) return;
    let vigente = true;
    void todasLasPaginas((f) => api.listarObjetivos(token, asesoradoId, f)).then((r) => {
      if (!vigente || sesionPerdida(r) || !r.ok) return;
      setNumero({ de: objetivo.versionId, n: r.datos.completa ? numeroDeLaVersionDelObjetivo(r.datos.data, objetivo.versionId) : null });
    });
    return () => {
      vigente = false;
    };
  }, [objetivo, token, asesoradoId, sesionPerdida]);
  return objetivo && numero?.de === objetivo.versionId ? numero.n : null;
}

/** Paso 2: el objetivo general vigente, con su versión y su fecha, o una versión nueva, como hoy. */
function PasoDelObjetivo({ objetivo, onObjetivoNuevo }: { objetivo: VersionDeObjetivo | null; onObjetivoNuevo: () => void }) {
  const { token, asesoradoId, sesionPerdida } = useNutricion();
  const numero = useNumeroDelObjetivo(objetivo);
  const [escribiendo, setEscribiendo] = useState(false);
  const [evaluaciones, setEvaluaciones] = useState<readonly EvaluacionNutricional[] | null>(null);
  const [nuevo, setNuevo] = useState(false);
  useEffect(() => {
    if (!escribiendo || evaluaciones) return;
    void api.listarEvaluaciones(token, asesoradoId).then((r) => {
      if (sesionPerdida(r)) return;
      setEvaluaciones(r.ok ? r.datos.data : []);
    });
  }, [escribiendo, evaluaciones, token, asesoradoId, sesionPerdida]);
  return (
    <>
      {nuevo ? (
        <p className="nota" role="status">
          {C.objetivoNuevo}
        </p>
      ) : null}
      {objetivo ? (
        <section className="asistente__objetivo" aria-labelledby="asistente-objetivo-general" data-objetivo-general>
          <h4 id="asistente-objetivo-general">{C.objetivoGeneral}</h4>
          <TiraDelObjetivo calorias={objetivo.estimatedEnergyRequirement.value} macros={{ estado: 'listos', valor: objetivo.macronutrientDistribution }} onReintentar={() => undefined} />
          {/* NUP-07: las kcal que suman los gramos, a la vista, y si no coinciden con las indicadas. Un objetivo viejo con
              macros en proporción de las kcal lo dice: no hay gramos que sumar. */}
          <KcalDelObjetivo kcal={objetivo.estimatedEnergyRequirement.value} gramos={gramosDelObjetivo(objetivo)} enProporcion={macrosEnProporcion(objetivo)} />
          <p className="nota">{C.versionYFecha(numero, fechaDelDia(objetivo.effectiveFrom))}</p>
        </section>
      ) : null}
      <p className="nota">{C.enGramos}</p>
      {escribiendo ? (
        evaluaciones === null ? (
          <p className="cargando" role="status">
            Cargando las evaluaciones…
          </p>
        ) : evaluaciones.length === 0 ? (
          <p className="nota">{C.sinEvaluaciones}</p>
        ) : (
          <FormularioDeObjetivo
            evaluaciones={evaluaciones}
            onEmitido={() => {
              setEscribiendo(false);
              setNuevo(true);
              onObjetivoNuevo();
            }}
            onCancelar={() => setEscribiendo(false)}
          />
        )
      ) : (
        <p>
          <button type="button" className="boton boton--secundario" data-objetivo-nuevo onClick={() => setEscribiendo(true)}>
            {C.versionNueva}
          </button>{' '}
          <span className="nota">{C.versionNuevaDetalle}</span>
        </p>
      )}
    </>
  );
}

/** Paso 4: las comidas de un día tipo, con sus nombres; «Agregar una comida» (con su opción 1) o una comida habitual. */
function PasoDeLasComidas({
  id,
  dia,
  i,
  cambiar,
  habituales,
  onInsertarHabitual,
  variosDias,
  rangoDe,
  objetivo,
}: {
  id: string;
  dia: Estructura[number];
  i: number;
  cambiar: (f: (e: Estructura) => Estructura) => void;
  habituales: readonly ComidaHabitual[] | null;
  onInsertarHabitual: (i: number, comida: ComidaHabitual['structure'], nombresNuevos: Readonly<Record<string, string>>) => void;
  variosDias: boolean;
  /** NUP-05 y NUP-06: el rango de cada comida, y la suma frente al objetivo. */
  rangoDe: ((i: number, j: number | null) => RangoParaIndicar) | null;
  objetivo: VersionDeObjetivo | null;
}) {
  const [conHabitual, setConHabitual] = useState(false);
  const nombreDelDia = nombreDelDiaTipo(dia, i);
  return (
    <div className="asistente__grupo" data-dia-del-asistente={i + 1}>
      {variosDias ? <h4 className="asistente__grupo-titulo">{nombreDelDia}</h4> : null}
      {dia.meals.length === 0 ? <p className="nota">{C.sinComidas}</p> : null}
      <ol className="asistente__sesiones">
        {dia.meals.map((m, j) => (
          <li key={m.mealId ?? `nueva-${j}`} className="asistente__sesion">
            {/* NUA-07: el campo común del website (`campo`), como el resto: la letra, el borde y el alto de BE, en Claro y
                en Azul noche. La etiqueta sigue oculta a la vista: el nombre escrito ya dice qué es. */}
            <div className="campo asistente__nombre">
              <label htmlFor={`${id}-comida-${j}`} className="visualmente-oculto">
                {C.nombreDeLaComida(nombreDelDia, j + 1)}
              </label>
              <input id={`${id}-comida-${j}`} type="text" value={m.label} maxLength={80} placeholder={`Comida ${j + 1}`} onChange={(e) => cambiar((x) => ((x[i]!.meals[j]!.label = e.target.value), x))} />
            </div>
            <span className="nota">{m.options.length === 1 ? '1 opción' : `${m.options.length} opciones`}</span>
            {rangoDe ? <RangoEnUnRenglon de={nombreDeLaComida(m, j)} rango={rangoDe(i, j)} /> : null}
          </li>
        ))}
      </ol>
      <div className="asistente__acciones">
        <button
          type="button"
          className="boton boton--quieto"
          data-asistente-agregar-comida
          onClick={() => cambiar((x) => (x[i]!.meals.push({ label: '', prescriptionMode: 'DISH_OPTIONS', options: [{ label: OPCION_INICIAL, items: [] }] }), x))}
        >
          <Icono nombre="mas" tamano={18} />
          {C.agregarComida(nombreDelDia)}
        </button>
        {habituales && habituales.length > 0 ? (
          <button type="button" className="boton boton--quieto" aria-expanded={conHabitual} onClick={() => setConHabitual(!conHabitual)}>
            <Icono nombre="habitual" tamano={18} />
            {C.usarHabitual(nombreDelDia)}
          </button>
        ) : null}
      </div>
      {rangoDe && dia.meals.length > 0 ? <SumaDeLosRangosIndicados comidas={dia.meals.map((m, j) => ({ nombre: nombreDeLaComida(m, j), rango: rangoDe(i, j).indicado }))} objetivo={objetivo} /> : null}
      {conHabitual && habituales ? (
        <InsertarComidaHabitual
          comidas={habituales}
          onInsertar={(comida, nombresNuevos) => {
            onInsertarHabitual(i, comida, nombresNuevos);
            setConHabitual(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** NUP-13: una forma de sumar una opción; si no se puede, queda apagada (sin perder el foco) y dice por qué al lado. */
function BotonConMotivo({ texto, comida, noSePuede, alTocar }: { texto: string; comida: string; noSePuede: string | null; alTocar: () => void }) {
  const boton = (
    <button type="button" className="boton boton--enlace" aria-haspopup="dialog" aria-disabled={noSePuede ? true : undefined} onClick={() => (noSePuede ? undefined : alTocar())}>
      {texto}
      <span className="visualmente-oculto"> en {comida}</span>
    </button>
  );
  // La pista lo dice al pasar el mouse o al llegar con el teclado, y el lector la oye como descripción del botón.
  return noSePuede ? <Pista texto={noSePuede}>{boton}</Pista> : boton;
}

/** Paso 6: una lista de cosas con su lugar; cada una lleva a corregirla en el plan (NUP-14). */
function ListaDeLugares({ titulo, vacia, lugares }: { titulo: string; vacia: string; lugares: readonly Lugar[] }) {
  return (
    <section className="asistente__revisar">
      <h4>{titulo}</h4>
      {lugares.length === 0 ? (
        <p className="nota">{vacia}</p>
      ) : (
        <ul className="estacion__lista-del-panel">
          {lugares.map((l, n) => (
            <li key={n}>
              {l.texto}
              {l.ir ? (
                <>
                  {' '}
                  <button type="button" className="boton boton--enlace" onClick={l.ir}>
                    {C.irEnLaEstacion}
                  </button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
