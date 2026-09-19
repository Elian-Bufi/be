/**
 * APK · Nutrición del asesorado (docs/paquetes/WP-04.md §5; B10-05 NUT-08 a NUT-11; 10-B01:351-357).
 * - «Hoy» muestra exactamente la instantánea vigente, nunca un borrador ni el catálogo actual (REG-06-105). Si el plan
 *   tiene varios días tipo, la persona elige cuál corresponde: BE no elige en silencio (B05:768-782; DL-049).
 * - «Registrar comida» deja la comida «Registrada», nunca «Cumplida» (B05:836-846). Las cantidades son opcionales.
 * - «Agregar comida fuera del plan» con texto libre: «Contanos qué comiste.» (B05:854-895). No marca ninguna comida.
 * - Sin puntajes, porcentajes ni juicios (REG-06-125). Sin registros hoy: «Todavía no registraste comidas hoy.».
 * - Un resultado incierto ofrece reintentar con la misma Idempotency-Key: no duplica (UC-P12 V04; B05:1415-1428).
 * - Si el consentimiento o la A3 están revocados, el plan no está disponible (UC-P12 E06).
 */
import {
  COPY,
  COPY_NUTRICION,
  ETIQUETA_DE_PREPARACION,
  ETIQUETA_DE_UNIDAD,
  type DiaTipo,
  type HoyResponse,
  type Ingesta,
  type Resultado,
} from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Cargando, ErrorConReintento, EstadoDeCarga, VerMas } from '../estados';
import { dia, fecha } from '../formato';
import { esIncierto, falloDe, useClaveDeIntento } from '../intento';
import { useListaPaginada } from '../lista';
import { useSesionPerdida, type Ruta, type Salida } from '../navegacion';
import { Aviso, Boton, COLOR, Campo, Dato, Insignia, Parrafo, Seccion, Subtitulo, Tarjeta, Titulo } from '../ui';

type Hoy = HoyResponse['data'];
type Comida = DiaTipo['meals'][number];

const cantidad = (i: { quantity: { value: number; unit: 'g' | 'ml' | 'unit' } | null; preparationState: keyof typeof ETIQUETA_DE_PREPARACION | null }) =>
  `${i.quantity ? ` · ${i.quantity.value} ${ETIQUETA_DE_UNIDAD[i.quantity.unit]}` : ''}${i.preparationState ? ` · ${ETIQUETA_DE_PREPARACION[i.preparationState].toLowerCase()}` : ''}`;

/** Carga «Hoy» (API-NUT-14) con el día tipo elegido, si hay que elegir. */
function useHoy(token: string, salir: (m: Salida) => void) {
  const sesionPerdida = useSesionPerdida(salir);
  const [diaTipo, setDiaTipo] = useState<string | undefined>(undefined);
  const [r, setR] = useState<Resultado<HoyResponse> | null>(null);
  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.hoyNutricional(token, diaTipo);
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, diaTipo, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  return { r, cargar, setDiaTipo, sesionPerdida };
}

