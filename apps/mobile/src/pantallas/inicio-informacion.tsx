/**
 * Inicio · «Para responder» (PV-6, AV-04 y AV-06 de WP-APP-VUELTA-DE-ROSCA, DL-166; antes, la tarjeta de Información de
 * DL-117 y la de «Tus hábitos» de DL-165 D-9). Una sola tarjeta con la cuenta y una fila por pedido: los formularios
 * sin responder (API-FRI-02, filtrada a las pendientes) y los pedidos de ver tus hábitos (API-HBT-08); si no hay pedidos,
 * la pregunta por un profesional nuevo (API-HBT-01). Cuenta lo mismo que Perfil: las dos salen de `paraResponder`.
 *
 * - Cada fila dice qué es, quién lo pide y desde cuándo, y lleva adonde se responde: la solicitud o «Mis hábitos».
 * - Una lista parcial no se presenta como el total: con más páginas, la cuenta dice «Más de 3».
 * - Sin nada para responder, la tarjeta no se dibuja (AV-17): no es una tarea, y no hay «0».
 * - Con la lectura confirmada, fija la marca de Perfil (`marca-de-perfil.ts`).
 * - Sin el A3, lo propio no se responde: se dice arriba, con el camino a Privacidad (DL-115).
 * - Desde DL-170 (AV2-07) el grupo es de vidrio, como las tarjetas de Inicio, y los íconos y la cuenta van en `tenue`: no
 *   se tocan. Lo que se toca es cada fila, con su flecha.
 */
