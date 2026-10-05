/**
 * APK · «Mi evolución» → Progreso (DL-118, Dirección 2026-10-05): «¿qué cambió en esta parte del cuerpo?».
 *
 * - **Dos elecciones claras.** La familia (Perímetros o Pliegues) y la zona (Torso o Piernas), como las láminas de tren
 *   superior e inferior del compositor. Solo aparecen las que tienen datos en el período. Si el torso tiene más de cinco
 *   sitios con datos, se reparte en dos paneles fijos (`progreso-por-zonas.ts`): la misma toma, la misma fecha, la misma
 *   familia y la misma medida elegida.
 * - **La figura de la zona** es la del compositor para ese tren, con un número por sitio (`FiguraDeZona`). Ningún punto
 *   se mueve. Es una franja del cuerpo con los sitios de la zona, y las tarjetas la siguen sin un título en el medio:
 *   se ven juntas (ajuste de Dirección del 2026-10-05).
 * - **Una tarjeta por sitio**, en una columna ancha y con el número de su sitio: el valor de la toma elegida con su unidad,
 *   el cambio respecto de la anterior comparable con su fecha, y los puntos de la medida sobre las fechas reales del
 *   período, del grupo comparable de esa toma. La tarjeta de un sitio sin dato en esta toma lo dice, y sus puntos siguen.
 *   Tocarla abre su detalle con el gráfico grande (`ProgresoDeUnaMedida`).
 * Todo sale de la misma lectura de la pantalla: cambiar de familia, zona o panel no hace pedidos.
 */
import { cantidad, COPY_ANTROPOMETRIA, numero, type ClaveDeLaLamina, type EvolucionResponse, type MedidaDeLaToma, type UltimaToma } from '@be/domain';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApariencia } from '../apariencia';
import { numerosDeLaZona, rotuloDelSitio } from '../composicion-de-la-figura';
import { familiaDelSitio } from '../disposicion-de-la-toma';
import { useSeleccionRecordada } from '../lecturas';
import { ENCUADRE_DE_LA_ZONA, NOMBRE_DE_LA_ZONA, panelesDeProgreso, panelQueSeVe, type FamiliaDeProgreso, type ZonaDelCuerpo } from '../progreso-por-zonas';
import { indiceDeLaToma, serieDe, serieDeLaMedida } from '../serie-de-la-medida';
import { PALETAS } from '../tema';
import { COLOR, estilosPorTema, Segmentos } from '../ui';
import { BrilloDeVidrio, sombraDeVidrio } from '../vidrio';
import { ElegirLaFigura, FiguraDeZona, useSexoDeLaFigura } from './figura-de-la-toma';
import { fraseDeLaSerie, GraficoCompacto, ProgresoDeUnaMedida, textoDeLaClase, textoDelCambio, ValorYCambio } from './progreso-de-una-medida';

type Datos = EvolucionResponse['data'];

const FAMILIAS: readonly FamiliaDeProgreso[] = ['PERIMETROS', 'PLIEGUES'];
const ZONAS: readonly ZonaDelCuerpo[] = ['TORSO', 'PIERNAS'];

