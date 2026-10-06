// RENDER DE COMPONENTES EN EL NAVEGADOR (react-native-web): no es la APK ni una captura nativa.
// Compone la cabecera, la pantalla y la barra REALES de apps/mobile/src como lo hace App.tsx, con datos sintéticos
// (shims/api.ts) y el reloj del render detenido (shims/reloj-de-sesion.ts). Parámetros: ?escena=...&tema=azul-noche|claro
// &escala=1&ancho=390&alto=800&final=1. Escenas:
// - entrenamiento-hoy, entrenamiento-plan: la raíz de Entrenamiento con sus pestañas;
// - sesion-serie-1: la sesión enfocada en la serie 1 de la sentadilla goblet (la matriz de anchos, temas y letra);
// - sesion-escrita: lo mismo con la carga sin escribir, 14 repeticiones y RIR 2,5 (el botón se habilita);
// - sesion-descanso: la serie 1 guardada y su descanso en curso;
// - sesion-tecnica: «Ver técnica» abierto sobre la sesión;
// - sesion-rutina: «Ver rutina» abierto;
// - sesion-sin-objetivo: la zancada estática, sin RIR planificado y con carga 0 kg;
// - sesion-primera-vez: la explicación de los tiempos, la primera vez de la cuenta;
// - sesion-resumen: «Antes de finalizar», con series y tiempos;
// - recuperacion-comprobando, recuperacion-tardando, recuperacion-sin-conexion: la recuperación de la sesión.
// Algunas escenas tocan la pantalla como lo haría la persona (abrir la técnica, escribir): lo hace `acciones()`.
import { useEffect, useRef, useState } from 'react';
import { AppRegistry, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProveedorDeApariencia } from '@movil/apariencia';
import { BarraDeZonas, SEPARACION_DE_LA_BARRA, VeloDeLaBarra } from '@movil/barra-de-zonas';
import { Cabecera } from '@movil/cabecera';
import { entrenamientoLocal } from '@movil/entrenamiento-en-curso';
import { memoria } from '@movil/lecturas';
import { anterior, esRaiz, pestanaActiva, sinBarraInferior, type Ruta } from '@movil/navegacion';
import { PantallaDeEntrenamiento, PantallaDeSesion } from '@movil/pantallas/entrenamiento';
import { PantallaDeRecuperacion, type FaseDeLaRecuperacion } from '@movil/pantallas/recuperacion';
import { COLOR, fijarTema, type Tema } from '@movil/tema';
import { DATOS } from './shims/api';

const p = new URLSearchParams(location.search);
const escena = p.get('escena') ?? 'sesion-serie-1';
const tema = (p.get('tema') ?? 'azul-noche') as Tema;
const alFinal = p.get('final') === '1';
const bajar = Number(p.get('bajar') ?? '0');
fijarTema(tema);

const TOKEN = 'token-de-maqueta';
const nada = () => undefined;

function rutaDeLaEscena(): Ruta | null {
  if (escena.startsWith('recuperacion')) return null;
  if (escena.startsWith('entrenamiento-')) {
    memoria.recordarSeleccion(TOKEN, 'entrenamiento:vista', escena === 'entrenamiento-plan' ? 'PLAN' : 'HOY');
    return { nombre: 'entrenamiento' };
  }
  return { nombre: 'sesion-de-entrenamiento', draftId: DATOS.draftId, occurrenceId: DATOS.occurrenceId, sesion: DATOS.sesion as never, fecha: DATOS.fecha, modo: 'en-vivo', etiqueta: DATOS.etiqueta, desde: { nombre: 'entrenamiento' } };
}

const FASES: Record<string, FaseDeLaRecuperacion> = {
  'recuperacion-comprobando': { tipo: 'comprobando' },
  'recuperacion-tardando': { tipo: 'tardando' },
  'recuperacion-sin-conexion': { tipo: 'sin-verificar', causa: 'sin-conexion' },
};

// ─── Lo que hace la persona en algunas escenas ──────────────────────────────────────────────────

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Toca el control con ese nombre accesible (o ese texto): un clic de puntero, como un dedo. */
function tocar(nombre: string) {
  const candidatos = [...document.querySelectorAll<HTMLElement>('[role="button"],[role="checkbox"],[role="tab"],[role="link"]')];
  const el = candidatos.find((e) => e.getAttribute('aria-label') === nombre) ?? candidatos.find((e) => e.textContent?.trim() === nombre);
  if (!el) throw new Error(`no encontré «${nombre}»`);
  el.click();
}
/** Escribe en el campo cuyo nombre accesible empieza así, como lo haría el teclado. */
function escribir(comienzo: string, texto: string) {
  const el = [...document.querySelectorAll<HTMLInputElement>('input')].find((e) => (e.getAttribute('aria-label') ?? '').startsWith(comienzo));
  if (!el) throw new Error(`no encontré el campo «${comienzo}»`);
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, texto);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

