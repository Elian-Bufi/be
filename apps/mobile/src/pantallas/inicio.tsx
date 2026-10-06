/**
 * APK · Inicio (DL-117, decisión de Dirección del 2026-10-04): la entrada después de iniciar sesión o de recuperar una
 * sesión guardada válida. Reúne lo disponible de los módulos: qué hay para hoy, qué se registró, qué información reciente
 * se puede consultar y qué espera una respuesta. No es el dashboard profesional ni agrega permisos. La matriz de datos
 * está en docs/ux/INICIO-Y-NAVEGACION.md §2.
 *
 * - Cada tarjeta lee una operación que ya existe, con el mismo permiso que en su módulo, y verifica antes de mostrar
 *   (G2 de `ciclo-de-lectura.ts`): mientras la API no confirma, dibuja su estructura sin valores.
 * - Cada tarjeta carga sola. Una falla o una lectura lenta no vacía ni frena a las demás, y cada una tiene su
 *   «Reintentar».
 * - Inicio no escribe. «Comenzar sesión» y «Continuar sesión» abren el borrador con el mismo circuito de Entrenamiento
 *   de hoy (`useAbrirOcurrencia`), y solo cuando la persona los toca (API-TRN-15).
 * - BE no elige por la persona la sesión ni el día del plan (DL-077, DL-049): si hay varios, la tarjeta pide la elección.
 * - Nada califica (TEST-PRJ-009): una cuenta es una cuenta, con su período y su criterio, sin porcentajes ni marcas de
 *   progreso. Un registro de comida no se presenta como una comida del plan.
 * - El saludo es neutro: el perfil no tiene nombre (DL-009, D-2).
 * - El día es el de la API: a la medianoche cambia, y las tarjetas de hoy vuelven a leer (`useDiaDeLaApi`).
 */
import { Text, View } from 'react-native';
import { useDiaDeLaApi } from '../dia-de-la-api';
import { fechaLarga } from '../formato';
import { useSesionPerdida, type Ir, type Salida } from '../navegacion';
import { Titulo } from '../ui';
import { ActividadDeEntrenamiento, EntrenamientoDeHoy } from './inicio-entrenamiento';
import { Pendientes } from './inicio-informacion';
import { Mediciones } from './inicio-mediciones';
import { NutricionDeHoy } from './inicio-nutricion';
import { estilos } from './tarjeta-de-inicio';

export function PantallaDeInicio({ token, salir, ir }: { token: string; salir: (m: Salida) => void; ir: Ir }) {
  const sesionPerdida = useSesionPerdida(salir);
  const hoy = useDiaDeLaApi();
  return (
    <View>
      <Titulo>Hola</Titulo>
      <Text style={estilos.fechaDeHoy}>{fechaLarga(hoy)}</Text>
      <EntrenamientoDeHoy token={token} dia={hoy} sesionPerdida={sesionPerdida} ir={ir} />
      <NutricionDeHoy token={token} dia={hoy} sesionPerdida={sesionPerdida} ir={ir} />
      <Pendientes token={token} sesionPerdida={sesionPerdida} ir={ir} />
      <ActividadDeEntrenamiento token={token} dia={hoy} sesionPerdida={sesionPerdida} ir={ir} />
      <Mediciones token={token} sesionPerdida={sesionPerdida} ir={ir} />
    </View>
  );
}
