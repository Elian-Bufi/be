/**
 * APK · «Quién ve qué» (PV-3, decisión de Dirección del 2026-11-07; AV-05 de WP-APP-VUELTA-DE-ROSCA, DL-166), desde Perfil.
 * Es solo de lectura: junta en una vista lo que estaba repartido entre Vínculos, Privacidad y «Mis hábitos». Arriba, el
 * tratamiento de tus datos de salud; después, una tarjeta por profesional con lo que autorizaste, desde cuándo, y si ve
 * tus hábitos. «Qué incluye» va plegado. Para cambiar algo, lleva a la pantalla de siempre.
 *
 * Verifica antes de mostrar, como toda zona (III.1): mientras falte una lectura, la estructura sin valores. La vista la
 * arma `quienVeQue` (`quien-ve-que.ts`), con su prueba.
 *
 * PG-12 (WP-PULIDO-GRANDES, DL-173): debajo del nombre, una línea tranquila con la última vez que ese profesional miró lo
 * que le compartís, o que todavía no lo miró, cuando se sabe (`quien-miro.ts`, TEST-PG-011). Sale de una lectura aparte:
 * si falla, la línea no se dibuja y lo demás sigue igual.
 *
 * WP-HISTORIA-ANTERIOR (DL-175): debajo de cada área, «Tu historia anterior de …» cuando antes hubo otro profesional en esa
 * área (o ya se decidió algo), con su explicación, el interruptor para compartirla o retirarla y cuándo la miró; debajo de
 * un vínculo terminado con el que la miraron, solo cuándo (`historia-anterior.tsx`, TEST-HA-040 a 046). Sale de su propia
 * lectura (API-HIA-01): si falla, no se dibuja.
 *
 * WP-COMPARTIR (DL-176; Dirección, 2026-11-15): «Quién ve qué» deja de ser solo de lectura. Debajo de cada profesional, lo
 * que ve de tus otras áreas y tus hábitos, cada cosa con un interruptor para retirarla o volver a darla (API-CMP-02 y 03,
 * `compartir.tsx`), y arriba los pedidos de un profesional para responder, con «Sí, compartir» y «Ahora no». Salen de su
 * propia lectura (API-CMP-01, y los pedidos de API-RES-09 y API-HBT-08): si falla, no se dibujan y lo demás sigue igual.
 * Tu área (el B2) y el tratamiento de tus datos de salud (el A3) se siguen cambiando en el vínculo y en Privacidad.
 */
import { useCallback, useState } from 'react';
import type { HistoriaAnteriorDeUnArea } from '@be/domain';
import { Text, View } from 'react-native';
import { api } from '../api';
import { LoQueVeDeOtrasAreas, PedidosParaResponder } from '../compartir';
import { dia, fechaCivilDeUnInstante } from '../formato';
import { HistoriaAnteriorDelArea, useVistasDeLaHistoriaAnterior } from '../historia-anterior';
import { conLoNuevo } from '../historia-anterior-en-el-telefono';
import { Icono } from '../icono';
import { useLecturaRecordada } from '../lecturas';
import { useSesionPerdida, type Ir, type Salida } from '../navegacion';
import { lineaDe, quienMiro } from '../quien-miro';
import { habitosParaLeer, quienVeQue } from '../quien-ve-que';
import { TEXTOS_DE_LA_VUELTA as T } from '../textos-de-la-vuelta';
import { Boton, Desplegable, estilosPorTema, Parrafo, Superficie, Titulo } from '../ui';
import { NoSePudo, Verificando } from './tarjeta-de-inicio';

