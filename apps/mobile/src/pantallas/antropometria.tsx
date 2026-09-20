/**
 * APK · «Mi evolución» (RF-049, RF-065; API-ANT-06 del lado del asesorado; B10-07).
 *
 * La persona ve su propia evolución antropométrica, con las mismas tres honestidades que el website:
 * - un día sin medición vigente dice **«Sin dato»** y no se completa con cero ni se arrastra el valor anterior
 *   (REG-06-166; INV-06-176/177);
 * - cada punto conserva su clase —medido, reportado o calculado— y se muestra (04:1090; INV-06-178);
 * - un tramo no comparable se señala con su motivo, en vez de convertirse en silencio (REG-06-162/163/164).
 *
 * Por eso acá tampoco hay gráfico de línea: una línea tendría que inventar el tramo que falta. La lista es la forma
 * honesta de mostrar una serie con huecos, y en una pantalla de teléfono además es la legible.
 *
 * La pantalla es de solo lectura: el asesorado no corrige ni anula mediciones (eso es del profesional, REG-06-219).
 */
import { COPY_ANTROPOMETRIA, ETIQUETA_DE_CLASE_DE_DATO, type EvolucionResponse, type PuntoDeSerieApi, type SerieApi } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { api } from '../api';
import { Cargando, ErrorConReintento } from '../estados';
import { dia } from '../formato';
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
  const conDatos = datos.series.filter((s) => s.points.some((p) => p.availability === 'AVAILABLE'));
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
      {datos.series.map((serie) => (
        <SerieDeLaMetrica key={serie.metric} serie={serie} />
      ))}
    </>
  );
}

function SerieDeLaMetrica({ serie }: { serie: SerieApi }) {
  const sinDato = serie.missingData.length;
  /** Se muestran los puntos con dato y los huecos que la API nombró: ni se inventan fechas ni se ocultan las suyas. */
  const visibles = serie.points.filter((p) => p.availability === 'AVAILABLE' || serie.missingData.includes(p.date));
  return (
    <Seccion titulo={serie.metric}>
      <Parrafo tenue>
        {visibles.length - sinDato} con dato · {sinDato} {COPY_ANTROPOMETRIA.sinDato.toLowerCase()}
      </Parrafo>
      {visibles.map((p) => (
        <PuntoDeLaSerie key={p.date} punto={p} />
      ))}
      <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeComparabilidad}</Parrafo>
    </Seccion>
  );
}

function PuntoDeLaSerie({ punto }: { punto: PuntoDeSerieApi }) {
  const fechaVisible = dia(`${punto.date}T12:00:00Z`);
  if (punto.availability === 'NO_DATA') {
    return (
      <Tarjeta>
        <Subtitulo>{fechaVisible}</Subtitulo>
        <Insignia texto={COPY_ANTROPOMETRIA.sinDato} etiqueta={`${fechaVisible}: ${COPY_ANTROPOMETRIA.sinDato}`} />
      </Tarjeta>
    );
  }
  return (
    <Tarjeta>
      <Subtitulo>{fechaVisible}</Subtitulo>
      <Parrafo>
        {punto.magnitude.value} {punto.magnitude.unit}
      </Parrafo>
      <Insignia texto={ETIQUETA_DE_CLASE_DE_DATO[punto.dataClass]} etiqueta={`${COPY_ANTROPOMETRIA.origenDelDato}: ${ETIQUETA_DE_CLASE_DE_DATO[punto.dataClass]}`} />
      {punto.incomparableWithPrevious.length > 0 ? (
        <Aviso tipo="info" titulo={COPY_ANTROPOMETRIA.noComparable}>
          <Parrafo tenue>{punto.incomparableWithPrevious.map((m) => COPY_ANTROPOMETRIA.motivoNoComparable[m]).join(' · ')}</Parrafo>
        </Aviso>
      ) : null}
    </Tarjeta>
  );
}
