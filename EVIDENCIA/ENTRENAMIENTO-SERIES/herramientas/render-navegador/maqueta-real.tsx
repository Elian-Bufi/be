// RENDER EN EL NAVEGADOR CONTRA LA API LOCAL REAL (react-native-web): no es la APK ni una captura nativa.
// Las pantallas REALES de Entrenamiento de apps/mobile/src, navegando como en App.tsx (Hoy → sesión enfocada → vuelta), con
// la API local real (shims/api-real.ts, por el mismo origen que sirve servir-arnes.mjs) y el reloj de la sesión inyectable
// (shims/reloj-controlado.ts), que el recorrido (recorrido-apk.mjs) adelanta para reproducir el guion de tiempos sin esperar.
// Parámetros: ?token=…&identidad=…&tema=azul-noche|claro&ancho=390&alto=800. El token es de la cuenta sintética del
// asesorado de esa corrida: no queda en ningún archivo del repositorio.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppRegistry, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProveedorDeApariencia } from '@movil/apariencia';
import { BarraDeZonas, SEPARACION_DE_LA_BARRA, VeloDeLaBarra } from '@movil/barra-de-zonas';
import { Cabecera } from '@movil/cabecera';
import { entrenamientoLocal } from '@movil/entrenamiento-en-curso';
import { anterior, esRaiz, navegar, pestanaActiva, sinBarraInferior, type ModoDeNavegacion, type Ruta } from '@movil/navegacion';
import { PantallaDeEjecucionDeEntrenamiento, PantallaDeEntrenamiento, PantallaDeSesion } from '@movil/pantallas/entrenamiento';
import { COLOR, fijarTema, type Tema } from '@movil/tema';

const p = new URLSearchParams(location.search);
const TOKEN = p.get('token') ?? '';
const IDENTIDAD = p.get('identidad') ?? '';
const tema = (p.get('tema') ?? 'azul-noche') as Tema;
fijarTema(tema);
const nada = () => undefined;

function Maqueta() {
  const [ruta, setRuta] = useState<Ruta>({ nombre: 'entrenamiento' });
  const actual = useRef(ruta);
  const [lista, setLista] = useState(false);
  const insets = useSafeAreaInsets();
  const [alto, setAlto] = useState(0);
  const desplazamiento = useRef<ScrollView>(null);
  const mostrar = useCallback((r: Ruta) => {
    actual.current = r;
    setRuta(r);
    document.body.dataset.ruta = r.nombre;
  }, []);
  const ir = useCallback((destino: Ruta, modo: ModoDeNavegacion = 'ir') => mostrar(navegar(actual.current, destino, modo)), [mostrar]);
  const volver = useCallback(() => mostrar(anterior(actual.current) ?? { nombre: 'entrenamiento' }), [mostrar]);
  const subir = useCallback(() => desplazamiento.current?.scrollTo({ y: 0, animated: false }), []);
  useEffect(() => {
    // Como la raíz de la APK: la cuenta abre su entrenamiento en el teléfono antes de mostrar Entrenamiento.
    void entrenamientoLocal.abrirCuenta(IDENTIDAD, TOKEN).then(() => {
      setLista(true);
      document.body.dataset.lista = '1';
    });
  }, []);
  const conBarra = !sinBarraInferior(ruta);
  const espacio = conBarra && alto > 0 ? alto + insets.bottom + SEPARACION_DE_LA_BARRA + 16 : 32 + insets.bottom;
  const raiz = esRaiz(ruta);
  return (
    <ProveedorDeApariencia value={{ tema, cambiarTema: nada }}>
      <View style={{ flex: 1, backgroundColor: COLOR.fondo }}>
        <Cabecera volverA={!raiz ? anterior(ruta) : null} conMenu={raiz} conAvatar actualizando={false} volver={volver} abrirMenu={nada} abrirCuenta={nada} />
        <ScrollView ref={desplazamiento} contentContainerStyle={{ padding: 20, paddingBottom: espacio }} keyboardShouldPersistTaps="handled">
          {lista && ruta.nombre === 'entrenamiento' ? <PantallaDeEntrenamiento token={TOKEN} identidadId={IDENTIDAD} salir={nada} ir={ir} /> : null}
          {lista && ruta.nombre === 'sesion-de-entrenamiento' ? (
            <PantallaDeSesion
              key={ruta.draftId}
              token={TOKEN}
              draftId={ruta.draftId}
              occurrenceId={ruta.occurrenceId}
              sesion={ruta.sesion}
              fechaDeLaSesion={ruta.fecha}
              modo={ruta.modo}
              etiqueta={ruta.etiqueta}
              salir={nada}
              ir={ir}
              subir={subir}
            />
          ) : null}
          {lista && ruta.nombre === 'ejecucion-de-entrenamiento' ? <PantallaDeEjecucionDeEntrenamiento key={ruta.id} token={TOKEN} id={ruta.id} avisoInicial={ruta.aviso} salir={nada} /> : null}
        </ScrollView>
        {conBarra && alto > 0 ? <VeloDeLaBarra alto={alto + insets.bottom + SEPARACION_DE_LA_BARRA + 16} /> : null}
        <BarraDeZonas actual={pestanaActiva(ruta)} ir={(r) => ir(r)} alMedir={setAlto} oculta={!conBarra} />
      </View>
    </ProveedorDeApariencia>
  );
}

AppRegistry.registerComponent('maqueta', () => Maqueta);
AppRegistry.runApplication('maqueta', { rootTag: document.getElementById('root') });
