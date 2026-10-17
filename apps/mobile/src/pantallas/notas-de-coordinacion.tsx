/**
 * APK · Notas entre tus profesionales (WP-NOTAS-DE-COORDINACION; DEUDA_LEGAJO DL-140; CRD-D2): lo que tus profesionales se
 * escriben entre ellos sobre vos para coordinar, todas las notas y completas. En BE no hay notas secretas sobre el titular
 * (08 §9.15; 08:495).
 * - **Cada nota con su autor, desde qué área, para qué, a quién fue y cuándo,** con el texto tal como se escribió y lo que
 *   cita (por su rótulo).
 * - **Las correcciones se ven enlazadas:** una nota no se edita ni se borra; la que la corrige la cita (CRD-D7).
 * - **Con el vínculo en pausa o terminado, siguen acá:** son tu historia (08 §14.3). Sin el A3 vigente, la API no las da
 *   (403), como «Tu historial» y «Tus revisiones» (08:406).
 * Se abre desde Cuenta y desde Vínculos. Sin juicios ni puntajes, como el resto del copy (las listas de términos
 * prohibidos la revisan).
 */
import { COPY_NOTAS_DE_COORDINACION as T, ETIQUETA_DE_FINALIDAD_DE_NOTA, nombresEnUnaFrase, type NotaDeCoordinacion, type Resultado } from '@be/domain';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { EstadoDeCarga, VerMas } from '../estados';
import { dia, fecha } from '../formato';
import { useListaPaginada } from '../lista';
import { useSesionPerdida, type Salida } from '../navegacion';
import { Aviso, Parrafo, Titulo, estilosPorTema } from '../ui';

/** El A3 revocado: la API responde 403 ACTION_FORBIDDEN y se dice por qué, sin mostrar nada. */
const sinA3 = (r: Resultado<unknown>): boolean => !r.ok && r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN';

export function PantallaDeNotasDeCoordinacion({ token, salir }: { token: string; salir: (m: Salida) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const [bloqueada, setBloqueada] = useState(false);
  const pedir = useCallback(
    async (cursor?: string) => {
      const r = await api.misNotasDeCoordinacion(token, { cursor });
      setBloqueada(sinA3(r));
      return r;
    },
    [token],
  );
  const lista = useListaPaginada(pedir, sesionPerdida);
  const notas = lista.estado.tipo === 'listo' ? lista.estado.items : [];

  return (
    <>
      <Titulo>{T.tituloPropias}</Titulo>
      <Parrafo tenue>{T.explicacionPropias}</Parrafo>
      {bloqueada ? <Aviso tipo="info" titulo={T.sinA3} /> : <EstadoDeCarga estado={lista.estado} onReintentar={lista.recargar} />}
      {lista.estado.tipo === 'listo' && notas.length === 0 ? <Parrafo>{T.vacioPropias}</Parrafo> : null}
      {notas.map((n) => (
        <TarjetaDeNota key={n.noteId} nota={n} />
      ))}
      <VerMas estado={lista.estado} onVerMas={lista.verMas} />
    </>
  );
}

function TarjetaDeNota({ nota: n }: { nota: NotaDeCoordinacion }) {
  const nombres = nombresEnUnaFrase(n.recipients.people.map((p) => p.displayName));
  const para = n.recipients.mode === 'ONE' ? T.paraTusProfesionales(nombres) : T.paraTodosTusProfesionales(nombres);
  return (
    <View
      style={estilos.tarjeta}
      accessible
      accessibilityLabel={`${n.author.displayName}, desde ${n.originScope.label}. ${ETIQUETA_DE_FINALIDAD_DE_NOTA[n.purpose]}. ${para}. ${fecha(n.recordedAt)}.`}
    >
      <Text style={estilos.autor}>
        {n.author.displayName} · {n.originScope.label}
      </Text>
      <Text style={estilos.finalidad}>«{ETIQUETA_DE_FINALIDAD_DE_NOTA[n.purpose]}»</Text>
      <Text style={estilos.tenue}>{para}</Text>
      <Text style={estilos.tenue}>{fecha(n.recordedAt)}</Text>
      <Text style={estilos.texto}>{n.text}</Text>
      {n.references.map((r) => (
        <Text key={`${r.type}|${r.id}`} style={estilos.tenue}>
          Cita: {r.label}
        </Text>
      ))}
      {n.corrects ? <Text style={estilos.tenue}>{T.corrige(dia(n.corrects.recordedAt))}</Text> : null}
      {n.correctedBy.map((c) => (
        <Text key={c.noteId} style={estilos.enlazada}>
          {T.laCorrige(dia(c.recordedAt))}
        </Text>
      ))}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  tarjeta: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 12, padding: 14, marginBottom: 10, backgroundColor: COLOR.superficie },
  autor: { fontSize: 16, fontWeight: '700', color: COLOR.texto },
  finalidad: { fontSize: 15, color: COLOR.texto, marginTop: 4 },
  texto: { fontSize: 15, lineHeight: 22, color: COLOR.texto, marginTop: 8, marginBottom: 4 },
  tenue: { fontSize: 13, color: COLOR.tenue, marginTop: 4 },
  enlazada: { fontSize: 13, fontWeight: '700', color: COLOR.texto, marginTop: 4 },
}));
