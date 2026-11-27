'use client';

/**
 * «La vez pasada» en el editor del plan (WP-GRAFICOS GR-01, DL-174, fase 1; la misma pieza que PG-11 de
 * WP-PULIDO-GRANDES): en el cuadro lateral del ejercicio, debajo de «Lo que indica el plan» y nunca mezclado con eso, lo
 * que la persona registró las últimas veces que hizo el ejercicio, serie por serie (carga con su unidad × repeticiones ·
 * RIR). Las reglas son las del dominio (`la-vez-pasada.ts`); acá solo se lee y se dibuja:
 * - **La lectura** es API-TRN-21 (las sesiones registradas en los planes de quien mira, y lo dice: «en tus planes») de los
 *   últimos 91 días, armada en el cliente: la propuesta de gráficos lo pide así para la fase 1. Se lee al abrir el cuadro,
 *   cada vez: no hay caché de datos de salud en el navegador. La lista dice desde cuándo leyó.
 * - **Lo escrito va lleno y lo precargado del plan, hueco y en gris,** con su texto: «carga rápida» (DL-161) o «con la
 *   carga del plan» (ED-70). Lo cargado otro día y lo corregido llevan su etiqueta. Nada es solo color.
 * - **Una vez hecha con otro ejercicio lo dice** («Se hizo con Prensa de piernas») y no se toma como el mismo; una
 *   resumida dice que no tiene series. Una serie que falta queda «—», sin dato, nunca en cero.
 * - **Sin flechas ni juicios:** no compara una vez con otra, no sugiere una carga (eso es «Calcular la carga desde la
 *   estimación», ED-76, que confirma el profesional) y no califica una vez frente a otra.
 *
 * La pasada visual (WP-GRAFICOS, 15/11; DISENO-VISUAL §2, GR-01): en lugar de una tabla con una columna por serie (que en
 * el cuadro partía «137,5 kg × 3 · RIR 2» en cuatro renglones y cortaba la serie 4), una lista: una fila por sesión, con
 * la fecha y la sesión a la izquierda y las series como fichas que pasan al renglón siguiente si no entran, cada una con su
 * marca llena o hueca delante. Con una sola unidad, la unidad va una vez arriba («kg × repeticiones · RIR») y cada ficha
 * dice «137,5 × 3 · RIR 2»; el lector de pantalla oye la serie entera. Se ven las últimas tres; «Ver las 9 anteriores»
 * muestra las demás de lo leído. Lo que aclara (qué es y que no se mezcla con lo indicado), en «Cómo leerlo».
 *
 * La revisión del 15/11 (las cuentas están en `lista-de-la-vez-pasada.ts`, que se prueba ejecutándola):
 * - **Se arman todas las veces de los 91 días leídos,** no doce: «Ver las N anteriores» cuenta bien y la lista llega
 *   hasta el «desde el …» de arriba. El botón cuenta filas (una vez por prescripción), no sesiones.
 * - **La unidad sale de todas las veces,** no de las que se ven: arriba y en las fichas es la misma, abierta o cerrada.
 * - **La línea de arriba dice que es lo registrado** («Lo registrado por Diego Sosa en tus planes, desde el …»): las fichas
 *   tienen el formato de una prescripción y «En tus planes» solo podía leerse como lo indicado.
 *
 * Los ejercicios de la lista de la estimación (RM-16) la ven dentro de «Detalle y fuerza estimada» (ED-75); los demás, en
 * `CuadroDeLaVezPasada`, el mismo cuadro lateral sin la fuerza estimada: DL-174 abre el cuadro para todos los ejercicios, y
 * la fuerza estimada sigue solo en la lista de la estimación (GR-T70).
 */
