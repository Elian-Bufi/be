/**
 * APK · Perfil (PV-1, decisión de Dirección del 2026-11-07; AV-03, AV-04 y AV-17 de WP-APP-VUELTA-DE-ROSCA, DL-166): el
 * quinto destino de la barra, en lugar de «Información». Reúne lo que estaba repartido entre «Información», Cuenta
 * (detrás del avatar) y el menú de la cabecera, cada cosa en un solo lugar (`DONDE_QUEDO_CADA_COSA`, en `perfil.ts`).
 *
 * De arriba abajo (maqueta 02): quién sos, con el identificador BE y «Compartir»; las cuatro baldosas de tu información;
 * tus profesionales con su área y «Tengo un código» al pie; «Formularios y pedidos»; y los ajustes, con la apariencia ahí
 * mismo y Cerrar mi cuenta al final.
 *
 * - **Perfil no escribe.** Cada dato se lee con la operación de siempre, con el mismo permiso que en su módulo, y
 *   verifica antes de mostrar. Para cambiar algo, lleva a la pantalla de siempre.
 * - **La marca de la pestaña** sale de lo que hay para responder, igual que en Inicio (`paraResponder`): la confirma acá
 *   la lectura, y abrir Perfil no la saca.
 * - **Una cuenta nueva** (AV-17): cada baldosa dice su estado en palabras. Lo que no tiene nada no se dibuja: no hay ceros
 *   ni tarjetas vacías. Desde DL-169 (UF-01) el nombre es obligatorio y lo pide «Antes de seguir»: Perfil ya no ofrece
 *   «Agregá tu nombre» (`nombreEnPerfil`).
 */
import { COPY_AYUDA, COPY_DERECHOS, COPY_INVITACION, ETIQUETA_DE_ALCANCE, type Alcance } from '@be/domain';
import { Fragment, useCallback, useEffect, type ReactNode } from 'react';
import { Platform, Pressable, Share, Switch, Text, View } from 'react-native';
import { api } from '../api';
import { SelectorDeApariencia } from '../apariencia';
import { IconoDeZona } from '../barra-de-zonas';
import { dia } from '../formato';
import { Icono, type NombreDeIcono } from '../icono';
import { useLecturaRecordada } from '../lecturas';
import { leerLista } from '../lecturas-de-las-zonas';
import { marcaEnPerfil } from '../marca-de-perfil';
import { useSesionPerdida, type Ir, type Salida, type Zona } from '../navegacion';
import { AJUSTES_DE_PERFIL, baldosasDePerfil, filasDeFormularios, nombreEnPerfil, paraResponder, type Ajuste, type DatosDePerfil } from '../perfil';
import { preferenciasDelTelefono, usePreferenciasDelTelefono } from '../preferencias-en-el-telefono';
import { TEXTOS_DE_LA_VUELTA as T } from '../textos-de-la-vuelta';
import { TEXTOS_DEL_PULIDO as TP } from '../textos-del-pulido';
import { COLOR, estilosPorTema, Rotulo, Superficie, SuperficieTocable } from '../ui';
import { Verificando } from './tarjeta-de-inicio';

/** El ícono del área de un profesional, el mismo de la barra. */
export const ZONA_DEL_ALCANCE: Readonly<Record<Alcance, Zona>> = { NUTRICION: 'nutricion', ENTRENAMIENTO: 'entrenamiento', ANTROPOMETRIA: 'evolucion' };

