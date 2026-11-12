/**
 * Inicio · la tarjeta «Comidas» (DL-117, DL-166 y DL-170): las comidas del plan de hoy como fichas, con lo registrado y
 * «la que sigue». Un registro fuera del plan no se presenta como una comida del plan, y nada califica. El día del plan es
 * la misma elección de Nutrición.
 *
 * Dos lecturas, cada una con su ciclo (cierre del 2026-10-04):
 * - «Hoy» con opciones (API-ING-01), la misma lectura y la misma clave que Nutrición (`useLecturaDeHoyConOpciones`;
 *   AV2-13). Antes Inicio leía API-NUT-14, que no ve la «comida diferente»: la dejaba sin registrar y la contaba «fuera
 *   del plan» mientras Nutrición la mostraba registrada. Con la misma clave, lo que se registra en Nutrición se ve al
 *   volver, sin recargar.
 * - Si hoy no hay registros (`pideElUltimoRegistro`), el último registro (API-NUT-16-LISTA con `limit` 1). Llega después y
 *   no demora la tarjeta; su renglón va **debajo de las acciones**, para que al llegar no corra nada bajo el dedo.
 *
 * Las fichas (AV2-10, AV2-14; maqueta de §1.1), dos por fila y una con letra ×1,3:
 * - la registrada, con la tilde en `exito` y su hora («13:10»); «la que sigue», con el borde del acento, su tinte, el + y
 *   «Registrar»; las anteriores sin registrar, neutras («Sin registrar»); las que vienen, sus opciones;
 * - el ícono dice el estado, no la comida (AV2-T10): los nombres los escribe el profesional;
 * - cada ficha se toca y abre su comida en Nutrición; una registrada abre su registro.
 * El nombre del día va bajo «Comidas» solo si el plan tiene más de un tipo de día.
 */
import { COPY_NUTRICION, type HoyConOpcionesResponse } from '@be/domain';
import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { api } from '../api';
import { SinActualizar } from '../estados';
import { fechaCivil, hora } from '../formato';
import { Icono } from '../icono';
import { anchoDeLaColumna, comidasDeHoy, formaDelArea, ICONO_DE_LA_FICHA, nombreDelDiaEnInicio, rutaDeLaFicha, SEPARACION_EN_INICIO, type FichaDeComida } from '../inicio-de-hoy';
import { TEXTOS_DE_LA_VUELTA as T } from '../textos-de-la-vuelta';
import { useLecturaRecordada } from '../lecturas';
import { leerUltimoRegistro, pideElUltimoRegistro, sinRegistrosDeHoy } from '../lecturas-de-inicio';
import type { Ir } from '../navegacion';
import { Boton, estilosPorTema, Parrafo } from '../ui';
import { useSuperficieDeControl } from '../vidrio';
import { useLecturaDeHoyConOpciones } from './nutricion-hoy';
import { Accion, Acciones, estilos, faltaElA3, LineaDeInicio, NoSePudo, SinA3, TarjetaDeInicio, Verificando, type AlPerderLaSesion } from './tarjeta-de-inicio';

