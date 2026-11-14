/**
 * PG-15 (WP-PULIDO-GRANDES; DL-173, PG-D10) · «¿Algo para contarle a tu profe?», en la pantalla de la sesión ya
 * registrada: la que abre «Finalizar», con «Sesión registrada» arriba, y la de cada sesión de «Tu historial».
 * - **Un renglón opcional:** tres frases a un toque y un campo corto. Sin escribir nada, la sesión queda igual que hoy.
 * - **Se manda aparte** (API-TRN-25), con su clave de idempotencia: si no hay respuesta, «Reintentar» usa la misma y el
 *   servidor no la duplica. «Le contaste a tu profe» aparece solo con la respuesta del servidor.
 * - **No se edita:** lo enviado queda arriba, con su hora (API-TRN-25-PROPIA), y «Contarle algo más» suma otra debajo.
 * - Si la lectura de lo enviado falla, se dice, y se puede escribir igual.
 * Las reglas (el texto con las frases, el tope, qué pasa con cada respuesta) están en `nota-para-tu-profe.ts`, con su prueba.
 */
import type { NotaDeLaSesion, Resultado } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { api } from '../api';
import { hora } from '../formato';
import { useClaveDeIntento } from '../intento';
import { alternarFrase, caracteresQueQuedan, FRASES_PARA_TU_PROFE, sePuedeMandar, TEXTO_DEL_MOTIVO, TEXTOS_DE_LA_NOTA as T, textoDeLaNota, trasMandar, type MotivoDeNoEnvio } from '../nota-para-tu-profe';
import { Aviso, Boton, Campo, estilosPorTema, Parrafo, Seccion, Subtitulo } from '../ui';

type Envio = { readonly tipo: 'escribiendo' } | { readonly tipo: 'mandando' } | { readonly tipo: 'no-se-mando'; readonly motivo: MotivoDeNoEnvio; readonly reintentable: boolean };

export function NotaParaTuProfe({ token, executionId, sesionPerdida }: { token: string; executionId: string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const [enviadas, setEnviadas] = useState<readonly NotaDeLaSesion[]>([]);
  const [lecturaFallo, setLecturaFallo] = useState(false);
  const [frases, setFrases] = useState<readonly string[]>([]);
  const [escrito, setEscrito] = useState('');
  const [envio, setEnvio] = useState<Envio>({ tipo: 'escribiendo' });
  const [otraMas, setOtraMas] = useState(false);
  const intento = useClaveDeIntento();

  const leer = useCallback(async () => {
    setLecturaFallo(false);
    const r = await api.notasDeMiSesion(token, executionId);
    if (sesionPerdida(r)) return;
    if (r.ok) setEnviadas(r.datos.data);
    else setLecturaFallo(true);
  }, [token, executionId, sesionPerdida]);
  useEffect(() => {
    void leer();
  }, [leer]);

  const texto = textoDeLaNota(frases, escrito);
  // Cambiar lo escrito después de un envío sin respuesta es otro pedido: otra clave (con la misma, la API lo rechazaría).
  const cambiar = (nuevo: { frases?: readonly string[]; escrito?: string }) => {
    if (envio.tipo === 'no-se-mando') {
      intento.descartar();
      setEnvio({ tipo: 'escribiendo' });
    }
    if (nuevo.frases) setFrases(nuevo.frases);
    if (nuevo.escrito !== undefined) setEscrito(nuevo.escrito);
  };

  async function mandar() {
    if (!sePuedeMandar(texto) || envio.tipo === 'mandando') return;
    setEnvio({ tipo: 'mandando' });
    const r = await api.agregarNotaDeLaSesion(token, executionId, { text: texto }, intento.actual());
    intento.registrar(r);
    if (sesionPerdida(r)) return;
    const despues = trasMandar(r);
    if (despues.tipo === 'no-se-mando' || !r.ok) {
      setEnvio(despues.tipo === 'no-se-mando' ? despues : { tipo: 'escribiendo' });
      return;
    }
    const nueva = r.datos.data;
    setEnviadas((anteriores) => [...anteriores.filter((n) => n.noteId !== nueva.noteId), nueva]);
    setFrases([]);
    setEscrito('');
    setOtraMas(false);
    setEnvio({ tipo: 'escribiendo' });
    AccessibilityInfo.announceForAccessibility(T.enviada);
  }

  const componiendo = enviadas.length === 0 || otraMas;
  const quedan = caracteresQueQuedan(texto);
  return (
    <Seccion titulo={T.pregunta} icono="texto">
      {enviadas.length > 0 ? (
        <View style={estilos.enviadas}>
          <Subtitulo>{T.leContaste}</Subtitulo>
          {enviadas.map((n) => (
            <Parrafo key={n.noteId}>
              «{n.text}» · {hora(n.recordedAt)}
            </Parrafo>
          ))}
        </View>
      ) : null}
      {lecturaFallo ? (
        <View style={estilos.enviadas}>
          <Parrafo tenue>{T.noSePudoLeer}</Parrafo>
          <Boton texto={T.reintentar} tipo="enlace" onPress={() => void leer()} />
        </View>
      ) : null}
      {componiendo ? (
        <View style={estilos.componer}>
          <Parrafo tenue>{T.opcional}</Parrafo>
          <View style={estilos.frases} accessibilityLabel={T.frases}>
            {FRASES_PARA_TU_PROFE.map((f) => (
              <Boton key={f} texto={f} tipo="secundario" seleccionado={frases.includes(f)} onPress={() => cambiar({ frases: alternarFrase(frases, f) })} />
            ))}
          </View>
          <Campo
            etiqueta={T.escribir}
            ayuda={T.quedan(quedan)}
            value={escrito}
            onChangeText={(v) => cambiar({ escrito: v })}
            multiline
            maxLength={280}
            error={quedan < 0 ? T.quedan(quedan) : null}
          />
          {envio.tipo === 'no-se-mando' ? (
            <Aviso tipo="error" titulo={T.noSeMando}>
              <Parrafo>{TEXTO_DEL_MOTIVO[envio.motivo]}</Parrafo>
            </Aviso>
          ) : null}
          {envio.tipo === 'no-se-mando' && !envio.reintentable ? null : (
            <Boton
              texto={envio.tipo === 'mandando' ? T.mandando : envio.tipo === 'no-se-mando' ? T.reintentar : T.mandar}
              onPress={() => void mandar()}
              ocupado={envio.tipo === 'mandando'}
              deshabilitado={!sePuedeMandar(texto)}
            />
          )}
        </View>
      ) : (
        <Boton texto={T.otraMas} tipo="enlace" icono="mas" onPress={() => setOtraMas(true)} />
      )}
    </Seccion>
  );
}

const estilos = estilosPorTema(() => ({
  enviadas: { gap: 4, marginBottom: 8 },
  componer: { gap: 8 },
  frases: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
}));