export function PantallaDeHoy({ token, salir, ir, subir }: { token: string; salir: (m: Salida) => void; ir: (r: Ruta) => void; subir: () => void }) {
  const { r, cargar, setDiaTipo, sesionPerdida } = useHoy(token, salir);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);

  const registrado = (texto: string) => {
    setAviso({ tipo: 'exito', texto });
    subir();
    void cargar();
  };

  if (!r) return <Cargando />;
  if (!r.ok) return <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={cargar} />;
  const hoy = r.datos.data;
  const dia = hoy.activePlan?.dayTypes.find((d) => d.dayTypeId === hoy.selectedDayTypeId) ?? null;

  return (
    <View>
      <Titulo>{COPY_NUTRICION.tuPlanDeHoy}</Titulo>
      {aviso ? <Aviso tipo={aviso.tipo} titulo={aviso.texto} /> : null}
      {hoy.planState === 'NO_ACTIVE_PLAN' ? <Aviso tipo="info" titulo={COPY_NUTRICION.sinPlanAsesorado} /> : null}
      {hoy.planState === 'NOT_AVAILABLE' ? (
        <Aviso tipo="info" titulo={COPY_NUTRICION.planNoDisponible}>
          <Boton texto="Ir a Vínculos" tipo="secundario" onPress={() => ir({ nombre: 'vinculos' })} />
        </Aviso>
      ) : null}

      {hoy.activePlan && !dia ? (
        <Seccion titulo={COPY_NUTRICION.elegiDiaTipo}>
          {hoy.activePlan.dayTypes.map((d) => (
            <Boton key={d.dayTypeId} texto={d.label} tipo="secundario" onPress={() => setDiaTipo(d.dayTypeId)} />
          ))}
        </Seccion>
      ) : null}

      {hoy.activePlan && dia ? (
        <Seccion titulo={COPY_NUTRICION.comidasDelPlan}>
          {hoy.activePlan.dayTypes.length > 1 ? (
            <Parrafo tenue>
              Día del plan: {dia.label}.{' '}
              <Text style={s.enlace} onPress={() => setDiaTipo(undefined)} accessibilityRole="link">
                Cambiar
              </Text>
            </Parrafo>
          ) : null}
          {dia.meals.map((m) => (
            <TarjetaDeComida
              key={m.mealId}
              token={token}
              planId={hoy.activePlan!.planId}
              diaTipoId={dia.dayTypeId}
              comida={m}
              registro={hoy.registeredIntake.find((i) => i.mealId === m.mealId && i.origin === 'PRESCRIBED') ?? null}
              sesionPerdida={sesionPerdida}
              onRegistrada={() => registrado(COPY_NUTRICION.comidaRegistrada)}
              onPlanCambio={() => {
                setAviso({ tipo: 'info', texto: COPY_NUTRICION.planCambio });
                void cargar();
              }}
            />
          ))}
        </Seccion>
      ) : null}

      {hoy.activePlan ? (
        <ComidaFueraDelPlan token={token} planId={hoy.activePlan.planId} sesionPerdida={sesionPerdida} onRegistrada={() => registrado(COPY_NUTRICION.comidaRegistrada)} />
      ) : null}

      <Seccion titulo={COPY_NUTRICION.registrosDeHoy}>
        {hoy.registeredIntake.length === 0 ? <Parrafo>{COPY_NUTRICION.sinRegistrosHoy}</Parrafo> : null}
        {hoy.registeredIntake.map((i) => (
          <ResumenDeRegistro key={i.executionId} ingesta={i} dia={dia} onAbrir={() => ir({ nombre: 'registro-nutricional', id: i.executionId })} />
        ))}
      </Seccion>

      {hoy.activePlan ? <Boton texto={COPY_NUTRICION.planActual} tipo="secundario" onPress={() => ir({ nombre: 'plan-actual' })} /> : null}
      <Boton texto="Ver todos mis registros" tipo="secundario" onPress={() => ir({ nombre: 'registros-nutricionales' })} />
      <Boton texto="Actualizar" tipo="enlace" onPress={() => void cargar()} />
    </View>
  );
}

