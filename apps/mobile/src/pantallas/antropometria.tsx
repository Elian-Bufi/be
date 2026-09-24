/**
 * APK · «Mi evolución» (RF-049, RF-065; API-ANT-06 del lado del asesorado; B10-07).
 *
 * La persona ve su propia evolución antropométrica, con las mismas honestidades que el website:
 * - un tramo sin medición vigente llega como **hueco**, con su rango y su cantidad de días, y no se completa con cero
 *   ni arrastra el valor anterior (REG-06-165/166; INV-06-176/177);
 * - cada punto conserva su clase —medido, reportado o calculado— y dice si su valor vigente viene de una corrección
 *   (04:1090; INV-06-178; REG-06-16);
 * - un tramo no comparable se señala con su motivo, en vez de convertirse en silencio (REG-06-162/163/164).
 *
 * Por eso acá tampoco hay gráfico de línea: una línea tendría que inventar el tramo que falta. La lista es la forma
 * honesta de mostrar una serie con huecos, y en una pantalla de teléfono además es la legible.
 *
 * La pantalla es de solo lectura: el asesorado no corrige ni anula mediciones (eso es del profesional, REG-06-219).
 * Por eso, de los cuatro patrones de DL-091, acá aplica el de los números: no hay escritura que pueda ser denegada ni
 * formulario que pueda tener un error por campo. Cada valor se escribe con `cantidad`/`numero` de `@be/domain`, con la
 * coma decimal del país; lo que llega del contrato no se toca.
 */
import { cantidad, COPY_ANTROPOMETRIA, ETIQUETA_DE_CLASE_DE_DATO, numero, type EvolucionResponse, type SerieApi } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { api } from '../api';
import { Cargando, ErrorConReintento } from '../estados';
import { dia, fecha } from '../formato';
import { useSesionPerdida, type Salida } from '../navegacion';
import { Aviso, Insignia, Parrafo, Seccion, Subtitulo, Tarjeta, Titulo } from '../ui';

type Datos = EvolucionResponse['data'];
type Carga = { tipo: 'cargando' } | { tipo: 'listo'; datos: Datos } | { tipo: 'error'; sinConexion: boolean };

export function PantallaDeMiEvolucion({ token, salir }: { token: string; salir: (m: Salida) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });

  const cargar = useCallback(async () => {
    setCarga({ tipo: 'cargando' });
    const r = await api.miEvolucionAntropometrica(token);
    if (sesionPerdida(r)) return;
    setCarga(r.ok ? { tipo: 'listo', datos: r.datos.data } : { tipo: 'error', sinConexion: r.tipo === 'RED' });
  }, [token, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <View>
      <Titulo>{COPY_ANTROPOMETRIA.miEvolucion}</Titulo>
      {carga.tipo === 'cargando' ? <Cargando /> : null}
      {carga.tipo === 'error' ? <ErrorConReintento sinConexion={carga.sinConexion} onReintentar={cargar} /> : null}
      {carga.tipo === 'listo' ? <Evolucion datos={carga.datos} /> : null}
    </View>
  );
}

function Evolucion({ datos }: { datos: Datos }) {
  const conDatos = datos.metrics.filter((s) => s.series.length > 0);
  return (
    <>
      <Parrafo tenue>
        {COPY_ANTROPOMETRIA.periodo}: {dia(`${datos.period.start}T12:00:00Z`)} — {dia(`${datos.period.end}T12:00:00Z`)}
      </Parrafo>
      <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeSinDato}</Parrafo>
      {conDatos.length === 0 ? (
        <Aviso tipo="info" titulo={COPY_ANTROPOMETRIA.sinMediciones}>
          <Parrafo tenue>Las mediciones las registra el profesional con el que tenés un vínculo activo en Antropometría.</Parrafo>
        </Aviso>
      ) : null}
      {datos.metrics.map((serie) => (
        <SerieDeLaMetrica key={serie.metricCode} serie={serie} />
      ))}
    </>
  );
}

function SerieDeLaMetrica({ serie }: { serie: SerieApi }) {
  const diasSinDato = serie.gaps.reduce((n, g) => n + g.days, 0);
  /** Puntos y huecos, ordenados por fecha. Los huecos ya vienen agrupados en rangos desde la API. */
  const tramos = [
    ...serie.series.map((punto) => ({ orden: punto.occurredAt.slice(0, 10), tipo: 'punto' as const, punto })),
    ...serie.gaps.map((hueco) => ({ orden: hueco.from, tipo: 'hueco' as const, hueco })),
  ].sort((a, b) => a.orden.localeCompare(b.orden));

  return (
    <Seccion titulo={serie.metricCode}>
      <Parrafo tenue>
        {numero(serie.series.length)} con dato · {numero(diasSinDato)} {COPY_ANTROPOMETRIA.sinDato.toLowerCase()}
      </Parrafo>
      {tramos.map((t) => (t.tipo === 'punto' ? <PuntoDeLaSerie key={t.punto.sourceId} punto={t.punto} /> : <HuecoDeLaSerie key={`hueco-${t.hueco.from}`} hueco={t.hueco} />))}
      <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeComparabilidad}</Parrafo>
    </Seccion>
  );
}

/** Un día con medición vigente. */
function PuntoDeLaSerie({ punto }: { punto: SerieApi['series'][number] }) {
  return (
    <Tarjeta>
      <Subtitulo>{fecha(punto.occurredAt)}</Subtitulo>
      <Parrafo>{cantidad(punto.value, punto.unit)}</Parrafo>
      <Insignia texto={ETIQUETA_DE_CLASE_DE_DATO[punto.dataClass]} etiqueta={`${COPY_ANTROPOMETRIA.origenDelDato}: ${ETIQUETA_DE_CLASE_DE_DATO[punto.dataClass]}`} />
      {punto.correctionState === 'CORRECTED' ? <Insignia texto={COPY_ANTROPOMETRIA.corregida} etiqueta={COPY_ANTROPOMETRIA.corregida} /> : null}
      {punto.incomparableWithPrevious.length > 0 ? (
        <Aviso tipo="info" titulo={COPY_ANTROPOMETRIA.noComparable}>
          <Parrafo tenue>{punto.incomparableWithPrevious.map((m) => COPY_ANTROPOMETRIA.motivoNoComparable[m]).join(' · ')}</Parrafo>
        </Aviso>
      ) : null}
    </Tarjeta>
  );
}

/**
 * Los días sin medición vigente, dichos como lo que son: un rango, sin valor, sin cero y sin nada que los una.
 * Agruparlos no es ocultarlos —se dicen todos, con sus fechas y su cantidad—: es evitar que noventa filas iguales
 * tapen los días que sí tienen medición.
 */
function HuecoDeLaSerie({ hueco }: { hueco: SerieApi['gaps'][number] }) {
  const desde = dia(`${hueco.from}T12:00:00Z`);
  const hasta = dia(`${hueco.to}T12:00:00Z`);
  const texto = hueco.days === 1 ? desde : `${desde} — ${hasta}`;
  const detalle = hueco.days === 1 ? COPY_ANTROPOMETRIA.sinDato : `${numero(hueco.days)} días ${COPY_ANTROPOMETRIA.sinDato.toLowerCase()}`;
  return (
    <Tarjeta>
      <Subtitulo>{texto}</Subtitulo>
      <Insignia texto={detalle} etiqueta={`${texto}: ${detalle}`} />
    </Tarjeta>
  );
}
