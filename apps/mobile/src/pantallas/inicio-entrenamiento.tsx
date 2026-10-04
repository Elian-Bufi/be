/**
 * Inicio · las tarjetas de Entrenamiento (DL-117): las sesiones de hoy con su estado real, y la actividad de los últimos
 * 30 días. Abrir un borrador usa el mismo circuito de Entrenamiento de hoy (`useAbrirOcurrencia`) y va solo al tocar.
 */
import { COPY_ENTRENAMIENTO, numero, vistaDeOcurrencia, type HoyDeEntrenamientoResponse, type Ocurrencia, type Resultado } from '@be/domain';
import { useCallback, useMemo, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { SinActualizar } from '../estados';
import { fechaCivil, ultimosDiasHasta } from '../formato';
import { useLecturaRecordada } from '../lecturas';
import { detalleDeActividad, DIAS_DE_ACTIVIDAD, leerActividadDeEntrenamiento } from '../lecturas-de-inicio';
import { useAccesoRetirado, type Ir } from '../navegacion';
import { Aviso, Boton, Cifra, Insignia, Parrafo } from '../ui';
import { useAbrirOcurrencia } from './entrenamiento';
import { estilos, faltaElA3, NoSePudo, SinA3, TarjetaDeInicio, Verificando, type AlPerderLaSesion } from './tarjeta-de-inicio';

/** API-TRN-14, con la misma clave que Entrenamiento de hoy. Sin el A3, la API responde «no disponible», no un 403. */
export function EntrenamientoDeHoy({ token, dia, sesionPerdida, ir }: { token: string; dia: string; sesionPerdida: AlPerderLaSesion; ir: Ir }) {
  const pedir = useCallback((): Promise<Resultado<HoyDeEntrenamientoResponse>> => api.hoyDeEntrenamiento(token), [token]);
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, `entrenamiento-hoy:${dia}`, pedir, sesionPerdida);
  // Abrir un borrador es una escritura: con el 404 no revelador, la tarjeta retira lo que mostraba (B10-06:1145-1148).
  const { retirado, accesoRetirado } = useAccesoRetirado();
  let contenido: ReactNode;
  if (retirado) contenido = <Parrafo>{COPY_ENTRENAMIENTO.planNoDisponible}</Parrafo>;
  else if (!r) contenido = <Verificando />;
  else if (!r.ok) contenido = <NoSePudo falla={r} reintentar={() => void cargar()} />;
  else {
    const hoy = r.datos.data;
    if (hoy.planState === 'NO_ACTIVE_PLAN') contenido = <Parrafo>{COPY_ENTRENAMIENTO.sinPlanAsesorado}</Parrafo>;
    else if (hoy.planState === 'NOT_AVAILABLE')
      contenido = (
        <>
          <Parrafo>{COPY_ENTRENAMIENTO.planNoDisponible}</Parrafo>
          <Boton texto="Ver tus vínculos" tipo="secundario" onPress={() => ir({ nombre: 'vinculos' })} />
        </>
      );
    else if (hoy.occurrences.length === 0) contenido = <Parrafo>Tu plan no tiene sesiones para hoy.</Parrafo>;
    else
      contenido = (
        <>
          {hoy.occurrences.length > 1 ? <Parrafo tenue>Tu plan tiene varias sesiones. Elegí la que hiciste o vas a hacer.</Parrafo> : null}
          {hoy.occurrences.map((o) => (
            <SesionDeHoy key={o.occurrenceId} ocurrencia={o} hoy={hoy.date} token={token} sesionPerdida={sesionPerdida} accesoRetirado={accesoRetirado} ir={ir} />
          ))}
        </>
      );
  }
  return (
    <TarjetaDeInicio zona="entrenamiento" titulo={COPY_ENTRENAMIENTO.entrenamientoDeHoy}>
      {contenido}
      <SinActualizar visible={sinActualizar} onReintentar={() => void cargar()} />
      <Boton texto="Ir a Entrenamiento" tipo="enlace" onPress={() => ir({ nombre: 'entrenamiento' })} />
    </TarjetaDeInicio>
  );
}