export function Progreso({
  datos,
  token,
  toma,
  medida,
  alElegir,
}: {
  datos: Datos;
  token: string;
  /** La toma que muestra la vista: tiene perímetros o pliegues. */
  toma: UltimaToma;
  /** La medida elegida, la misma del mapa y de los indicadores. */
  medida: string | null;
  alElegir: (metrica: string | null) => void;
}) {
  const { tema } = useApariencia();
  const [sexo, setSexo] = useSexoDeLaFigura();
  const [familiaPedida, setFamilia] = useSeleccionRecordada<FamiliaDeProgreso | null>(token, 'mi-evolucion:familia', null);
  const [panelPedido, setPanel] = useSeleccionRecordada<string | null>(token, 'mi-evolucion:panel', null);
  // Los paneles salen de los sitios con alguna medición en el período, no de la toma: no cambian al pasar de una toma a otra.
  const panelesPorFamilia = useMemo(() => {
    const conDatos = (clave: string) => (serieDe(datos, clave)?.observaciones.length ?? 0) > 0;
    return { PERIMETROS: panelesDeProgreso('PERIMETROS', conDatos), PLIEGUES: panelesDeProgreso('PLIEGUES', conDatos) };
  }, [datos]);
  const familias = FAMILIAS.filter((f) => panelesPorFamilia[f].length > 0);
  const deLaMedida = medida ? familiaDelSitio(medida) : null;
  const familia = familias.find((f) => f === familiaPedida) ?? familias.find((f) => f === deLaMedida) ?? familias[0];
  if (!familia) return null;
  const paneles = panelesPorFamilia[familia];
  const panel = panelQueSeVe(paneles, panelPedido, medida)!;
  const zonas = ZONAS.filter((z) => paneles.some((p) => p.zona === z));
  const panelesDeLaZona = paneles.filter((p) => p.zona === panel.zona);
  const encuadre = ENCUADRE_DE_LA_ZONA[panel.zona];
  const numeros = numerosDeLaZona(sexo, familia, encuadre, panel.sitios);
  const sitios = [...panel.sitios].sort((a, b) => (numeros.get(a) ?? 0) - (numeros.get(b) ?? 0));
  const deLaToma = new Map(toma.medidas.map((m) => [m.metrica, m]));
  const paleta = PALETAS[tema];
  const insignia = { fondo: paleta.laminaTarjeta, borde: paleta.laminaBorde, numero: paleta.laminaValor };

  return (
    <View>
      {/* Las dos elecciones de Progreso, compactas: no son pestañas del módulo. */}
      <View style={estilos.controles}>
        {familias.length > 1 ? (
          <Segmentos
            compactos
            etiqueta={COPY_ANTROPOMETRIA.medidasDeLaFigura}
            opciones={[
              { valor: 'PERIMETROS', texto: COPY_ANTROPOMETRIA.perimetrosEnLaFigura },
              { valor: 'PLIEGUES', texto: COPY_ANTROPOMETRIA.plieguesEnLaFigura },
            ]}
            valor={familia}
            alElegir={(f) => setFamilia(f)}
          />
        ) : null}
        {zonas.length > 1 ? (
          <Segmentos
            compactos
            etiqueta="Zona del cuerpo"
            opciones={zonas.map((z) => ({ valor: z, texto: NOMBRE_DE_LA_ZONA[z] }))}
            valor={panel.zona}
            alElegir={(z) => setPanel(paneles.find((p) => p.zona === z)?.clave ?? null)}
          />
        ) : null}
      </View>
      <View style={[estilos.lamina, { backgroundColor: paleta.laminaFondo }]}>
        {panelesDeLaZona.length > 1 ? (
          <View style={estilos.panelesDelTorso}>
            <Segmentos compactos etiqueta="Parte del torso" opciones={panelesDeLaZona.map((p) => ({ valor: p.clave, texto: p.nombre }))} valor={panel.clave} alElegir={(p) => setPanel(p)} />
          </View>
        ) : null}
        <FiguraDeZona familia={familia} encuadre={encuadre} claves={panel.sitios} clavesDeLaZona={panel.sitiosDeLaZona} maximoDeNumeros={Math.max(...panelesDeLaZona.map((p) => p.sitios.length))} sexo={sexo} elegida={medida} alElegir={alElegir} />
      </View>
      {/* Las tarjetas siguen a la figura, sin un título en el medio: la familia, la zona y la parte del torso se leen en
          los controles elegidos (ajuste de Dirección del 2026-10-05). */}
      {sitios.map((clave) => (
        <TarjetaDeProgreso
          key={clave}
          numero={numeros.get(clave) ?? 0}
          clave={clave}
          medida={deLaToma.get(clave) ?? null}
          datos={datos}
          evaluacionId={toma.evaluacionId}
          elegida={medida === clave}
          alTocar={() => alElegir(medida === clave ? null : clave)}
          insignia={insignia}
        />
      ))}
      <ElegirLaFigura sexo={sexo} alElegir={setSexo} />
    </View>
  );
}

/**
 * La tarjeta de un sitio, con la forma del ejemplo de Dirección (2026-10-05): su número y su nombre; el valor de la toma
 * elegida, grande, con el cambio respecto de la anterior comparable y su fecha a la derecha; sus puntos sobre las fechas
 * reales con la toma de cada uno, y los valores en fila. Toda la tarjeta es el objetivo del toque, de 48 dp o más.
 */
