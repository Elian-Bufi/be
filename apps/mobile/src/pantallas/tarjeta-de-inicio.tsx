/**
 * Las piezas comunes de las tarjetas de Inicio (DL-117): la tarjeta con el ícono de su módulo, la estructura sin valores
 * mientras se verifica (G2), la falla con «Reintentar», el aviso del A3 y las acciones lado a lado. Cada tarjeta vive en
 * el archivo de su módulo (inicio-*.tsx), así la prueba de textos la revisa con la lista de su dominio.
 *
 * Desde DL-170 (AV2-07) la tarjeta deja su hoja propia y usa la receta de vidrio (`useSuperficie`, nivel 1, que provee
 * el nivel a lo de adentro); el ícono pasa a 20 dp, en `tenue`, en línea con el título y sin círculo: no es algo que se
 * toque. Una tarjeta chica (la medida y la actividad) puede ir con su ancho y tocarse entera. Si su título no entra al
 * lado del ícono, el ícono va arriba (revisión de la etapa A: a 360 dp, «Mediciones» se partía en «Medicione / s»).
 */
import { COPY, COPY_ANTROPOMETRIA, type Resultado } from '@be/domain';
import type { ReactNode } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { IconoDeZona } from '../barra-de-zonas';
import { alcanzaLaEscala } from '../escala-de-letra';
import { Icono, type NombreDeIcono } from '../icono';
import { lugarDelIcono } from '../inicio-de-hoy';
import type { Ir, Zona } from '../navegacion';
import { RELLENO_DE_LA_TARJETA } from '../receta-de-vidrio';
import { Boton, COLOR, estilosPorTema, Parrafo } from '../ui';
import { DentroDelNivel, useSuperficie } from '../vidrio';

export type Falla = Exclude<Resultado<unknown>, { ok: true }>;
export type AlPerderLaSesion = (r: Resultado<unknown>) => boolean;

/** Desde esta escala de letra, el ícono va arriba del título: al lado, el título partía «Entrenamiento» en dos. */
const ESCALA_PARA_APILAR = 1.5;

/**
 * Una tarjeta de Inicio: el ícono del módulo, como en la barra, el título y, si hace falta, de qué período habla. El
 * título crece con la letra hasta 1,5 veces: más grande, una palabra larga no entraba en la línea y se partía (render del
 * navegador con letra ×2, en 360 dp). El resto de la tarjeta crece sin tope.
 * - `ancho`: una tarjeta chica, lado a lado con otra (AV2-07). Sin porcentajes: el ancho sale de la ventana.
 * - `iconoArriba`: el par de tarjetas chicas decide junto dónde va el ícono (`disposicionDeLasTarjetasChicas`), para que
 *   las dos queden parejas. Si el título de esta no entra al lado (una medida de nombre largo), lo sube igual.
 * - `alTocar` y `paraLeer`: la tarjeta entera es un botón (la medida abre su evolución), con lo que dice el lector.
 */
export function TarjetaDeInicio({
  zona,
  titulo,
  detalle,
  icono,
  ancho,
  iconoArriba = false,
  alTocar,
  paraLeer,
  children,
}: {
  zona: Zona;
  titulo: string;
  detalle?: string;
  icono?: NombreDeIcono;
  ancho?: number;
  iconoArriba?: boolean;
  alTocar?: () => void;
  paraLeer?: string;
  children: ReactNode;
}) {
  const { fontScale } = useWindowDimensions();
  const { estilo, nivel } = useSuperficie();
  // El ícono va arriba del título si el par lo pide, si en esta tarjeta chica el título no entra al lado, o con letra
  // ×1,5 o más (la escala, comparada como la manda Android: `escala-de-letra.ts`).
  const apilar = iconoArriba || (ancho !== undefined && lugarDelIcono([titulo], ancho, fontScale) !== 'al-lado') || alcanzaLaEscala(fontScale, ESCALA_PARA_APILAR);
  const contenido = (
    <DentroDelNivel nivel={nivel}>
      <View style={[estilos.cabeza, apilar && estilos.cabezaApilada]}>
        {/* El de su módulo, salvo que la tarjeta pida otro de la familia (PA-06). Decorativo: en `tenue`, sin círculo. */}
        {icono ? <Icono nombre={icono} tamano={20} tono="tenue" /> : <IconoDeZona zona={zona} color={COLOR.tenue} tamano={20} />}
        <View style={[estilos.textosDeCabeza, apilar && estilos.textosApilados]}>
          {/* La red: si una palabra igual no entrara, se parte por sílabas y con guion, no en cualquier letra. */}
          <Text style={estilos.titulo} accessibilityRole="header" maxFontSizeMultiplier={1.5} android_hyphenationFrequency="normal">
            {titulo}
          </Text>
          {detalle ? <Text style={estilos.detalle}>{detalle}</Text> : null}
        </View>
      </View>
      {children}
    </DentroDelNivel>
  );
  const forma = [estilos.tarjeta, estilo, ancho === undefined ? null : { width: ancho }];
  if (!alTocar) return <View style={forma}>{contenido}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={paraLeer} onPress={alTocar} style={({ pressed }) => [...forma, pressed && estilos.presionada]}>
      {contenido}
    </Pressable>
  );
}

/**
 * Un área sin plan, en una línea y no en una tarjeta (AV-17, DL-166): el ícono del área y el texto de siempre. Lo que no
 * tiene nada no se dibuja como tarjeta vacía.
 */
export function LineaDeInicio({ zona, texto }: { zona: Zona; texto: string }) {
  return (
    <View style={estilos.linea} accessible accessibilityLabel={texto}>
      <IconoDeZona zona={zona} color={COLOR.tenue} />
      <Text style={estilos.textoDeLinea}>{texto}</Text>
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
  linea: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 4 },
  textoDeLinea: { fontSize: 15, lineHeight: 21, color: COLOR.tenue, flexShrink: 1 },
  // Las tarjetas mantienen un fondo estable: la superficie del tema, con su borde; con el vidrio, la receta (DL-170).
  tarjeta: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 16, padding: RELLENO_DE_LA_TARJETA, marginVertical: 8, backgroundColor: COLOR.superficie },
  presionada: { opacity: 0.7 },
  cabeza: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cabezaApilada: { flexDirection: 'column', alignItems: 'flex-start' },
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
}));