export function PantallaDeQuienVeQue({ token, salir, ir }: { token: string; salir: (m: Salida) => void; ir: Ir }) {
  const sesionPerdida = useSesionPerdida(salir);
  const a3 = useLecturaRecordada(token, 'quien-ve-que-a3', useCallback(() => api.consultarRequisitoA3(token), [token]), sesionPerdida);
  const vinculos = useLecturaRecordada(token, 'quien-ve-que-vinculos', useCallback(() => api.consultarVinculos(token), [token]), sesionPerdida);
  const consentimientos = useLecturaRecordada(token, 'quien-ve-que-consentimientos', useCallback(() => api.consultarConsentimientos(token), [token]), sesionPerdida);
  const habitos = useLecturaRecordada(token, 'mis-habitos', useCallback(() => api.misHabitos(token), [token]), sesionPerdida);
  const pedidos = useLecturaRecordada(token, 'pedidos-de-acceso', useCallback(() => api.pedidosDeAccesoAMisHabitos(token), [token]), sesionPerdida);
  // PG-12: lo que compartís de otras áreas y quién lo miró. Completa la tarjeta: si falla, la línea no se dibuja.
  const compartido = useLecturaRecordada(token, 'quien-ve-que-compartido', useCallback(() => api.misResumenesCompartidos(token), [token]), sesionPerdida);
  const lineasDeQuienMiro = compartido.r?.ok ? quienMiro(compartido.r.datos.data, fechaCivilDeUnInstante(new Date().toISOString())) : new Map<string, string>();
  // DL-175: la historia anterior de cada área. Lo que responde una escritura se muestra enseguida, sin esperar otra lectura.
  const historia = useLecturaRecordada(token, 'quien-ve-que-historia-anterior', useCallback(() => api.miHistoriaAnterior(token), [token]), sesionPerdida);
  const [cambiadas, setCambiadas] = useState<readonly HistoriaAnteriorDeUnArea[]>([]);
  const deLaHistoria = historia.r?.ok ? cambiadas.reduce(conLoNuevo, historia.r.datos.data) : null;
  const vistasDeLaHistoria = useVistasDeLaHistoriaAnterior(deLaHistoria);
  const alCambiarLaHistoria = (nuevo: HistoriaAnteriorDeUnArea) => setCambiadas((antes) => [...antes.filter((x) => x.relationshipId !== nuevo.relationshipId), nuevo]);
  const actualizarLaHistoria = () => {
    setCambiadas([]);
    void historia.cargar();
  };
  // DL-176: lo que se puede compartir y lo que ya se comparte, y los pedidos de ver un plan. Completan la tarjeta.
  const propuesta = useLecturaRecordada(token, 'quien-ve-que-compartir', useCallback(() => api.loQueSePuedeCompartir(token), [token]), sesionPerdida);
  const pedidosDePlan = useLecturaRecordada(token, 'quien-ve-que-pedidos-de-plan', useCallback(() => api.pedidosDePlan(token), [token]), sesionPerdida);
  const deCompartir = propuesta.r?.ok ? propuesta.r.datos.data : null;
  const actualizarLoCompartido = () => {
    for (const l of [propuesta, pedidosDePlan, pedidos, habitos, compartido]) void l.cargar();
  };

  const lecturas = [a3, vinculos, consentimientos];
  const falla = lecturas.map((l) => l.r).find((r) => r && !r.ok);
  const vista =
    a3.r?.ok && vinculos.r?.ok && consentimientos.r?.ok
      ? quienVeQue(
          {
            a3: a3.r.datos.data,
            vinculos: vinculos.r.datos.data,
            consentimientos: consentimientos.r.datos.data,
            // Los hábitos y los pedidos completan la tarjeta; si fallan, la línea de hábitos no se dibuja.
            habitos: habitos.r?.ok ? habitos.r.datos.data : null,
            pedidos: pedidos.r?.ok ? pedidos.r.datos.data : null,
          },
          dia,
        )
      : null;

  return (
    <View>
      <Titulo>{T.quienVeQue}</Titulo>
      {falla && !falla.ok ? <NoSePudo falla={falla} reintentar={() => lecturas.forEach((l) => void l.cargar())} /> : null}
      {!vista && !falla ? <Verificando /> : null}
      {vista ? (
        <>
          <Superficie style={estilos.tarjeta}>
            <View style={estilos.cabeza}>
              <Icono nombre="candado" tamano={20} tono="acento" />
              <Text style={estilos.titulo} accessibilityRole="header">
                {T.tratamientoDeDatosDeSalud}
              </Text>
            </View>
            <Text style={estilos.texto}>{vista.a3.texto}</Text>
            <Boton texto={T.cambiarEnPrivacidad} tipo="enlace" icono="derecha" iconoAlFinal onPress={() => ir({ nombre: 'privacidad' })} />
          </Superficie>
          {/* DL-176: los pedidos de un profesional, para responder acá mismo. */}
          <PedidosParaResponder
            token={token}
            propuesta={deCompartir}
            deUnPlan={pedidosDePlan.r?.ok ? pedidosDePlan.r.datos.data : []}
            deHabitos={pedidos.r?.ok ? pedidos.r.datos.data : []}
            actualizar={actualizarLoCompartido}
            irAPrivacidad={() => ir({ nombre: 'privacidad' })}
          />
          {vista.tarjetas.length === 0 ? <Parrafo tenue>{T.ningunVinculo}</Parrafo> : null}
          {vista.tarjetas.map((t) => {
            const lineaDeQuienMiro = lineaDe(lineasDeQuienMiro, t.profesionalId);
            return (
              <Superficie key={t.profesionalId} style={estilos.tarjeta}>
                <Text style={estilos.titulo} accessibilityRole="header">
                  {t.nombre}
                </Text>
                {/* PG-12: la última vez que miró lo que le compartís. Solo se lee: quitar un permiso sigue en su lugar. */}
                {lineaDeQuienMiro ? (
                  <View style={[estilos.linea, estilos.quienMiro]} accessible accessibilityLabel={lineaDeQuienMiro}>
                    <Icono nombre="reloj" tamano={18} tono="tenue" />
                    <Text style={[estilos.texto, estilos.tenue]}>{lineaDeQuienMiro}</Text>
                  </View>
                ) : null}
                <Text style={estilos.rotulo}>{T.loQueAutorizaste}</Text>
                {t.areas.map((a) => (
                  <View key={a.vinculoId} style={estilos.area}>
                    <View style={estilos.linea} accessible accessibilityLabel={a.linea}>
                      <Icono nombre={a.ve ? 'ver' : 'oculto'} tamano={18} tono="tenue" />
                      <Text style={estilos.texto}>{a.linea}</Text>
                    </View>
                    <Desplegable titulo={T.queIncluye} variante="enlace">
                      {a.queIncluye.map((q) => (
                        <Parrafo key={q} tenue>
                          {q}
                        </Parrafo>
                      ))}
                    </Desplegable>
                    <Boton texto={T.cambiarEnElVinculo} tipo="enlace" icono="derecha" iconoAlFinal onPress={() => ir({ nombre: 'vinculo', id: a.vinculoId })} />
                    {/* DL-175: «Tu historia anterior de …», debajo del profesional de esta área. */}
                    {deLaHistoria && vistasDeLaHistoria.get(a.vinculoId) ? (
                      <HistoriaAnteriorDelArea
                        token={token}
                        item={deLaHistoria.items.find((i) => i.relationshipId === a.vinculoId)!}
                        vista={vistasDeLaHistoria.get(a.vinculoId)!}
                        texto={deLaHistoria.text}
                        alCambiar={alCambiarLaHistoria}
                        actualizar={actualizarLaHistoria}
                        irAPrivacidad={() => ir({ nombre: 'privacidad' })}
                      />
                    ) : null}
                  </View>
                ))}
                {/* DL-176: lo que ve de tus otras áreas y tus hábitos, con un interruptor por cosa. */}
                {deCompartir ? <LoQueVeDeOtrasAreas token={token} propuesta={deCompartir} profesionalId={t.profesionalId} nombre={t.nombre} actualizar={actualizarLoCompartido} /> : null}
                {/* Sin la lectura de lo que se comparte, la línea de siempre, con el camino a «Mis hábitos». */}
                {t.habitos && !deCompartir ? (
                  <View style={estilos.area}>
                    <View style={estilos.linea} accessible accessibilityLabel={habitosParaLeer(t.habitos)}>
                      <Icono nombre="habitos" tamano={18} tono="tenue" />
                      <Text style={estilos.texto}>
                        <Text style={estilos.negrita}>{T.tusHabitos}: </Text>
                        {t.habitos}
                      </Text>
                    </View>
                    <Boton texto={T.cambiarEnMisHabitos} tipo="enlace" icono="derecha" iconoAlFinal onPress={() => ir({ nombre: 'mis-habitos' })} />
                  </View>
                ) : null}
              </Superficie>
            );
          })}
        </>
      ) : null}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  tarjeta: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 16, padding: 16, marginVertical: 8 },
  cabeza: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  titulo: { fontSize: 18, fontWeight: '800', color: COLOR.texto, flexShrink: 1 },
  rotulo: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: COLOR.tenue, marginTop: 10, textTransform: 'uppercase' },
  area: { borderTopWidth: 1, borderTopColor: COLOR.borde, marginTop: 8, paddingTop: 8 },
  linea: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  texto: { fontSize: 16, lineHeight: 23, color: COLOR.texto, flexShrink: 1 },
  // PG-12: tenue y sin color de estado; el tono es el del texto secundario, que mide la prueba de contraste.
  quienMiro: { marginTop: 4 },
  tenue: { color: COLOR.tenue },
  negrita: { fontWeight: '700' },
}));
