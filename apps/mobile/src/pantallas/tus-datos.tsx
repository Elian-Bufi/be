/**
 * APK · «Tus datos» (UF-06 de WP-USO-FINAL, DL-169; 08 §19), desde Perfil. Es la misma sección que la cuenta del website:
 * - **Descargar:** pide la exportación de los tres dominios (API-EXP-01), lee su ruta firmada (API-EXP-02) y la abre en el
 *   navegador del teléfono, que baja el archivo. La ruta vence a los 15 minutos y el archivo no pasa por la APK.
 * - **Pedir:** el acceso, la rectificación o la supresión (API-RGT-01). Una clave de idempotencia por intento: el reintento
 *   de un resultado incierto la reusa (`useClaveDeIntento`), y cambiar el pedido es otro intento. La supresión recuerda
 *   que también se puede cerrar la cuenta, y lleva ahí.
 * - **Tus pedidos** (API-RGT-03): el estado, el plazo y la respuesta de Administración; nunca su fundamento interno.
 * Los plazos son los de la Ley 25.326, y la pantalla lo dice (la confirmación de la asesoría queda en el paquete y en el
 * gate, no en la pantalla).
 * Cada aviso aparece junto al botón que lo generó, con el texto como título: TalkBack lo anuncia (WCAG 4.1.3, revisión
 * adversarial de la etapa 2).
 */
import {
  COPY,
  COPY_DERECHOS as D,
  DOMINIOS_DE_LA_EXPORTACION,
  LARGO_MAXIMO_DE_LA_NOTA_DEL_PEDIDO,
  TIPOS_DE_PEDIDO_DE_DERECHO,
  type PedidoDeDerecho,
  type TipoDePedidoDeDerecho,
} from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { api } from '../api';
import { Cargando, ErrorConReintento } from '../estados';
import { dia } from '../formato';
import { falloDe, useClaveDeIntento } from '../intento';
import { useSesionPerdida, type Ir, type Salida } from '../navegacion';
import { Aviso, Boton, Campo, Dato, Parrafo, Seccion, Segmentos, Tarjeta, Titulo } from '../ui';

/** El plazo es una fecha civil de Buenos Aires: se escribe al mediodía para que ningún huso la corra de día. */
const enPalabras = (civil: string): string => dia(`${civil}T12:00:00.000Z`);

const OPCIONES_DE_PEDIDO = TIPOS_DE_PEDIDO_DE_DERECHO.map((t) => ({ valor: t, texto: D.pedir.tipos[t] }));

type AvisoDeLaPantalla = { readonly tipo: 'error' | 'exito'; readonly texto: string; readonly de: 'descargar' | 'pedir' };