/** API-ING-01 con el día del plan elegido: la misma lectura, la misma elección y la misma clave que Nutrición (AV2-13). */
export function NutricionDeHoy({ token, sesionPerdida, ir }: { token: string; sesionPerdida: AlPerderLaSesion; ir: Ir }) {
  const { r, cargar, sinActualizar, setDiaTipo } = useLecturaDeHoyConOpciones(token, sesionPerdida);
  let contenido: ReactNode;
  if (!r) contenido = <Verificando />;
  else if (faltaElA3(r)) contenido = <SinA3 texto={COPY_NUTRICION.hoyNecesitaA3} ir={ir} />;
  else if (!r.ok) contenido = <NoSePudo falla={r} reintentar={() => void cargar()} />;
  else if (formaDelArea(r.datos.data.planState) === 'linea') return <LineaDeInicio zona="nutricion" texto={COPY_NUTRICION.sinPlanAsesorado} />;
  else contenido = <ContenidoDeNutricion hoy={r.datos.data} token={token} sesionPerdida={sesionPerdida} elegirDia={setDiaTipo} ir={ir} />;
  // El nombre del día, solo si el plan tiene más de un tipo: «Día habitual» bajo un plan de un solo día no decía nada.
  const detalle = r?.ok ? nombreDelDiaEnInicio(r.datos.data.dayTypes, r.datos.data.selectedDayTypeId) : undefined;
  return (
    <TarjetaDeInicio zona="nutricion" titulo={T.comidas} detalle={detalle}>
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
  hoy: HoyConOpcionesResponse['data'];
  token: string;
  sesionPerdida: AlPerderLaSesion;
  elegirDia: (id: string | undefined) => void;
  ir: Ir;
}) {
  const plan = hoy.plan;
  const elegido = hoy.selectedDayTypeId;
  // Sin día elegido no hay fichas: se pide elegir (DL-049).
  const comidas = plan && elegido ? comidasDeHoy({ meals: hoy.meals }, hoy.records, hora) : null;
  const { width, fontScale } = useWindowDimensions();
  // Dos fichas por fila; con letra ×1,3, una: no se achica la letra, cambia la composición.
  const anchoDeFicha = anchoDeLaColumna(width, fontScale, true);
  return (
    <>
      {hoy.planState === 'NOT_AVAILABLE' ? (
        <>
          <Parrafo>{COPY_NUTRICION.planNoDisponible}</Parrafo>
          <Boton texto="Ver tus vínculos" tipo="secundario" onPress={() => ir({ nombre: 'vinculos' })} />
        </>
      ) : null}

      {/* El plan: el día que corresponde hoy. Con varios y ninguno elegido, se pide la elección (DL-049). */}
      {plan && !elegido ? (
        <View>
          <Text style={estilos.pregunta} accessibilityRole="header">
            {COPY_NUTRICION.elegiDiaTipo}
          </Text>
          <Acciones>
            {hoy.dayTypes.map((d) => (
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
            <FichaDeInicio key={f.mealId} ficha={f} ancho={anchoDeFicha} abrir={() => ir(rutaDeLaFicha(f))} />
          ))}
        </View>
      ) : null}
      {comidas && comidas.fueraDelPlan > 0 ? <Parrafo tenue>{T.fueraDelPlan(comidas.fueraDelPlan)}</Parrafo> : null}
      {plan && elegido ? <Boton texto={T.verElPlan} tipo="enlace" icono="derecha" iconoAlFinal onPress={() => ir({ nombre: 'plan-actual' })} /> : null}
      {plan && elegido && hoy.dayTypes.length > 1 ? <Boton texto={T.cambiarElDia} tipo="enlace" onPress={() => elegirDia(undefined)} /> : null}

      {/* Sin registros hoy, el último registro se lee aparte y queda en una línea tenue, para abrirlo. */}
      {pideElUltimoRegistro(hoy) && plan ? <SinRegistrosHoy token={token} sesionPerdida={sesionPerdida} ir={ir} /> : null}
    </>
  );
}

/**
 * Una ficha: el ícono de su estado y el nombre, y debajo la hora, «Registrar», «Sin registrar» o sus opciones. Con el
 * vidrio es de nivel 2; «la que sigue» lleva el borde del acento y su tinte. El lector dice la comida y su estado.
 */
function FichaDeInicio({ ficha: f, ancho, abrir }: { ficha: FichaDeComida; ancho: number; abrir: () => void }) {
  const superficie = useSuperficieDeControl();
  const sigue = f.estado === 'la-que-sigue';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={f.paraLeer}
      onPress={abrir}
      style={({ pressed }) => [estilosDeFichas.ficha, superficie, { width: ancho }, sigue && estilosDeFichas.laQueSigue, pressed && estilosDeFichas.presionada]}
    >
      <View style={estilosDeFichas.cabezaDeFicha}>
        <Icono nombre={ICONO_DE_LA_FICHA[f.estado]} tamano={20} tono={f.estado === 'registrada' ? 'exito' : sigue ? 'acento' : 'tenue'} />
        <Text style={estilosDeFichas.nombre}>{f.nombre}</Text>
      </View>
      <Text style={sigue ? estilosDeFichas.registrar : estilos.detalle}>{f.texto}</Text>
    </Pressable>
  );
}

/**
 * Sin registros hoy: cuando llega el último registro, su fecha y el botón para abrirlo, debajo de las acciones
 * (`sinRegistrosDeHoy`). Si nunca hubo uno, nada más.
 */
function SinRegistrosHoy({ token, sesionPerdida, ir }: { token: string; sesionPerdida: AlPerderLaSesion; ir: Ir }) {
  const pedir = useCallback(() => leerUltimoRegistro(api, token), [token]);
  const { r } = useLecturaRecordada(token, 'inicio-ultimo-registro', pedir, sesionPerdida);
  const { ultimo } = sinRegistrosDeHoy(r, fechaCivil);
  return ultimo ? <Boton texto={ultimo.texto} tipo="enlace" icono="lista" onPress={() => ir({ nombre: 'registro-nutricional', id: ultimo.executionId })} /> : null;
}

const estilosDeFichas = estilosPorTema((COLOR) => ({
  fichas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: SEPARACION_EN_INICIO, marginTop: 6, marginBottom: 2 },
  ficha: { minHeight: 64, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLOR.borde, backgroundColor: COLOR.superficieElevada, gap: 4 },
  // «La que sigue»: el borde del acento, más grueso, y su tinte. El texto «Registrar» dice lo mismo: el borde no es la
  // única señal.
  laQueSigue: { borderWidth: 2, borderColor: COLOR.acento, backgroundColor: COLOR.destacadaFondo, borderRadius: 14 },
  presionada: { opacity: 0.6 },
  cabezaDeFicha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nombre: { fontSize: 16, fontWeight: '800', color: COLOR.texto, flexShrink: 1 },
  registrar: { fontSize: 14, fontWeight: '700', color: COLOR.acento },
}));