export function PantallaDePerfil({ token, salir, ir }: { token: string; salir: (m: Salida) => void; ir: Ir }) {
  const sesionPerdida = useSesionPerdida(salir);
  const nombre = useLecturaRecordada(token, 'perfil-propio', useCallback(() => api.consultarPerfilPropio(token), [token]), sesionPerdida);
  const cuenta = useLecturaRecordada(token, 'cuenta', useCallback(() => api.consultarCuenta(token), [token]), sesionPerdida);
  const vinculos = useLecturaRecordada(token, 'perfil-vinculos', useCallback(() => api.consultarVinculos(token), [token]), sesionPerdida);
  const bandeja = useLecturaRecordada(token, 'perfil-bandeja', useCallback(() => leerLista(api, token), [token]), sesionPerdida);
  const habitos = useLecturaRecordada(token, 'mis-habitos', useCallback(() => api.misHabitos(token), [token]), sesionPerdida);
  const pedidos = useLecturaRecordada(token, 'pedidos-de-acceso', useCallback(() => api.pedidosDeAccesoAMisHabitos(token), [token]), sesionPerdida);

  // Lo que hay para responder, con las tres lecturas confirmadas. Mientras falte alguna, no se afirma nada.
  const listas = bandeja.r?.ok && habitos.r?.ok && pedidos.r?.ok;
  const filas = listas ? paraResponder(bandeja.r!.ok ? bandeja.r!.datos.solicitudes : null, habitos.r!.ok ? habitos.r!.datos.data : null, pedidos.r!.ok ? pedidos.r!.datos.data : null) : undefined;
  useEffect(() => {
    if (filas) marcaEnPerfil.fijar(filas);
  }, [filas]);

  const datos: DatosDePerfil = {
    // Lo que no se pudo leer no es «sin nombre»: queda sin afirmar, como el resto de Perfil.
    nombre: nombre.r?.ok ? nombre.r.datos.data.displayName : undefined,
    identificador: cuenta.r?.ok ? cuenta.r.datos.data.identityId : undefined,
    profesionales: vinculos.r?.ok
      ? vinculos.r.datos.data
          .filter((v) => v.relationshipState !== 'FINALIZADO')
          .map((v) => ({ id: v.relationshipId, nombre: v.professional.displayName, area: v.scope.code, desde: v.acceptedAt, enPausa: v.relationshipState === 'PAUSADO' }))
      : undefined,
    paraResponder: filas,
    respondidos: bandeja.r?.ok ? bandeja.r.datos.solicitudes.filter((s) => s.status === 'RESPONDED').length : undefined,
    habitos: habitos.r?.ok ? { cargados: habitos.r.datos.data.current !== null, losReciben: habitos.r.datos.data.professionals.filter((p) => p.sharing === 'RECEIVES').length } : undefined,
  };
  const quien = nombreEnPerfil(datos.nombre, datos.identificador);

  async function compartir(id: string) {
    try {
      await Share.share({ message: id });
    } catch {
      // Sin menú de compartir: el identificador sigue a la vista y se puede seleccionar y copiar.
    }
  }

  return (
    <View>
      {/* Quién sos: el nombre que ven tus profesionales y tu identificador BE, con «Compartir». */}
      <View style={estilos.quienSos}>
        <View style={estilos.circulo}>
          <Icono nombre="persona" tamano={24} tono="acento" />
        </View>
        <View style={estilos.textosDeQuien}>
          {quien === null ? (
            <Verificando />
          ) : (
            <Text style={estilos.nombre} accessibilityRole="header">
              {quien}
            </Text>
          )}
          {datos.identificador ? (
            <View style={estilos.filaDelId}>
              <Icono nombre="pendientes" tamano={18} tono="tenue" />
              <Text selectable style={estilos.identificador} accessibilityLabel={`Tu identificador BE: ${datos.identificador}`}>
                {datos.identificador}
              </Text>
            </View>
          ) : null}
        </View>
        {datos.identificador ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={T.compartirTuIdentificador}
            onPress={() => void compartir(datos.identificador!)}
            style={({ pressed }) => [estilos.compartir, pressed && estilos.presionado]}
          >
            <Icono nombre="solicitar" tamano={20} tono="acento" />
          </Pressable>
        ) : null}
      </View>

      <Rotulo>{T.tuInformacion}</Rotulo>
      <View style={estilos.baldosas}>
        {baldosasDePerfil(datos).map((b) => (
          <SuperficieTocable
            key={b.titulo}
            accessibilityRole="button"
            accessibilityLabel={b.detalle ? `${b.titulo}. ${b.detalle}` : b.titulo}
            onPress={() => ir(b.ruta)}
            style={estilos.baldosa}
            encima={(presionada) => presionada && estilos.presionado}
          >
            <Icono nombre={b.icono} tamano={24} tono="acento" />
            <Text style={estilos.tituloDeBaldosa}>{b.titulo}</Text>
            {b.detalle ? <Text style={estilos.detalle}>{b.detalle}</Text> : null}
          </SuperficieTocable>
        ))}
      </View>

      <Rotulo>{T.tusProfesionales}</Rotulo>
      <Superficie style={estilos.grupo}>
        {datos.profesionales === undefined ? <Verificando /> : null}
        {datos.profesionales?.length === 0 ? <Text style={[estilos.detalle, estilos.vacio]}>{T.sinProfesionales}</Text> : null}
        {datos.profesionales?.map((p) => (
          <Fila
            key={p.id}
            icono={<IconoDeZona zona={ZONA_DEL_ALCANCE[p.area as Alcance] ?? 'perfil'} color={COLOR.acento} />}
            titulo={p.nombre}
            detalle={`${ETIQUETA_DE_ALCANCE[p.area as Alcance] ?? p.area} · ${T.desde(dia(p.desde))}${p.enPausa ? ' · en pausa' : ''}`}
            onPress={() => ir({ nombre: 'vinculo', id: p.id })}
          />
        ))}
        <Fila icono={<Icono nombre="seguimiento" tamano={20} tono="acento" />} titulo={T.todosTusVinculos} onPress={() => ir({ nombre: 'vinculos' })} />
        <Fila icono={<Icono nombre="mas" tamano={20} tono="acento" />} titulo={COPY_INVITACION.tengoUnCodigo} onPress={() => ir({ nombre: 'invitacion' })} ultima />
      </Superficie>

      <Rotulo>{T.formulariosYPedidos}</Rotulo>
      <Superficie style={estilos.grupo}>
        {filasDeFormularios(datos).map((f, i, todas) => (
          <Fila
            key={f.que}
            icono={<Icono nombre={f.que === 'para-responder' ? 'pendientes' : 'informacion'} tamano={20} tono="acento" />}
            titulo={f.titulo}
            detalle={f.detalle}
            cuenta={f.cuenta}
            onPress={() => ir({ nombre: 'mis-solicitudes' })}
            ultima={i === todas.length - 1}
          />
        ))}
      </Superficie>

      <Rotulo>{T.ajustes}</Rotulo>
      <Superficie style={estilos.grupo}>
        {AJUSTES_DE_PERFIL.map((a, i) => (
          <Fragment key={a}>
            <FilaDeAjuste ajuste={a} ir={ir} ultima={i === AJUSTES_DE_PERFIL.length - 1} />
            {/* PG-08 (WP-PULIDO-GRANDES): el interruptor de la háptica, al lado de la apariencia: se cambia ahí mismo. */}
            {a === 'apariencia' ? <FilaDeLaHaptica /> : null}
          </Fragment>
        ))}
      </Superficie>
    </View>
  );
}

