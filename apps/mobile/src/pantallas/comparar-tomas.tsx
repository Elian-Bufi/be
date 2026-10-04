/**
 * APK · «Mi evolución» → Comparar: la toma elegida frente a la anterior comparable (tanda del 2026-10-03; desde DL-117,
 * cualquier toma del período, elegida en el selector T1, T2, T3…).
 *
 * Reusa la comparación que ya hace el dominio (`tomaDe`). Cada medida va con la anterior **del mismo grupo de
 * comparabilidad**: mismo protocolo, método y unidad (REG-06-162/164), de una evaluación anterior a la elegida. Las tomas
 * se reconstruyen por evaluación, nunca por fecha (D-3 en docs/ux/INICIO-Y-NAVEGACION.md).
 * - Arriba, las dos fechas. Si una medida se comparó con otra fecha, su fila lo dice.
 * - Cada fila: el valor de ahora, el anterior y la diferencia, con sus unidades. La diferencia es una resta con signo,
 *   sin color de «mejor» o «peor» (TEST-PRJ-009).
 * - Sin anterior comparable, la fila dice por qué: la primera del período, u otro protocolo o método.
 * - Los resultados de fórmulas van aparte, con su método: dos métodos nunca se comparan.
 */
import {
  cantidad,
  COPY_ANTROPOMETRIA,
  ETIQUETA_DE_FAMILIA,
  FAMILIA_DE_METRICA,
  nombreDeMetodo,
  numero,
  textoDeDiferenciaAntropometrica,
  type FamiliaDeMedicion,
  type MedidaDeLaToma,
  type UltimaToma,
} from '@be/domain';
import { Text, View } from 'react-native';
import { fechaCivil } from '../formato';
import { Aviso, Ayuda, Cifra, estilosPorTema, Parrafo, Rotulo } from '../ui';

const FAMILIAS: readonly FamiliaDeMedicion[] = ['MASA_Y_ESTATURA', 'PERIMETROS', 'PLIEGUES', 'DIAMETROS', 'OTRAS'];

/** `etiqueta`: la de la toma elegida en el selector («T3»). Sin selector, la toma es la última. */
export function CompararTomas({ toma, etiqueta }: { toma: UltimaToma; etiqueta?: string }) {
  if (!toma.fechaAnterior) return <Aviso tipo="info" titulo={COPY_ANTROPOMETRIA.sinTomaAnterior} />;
  return (
    <View>
      <View style={estilos.fechas} accessible accessibilityLabel={`${COPY_ANTROPOMETRIA.tomaDel} ${fechaCivil(toma.fecha)} ${COPY_ANTROPOMETRIA.comparadaConLaDel} ${fechaCivil(toma.fechaAnterior)}`}>
        <View style={estilos.fecha}>
          <Text style={estilos.rotuloDeFecha}>{etiqueta ? `TOMA ${etiqueta}` : 'ÚLTIMA TOMA'}</Text>
          <Text style={estilos.textoDeFecha}>{fechaCivil(toma.fecha)}</Text>
        </View>
        <View style={estilos.fecha}>
          <Text style={estilos.rotuloDeFecha}>ANTERIOR</Text>
          <Text style={estilos.textoDeFecha}>{fechaCivil(toma.fechaAnterior)}</Text>
        </View>
      </View>
      {FAMILIAS.map((familia) => {
        const deLaFamilia = toma.medidas.filter((m) => (FAMILIA_DE_METRICA[m.metrica] ?? 'OTRAS') === familia);
        if (deLaFamilia.length === 0) return null;
        return (
          <View key={familia}>
            <Rotulo>{ETIQUETA_DE_FAMILIA[familia]}</Rotulo>
            {deLaFamilia.map((m) => (
              <FilaComparada key={m.metrica} medida={m} fechaComparada={toma.fechaAnterior} />
            ))}
          </View>
        );
      })}
      {toma.derivadas.length > 0 ? (
        <View>
          <Rotulo>{COPY_ANTROPOMETRIA.resultadosDeLasFormulas}</Rotulo>
          {toma.derivadas.map((m) => (
            <FilaComparada key={`${m.metrica}-${m.actual.punto.comparabilityGroup}`} medida={m} fechaComparada={toma.fechaAnterior} conMetodo />
          ))}
        </View>
      ) : null}
      <Ayuda>
        <Parrafo tenue>{COPY_ANTROPOMETRIA.explicacionDeComparar}</Parrafo>
      </Ayuda>
    </View>
  );
}

/** Una medida: nombre, valor de ahora a la derecha, y debajo el anterior con la diferencia, o por qué no se compara. */
function FilaComparada({ medida, fechaComparada, conMetodo = false }: { medida: MedidaDeLaToma; fechaComparada: string | null; conMetodo?: boolean }) {
  const { actual, anterior, diferencia, motivoSinAnterior } = medida;
  const metodo = conMetodo ? nombreDeMetodo(actual.grupo?.methodVersionId ?? null) ?? COPY_ANTROPOMETRIA.metodoSinNombre : null;
  const otraFecha = anterior && anterior.fecha !== fechaComparada ? ` (${fechaCivil(anterior.fecha)})` : '';
  const motivo = motivoSinAnterior === 'OTRO_GRUPO' ? COPY_ANTROPOMETRIA.sinAnteriorOtroGrupo : COPY_ANTROPOMETRIA.sinAnteriorSinPrevia;
  const frase = [
    medida.nombre,
    `ahora ${cantidad(actual.punto.value, actual.punto.unit)}`,
    anterior ? `antes ${cantidad(anterior.punto.value, anterior.punto.unit)}${otraFecha}` : motivo,
    diferencia ? `${COPY_ANTROPOMETRIA.diferencia}: ${textoDeDiferenciaAntropometrica(diferencia)}` : null,
    metodo ? `${COPY_ANTROPOMETRIA.metodoDelResultado}: ${metodo}` : null,
  ]
    .filter(Boolean)
    .join('. ');
  return (
    <View style={estilos.fila} accessible accessibilityLabel={frase}>
      <View style={estilos.cabeza}>
        <Text style={estilos.nombre}>{medida.nombre}</Text>
        <Cifra valor={numero(actual.punto.value)} unidad={actual.punto.unit} />
      </View>
      {metodo ? <Text style={estilos.detalle}>{`${COPY_ANTROPOMETRIA.metodoDelResultado}: ${metodo}`}</Text> : null}
      {anterior ? (
        <View style={estilos.cabeza}>
          <Text style={estilos.detalle}>{`${COPY_ANTROPOMETRIA.antes}: ${cantidad(anterior.punto.value, anterior.punto.unit)}${otraFecha}`}</Text>
          {diferencia ? <Text style={estilos.diferencia}>{textoDeDiferenciaAntropometrica(diferencia)}</Text> : null}
        </View>
      ) : (
        <Text style={estilos.detalle}>{motivo}</Text>
      )}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  fechas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 },
  fecha: { flexGrow: 1, flexBasis: 130, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.superficieElevada },
  rotuloDeFecha: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, color: COLOR.tenue },
  textoDeFecha: { fontSize: 18, fontWeight: '800', color: COLOR.texto },
  fila: { borderTopWidth: 1, borderTopColor: COLOR.borde, paddingVertical: 9 },
  cabeza: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', columnGap: 10 },
  nombre: { fontSize: 16, fontWeight: '700', color: COLOR.texto, flexShrink: 1 },
  detalle: { fontSize: 14, color: COLOR.tenue, marginTop: 2, flexShrink: 1 },
  diferencia: { fontSize: 15, fontWeight: '800', color: COLOR.texto, fontVariant: ['tabular-nums'] },
}));