import { COPY_FORMULARIOS, COPY_FORMULARIOS_V2, COPY_HABITOS, numero } from '@be/domain';
import { useCallback, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { api } from '../api';
import { SinActualizar } from '../estados';
import { dia as diaDe } from '../formato';
import { Icono } from '../icono';
import { seDibujaParaResponder } from '../inicio-de-hoy';
import { useLecturaRecordada } from '../lecturas';
import { leerPendientes, PENDIENTES_EN_INICIO } from '../lecturas-de-inicio';
import { marcaEnPerfil } from '../marca-de-perfil';
import type { Ir } from '../navegacion';
import { paraResponder, type FilaParaResponder } from '../perfil';
import { TEXTOS_DE_LA_VUELTA as T } from '../textos-de-la-vuelta';
import { estilosPorTema, Rotulo } from '../ui';
import { useSuperficie } from '../vidrio';
import { SinA3, type AlPerderLaSesion } from './tarjeta-de-inicio';

export function Pendientes({ token, sesionPerdida, ir }: { token: string; sesionPerdida: AlPerderLaSesion; ir: Ir }) {
  const pedir = useCallback(() => leerPendientes(api, token), [token]);
  const pendientes = useLecturaRecordada(token, 'inicio-pendientes', pedir, sesionPerdida);
  const habitos = useLecturaRecordada(token, 'mis-habitos', useCallback(() => api.misHabitos(token), [token]), sesionPerdida);
  const { estilo: superficie } = useSuperficie();
  const pedidos = useLecturaRecordada(token, 'pedidos-de-acceso', useCallback(() => api.pedidosDeAccesoAMisHabitos(token), [token]), sesionPerdida);
  // Solo con las tres lecturas confirmadas se afirma qué hay (o que no hay nada).
  const p = pendientes.r?.ok ? pendientes.r.datos : null;
  const filas = p && habitos.r?.ok && pedidos.r?.ok ? paraResponder(p.pendientes, habitos.r.datos.data, pedidos.r.datos.data) : undefined;
  useEffect(() => {
    if (filas) marcaEnPerfil.fijar(filas);
  }, [filas]);
  if (!filas || !p || !seDibujaParaResponder(filas)) return null;
  const cuenta = p.hayMas ? T.masDe(PENDIENTES_EN_INICIO) : numero(filas.length);
  return (
    <View>
      <View style={estilos.cabeza} accessible accessibilityRole="header" accessibilityLabel={`${T.paraResponder}: ${cuenta}`}>
        <Rotulo>{T.paraResponder}</Rotulo>
        <View style={estilos.cuenta}>
          <Text style={estilos.textoDeCuenta}>{cuenta}</Text>
        </View>
      </View>
      {p.sinA3 ? <SinA3 texto={COPY_FORMULARIOS.necesitaA3} ir={ir} /> : null}
      <View style={[estilos.grupo, superficie]}>
        {filas.map((f, i) => (
          <FilaDeInicio key={`${f.tipo}:${f.id}`} fila={f} ir={ir} ultima={i === filas.length - 1} sinA3={p.sinA3} />
        ))}
      </View>
      <SinActualizar visible={pendientes.sinActualizar} onReintentar={() => void pendientes.cargar()} />
    </View>
  );
}

/** Una fila de «Para responder»: qué es, quién lo pide y desde cuándo, y adónde lleva. */
function FilaDeInicio({ fila: f, ir, ultima, sinA3 }: { fila: FilaParaResponder; ir: Ir; ultima: boolean; sinA3: boolean }) {
  let titulo: string;
  let detalle: string;
  let abrir: (() => void) | null;
  if (f.tipo === 'formulario') {
    titulo = f.titulo;
    detalle = `${f.quien} · ${diaDe(f.desde)}${f.paraConfirmar ? ` · ${COPY_FORMULARIOS_V2.apk.paraConfirmar}` : ''}`;
    // Lo que no se puede responder por ahora se dice: la fila no lleva a una acción que no se puede hacer.
    abrir = f.respondable && !sinA3 ? () => ir({ nombre: 'mi-solicitud', id: f.id }) : null;
    if (!f.respondable) detalle = `${detalle} · ${COPY_FORMULARIOS.yaNoSePuedeResponder}`;
  } else if (f.tipo === 'pedido-de-habitos') {
    titulo = COPY_HABITOS.apk.pedidoDe(f.quien, f.area);
    detalle = diaDe(f.desde);
    abrir = () => ir({ nombre: 'mis-habitos' });
  } else {
    titulo = COPY_HABITOS.apk.nuevoPregunta(f.quien);
    detalle = T.misHabitos;
    abrir = () => ir({ nombre: 'mis-habitos' });
  }
  const contenido = (
    <View style={estilos.filaConIcono}>
      <Icono nombre={f.tipo === 'formulario' ? 'informacion' : 'habitos'} tamano={20} tono="tenue" />
      <View style={estilos.textos}>
        <Text style={estilos.titulo}>{titulo}</Text>
        <Text style={estilos.detalle}>{detalle}</Text>
      </View>
      {abrir ? <Icono nombre="derecha" tamano={20} tono="tenue" /> : null}
    </View>
  );
  if (!abrir) {
    return (
      <View style={[estilos.fila, !ultima && estilos.conLinea]} accessible accessibilityLabel={`${titulo}. ${detalle}`}>
        {contenido}
      </View>
    );
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${titulo}. ${detalle}`} onPress={abrir} style={({ pressed }) => [estilos.fila, !ultima && estilos.conLinea, pressed && estilos.presionado]}>
      {contenido}
    </Pressable>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  cabeza: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  cuenta: { minWidth: 26, height: 26, borderRadius: 13, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.superficieElevada },
  textoDeCuenta: { fontSize: 14, fontWeight: '800', color: COLOR.tenue },
  grupo: { borderRadius: 16, borderWidth: 1, borderColor: COLOR.borde, marginVertical: 8, overflow: 'hidden' },
  fila: { minHeight: 56, paddingVertical: 10, paddingHorizontal: 14, justifyContent: 'center' },
  conLinea: { borderBottomWidth: 1, borderBottomColor: COLOR.borde },
  presionado: { opacity: 0.6 },
  filaConIcono: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textos: { flex: 1 },
  titulo: { fontSize: 16, fontWeight: '700', color: COLOR.texto },
  detalle: { fontSize: 14, lineHeight: 20, color: COLOR.tenue },
}));