const ICONO_DEL_AJUSTE: Readonly<Record<Ajuste, NombreDeIcono>> = {
  apariencia: 'claro',
  avisos: 'novedades',
  privacidad: 'candado',
  'tus-datos': 'persona',
  'ayuda-y-contacto': 'ayuda',
  sesion: 'acceso',
  'cerrar-mi-cuenta': 'salir',
};

/** Un ajuste: la apariencia se cambia ahí mismo; el resto abre su pantalla. Cerrar mi cuenta, al final y en su color. */
function FilaDeAjuste({ ajuste, ir, ultima }: { ajuste: Ajuste; ir: Ir; ultima: boolean }) {
  const icono = <Icono nombre={ICONO_DEL_AJUSTE[ajuste]} tamano={20} tono={ajuste === 'cerrar-mi-cuenta' ? 'error' : 'acento'} />;
  switch (ajuste) {
    case 'apariencia':
      return (
        <View style={[estilos.fila, estilos.filaDeApariencia]}>
          <View style={estilos.filaConIcono}>
            {icono}
            <Text style={estilos.tituloDeFila}>{T.apariencia}</Text>
          </View>
          <SelectorDeApariencia />
        </View>
      );
    case 'avisos':
      return <Fila icono={icono} titulo={T.avisos} detalle={T.avisosDetalle} onPress={() => ir({ nombre: 'cuenta', seccion: 'avisos' })} />;
    case 'privacidad':
      return <Fila icono={icono} titulo={T.privacidad} onPress={() => ir({ nombre: 'privacidad' })} />;
    case 'tus-datos':
      return <Fila icono={icono} titulo={COPY_DERECHOS.titulo} detalle={COPY_DERECHOS.descargar.boton} onPress={() => ir({ nombre: 'tus-datos' })} />;
    case 'ayuda-y-contacto':
      return <Fila icono={icono} titulo={COPY_AYUDA.titulo} detalle={COPY_AYUDA.soporte.queEs} onPress={() => ir({ nombre: 'ayuda-y-contacto' })} />;
    case 'sesion':
      return <Fila icono={icono} titulo={T.sesionYEsteTelefono} detalle={T.sesionYEsteTelefonoDetalle} onPress={() => ir({ nombre: 'cuenta', seccion: 'sesion' })} />;
    case 'cerrar-mi-cuenta':
      return <Fila icono={icono} titulo={T.cerrarMiCuenta} onPress={() => ir({ nombre: 'cuenta', seccion: 'cierre' })} peligro ultima={ultima} />;
  }
}

