'use client';

/**
 * WP-OBJETIVO-Y-CALCULADOR (OBC-07; DL-186) y RP-06 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · «Reparto por comida», a la vista
 * en cada día tipo del editor del plan. La lógica y los textos están en `propuesta-de-rangos.ts`.
 *
 * - Lo que se reparte es lo que rige: los gramos por día del objetivo vigente o, si no los tiene, el cálculo guardado con
 *   él (API-OBC-03); con el día de descanso del cálculo, si corresponde, para elegir cuál usa este día tipo.
 * - Una tabla con cada comida del día tipo y su parte del día, que suma 100; al lado, el rango que se propone de kcal, P,
 *   C y G de cada comida (con su margen), y el del día. Por omisión, la misma parte para las kcal y los tres macros; a
 *   pedido, cada macro por separado (el reparto de antes). «Repartir parejo» y «Sugerido por el nombre de cada comida».
 * - Guarda con API-PLN-03, como un rango escrito a mano. Igual que antes: solo llena los rangos vacíos, y reemplazar lo ya
 *   escrito es una casilla aparte con la lista de lo que se reemplaza.
 * - Antes era un cuadro detrás de «Proponer rangos desde el cálculo del objetivo», para todos los días a la vez: el mismo
 *   cálculo, ahora visible y día por día, sin duplicarlo.
 * - **RP-19 · sin saltos.** Con un error nada cambia de lugar: cada fila muestra siempre su rango (o «—», con el mismo alto);
 *   «Todo el día» dice la suma de las partes en vivo y, en su renglón reservado, lo que falta o sobra; la tabla tiene sus
 *   columnas fijas; el porqué del botón apagado y lo que se guardó van en un renglón reservado al lado del botón, y lo que
 *   aparece después de proponer («Lo que ya escribiste», un error del servidor) va debajo del botón. El chequeo de la suma
 *   de los rangos indicados frente al objetivo (antes, un cuadro arriba de las comidas que aparecía de golpe al proponer)
 *   es un renglón propio debajo del botón (revisión del PR: arriba, al proponer, lo bajaba), con el detalle detrás de un
 *   «?»; sin la tabla del reparto, igual se ve.
 */
