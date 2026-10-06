/**
 * Las piezas comunes de las tarjetas de Inicio (DL-117): la tarjeta con el ícono de su módulo, la estructura sin valores
 * mientras se verifica (G2), la falla con «Reintentar», el aviso del A3 y las acciones lado a lado. Cada tarjeta vive en
 * el archivo de su módulo (inicio-*.tsx), así la prueba de textos la revisa con la lista de su dominio.
 */
import { COPY, COPY_ANTROPOMETRIA, type Resultado } from '@be/domain';
import type { ReactNode } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { IconoDeZona } from '../barra-de-zonas';
import type { Ir, Zona } from '../navegacion';
import { Boton, COLOR, estilosPorTema, Parrafo } from '../ui';

export type Falla = Exclude<Resultado<unknown>, { ok: true }>;
export type AlPerderLaSesion = (r: Resultado<unknown>) => boolean;

/** Desde esta escala de letra, el ícono va arriba del título: al lado, el título partía «Entrenamiento» en dos. */
const ESCALA_PARA_APILAR = 1.5;

/**
 * Una tarjeta de Inicio: el ícono del módulo, como en la barra, el título y, si hace falta, de qué período habla. El
 * título crece con la letra hasta 1,5 veces: más grande, una palabra larga no entraba en la línea y se partía (render del
 * navegador con letra ×2, en 360 dp). El resto de la tarjeta crece sin tope.
 */
export function TarjetaDeInicio({ zona, titulo, detalle, children }: { zona: Zona; titulo: string; detalle?: string; children: ReactNode }) {
  const { fontScale } = useWindowDimensions();
  return (
    <View style={estilos.tarjeta}>
      <View style={[estilos.cabeza, fontScale >= ESCALA_PARA_APILAR && estilos.cabezaApilada]}>
        <View style={estilos.icono}>
          <IconoDeZona zona={zona} color={COLOR.acento} grosor={1.8} />
        </View>
        <View style={[estilos.textosDeCabeza, fontScale >= ESCALA_PARA_APILAR && estilos.textosApilados]}>
          <Text style={estilos.titulo} accessibilityRole="header" maxFontSizeMultiplier={1.5}>
            {titulo}
          </Text>
          {detalle ? <Text style={estilos.detalle}>{detalle}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

/** Mientras la API confirma: la estructura de la tarjeta, sin valores (G2). */
export function Verificando() {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Cargando" style={estilos.carga}>
      <View style={[estilos.renglon, estilos.renglonLargo]} />
      <View style={[estilos.renglon, estilos.renglonCorto]} />
    </View>
  );
}

/** Una falla de esta tarjeta: se dice y se puede reintentar, sin tocar las otras. */
export function NoSePudo({ falla, reintentar }: { falla: Falla; reintentar: () => void }) {
  return (
    <View>
      <Parrafo tenue>{falla.tipo === 'RED' ? 'Sin conexión: no pudimos confirmar esto.' : 'No pudimos cargar esto.'}</Parrafo>
      <Boton texto={COPY.reintentar} tipo="secundario" onPress={reintentar} />
    </View>
  );
}

/** Sin el A3, lo propio no se lee (DL-115; 08:406): no es un error ni «sin datos», y los datos siguen guardados. */
export function SinA3({ texto, ir }: { texto: string; ir: Ir }) {
  return (
    <View>
      <Parrafo tenue>{texto}</Parrafo>
      <Boton texto={COPY_ANTROPOMETRIA.irAPrivacidad} tipo="secundario" onPress={() => ir({ nombre: 'privacidad' })} />
    </View>
  );
}

export const faltaElA3 = (r: Resultado<unknown>): boolean => !r.ok && r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN';

/**
 * Dos acciones lado a lado. Cada una pide un ancho que crece con la letra: con letra grande ya no entran dos en la línea,
 * y cada una baja a la suya entera, en vez de partir su texto en dos renglones dentro del botón.
 */
export function Acciones({ children }: { children: ReactNode }) {
  return <View style={estilos.acciones}>{children}</View>;
}
export function Accion({ children }: { children: ReactNode }) {
  const { fontScale } = useWindowDimensions();
  return <View style={[estilos.accion, { flexBasis: 140 * Math.min(Math.max(fontScale, 1), 2.2) }]}>{children}</View>;
}

export const estilos = estilosPorTema((COLOR) => ({
  fechaDeHoy: { fontSize: 16, color: COLOR.tenue, marginTop: -6, marginBottom: 8 },
  // Las tarjetas mantienen un fondo estable: la superficie del tema, con su borde.
  tarjeta: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 16, padding: 16, marginVertical: 8, backgroundColor: COLOR.superficie },
  cabeza: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  cabezaApilada: { flexDirection: 'column', alignItems: 'flex-start' },
  icono: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.superficieElevada },
  textosDeCabeza: { flex: 1 },
  // Apilados, los textos ocupan su alto: con flex 1 en una columna sin alto fijo, podían quedar sin lugar.
  textosApilados: { flex: 0, alignSelf: 'stretch' },
  titulo: { fontSize: 19, fontWeight: '800', color: COLOR.texto },
  detalle: { fontSize: 14, lineHeight: 20, color: COLOR.tenue },
  carga: { paddingVertical: 4 },
  renglon: { height: 14, borderRadius: 7, marginVertical: 6, backgroundColor: COLOR.superficieElevada },
  // Sin porcentajes: los renglones dejan un margen fijo a la derecha.
  renglonLargo: { marginRight: 72 },
  renglonCorto: { marginRight: 160 },
  fila: { borderTopWidth: 1, borderTopColor: COLOR.borde, paddingTop: 10, marginTop: 6 },
  nombre: { fontSize: 17, fontWeight: '700', color: COLOR.texto },
  negrita: { fontWeight: '700', color: COLOR.texto },
  pregunta: { fontSize: 16, fontWeight: '700', color: COLOR.texto, marginTop: 4 },
  renglonDeDato: { fontSize: 16, lineHeight: 23, color: COLOR.texto, marginVertical: 4 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8 },
  accion: { flexGrow: 1, flexBasis: 140 },
  parDeDato: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderTopWidth: 1, borderTopColor: COLOR.borde, paddingVertical: 8 },
  textoDeDato: { fontSize: 16, color: COLOR.texto, flexShrink: 1 },
  valorDeDato: { fontSize: 16, fontWeight: '800', color: COLOR.texto },
  destacada: { marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: COLOR.fondo, borderWidth: 1, borderColor: COLOR.borde },
}));