function TarjetaDeComida({
  token,
  planId,
  diaTipoId,
  comida,
  registro,
  sesionPerdida,
  onRegistrada,
  onPlanCambio,
}: {
  token: string;
  planId: string;
  diaTipoId: string;
  comida: Comida;
  registro: Ingesta | null;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  onRegistrada: () => void;
  onPlanCambio: () => void;
}) {
  const intento = useClaveDeIntento();
  const [abierta, setAbierta] = useState(false);
  const [opcionId, setOpcionId] = useState<string | null>(comida.options.length === 1 ? (comida.options[0]?.optionId ?? null) : null);
  const [cantidades, setCantidades] = useState<Record<string, string>>({});
  const [observacion, setObservacion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<{ texto: string; incierto: boolean } | null>(null);
  const opcion = comida.options.find((o) => o.optionId === opcionId) ?? null;

  async function guardar() {
    if (!opcion) return setFallo({ texto: 'Elegí qué opción comiste.', incierto: false });
    const consumidos = opcion.items.flatMap((it) => {
      const v = Number((cantidades[it.itemId] ?? '').replace(',', '.'));
      return cantidades[it.itemId] && v > 0 && it.quantity ? [{ itemId: it.itemId, quantity: { value: v, unit: it.quantity.unit } }] : [];
    });
    setEnviando(true);
    setFallo(null);
    const r = await api.registrarIngesta(
      token,
      {
        activePlanId: planId,
        dayTypeId: diaTipoId,
        occurredAt: new Date().toISOString(),
        recording: { origin: 'PRESCRIBED', mode: 'DISH_OPTIONS', mealId: comida.mealId, optionId: opcion.optionId, consumedItems: consumidos, observation: observacion.trim() || null },
      },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (r.ok) {
      setAbierta(false);
      return onRegistrada();
    }
    if (esIncierto(r)) return setFallo({ texto: COPY_NUTRICION.noPudimosConfirmar, incierto: true });
    if (r.tipo === 'API' && r.codigo === 'EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY') return setFallo({ texto: COPY_NUTRICION.yaRegistrada, incierto: false });
    if (r.tipo === 'API' && r.codigo === 'ACTIVE_PLAN_REQUIRED') return onPlanCambio();
    setFallo({ texto: falloDe(r).mensaje, incierto: false });
  }

  return (
    <Tarjeta>
      <Subtitulo>{comida.label}</Subtitulo>
      {comida.options.map((o) => (
        <View key={o.optionId} style={s.opcion}>
          <Text style={s.negrita}>{comida.options.length > 1 ? `Opción ${o.order}: ${o.label}` : o.label}</Text>
          {o.items.map((i) => (
            <Text key={i.itemId} style={s.item}>
              • {i.name}
              {cantidad(i)}
            </Text>
          ))}
        </View>
      ))}
      {registro ? (
        <Insignia texto={COPY_NUTRICION.registrado} positiva etiqueta={comida.label} />
      ) : abierta ? (
        <View>
          {comida.options.length > 1 ? (
            <>
              <Text style={s.negrita}>¿Qué opción comiste?</Text>
              {comida.options.map((o) => (
                <Pressable
                  key={o.optionId}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: opcionId === o.optionId }}
                  onPress={() => setOpcionId(o.optionId)}
                  style={[s.radio, opcionId === o.optionId && s.radioMarcado]}
                >
                  <Text style={s.textoRadio}>{o.label}</Text>
                </Pressable>
              ))}
            </>
          ) : null}
          {opcion
            ? opcion.items
                .filter((i) => i.quantity)
                .map((i) => (
                  <Campo
                    key={i.itemId}
                    etiqueta={`${i.name}: cantidad que comiste (opcional, ${ETIQUETA_DE_UNIDAD[i.quantity!.unit]})`}
                    ayuda={`Indicado: ${i.quantity!.value} ${ETIQUETA_DE_UNIDAD[i.quantity!.unit]}`}
                    keyboardType="decimal-pad"
                    value={cantidades[i.itemId] ?? ''}
                    onChangeText={(t) => setCantidades((c) => ({ ...c, [i.itemId]: t }))}
                  />
                ))
            : null}
          <Campo etiqueta="Observación (opcional)" value={observacion} onChangeText={setObservacion} maxLength={1000} />
          {fallo ? <Aviso tipo="error" titulo={fallo.texto} /> : null}
          <Boton texto={enviando ? 'Guardando…' : fallo?.incierto ? COPY.reintentar : 'Guardar'} onPress={() => void guardar()} ocupado={enviando} />
          <Boton
            texto={COPY.cancelar}
            tipo="secundario"
            onPress={() => {
              intento.descartar();
              setAbierta(false);
              setFallo(null);
            }}
            deshabilitado={enviando}
          />
        </View>
      ) : (
        <Boton texto={COPY_NUTRICION.registrarComida} tipo="secundario" onPress={() => setAbierta(true)} />
      )}
    </Tarjeta>
  );
}