function TarjetaDeProgreso({
  numero: n,
  clave,
  medida,
  datos,
  evaluacionId,
  elegida,
  alTocar,
  insignia,
}: {
  numero: number;
  clave: ClaveDeLaLamina;
  medida: MedidaDeLaToma | null;
  datos: Datos;
  evaluacionId: string;
  elegida: boolean;
  alTocar: () => void;
  insignia: { fondo: string; borde: string; numero: string };
}) {
  const rotulo = rotuloDelSitio(clave);
  const grupoDeLaToma = medida?.actual.punto.comparabilityGroup ?? null;
  const serie = useMemo(() => serieDeLaMedida(datos, clave, grupoDeLaToma), [datos, clave, grupoDeLaToma]);
  const indice = indiceDeLaToma(serie.observaciones, evaluacionId);
  const valor = medida ? cantidad(medida.actual.punto.value, medida.actual.punto.unit) : null;
  const cambio = medida ? textoDelCambio(medida) : 'Sin dato en esta toma';
  const clase = medida ? textoDeLaClase(medida) : null;
  const otros = serie.enOtrosGrupos > 0 ? (serie.enOtrosGrupos === 1 ? '1 medición con otro protocolo o método: no va en este gráfico.' : `${numero(serie.enOtrosGrupos)} mediciones con otro protocolo o método: no van en este gráfico.`) : null;
  const frase = [`${n}. ${rotulo}`, valor ?? 'sin dato en esta toma', medida ? cambio : null, clase, fraseDeLaSerie(serie.observaciones, indice), otros].filter(Boolean).join('. ');
  return (
    <View style={[estilos.tarjeta, elegida && estilos.tarjetaElegida]}>
      <BrilloDeVidrio color={COLOR.vidrioBrillo} radio={16} />
      <Pressable onPress={alTocar} accessibilityRole="button" accessibilityState={{ selected: elegida, expanded: elegida }} accessibilityLabel={frase} style={({ pressed }) => [estilos.toque, pressed && estilos.presionado]}>
        <View style={estilos.cabeza}>
          <View style={[estilos.insignia, { backgroundColor: insignia.fondo, borderColor: insignia.borde }]}>
            <Text style={[estilos.numeroDeLaInsignia, { color: insignia.numero }]} maxFontSizeMultiplier={1.6}>
              {String(n)}
            </Text>
          </View>
          <Text style={[estilos.nombre, elegida && estilos.nombreElegido]}>{rotulo}</Text>
        </View>
        {medida ? <ValorYCambio medida={medida} tamano={28} /> : <Text style={estilos.sinDato}>{cambio}</Text>}
        {clase ? <Text style={estilos.nota}>{clase}</Text> : null}
        {/* Abierta, el gráfico grande del detalle reemplaza al compacto. */}
        {elegida ? null : <GraficoCompacto observaciones={serie.observaciones} tomas={serie.tomas} periodo={datos.period} zonaHoraria={datos.period.timeZone} elegida={indice} />}
        {serie.observaciones.length === 1 ? <Text style={estilos.nota}>Una sola medición comparable en el período.</Text> : null}
        {otros ? <Text style={estilos.nota}>{otros}</Text> : null}
      </Pressable>
      {elegida ? <ProgresoDeUnaMedida datos={datos} metrica={clave} grupoInicial={grupoDeLaToma} evaluacionId={evaluacionId} nombre={rotulo} /> : null}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  controles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  lamina: { borderRadius: 18, overflow: 'hidden', marginTop: 8, marginBottom: 8 },
  panelesDelTorso: { paddingHorizontal: 8, paddingTop: 8 },
  tarjeta: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLOR.vidrioFilo,
    backgroundColor: COLOR.superficie,
    padding: 12,
    marginBottom: 8,
    ...sombraDeVidrio(COLOR.sombra),
  },
  tarjetaElegida: { borderColor: COLOR.acento, borderWidth: 2, padding: 11 },
  toque: { minHeight: 48 },
  presionado: { opacity: 0.8 },
  cabeza: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, rowGap: 2 },
  insignia: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  numeroDeLaInsignia: { fontSize: 13, fontWeight: '800' },
  nombre: { flexGrow: 1, flexShrink: 1, fontSize: 15, lineHeight: 21, fontWeight: '600', color: COLOR.texto },
  nombreElegido: { fontWeight: '800' },
  sinDato: { fontSize: 14, lineHeight: 20, color: COLOR.tenue, marginTop: 4 },
  nota: { fontSize: 13, lineHeight: 18, color: COLOR.tenue, marginTop: 2 },
}));
