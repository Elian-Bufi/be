/**
 * Inicio · la tarjeta de Nutrición (DL-117): el plan de hoy y lo registrado hoy, como dos cosas distintas. Un registro no
 * se presenta como una comida del plan, y no hay marcas de progreso. El día del plan es la misma elección de Nutrición.
 *
 * Dos lecturas, cada una con su ciclo (cierre del 2026-10-04):
 * - «Hoy» (API-NUT-14), con la misma clave que Nutrición. La tarjeta se puede usar en cuanto llega.
 * - Si hoy no hay registros (`pideElUltimoRegistro`), el último registro (API-NUT-16-LISTA con `limit` 1). Llega
 *   después y no demora la tarjeta. Antes la tarjeta lo esperaba, aunque el documento decía que solo demoraba el renglón.
 *   Su renglón y su botón van **debajo de las acciones**: así, cuando llegan, no corren «Registrar» bajo el dedo.
 */
import { COPY_NUTRICION, type HoyResponse, type Ingesta, type Resultado } from '@be/domain';
import { useCallback, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { SinActualizar } from '../estados';
import { fechaCivil } from '../formato';
import { useLecturaRecordada, useSeleccionRecordada } from '../lecturas';
import { leerUltimoRegistro, pideElUltimoRegistro, sinRegistrosDeHoy, textoDeRegistrosDeHoy } from '../lecturas-de-inicio';
import type { Ir } from '../navegacion';
import { Boton, Parrafo } from '../ui';
import { Accion, Acciones, estilos, faltaElA3, NoSePudo, SinA3, TarjetaDeInicio, Verificando, type AlPerderLaSesion } from './tarjeta-de-inicio';

/** API-NUT-14 con el día del plan elegido, que es la misma elección y la misma clave de Nutrición. */
export function NutricionDeHoy({ token, dia, sesionPerdida, ir }: { token: string; dia: string; sesionPerdida: AlPerderLaSesion; ir: Ir }) {
  const [diaTipo, setDiaTipo] = useSeleccionRecordada<string | undefined>(token, 'hoy-nutricional:dia', undefined);
  const pedir = useCallback((): Promise<Resultado<HoyResponse>> => api.hoyNutricional(token, diaTipo), [token, diaTipo]);
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, `hoy-nutricional:${dia}:${diaTipo ?? ''}`, pedir, sesionPerdida);
  let contenido: ReactNode;
  if (!r) contenido = <Verificando />;
  else if (faltaElA3(r)) contenido = <SinA3 texto={COPY_NUTRICION.hoyNecesitaA3} ir={ir} />;
  else if (!r.ok) contenido = <NoSePudo falla={r} reintentar={() => void cargar()} />;
  else contenido = <ContenidoDeNutricion hoy={r.datos.data} token={token} sesionPerdida={sesionPerdida} elegirDia={setDiaTipo} ir={ir} />;
  return (
    <TarjetaDeInicio zona="nutricion" titulo="Nutrición de hoy">
      {contenido}
      <SinActualizar visible={sinActualizar} onReintentar={() => void cargar()} />
      <Boton texto="Ir a Nutrición" tipo="enlace" onPress={() => ir({ nombre: 'hoy' })} />
    </TarjetaDeInicio>
  );
}

function ContenidoDeNutricion({
  hoy,
  token,
  sesionPerdida,
  elegirDia,
  ir,
}: {
  hoy: HoyResponse['data'];
  token: string;
  sesionPerdida: AlPerderLaSesion;
  elegirDia: (id: string | undefined) => void;
  ir: Ir;
}) {
  const plan = hoy.activePlan;
  const diaDelPlan = plan?.dayTypes.find((d) => d.dayTypeId === hoy.selectedDayTypeId) ?? null;
  const registros = hoy.registeredIntake;
  // El último de hoy por momento de registro, para abrirlo.
  const ultimoDeHoy = registros.reduce<Ingesta | null>((a, b) => (a === null || b.recordedAt > a.recordedAt ? b : a), null);
  const acciones = plan ? (
    <Acciones>
      <Accion>
        <Boton texto="Registrar" onPress={() => ir({ nombre: 'hoy', accion: 'registrar' })} />
      </Accion>
      <Accion>
        <Boton texto="Ver el plan" tipo="secundario" onPress={() => ir({ nombre: 'plan-actual' })} />
      </Accion>
    </Acciones>
  ) : null;
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

      {/* Lo registrado hoy, aparte del plan: son registros, no comidas del plan. Sin registros hoy, el último registro
          se lee aparte y completa la tarjeta debajo de las acciones. */}
      {pideElUltimoRegistro(hoy) ? (
        <SinRegistrosHoy token={token} sesionPerdida={sesionPerdida} ir={ir} acciones={acciones} />
      ) : (
        <>
          <Parrafo>{textoDeRegistrosDeHoy(registros)}</Parrafo>
          {acciones}
          {ultimoDeHoy ? <Boton texto="Ver el último registro" tipo="secundario" onPress={() => ir({ nombre: 'registro-nutricional', id: ultimoDeHoy.executionId })} /> : null}
        </>
      )}
    </>
  );
}

/**
 * Sin registros hoy: lo dice enseguida, arriba de las acciones, y cuando llega el último registro agrega su fecha y el
 * botón para abrirlo, debajo de ellas (`sinRegistrosDeHoy`). Si nunca hubo uno, el texto de arriba lo dice en su lugar.
 */
function SinRegistrosHoy({ token, sesionPerdida, ir, acciones }: { token: string; sesionPerdida: AlPerderLaSesion; ir: Ir; acciones: ReactNode }) {
  const pedir = useCallback(() => leerUltimoRegistro(api, token), [token]);
  const { r } = useLecturaRecordada(token, 'inicio-ultimo-registro', pedir, sesionPerdida);
  const { texto, ultimo } = sinRegistrosDeHoy(r, fechaCivil);
  return (
    <>
      <Parrafo>{texto}</Parrafo>
      {acciones}
      {ultimo ? (
        <>
          <Parrafo tenue>{ultimo.texto}</Parrafo>
          <Boton texto="Ver ese registro" tipo="secundario" onPress={() => ir({ nombre: 'registro-nutricional', id: ultimo.executionId })} />
        </>
      ) : null}
    </>
  );
}