function ComidaFueraDelPlan({ token, planId, sesionPerdida, onRegistrada }: { token: string; planId: string; sesionPerdida: (r: Resultado<unknown>) => boolean; onRegistrada: () => void }) {
  const intento = useClaveDeIntento();
  const [abierta, setAbierta] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [porcion, setPorcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fallo, setFallo] = useState<{ texto: string; incierto: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function guardar() {
    if (!descripcion.trim()) return setError('Contanos qué comiste.');
    setError(null);
    setEnviando(true);
    setFallo(null);
    const r = await api.registrarIngesta(
      token,
      { activePlanId: planId, occurredAt: new Date().toISOString(), recording: { origin: 'OUTSIDE_PRESCRIPTION', mode: 'FREE_DESCRIPTION', description: descripcion.trim(), portionDescription: porcion.trim() || null } },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (r.ok) {
      setAbierta(false);
      setDescripcion('');
      setPorcion('');
      return onRegistrada();
    }
    setFallo(esIncierto(r) ? { texto: COPY_NUTRICION.noPudimosConfirmar, incierto: true } : { texto: falloDe(r).mensaje, incierto: false });
  }

  if (!abierta) return <Boton texto={COPY_NUTRICION.agregarComidaFueraDelPlan} tipo="secundario" onPress={() => setAbierta(true)} />;
  return (
    <Seccion titulo={COPY_NUTRICION.agregarComidaFueraDelPlan}>
      <Parrafo>{COPY_NUTRICION.contanosQueComiste}</Parrafo>
      <Parrafo tenue>{COPY_NUTRICION.podesDescribirlo}</Parrafo>
      <Campo etiqueta={COPY_NUTRICION.queComiste} value={descripcion} onChangeText={setDescripcion} multiline maxLength={2000} error={error} />
      <Campo etiqueta={COPY_NUTRICION.porcionAproximada} value={porcion} onChangeText={setPorcion} maxLength={500} />
      {fallo ? <Aviso tipo="error" titulo={fallo.texto} /> : null}
      <Boton texto={enviando ? 'Guardando…' : fallo?.incierto ? COPY.reintentar : 'Guardar'} onPress={() => void guardar()} ocupado={enviando} />
      <Boton
        texto={COPY.cancelar}
        tipo="secundario"
        onPress={() => {
          intento.descartar();
          setAbierta(false);
        }}
        deshabilitado={enviando}
      />
    </Seccion>
  );
}

function ResumenDeRegistro({ ingesta, dia, onAbrir }: { ingesta: Ingesta; dia: DiaTipo | null; onAbrir: () => void }) {
  const comida = dia?.meals.find((m) => m.mealId === ingesta.mealId)?.label;
  return (
    <Pressable accessibilityRole="button" onPress={onAbrir} style={s.fila}>
      <Insignia texto={ingesta.origin === 'PRESCRIBED' ? 'DEL PLAN' : 'FUERA DEL PLAN'} positiva={ingesta.origin === 'PRESCRIBED'} />
      <Text style={s.item}>
        {fecha(ingesta.occurredAt)} · {ingesta.origin === 'PRESCRIBED' ? (comida ?? 'Comida del plan') : `«${ingesta.description}»`}
      </Text>
    </Pressable>
  );
}

// ─── Plan actual ─────────────────────────────────────────────────────────────────────────────────

export function PantallaDePlanActual({ token, salir }: { token: string; salir: (m: Salida) => void }) {
  const { r, cargar } = useHoy(token, salir);
  if (!r) return <Cargando />;
  if (!r.ok) return <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={cargar} />;
  const plan = r.datos.data.activePlan;
  if (!plan) return <Aviso tipo="info" titulo={r.datos.data.planState === 'NOT_AVAILABLE' ? COPY_NUTRICION.planNoDisponible : COPY_NUTRICION.sinPlanAsesorado} />;
  return (
    <View>
      <Titulo>{COPY_NUTRICION.planActual}</Titulo>
      <Parrafo tenue>Vigente desde el {fecha(plan.activatedAt)}.</Parrafo>
      <Seccion titulo="Objetivo">
        <Parrafo tenue>{COPY_NUTRICION.objetivoDeclarado}</Parrafo>
        <Dato etiqueta="Energía" valor={`${plan.objective.estimatedEnergyRequirement.value} kcal por día`} />
        <Dato etiqueta="Proteínas" valor={`${plan.objective.macronutrientDistribution.protein.value} g por día`} />
        <Dato etiqueta="Carbohidratos" valor={`${plan.objective.macronutrientDistribution.carbohydrate.value} g por día`} />
        <Dato etiqueta="Grasas" valor={`${plan.objective.macronutrientDistribution.fat.value} g por día`} />
        {plan.objective.mealDistribution ? <Parrafo>{plan.objective.mealDistribution}</Parrafo> : null}
      </Seccion>
      {plan.dayTypes.map((d) => (
        <Seccion key={d.dayTypeId} titulo={d.label}>
          {d.meals.map((m) => (
            <View key={m.mealId}>
              <Subtitulo>{m.label}</Subtitulo>
              {m.options.map((o) => (
                <View key={o.optionId} style={s.opcion}>
                  <Text style={s.negrita}>{m.options.length > 1 ? `Opción ${o.order}: ${o.label}` : o.label}</Text>
                  {o.items.map((i) => (
                    <Text key={i.itemId} style={s.item}>
                      • {i.name}
                      {cantidad(i)}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </Seccion>
      ))}
    </View>
  );
}

// ─── Registros y detalle ─────────────────────────────────────────────────────────────────────────

/** B10-05 NUT-11: agrupados en Hoy / Ayer / fecha, con etiquetas que no dependen del color (B05:968-983). */
export function PantallaDeRegistros({ token, salir, ir }: { token: string; salir: (m: Salida) => void; ir: (r: Ruta) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const lista = useListaPaginada(
    useCallback((cursor?: string) => api.listarMisIngestas(token, { cursor }), [token]),
    sesionPerdida,
  );
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
  const ayer = (() => {
    const d = new Date(`${hoy}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  })();
  const grupo = (f: string) => (f === hoy ? 'Hoy' : f === ayer ? 'Ayer' : dia(`${f}T12:00:00Z`));

  return (
    <View>
      <Titulo>{COPY_NUTRICION.registros}</Titulo>
      <EstadoDeCarga estado={lista.estado} onReintentar={lista.recargar} />
      {lista.estado.tipo === 'listo' && lista.estado.items.length === 0 ? <Parrafo>Todavía no registraste comidas.</Parrafo> : null}
      {lista.estado.tipo === 'listo'
        ? lista.estado.items.map((i, k, todos) => (
            <View key={i.executionId}>
              {k === 0 || todos[k - 1]?.localDate !== i.localDate ? <Subtitulo>{grupo(i.localDate)}</Subtitulo> : null}
              <ResumenDeRegistro ingesta={i} dia={null} onAbrir={() => ir({ nombre: 'registro-nutricional', id: i.executionId })} />
            </View>
          ))
        : null}
      <VerMas estado={lista.estado} onVerMas={lista.verMas} />
    </View>
  );
}

export function PantallaDeRegistroNutricional({ token, id, salir }: { token: string; id: string; salir: (m: Salida) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const [r, setR] = useState<Resultado<{ data: Ingesta }> | null>(null);
  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.consultarIngesta(token, id);
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, id, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  if (!r) return <Cargando />;
  if (!r.ok) {
    const f = falloDe(r);
    return f.tipo === 'no-revelable' ? <Aviso tipo="info" titulo={f.mensaje} /> : <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={cargar} />;
  }
  const i = r.datos.data;
  const efectiva = i.effectiveView.kind === 'CORRECTED' ? i.corrections.find((c) => c.correctionId === (i.effectiveView as { correctionId: string }).correctionId) : null;
  return (
    <View>
      <Titulo>Detalle de registro</Titulo>
      <Insignia texto={i.origin === 'PRESCRIBED' ? 'DEL PLAN' : 'FUERA DEL PLAN'} positiva={i.origin === 'PRESCRIBED'} />
      <Dato etiqueta="Cuándo" valor={fecha(i.occurredAt)} />
      <Dato etiqueta="Registrado" valor={fecha(i.recordedAt)} />
      {i.origin === 'PRESCRIBED' ? (
        <>
          {i.consumedItems.length > 0 ? <Parrafo>Cantidades que informaste: {i.consumedItems.map((c) => `${c.quantity.value} ${ETIQUETA_DE_UNIDAD[c.quantity.unit]}`).join(', ')}</Parrafo> : null}
          {i.observation ? <Dato etiqueta="Observación" valor={i.observation} /> : null}
        </>
      ) : (
        <Seccion titulo={COPY_NUTRICION.tuDescripcionOriginal}>
          <Parrafo>{i.description}</Parrafo>
          {i.portionDescription ? <Parrafo tenue>Porción: {i.portionDescription}</Parrafo> : null}
        </Seccion>
      )}
      {efectiva ? (
        <Seccion titulo={COPY_NUTRICION.estimacionProfesional}>
          {efectiva.structuredEstimate.items.map((e, k) => (
            <Text key={k} style={s.item}>
              • {e.description}
              {e.quantity ? ` · ${e.quantity.value} ${ETIQUETA_DE_UNIDAD[e.quantity.unit]}` : ''}
            </Text>
          ))}
          <Parrafo tenue>
            {efectiva.author.displayName} · {fecha(efectiva.recordedAt)}. Es una estimación: tu descripción original se conserva.
          </Parrafo>
        </Seccion>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  opcion: { marginVertical: 6 },
  negrita: { fontWeight: '700', color: COLOR.texto, fontSize: 16 },
  item: { fontSize: 16, color: COLOR.texto, lineHeight: 23 },
  enlace: { color: COLOR.azulOscuro, textDecorationLine: 'underline' },
  radio: { minHeight: 48, borderWidth: 2, borderColor: COLOR.borde, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center', marginVertical: 4 },
  radioMarcado: { borderColor: COLOR.azul, backgroundColor: COLOR.fondoSuave },
  textoRadio: { fontSize: 16, color: COLOR.texto },
  fila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, minHeight: 48, borderBottomWidth: 1, borderBottomColor: COLOR.borde, paddingVertical: 6 },
});