async function acciones() {
  await esperar(1500);
  switch (escena) {
    case 'entrenamiento-plan':
      tocar('Piernas A. 3 ejercicios · 9 series');
      break;
    case 'sesion-escrita':
      escribir('Repeticiones de la serie 1', '14');
      await esperar(150);
      escribir('RIR de la serie 1', '2,5');
      break;
    case 'sesion-tecnica':
      tocar('Ver técnica');
      break;
    case 'sesion-rutina':
      tocar('Ver rutina');
      break;
    case 'sesion-resumen':
      tocar('Finalizar entrenamiento');
      break;
    default:
      break;
  }
}

function Maqueta() {
  const [ruta] = useState(rutaDeLaEscena);
  const [lista, setLista] = useState(false);
  const insets = useSafeAreaInsets();
  const [alto, setAlto] = useState(0);
  const desplazamiento = useRef<ScrollView>(null);
  useEffect(() => {
    // La cuenta sintética abre su entrenamiento en el teléfono, como lo hace la raíz de la APK.
    void entrenamientoLocal.abrirCuenta('cuenta-sintetica', TOKEN).then(() => {
      if (escena !== 'sesion-primera-vez') entrenamientoLocal.marcarExplicacionVista();
      setLista(true);
    });
  }, []);
  useEffect(() => {
    if (!lista) return;
    void acciones()
      .catch((e: Error) => {
        document.body.dataset.error = e.message;
      })
      .finally(() => {
        document.body.dataset.acciones = 'listas';
      });
  }, [lista]);
  useEffect(() => {
    if (!alFinal && !bajar) return;
    const t = setTimeout(() => (alFinal ? desplazamiento.current?.scrollToEnd({ animated: false }) : desplazamiento.current?.scrollTo({ y: bajar, animated: false })), 3200);
    return () => clearTimeout(t);
  }, []);
  const conBarra = ruta !== null && !sinBarraInferior(ruta);
  const espacio = conBarra && alto > 0 ? alto + insets.bottom + SEPARACION_DE_LA_BARRA + 16 : 32 + insets.bottom;
  const raiz = ruta ? esRaiz(ruta) : false;
  return (
    <ProveedorDeApariencia value={{ tema, cambiarTema: nada }}>
      <View style={{ flex: 1, backgroundColor: COLOR.fondo }}>
        <Cabecera volverA={ruta && !raiz ? anterior(ruta) : null} conMenu={raiz} conAvatar={ruta !== null} actualizando={false} volver={nada} abrirMenu={nada} abrirCuenta={nada} />
        <ScrollView ref={desplazamiento} contentContainerStyle={{ padding: 20, paddingBottom: espacio }} keyboardShouldPersistTaps="handled">
          {ruta === null ? <PantallaDeRecuperacion fase={FASES[escena] ?? { tipo: 'comprobando' }} reintentar={nada} iniciarDeNuevo={nada} /> : null}
          {lista && ruta?.nombre === 'entrenamiento' ? <PantallaDeEntrenamiento token={TOKEN} identidadId="cuenta-sintetica" salir={nada} ir={nada} /> : null}
          {lista && ruta?.nombre === 'sesion-de-entrenamiento' ? (
            <PantallaDeSesion token={TOKEN} draftId={ruta.draftId} occurrenceId={ruta.occurrenceId} sesion={ruta.sesion} fechaDeLaSesion={ruta.fecha} modo={ruta.modo} etiqueta={ruta.etiqueta} salir={nada} ir={nada} subir={nada} />
          ) : null}
        </ScrollView>
        {conBarra && alto > 0 ? <VeloDeLaBarra alto={alto + insets.bottom + SEPARACION_DE_LA_BARRA + 16} /> : null}
        {ruta ? <BarraDeZonas actual={pestanaActiva(ruta)} ir={nada} alMedir={setAlto} oculta={!conBarra} /> : null}
      </View>
    </ProveedorDeApariencia>
  );
}

AppRegistry.registerComponent('maqueta', () => Maqueta);
AppRegistry.runApplication('maqueta', { rootTag: document.getElementById('root') });
