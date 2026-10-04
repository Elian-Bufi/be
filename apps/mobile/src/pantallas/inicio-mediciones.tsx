/**
 * Inicio · la tarjeta de Mediciones (DL-117): la última toma y una medida destacada con un criterio fijo, con el cambio
 * desde la anterior comparable. La misma lectura y la misma clave que «Mi evolución».
 */
import { COPY_ANTROPOMETRIA, numero, textoDeDiferenciaAntropometrica, ultimaToma, type EvolucionResponse, type MedidaDeLaToma, type UltimaToma } from '@be/domain';
import { useCallback, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { SinActualizar } from '../estados';
import { fechaCivil } from '../formato';
import { useLecturaRecordada } from '../lecturas';
import { medidaDestacada } from '../lecturas-de-inicio';
import { leerMiEvolucion } from '../lecturas-de-las-zonas';
import type { Ir } from '../navegacion';
import { Ayuda, Boton, Cifra, Parrafo } from '../ui';
import { Accion, Acciones, estilos, faltaElA3, NoSePudo, SinA3, TarjetaDeInicio, Verificando, type AlPerderLaSesion } from './tarjeta-de-inicio';

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
export function Mediciones({ token, sesionPerdida, ir }: { token: string; sesionPerdida: AlPerderLaSesion; ir: Ir }) {
  const pedir = useCallback(() => leerMiEvolucion(api, token), [token]);
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, 'mi-evolucion:ultimos-90', pedir, sesionPerdida);
  let contenido: ReactNode;
  if (!r) contenido = <Verificando />;
  else if (faltaElA3(r)) contenido = <SinA3 texto={COPY_ANTROPOMETRIA.evolucionNecesitaA3} ir={ir} />;
  else if (!r.ok) contenido = <NoSePudo falla={r} reintentar={() => void cargar()} />;
  else {
    const toma = resumenDe(r.datos);
    const destacada = toma ? medidaDestacada(toma) : null;
    contenido = !toma ? (
      <Parrafo>{COPY_ANTROPOMETRIA.sinMediciones}</Parrafo>
    ) : (
      <>
        <Text style={estilos.nombre}>{`${COPY_ANTROPOMETRIA.tuUltimaToma}: ${fechaCivil(toma.fecha)}`}</Text>
        <Text style={estilos.detalle}>
          {[
            `${numero(toma.medidas.length)} ${toma.medidas.length === 1 ? 'medida' : 'medidas'}`,
            toma.derivadas.length > 0 ? `${numero(toma.derivadas.length)} ${toma.derivadas.length === 1 ? 'resultado de fórmula' : 'resultados de fórmulas'}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {destacada ? <Destacada medida={destacada} /> : null}
        <Acciones>
          <Accion>
            <Boton texto="Ver la toma" tipo="secundario" onPress={() => ir({ nombre: 'mi-evolucion', vista: 'ultima' })} />
          </Accion>
          {destacada ? (
            <Accion>
              <Boton texto="Ver su evolución" tipo="secundario" onPress={() => ir({ nombre: 'mi-evolucion', vista: 'evolucion', metrica: destacada.metrica })} />
            </Accion>
          ) : null}
        </Acciones>
        {/* Por qué esa medida: fuera del contenido principal, al ampliar (pulido del 2026-10-04). */}
        {destacada ? (
          <Ayuda>
            <Parrafo tenue>Se destaca la primera medida de tu última toma en el orden del catálogo de BE, que empieza por el peso.</Parrafo>
          </Ayuda>
        ) : null}
      </>
    );
  }
  return (
    <TarjetaDeInicio zona="evolucion" titulo="Mediciones">
      {contenido}
      <SinActualizar visible={sinActualizar} onReintentar={() => void cargar()} />
    </TarjetaDeInicio>
  );
}

/** La medida destacada: el valor, y el cambio desde la anterior comparable, o por qué no hay con qué comparar. */
function Destacada({ medida: m }: { medida: MedidaDeLaToma }) {
  const cambio = m.diferencia && m.anterior
    ? `${textoDeDiferenciaAntropometrica(m.diferencia)} desde el ${fechaCivil(m.anterior.fecha)}`
    : m.motivoSinAnterior === 'OTRO_GRUPO'
      ? 'Sin anterior comparable: la toma anterior usó otro protocolo, método o unidad.'
      : COPY_ANTROPOMETRIA.sinAnteriorComparable;
  return (
    <View style={estilos.destacada} accessible accessibilityLabel={`${m.nombre}: ${numero(m.actual.punto.value)} ${m.actual.punto.unit}. ${cambio}`}>
      <Text style={estilos.detalle}>{m.nombre}</Text>
      <Cifra valor={numero(m.actual.punto.value)} unidad={m.actual.punto.unit} tamano={26} />
      <Text style={estilos.detalle}>{cambio}</Text>
    </View>
  );
}
