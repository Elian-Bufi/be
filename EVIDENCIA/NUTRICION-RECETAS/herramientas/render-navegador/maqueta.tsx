// RENDER DE COMPONENTES EN EL NAVEGADOR (react-native-web): no es la APK ni una captura nativa.
// Compone la cabecera, la pantalla y la barra REALES de apps/mobile/src como lo hace App.tsx, con datos sintéticos
// (shims/api.ts). Parámetros: ?escena=nutricion-...&tema=azul-noche|claro&escala=1&abajo=24&final=1
// Algunas escenas tocan la pantalla como lo haría la persona (marcar la casilla, escribir, elegir una foto, guardar): lo
// hace `acciones()`, sobre el DOM que dibuja react-native-web, después de que la pantalla aparece.
import { useEffect, useRef, useState } from 'react';
import { AppRegistry, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProveedorDeApariencia } from '@movil/apariencia';
import { BarraDeZonas, SEPARACION_DE_LA_BARRA, VeloDeLaBarra } from '@movil/barra-de-zonas';
import { Cabecera } from '@movil/cabecera';
import { memoria } from '@movil/lecturas';
import { anterior, esRaiz, pestanaActiva, type Ruta } from '@movil/navegacion';
import { PantallaDeComidaDiferente } from '@movil/pantallas/comida-diferente';
import { PantallaDeHoy, PantallaDeRegistroNutricional } from '@movil/pantallas/nutricion';
import { PantallaDeOpcionDeComida } from '@movil/pantallas/opcion-de-comida';
import { COLOR, fijarTema, type Tema } from '@movil/tema';

const p = new URLSearchParams(location.search);
const escena = p.get('escena') ?? 'nutricion-hoy';
const tema = (p.get('tema') ?? 'azul-noche') as Tema;
const alFinal = p.get('final') === '1';
/** Cuánto bajar el contenido antes de la captura, en dp. */
const bajar = Number(p.get('bajar') ?? '0');
fijarTema(tema);

// Con la API real (modo API_REAL), la sesión del asesorado sintético y la fecha civil que responde la API llegan por la
// URL; con los datos sintéticos, son fijas.
const TOKEN = p.get('token') ?? 'token-de-maqueta';
const HOY = p.get('fecha') ?? '2026-10-05';
const nada = () => undefined;
const HOY_RUTA: Ruta = { nombre: 'hoy' };

/** La ruta de cada escena, y lo que la pantalla recuerda antes de dibujarse (pestaña, comida, opción a la vista). */
function rutaDeLaEscena(): Ruta {
  const recordar = (clave: string, valor: unknown) => memoria.recordarSeleccion(TOKEN, clave, valor);
  // Con la API real: los identificadores de la comida y de la opción, los de la API.
  if (escena === 'real-detalle') return { nombre: 'opcion-de-comida', id: p.get('opcion') ?? '', comidaId: p.get('comida') ?? '', desde: HOY_RUTA };
  if (escena.startsWith('real-')) {
    recordar('nutricion:vista', 'HOY');
    if (p.get('comida')) recordar(`nutricion:comida:${HOY}`, p.get('comida'));
    return HOY_RUTA;
  }
  if (escena.startsWith('nutricion-detalle')) return { nombre: 'opcion-de-comida', id: 'opcion-pollo', comidaId: 'almuerzo', desde: HOY_RUTA };
  if (escena.startsWith('nutricion-diferente')) return { nombre: 'comida-diferente', comidaId: 'almuerzo', comida: 'Almuerzo', fecha: HOY, planId: 'plan-sintetico-1', diaTipoId: 'dia-tipo-habitual', desde: HOY_RUTA };
  if (escena.startsWith('nutricion-registro-')) return { nombre: 'registro-nutricional', id: 'registro-almuerzo-informado', desde: HOY_RUTA };
  if (escena.startsWith('nutricion-registros')) recordar('nutricion:vista', 'REGISTROS');
  else recordar('nutricion:vista', 'HOY');
  if (escena.startsWith('nutricion-una-opcion')) recordar(`nutricion:comida:${HOY}`, 'cena');
  else if (escena.startsWith('nutricion-exito-diferente')) recordar(`nutricion:comida:${HOY}`, 'merienda');
  else recordar(`nutricion:comida:${HOY}`, 'almuerzo');
  if (escena.startsWith('nutricion-hoy-segunda') || escena.startsWith('nutricion-falla-imagen')) recordar(`nutricion:opcion:${HOY}:almuerzo`, 'opcion-salmon');
  if (escena.startsWith('nutricion-sin-imagen')) recordar(`nutricion:opcion:${HOY}:almuerzo`, 'opcion-lentejas');
  return HOY_RUTA;
}

