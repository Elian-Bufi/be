/**
 * APK · Novedades (WP-NOVEDADES-Y-AVISOS, DL-133; RF-061, UC-P30): el centro de novedades de la persona. Se abre desde la
 * campana de la cabecera o al tocar un aviso.
 * - De la más nueva a la más vieja, con «Ver más». Cada una dice qué pasó, quién y cuándo, nunca el contenido: el plan, la
 *   revisión o el vínculo se ven en su pantalla, que vuelve a pedir el acceso.
 * - Tocar una la marca leída (la API registra la primera lectura) y lleva a su pantalla: Nutrición, Entrenamiento o
 *   Vínculos. Una que no tiene pantalla queda leída acá.
 * - «Sin leer» se dice con palabras, no solo con el color (B10-10 §43).
 * - Si la API no responde, se dice y se puede reintentar: las novedades no se pierden (UC-P30 E03).
 */
import { COPY_NOVEDADES, type Novedad, type Resultado } from '@be/domain';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { api } from '../api';
import { EstadoDeCarga, VerMas } from '../estados';
import { fecha } from '../formato';
import { useListaPaginada } from '../lista';
import { useSesionPerdida, type Ruta, type Salida } from '../navegacion';
import { Aviso, Insignia, Parrafo, Titulo, estilosPorTema } from '../ui';

/** La pantalla de la APK que resuelve una novedad, o `null` si se queda en Novedades. */
export function rutaDeNovedad(n: Pick<Novedad, 'open'>): Ruta | null {
  switch (n.open.view) {
    case 'NUTRITION':
      return { nombre: 'hoy' };
    case 'TRAINING':
      return { nombre: 'entrenamiento' };
    case 'RELATIONSHIPS':
      return { nombre: 'vinculos' };
    // REV-A (DL-134): la novedad de una revisión abre esa revisión, completa.
    case 'NUTRITION_REVIEW':
      return n.open.referenceId ? { nombre: 'revision', area: 'NUTRICION', id: n.open.referenceId } : { nombre: 'revisiones', area: 'NUTRICION' };
    case 'TRAINING_REVIEW':
      return n.open.referenceId ? { nombre: 'revision', area: 'ENTRENAMIENTO', id: n.open.referenceId } : { nombre: 'revisiones', area: 'ENTRENAMIENTO' };
    default:
      return null;
  }
}

export function PantallaDeNovedades({
  token,
  salir,
  ir,
  alCambiarSinLeer,
}: {
  token: string;
  salir: (motivo: Salida) => void;
  ir: (r: Ruta) => void;
  /** Avisa a la cabecera cuántas quedan sin leer. */
  alCambiarSinLeer: (n: number) => void;
}) {
  const sesionPerdida = useSesionPerdida(salir);
  const [leidas, setLeidas] = useState<ReadonlyMap<string, Novedad>>(new Map());
  const [abriendo, setAbriendo] = useState<string | null>(null);
  const [problema, setProblema] = useState<string | null>(null);

  const pedir = useCallback(
    async (cursor?: string) => {
      const r = await api.consultarNovedades(token, { cursor, limit: '30' });
      if (r.ok && !cursor) alCambiarSinLeer(r.datos.unreadCount);
      return r;
    },
    [token, alCambiarSinLeer],
  );
  const lista = useListaPaginada(pedir, sesionPerdida);

  async function abrir(n: Novedad) {
    if (abriendo) return;
    setAbriendo(n.newsId);
    setProblema(null);
    const r: Resultado<{ data: Novedad }> = await api.abrirNovedad(token, n.newsId);
    setAbriendo(null);
    if (sesionPerdida(r)) return;
    if (!r.ok) {
      setProblema(COPY_NOVEDADES.errorAlCargar);
      return;
    }
    if (!n.readAt) alCambiarSinLeer(Math.max(0, sinLeer - 1));
    setLeidas((m) => new Map(m).set(n.newsId, r.datos.data));
    const destino = rutaDeNovedad(r.datos.data);
    if (destino) ir(destino);
  }

  const items = lista.estado.tipo === 'listo' ? lista.estado.items.map((n) => leidas.get(n.newsId) ?? n) : [];
  const sinLeer = items.filter((n) => !n.readAt).length;

  return (
    <>
      <Titulo>{COPY_NOVEDADES.titulo}</Titulo>
      <EstadoDeCarga estado={lista.estado} onReintentar={lista.recargar} />
      {lista.estado.tipo === 'listo' && items.length === 0 ? <Parrafo>{COPY_NOVEDADES.vacio}</Parrafo> : null}
      {problema ? <Aviso tipo="error" titulo={problema} /> : null}
      {items.map((n) => (
        <Pressable
          key={n.newsId}
          accessibilityRole="button"
          accessibilityLabel={`${n.readAt ? '' : `${COPY_NOVEDADES.noLeida}. `}${n.title}. ${n.body} ${fecha(n.occurredAt ?? n.recordedAt)}`}
          accessibilityState={{ busy: abriendo === n.newsId }}
          onPress={() => void abrir(n)}
          style={({ pressed }) => [estilos.novedad, !n.readAt && estilos.sinLeer, pressed && estilos.presionada]}
        >
          <View style={estilos.encabezado}>
            <Text style={estilos.titulo}>{n.title}</Text>
            {n.readAt ? null : <Insignia texto={COPY_NOVEDADES.noLeida} />}
          </View>
          <Text style={estilos.cuerpo}>{n.body}</Text>
          <Text style={estilos.fecha}>{abriendo === n.newsId ? 'Abriendo…' : fecha(n.occurredAt ?? n.recordedAt)}</Text>
        </Pressable>
      ))}
      <VerMas estado={lista.estado} onVerMas={lista.verMas} />
    </>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  novedad: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 12, padding: 14, marginBottom: 10, backgroundColor: COLOR.superficie, minHeight: 48 },
  sinLeer: { borderColor: COLOR.acento },
  presionada: { opacity: 0.7 },
  encabezado: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  titulo: { fontSize: 16, fontWeight: '700', color: COLOR.texto, flexShrink: 1 },
  cuerpo: { fontSize: 15, lineHeight: 21, color: COLOR.texto },
  fecha: { fontSize: 13, color: COLOR.tenue, marginTop: 6 },
}));
