/**
 * Una imagen privada de BE (DL-120; WP-NUTRICION-RECETAS §6): la de referencia de una receta o la foto de una comida.
 * - **La identidad del medio no es su URL.** La pantalla pide el acceso (API-MED-03) y recibe una ruta firmada que vence
 *   en 15 minutos como máximo. La ruta no lleva la sesión: la imagen se descarga sin credenciales.
 * - **El acceso se recuerda mientras dure,** para no pedirlo de nuevo en cada dibujo: cada acceso queda en el registro de
 *   actos de la API. Vive en el proceso, por sesión, y nunca va a disco. Dos imágenes del mismo medio a la vez comparten
 *   el pedido.
 * - **Si la descarga falla,** se pide un acceso nuevo una vez (la ruta pudo vencer con la pantalla abierta); si vuelve a
 *   fallar, queda el ícono de respaldo con «La imagen no se pudo mostrar.». El contenido de alrededor sigue a la vista, y
 *   nada se bloquea: se puede registrar igual.
 * - **Sin imagen,** el ícono y «Sin imagen de referencia».
 * - **El rótulo** («Imagen de referencia», «Tu foto») va debajo de la imagen, solo mientras hay imagen: la foto de una
 *   receta no mide la porción ni demuestra lo que se comió.
 * - **El respaldo es de quien la usa** (WP-ENTRENAMIENTO-SERIES §7.2): por omisión, el plato y los textos de Nutrición;
 *   la imagen de un ejercicio usa la mancuerna de la app y «Sin imagen del ejercicio». Con `tamano`, el marco es un
 *   cuadrado fijo (la imagen de 112 dp de la sesión enfocada) en lugar de ocupar el ancho.
 */
import { COPY_REGISTRO_DE_COMIDAS, type Resultado } from '@be/domain';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Image, Text, View } from 'react-native';
import { api } from './api';
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

/** Un acceso que vence en menos de esto no se usa: se pide otro. */
const MARGEN_DEL_ACCESO_MS = 60_000;

const accesos = new Map<string, { readonly url: string; readonly venceMs: number }>();
const pedidos = new Map<string, Promise<string | null>>();

/**
 * La URL de lectura del medio: la recordada si todavía vale, o una nueva. `null` si la API no la dio (sin red, sin
 * acceso, un medio suprimido): la pantalla muestra el respaldo.
 */
function urlDelMedio(token: string, mediaId: string, sesionPerdida: (r: Resultado<unknown>) => boolean, renovar: boolean): Promise<string | null> {
  const clave = `${token}|${mediaId}`;
  const guardado = accesos.get(clave);
  if (!renovar && guardado && guardado.venceMs - MARGEN_DEL_ACCESO_MS > relojDelServidor.ahora()) return Promise.resolve(guardado.url);
  if (renovar) accesos.delete(clave);
  const enCurso = pedidos.get(clave);
  if (enCurso) return enCurso;
  const pedido = api.accederAMedio(token, mediaId).then((r) => {
    pedidos.delete(clave);
    if (sesionPerdida(r) || !r.ok) return null;
    const url = api.urlDe(r.datos.data.path);
    const venceMs = Date.parse(r.datos.data.expiresAt);
    if (Number.isFinite(venceMs)) accesos.set(clave, { url, venceMs });
    return url;
  });
  pedidos.set(clave, pedido);
  return pedido;
}

type EstadoDeLaImagen =
  | { readonly tipo: 'sin-imagen' }
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'lista'; readonly url: string; readonly renovada: boolean }
  | { readonly tipo: 'fallo' };

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
}) {
  const [estado, setEstado] = useState<EstadoDeLaImagen>(mediaId ? { tipo: 'cargando' } : { tipo: 'sin-imagen' });

  useEffect(() => {
    if (!mediaId) {
      setEstado({ tipo: 'sin-imagen' });
      return;
    }
    if (!cargar) return;
    let vigente = true;
    setEstado({ tipo: 'cargando' });
    void urlDelMedio(token, mediaId, sesionPerdida, false).then((url) => {
      if (vigente) setEstado(url ? { tipo: 'lista', url, renovada: false } : { tipo: 'fallo' });
    });
    return () => {
      vigente = false;
    };
  }, [token, mediaId, sesionPerdida, cargar]);

  // La descarga falló: puede ser una ruta vencida. Se pide un acceso nuevo una vez; si vuelve a fallar, el respaldo.
  const alFallar = useCallback(() => {
    if (estado.tipo !== 'lista' || !mediaId) return;
    if (estado.renovada) return setEstado({ tipo: 'fallo' });
    void urlDelMedio(token, mediaId, sesionPerdida, true).then((url) => setEstado(url ? { tipo: 'lista', url, renovada: true } : { tipo: 'fallo' }));
  }, [estado, token, mediaId, sesionPerdida]);

  const texto = estado.tipo === 'sin-imagen' ? respaldo.sinImagen : respaldo.noDisponible;
  return (
    <View>
      <View style={[estilos.marco, tamano === undefined ? { aspectRatio: proporcion } : { width: tamano, height: tamano, alignSelf: 'flex-start' }]}>
        {estado.tipo === 'lista' ? (
          <Image source={{ uri: estado.url }} style={estilos.imagen} resizeMode="cover" onError={alFallar} accessible accessibilityRole="image" accessibilityLabel={rotulo} />
        ) : estado.tipo === 'cargando' ? (
          <View style={estilos.imagen} accessible accessibilityRole="image" accessibilityLabel={rotulo} />
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
  respaldo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 },
  textoDeRespaldo: { fontSize: 14, lineHeight: 19, color: COLOR.tenue, textAlign: 'center' },
  rotulo: { fontSize: 12, lineHeight: 16, color: COLOR.tenue, marginTop: 4 },
}));
