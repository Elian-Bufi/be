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
 * - Arriba de todo, solo si hace falta: «Tu profesional todavía no puede ver tus datos» (`AccesoIncompleto`; Dirección,
 *   2026-10-17), con el paso que le falta a cada vínculo.
 * - Desde DL-166 (PV-2, PV-5 y PV-6; AV-06 y AV-17, 2026-11-07): tres bloques de acción —la sesión con «Empezar» y «Ya la
 *   hice» y su detalle plegado, las comidas como fichas con «la que sigue», y «Para responder»— y, al bajar, «Para mirar».
 *   Sin «Ir a…» repetidos: la barra ya lleva a cada módulo. Un área sin plan es una línea, y lo que no tiene nada no se
 *   dibuja.
 */
import { Text, View } from 'react-native';
import { useDiaDeLaApi } from '../dia-de-la-api';
import { fechaLarga } from '../formato';
import { Icono } from '../icono';
import { useSesionPerdida, type Ir, type Salida } from '../navegacion';
import { TEXTOS_DE_LA_VUELTA } from '../textos-de-la-vuelta';
import { Rotulo, Titulo } from '../ui';
import { AccesoIncompleto } from './inicio-acceso';
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
      <View style={estilos.filaDeLaFecha}>
        <Icono nombre="hoy" tamano={18} tono="tenue" />
        <Text style={estilos.fechaDeHoy}>{fechaLarga(hoy)}</Text>
      </View>
      <AccesoIncompleto token={token} sesionPerdida={sesionPerdida} ir={ir} />
      <EntrenamientoDeHoy token={token} dia={hoy} sesionPerdida={sesionPerdida} ir={ir} />
      <NutricionDeHoy token={token} sesionPerdida={sesionPerdida} ir={ir} />
      {/* DL-166 (PV-6): los formularios y los pedidos de hábitos juntos; sin nada para responder, no se dibuja. */}
      <Pendientes token={token} sesionPerdida={sesionPerdida} ir={ir} />
      {/* Al bajar, lo que se mira (maqueta 01): la última toma y la actividad de 30 días, como dato y sin calificar. */}
      <Rotulo>{TEXTOS_DE_LA_VUELTA.paraMirar}</Rotulo>
      <Mediciones token={token} sesionPerdida={sesionPerdida} ir={ir} />
      <ActividadDeEntrenamiento token={token} dia={hoy} sesionPerdida={sesionPerdida} ir={ir} />
    </View>
  );
}
