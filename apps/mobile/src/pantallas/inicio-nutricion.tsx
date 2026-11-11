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
import { COPY_NUTRICION, type HoyResponse, type Resultado } from '@be/domain';
import { useCallback, type ReactNode } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { api } from '../api';
import { SinActualizar } from '../estados';
import { fechaCivil, hora } from '../formato';
import { Icono } from '../icono';
import { comidasDeHoy, formaDelArea } from '../inicio-de-hoy';
import { TEXTOS_DE_LA_VUELTA } from '../textos-de-la-vuelta';
import { useLecturaRecordada, useSeleccionRecordada } from '../lecturas';
import { leerUltimoRegistro, pideElUltimoRegistro, sinRegistrosDeHoy } from '../lecturas-de-inicio';
import type { Ir } from '../navegacion';
import { Boton, estilosPorTema, Parrafo } from '../ui';
import { Accion, Acciones, estilos, faltaElA3, LineaDeInicio, NoSePudo, SinA3, TarjetaDeInicio, Verificando, type AlPerderLaSesion } from './tarjeta-de-inicio';

/** API-NUT-14 con el día del plan elegido, que es la misma elección y la misma clave de Nutrición. */
export function NutricionDeHoy({ token, dia, sesionPerdida, ir }: { token: string; dia: string; sesionPerdida: AlPerderLaSesion; ir: Ir }) {
  const [diaTipo, setDiaTipo] = useSeleccionRecordada<string | undefined>(token, 'hoy-nutricional:dia', undefined);
  const pedir = useCallback((): Promise<Resultado<HoyResponse>> => api.hoyNutricional(token, diaTipo), [token, diaTipo]);
  const { r, cargar, sinActualizar } = useLecturaRecordada(token, `hoy-nutricional:${dia}:${diaTipo ?? ''}`, pedir, sesionPerdida);
  let contenido: ReactNode;
  if (!r) contenido = <Verificando />;
  else if (faltaElA3(r)) contenido = <SinA3 texto={COPY_NUTRICION.hoyNecesitaA3} ir={ir} />;
  else if (!r.ok) contenido = <NoSePudo falla={r} reintentar={() => void cargar()} />;
  else if (formaDelArea(r.datos.data.planState) === 'linea') return <LineaDeInicio zona="nutricion" texto={COPY_NUTRICION.sinPlanAsesorado} />;
  else contenido = <ContenidoDeNutricion hoy={r.datos.data} token={token} sesionPerdida={sesionPerdida} elegirDia={setDiaTipo} ir={ir} />;
  // DL-166 (AV-06): «Comidas», con el día del plan, y las comidas como fichas. Sin «Ir a Nutrición»: la barra lleva ahí.
  const diaElegido = r?.ok ? (r.datos.data.activePlan?.dayTypes.find((d) => d.dayTypeId === r.datos.data.selectedDayTypeId)?.label ?? undefined) : undefined;
  return (
    <TarjetaDeInicio zona="nutricion" titulo={TEXTOS_DE_LA_VUELTA.comidas} detalle={diaElegido}>
      {contenido}
      <SinActualizar visible={sinActualizar} onReintentar={() => void cargar()} />
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
  // DL-166 (PV-2): las comidas como fichas, en el orden del plan, con «la que sigue» marcada. Sin día elegido, no hay.
  const comidas = comidasDeHoy(diaDelPlan, registros, hora);
  const { width, fontScale } = useWindowDimensions();
  // Dos fichas por fila; con letra grande, una (no se achica la letra: cambia la composición). El ancho útil es la pantalla
  // menos el relleno del contenido (20 de cada lado) y el de la tarjeta (16 de cada lado); entre fichas, 8.
  const util = width - 72;
  const anchoDeFicha = fontScale >= 1.3 || width < 340 ? util : Math.floor((util - 8) / 2);
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
      {comidas ? (
        <View style={estilosDeFichas.fichas}>
          {comidas.fichas.map((f) => (
            <Pressable
              key={f.mealId}
              accessibilityRole="button"
              accessibilityLabel={f.paraLeer}
              onPress={() => (f.executionId ? ir({ nombre: 'registro-nutricional', id: f.executionId }) : ir({ nombre: 'hoy', accion: 'registrar' }))}
              style={({ pressed }) => [estilosDeFichas.ficha, { width: anchoDeFicha }, f.estado === 'la-que-sigue' && estilosDeFichas.laQueSigue, pressed && estilosDeFichas.presionada]}
            >
              <View style={estilosDeFichas.cabezaDeFicha}>
                <Text style={estilosDeFichas.nombre}>{f.nombre}</Text>
                {f.estado === 'registrada' ? <Icono nombre="tilde" tamano={20} tono="acento" /> : f.estado === 'la-que-sigue' ? <Icono nombre="mas" tamano={20} tono="acento" /> : null}
              </View>
              <Text style={f.estado === 'la-que-sigue' ? estilosDeFichas.registrar : estilos.detalle}>
                {f.estado === 'registrada' ? TEXTOS_DE_LA_VUELTA.registrada(f.hora ?? '') : f.estado === 'la-que-sigue' ? TEXTOS_DE_LA_VUELTA.registrar : TEXTOS_DE_LA_VUELTA.opciones(f.opciones)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {comidas && comidas.fueraDelPlan > 0 ? <Parrafo tenue>{TEXTOS_DE_LA_VUELTA.fueraDelPlan(comidas.fueraDelPlan)}</Parrafo> : null}
      {plan && diaDelPlan ? <Boton texto="Ver el plan" tipo="enlace" icono="derecha" iconoAlFinal onPress={() => ir({ nombre: 'plan-actual' })} /> : null}
      {plan && diaDelPlan && plan.dayTypes.length > 1 ? <Boton texto="Cambiar el día del plan" tipo="enlace" onPress={() => elegirDia(undefined)} /> : null}

      {/* Sin registros hoy, el último registro se lee aparte y queda en una línea tenue, para abrirlo. */}
      {pideElUltimoRegistro(hoy) && plan ? <SinRegistrosHoy token={token} sesionPerdida={sesionPerdida} ir={ir} /> : null}
    </>
  );
}

/**
 * Sin registros hoy: lo dice enseguida, arriba de las acciones, y cuando llega el último registro agrega su fecha y el
 * botón para abrirlo, debajo de ellas (`sinRegistrosDeHoy`). Si nunca hubo uno, el texto de arriba lo dice en su lugar.
 */
function SinRegistrosHoy({ token, sesionPerdida, ir }: { token: string; sesionPerdida: AlPerderLaSesion; ir: Ir }) {
  const pedir = useCallback(() => leerUltimoRegistro(api, token), [token]);
  const { r } = useLecturaRecordada(token, 'inicio-ultimo-registro', pedir, sesionPerdida);
  const { ultimo } = sinRegistrosDeHoy(r, fechaCivil);
  return ultimo ? <Boton texto={ultimo.texto} tipo="enlace" icono="lista" onPress={() => ir({ nombre: 'registro-nutricional', id: ultimo.executionId })} /> : null;
}

const estilosDeFichas = estilosPorTema((COLOR) => ({
  fichas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, marginTop: 6 },
  ficha: { minHeight: 64, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.superficieElevada },
  // «La que sigue»: el borde del acento, más grueso. El texto «Registrar» dice lo mismo: el borde no es la única señal.
  laQueSigue: { borderWidth: 2, borderColor: COLOR.acento },
  presionada: { opacity: 0.6 },
  cabezaDeFicha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  nombre: { fontSize: 16, fontWeight: '800', color: COLOR.texto, flexShrink: 1 },
  registrar: { fontSize: 14, fontWeight: '700', color: COLOR.acento },
}));