/** Una sesión de hoy con su estado real. «Registrada · No realizada» no se presenta como hecha. */
function SesionDeHoy({
  ocurrencia: o,
  hoy,
  token,
  sesionPerdida,
  accesoRetirado,
  ir,
}: {
  ocurrencia: Ocurrencia;
  hoy: string;
  token: string;
  sesionPerdida: AlPerderLaSesion;
  accesoRetirado: (r: Resultado<unknown>) => boolean;
  ir: Ir;
}) {
  const { abriendo, fallo, abrir } = useAbrirOcurrencia({ ocurrencia: o, token, sesionPerdida, accesoRetirado, ir });
  const vista = vistaDeOcurrencia(o, hoy);
  const ejercicios = o.plannedSession.prescriptions.length;
  const executionId = o.execution.state === 'REGISTERED' ? o.execution.executionId : null;
  return (
    <View style={estilos.fila}>
      <Text style={estilos.nombre}>{o.plannedSession.label}</Text>
      <Text style={estilos.detalle}>
        {[o.plannedSession.blockLabel, o.plannedSession.microcycleLabel, `${numero(ejercicios)} ${ejercicios === 1 ? 'ejercicio' : 'ejercicios'}`].filter(Boolean).join(' · ')}
      </Text>
      <Insignia texto={vista.texto} positiva={vista.registrada} etiqueta="Estado" />
      {fallo ? <Aviso tipo="error" titulo={fallo} /> : null}
      {executionId ? (
        <Boton texto="Ver registro" tipo="secundario" onPress={() => ir({ nombre: 'ejecucion-de-entrenamiento', id: executionId })} />
      ) : (
        <Boton texto={o.execution.state === 'DRAFT_IN_PROGRESS' ? COPY_ENTRENAMIENTO.continuarSesion : COPY_ENTRENAMIENTO.comenzarSesion} onPress={() => void abrir()} ocupado={abriendo} />
      )}
    </View>
  );
}

// ─── Actividad de entrenamiento ─────────────────────────────────────────────────────────────────

/** API-TRN-19-LISTA, la lista de «Tu historial», de los últimos 30 días: solo se cuenta. */
export function ActividadDeEntrenamiento({ token, dia, sesionPerdida, ir }: { token: string; dia: string; sesionPerdida: AlPerderLaSesion; ir: Ir }) {
  const periodo = useMemo(() => ultimosDiasHasta(dia, DIAS_DE_ACTIVIDAD), [dia]);
  const pedir = useCallback(() => leerActividadDeEntrenamiento(api, token, periodo), [token, periodo]);
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, `inicio-actividad:${periodo.periodStart}:${periodo.periodEnd}`, pedir, sesionPerdida);
  let contenido: ReactNode;
  if (!r) contenido = <Verificando />;
  else if (faltaElA3(r)) contenido = <SinA3 texto={COPY_ENTRENAMIENTO.historialNecesitaA3} ir={ir} />;
  else if (!r.ok) contenido = <NoSePudo falla={r} reintentar={() => void cargar()} />;
  else {
    const a = r.datos;
    const filas: readonly [string, number][] = [
      ['Realizadas', a.realizadas],
      ['Realizadas con desvío', a.conDesvio],
      ['Registradas como no realizadas', a.noRealizadas],
    ];
    contenido =
      a.registradas === 0 ? (
        <Parrafo>No registraste sesiones en estos días.</Parrafo>
      ) : (
        <>
          <Cifra valor={numero(a.registradas)} unidad={a.registradas === 1 ? 'sesión registrada' : 'sesiones registradas'} tamano={26} />
          {filas
            .filter(([, n]) => n > 0)
            .map(([texto, n]) => (
              <View key={texto} style={estilos.parDeDato} accessible accessibilityLabel={`${texto}: ${numero(n)}`}>
                <Text style={estilos.textoDeDato}>{texto}</Text>
                <Text style={estilos.valorDeDato}>{numero(n)}</Text>
              </View>
            ))}
          {a.corregidas > 0 ? (
            <Parrafo tenue>{`${numero(a.corregidas)} ${a.corregidas === 1 ? 'sesión tiene una corrección: cuenta como quedó corregida.' : 'sesiones tienen una corrección: cuentan como quedaron corregidas.'}`}</Parrafo>
          ) : null}
          {a.sinOrdenar > 0 ? (
            <Parrafo tenue>{`${numero(a.sinOrdenar)} ${a.sinOrdenar === 1 ? 'sesión tiene correcciones que no se pueden ordenar: cuenta como se registró.' : 'sesiones tienen correcciones que no se pueden ordenar: cuentan como se registraron.'} El detalle está en Tu historial.`}</Parrafo>
          ) : null}
        </>
      );
  }
  return (
    <TarjetaDeInicio
      zona="entrenamiento"
      titulo="Tu actividad"
      detalle={detalleDeActividad(r && r.ok ? r.datos.periodo : null, fechaCivil)}
    >
      {contenido}
      <SinActualizar visible={sinActualizar} onReintentar={() => void cargar()} />
      <Boton texto="Ver tu historial" tipo="enlace" onPress={() => ir({ nombre: 'historial-de-entrenamiento' })} />
    </TarjetaDeInicio>
  );
}