// ─── Lo que hace la persona en algunas escenas ──────────────────────────────────────────────────

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Toca el control con ese nombre accesible (o ese texto): un clic de puntero, como un dedo. */
function tocar(nombre: string) {
  const candidatos = [...document.querySelectorAll<HTMLElement>('[role="button"],[role="checkbox"],[role="tab"],[role="link"]')];
  const el = candidatos.find((e) => e.getAttribute('aria-label') === nombre) ?? candidatos.find((e) => e.textContent?.trim() === nombre);
  if (!el) throw new Error(`no encontré «${nombre}»`);
  el.click();
}
/** Escribe en el campo con esa etiqueta, como lo haría el teclado. */
function escribir(etiqueta: string, texto: string) {
  const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[aria-label="${etiqueta}"]`);
  if (!el) throw new Error(`no encontré el campo «${etiqueta}»`);
  const prototipo = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototipo, 'value')!.set!.call(el, texto);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

async function acciones() {
  await esperar(1200);
  const campo = (nombre: string) => `${nombre}: lo que comiste (g)`;
  switch (escena) {
    case 'real-registrar':
      // Un toque en «Comí esta opción» de la tarjeta a la vista: registra contra la API real.
      tocar('Comí esta opción');
      break;
    case 'nutricion-detalle-casilla':
      tocar('Comí las porciones del plan');
      break;
    case 'nutricion-detalle-cantidades':
      tocar('Informar lo que comí de cada ingrediente');
      await esperar(300);
      escribir(campo('Pechuga de pollo sin piel, asada, parte comestible'), '100');
      escribir(campo('Arroz blanco de grano largo, cocido'), '160');
      escribir(campo('Zanahoria hervida y escurrida, sin sal'), '70');
      tocar('No lo comí: Aceite de oliva');
      break;
    case 'nutricion-detalle-cero':
      tocar('Informar lo que comí de cada ingrediente');
      await esperar(300);
      escribir(campo('Pechuga de pollo sin piel, asada, parte comestible'), '120');
      escribir(campo('Zanahoria hervida y escurrida, sin sal'), '0');
      await esperar(200);
      tocar('Comí esta opción');
      break;
    case 'nutricion-diferente-texto':
      escribir('¿Qué comiste?', 'Sándwich de pollo y una fruta.');
      escribir('Cantidad aproximada (opcional)', '1 sándwich y 1 manzana');
      break;
    case 'nutricion-diferente-foto':
      tocar('Galería');
      break;
    case 'nutricion-diferente-error':
      escribir('¿Qué comiste?', 'Sándwich de pollo y una fruta.');
      tocar('Cámara');
      await esperar(600);
      tocar('Guardar almuerzo');
      break;
    case 'nutricion-diferente-vacia-guardar':
      tocar('Guardar almuerzo');
      break;
    default:
      break;
  }
}

function Maqueta() {
  const [ruta] = useState(rutaDeLaEscena);
  const insets = useSafeAreaInsets();
  const [alto, setAlto] = useState(0);
  const desplazamiento = useRef<ScrollView>(null);
  const raiz = esRaiz(ruta);
  const espacio = alto > 0 ? alto + insets.bottom + SEPARACION_DE_LA_BARRA + 16 : 32 + insets.bottom;
  useEffect(() => {
    void acciones()
      .catch((e: Error) => {
        document.body.dataset.error = e.message;
      })
      .finally(() => {
        document.body.dataset.acciones = 'listas';
      });
  }, []);
  useEffect(() => {
    if (!alFinal && !bajar) return;
    const t = setTimeout(() => (alFinal ? desplazamiento.current?.scrollToEnd({ animated: false }) : desplazamiento.current?.scrollTo({ y: bajar, animated: false })), 3200);
    return () => clearTimeout(t);
  }, []);
  return (
    <ProveedorDeApariencia value={{ tema, cambiarTema: nada }}>
      <View style={{ flex: 1, backgroundColor: COLOR.fondo }}>
        <Cabecera volverA={raiz ? null : anterior(ruta)} conMenu={raiz} conAvatar actualizando={false} volver={nada} abrirMenu={nada} abrirCuenta={nada} />
        <ScrollView ref={desplazamiento} contentContainerStyle={{ padding: 20, paddingBottom: espacio }}>
          {ruta.nombre === 'hoy' ? <PantallaDeHoy token={TOKEN} salir={nada} ir={nada} subir={nada} /> : null}
          {ruta.nombre === 'opcion-de-comida' ? <PantallaDeOpcionDeComida token={TOKEN} opcionId={ruta.id} comidaId={ruta.comidaId} salir={nada} ir={nada} volver={nada} /> : null}
          {ruta.nombre === 'comida-diferente' ? (
            <PantallaDeComidaDiferente token={TOKEN} planId={ruta.planId} diaTipoId={ruta.diaTipoId} comidaId={ruta.comidaId} comida={ruta.comida} fecha={ruta.fecha} salir={nada} ir={nada} volver={nada} />
          ) : null}
          {ruta.nombre === 'registro-nutricional' ? <PantallaDeRegistroNutricional token={TOKEN} id={ruta.id} salir={nada} ir={nada} /> : null}
        </ScrollView>
        {alto > 0 ? <VeloDeLaBarra alto={alto + insets.bottom + SEPARACION_DE_LA_BARRA + 16} /> : null}
        <BarraDeZonas actual={pestanaActiva(ruta)} ir={nada} alMedir={setAlto} />
      </View>
    </ProveedorDeApariencia>
  );
}

AppRegistry.registerComponent('maqueta', () => Maqueta);
AppRegistry.runApplication('maqueta', { rootTag: document.getElementById('root') });
