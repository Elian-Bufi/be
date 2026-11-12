/**
 * Inicio · la medida de la última toma (DL-117; desde DL-170, AV2-07, una tarjeta chica al lado de «Actividad», como en la
 * maqueta): la medida destacada con un criterio fijo, la primera de la toma en el orden del catálogo de BE, que empieza
 * por el peso. El título es su nombre («Peso»; si la toma no trae peso, la medida que trae). Debajo, el cambio desde la
 * anterior comparable, dicho como un dato: «Sin cambio desde el 2 sept», «+0,4 kg desde el 2 sept», sin color ni flecha
 * que juzgue. La tarjeta se toca entera y abre la evolución de esa medida. La misma lectura y la misma clave que
 * «Mi evolución». Se van «16 medidas · 6 resultados de fórmulas», «Ver la toma» y el «Ver su evolución» que no decía de
 * qué; por qué se destaca esa medida pasa al «Cómo se lee» de Evolución (AV2-20).
 */
import { COPY_ANTROPOMETRIA, ultimaToma, type EvolucionResponse, type UltimaToma } from '@be/domain';
import { useCallback, type ReactNode } from 'react';
import { Text } from 'react-native';
import { api } from '../api';
import { SinActualizar } from '../estados';
import { fechaCivil } from '../formato';
import { medidaDeInicio } from '../inicio-de-hoy';
import { useLecturaRecordada } from '../lecturas';
import { medidaDestacada } from '../lecturas-de-inicio';
import { leerMiEvolucion } from '../lecturas-de-las-zonas';
import type { Ir } from '../navegacion';
import { TEXTOS_DE_LA_VUELTA as T } from '../textos-de-la-vuelta';
import { Cifra, Parrafo } from '../ui';
import { estilos, faltaElA3, NoSePudo, SinA3, TarjetaDeInicio, Verificando, type AlPerderLaSesion } from './tarjeta-de-inicio';

/** El resumen de la toma, una vez por respuesta: con la misma respuesta recordada no se recalcula. */
const resumenes = new WeakMap<EvolucionResponse['data'], UltimaToma | null>();
function resumenDe(datos: EvolucionResponse['data']): UltimaToma | null {
  let resumen = resumenes.get(datos);
  if (resumen === undefined) {
    resumen = ultimaToma(datos);
    resumenes.set(datos, resumen);
  }
  return resumen;
}

/** API-ANT-06-PROPIA con la misma lectura y la misma clave que «Mi evolución» (`leerMiEvolucion`). */
export function Mediciones({ token, sesionPerdida, ir, ancho, iconoArriba }: { token: string; sesionPerdida: AlPerderLaSesion; ir: Ir; ancho: number; iconoArriba: boolean }) {
  const pedir = useCallback(() => leerMiEvolucion(api, token), [token]);
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, 'mi-evolucion:ultimos-90', pedir, sesionPerdida);
  const toma = r?.ok ? resumenDe(r.datos) : null;
  const destacada = toma ? medidaDestacada(toma) : null;
  // Con una medida destacada, la tarjeta es suya y se toca entera: abre su evolución.
  if (destacada) {
    const m = medidaDeInicio(destacada);
    return (
      <TarjetaDeInicio zona="evolucion" titulo={m.titulo} ancho={ancho} iconoArriba={iconoArriba} paraLeer={m.paraLeer} alTocar={() => ir({ nombre: 'mi-evolucion', vista: 'evolucion', metrica: destacada.metrica })}>
        <Cifra valor={m.valor} unidad={m.unidad} tamano={26} />
        <Text style={estilos.detalle}>{m.cambio}</Text>
        <SinActualizar visible={sinActualizar} onReintentar={() => void cargar()} />
      </TarjetaDeInicio>
    );
  }
  // Una toma sin medidas propias ni resultados: se dice su fecha, y abre la toma.
  if (toma) {
    const texto = `${COPY_ANTROPOMETRIA.tuUltimaToma}: ${fechaCivil(toma.fecha)}`;
    return (
      <TarjetaDeInicio zona="evolucion" titulo={T.mediciones} ancho={ancho} iconoArriba={iconoArriba} paraLeer={texto} alTocar={() => ir({ nombre: 'mi-evolucion', vista: 'ultima' })}>
        <Text style={estilos.detalle}>{texto}</Text>
      </TarjetaDeInicio>
    );
  }
  let contenido: ReactNode;
  if (!r) contenido = <Verificando />;
  else if (faltaElA3(r)) contenido = <SinA3 texto={COPY_ANTROPOMETRIA.evolucionNecesitaA3} ir={ir} />;
  else if (!r.ok) contenido = <NoSePudo falla={r} reintentar={() => void cargar()} />;
  else contenido = <Parrafo tenue>{COPY_ANTROPOMETRIA.sinMediciones}</Parrafo>;
  return (
    <TarjetaDeInicio zona="evolucion" titulo={T.mediciones} ancho={ancho} iconoArriba={iconoArriba}>
      {contenido}
      <SinActualizar visible={sinActualizar} onReintentar={() => void cargar()} />
    </TarjetaDeInicio>
  );
}