import { COPY_LA_VEZ_PASADA, COPY_NOTACION_DEL_ESFUERZO, fechaEnPocasPalabras, loQueSeHizo, marcaDelPlan, textoDeLaSerie, VECES_EN_EL_EDITOR, vecesPasadas, type SerieDeLaVezPasada, type VezPasada } from '@be/domain';
import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { BloqueDeEstado } from '../../../../components/estados';
import { Icono } from '../../../../components/icono';
import { api, type Resultado } from '../../../../lib/api';
import { ICONO_DE_FALLA, motivoDeFalla, type MotivoDeFalla } from '../../../../lib/fallas';
import { ComoLeerlo } from '../graficos/como-leerlo';
import { usePersonaDelArea } from '../marco-del-area';
import { hoyEn, restarDias } from '../seguimiento/estado';
import { AccesoAlHistorial, COPY_DEL_HISTORIAL, PasoDelHistorialDiferido, type PasoDelHistorial } from '../graficos/entrenamiento/acceso-al-historial';
import { anterioresQueQuedan, textoDeLaFicha, TODAS_LAS_VECES, unidadComun } from './lista-de-la-vez-pasada';
import { useNotacionDelEsfuerzo } from '../notacion-del-esfuerzo';

/** Cuántos días se leen: 91 con hoy. API-TRN-21 acepta 92, y el hoy de la API puede ir un día adelante del navegador. */
const DIAS_QUE_SE_LEEN = 91;

export const COPY_LA_VEZ_PASADA_EN_EL_EDITOR = {
  abrir: 'La vez pasada',
  queEs: (persona: string, desde: string) => `Lo que registró ${persona} las últimas veces que hizo este ejercicio en tus planes, serie por serie, desde el ${desde}.`,
  /** La línea tenue de arriba de la lista: de dónde sale y, con una sola unidad, cómo se lee cada ficha. */
  deDonde: (persona: string, desde: string, unidad: string | null, esfuerzo = 'RIR') => `Lo registrado por ${persona} en tus planes, desde el ${desde}${unidad ? ` · ${unidad} × repeticiones · ${esfuerzo}` : ''}`,
  ninguna: (desde: string) => `Sin sesiones registradas con este ejercicio en tus planes desde el ${desde}.`,
  sesion: 'Sesión',
  serie: (n: number) => `Serie ${n}`,
  loRegistrado: 'Lo registrado',
  caption: (persona: string, nombre: string) => `${COPY_LA_VEZ_PASADA.titulo}: lo que registró ${persona} de ${nombre}, por sesión y por serie`,
  sinDato: 'sin dato',
  escrito: 'Escrita por la persona',
  escritoLargo: 'Escrita por la persona (si algún valor vino del plan, la serie lo dice)',
  delPlan: 'Carga rápida: tildada sin escribir, con los valores del plan',
  delPlanCorto: 'Carga rápida (los valores del plan)',
  cargadaOtroDia: 'Cargada otro día',
  corregida: 'Corregida',
  noSeComparan: 'Lo que indica el plan está arriba y no se mezcla con esto: no se comparan ni se suma nada.',
  noSeLeyo: 'No pudimos leer las sesiones registradas de este ejercicio.',
  noDisponible: 'Con el acceso de ahora no podés ver los registros de Entrenamiento de esta persona.',
  persona: 'la persona',
  loQueIndicaElPlan: 'Lo que indica el plan',
  /** Cuenta filas (una vez por prescripción), no sesiones: el mismo ejercicio dos veces en una sesión son dos. */
  verMas: (n: number) => (n === 1 ? 'Ver la anterior' : `Ver las ${n} anteriores`),
  verMenos: 'Ver menos',
} as const;
const C = COPY_LA_VEZ_PASADA_EN_EL_EDITOR;

export type LecturaDeLaVezPasada =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'no-disponible' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla }
  | { readonly tipo: 'lista'; readonly veces: readonly VezPasada[]; readonly hoy: string; readonly desde: string };

/**
 * Lee las sesiones registradas de los últimos días (API-TRN-21) y arma las últimas veces del ejercicio. `undefined` en
 * `exerciseId`: no lee (el cuadro está cerrado).
 */
