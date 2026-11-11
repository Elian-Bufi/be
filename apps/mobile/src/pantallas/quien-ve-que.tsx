/**
 * APK · «Quién ve qué» (PV-3, decisión de Dirección del 2026-11-07; AV-05 de WP-APP-VUELTA-DE-ROSCA, DL-166), desde Perfil.
 * Es solo de lectura: junta en una vista lo que estaba repartido entre Vínculos, Privacidad y «Mis hábitos». Arriba, el
 * tratamiento de tus datos de salud; después, una tarjeta por profesional con lo que autorizaste, desde cuándo, y si ve
 * tus hábitos. «Qué incluye» va plegado. Para cambiar algo, lleva a la pantalla de siempre.
 *
 * Verifica antes de mostrar, como toda zona (III.1): mientras falte una lectura, la estructura sin valores. La vista la
 * arma `quienVeQue` (`quien-ve-que.ts`), con su prueba.
 */
import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { dia } from '../formato';
import { Icono } from '../icono';
import { useLecturaRecordada } from '../lecturas';
import { useSesionPerdida, type Ir, type Salida } from '../navegacion';
import { habitosParaLeer, quienVeQue } from '../quien-ve-que';
import { TEXTOS_DE_LA_VUELTA as T } from '../textos-de-la-vuelta';
import { Boton, Desplegable, estilosPorTema, Parrafo, Titulo } from '../ui';
import { NoSePudo, Verificando } from './tarjeta-de-inicio';

export function PantallaDeQuienVeQue({ token, salir, ir }: { token: string; salir: (m: Salida) => void; ir: Ir }) {
  const sesionPerdida = useSesionPerdida(salir);
  const a3 = useLecturaRecordada(token, 'quien-ve-que-a3', useCallback(() => api.consultarRequisitoA3(token), [token]), sesionPerdida);
  const vinculos = useLecturaRecordada(token, 'quien-ve-que-vinculos', useCallback(() => api.consultarVinculos(token), [token]), sesionPerdida);
  const consentimientos = useLecturaRecordada(token, 'quien-ve-que-consentimientos', useCallback(() => api.consultarConsentimientos(token), [token]), sesionPerdida);
  const habitos = useLecturaRecordada(token, 'mis-habitos', useCallback(() => api.misHabitos(token), [token]), sesionPerdida);
  const pedidos = useLecturaRecordada(token, 'pedidos-de-acceso', useCallback(() => api.pedidosDeAccesoAMisHabitos(token), [token]), sesionPerdida);

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
          <View style={estilos.tarjeta}>
            <View style={estilos.cabeza}>
              <Icono nombre="candado" tamano={20} tono="acento" />
              <Text style={estilos.titulo} accessibilityRole="header">
                {T.tratamientoDeDatosDeSalud}
              </Text>
            </View>
            <Text style={estilos.texto}>{vista.a3.texto}</Text>
            <Boton texto={T.cambiarEnPrivacidad} tipo="enlace" icono="derecha" iconoAlFinal onPress={() => ir({ nombre: 'privacidad' })} />
          </View>
          {vista.tarjetas.length === 0 ? <Parrafo tenue>{T.ningunVinculo}</Parrafo> : null}
          {vista.tarjetas.map((t) => (
            <View key={t.profesionalId} style={estilos.tarjeta}>
              <Text style={estilos.titulo} accessibilityRole="header">
                {t.nombre}
              </Text>
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
                </View>
              ))}
              {t.habitos ? (
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
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  tarjeta: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 16, padding: 16, marginVertical: 8, backgroundColor: COLOR.superficie },
  cabeza: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  titulo: { fontSize: 18, fontWeight: '800', color: COLOR.texto, flexShrink: 1 },
  rotulo: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: COLOR.tenue, marginTop: 10, textTransform: 'uppercase' },
  area: { borderTopWidth: 1, borderTopColor: COLOR.borde, marginTop: 8, paddingTop: 8 },
  linea: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  texto: { fontSize: 16, lineHeight: 23, color: COLOR.texto, flexShrink: 1 },
  negrita: { fontWeight: '700' },
}));