/**
 * PG-08: «Vibrar al confirmar», con un interruptor que se cambia ahí mismo y queda guardado en este teléfono (PG-D4:
 * prendido de fábrica). La fila entera es el interruptor: el lector la lee con su estado.
 */
function FilaDeLaHaptica() {
  const { haptica } = usePreferenciasDelTelefono();
  const cambiar = () => void preferenciasDelTelefono.cambiar({ haptica: !haptica });
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={`${TP.haptica}. ${TP.hapticaDetalle}`}
      accessibilityState={{ checked: haptica }}
      onPress={cambiar}
      style={({ pressed }) => [estilos.fila, estilos.conLinea, pressed && estilos.presionado]}
    >
      <View style={estilos.filaConIcono}>
        <View accessible={false} importantForAccessibility="no-hide-descendants">
          <Icono nombre="ya-la-hice" tamano={20} tono="acento" />
        </View>
        <View style={estilos.textosDeFila}>
          <Text style={estilos.tituloDeFila}>{TP.haptica}</Text>
          <Text style={estilos.detalle}>{TP.hapticaDetalle}</Text>
        </View>
        <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none">
          <Switch value={haptica} trackColor={{ false: COLOR.borde, true: COLOR.acento }} />
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Una fila que abre otra pantalla: el ícono, el título, un detalle si hace falta, una cuenta sin juicio y la flecha. El
 * lector lee todo junto como un botón; el ícono y la flecha no se recorren.
 */
export function Fila({
  icono,
  titulo,
  detalle,
  cuenta,
  onPress,
  peligro = false,
  ultima = false,
}: {
  icono: ReactNode;
  titulo: string;
  detalle?: string | null;
  cuenta?: number | null;
  onPress: () => void;
  peligro?: boolean;
  ultima?: boolean;
}) {
  const paraLeer = [titulo, detalle, cuenta ? String(cuenta) : null].filter(Boolean).join('. ');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={paraLeer} onPress={onPress} style={({ pressed }) => [estilos.fila, !ultima && estilos.conLinea, pressed && estilos.presionado]}>
      <View style={estilos.filaConIcono}>
        <View accessible={false} importantForAccessibility="no-hide-descendants">
          {icono}
        </View>
        <View style={estilos.textosDeFila}>
          <Text style={[estilos.tituloDeFila, peligro && estilos.peligro]}>{titulo}</Text>
          {detalle ? <Text style={estilos.detalle}>{detalle}</Text> : null}
        </View>
        {cuenta ? (
          <View style={estilos.cuenta}>
            <Text style={estilos.textoDeCuenta}>{cuenta}</Text>
          </View>
        ) : null}
        <Icono nombre="derecha" tamano={20} tono="tenue" />
      </View>
    </Pressable>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  presionado: { opacity: 0.6 },
  quienSos: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4, marginBottom: 12 },
  circulo: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLOR.acento, backgroundColor: COLOR.superficieElevada },
  textosDeQuien: { flex: 1 },
  nombre: { fontSize: 24, fontWeight: '800', color: COLOR.texto },
  filaDelId: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  identificador: { fontFamily: Platform.select({ android: 'monospace', ios: 'Menlo', default: undefined }), fontSize: 15, fontWeight: '700', color: COLOR.texto, flexShrink: 1 },
  compartir: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.superficieElevada },
  baldosas: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  baldosa: { flexGrow: 1, flexBasis: 140, minHeight: 112, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: COLOR.borde, gap: 4 },
  tituloDeBaldosa: { fontSize: 17, fontWeight: '800', color: COLOR.texto, marginTop: 6 },
  detalle: { fontSize: 14, lineHeight: 20, color: COLOR.tenue },
  vacio: { padding: 14 },
  grupo: { borderRadius: 16, borderWidth: 1, borderColor: COLOR.borde, marginBottom: 12, overflow: 'hidden' },
  fila: { minHeight: 56, paddingVertical: 10, paddingHorizontal: 14, justifyContent: 'center' },
  conLinea: { borderBottomWidth: 1, borderBottomColor: COLOR.borde },
  filaConIcono: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  filaDeApariencia: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: 1, borderBottomColor: COLOR.borde },
  textosDeFila: { flex: 1 },
  tituloDeFila: { fontSize: 16, fontWeight: '700', color: COLOR.texto },
  peligro: { color: COLOR.error },
  cuenta: { minWidth: 28, height: 28, borderRadius: 14, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.superficieElevada },
  textoDeCuenta: { fontSize: 14, fontWeight: '800', color: COLOR.acento },
}));
