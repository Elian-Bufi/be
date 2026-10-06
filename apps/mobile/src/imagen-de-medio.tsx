/**
 * Una imagen privada de BE (DL-120; WP-NUTRICION-RECETAS §6; WP-ENTRENAMIENTO-SERIES §7.2): la de referencia de una
 * receta, la foto de una comida o la ilustración de un ejercicio. La carga es la de `cargador-de-imagen.ts`, sin React:
 * - **La identidad del medio no es su URL.** Se pide el acceso (API-MED-03) y se recibe una ruta firmada que vence en 15
 *   minutos como máximo. La ruta no lleva la sesión: la imagen se descarga sin credenciales. El acceso se recuerda
 *   mientras dura, en el proceso y nunca en disco: cada acceso queda en el registro de actos de la API.
 * - **Si la descarga falla,** se pide un acceso nuevo una sola vez (la ruta pudo vencer con la pantalla abierta); si
 *   vuelve a fallar, queda el ícono de respaldo con «La imagen no se pudo mostrar.». El contenido de alrededor sigue a la
 *   vista, y nada se bloquea: se puede registrar igual.
 * - **Sin imagen,** el ícono y «Sin imagen de referencia» (o «Sin imagen del ejercicio»): no es una descarga fallida.
 * - **Una respuesta tardía no reaparece** (precierre del 2026-10-06, §5): si cambia el ejercicio, el medio o la cuenta
 *   mientras se pide o se renueva un acceso, lo que llega tarde se descarta.
 * - **El ajuste** (`ajuste`): una foto llena el marco (`cubrir`); la ilustración de un ejercicio se ve entera, con el
 *   cuerpo y el material sin recortar (`contener`), sobre blanco, que es el fondo con el que el servidor guarda una
 *   imagen con transparencia. Igual en los dos temas.
 * - **El rótulo** («Imagen de referencia», «Tu foto») va debajo de la imagen, solo mientras hay imagen: la foto de una
 *   receta no mide la porción ni demuestra lo que se comió.
 * - **El respaldo es de quien la usa:** por omisión, el plato y los textos de Nutrición; la imagen de un ejercicio usa la
 *   mancuerna de la app. Con `tamano`, el marco es un cuadrado fijo (la imagen de 112 dp de la sesión enfocada).
 */
import { COPY_REGISTRO_DE_COMIDAS, type Resultado } from '@be/domain';
import { useEffect, useState, type ReactElement } from 'react';
import { Image, Text, View } from 'react-native';
import { api } from './api';
import { crearAccesoAMedios, crearCargadorDeImagen, type EstadoDeLaImagen } from './cargador-de-imagen';
import { IconoDePlato } from './iconos-de-nutricion';
import { relojDelServidor } from './reloj-del-servidor';
import { COLOR, estilosPorTema } from './tema';

/** Lo que se ve cuando no hay imagen o no se pudo mostrar: un ícono de la app y sus dos textos. */
export interface RespaldoDeImagen {
  readonly icono: (p: { readonly color: string; readonly tamano: number }) => ReactElement;
  readonly sinImagen: string;
  readonly noDisponible: string;
}

/** El respaldo de Nutrición: el plato con cubiertos. */
export const RESPALDO_DE_COMIDA: RespaldoDeImagen = {
  icono: ({ color, tamano }) => <IconoDePlato color={color} tamano={tamano} />,
  sinImagen: COPY_REGISTRO_DE_COMIDAS.sinImagen,
  noDisponible: COPY_REGISTRO_DE_COMIDAS.imagenNoDisponible,
};

/** Un solo acceso por proceso, compartido por todas las imágenes. */
const accesoAMedios = crearAccesoAMedios({ acceder: (token, mediaId) => api.accederAMedio(token, mediaId), urlDe: (ruta) => api.urlDe(ruta), ahoraMs: () => relojDelServidor.ahora() });

