/**
 * APK · Entrenamiento → Plan (WP-ENTRENAMIENTO-SERIES §7.1): las sesiones del plan vigente en su orden, con sus
 * ejercicios, sus imágenes y los objetivos de cada serie (API-SER-02), en solo lectura.
 *
 * No hay calendario ni días de descanso: BE no asigna sesiones a días (DL-077), y la referencia 03 vale solo para la
 * composición (excepción 3 de `REFERENCIAS_VISUALES.md`). Cada sesión se lee al abrirla, no todas de entrada. Si API-SER-02
 * no responde, se muestran los objetivos generales de cada ejercicio, y se dice.
 */
import { COPY_ENTRENAMIENTO, COPY_ENTRENAMIENTO_POR_SERIE, type HoyDeEntrenamientoResponse, type Ocurrencia, type PrescripcionConObjetivos, type Resultado } from '@be/domain';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { Cargando } from '../estados';
import { ImagenDeMedio } from '../imagen-de-medio';
import { useLecturaRecordada } from '../lecturas';
import { bandaDeLaSerie, basesDeLaPrescripcion, ejerciciosYSeries, sesionDesdeLaOcurrencia } from '../series-de-la-sesion';
import { Aviso, Boton, Dato, Desplegable, estilosPorTema, Parrafo } from '../ui';
import { RESPALDO_DE_EJERCICIO, TecnicaDelEjercicio } from './sesion-enfocada';

type AlPerderLaSesion = (r: Resultado<unknown>) => boolean;

export function PlanPorSerie({ token, hoy, sesionPerdida }: { token: string; hoy: HoyDeEntrenamientoResponse['data']; sesionPerdida: AlPerderLaSesion }) {
  // Solo las sesiones de la versión vigente: «Hoy» puede traer también la de una versión anterior con un borrador de hoy.
  const vigente = hoy.activePlan?.planId ?? null;
  const sesiones = hoy.occurrences.filter((o) => vigente === null || o.planId === vigente);
  return (
    <View>
      <Parrafo tenue>Las sesiones de tu plan, en su orden. Es para consultar: los objetivos de cada serie son los que planificó tu profesional.</Parrafo>
      {sesiones.map((o) => (
        <Desplegable key={o.occurrenceId} titulo={o.plannedSession.label} detalle={ejerciciosYSeries(o.plannedSession.prescriptions)}>
          <DetalleDeLaSesion ocurrencia={o} token={token} sesionPerdida={sesionPerdida} />
        </Desplegable>
      ))}
      {sesiones.length === 0 ? <Parrafo>{COPY_ENTRENAMIENTO.planSinSesiones}</Parrafo> : null}
    </View>
  );
}

function DetalleDeLaSesion({ ocurrencia, token, sesionPerdida }: { ocurrencia: Ocurrencia; token: string; sesionPerdida: AlPerderLaSesion }) {
  const pedir = useCallback(() => api.sesionParaRegistrar(token, ocurrencia.occurrenceId), [token, ocurrencia.occurrenceId]);
  const { r, cargar } = useLecturaRecordada(token, `entrenamiento-sesion:${ocurrencia.occurrenceId}`, pedir, sesionPerdida);
  const [tecnica, setTecnica] = useState<string | null>(null);
  if (!r) return <Cargando />;
  const sesion = r.ok ? r.datos.data.session : sesionDesdeLaOcurrencia(ocurrencia.plannedSession);
  const elegida = sesion.prescriptions.find((p) => p.prescriptionId === tecnica) ?? null;
  return (
    <View>
      {r.ok ? null : (
        <Aviso tipo="info" titulo="No pudimos leer los objetivos de cada serie. Se muestran los generales de cada ejercicio.">
          <Boton texto={COPY_ENTRENAMIENTO_POR_SERIE.reintentar} tipo="secundario" onPress={() => void cargar()} />
        </Aviso>
      )}
      {sesion.instructions ? <Dato etiqueta={COPY_ENTRENAMIENTO.indicacionesDeLaSesion} valor={sesion.instructions} /> : null}
      {sesion.prescriptions.map((p) => (
        <PrescripcionDelPlan key={p.prescriptionId} prescripcion={p} token={token} sesionPerdida={sesionPerdida} onVerTecnica={() => setTecnica(p.prescriptionId)} />
      ))}
      {sesion.prescriptions.length === 0 ? <Parrafo tenue>{COPY_ENTRENAMIENTO.sinPrescripciones}</Parrafo> : null}
      <TecnicaDelEjercicio visible={elegida !== null} prescripcion={elegida} token={token} sesionPerdida={sesionPerdida} onCerrar={() => setTecnica(null)} />
    </View>
  );
}

function PrescripcionDelPlan({ prescripcion: p, token, sesionPerdida, onVerTecnica }: { prescripcion: PrescripcionConObjetivos; token: string; sesionPerdida: AlPerderLaSesion; onVerTecnica: () => void }) {
  const bases = basesDeLaPrescripcion(p);
  return (
    <View style={estilos.prescripcion}>
      <View style={estilos.cabeza}>
        <ImagenDeMedio token={token} mediaId={p.image?.mediaId ?? null} sesionPerdida={sesionPerdida} rotulo={p.image?.altText || p.exerciseName} tamano={64} respaldo={RESPALDO_DE_EJERCICIO} respaldoCompacto rotuloVisible={false} />
        <View style={estilos.datos}>
          <Text style={estilos.nombre} accessibilityRole="header">
            {p.exerciseName}
          </Text>
          {bases.carga ? <Text style={estilos.detalle}>{`Carga: ${bases.carga}`}</Text> : null}
          {bases.repeticiones ? <Text style={estilos.detalle}>{`Repeticiones: ${bases.repeticiones}`}</Text> : null}
          <Boton texto={COPY_ENTRENAMIENTO_POR_SERIE.verTecnica} tipo="enlace" onPress={onVerTecnica} />
        </View>
      </View>
      {p.sets.map((s) => {
        const banda = bandaDeLaSerie(s.setIndex, s.target);
        const texto = `${COPY_ENTRENAMIENTO.serie} ${s.setIndex}: ${banda.plan}${banda.descanso ? ` · ${banda.descanso}` : ''}${s.note ? ` · ${s.note}` : ''}`;
        return (
          <Text key={s.setIndex} style={estilos.serie}>
            {texto}
          </Text>
        );
      })}
      {p.sets.length === 0 ? <Text style={estilos.detalle}>Sin series planificadas.</Text> : null}
      {p.note ? <Text style={estilos.detalle}>{`${COPY_ENTRENAMIENTO.notas}: ${p.note}`}</Text> : null}
    </View>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  prescripcion: { borderTopWidth: 1, borderTopColor: COLOR.borde, paddingVertical: 10 },
  cabeza: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12 },
  datos: { flex: 1, minWidth: 160 },
  nombre: { fontSize: 17, fontWeight: '800', color: COLOR.texto },
  detalle: { fontSize: 14, lineHeight: 20, color: COLOR.tenue },
  serie: { fontSize: 15, lineHeight: 22, color: COLOR.texto, marginTop: 4 },
}));
