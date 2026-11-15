/**
 * APK · WP-COMPARTIR (DL-176): las piezas que dibujan lo que se comparte. Las decisiones están en
 * `compartir-en-el-telefono.ts`, con su prueba (TEST-CMP-040 a 047).
 * - `LoQueSeComparte`: la lista de la pantalla única. Al entrar, cada cosa marcada en una línea (qué, de quién, para quién
 *   y para qué); con «Elegir qué compartir», una fila con interruptor por cosa.
 * - `TextosCompletos`: los textos de lo marcado, cada uno plegado con su versión y su huella, y el aviso de las propuestas.
 * - `CompartirConTusProfesionales`: la tarjeta única de Inicio, para quien ya tiene vínculos, una sola vez.
 * - `LoQueVeDeOtrasAreas`: en «Quién ve qué», debajo de cada profesional, un interruptor por cada cosa que se le puede
 *   compartir; prenderlo muestra el texto entero antes de compartir, y apagarlo pide confirmación.
 * - `PedidosParaResponder`: en «Quién ve qué», los pedidos de un profesional, con «Sí, compartir» y «Ahora no».
 *
 * Accesibilidad: cada interruptor es una fila tocable con rol de interruptor; su etiqueta dice qué es y si se comparte (el
 * estado no queda solo en la sugerencia), y el `Switch` de adentro no se recorre. La letra respeta la escala del teléfono
 * y los colores salen del tema (Claro y Azul noche), sin colores que juzguen.
 */
import { COPY_COMPARTIR as C, type Resultado } from '@be/domain';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import {
  alternar,
  crearMarcaDeLaTarjeta,
  etiquetaConDetalle,
  etiquetaDelInterruptor,
  hayPropuestas,
  interruptoresDe,
  lineaDe,
  pedidoDeUnaCosa,
  pedidosParaResponder,
  rechazoDelToque,
  seMuestraLaTarjeta,
  sePuedeMarcar,
  sugerenciaDelInterruptor,
  type Cosa,
  type Interruptor,
  type Propuesta,
  type RechazoDelToque,
  type TextoDeLaPropuesta,
} from './compartir-en-el-telefono';
import { DialogoDeConfirmacion } from './dialogo';
import { dia } from './formato';
import { Icono } from './icono';
import { falloDe, useClaveDeIntento } from './intento';
import { useLecturaRecordada } from './lecturas';
import type { Ir } from './navegacion';
import { TextoDesplegable } from './texto-versionado';
import { Aviso, Boton, COLOR, Desplegable, estilosPorTema, Parrafo, Superficie } from './ui';

/** La marca de la tarjeta única, una vez por cuenta en este teléfono. */
export const marcaDeLaTarjeta = crearMarcaDeLaTarjeta(AsyncStorage);

/**
 * Una fila con interruptor: rol de interruptor, el estado en la etiqueta, y el `Switch` de adentro sin recorrer. El detalle
 * (por qué no se puede prender, por ejemplo) también va en la etiqueta: TalkBack no lee el texto de adentro por separado.
 */
function FilaConInterruptor({ rotulo, detalle, prendido, deshabilitado, ocupado, etiqueta, sugerencia, onPress }: { rotulo: string; detalle?: string | null; prendido: boolean; deshabilitado: boolean; ocupado?: boolean; etiqueta: string; sugerencia: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={etiquetaConDetalle(etiqueta, detalle)}
      accessibilityHint={sugerencia}
      accessibilityState={{ checked: prendido, disabled: deshabilitado, busy: ocupado === true }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [estilos.fila, pressed && estilos.presionada]}
    >
      <View style={estilos.textosDeLaFila}>
        <Text style={[estilos.texto, deshabilitado && estilos.tenue]}>{rotulo}</Text>
        {detalle ? <Text style={[estilos.texto, estilos.tenue]}>{detalle}</Text> : null}
      </View>
      <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none">
        <Switch value={prendido} disabled={deshabilitado} trackColor={{ false: COLOR.borde, true: COLOR.acento }} />
      </View>
    </Pressable>
  );
}