export function ImagenDeMedio({
  token,
  mediaId,
  sesionPerdida,
  rotulo,
  proporcion = 16 / 10,
  respaldoCompacto = false,
  cargar = true,
  respaldo = RESPALDO_DE_COMIDA,
  tamano,
  rotuloVisible = true,
  ajuste = 'cubrir',
}: {
  token: string;
  mediaId: string | null;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** Lo que es la imagen: «Imagen de referencia» o «Tu foto». Se lee y se ve debajo, mientras haya imagen. */
  rotulo: string;
  /** Ancho sobre alto. */
  proporcion?: number;
  /** Para una imagen chica (al lado de un texto): el respaldo sin texto, que lo dice el lector de pantalla. */
  respaldoCompacto?: boolean;
  /** `false` mientras no hace falta: el lugar queda reservado y el acceso no se pide (una opción lejana del carrusel). */
  cargar?: boolean;
  /** El ícono y los textos de cuando no hay imagen. Por omisión, los de Nutrición. */
  respaldo?: RespaldoDeImagen;
  /** El lado de un marco cuadrado fijo, en dp. Sin él, la imagen ocupa el ancho con su proporción. */
  tamano?: number;
  /** `false`: el rótulo no se ve debajo (lo sigue diciendo el lector de pantalla). Para una miniatura al lado de su nombre. */
  rotuloVisible?: boolean;
  /** `cubrir`: una foto llena el marco. `contener`: una ilustración se ve entera, sin recortar el cuerpo ni el material. */
  ajuste?: 'cubrir' | 'contener';
}) {
  const [estado, setEstado] = useState<EstadoDeLaImagen>(mediaId ? { tipo: 'cargando' } : { tipo: 'sin-imagen' });
  const [cargador] = useState(() => crearCargadorDeImagen(accesoAMedios, setEstado));

  useEffect(() => {
    cargador.mostrar(token, mediaId, cargar, sesionPerdida);
    return () => cargador.soltar();
  }, [cargador, token, mediaId, sesionPerdida, cargar]);

  const contener = ajuste === 'contener';
  const texto = estado.tipo === 'sin-imagen' ? respaldo.sinImagen : respaldo.noDisponible;
  return (
    <View>
      <View style={[estilos.marco, tamano === undefined ? { aspectRatio: proporcion } : { width: tamano, height: tamano, alignSelf: 'flex-start' }, contener && estado.tipo !== 'fallo' && estado.tipo !== 'sin-imagen' ? estilos.fondoDeIlustracion : null]}>
        {estado.tipo === 'lista' ? (
          <Image
            source={{ uri: estado.url }}
            style={[estilos.imagen, contener ? estilos.fondoDeIlustracion : null]}
            resizeMode={contener ? 'contain' : 'cover'}
            onError={() => cargador.alFallarLaDescarga()}
            accessible
            accessibilityRole="image"
            accessibilityLabel={rotulo}
          />
        ) : estado.tipo === 'cargando' ? (
          <View style={[estilos.imagen, contener ? estilos.fondoDeIlustracion : null]} accessible accessibilityRole="image" accessibilityLabel={rotulo} />
        ) : (
          <View style={estilos.respaldo} accessible accessibilityRole="image" accessibilityLabel={texto}>
            {respaldo.icono({ color: COLOR.tenue, tamano: respaldoCompacto ? 32 : 44 })}
            {respaldoCompacto ? null : (
              <Text style={estilos.textoDeRespaldo} importantForAccessibility="no" accessibilityElementsHidden>
                {texto}
              </Text>
            )}
          </View>
        )}
      </View>
      {rotuloVisible && (estado.tipo === 'lista' || estado.tipo === 'cargando') ? (
        <Text style={estilos.rotulo} importantForAccessibility="no" accessibilityElementsHidden>
          {rotulo}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  marco: { alignSelf: 'stretch', borderRadius: 12, overflow: 'hidden', backgroundColor: COLOR.superficieElevada, borderWidth: 1, borderColor: COLOR.borde },
  imagen: { flex: 1, alignSelf: 'stretch', backgroundColor: COLOR.superficieElevada },
  // El blanco con el que el servidor aplana la transparencia (token `fondoDeIlustracion`, igual en los dos temas).
  fondoDeIlustracion: { backgroundColor: COLOR.fondoDeIlustracion },
  respaldo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 },
  textoDeRespaldo: { fontSize: 14, lineHeight: 19, color: COLOR.tenue, textAlign: 'center' },
  rotulo: { fontSize: 12, lineHeight: 16, color: COLOR.tenue, marginTop: 4 },
}));