import { MACROS_DE_LA_PROPUESTA, numero, type RangoPropuesto, type RangosDelPlan, type ReferenciaYCalculo, type VersionDeObjetivo } from '@be/domain';
import { useEffect, useId, useMemo, useState } from 'react';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { Aviso, RenglonDelAviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { mensajeDeFallo } from '../../../../lib/intento';
import { ICONO_DEL_MACRO } from './abreviaturas-de-macros';
import { CantidadDelMacro, RotuloConIcono } from './cantidad-del-macro';
import {
  chequeoDeLaSuma,
  conParteUnica,
  COPY_PROPUESTA as C,
  cuerpoConLaPropuesta,
  fuenteDeLaPropuesta,
  fueraEnPalabras,
  kcalDeLosGramosDelDia,
  kcalDelRango,
  loQueFaltaDeLaSuma,
  NOMBRE_DEL_MACRO_DE_LA_PROPUESTA,
  parteEscrita,
  parteUnica,
  propuestaDelDia,
  rangoDelDia,
  rangosPorFila,
  repartoInicial,
  repartoInicialUnico,
  sumasEnVivo,
  type ChequeoDeLaSuma,
  type DiaDeLaPropuesta,
  type RepartoEscrito,
  type SumaDeLasPartes,
} from './propuesta-de-rangos';
import { rangoIndicadoDe, type RangosIndicadosHook } from './rangos-indicados-del-plan';
import { SumaDeLosRangosIndicados } from './suma-de-los-rangos';

type LecturaDelCalculo = { estado: 'leyendo' } | { estado: 'listo'; calculo: ReferenciaYCalculo | null } | { estado: 'falla' };

/** API-OBC-03: el cálculo guardado con el objetivo vigente, una vez por objetivo. */
function useCalculoDelObjetivo(token: string, versionId: string | null): LecturaDelCalculo {
  const [lectura, setLectura] = useState<LecturaDelCalculo>({ estado: 'leyendo' });
  useEffect(() => {
    if (!versionId) return;
    let vigente = true;
    setLectura({ estado: 'leyendo' });
    void api.referenciaDelObjetivo(token, versionId).then((r) => {
      if (vigente) setLectura(r.ok ? { estado: 'listo', calculo: r.datos.data.calculation } : { estado: 'falla' });
    });
    return () => {
      vigente = false;
    };
  }, [token, versionId]);
  return lectura;
}

const cifra = (x: { readonly min: number; readonly max: number }): string => (x.min === x.max ? numero(x.min, 0) : `${numero(x.min, 0)} a ${numero(x.max, 0)}`);

/** Para buscar lo que ya está escrito sin una propuesta lista: los nombres no dependen de los números. */
const SIN_NUMEROS: RangoPropuesto = { protein: { min: 0, max: 0 }, carbohydrate: { min: 0, max: 0 }, fat: { min: 0, max: 0 } };

/** RP-19: una cantidad con su ícono o, si no hay una parte que se entienda, «—»: el mismo renglón, con el mismo alto. */
function CantidadOGuion({ macro, x }: { macro: 'kcal' | (typeof MACROS_DE_LA_PROPUESTA)[number]; x: { readonly min: number; readonly max: number } | null }) {
  if (x) return <CantidadDelMacro macro={macro} cifra={cifra(x)} />;
  return (
    <span className="reparto-por-comida__sin-rango" data-sin-rango>
      <span aria-hidden="true">—</span>
      <span className="visualmente-oculto">sin rango</span>
    </span>
  );
}

/**
 * RP-19: la suma de las partes en «Todo el día»: «99 %» (marcado si no da 100), su base («de las 1.985 kcal») y, en un
 * renglón reservado, lo que falta o sobra en la unidad de la base («faltan 20 kcal»; vacío si da 100). El lector de
 * pantalla oye la frase entera.
 */
function SumaEnVivo({ s, base, completa }: { s: SumaDeLasPartes; base: { readonly cantidad: number; readonly unidad: 'kcal' | 'g' }; completa: string }) {
  const falta = loQueFaltaDeLaSuma(s, base);
  return (
    <span className="reparto-por-comida__suma" data-suma-bien={s.bien ? '' : undefined}>
      <span className="reparto-por-comida__suma-cifra" aria-hidden="true">
        {C.sumaEnVivo(s.suma)}
      </span>
      <span className="reparto-por-comida__base" aria-hidden="true">
        {C.baseDeLaSuma(base.cantidad, base.unidad)}
      </span>
      <span className="visualmente-oculto">{falta ? `${completa}: ${falta}` : completa}</span>
      <RenglonDelAviso tipo={s.bien ? 'nota' : 'error'} aria-hidden="true" data-lo-que-falta>
        {falta}
      </RenglonDelAviso>
    </span>
  );
}

/** RP-19: el chequeo en una línea, con sus íconos. Ubica, no califica: sin colores de error ni de éxito (NUP-06). */
function LineaDelChequeo({ c }: { c: Exclude<ChequeoDeLaSuma, { estado: 'sin-rangos' }> }) {
  if (c.estado === 'contiene') {
    return (
      <>
        {C.contieneElObjetivo}{' '}
        <span className="reparto-por-comida__iconos" aria-hidden="true">
          {(['kcal', ...MACROS_DE_LA_PROPUESTA] as const).map((m) => (
            <Icono key={m} nombre={ICONO_DEL_MACRO[m]} tamano={15} />
          ))}
        </span>
      </>
    );
  }
  if (c.estado === 'afuera') {
    return (
      <>
        {C.quedaAfuera}:{' '}
        {c.afuera.map((f, n) => (
          <span key={f.clave}>
            {n > 0 ? '; ' : null}
            <RotuloConIcono macro={f.clave} texto={fueraEnPalabras(f)} />
          </span>
        ))}
        .
      </>
    );
  }
  return <>{C.sinComparar(c.claves.map((k) => (k === 'kcal' ? 'kcal' : NOMBRE_DEL_MACRO_DE_LA_PROPUESTA[k].toLowerCase())))}</>;
}

/**
 * El reparto por comida de un día tipo. `dia`: el día con sus comidas ya guardadas; `null` si el día todavía no se
 * guardó. `comidasSinGuardar`: cuántas comidas del día todavía no tienen identidad (reciben su parte al guardar).
 * `nombreDelDia`: donde se listan los repartos de todos los días tipo (el paso de los rangos del asistente), el título dice
 * de qué día es; dentro de un día tipo, su pestaña ya lo dice.
 */
export function RepartoPorComida({
  token,
  planId,
  objetivo,
  dia,
  comidasSinGuardar = 0,
  nombreDelDia = null,
  rangos,
}: {
  token: string;
  planId: string;
  objetivo: VersionDeObjetivo | null;
  dia: DiaDeLaPropuesta | null;
  comidasSinGuardar?: number;
  nombreDelDia?: string | null;
  rangos: RangosIndicadosHook;
}) {
  const id = useId();
  const calculo = useCalculoDelObjetivo(token, objetivo?.versionId ?? null);
  const [tolerancia, setTolerancia] = useState('10');
  const [escrito, setEscrito] = useState<RepartoEscrito | null>(null);
  const [porMacro, setPorMacro] = useState(false);
  const [reemplazar, setReemplazar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // RP-19: lo que se guardó, en el renglón al lado del botón (antes, un aviso arriba de la lista de rangos del asistente,
  // que corría todo lo de abajo; en el editor no se veía).
  const [hecho, setHecho] = useState<string | null>(null);
  // El reparto escrito es de este día tipo: con otras comidas, vuelve al punto de partida. Revisión del PR: la clave son
  // las comidas, no sus nombres; con el nombre, cambiarle el nombre a una comida borraba las partes que se habían escrito.
  const claveDelDia = dia ? `${dia.dayTypeId}|${dia.comidas.map((c) => c.mealId).join(',')}` : '';
  useEffect(() => {
    setEscrito(null);
    setPorMacro(false);
    setReemplazar(false);
    setError(null);
    setHecho(null);
  }, [claveDelDia]);

  const fuente = calculo.estado === 'listo' ? fuenteDeLaPropuesta(objetivo, calculo.calculo) : null;
  const r = escrito ?? (dia ? repartoInicialUnico(dia) : null);
  const t = Number(tolerancia.replace(',', '.'));
  const toleranciaValida = /^\d+([.,]\d+)?$/.test(tolerancia.trim()) && t >= 0 && t <= 50;
  const p = useMemo(() => (dia && r && fuente && toleranciaValida ? propuestaDelDia(dia, r, fuente, t) : null), [dia, r, fuente, toleranciaValida, t]);

  if (rangos.estado.estado !== 'listo' || rangos.estado.datos.state === 'ACTIVATED' || !objetivo) return null;
  const datos: RangosDelPlan = rangos.estado.datos;
  const cambiar = (e: RepartoEscrito) => {
    setEscrito(e);
    setError(null);
    setHecho(null);
  };

  // El «?» va al lado del título y no adentro: el título nombra la sección, y la explicación no se le suma al abrirla.
  const encabezado = (
    <div className="reparto-por-comida__titulo">
      <h3 id={`${id}-titulo`}>
        <Icono nombre="objetivo" tamano={18} />
        {nombreDelDia ? C.tituloDelDia(nombreDelDia) : C.titulo}
      </h3>
      <ExplicacionAPedido nombre={C.queEsNombre}>{C.queEs}</ExplicacionAPedido>
    </div>
  );
  if (!dia || dia.comidas.length === 0) {
    return (
      <section className="reparto-por-comida" aria-labelledby={`${id}-titulo`} data-reparto-por-comida>
        {encabezado}
        {/* Con comidas nuevas todavía sin guardar, lo que falta es guardar; sin ninguna, agregarlas. */}
        <p className="nota" data-reparto-sin-comidas>{dia && comidasSinGuardar === 0 ? C.sinComidasGuardadas : C.sinDiaGuardado}</p>
      </section>
    );
  }
  if (!r) return null;
  const gramos = fuente ? (r.variante === 'descanso' && fuente.descanso ? fuente.descanso : fuente.dia) : null;
  // RP-19: cada fila con su rango, siempre; el día, con su margen, sin depender del reparto; la suma de las partes, en vivo.
  const filas = fuente && toleranciaValida ? rangosPorFila(dia, r, fuente, t) : null;
  const delDia = fuente && toleranciaValida ? rangoDelDia(fuente, r.variante, t) : null;
  const sumas = sumasEnVivo(dia, r);
  // La base del «%»: lo que suman los gramos del día, de donde salen las kcal de cada comida.
  const base = gramos ? kcalDeLosGramosDelDia(gramos) : 0;
  const listo = p?.ok ? { dayTypeId: dia.dayTypeId, dia: p.dia, comidas: dia.comidas.map((c, j) => ({ mealId: c.mealId, rango: p.comidas[j]! })) } : null;
  const nombre = (_: string, mealId: string | null) => (mealId === null ? 'todo el día' : (dia.comidas.find((c) => c.mealId === mealId)?.nombre ?? 'una comida'));
  // RP-19: lo que ya está escrito no depende de que la propuesta esté lista (antes, «Lo que ya escribiste» aparecía y se iba
  // con la suma). Sin propuesta, se busca con números vacíos: lo que se manda sale solo de `listo`.
  const destino = listo ?? { dayTypeId: dia.dayTypeId, dia: SIN_NUMEROS, comidas: dia.comidas.map((c) => ({ mealId: c.mealId, rango: SIN_NUMEROS })) };
  const vistaPrevia = cuerpoConLaPropuesta(datos, [destino], nombre, reemplazar);
  const conReemplazo = cuerpoConLaPropuesta(datos, [destino], nombre, true);
  const yaEscritos = conReemplazo.reemplazados.length;
  const nuevos = vistaPrevia.nuevos + vistaPrevia.reemplazados.length;
  // RP-19 (pedido del 22/11): la suma de los rangos indicados frente al objetivo, en un renglón propio del reparto.
  const comidasConRango = dia.comidas.map((c) => ({ nombre: c.nombre, rango: rangoIndicadoDe(rangos.estado, dia.dayTypeId, c.mealId) }));
  const chequeo = chequeoDeLaSuma(comidasConRango, objetivo);
  // RP-19 (pedido del 22/11): la suma de los rangos indicados frente al objetivo, en una línea y en su lugar. Sin rangos
  // indicados, el renglón queda vacío con el mismo alto; el detalle por macro, detrás del «?», se abre hacia abajo.
  // Revisión del PR:
  // - Va debajo de «Proponer estos rangos», no arriba: cambia al proponer, y con el objetivo afuera (por ejemplo, las kcal
  //   escritas lejos de las que suman los gramos, o un margen chico) ocupa dos renglones o más. Arriba del botón, lo bajaba.
  // - Sin la tabla del reparto (un objetivo sin gramos por día ni cálculo con macros, o un cálculo que no se pudo leer),
  //   el chequeo igual se ve: antes, el cuadro de la suma de NUP-06 estaba siempre arriba de las comidas.
  // - Solo la línea está en vivo: el detalle que se abre con el «?» no se anuncia entero.
  const renglonDelChequeo = (
    <div className="renglon-del-aviso renglon-del-aviso--con-boton reparto-por-comida__chequeo" data-chequeo-de-la-suma={chequeo.estado}>
      <span className="reparto-por-comida__chequeo-texto" aria-live="polite">
        {chequeo.estado === 'sin-rangos' ? null : (
          <>
            <Icono nombre="objetivo" tamano={15} />
            <span>
              <LineaDelChequeo c={chequeo} />
            </span>
          </>
        )}
      </span>
      {chequeo.estado === 'sin-rangos' ? null : (
        <ExplicacionAPedido nombre={C.detalleDeLaSuma} como="div">
          <SumaDeLosRangosIndicados comidas={comidasConRango} objetivo={objetivo} enDetalle />
        </ExplicacionAPedido>
      )}
    </div>
  );

  async function proponer() {
    if (!listo || nuevos === 0) return;
    setEnviando(true);
    setError(null);
    setHecho(null);
    const respuesta = await api.escribirRangosDelPlan(token, planId, cuerpoConLaPropuesta(datos, [listo], nombre, reemplazar).cuerpo);
    setEnviando(false);
    if (respuesta.ok) {
      rangos.setDatos(respuesta.datos.data);
      setHecho(C.guardado(nuevos));
      setReemplazar(false);
      return;
    }
    if (respuesta.tipo === 'API' && (respuesta.codigo === 'VERSION_CONFLICT' || respuesta.issues.some((i) => i.code === 'RANGE_TARGET_NOT_IN_PLAN'))) {
      await rangos.recargar();
      return setError('Los rangos o el plan cambiaron mientras repartías: se volvieron a leer. Revisá el reparto y proponé otra vez.');
    }
    setError(mensajeDeFallo(respuesta));
  }

  // Por qué el botón está apagado, o lo que se guardó: en el renglón reservado al lado del botón.
  const bloqueo = !toleranciaValida ? C.margenInvalido : !listo ? C.noSuman : nuevos === 0 ? C.nadaQueGuardar : null;
  const renglonDelBoton = enviando ? null : (hecho ?? bloqueo ?? (comidasSinGuardar > 0 ? C.sinGuardar : null));
  const ilegible = (texto: string | undefined) => (texto ?? '').trim() !== '' && parteEscrita(texto) === null;

  return (
    <section className="reparto-por-comida" aria-labelledby={`${id}-titulo`} data-reparto-por-comida>
      {encabezado}
      {calculo.estado === 'leyendo' ? <p className="nota" role="status">Leyendo el objetivo…</p> : null}
      {calculo.estado === 'falla' ? <p className="nota">No se pudo leer el cálculo del objetivo. Se vuelve a intentar al abrir de nuevo el editor.</p> : null}
      {calculo.estado === 'listo' && !fuente ? <p className="nota">{C.sinFuente}</p> : null}
      {calculo.estado !== 'leyendo' && !(fuente && gramos) ? renglonDelChequeo : null}
      {fuente && gramos ? (
        <>
          <p className="nota" data-fuente-de-la-propuesta>
            {fuente.texto}: <CantidadDelMacro macro="kcal" cifra={numero(gramos.kcal, 0)} /> · <CantidadDelMacro macro="protein" cifra={numero(gramos.protein, 0)} /> ·{' '}
            <CantidadDelMacro macro="carbohydrate" cifra={numero(gramos.carbohydrate, 0)} /> · <CantidadDelMacro macro="fat" cifra={numero(gramos.fat, 0)} />
          </p>
          <div className="reparto-por-comida__controles">
            {fuente.descanso ? (
              <fieldset className="segmentos">
                <legend>{C.variante}</legend>
                <div className="segmentos__fila">
                  <label className="segmento">
                    <input type="radio" name={`${id}-variante`} checked={r.variante === 'dia'} onChange={() => cambiar({ ...r, variante: 'dia' })} /> Día de entrenamiento ({numero(fuente.dia.kcal, 0)} kcal)
                  </label>
                  <label className="segmento">
                    <input type="radio" name={`${id}-variante`} checked={r.variante === 'descanso'} onChange={() => cambiar({ ...r, variante: 'descanso' })} /> Día de descanso ({numero(fuente.descanso.kcal, 0)} kcal)
                  </label>
                </div>
              </fieldset>
            ) : null}
            <button type="button" className="boton boton--quieto boton--compacto" onClick={() => cambiar(porMacro ? repartoInicial(dia, 'parejo', r.variante) : repartoInicialUnico(dia, 'parejo', r.variante))}>
              {C.parejo}
            </button>
            <button type="button" className="boton boton--quieto boton--compacto" onClick={() => cambiar(porMacro ? repartoInicial(dia, 'sugerido', r.variante) : repartoInicialUnico(dia, 'sugerido', r.variante))}>
              {C.sugerido}
            </button>
            <ExplicacionAPedido nombre={C.sugerido}>{C.sugeridoAyuda}</ExplicacionAPedido>
            <span className="reparto-por-comida__margen">
              <label htmlFor={`${id}-tolerancia`}>{C.tolerancia}</label>
              <input
                id={`${id}-tolerancia`}
                inputMode="decimal"
                size={3}
                aria-invalid={toleranciaValida ? undefined : true}
                value={tolerancia}
                onChange={(e) => (setTolerancia(e.target.value), setError(null), setHecho(null))}
                data-margen-del-reparto
              />
            </span>
            <label className="opcion-en-linea">
              <input
                type="checkbox"
                checked={porMacro}
                onChange={(e) => {
                  setPorMacro(e.target.checked);
                  // Al volver a una parte por comida, cada comida toma la de sus proteínas si los macros diferían.
                  if (!e.target.checked) cambiar(dia.comidas.reduce((x, c) => conParteUnica(x, c.mealId, parteUnica(x, c.mealId) ?? x.comidas[c.mealId]?.protein ?? ''), r));
                }}
              />{' '}
              {C.porMacro}
            </label>
          </div>
          {/* RP-19: columnas fijas (`table-layout: fixed` y anchos por columna): lo que se escribe no reacomoda la tabla. */}
          <div className="desplazable-x">
            <table className={`tabla reparto-por-comida__tabla${porMacro ? ' reparto-por-comida__tabla--por-macro' : ''}`} data-tabla-del-reparto>
              <caption className="visualmente-oculto">
                {C.titulo}: {dia.nombre}
              </caption>
              <colgroup>
                <col className="reparto-por-comida__col-comida" />
                {porMacro ? null : <col className="reparto-por-comida__col-parte" />}
                <col className="reparto-por-comida__col-kcal" />
                {MACROS_DE_LA_PROPUESTA.map((m) => (
                  <col key={m} className="reparto-por-comida__col-macro" />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Comida</th>
                  {porMacro ? null : (
                    <th scope="col">
                      {C.parte}
                      {/* El «%» de cada parte, con su base, una vez: en el rótulo de la columna. */}
                      <span id={`${id}-base`} className="reparto-por-comida__base">
                        {C.deLasKcal(base)}
                      </span>
                    </th>
                  )}
                  <th scope="col">
                    <RotuloConIcono macro="kcal" texto="kcal" />
                  </th>
                  {MACROS_DE_LA_PROPUESTA.map((m) => (
                    <th key={m} scope="col">
                      <RotuloConIcono macro={m} texto={NOMBRE_DEL_MACRO_DE_LA_PROPUESTA[m]} />
                      {porMacro ? (
                        <span id={`${id}-base-${m}`} className="reparto-por-comida__base">
                          {C.deLosGramos(gramos[m])}
                        </span>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dia.comidas.map((comida, j) => {
                  const fila = filas?.[j] ?? null;
                  const unica = parteUnica(r, comida.mealId);
                  return (
                    <tr key={comida.mealId}>
                      <th scope="row">{comida.nombre}</th>
                      {porMacro ? null : (
                        <td>
                          <span className="reparto-por-comida__parte">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              inputMode="numeric"
                              aria-label={C.parteDe(comida.nombre)}
                              aria-describedby={`${id}-base`}
                              aria-invalid={ilegible(unica ?? undefined) ? true : undefined}
                              value={unica ?? ''}
                              onChange={(e) => cambiar(conParteUnica(r, comida.mealId, e.target.value))}
                              data-parte-de-la-comida
                            />
                          </span>
                        </td>
                      )}
                      <td data-kcal-propuestas>
                        <CantidadOGuion macro="kcal" x={fila?.kcal ?? null} />
                      </td>
                      {MACROS_DE_LA_PROPUESTA.map((m) => (
                        <td key={m}>
                          {porMacro ? (
                            <span className="reparto-por-comida__parte">
                              <input
                                inputMode="decimal"
                                size={3}
                                aria-label={`${NOMBRE_DEL_MACRO_DE_LA_PROPUESTA[m]} de ${comida.nombre}, parte del día`}
                                aria-describedby={`${id}-base-${m}`}
                                aria-invalid={ilegible(r.comidas[comida.mealId]?.[m]) ? true : undefined}
                                value={r.comidas[comida.mealId]?.[m] ?? ''}
                                onChange={(e) => cambiar({ ...r, comidas: { ...r.comidas, [comida.mealId]: { ...(r.comidas[comida.mealId] ?? { protein: '', carbohydrate: '', fat: '' }), [m]: e.target.value } } })}
                                data-parte-del-macro={m}
                              />
                            </span>
                          ) : null}
                          {/* RP-19: el renglón del rango está siempre; sin una parte que se entienda, «—». */}
                          <span className="reparto-por-comida__rango" data-rango-propuesto>
                            <CantidadOGuion macro={m} x={fila?.macros[m] ?? null} />
                          </span>
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr className="reparto-por-comida__fila-del-dia">
                  <th scope="row">Todo el día</th>
                  {porMacro ? null : (
                    <td data-suma-de-las-partes>
                      <SumaEnVivo s={sumas.protein} base={{ cantidad: base, unidad: 'kcal' }} completa={C.sumaDeLasPartes(sumas.protein.suma, base)} />
                    </td>
                  )}
                  <td>
                    <CantidadOGuion macro="kcal" x={delDia ? kcalDelRango(delDia) : null} />
                  </td>
                  {MACROS_DE_LA_PROPUESTA.map((m) => (
                    <td key={m} data-rango-del-dia-propuesto>
                      {porMacro ? (
                        <SumaEnVivo s={sumas[m]} base={{ cantidad: gramos[m], unidad: 'g' }} completa={C.sumaDelMacro(NOMBRE_DEL_MACRO_DE_LA_PROPUESTA[m], sumas[m].suma, gramos[m])} />
                      ) : null}
                      <span className="reparto-por-comida__rango">
                        <CantidadOGuion macro={m} x={delDia?.[m] ?? null} />
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="acciones reparto-por-comida__acciones">
            <button type="button" className="boton boton--secundario" data-proponer-rangos disabled={enviando || bloqueo !== null} aria-busy={enviando} onClick={() => void proponer()}>
              {enviando ? C.guardando : C.proponer}
            </button>
            <RenglonDelAviso juntoAlBoton anunciar tipo={hecho && renglonDelBoton === hecho ? 'exito' : 'nota'} data-por-que-no-se-propone>
              {renglonDelBoton}
            </RenglonDelAviso>
          </div>
          {renglonDelChequeo}
          {/* RP-19: lo que aparece después de proponer va debajo del botón: no lo corre. */}
          {error ? <Aviso tipo="error">{error}</Aviso> : null}
          {yaEscritos > 0 ? (
            <fieldset className="grupo grupo--anidado" data-reemplazar-rangos>
              <legend>Lo que ya escribiste</legend>
              <label className="opcion-en-linea">
                <input type="checkbox" checked={reemplazar} onChange={(e) => (setReemplazar(e.target.checked), setHecho(null))} /> {yaEscritos === 1 ? C.reemplazarUno : C.reemplazar(yaEscritos)}
              </label>
              <p className="nota">{reemplazar ? C.seReemplazan(conReemplazo.reemplazados.join(', ')) : C.seConservan(vistaPrevia.conservados.join(', '))}</p>
            </fieldset>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