export function useLaVezPasada(
  token: string,
  asesoradoId: string,
  exerciseId: string | undefined,
  sesionPerdida: (r: Resultado<unknown>) => boolean,
): { readonly lectura: LecturaDeLaVezPasada; readonly recargar: () => void } {
  const [lectura, setLectura] = useState<LecturaDeLaVezPasada>({ tipo: 'cargando' });
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    if (exerciseId === undefined) return;
    let vigente = true;
    setLectura({ tipo: 'cargando' });
    // Sin `periodEnd`: la API toma su hoy y lee desde `periodStart`.
    void api.contextoDeRevisionDeEntrenamiento(token, asesoradoId, { periodStart: restarDias(hoyEn(), DIAS_QUE_SE_LEEN - 1) }).then((r) => {
      if (!vigente || sesionPerdida(r)) return;
      if (!r.ok) return setLectura(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? { tipo: 'no-disponible' } : { tipo: 'error', motivo: motivoDeFalla(r) });
      const d = r.datos.data;
      setLectura({ tipo: 'lista', veces: vecesPasadas(d.registeredExecutions, exerciseId, { cuantas: TODAS_LAS_VECES }), hoy: d.period.end, desde: d.period.start });
    });
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId, exerciseId, sesionPerdida, vuelta]);
  const recargar = useCallback(() => setVuelta((v) => v + 1), []);
  return { lectura, recargar };
}

/** La marca de cada serie: llena si la escribió la persona; hueca si vino toda del plan (carga rápida). Sigue al texto. */
function MarcaDeOrigen({ hueca = false }: { hueca?: boolean }) {
  return (
    <svg width={10} height={10} viewBox="0 0 12 12" aria-hidden="true" className="la-vez-pasada__marca-de-origen">
      <circle cx={6} cy={6} r={hueca ? 4 : 4.5} fill={hueca ? 'none' : 'currentColor'} stroke="currentColor" strokeWidth={hueca ? 1.5 : 0} />
    </svg>
  );
}

/** Una serie registrada como ficha: su marca, el texto (que no se parte) y, si vino del plan, lo que vino del plan. */
function FichaDeSerie({ serie, unidad }: { serie: SerieDeLaVezPasada; unidad: 'kg' | 'lb' | null }) {
  const delPlan = marcaDelPlan(serie, COPY_LA_VEZ_PASADA.cargaRapida);
  // DL-192: el RIR registrado, en la notación del borrador que se está editando.
  const notacion = useNotacionDelEsfuerzo();
  const corto = textoDeLaFicha(serie, unidad, notacion);
  return (
    <li className={serie.cargaRapida ? 'la-vez-pasada__ficha la-vez-pasada__serie--del-plan' : 'la-vez-pasada__ficha'} data-carga-rapida={serie.cargaRapida ? '' : undefined}>
      <MarcaDeOrigen hueca={serie.cargaRapida} />
      <span className="la-vez-pasada__valor" aria-hidden="true">
        {corto}
      </span>
      <span className="visualmente-oculto">{`${C.serie(serie.numero)}: ${textoDeLaSerie(serie, notacion)}`}</span>
      {delPlan ? <span className="la-vez-pasada__del-plan">{delPlan}</span> : null}
    </li>
  );
}

/** «Se hizo con Prensa de piernas»: la frase del dominio, con mayúscula, para una fila sola. */
const conMayuscula = (t: string): string => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

