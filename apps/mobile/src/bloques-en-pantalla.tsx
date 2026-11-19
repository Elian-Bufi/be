/**
 * APK · DL-181 (WP-ENTRENAMIENTO-PLANIFICACION) · los ejercicios de una sesión planificada, agrupados bajo su bloque.
 *
 * Las partes y lo que dice cada encabezado salen de `bloques-en-la-sesion.ts` (lógica pura, con su prueba). Acá se dibujan:
 * - **El encabezado:** el nombre del bloque y, en uno «En vueltas», debajo y en letra de cuerpo, la indicación. Es un
 *   encabezado para TalkBack, que lo lee entero con su etiqueta (el nombre, la indicación y cuántos ejercicios).
 * - **El grupo:** una línea a la izquierda, del borde de los controles del tema (se ve en Azul noche y en Claro, y no es
 *   el cian, que queda para lo activo), que junta el encabezado con sus ejercicios.
 * - **Sin bloques, los mismos elementos que la lista de siempre**, en el mismo lugar y con las mismas claves: la pantalla
 *   no cambia.
 *
 * Solo agrupa lo que se ve: no cambia el registro, el orden de las series, la franja de progreso ni la navegación.
 */
import type { BloqueParaLeer, ConBloque, SesionConBloques } from '@be/domain';
import type { ReactElement, ReactNode } from 'react';
import { Text, View } from 'react-native';
import { partesParaMostrar, type ComoSeDiceElBloque, type EncabezadoDelBloque } from './bloques-en-la-sesion';
import { estilosPorTema } from './tema';

/**
 * La lista de ejercicios de una sesión con sus bloques: va donde estaba el `prescriptions.map(…)` de la pantalla.
 * `dibujar` es lo que la pantalla ya hacía con cada ejercicio (con su `key`); `posicion` es su lugar en la lista, desde
 * cero, para numerarlo como antes. Un bloque cuyos ejercicios no dibujan nada no se muestra.
 */
export function ejerciciosConSusBloques<P extends ConBloque>(
  sesion: SesionConBloques<P, BloqueParaLeer>,
  dibujar: (prescripcion: P, posicion: number) => ReactElement | null,
  como: ComoSeDiceElBloque = 'indicacion',
): (ReactElement | null)[] {
  return partesParaMostrar(sesion, como).map((parte) => {
    if (parte.tipo === 'suelto') return dibujar(parte.ejercicio.prescripcion, parte.ejercicio.posicion);
    const hijos = parte.ejercicios.map((e) => dibujar(e.prescripcion, e.posicion));
    if (hijos.every((h) => h === null)) return null;
    return (
      <GrupoDelBloque key={`bloque:${parte.encabezado.groupId}`} encabezado={parte.encabezado}>
        {hijos}
      </GrupoDelBloque>
    );
  });
}

/** Un bloque: su encabezado y, debajo, sus ejercicios, unidos por la línea de la izquierda. */
export function GrupoDelBloque({ encabezado, children }: { encabezado: EncabezadoDelBloque; children: ReactNode }) {
  return (
    <View style={estilos.grupo}>
      <View style={estilos.encabezado} accessible accessibilityRole="header" accessibilityLabel={encabezado.etiqueta}>
        <Text style={estilos.nombre}>{encabezado.nombre}</Text>
        {encabezado.detalle ? <Text style={estilos.detalle}>{encabezado.detalle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  // La línea va en el borde de los controles: el de las tarjetas casi no se ve sobre el fondo claro, y el cian marca lo
  // activo (la fila, el ejercicio de «Ver rutina»).
  grupo: { borderLeftWidth: 3, borderLeftColor: COLOR.bordeControl, paddingLeft: 12, marginVertical: 8 },
  encabezado: { gap: 2, marginBottom: 4 },
  nombre: { fontSize: 17, lineHeight: 23, fontWeight: '800', color: COLOR.texto },
  // La indicación, en letra de cuerpo y en el color del texto: se lee para hacer el bloque, no es un rótulo.
  detalle: { fontSize: 15, lineHeight: 21, fontWeight: '600', color: COLOR.texto },
}));
