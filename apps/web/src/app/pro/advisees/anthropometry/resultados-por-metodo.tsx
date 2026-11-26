'use client';

/**
 * DL-200 · Los resultados de una toma, método por método y sin casilleros (WP-ANTROPOMETRIA-RESULTADOS, AR-01 a AR-04).
 *
 * - **Arriba, el resumen** del método elegido para esta toma: «% de grasa 14,8 % del peso corporal · masa grasa 11,4 kg ·
 *   masa libre de grasa 65,6 kg · suma de 7 pliegues 82,0 mm», cada valor con su origen y su cambio desde la toma anterior.
 * - **Debajo, cada método en su desplegable**, con todo lo que da y lo que se deriva, en el orden en que se lee una
 *   evaluación: lo medido, la ecuación, la conversión, las masas y el fraccionamiento. Cada valor dice de dónde sale y
 *   tiene su «?» en la esquina con la fórmula, la cuenta resuelta y la fuente. Lo que falta para un paso se dice en ese
 *   paso, con nombre.
 * - Se muestran los métodos elegidos para la toma (los de la dirección, que vienen de «Qué vas a calcular»), los que ya
 *   tienen resultados guardados y todos los que dan algo con lo medido, en el orden del catálogo: nunca por «mejor»
 *   (REG-06-205). Nada se tilda para ver un resultado.
 * - **Las ecuaciones por sexo y la conversión** (Siri o Brožek) se eligen arriba, una vez para toda la toma: cambian los
 *   números en su lugar, sin mover nada (RP-19). El sexo no es un dato de la toma (DL-111, decisión 5): viene de lo que
 *   se guardó con la toma, de la figura con que se midió o, si no, se elige acá.
 * - Un paso que tiene su método en el catálogo y ya está guardado dice «En la historia» y abre su detalle (con qué se
 *   calculó, y «Dejar como referencia»). Lo que falta guardar se guarda con un botón por método (AR-05).
 *
 * La lógica es del dominio (`resultados-antropometricos.ts`, con sus pruebas); acá solo se dibuja.
 */
import {
  cuentaDeEjemplo,
  diferenciaDelPaso,
  leerProgramas,
  marcaDeLaClase,
  metodosConResultado,
  pasosDelResultado,
  PROGRAMAS_DE_RESULTADO,
  programasDeLasMetricas,
  resultadoDelMetodo,
  sexoDelMetodo,
  textoDeLoQueFalta,
  textoDelPasoDeLaCadena,
  textoDelValorAlLado,
  TITULO_DE_LA_CATEGORIA,
  valoresParaLaCadena,
  corridaVigente,
  type ConversionDeDensidad,
  type CorridaDeCalculoApi,
  type EvaluacionAntropometricaApi,
  type MetodoApi,
  type PasoDeLaCadena,
  type ResultadoDelMetodo,
  type SexoDeLaCadena,
} from '@be/domain';
import { useId, useMemo, useState } from 'react';
import { conNumerosPegados } from '../../../../components/en-partes';
import { ExplicacionAPedido } from '../../../../components/explicacion-a-pedido';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { dia } from '../../../../lib/formato';
import { useClaveDeIntento } from '../../../../lib/intento';
import { useAntropometria } from './antropometria';
import { guardarEnLaHistoria, metodosParaGuardar } from './guardar-en-la-historia';
import { Marca } from './marca';

/** Lo que dice la dirección sobre cómo se leen los resultados de esta toma. */
function useEleccionDeLaLectura() {
  const { parametros, ir } = useAntropometria();
  const ecuaciones = parametros.get('ecuaciones');
  return {
    sexoPedido: ecuaciones === 'mujer' ? ('MUJER' as const) : ecuaciones === 'hombre' ? ('HOMBRE' as const) : null,
    conversion: (parametros.get('conversion') === 'brozek' ? 'BROZEK' : 'SIRI') as ConversionDeDensidad,
    resumenPedido: parametros.get('resumen'),
    elegidos: leerProgramas(parametros.get('metodos')).programas,
    ir,
  };
}

/** El sexo de la ecuación que ya quedó en la toma: el de sus resultados guardados con una ecuación por sexo. */
function sexoDeLasCorridas(corridas: readonly CorridaDeCalculoApi[], metodos: readonly MetodoApi[]): SexoDeLaCadena | null {
  for (const c of corridas) {
    const m = metodos.find((x) => x.methodId === c.methodId);
    const s = m ? sexoDelMetodo(m) : null;
    if (s) return s;
  }
  return null;
}

