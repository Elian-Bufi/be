'use client';

/**
 * «Tu semana» en el Espacio profesional (WP-TABLERO-ALTA-GAMA TB-07; DL-163 D-3), entre el encabezado y la mesa: las
 * revisiones que acordaste de hoy a siete días, una columna por día, y las vencidas aparte. El modelo está en
 * `tu-semana.ts`.
 * - Cada ficha lleva el monograma, el nombre y el área, y abre lo que resuelve la revisión, como «Abrir» en
 *   «Pendientes». Con «Ocultar nombres», la referencia y el ícono. Al abrirla se guarda el lugar del Espacio, y el destino
 *   ofrece volver donde se estaba (TB-07, `lugar-del-espacio.ts`).
 * - Nada se pasa de su columna (TA-71): el nombre, o la referencia, va en hasta dos renglones y el área, debajo, a todo
 *   el ancho. En una columna angosta (a 1280, con las vencidas son nueve) el monograma va arriba y el área, en palabras,
 *   sin su ícono. Lo mide la corrida de las capturas, que falla si algo se pasa.
 * - Hasta tres por día; «y N más» muestra el resto de ese día. «Ver como lista» las pone en un renglón cada una.
 * - El teclado recorre las columnas en orden: cada una es una lista con su día como título.
 * - Sin revisiones en la semana, el vacío lo dice, con de dónde salen las fechas. Mientras la cartera carga o si falló,
 *   no se muestra: «Pendientes», debajo, ya lo dice.
 */
import { COPY_CARTERA, numero } from '@be/domain';
import { Enlace } from '../../components/enlace';
import { useId, useMemo, useState } from 'react';
import { Icono } from '../../components/icono';
import { Retrato } from '../../components/retrato';
import { diaDelAnioEnCurso } from '../../lib/formato';
import { useNombres } from '../../lib/nombres-ocultos';
import { conOrigenEnElEspacio } from './lugar-del-espacio';
import { claveDelPendiente } from './mesa';
import { ICONO_DEL_AREA_DE_CARTERA, rutaQueResuelve } from './pendiente-en-una-fila';
import type { EstadoDeLaCartera } from './te-toca-a-vos';
import { claveDeLaFicha, FICHAS_POR_DIA, semanaDeRevisiones, type ColumnaDeLaSemana, type FichaDeLaSemana } from './tu-semana';

const SEMANA_CORTA = new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: 'UTC' });

/** «Hoy», «Mañana» o «sáb 8»: el título de cada columna, en el día civil de la cartera. */
function tituloDelDia(fecha: string, indice: number): string {
  if (indice === 0) return 'Hoy';
  if (indice === 1) return 'Mañana';
  return `${SEMANA_CORTA.format(new Date(`${fecha}T12:00:00Z`)).replace(/\.$/, '')} ${Number(fecha.slice(8, 10))}`;
}

