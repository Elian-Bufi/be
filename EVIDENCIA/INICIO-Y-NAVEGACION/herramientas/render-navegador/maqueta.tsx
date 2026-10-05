// RENDER DE COMPONENTES EN EL NAVEGADOR (react-native-web): no es la APK ni una captura nativa.
// Compone la cabecera, la pantalla y la barra REALES de apps/mobile/src como lo hace App.tsx, con datos sintéticos
// (shims/api.ts). Parámetros: ?escena=inicio|...&tema=azul-noche|claro&escala=1&abajo=24&final=1
import { useEffect, useRef, useState } from 'react';
import { AppRegistry, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProveedorDeApariencia } from '@movil/apariencia';
import * as barra from '@movil/barra-de-zonas';
const { BarraDeZonas, SEPARACION_DE_LA_BARRA } = barra;
// El velo detrás de la barra (DL-118) lo dibuja App.tsx desde el 2026-10-05; la candidata anterior no lo tiene.
const VeloDeLaBarra = (barra as { VeloDeLaBarra?: (p: { alto: number }) => JSX.Element }).VeloDeLaBarra;
import { Cabecera } from '@movil/cabecera';
import { memoria } from '@movil/lecturas';
import { MenuAuxiliar } from '@movil/menu-auxiliar';
import { anterior, esRaiz, pestanaActiva, type Ruta } from '@movil/navegacion';
import { PantallaDeMiEvolucion } from '@movil/pantallas/antropometria';
import { PantallaDeCuenta } from '@movil/pantallas/cuenta';
import { PantallaDeInicio } from '@movil/pantallas/inicio';
import { COLOR, fijarTema, type Tema } from '@movil/tema';

const p = new URLSearchParams(location.search);
const escena = p.get('escena') ?? 'inicio';
const tema = (p.get('tema') ?? 'azul-noche') as Tema;
const alFinal = p.get('final') === '1';
/** Cuánto bajar el contenido antes de la captura, en dp: para mostrar lo que queda debajo de la figura. */
const bajar = Number(p.get('bajar') ?? '0');
fijarTema(tema);

const TOKEN = 'token-de-maqueta';
const nada = () => undefined;

/** La ruta de cada escena, y lo que se elige antes de dibujar. */
function rutaDeLaEscena(): Ruta {
  if (escena === 'cuenta') return { nombre: 'cuenta', desde: { nombre: 'inicio' } };
  if (escena.startsWith('evolucion')) {
    // DL-118: Mapa corporal, Progreso e Indicadores. Sin vista en el nombre, se resuelve como «Ver la toma».
    const vista = escena.includes('progreso')
      ? 'PROGRESO'
      : escena.includes('indicadores') && !escena.startsWith('evolucion-solo-indicadores')
        ? 'INDICADORES'
        : escena.includes('mapa') || escena.startsWith('evolucion-12') || escena.startsWith('evolucion-mismo-dia')
          ? 'MAPA'
          : 'TOMA';
    // ?vista= fuerza una vista: sirve para el «antes» (COMPARAR, EVOLUCION) con la misma maqueta.
    memoria.recordarSeleccion(TOKEN, 'mi-evolucion:vista', p.get('vista') ?? vista);
    const familia = p.get('familia');
    if (familia) memoria.recordarSeleccion(TOKEN, 'mi-evolucion:familia', familia);
    const panel = p.get('panel');
    if (panel) memoria.recordarSeleccion(TOKEN, 'mi-evolucion:panel', panel);
    const toma = p.get('toma');
    if (toma) memoria.recordarSeleccion(TOKEN, 'mi-evolucion:toma', toma);
    if (escena.endsWith('-t2')) memoria.recordarSeleccion(TOKEN, 'mi-evolucion:toma', 'ev-ago');
    if (escena.startsWith('evolucion-mismo-dia')) memoria.recordarSeleccion(TOKEN, 'mi-evolucion:toma', 'ev-tarde');
    if (escena === 'evolucion-medida') memoria.recordarSeleccion(TOKEN, 'mi-evolucion:medida', 'peso');
    const medida = p.get('medida');
    if (medida) memoria.recordarSeleccion(TOKEN, 'mi-evolucion:medida', medida);
    return { nombre: 'mi-evolucion' };
  }
  return { nombre: 'inicio' };
}

function Maqueta() {
  const [ruta] = useState(rutaDeLaEscena);
  const insets = useSafeAreaInsets();
  const [alto, setAlto] = useState(0);
  const desplazamiento = useRef<ScrollView>(null);
  const raiz = esRaiz(ruta);
  const espacio = alto > 0 ? alto + insets.bottom + SEPARACION_DE_LA_BARRA + 16 : 32 + insets.bottom;
  useEffect(() => {
    if (!alFinal && !bajar) return;
    const t = setTimeout(() => (alFinal ? desplazamiento.current?.scrollToEnd({ animated: false }) : desplazamiento.current?.scrollTo({ y: bajar, animated: false })), 900);
    return () => clearTimeout(t);
  }, []);
  return (
    <ProveedorDeApariencia value={{ tema, cambiarTema: nada }}>
      <View style={{ flex: 1, backgroundColor: COLOR.fondo }}>
        <Cabecera volverA={raiz ? null : anterior(ruta)} conMenu={raiz} conAvatar actualizando={false} volver={nada} abrirMenu={nada} abrirCuenta={nada} />
        <ScrollView ref={desplazamiento} contentContainerStyle={{ padding: 20, paddingBottom: espacio }}>
          {ruta.nombre === 'inicio' ? <PantallaDeInicio token={TOKEN} salir={nada} ir={nada} /> : null}
          {ruta.nombre === 'cuenta' ? <PantallaDeCuenta token={TOKEN} salir={nada} ir={nada} sesionRecordada /> : null}
          {ruta.nombre === 'mi-evolucion' ? <PantallaDeMiEvolucion token={TOKEN} salir={nada} ir={nada} /> : null}
        </ScrollView>
        {VeloDeLaBarra && alto > 0 ? <VeloDeLaBarra alto={alto + insets.bottom + SEPARACION_DE_LA_BARRA + 16} /> : null}
        <BarraDeZonas actual={pestanaActiva(ruta)} ir={nada} alMedir={setAlto} />
        <MenuAuxiliar visible={escena === 'menu'} cerrar={nada} elegir={nada} />
      </View>
    </ProveedorDeApariencia>
  );
}

AppRegistry.registerComponent('maqueta', () => Maqueta);
AppRegistry.runApplication('maqueta', { rootTag: document.getElementById('root') });