export function ResultadosPorMetodo({
  toma,
  anterior,
  metodos,
  corridas,
  onAbrir,
  onGuardado,
}: {
  toma: EvaluacionAntropometricaApi;
  /** La toma registrada anterior, si su detalle ya llegó: para la evolución de cada valor. */
  anterior: EvaluacionAntropometricaApi | null;
  metodos: readonly MetodoApi[];
  /** Todas las corridas de la persona (API-CAL-02). */
  corridas: readonly CorridaDeCalculoApi[];
  onAbrir: (corridaId: string) => void;
  /** Después de guardar en la historia: el texto para decirlo. Vuelve a leer la toma y los cálculos. */
  onGuardado: (texto: string) => Promise<void>;
}) {
  const id = useId();
  const { sexoPedido, conversion, resumenPedido, elegidos, ir } = useEleccionDeLaLectura();
  const vigentes = useMemo(() => corridas.filter((c) => c.evaluationId === toma.evaluationId && corridaVigente(c)), [corridas, toma.evaluationId]);
  const sexoGuardado = useMemo(() => sexoDeLasCorridas(vigentes, metodos), [vigentes, metodos]);
  const sexo: SexoDeLaCadena = sexoPedido ?? sexoGuardado ?? 'HOMBRE';
  const { valores } = useMemo(() => valoresParaLaCadena(toma.measurements), [toma.measurements]);
  const deAntes = useMemo(() => (anterior ? valoresParaLaCadena(anterior.measurements).valores : null), [anterior]);

  // Los métodos de esta toma: los elegidos, los que tienen resultados guardados y los que dan algo, en el orden del catálogo.
  const usados = useMemo(() => programasDeLasMetricas(vigentes.map((c) => c.result.metric)), [vigentes]);
  const claves = useMemo(() => {
    const conAlgo = new Set([...elegidos, ...usados, ...metodosConResultado(valores, sexo)]);
    return PROGRAMAS_DE_RESULTADO.map((p) => p.clave).filter((c) => conAlgo.has(c));
  }, [elegidos, usados, valores, sexo]);
  const resultados = useMemo(() => claves.map((c) => resultadoDelMetodo(c, valores, sexo, conversion)!).filter(Boolean), [claves, valores, sexo, conversion]);
  const anteriores = useMemo(() => new Map(deAntes ? claves.map((c) => [c, resultadoDelMetodo(c, deAntes, sexo, conversion)!] as const) : []), [claves, deAntes, sexo, conversion]);

  // El resumen: el método pedido; si no, el elegido para la toma, el guardado, o el primero de grasa que da algo.
  const deGrasa = resultados.find((r) => r.programa.categoria === 'GRASA' && r.calculado)?.programa.clave;
  const principal = [resumenPedido, ...elegidos, ...usados, deGrasa, claves[0]].find((c): c is string => !!c && claves.includes(c)) ?? null;
  const delResumen = resultados.find((r) => r.programa.clave === principal) ?? null;
  const hayConversion = resultados.some((r) => r.programa.conConversion && r.calculado);
  const hayPorSexo = resultados.some((r) => r.programa.porSexo);

  /** La corrida guardada de un paso en esta toma, si la hay: por el método del catálogo que da ese mismo valor. */
  const corridaDe = (p: PasoDeLaCadena): CorridaDeCalculoApi | null => {
    if (!p.metodoDelCatalogo) return null;
    const metodo = metodos.find((m) => m.key === p.metodoDelCatalogo);
    return metodo ? (vigentes.find((c) => c.methodId === metodo.methodId) ?? null) : null;
  };
  const cambioDesdeAntes = (programa: string, p: PasoDeLaCadena): string | null => {
    const antes = anteriores.get(programa);
    const suyo = antes ? pasosDelResultado(antes).find((x) => x.clave === p.clave) : null;
    return diferenciaDelPaso(p, suyo);
  };

  if (resultados.length === 0) {
    return <p className="nota resultados-de-la-toma__sin-calculos">Con lo medido en esta toma todavía no hay un método que dé un resultado. Elegí el método antes de medir y la figura pide lo que necesita.</p>;
  }

  return (
    <div className="resultados-por-metodo" data-resultados-por-metodo>
      {/* Cómo se leen: una vez para toda la toma. Cambiar no mueve nada: los números cambian en su lugar. */}
      {hayPorSexo || hayConversion ? (
        <div className="resultados-por-metodo__lectura">
          {hayPorSexo ? (
            <fieldset className="segmentos">
              <legend>Ecuaciones de</legend>
              <div className="segmentos__fila">
                {(['HOMBRE', 'MUJER'] as const).map((s) => (
                  <label key={s} className="segmento">
                    <input type="radio" name={`${id}-sexo`} checked={sexo === s} onChange={() => ir({ ecuaciones: s === 'MUJER' ? 'mujer' : 'hombre' })} />
                    {s === 'MUJER' ? 'Mujeres' : 'Hombres'}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          {hayConversion ? (
            <fieldset className="segmentos">
              <legend>% de grasa con</legend>
              <div className="segmentos__fila">
                {(['SIRI', 'BROZEK'] as const).map((c) => (
                  <label key={c} className="segmento">
                    <input type="radio" name={`${id}-conversion`} checked={conversion === c} onChange={() => ir({ conversion: c === 'BROZEK' ? 'brozek' : null })} />
                    {c === 'SIRI' ? 'Siri' : 'Brožek'}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          {hayPorSexo && !sexoPedido ? (
            <p className="nota resultados-por-metodo__de-donde">{sexoGuardado ? 'Las de los resultados guardados con esta toma.' : 'Elegí las de la persona: la toma no lo guarda.'}</p>
          ) : null}
        </div>
      ) : null}

      {delResumen ? <Resumen resultado={delResumen} elegibles={resultados} anterior={anterior} cambio={(p) => cambioDesdeAntes(delResumen.programa.clave, p)} onElegir={(c) => ir({ resumen: c })} /> : null}

      <div className="resultados-por-metodo__lista">
        <h4 className="resultados-por-metodo__subtitulo">Por método</h4>
        {resultados.map((r) => (
          <MetodoDeLaToma
            key={`${r.programa.clave}-${toma.evaluationId}`}
            resultado={r}
            abierto={r.programa.clave === principal}
            toma={toma}
            metodos={metodos}
            corridas={corridas}
            corridaDe={corridaDe}
            cambio={(p) => cambioDesdeAntes(r.programa.clave, p)}
            onAbrir={onAbrir}
            onGuardado={onGuardado}
          />
        ))}
      </div>
    </div>
  );
}

/** El resumen de arriba: los valores del método, grandes, con su origen y su cambio desde la toma anterior. */
function Resumen({
  resultado,
  elegibles,
  anterior,
  cambio,
  onElegir,
}: {
  resultado: ResultadoDelMetodo;
  elegibles: readonly ResultadoDelMetodo[];
  anterior: EvaluacionAntropometricaApi | null;
  cambio: (p: PasoDeLaCadena) => string | null;
  onElegir: (clave: string) => void;
}) {
  const id = useId();
  const conValor = elegibles.filter((r) => r.calculado);
  return (
    <section className="resumen-de-la-toma" aria-labelledby={`${id}-titulo`} data-resumen-de-la-toma={resultado.programa.clave}>
      <div className="resumen-de-la-toma__cabecera">
        <h4 id={`${id}-titulo`}>
          <span className="resumen-de-la-toma__rotulo">Resumen</span> {conNumerosPegados(resultado.programa.nombre)}
        </h4>
        {conValor.length > 1 ? (
          <div className="campo campo--en-linea resumen-de-la-toma__elegir">
            <label htmlFor={`${id}-con`}>Resumen con</label>
            <select id={`${id}-con`} value={resultado.programa.clave} onChange={(e) => onElegir(e.target.value)}>
              {conValor.map((r) => (
                <option key={r.programa.clave} value={r.programa.clave}>
                  {r.programa.nombre}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      {resultado.resumen.length > 0 ? (
        <dl className="resumen-de-la-toma__valores">
          {resultado.resumen.map((p) => {
            const delta = cambio(p);
            return (
              <div key={p.clave} className="resumen-de-la-toma__valor" data-paso={p.clave}>
                <dt>{p.nombre}</dt>
                <dd>
                  <span className="resumen-de-la-toma__numero">{textoDelPasoDeLaCadena({ ...p, base: null })}</span>
                  {p.base ? <span className="resumen-de-la-toma__base">{p.base}</span> : null}
                  <span className="resumen-de-la-toma__origen">{p.origen}</span>
                  {delta !== null && anterior ? (
                    <span className="resumen-de-la-toma__cambio">
                      {delta} desde el {dia(anterior.occurredAt)}
                    </span>
                  ) : null}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : (
        <p className="nota">Este método todavía no da un resultado con lo medido: abajo, en su desplegable, dice qué falta.</p>
      )}
    </section>
  );
}

/** Un método en su desplegable: las etapas, cada paso con su valor, su origen, su «?» y lo que le falta. */
function MetodoDeLaToma({
  resultado,
  abierto,
  toma,
  metodos,
  corridas,
  corridaDe,
  cambio,
  onAbrir,
  onGuardado,
}: {
  resultado: ResultadoDelMetodo;
  abierto: boolean;
  toma: EvaluacionAntropometricaApi;
  metodos: readonly MetodoApi[];
  corridas: readonly CorridaDeCalculoApi[];
  corridaDe: (p: PasoDeLaCadena) => CorridaDeCalculoApi | null;
  cambio: (p: PasoDeLaCadena) => string | null;
  onAbrir: (corridaId: string) => void;
  onGuardado: (texto: string) => Promise<void>;
}) {
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useAntropometria();
  const intento = useClaveDeIntento();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { programa } = resultado;
  const pasos = pasosDelResultado(resultado);
  const primero = resultado.resumen[0] ?? null;
  const enLaHistoria = pasos.some((p) => corridaDe(p));
  const paraGuardar = metodosParaGuardar([resultado], toma, metodos, corridas);
  const faltanEnTotal = [...new Set(pasos.flatMap((p) => p.faltan))].length;

  async function guardar() {
    setError(null);
    setGuardando(true);
    const r = await guardarEnLaHistoria({ token, asesoradoId, toma, metodos: paraGuardar, intento, corta: (res) => sesionPerdida(res) || accesoRetirado(res) });
    setGuardando(false);
    if (r.tipo === 'cortado') return;
    if (r.fallidos.length > 0) setError(`No se pudo guardar: ${r.fallidos.join(', ')}. Lo demás quedó como estaba; probá de nuevo en un momento.`);
    if (r.guardados > 0) await onGuardado(r.guardados === 1 ? `Se guardó 1 resultado de ${programa.nombre} en la historia.` : `Se guardaron ${r.guardados} resultados de ${programa.nombre} en la historia.`);
  }

  return (
    <details className="metodo-de-la-toma" open={abierto} data-metodo={programa.clave}>
      <summary className="metodo-de-la-toma__cabecera">
        <Icono nombre="abajo" tamano={18} />
        <span className="metodo-de-la-toma__nombre">
          {conNumerosPegados(programa.nombre)}
          <span className="metodo-de-la-toma__categoria">{TITULO_DE_LA_CATEGORIA[programa.categoria]}</span>
        </span>
        <span className="metodo-de-la-toma__estado">
          {enLaHistoria ? <span className="etiqueta-de-dato">En la historia</span> : null}
          <span className="metodo-de-la-toma__primero">{primero ? textoDelPasoDeLaCadena(primero) : faltanEnTotal > 0 ? `Faltan ${faltanEnTotal} ${faltanEnTotal === 1 ? 'medida' : 'medidas'}` : 'Sin calcular'}</span>
        </span>
      </summary>
      <div className="metodo-de-la-toma__cuerpo">
        {resultado.etapas.map((e) => (
          <section key={e.etapa + e.titulo} className="etapa-de-la-cadena" data-etapa={e.etapa}>
            <h5 className="etapa-de-la-cadena__titulo">{e.titulo}</h5>
            {e.nota ? <p className="nota etapa-de-la-cadena__nota">{e.nota}</p> : null}
            <ul className="etapa-de-la-cadena__pasos">
              {e.pasos.map((p) => (
                <li key={p.clave}>
                  <PasoDeLaToma paso={p} programa={programa.clave} sexo={resultado.sexo} conversion={resultado.conversion} corrida={corridaDe(p)} cambio={cambio(p)} onAbrir={onAbrir} />
                </li>
              ))}
            </ul>
          </section>
        ))}
        {error ? (
          <Aviso tipo="error" enfocar>
            <p>{error}</p>
          </Aviso>
        ) : null}
        {paraGuardar.length > 0 ? (
          <div className="metodo-de-la-toma__pie">
            <p className="nota">
              {paraGuardar.length === 1 ? 'Un resultado de este método tiene' : `${paraGuardar.length} resultados de este método tienen`} su método en el catálogo: guardado en la historia, entra en la evolución y en la app de la persona. Lo
              demás se calcula en el momento, desde lo medido.
            </p>
            <button type="button" className="boton boton--secundario boton--compacto" onClick={() => void guardar()} disabled={guardando}>
              <Icono nombre="guardar" tamano={18} />
              {guardando ? 'Guardando…' : 'Guardar en la historia'}
            </button>
          </div>
        ) : null}
      </div>
    </details>
  );
}

/** Un paso: el nombre y su origen a la izquierda; el valor, lo que va al lado y el cambio a la derecha; el «?» en la esquina. */
function PasoDeLaToma({
  paso,
  programa,
  sexo,
  conversion,
  corrida,
  cambio,
  onAbrir,
}: {
  paso: PasoDeLaCadena;
  programa: string;
  sexo: SexoDeLaCadena;
  conversion: ConversionDeDensidad;
  corrida: CorridaDeCalculoApi | null;
  cambio: string | null;
  onAbrir: (corridaId: string) => void;
}) {
  // Lo guardado manda: si el paso tiene su corrida, el valor es el de la corrida (con su precisión declarada).
  const mostrado: PasoDeLaCadena = corrida ? { ...paso, valor: corrida.result.magnitude.value, decimales: corrida.precision.decimals } : paso;
  const ejemplo = paso.cuenta ?? cuentaDeEjemplo(programa, sexo, paso.clave, conversion);
  return (
    <div className="paso-de-la-cadena con-ayuda-en-la-esquina" data-paso={paso.clave} data-calculado={paso.valor !== null ? 'si' : 'no'}>
      <div className="paso-de-la-cadena__que">
        <span className="paso-de-la-cadena__nombre">{paso.nombre}</span>
        <span className="paso-de-la-cadena__origen">{paso.origen}</span>
        {paso.valor === null && paso.faltan.length > 0 ? <span className="paso-de-la-cadena__falta">{textoDeLoQueFalta(paso)}</span> : null}
        {paso.valor === null && paso.motivo ? <span className="paso-de-la-cadena__falta">{paso.motivo}</span> : null}
      </div>
      <div className="paso-de-la-cadena__cuanto">
        {paso.valor !== null ? (
          <>
            <span className="paso-de-la-cadena__valor">
              <strong>{textoDelPasoDeLaCadena({ ...mostrado, base: null })}</strong>
              {paso.base ? <span className="paso-de-la-cadena__base"> {paso.base}</span> : null}
            </span>
            {paso.alLado.map((x) => (
              <span key={x.nombre} className="paso-de-la-cadena__al-lado">
                {x.nombre}: {textoDelValorAlLado(x)}
              </span>
            ))}
            {cambio !== null ? <span className="paso-de-la-cadena__cambio">{cambio} desde la anterior</span> : null}
            {corrida ? (
              <button type="button" className="boton boton--discreto boton--compacto paso-de-la-cadena__historia" onClick={() => onAbrir(corrida.calculationRunId)}>
                <Marca marca={marcaDeLaClase('DERIVED')} />
                En la historia
              </button>
            ) : null}
          </>
        ) : (
          <span className="paso-de-la-cadena__sin-valor">Sin calcular</span>
        )}
      </div>
      <ExplicacionAPedido nombre={`Cómo se calcula: ${paso.nombre}`} como="div" lugar="esquina">
        <p>
          <strong>Fórmula.</strong> {paso.formula}
        </p>
        {ejemplo ? (
          <p>
            <strong>{paso.cuenta ? 'Con esta toma.' : 'Un ejemplo resuelto.'}</strong> {ejemplo}
          </p>
        ) : null}
        <p className="nota">
          <strong>Fuente.</strong> {paso.fuente}
        </p>
        <p className="nota">Regla: {paso.regla}</p>
      </ExplicacionAPedido>
    </div>
  );
}