export function TuSemana({ cartera, alAbrir }: { cartera: EstadoDeLaCartera; /** TB-07: al abrir una ficha se guarda el lugar del Espacio. */ alAbrir?: (f: FichaDeLaSemana) => void }) {
  const id = useId();
  const { delAsesorado } = useNombres();
  const [comoLista, setComoLista] = useState(false);
  const [abiertas, setAbiertas] = useState<ReadonlySet<string>>(new Set());
  const listo = cartera.tipo === 'listo' ? cartera : null;
  const hoy = listo?.primera.meta.today ?? '';
  const semana = useMemo(() => (listo ? semanaDeRevisiones(listo.items, hoy, Infinity) : null), [listo, hoy]);
  if (!listo || !semana) return null;

  const hasta = semana.dias[semana.dias.length - 1]?.clave ?? hoy;
  const ficha = (f: FichaDeLaSemana, conDia: boolean) => {
    const quien = delAsesorado(f.advisee);
    const area = COPY_CARTERA.dominio[f.domain];
    return (
      <li key={claveDeLaFicha(f)}>
        <Enlace className="ficha-de-la-semana" href={conOrigenEnElEspacio(rutaQueResuelve(f))} data-ficha={claveDelPendiente(f)} onClick={() => alAbrir?.(f)}>
          <Retrato nombre={quien} />
          {/* TA-71: si no entra, el nombre pasa a dos renglones y después se corta con «…»; entero queda en el texto del
              enlace, que es lo que lee el lector de pantalla, y en el título. */}
          <span className="ficha-de-la-semana__nombre" title={quien}>
            {quien}
          </span>
          <span className="ficha-de-la-semana__area">
            <Icono nombre={ICONO_DEL_AREA_DE_CARTERA[f.domain]} tamano={15} />
            <span className="ficha-de-la-semana__cual">
              {area}
              {conDia && f.since ? ` · ${f.kind === 'REVIEW_OVERDUE' ? 'vencida el ' : ''}${diaDelAnioEnCurso(f.since, hoy)}` : ''}
            </span>
          </span>
          <span className="visualmente-oculto">. Revisión de {area}: abrir</span>
        </Enlace>
      </li>
    );
  };
  const columna = (c: ColumnaDeLaSemana, titulo: string, indice: number) => {
    const abierta = abiertas.has(c.clave);
    const visibles = abierta ? c.fichas : c.fichas.slice(0, FICHAS_POR_DIA);
    const resto = c.fichas.length - visibles.length;
    return (
      <section key={c.clave} className={`tu-semana__dia${c.clave === 'vencidas' ? ' tu-semana__dia--vencidas' : ''}${indice === 0 ? ' tu-semana__dia--hoy' : ''}`} aria-labelledby={`${id}-${c.clave}`}>
        <h3 id={`${id}-${c.clave}`}>
          {titulo}
          {c.fichas.length > 0 ? <span className="tu-semana__cuenta">{numero(c.fichas.length)}</span> : null}
        </h3>
        {c.fichas.length === 0 ? (
          <p className="tu-semana__nada">
            <span aria-hidden="true">—</span>
            <span className="visualmente-oculto">Sin revisiones</span>
          </p>
        ) : (
          <ul className="tu-semana__fichas">{visibles.map((f) => ficha(f, false))}</ul>
        )}
        {resto > 0 ? (
          <button type="button" className="boton boton--enlace tu-semana__mas" onClick={() => setAbiertas((a) => new Set(a).add(c.clave))}>
            y {numero(resto)} más
          </button>
        ) : null}
      </section>
    );
  };

  return (
    <section className="tarjeta-del-espacio tu-semana" aria-labelledby={`${id}-titulo`}>
      <div className="tarjeta-del-espacio__cabecera">
        <Icono nombre="calendario" tamano={24} />
        <h2 id={`${id}-titulo`}>Tu semana</h2>
        <p className="tu-semana__rango nota">
          Las revisiones que acordaste, de hoy al {diaDelAnioEnCurso(hasta, hoy)}
          {listo.completa ? '' : '. Se leyeron los primeros pendientes: puede haber más'}
        </p>
        {semana.total > 0 ? (
          <button type="button" className="boton boton--quieto boton--compacto tu-semana__vista" aria-pressed={comoLista} onClick={() => setComoLista(!comoLista)}>
            <Icono nombre={comoLista ? 'calendario' : 'lista'} tamano={18} />
            {comoLista ? 'Ver por día' : 'Ver como lista'}
          </button>
        ) : null}
      </div>
      {semana.total === 0 ? (
        <p className="tu-semana__vacio">
          <Icono nombre="calendario" tamano={20} />
          <span>
            Ninguna revisión acordada de hoy al {diaDelAnioEnCurso(hasta, hoy)}, ni vencida.{' '}
            <span className="tenue">Cada fecha la fijás al registrar una revisión o al activar un plan.</span>
          </span>
        </p>
      ) : comoLista ? (
        <ul className="tu-semana__lista">
          {[semana.vencidas, ...semana.dias].flatMap((c) => c.fichas).map((f) => ficha(f, true))}
        </ul>
      ) : (
        <div className="tu-semana__dias">
          {semana.vencidas.fichas.length > 0 ? columna(semana.vencidas, 'Vencidas', -1) : null}
          {semana.dias.map((c, i) => columna(c, tituloDelDia(c.clave, i), i))}
        </div>
      )}
    </section>
  );
}