/** La lista de las veces: una fila por sesión, con la fecha y la sesión a la izquierda y las series como fichas. */
function ListaDeLaVezPasada({ veces, hoy, persona, nombre, unidad }: { veces: readonly VezPasada[]; hoy: string; persona: string; nombre: string; unidad: 'kg' | 'lb' | null }) {
  const [todas, setTodas] = useState(false);
  const aLaVista = todas ? veces : veces.slice(0, VECES_EN_EL_EDITOR);
  const numeros = [...new Set(aLaVista.flatMap((v) => (v.como.tipo === 'series' ? v.como.series.map((s) => s.numero) : [])))].sort((a, b) => a - b);
  const conSeries = numeros.length > 0;
  const hayDelPlan = aLaVista.some((v) => v.como.tipo === 'series' && v.como.series.some((s) => s.cargaRapida));
  const quedan = anterioresQueQuedan(veces, VECES_EN_EL_EDITOR);
  return (
    <>
      <ol className="la-vez-pasada__lista" aria-label={C.caption(persona, nombre)}>
        {aLaVista.map((v) => (
          <li key={`${v.executionId}|${v.prescriptionId}`} data-vez={v.executionId} className="la-vez-pasada__vez">
            <div className="la-vez-pasada__cuando">
              <span className="la-vez-pasada__fecha">
                <span aria-hidden="true">{fechaEnPocasPalabras(v.fecha, hoy)}</span>
                <span className="visualmente-oculto">{fechaEnPocasPalabras(v.fecha, hoy, true)}</span>
              </span>
              <span className="la-vez-pasada__sesion">{v.sesion}</span>
              {v.cargadaOtroDia ? (
                <span className="etiqueta-de-dato la-vez-pasada__etiqueta" data-cargada-otro-dia>
                  <Icono nombre="cargado-otro-dia" tamano={15} />
                  {C.cargadaOtroDia}
                </span>
              ) : null}
              {v.corregida ? (
                <span className="etiqueta-de-dato la-vez-pasada__etiqueta" data-corregida>
                  <Icono nombre="corregido" tamano={15} />
                  {C.corregida}
                </span>
              ) : null}
            </div>
            {v.como.tipo === 'series' ? (
              <ul className="la-vez-pasada__series">
                {numeros.map((n) => {
                  const s = v.como.tipo === 'series' ? v.como.series.find((x) => x.numero === n) : undefined;
                  return s ? (
                    <FichaDeSerie key={n} serie={s} unidad={unidad} />
                  ) : (
                    // Una serie que falta queda «—», sin dato: nunca un cero y nunca corrida al lugar de otra.
                    <li key={n} className="la-vez-pasada__ficha la-vez-pasada__ficha--sin-dato">
                      <span aria-hidden="true">—</span>
                      <span className="visualmente-oculto">{`${C.serie(n)}: ${C.sinDato}`}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="la-vez-pasada__otra">{conMayuscula(loQueSeHizo(v, 'profesional'))}</p>
            )}
          </li>
        ))}
      </ol>
      {quedan > 0 ? (
        <button type="button" className="boton boton--discreto la-vez-pasada__ver-mas" aria-expanded={todas} onClick={() => setTodas((t) => !t)} data-ver-mas-sesiones>
          {todas ? C.verMenos : C.verMas(quedan)}
        </button>
      ) : null}
      {/* Cada serie dice en texto si vino del plan; la leyenda explica las dos marcas una vez, como fichas cortas. */}
      {conSeries ? (
        <ul className="leyenda la-vez-pasada__leyenda">
          <li>
            <MarcaDeOrigen />
            <span aria-hidden="true">{C.escrito}</span>
            <span className="visualmente-oculto">{C.escritoLargo}</span>
          </li>
          {hayDelPlan ? (
            <li>
              <MarcaDeOrigen hueca />
              <span aria-hidden="true">{C.delPlanCorto}</span>
              <span className="visualmente-oculto">{C.delPlan}</span>
            </li>
          ) : null}
        </ul>
      ) : null}
      {aLaVista.some((v) => v.como.tipo === 'series' && v.como.enLugarDe) ? (
        <ul className="nota la-vez-pasada__en-lugar-de">
          {aLaVista.flatMap((v) => (v.como.tipo === 'series' && v.como.enLugarDe ? [<li key={`${v.executionId}|${v.prescriptionId}`}>{`${fechaEnPocasPalabras(v.fecha, hoy)}: ${COPY_LA_VEZ_PASADA.enLugarDe(v.como.enLugarDe)}`}</li>] : []))}
        </ul>
      ) : null}
    </>
  );
}

/** La sección «La vez pasada» del cuadro del ejercicio, con sus estados de lectura. */
export function LaVezPasada({ lectura, recargar, nombre }: { lectura: LecturaDeLaVezPasada; recargar: () => void; nombre: string }) {
  const id = useId();
  const persona = usePersonaDelArea() ?? C.persona;
  const notacion = useNotacionDelEsfuerzo();
  return (
    <section className="la-vez-pasada" aria-labelledby={`${id}-titulo`} data-la-vez-pasada>
      <p id={`${id}-titulo`} className="ejercicio-del-plan__subtitulo">
        {COPY_LA_VEZ_PASADA.titulo}
      </p>
      {lectura.tipo === 'cargando' ? (
        <p className="cargando" role="status">
          Cargando…
        </p>
      ) : null}
      {lectura.tipo === 'error' ? (
        // Una lectura que falló no es un ejercicio sin historia: se dice y se reintenta.
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[lectura.motivo]} onReintentar={recargar} deQue="las sesiones registradas del ejercicio">
          {C.noSeLeyo}
        </BloqueDeEstado>
      ) : null}
      {lectura.tipo === 'no-disponible' ? <p data-no-disponible>{C.noDisponible}</p> : null}
      {lectura.tipo === 'lista' ? (
        lectura.veces.length === 0 ? (
          <p className="nota" data-sin-veces>
            {C.ninguna(fechaEnPocasPalabras(lectura.desde, lectura.hoy))}
          </p>
        ) : (
          <>
            {/* La unidad, una sola para la línea de arriba y las fichas: la de todas las veces, no la de las que se ven. */}
            <p className="nota la-vez-pasada__que-es">{C.deDonde(persona, fechaEnPocasPalabras(lectura.desde, lectura.hoy), unidadComun(lectura.veces), COPY_NOTACION_DEL_ESFUERZO.etiqueta[notacion])}</p>
            <ListaDeLaVezPasada veces={lectura.veces} hoy={lectura.hoy} persona={persona} nombre={nombre} unidad={unidadComun(lectura.veces)} />
            <ComoLeerlo>
              <p>{C.queEs(persona, fechaEnPocasPalabras(lectura.desde, lectura.hoy))}</p>
              <p className="la-vez-pasada__no-se-comparan">{C.noSeComparan}</p>
              <p>{C.escritoLargo}.</p>
            </ComoLeerlo>
          </>
        )
      ) : null}
    </section>
  );
}

/**
 * El cuadro lateral de un ejercicio que no está en la lista de la estimación (RM-16): «Lo que indica el plan» arriba y «La vez
 * pasada» abajo, el mismo diseño que el detalle con la fuerza estimada, sin la fuerza. Abrirlo no cambia nada del plan.
 *
 * WP-GRAFICOS fase 2, rama B (DL-174): debajo, «En el tiempo» abre en el mismo cuadro, con «Atrás», el historial del
 * ejercicio (GR-03 y GR-05; sin GR-02, que es de la lista de la estimación) y su perfil (GR-06).
 */
export function CuadroDeLaVezPasada({
  abierto,
  onCerrar,
  token,
  asesoradoId,
  sesionPerdida,
  exerciseId,
  nombre,
  loQueIndica,
}: {
  abierto: boolean;
  onCerrar: () => void;
  token: string;
  asesoradoId: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  exerciseId: string;
  nombre: string;
  loQueIndica: ReactNode;
}) {
  const { lectura, recargar } = useLaVezPasada(token, asesoradoId, abierto ? exerciseId : undefined, sesionPerdida);
  // WP-GRAFICOS (DL-174): el paso abierto en el mismo cuadro; `null`, el cuadro con «La vez pasada».
  const [paso, setPaso] = useState<PasoDelHistorial | null>(null);
  const cerrar = () => {
    setPaso(null);
    onCerrar();
  };
  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="panel"
      titulo={paso ? COPY_DEL_HISTORIAL.titulo[paso] : nombre}
      sobretitulo={paso ? nombre : null}
      atras={paso ? { texto: `Atrás: ${nombre}`, alTocar: () => setPaso(null) } : null}
      paso={paso ?? 'detalle'}
      className="detalle-con-fuerza cuadro-de-la-vez-pasada"
      onCerrar={cerrar}
    >
      {paso ? (
        <PasoDelHistorialDiferido paso={paso} token={token} asesoradoId={asesoradoId} sesionPerdida={sesionPerdida} exerciseId={exerciseId} nombre={nombre} />
      ) : (
        <div className="detalle-del-ejercicio">
          <section className="detalle-del-ejercicio__plan" aria-label={C.loQueIndicaElPlan}>
            <p className="ejercicio-del-plan__subtitulo">{C.loQueIndicaElPlan}</p>
            <div className="detalle-del-ejercicio__indica">{loQueIndica}</div>
          </section>
          <LaVezPasada lectura={lectura} recargar={recargar} nombre={nombre} />
          <AccesoAlHistorial nombre={nombre} onAbrir={setPaso} />
        </div>
      )}
    </CuadroEnfocado>
  );
}
