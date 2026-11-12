/**
 * Inicio · la tira de la semana (WP-APP-VUELTA-2 AV2-08, DL-170; con AV2-D5): la semana calendario de hoy, de lunes a
 * domingo, arriba de Entrenamiento, en una tarjeta de vidrio.
 *
 * - **Celebra lo hecho, sin rachas** (decisión de Dirección del 2026-11-08): un día con alguna sesión realizada lleva un
 *   círculo en `exito` con la tilde en `botonTexto` (en Azul noche la tilde blanca de la maqueta no llegaba a 3:1; AV2-T8).
 *   Los demás días, el número neutro: uno con solo una «No realizada», uno sin sesión y uno que todavía no llegó se ven
 *   igual. Nunca rojo ni cruz, ninguna cuenta de días seguidos, y el lunes arranca vacía.
 * - **Hoy** lleva un aro neutro (`texto`) por fuera del círculo, con 2 dp de la tarjeta en el medio (AV2-T21): se ve
 *   también el día en que la persona entrenó. La tira no se toca, así que nada en ella va en el acento (GUIA I.6); antes el
 *   aro era el borde del círculo, en el acento, y sobre el verde no se distinguía (1,15:1 en Azul noche, 1,00:1 en Claro).
 * - **Debajo**, con el calendario, «2 sesiones realizadas esta semana»; sin ninguna, la línea no se dibuja. Mientras carga,
 *   los días sin tildes y sin línea: ni un cero.
 * - **El lector** recorre la tira como una sola etiqueta: «Esta semana: lunes y miércoles con sesión realizada. Hoy,
 *   lunes 9» (§3.4). Los círculos y los números no se recorren uno por uno.
 * Sale de la misma lectura de 30 días que la tarjeta «Actividad» y «Tu historial» (AV2-12), y de API-TRN-14 para hoy:
 * no pide nada nuevo. Es lógica de `inicio-de-hoy.ts` (`tiraDeLaSemana`, `ladoDelDiaDeLaTira`); acá solo se dibuja.
 */
import { Text, useWindowDimensions, View } from 'react-native';
import { Icono } from '../icono';
import { ARO_DE_HOY, ladoDelDiaDeLaTira, type TiraDeLaSemana as Tira } from '../inicio-de-hoy';
import { estilosPorTema } from '../ui';
import { useSuperficie } from '../vidrio';

export function TiraDeLaSemana({ tira }: { tira: Tira }) {
  const { estilo } = useSuperficie();
  const { width, fontScale } = useWindowDimensions();
  // Siete columnas dentro de la tarjeta, a todo el ancho: el círculo crece con la letra y, con su aro, no pasa su columna.
  const lado = ladoDelDiaDeLaTira(width, fontScale);
  const aro = lado + 2 * (ARO_DE_HOY.grosor + ARO_DE_HOY.separacion);
  return (
    <View style={[estilos.tarjeta, estilo]} accessible accessibilityLabel={tira.paraLeer}>
      <View style={estilos.dias} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {tira.dias.map((d) => (
          <View key={d.fecha} style={estilos.dia}>
            <Text style={estilos.letra} maxFontSizeMultiplier={1.3}>
              {d.letra}
            </Text>
            {/* El aro envuelve al círculo; solo hoy tiene color. */}
            <View style={[estilos.aro, { width: aro, height: aro, borderRadius: aro / 2 }, d.hoy && estilos.aroDeHoy]}>
              <View style={[estilos.circulo, { width: lado, height: lado, borderRadius: lado / 2 }, d.realizada && estilos.realizado]}>
                {d.realizada ? (
                  <Icono nombre="tilde" tamano={18} tono="botonTexto" />
                ) : (
                  <Text style={estilos.numero} maxFontSizeMultiplier={1.3}>
                    {d.numero}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
      {tira.linea ? (
        <View style={estilos.linea} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Icono nombre="calendario" tamano={18} tono="tenue" />
          <Text style={estilos.textoDeLinea}>{tira.linea}</Text>
        </View>
      ) : null}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  // La superficie de siempre; con el vidrio, la receta de nivel 1 (DL-170).
  tarjeta: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 16, padding: 16, marginVertical: 8, backgroundColor: COLOR.superficie, gap: 10 },
  dias: { flexDirection: 'row', justifyContent: 'space-between' },
  dia: { flex: 1, alignItems: 'center', gap: 6 },
  letra: { fontSize: 13, fontWeight: '700', color: COLOR.tenue },
  // El aro: su grosor y, adentro, la separación del color de la tarjeta. Sin color, salvo hoy.
  aro: { alignItems: 'center', justifyContent: 'center', borderWidth: ARO_DE_HOY.grosor, padding: ARO_DE_HOY.separacion, borderColor: 'transparent' },
  // Hoy: el aro neutro, en el color del texto, medido contra la tarjeta de los dos lados (TEST-AV2-001).
  aroDeHoy: { borderColor: COLOR.texto },
  circulo: { alignItems: 'center', justifyContent: 'center' },
  // Lo hecho: el círculo lleno en `exito`, con la tilde en `botonTexto` (12,29:1 en Azul noche; 5,07:1 en Claro).
  realizado: { backgroundColor: COLOR.exito },
  numero: { fontSize: 15, fontWeight: '600', color: COLOR.texto, fontVariant: ['tabular-nums'] },
  linea: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoDeLinea: { fontSize: 14, color: COLOR.tenue, flexShrink: 1 },
}));