export function PantallaDeTusDatos({ token, salir, ir }: { token: string; salir: (m: Salida) => void; ir: Ir }) {
  const sesionPerdida = useSesionPerdida(salir);
  const intentoDePedir = useClaveDeIntento();
  const intentoDeDescargar = useClaveDeIntento();
  const [pedidos, setPedidos] = useState<readonly PedidoDeDerecho[] | null>(null);
  const [lecturaFallida, setLecturaFallida] = useState<{ readonly sinConexion: boolean } | null>(null);
  const [tipo, setTipo] = useState<TipoDePedidoDeDerecho>('ACCESS');
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [aviso, setAviso] = useState<AvisoDeLaPantalla | null>(null);

  const leer = useCallback(async () => {
    setLecturaFallida(null);
    const r = await api.pedidosDeDerechos(token);
    if (sesionPerdida(r)) return;
    if (r.ok) setPedidos(r.datos.data);
    else setLecturaFallida({ sinConexion: r.tipo === 'RED' });
  }, [token, sesionPerdida]);
  useEffect(() => {
    void leer();
  }, [leer]);

  async function descargar() {
    if (descargando) return;
    setAviso(null);
    setDescargando(true);
    try {
      const pedida = await api.exportarMisDatos(token, { scope: { domains: [...DOMINIOS_DE_LA_EXPORTACION], period: null } }, intentoDeDescargar.actual());
      intentoDeDescargar.registrar(pedida);
      if (sesionPerdida(pedida)) return;
      if (!pedida.ok) return setAviso({ tipo: 'error', texto: falloDe(pedida).mensaje, de: 'descargar' });
      const estado = await api.exportacionPropia(token, pedida.datos.data.exportId);
      if (sesionPerdida(estado)) return;
      const ruta = estado.ok ? estado.datos.data.download?.path : undefined;
      if (!ruta) return setAviso({ tipo: 'error', texto: estado.ok ? COPY.noDisponible : falloDe(estado).mensaje, de: 'descargar' });
      await Linking.openURL(api.direccionDeDescarga(ruta));
      setAviso({ tipo: 'exito', texto: D.descargar.enElNavegador, de: 'descargar' });
    } catch {
      setAviso({ tipo: 'error', texto: COPY.noDisponible, de: 'descargar' });
    } finally {
      setDescargando(false);
    }
  }

  async function pedir() {
    if (enviando) return;
    setAviso(null);
    setEnviando(true);
    const limpia = nota.trim();
    const r = await api.pedirUnDerecho(token, { type: tipo, scope: limpia ? { note: limpia } : {} }, intentoDePedir.actual());
    intentoDePedir.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setAviso({ tipo: 'error', texto: falloDe(r).mensaje, de: 'pedir' });
    setNota('');
    setAviso({ tipo: 'exito', texto: D.pedir.enviado(enPalabras(r.datos.data.deadline)), de: 'pedir' });
    void leer();
  }

  return (
    <View>
      <Titulo>{D.titulo}</Titulo>
      <Parrafo>{D.queEs}</Parrafo>
      <Seccion titulo={D.descargar.titulo} icono="descargar">
        <Parrafo>{D.descargar.texto}</Parrafo>
        <Boton texto={descargando ? D.descargar.preparando : D.descargar.boton} tipo="secundario" icono="descargar" ocupado={descargando} onPress={() => void descargar()} />
        {aviso?.de === 'descargar' ? <Aviso tipo={aviso.tipo} titulo={aviso.texto} /> : null}
      </Seccion>
      <Seccion titulo={D.pedir.titulo} icono="solicitar">
        <Segmentos
          etiqueta={D.pedir.tipo}
          opciones={OPCIONES_DE_PEDIDO}
          valor={tipo}
          alElegir={(t) => {
            intentoDePedir.descartar();
            setTipo(t);
          }}
        />
        {tipo === 'SUPPRESSION' ? (
          <>
            <Parrafo tenue>{D.pedir.supresionAyuda}</Parrafo>
            <Boton texto={D.pedir.irAlCierre} tipo="enlace" icono="derecha" iconoAlFinal onPress={() => ir({ nombre: 'cuenta', seccion: 'cierre' })} />
          </>
        ) : null}
        <Campo
          etiqueta={D.pedir.nota}
          ayuda={D.pedir.notaAyuda}
          value={nota}
          multiline
          maxLength={LARGO_MAXIMO_DE_LA_NOTA_DEL_PEDIDO}
          onChangeText={(t) => {
            intentoDePedir.descartar();
            setNota(t);
          }}
        />
        <Boton texto={enviando ? D.pedir.enviando : D.pedir.enviar} ocupado={enviando} onPress={() => void pedir()} />
        {aviso?.de === 'pedir' ? <Aviso tipo={aviso.tipo} titulo={aviso.texto} /> : null}
        <Parrafo tenue>{D.plazos}</Parrafo>
      </Seccion>
      <Seccion titulo={D.pedidos.titulo} icono="lista">
        {lecturaFallida ? <ErrorConReintento sinConexion={lecturaFallida.sinConexion} onReintentar={() => void leer()} /> : null}
        {!lecturaFallida && pedidos === null ? <Cargando /> : null}
        {pedidos && pedidos.length === 0 ? <Parrafo tenue>{D.pedidos.vacio}</Parrafo> : null}
        {pedidos?.map((p) => (
          <Tarjeta key={p.requestId}>
            <Dato etiqueta={D.pedir.tipos[p.type]} valor={D.pedidos.estado[p.state]} />
            <Parrafo tenue>{D.pedidos.plazo(enPalabras(p.deadline))}</Parrafo>
            {p.response ? <Dato etiqueta={D.pedidos.respuesta} valor={p.response} apilado /> : null}
          </Tarjeta>
        ))}
      </Seccion>
    </View>
  );
}
