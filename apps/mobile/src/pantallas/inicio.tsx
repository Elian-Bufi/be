/**
 * APK · Inicio (DL-117, decisión de Dirección del 2026-10-04): la entrada después de iniciar sesión o de recuperar una
 * sesión guardada válida. Reúne lo disponible de los módulos: qué hay para hoy, qué se registró, qué información reciente
 * se puede consultar y qué espera una respuesta. No es el dashboard profesional ni agrega permisos. La matriz de datos
 * está en docs/ux/INICIO-Y-NAVEGACION.md §2.
 *
 * - Cada tarjeta lee una operación que ya existe, con el mismo permiso que en su módulo, y verifica antes de mostrar
 *   (G2 de `ciclo-de-lectura.ts`): mientras la API no confirma, dibuja su estructura sin valores.
 * - Cada tarjeta carga sola. Una falla o una lectura lenta no vacía ni frena a las demás, y cada una tiene su
 *   «Reintentar». Dos lecturas las hace la pantalla y las comparte, para no pedirlas dos veces: la sesión de hoy
 *   (API-TRN-14), para Entrenamiento y la tira, y la actividad de 30 días (API-TRN-19-LISTA), para la tira y «Actividad».
 * - Inicio no escribe. «Empezar» y «Continuar» abren el borrador con el mismo circuito de Entrenamiento de hoy
 *   (`useAbrirOcurrencia`), y solo cuando la persona los toca (API-TRN-15).
 * - BE no elige por la persona la sesión ni el día del plan (DL-077, DL-049): si hay varios, la tarjeta pide la elección.
 * - Nada califica (TEST-PRJ-009): una cuenta es una cuenta, con su período y su criterio, sin porcentajes ni marcas de
 *   progreso. Se celebra lo hecho, sin rachas, y lo no hecho queda neutro. Un registro de comida no se presenta como una
 *   comida del plan.
 * - El día es el de la API: a la medianoche cambia, y las tarjetas de hoy vuelven a leer (`useDiaDeLaApi`).
 * - Desde DL-170 (WP-APP-VUELTA-2 AV2-07, la maqueta de §1.1): el título es la fecha («Lunes 9 de noviembre»), sin
 *   «Hola»; de arriba abajo, el paso que falta para el acceso (si hace falta), la tira de la semana, Entrenamiento,
 *   Comidas, «Para responder» (si hay algo) y, lado a lado, la medida de la última toma y la actividad (en una columna
 *   con letra ×1,3). Sin el rótulo «Para mirar». Es la única pantalla con el vidrio prendido hasta el visto bueno de
 *   Dirección (App.tsx).
 */
import { useCallback, useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { api } from '../api';
import { useDiaDeLaApi } from '../dia-de-la-api';
import { fechaLarga, ultimosDiasHasta } from '../formato';
import { anchoDeLaColumna, registradasHoySegunElPlan, tiraDeLaSemana } from '../inicio-de-hoy';
import { useLecturaRecordada } from '../lecturas';
import { DIAS_DE_ACTIVIDAD, leerActividadDeEntrenamiento } from '../lecturas-de-inicio';
import { useSesionPerdida, type Ir, type Salida } from '../navegacion';
import { estilosPorTema, Titulo } from '../ui';
import { AccesoIncompleto } from './inicio-acceso';
import { ActividadDeEntrenamiento, EntrenamientoDeHoy } from './inicio-entrenamiento';
import { Pendientes } from './inicio-informacion';
import { Mediciones } from './inicio-mediciones';
import { NutricionDeHoy } from './inicio-nutricion';
import { TiraDeLaSemana } from './tira-de-la-semana';

export function PantallaDeInicio({ token, salir, ir }: { token: string; salir: (m: Salida) => void; ir: Ir }) {
  const sesionPerdida = useSesionPerdida(salir);
  const hoy = useDiaDeLaApi();
  // La sesión de hoy (API-TRN-14), con la misma clave que Entrenamiento: para su tarjeta y para lo de hoy en la tira.
  const pedirHoy = useCallback(() => api.hoyDeEntrenamiento(token), [token]);
  const entrenamientoDeHoy = useLecturaRecordada(token, `entrenamiento-hoy:${hoy}`, pedirHoy, sesionPerdida);
  // La actividad de 30 días (API-TRN-19-LISTA), con la misma clave que «Tu historial»: para la tira y para «Actividad».
  const periodo = useMemo(() => ultimosDiasHasta(hoy, DIAS_DE_ACTIVIDAD), [hoy]);
  const pedirActividad = useCallback(() => leerActividadDeEntrenamiento(api, token, periodo), [token, periodo]);
  const actividad = useLecturaRecordada(token, `inicio-actividad:${periodo.periodStart}:${periodo.periodEnd}`, pedirActividad, sesionPerdida);
  const ocurrencias = entrenamientoDeHoy.r?.ok ? entrenamientoDeHoy.r.datos.data : null;
  const tira = tiraDeLaSemana(hoy, actividad.r?.ok ? actividad.r.datos : null, ocurrencias ? registradasHoySegunElPlan(hoy, ocurrencias.occurrences) : null);
  // Sin plan de entrenamiento y sin nada hecho esta semana, la tira no dice nada: no se dibuja.
  const conTira = !(ocurrencias?.planState === 'NO_ACTIVE_PLAN' && !tira.realizadas);
  // Lado a lado con letra ×1; en una columna con ×1,3 o en un teléfono angosto (AV2-07).
  const { width, fontScale } = useWindowDimensions();
  const anchoChico = anchoDeLaColumna(width, fontScale, false);
  return (
    <View>
      <Titulo>{fechaLarga(hoy)}</Titulo>
      <AccesoIncompleto token={token} sesionPerdida={sesionPerdida} ir={ir} />
      {conTira ? <TiraDeLaSemana tira={tira} /> : null}
      <EntrenamientoDeHoy token={token} dia={hoy} lectura={entrenamientoDeHoy} sesionPerdida={sesionPerdida} ir={ir} />
      <NutricionDeHoy token={token} sesionPerdida={sesionPerdida} ir={ir} />
      {/* DL-166 (PV-6): los formularios y los pedidos de hábitos juntos; sin nada para responder, no se dibuja. */}
      <Pendientes token={token} sesionPerdida={sesionPerdida} ir={ir} />
      {/* Al final, lado a lado, lo que se mira: la medida de la última toma y la actividad, como dato y sin calificar. */}
      <View style={estilos.parDeTarjetas}>
        <Mediciones token={token} sesionPerdida={sesionPerdida} ir={ir} ancho={anchoChico} />
        <ActividadDeEntrenamiento lectura={actividad} ir={ir} ancho={anchoChico} />
      </View>
    </View>
  );
}

const estilos = estilosPorTema(() => ({
  parDeTarjetas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'stretch' },
}));
