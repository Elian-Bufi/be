/**
 * Inicio · la tarjeta de Nutrición (DL-117): el plan de hoy y lo registrado hoy, como dos cosas distintas. Un registro no
 * se presenta como una comida del plan, y no hay marcas de progreso. El día del plan es la misma elección de Nutrición.
 */
import { COPY_NUTRICION, type Ingesta } from '@be/domain';
import { useCallback, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { SinActualizar } from '../estados';
import { fechaCivil } from '../formato';
import { useLecturaRecordada, useSeleccionRecordada } from '../lecturas';
import { leerNutricionDeInicio, textoDeRegistrosDeHoy, type NutricionDeInicio } from '../lecturas-de-inicio';
import type { Ir } from '../navegacion';
import { Boton, Parrafo } from '../ui';
import { Accion, Acciones, estilos, faltaElA3, NoSePudo, SinA3, TarjetaDeInicio, Verificando, type AlPerderLaSesion } from './tarjeta-de-inicio';

/** API-NUT-14 con el día del plan elegido, que es la misma elección de Nutrición, y el último registro si hoy no hay. */
export function NutricionDeHoy({ token, dia, sesionPerdida, ir }: { token: string; dia: string; sesionPerdida: AlPerderLaSesion; ir: Ir }) {
  const [diaTipo, setDiaTipo] = useSeleccionRecordada<string | undefined>(token, 'hoy-nutricional:dia', undefined);
  const pedir = useCallback(() => leerNutricionDeInicio(api, token, diaTipo), [token, diaTipo]);
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, `inicio-nutricion:${dia}:${diaTipo ?? ''}`, pedir, sesionPerdida);
  let contenido: ReactNode;
  if (!r) contenido = <Verificando />;
  else if (faltaElA3(r)) contenido = <SinA3 texto={COPY_NUTRICION.hoyNecesitaA3} ir={ir} />;
  else if (!r.ok) contenido = <NoSePudo falla={r} reintentar={() => void cargar()} />;
  else contenido = <ContenidoDeNutricion datos={r.datos} elegirDia={setDiaTipo} ir={ir} />;
  return (
    <TarjetaDeInicio zona="nutricion" titulo="Nutrición de hoy">
      {contenido}
      <SinActualizar visible={sinActualizar} onReintentar={() => void cargar()} />
      <Boton texto="Ir a Nutrición" tipo="enlace" onPress={() => ir({ nombre: 'hoy' })} />
    </TarjetaDeInicio>
  );
}

function ContenidoDeNutricion({ datos: { hoy, ultimo }, elegirDia, ir }: { datos: NutricionDeInicio; elegirDia: (id: string | undefined) => void; ir: Ir }) {
  const plan = hoy.activePlan;
  const diaDelPlan = plan?.dayTypes.find((d) => d.dayTypeId === hoy.selectedDayTypeId) ?? null;
  const registros = hoy.registeredIntake;
  // El último de hoy por momento de registro, para abrirlo.
  const ultimoDeHoy = registros.reduce<Ingesta | null>((a, b) => (a === null || b.recordedAt > a.recordedAt ? b : a), null);
  return (
    <>
      {hoy.planState === 'NO_ACTIVE_PLAN' ? <Parrafo>{COPY_NUTRICION.sinPlanAsesorado}</Parrafo> : null}
      {hoy.planState === 'NOT_AVAILABLE' ? (
        <>
          <Parrafo>{COPY_NUTRICION.planNoDisponible}</Parrafo>
          <Boton texto="Ver tus vínculos" tipo="secundario" onPress={() => ir({ nombre: 'vinculos' })} />
        </>
      ) : null}

      {/* El plan: el día que corresponde hoy. Con varios y ninguno elegido, se pide la elección (DL-049). */}
      {plan && !diaDelPlan ? (
        <View>
          <Text style={estilos.pregunta} accessibilityRole="header">
            {COPY_NUTRICION.elegiDiaTipo}
          </Text>
          <Acciones>
            {plan.dayTypes.map((d) => (
              <Accion key={d.dayTypeId}>
                <Boton texto={d.label} tipo="secundario" onPress={() => elegirDia(d.dayTypeId)} />
              </Accion>
            ))}
          </Acciones>
        </View>
      ) : null}
      {plan && diaDelPlan ? (
        <Text style={estilos.renglonDeDato}>
          {'Día del plan: '}
          <Text style={estilos.negrita}>{diaDelPlan.label}</Text>
        </Text>
      ) : null}
      {plan && diaDelPlan && plan.dayTypes.length > 1 ? <Boton texto="Cambiar el día del plan" tipo="enlace" onPress={() => elegirDia(undefined)} /> : null}

      {/* Lo registrado hoy, aparte del plan: son registros, no comidas del plan. */}
      {/* Si nunca hubo un registro, se dice eso solo: «hoy no» y «nunca» juntos repetían lo mismo. */}
      <Parrafo>{ultimo.tipo === 'nunca' ? 'Todavía no registraste ninguna comida.' : registros.length === 0 ? COPY_NUTRICION.sinRegistrosHoy : textoDeRegistrosDeHoy(registros)}</Parrafo>
      {ultimo.tipo === 'anterior' ? <Parrafo tenue>{`Tu último registro es del ${fechaCivil(ultimo.registro.localDate)}.`}</Parrafo> : null}

      {plan ? (
        <Acciones>
          <Accion>
            <Boton texto="Registrar" onPress={() => ir({ nombre: 'hoy', accion: 'registrar' })} />
          </Accion>
          <Accion>
            <Boton texto="Ver el plan" tipo="secundario" onPress={() => ir({ nombre: 'plan-actual' })} />
          </Accion>
        </Acciones>
      ) : null}
      {ultimoDeHoy ? <Boton texto="Ver el último registro" tipo="secundario" onPress={() => ir({ nombre: 'registro-nutricional', id: ultimoDeHoy.executionId })} /> : null}
      {!ultimoDeHoy && ultimo.tipo === 'anterior' ? (
        <Boton texto="Ver ese registro" tipo="secundario" onPress={() => ir({ nombre: 'registro-nutricional', id: ultimo.registro.executionId })} />
      ) : null}
    </>
  );
}