/** Una línea de lo que se comparte, con su punto (sin tilde: una tilde se leería como «aprobado»). */
function Linea({ texto }: { texto: string }) {
  return (
    <View style={estilos.linea} accessible accessibilityLabel={texto}>
      <View style={estilos.punto} />
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}

/**
 * La lista de la pantalla única. Sin `eligiendo`, lo marcado, en líneas; con `eligiendo`, todo lo que se ofrece, con su
 * interruptor (lo que pide el A3, apagado y explicado mientras el A3 no esté).
 */
export function LoQueSeComparte({ propuesta, marcadas, eligiendo, alCambiar, deshabilitado }: { propuesta: Propuesta; marcadas: ReadonlySet<string>; eligiendo: boolean; alCambiar: (nuevas: Set<string>) => void; deshabilitado: boolean }) {
  const ofrecidas = propuesta.items.filter((i) => i.offered);
  if (!eligiendo) {
    const lineas = ofrecidas.filter((i) => marcadas.has(i.key));
    return <View style={estilos.lista}>{lineas.length === 0 ? <Parrafo tenue>{C.nadaElegido}</Parrafo> : lineas.map((i) => <Linea key={i.key} texto={lineaDe(i)} />)}</View>;
  }
  return (
    <View style={estilos.lista}>
      {ofrecidas.map((i) => {
        const marcada = marcadas.has(i.key);
        const puede = marcada || sePuedeMarcar(propuesta.items, marcadas, i.key);
        const linea = lineaDe(i);
        return (
          <FilaConInterruptor
            key={i.key}
            rotulo={linea}
            detalle={puede ? null : C.pideElA3}
            prendido={marcada}
            deshabilitado={deshabilitado || !puede}
            etiqueta={C.interruptorParaLeer(linea, marcada)}
            sugerencia={C.sugerenciaDelInterruptor(marcada)}
            onPress={() => alCambiar(alternar(propuesta.items, marcadas, i.key))}
          />
        );
      })}
    </View>
  );
}

/** Lo que ya se comparte (dado y completo), en líneas tenues. */
export function LoQueYaSeComparte({ cosas }: { cosas: readonly Cosa[] }) {
  if (cosas.length === 0) return null;
  return (
    <Desplegable titulo={C.yaLoCompartis} variante="enlace">
      {cosas.map((i) => (
        <Parrafo key={i.key} tenue>
          {lineaDe(i)}
        </Parrafo>
      ))}
    </Desplegable>
  );
}

/** Los textos que se aceptan, cada uno plegado con su versión y su huella; el aviso si alguno es una propuesta. */
export function TextosCompletos({ textos }: { textos: readonly TextoDeLaPropuesta[] }) {
  if (textos.length === 0) return null;
  return (
    <View style={estilos.textos}>
      <Text style={estilos.rotulo}>{C.losTextos}</Text>
      {textos.map((t) => (
        <TextoDesplegable key={t.id} version={{ id: t.id, text: t.text, textHash: t.textHash, effectiveFrom: t.effectiveFrom }} textoDelBoton={t.title} />
      ))}
      {hayPropuestas(textos) ? <Parrafo tenue>{C.propuestos}</Parrafo> : null}
    </View>
  );
}

/** Lo que sigue a un rechazo: «Actualizar» si algo cambió, «Ir a Privacidad» si falta el A3. */
export function SalidasDelRechazo({ rechazo, actualizar, irAPrivacidad }: { rechazo: RechazoDelToque; actualizar: () => void; irAPrivacidad?: () => void }) {
  return (
    <Aviso tipo="error" titulo={rechazo.mensaje}>
      {rechazo.actualizar ? <Boton texto={C.actualizar} tipo="secundario" onPress={actualizar} /> : null}
      {rechazo.privacidad && irAPrivacidad ? <Boton texto="Ir a Privacidad" tipo="secundario" icono="derecha" iconoAlFinal onPress={irAPrivacidad} /> : null}
    </Aviso>
  );
}

// ─── La tarjeta única de Inicio ─────────────────────────────────────────────────────────────────────────────────────

/**
 * Para quien ya tiene vínculos: una tarjeta, una sola vez, que ofrece lo mismo que la pantalla al aceptar. Lee API-CMP-01
 * aparte: si falla, no se dibuja. Cualquiera de los dos botones la da por vista en este teléfono. Ya vista (o mientras no
 * se sabe), no lee nada: Inicio no pide API-CMP-01 de más.
 */
export function CompartirConTusProfesionales({ token, identidadId, sesionPerdida, ir }: { token: string; identidadId: string; sesionPerdida: (r: Resultado<unknown>) => boolean; ir: Ir }) {
  const vista = useSyncExternalStore(marcaDeLaTarjeta.suscribir, () => marcaDeLaTarjeta.vista(identidadId));
  useEffect(() => {
    void marcaDeLaTarjeta.leer(identidadId);
  }, [identidadId]);
  if (vista !== false) return null;
  return <TarjetaParaCompartirTodo token={token} identidadId={identidadId} sesionPerdida={sesionPerdida} ir={ir} />;
}

function TarjetaParaCompartirTodo({ token, identidadId, sesionPerdida, ir }: { token: string; identidadId: string; sesionPerdida: (r: Resultado<unknown>) => boolean; ir: Ir }) {
  const lectura = useLecturaRecordada(token, 'compartir-todo', useCallback(() => api.loQueSePuedeCompartir(token), [token]), sesionPerdida);
  const vista = useSyncExternalStore(marcaDeLaTarjeta.suscribir, () => marcaDeLaTarjeta.vista(identidadId));
  const propuesta = lectura.r?.ok ? lectura.r.datos.data : null;
  if (!seMuestraLaTarjeta(propuesta, vista)) return null;
  return (
    <Superficie style={estilos.tarjeta}>
      <View style={estilos.cabeza}>
        <Icono nombre="asesorados" tamano={20} tono="acento" />
        <Text style={estilos.titulo} accessibilityRole="header">
          {C.tarjeta.titulo}
        </Text>
      </View>
      <Text style={estilos.texto}>{C.tarjeta.cuerpo}</Text>
      <Text style={[estilos.texto, estilos.tenue]}>{C.nuncaSeComparte}</Text>
      <Boton
        texto={C.tarjeta.compartirTodo}
        onPress={() => {
          void marcaDeLaTarjeta.marcar(identidadId);
          ir({ nombre: 'compartir-todo' });
        }}
      />
      <Boton texto={C.tarjeta.ahoraNo} tipo="secundario" onPress={() => void marcaDeLaTarjeta.marcar(identidadId)} />
    </Superficie>
  );
}

// ─── «Quién ve qué» ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Dar una cosa (con su texto a la vista) o retirarla (con confirmación), con la clave del intento. */
function useCambio(token: string, alCambiar: () => void) {
  const intento = useClaveDeIntento();
  const [enviando, setEnviando] = useState(false);
  const [rechazo, setRechazo] = useState<RechazoDelToque | null>(null);
  const [fallo, setFallo] = useState<ReturnType<typeof falloDe> | null>(null);
  const terminar = (r: Resultado<unknown>): boolean => {
    intento.registrar(r);
    setEnviando(false);
    if (r.ok) {
      alCambiar();
      return true;
    }
    setRechazo(rechazoDelToque(r));
    setFallo(falloDe(r));
    return false;
  };
  const empezar = () => {
    setEnviando(true);
    setRechazo(null);
    setFallo(null);
  };
  return {
    enviando,
    rechazo,
    fallo,
    async dar(p: Propuesta, cosa: Cosa): Promise<boolean> {
      empezar();
      return terminar(await api.compartirLoElegido(token, pedidoDeUnaCosa(p, cosa), intento.actual()));
    },
    async retirar(cosa: Cosa): Promise<boolean> {
      empezar();
      return terminar(await api.dejarDeCompartirUnaCosa(token, { key: cosa.key }, intento.actual()));
    },
    limpiar() {
      intento.descartar();
      setRechazo(null);
      setFallo(null);
    },
  };
}

/** El texto entero de una cosa, para leerlo antes de compartirla (lo que se acepta no se pliega, 08 §12.2). */
function TextoEntero({ texto }: { texto: TextoDeLaPropuesta | undefined }) {
  if (!texto) return null;
  const [titulo, ...parrafos] = texto.text.split('\n\n');
  return (
    <Superficie style={estilos.textoDelActo}>
      <Text style={[estilos.texto, estilos.negrita]} accessibilityRole="header">
        {titulo}
      </Text>
      {parrafos.map((p, i) => (
        <Text key={i} style={estilos.texto}>
          {p}
        </Text>
      ))}
      {texto.approval === 'PENDING_APPROVAL' ? <Text style={[estilos.texto, estilos.tenue]}>{C.propuestos}</Text> : null}
    </Superficie>
  );
}

/**
 * Debajo de un profesional, en «Quién ve qué»: lo que ve de tus otras áreas y tus hábitos, cada cosa con su interruptor.
 * Prenderlo abre el texto entero, con «Sí, compartir» (API-CMP-02, solo esa cosa); apagarlo pide confirmación (API-CMP-03).
 * `actualizar` vuelve a leer la propuesta después de cada cambio.
 */
export function LoQueVeDeOtrasAreas({ token, propuesta, profesionalId, nombre, actualizar }: { token: string; propuesta: Propuesta; profesionalId: string; nombre: string; actualizar: () => void }) {
  const interruptores = interruptoresDe(propuesta, profesionalId, dia);
  const cambio = useCambio(token, actualizar);
  const [abierto, setAbierto] = useState<{ readonly que: 'dar' | 'retirar'; readonly i: Interruptor } | null>(null);
  if (interruptores.length === 0) return null;
  const cerrar = () => {
    cambio.limpiar();
    setAbierto(null);
  };
  return (
    <View style={estilos.bloque}>
      <Text style={estilos.rotulo}>{C.queVeDeOtrasAreas}</Text>
      {interruptores.map((i) => (
        <FilaConInterruptor
          key={i.cosa.key}
          rotulo={i.rotulo}
          detalle={i.porQueNo ?? i.estado}
          prendido={i.prendido}
          deshabilitado={!i.habilitado || cambio.enviando}
          ocupado={cambio.enviando && abierto?.i.cosa.key === i.cosa.key}
          etiqueta={etiquetaDelInterruptor(i, nombre)}
          sugerencia={sugerenciaDelInterruptor(i)}
          onPress={() => {
            cambio.limpiar();
            setAbierto({ que: i.prendido ? 'retirar' : 'dar', i });
          }}
        />
      ))}
      <DialogoDeConfirmacion
        visible={abierto?.que === 'dar'}
        titulo={C.confirmarDar.titulo}
        textoConfirmar={C.confirmarDar.confirmar}
        textoEnviando={C.compartiendo}
        enviando={cambio.enviando}
        fallo={abierto?.que === 'dar' ? cambio.fallo : null}
        onVolver={cerrar}
        onConfirmar={() => {
          if (abierto) void cambio.dar(propuesta, abierto.i.cosa).then((ok) => ok && setAbierto(null));
        }}
        onActualizar={() => {
          cerrar();
          actualizar();
        }}
      >
        {abierto ? <Parrafo>{lineaDe(abierto.i.cosa)}</Parrafo> : null}
        <Parrafo tenue>{C.confirmarDar.leeAntes}</Parrafo>
        <TextoEntero texto={propuesta.texts.find((t) => t.id === abierto?.i.cosa.textId)} />
        {cambio.rechazo?.privacidad ? <Parrafo>{C.pideElA3}</Parrafo> : null}
      </DialogoDeConfirmacion>
      <DialogoDeConfirmacion
        visible={abierto?.que === 'retirar'}
        titulo={C.confirmarRetiro.titulo}
        textoConfirmar={C.confirmarRetiro.confirmar}
        textoEnviando={C.retirando}
        enviando={cambio.enviando}
        fallo={abierto?.que === 'retirar' ? cambio.fallo : null}
        onVolver={cerrar}
        onConfirmar={() => {
          if (abierto) void cambio.retirar(abierto.i.cosa).then((ok) => ok && setAbierto(null));
        }}
        onActualizar={() => {
          cerrar();
          actualizar();
        }}
      >
        <Parrafo>{abierto ? C.confirmarRetiro.cuerpo(enMinuscula(abierto.i.rotulo), nombre) : ''}</Parrafo>
      </DialogoDeConfirmacion>
    </View>
  );
}

/**
 * Los pedidos de un profesional para ver un plan o tus hábitos, con dos respuestas del mismo peso. «Sí, compartir» da esa
 * cosa (API-CMP-02, que además acepta el pedido); «Ahora no» lo responde sin compartir nada (API-RES-10 o API-HBT-09).
 */
export function PedidosParaResponder({ token, propuesta, deUnPlan, deHabitos, actualizar, irAPrivacidad }: { token: string; propuesta: Propuesta | null; deUnPlan: Parameters<typeof pedidosParaResponder>[1]; deHabitos: Parameters<typeof pedidosParaResponder>[2]; actualizar: () => void; irAPrivacidad: () => void }) {
  const pedidos = pedidosParaResponder(propuesta, deUnPlan, deHabitos);
  const intento = useClaveDeIntento();
  const [enCurso, setEnCurso] = useState<string | null>(null);
  const [rechazo, setRechazo] = useState<RechazoDelToque | null>(null);
  const [hecho, setHecho] = useState(false);
  if (pedidos.length === 0) return hecho ? <Aviso tipo="exito" titulo={C.pedidos.respondido} /> : null;
  async function responder(p: (typeof pedidos)[number], si: boolean) {
    if (enCurso) return;
    setEnCurso(p.id);
    setRechazo(null);
    const clave = intento.actual();
    let r: Resultado<unknown>;
    if (si && p.cosa && propuesta) r = await api.compartirLoElegido(token, pedidoDeUnaCosa(propuesta, p.cosa), clave);
    else if (p.tipo === 'PLAN') r = await api.responderPedidoDePlan(token, p.id, { expectedVersion: p.version, answer: 'NOT_NOW', sharing: null }, clave);
    else r = await api.responderPedidoDeAcceso(token, p.id, { expectedVersion: p.version, answer: 'NOT_NOW', sharing: null }, clave);
    intento.registrar(r);
    setEnCurso(null);
    if (r.ok) {
      setHecho(true);
      actualizar();
      return;
    }
    setRechazo(rechazoDelToque(r));
  }
  return (
    <Superficie style={estilos.tarjeta}>
      <View style={estilos.cabeza}>
        <Icono nombre="solicitud" tamano={20} tono="acento" />
        <Text style={estilos.titulo} accessibilityRole="header">
          {C.pedidos.titulo}
        </Text>
      </View>
      {pedidos.map((p) => (
        <View key={p.id} style={estilos.bloque}>
          <Text style={estilos.texto}>{p.texto}</Text>
          {p.cosa ? <TextosCompletos textos={propuesta?.texts.filter((t) => t.id === p.cosa?.textId) ?? []} /> : null}
          {p.porQueNo ? <Parrafo tenue>{p.porQueNo}</Parrafo> : null}
          {/* Las dos respuestas, del mismo peso: ninguna es la «correcta». */}
          <Boton texto={enCurso === p.id ? C.compartiendo : C.pedidos.si} tipo="secundario" ocupado={enCurso === p.id} deshabilitado={enCurso !== null || !p.cosa} onPress={() => void responder(p, true)} />
          <Boton texto={C.pedidos.ahoraNo} tipo="secundario" deshabilitado={enCurso !== null} onPress={() => void responder(p, false)} />
        </View>
      ))}
      {rechazo ? <SalidasDelRechazo rechazo={rechazo} actualizar={actualizar} irAPrivacidad={irAPrivacidad} /> : null}
    </Superficie>
  );
}

/** «El resumen de Nutrición» → «el resumen de Nutrición»: solo la primera letra, para seguir una frase. */
const enMinuscula = (t: string): string => t.charAt(0).toLowerCase() + t.slice(1);

const estilos = estilosPorTema((COLOR) => ({
  lista: { gap: 6, marginVertical: 6 },
  linea: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  punto: { width: 6, height: 6, borderRadius: 3, marginTop: 9, backgroundColor: COLOR.acento },
  bloque: { borderTopWidth: 1, borderTopColor: COLOR.borde, marginTop: 8, paddingTop: 8, gap: 6 },
  tarjeta: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 16, padding: 16, marginVertical: 8, gap: 8 },
  cabeza: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { fontSize: 17, fontWeight: '800', color: COLOR.texto, flexShrink: 1 },
  texto: { fontSize: 16, lineHeight: 23, color: COLOR.texto, flexShrink: 1 },
  negrita: { fontWeight: '700' },
  tenue: { color: COLOR.tenue },
  rotulo: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: COLOR.tenue, marginTop: 6, textTransform: 'uppercase' },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 48, paddingVertical: 6 },
  presionada: { opacity: 0.7 },
  textosDeLaFila: { flexShrink: 1, gap: 2 },
  textos: { gap: 4, marginVertical: 6 },
  textoDelActo: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 12, padding: 12, gap: 4 },
}));
