// RENDER DE COMPONENTES EN EL NAVEGADOR (react-native-web): no es la APK ni una captura nativa.
// Compone la cabecera, la pantalla y la barra REALES de apps/mobile/src como lo hace App.tsx, con datos sintéticos
// (shims/api.ts). Parámetros: ?escena=inicio|...&tema=azul-noche|claro&escala=1&abajo=24&final=1
import { useEffect, useRef, useState } from 'react';
import { AppRegistry, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProveedorDeApariencia } from '@movil/apariencia';
import { BarraDeZonas, SEPARACION_DE_LA_BARRA } from '@movil/barra-de-zonas';
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
fijarTema(tema);

const TOKEN = 'token-de-maqueta';
const nada = () => undefined;

/** La ruta de cada escena, y lo que se elige antes de dibujar. */
function rutaDeLaEscena(): Ruta {
  if (escena === 'cuenta') return { nombre: 'cuenta', desde: { nombre: 'inicio' } };
  if (escena.startsWith('evolucion')) {
    memoria.recordarSeleccion(TOKEN, 'mi-evolucion:vista', escena === 'evolucion-comparar' ? 'COMPARAR' : escena === 'evolucion-medida' ? 'EVOLUCION' : 'TOMA');
    if (escena === 'evolucion-toma-t2') memoria.recordarSeleccion(TOKEN, 'mi-evolucion:toma', 'ev-ago');
    if (escena === 'evolucion-medida') memoria.recordarSeleccion(TOKEN, 'mi-evolucion:medida', 'peso');
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
    if (!alFinal) return;
    const t = setTimeout(() => desplazamiento.current?.scrollToEnd({ animated: false }), 900);
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
        <BarraDeZonas actual={pestanaActiva(ruta)} ir={nada} alMedir={setAlto} />
        <MenuAuxiliar visible={escena === 'menu'} cerrar={nada} elegir={nada} />
      </View>
    </ProveedorDeApariencia>
  );
}

AppRegistry.registerComponent('maqueta', () => Maqueta);
AppRegistry.runApplication('maqueta', { rootTag: document.getElementById('root') });
