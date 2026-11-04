/**
 * APK · los campos de un formulario V2 (WP-FORMULARIOS-DE-INICIO, FI-04), pensados para tocar y no para escribir:
 * una opción como renglones, varias como casillas, la lista que se repite con «Sumar» y «Quitar», la tabla como una
 * pregunta por fila, los alimentos como chips más los escritos, y los horarios como un campo por parte.
 *
 * Reglas comunes (10-B10 §7, §9):
 * - **nada viene elegido** y tocar de nuevo lo elegido lo suelta: no responder es legítimo y tiene su estado;
 * - **roles y estados para el lector de pantalla:** `radiogroup`/`radio` con `checked`, `checkbox`, y cada opción de una
 *   tabla se lee con su fila («Sentadilla: Con ayuda»); el error entra en el nombre del grupo, como en `Campo`;
 * - **objetivos de toque de 44 dp o más**, texto además de color, y solo colores de `tema.ts`.
 * Los textos de P0 (`Campo`, `CampoSiONo`) siguen en `ui.tsx`; acá están los seis tipos nuevos y lo que los compone.
 */
import { COPY_FORMULARIOS, COPY_FORMULARIOS_V2, LARGO_MAXIMO_DE_ALIMENTO, LARGO_MAXIMO_DE_OTRO, type CampoDePlantillaV2, type OpcionDeCampo, type SubcampoDeLista } from '@be/domain';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { claveDeParte, claveDeSubcampo, TEXTOS_DE_FORMULARIO_V2 as T, type AlimentoDeBorrador, type EleccionSiONo, type RenglonDeBorrador } from './formulario-v2';
import { Icono } from './icono';
import { Boton, CajaDeCasilla, Campo, CampoSiONo, Subtitulo, Tarjeta, estilos as ui, estilosPorTema } from './ui';

type CampoDeOpcion = Extract<CampoDePlantillaV2, { dataType: 'CHOICE' }>;
type CampoDeOpciones = Extract<CampoDePlantillaV2, { dataType: 'MULTI_CHOICE' }>;
type CampoDeLista = Extract<CampoDePlantillaV2, { dataType: 'LIST' }>;
type CampoDeTabla = Extract<CampoDePlantillaV2, { dataType: 'MATRIX' }>;
type CampoDeAlimentosDePlantilla = Extract<CampoDePlantillaV2, { dataType: 'FOODS' }>;
type CampoDeHorariosDePlantilla = Extract<CampoDePlantillaV2, { dataType: 'TIMES' }>;

/** Las dos respuestas de un Sí o no; no elegir es el tercer estado y no es una opción de esta lista. */
export const OPCIONES_SI_O_NO: readonly { readonly valor: EleccionSiONo; readonly texto: string }[] = [
  { valor: 'SI', texto: COPY_FORMULARIOS.si },
  { valor: 'NO', texto: COPY_FORMULARIOS.no },
];

/** Lo que encabeza cada pregunta: su rótulo, su ayuda y para qué se usa el dato (minimización: cada pregunta lo dice). */
export interface CabeceraDePregunta {
  readonly etiqueta: string;
  readonly ayuda?: string | null;
  readonly paraQue?: string | null;
  readonly error?: string | null;
}

const nombreParaElLector = (etiqueta: string, error?: string | null): string => (error ? `${etiqueta}. Revisá este campo: ${error}` : etiqueta);
const conMayuscula = (s: string): string => s.charAt(0).toLocaleUpperCase('es-AR') + s.slice(1);

function Cabecera({ etiqueta, ayuda, paraQue }: CabeceraDePregunta) {
  return (
    <>
      <Text style={ui.etiqueta}>{etiqueta}</Text>
      {ayuda ? <Text style={ui.tenue}>{ayuda}</Text> : null}
      {paraQue ? <Text style={ui.tenue}>{`${COPY_FORMULARIOS_V2.paraQue}: ${paraQue}`}</Text> : null}
    </>
  );
}

/** Un error dicho con texto y el ícono, debajo del grupo. El lector ya lo oyó en el nombre del grupo: acá no se repite. */
function LineaDeError({ texto }: { texto: string }) {
  return (
    <View style={ui.lineaDeError} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <View style={ui.iconoDeError}>
        <Icono nombre="aviso" tamano={18} tono="error" />
      </View>
      <Text style={[ui.error, ui.textoDeError]}>{texto}</Text>
    </View>
  );
}

/** El marco de una pregunta que no es un `Campo`: cabecera, el grupo con su nombre para el lector, y el error. */
function Pregunta({ cabecera, rol, hijos, pie }: { cabecera: CabeceraDePregunta; rol: 'radiogroup' | 'none'; hijos: ReactNode; pie?: ReactNode }) {
  return (
    <View style={[ui.campo, cabecera.error ? estilos.preguntaConError : null]}>
      <Cabecera {...cabecera} />
      <View accessibilityRole={rol === 'none' ? undefined : rol} accessibilityLabel={nombreParaElLector(cabecera.etiqueta, cabecera.error)}>
        {hijos}
      </View>
      {pie}
      {cabecera.error ? <LineaDeError texto={cabecera.error} /> : null}
    </View>
  );
}

// ─── Una opción ─────────────────────────────────────────────────────────────────────────────────

/** Un renglón de una opción, con el círculo y el texto: rol `radio`, se lee con su estado. */
function RenglonDeOpcion({ texto, elegida, onPress, etiqueta }: { texto: string; elegida: boolean; onPress: () => void; etiqueta?: string }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: elegida }}
      accessibilityLabel={etiqueta ?? texto}
      onPress={onPress}
      style={({ pressed }) => [estilos.renglon, elegida && estilos.renglonElegido, pressed && ui.presionado]}
    >
      <View style={estilos.circulo}>{elegida ? <View style={estilos.punto} /> : null}</View>
      <Text style={[estilos.textoDeRenglon, elegida && ui.negrita]}>{texto}</Text>
    </Pressable>
  );
}

/** El texto de «Otro», solo cuando esa opción está elegida. */
function CampoDeOtro({ texto, onCambio }: { texto: string; onCambio: (t: string) => void }) {
  return <Campo etiqueta={COPY_FORMULARIOS_V2.cualOtro} value={texto} onChangeText={onCambio} maxLength={LARGO_MAXIMO_DE_OTRO} />;
}

export function OpcionUnica({
  cabecera,
  campo,
  valor,
  otro,
  onCambio,
  onOtro,
}: {
  cabecera: CabeceraDePregunta;
  campo: Pick<CampoDeOpcion, 'options' | 'otherOptionCode'>;
  valor: string | null;
  otro: string;
  onCambio: (opcion: string | null) => void;
  onOtro: (texto: string) => void;
}) {
  return (
    <Pregunta
      cabecera={{ ...cabecera, ayuda: cabecera.ayuda ?? T.elegiUna }}
      rol="radiogroup"
      hijos={campo.options.map((o) => (
        <RenglonDeOpcion key={o.code} texto={o.label} elegida={valor === o.code} onPress={() => onCambio(valor === o.code ? null : o.code)} />
      ))}
      pie={campo.otherOptionCode !== null && valor === campo.otherOptionCode ? <CampoDeOtro texto={otro} onCambio={onOtro} /> : null}
    />
  );
}

// ─── Varias opciones ────────────────────────────────────────────────────────────────────────────

export function OpcionesMultiples({
  cabecera,
  campo,
  elegidas,
  otro,
  onAlternar,
  onOtro,
}: {
  cabecera: CabeceraDePregunta;
  campo: Pick<CampoDeOpciones, 'options' | 'maxSelected' | 'exclusiveOptionCodes' | 'otherOptionCode'>;
  elegidas: readonly string[];
  otro: string;
  onAlternar: (opcion: string) => void;
  onOtro: (texto: string) => void;
}) {
  const comunes = elegidas.filter((o) => !campo.exclusiveOptionCodes.includes(o)).length;
  const tope = campo.maxSelected !== null && comunes >= campo.maxSelected;
  const ayuda = cabecera.ayuda ?? (campo.maxSelected !== null ? T.hastaOpciones(campo.maxSelected) : T.elegiVarias);
  return (
    <Pregunta
      cabecera={{ ...cabecera, ayuda }}
      rol="none"
      hijos={campo.options.map((o) => {
        const marcada = elegidas.includes(o.code);
        // Con el tope alcanzado, las que no están marcadas esperan; una exclusiva («Ninguna») se puede tocar siempre.
        const deshabilitada = tope && !marcada && !campo.exclusiveOptionCodes.includes(o.code);
        return (
          <Pressable
            key={o.code}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: marcada, disabled: deshabilitada }}
            accessibilityLabel={o.label}
            disabled={deshabilitada}
            onPress={() => onAlternar(o.code)}
            style={({ pressed }) => [estilos.renglon, marcada && estilos.renglonElegido, deshabilitada && ui.deshabilitado, pressed && ui.presionado]}
          >
            {({ pressed }) => (
              <>
                <View style={estilos.cajaEnRenglon}>
                  <CajaDeCasilla marcada={marcada} presionada={pressed} deshabilitada={deshabilitada} />
                </View>
                <Text style={[estilos.textoDeRenglon, marcada && ui.negrita]}>{o.label}</Text>
              </>
            )}
          </Pressable>
        );
      })}
      pie={campo.otherOptionCode !== null && elegidas.includes(campo.otherOptionCode) ? <CampoDeOtro texto={otro} onCambio={onOtro} /> : null}
    />
  );
}

// ─── Chips: una opción corta entre pocas (la columna de una tabla, el motivo de un alimento, un subcampo) ─────

function Chip({ texto, etiqueta, elegido, rol, deshabilitado = false, onPress }: { texto: string; etiqueta?: string; elegido: boolean; rol: 'radio' | 'checkbox'; deshabilitado?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole={rol}
      accessibilityState={{ checked: elegido, disabled: deshabilitado }}
      accessibilityLabel={etiqueta ?? texto}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [estilos.chip, elegido && estilos.chipElegido, deshabilitado && ui.deshabilitado, pressed && ui.presionado]}
    >
      <Text style={[estilos.textoDeChip, elegido && estilos.textoDeChipElegido]}>{texto}</Text>
    </Pressable>
  );
}

/** Chips excluyentes (`radiogroup`); tocar el elegido lo suelta. `prefijo` nombra cada chip con su fila para el lector. */
function ChipsExcluyentes({ etiqueta, opciones, valor, onCambio, prefijo }: { etiqueta: string; opciones: readonly OpcionDeCampo[]; valor: string | null; onCambio: (code: string | null) => void; prefijo?: string }) {
  return (
    <View style={estilos.chips} accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
      {opciones.map((o) => (
        <Chip key={o.code} texto={o.label} etiqueta={prefijo ? `${prefijo}: ${o.label}` : undefined} elegido={valor === o.code} rol="radio" onPress={() => onCambio(valor === o.code ? null : o.code)} />
      ))}
    </View>
  );
}

// ─── La lista que se repite ─────────────────────────────────────────────────────────────────────

function Subcampo({ sub, valor, error, onCambio }: { sub: SubcampoDeLista; valor: string; error: string | null; onCambio: (v: string) => void }) {
  const rotulo = sub.required ? sub.label : `${sub.label} (${COPY_FORMULARIOS_V2.opcional})`;
  switch (sub.dataType) {
    case 'TEXT':
      return <Campo etiqueta={rotulo} value={valor} onChangeText={onCambio} maxLength={sub.maxLength} error={error} />;
    case 'NUMBER':
      return <Campo etiqueta={sub.unit ? `${rotulo} (${sub.unit})` : rotulo} value={valor} onChangeText={onCambio} keyboardType="decimal-pad" error={error} />;
    case 'BOOLEAN':
      return <CampoSiONo etiqueta={rotulo} opciones={OPCIONES_SI_O_NO} valor={valor} onCambio={onCambio} />;
    case 'CHOICE':
      return (
        <View style={ui.campo}>
          <Text style={ui.etiqueta}>{rotulo}</Text>
          <ChipsExcluyentes etiqueta={rotulo} opciones={sub.options} valor={valor === '' ? null : valor} onCambio={(c) => onCambio(c ?? '')} />
        </View>
      );
  }
}

export function ListaQueSeRepite({
  cabecera,
  campo,
  renglones,
  errores,
  onSumar,
  onQuitar,
  onEditar,
}: {
  cabecera: CabeceraDePregunta;
  campo: Pick<CampoDeLista, 'fieldCode' | 'itemLabel' | 'itemFields' | 'minItems' | 'maxItems'>;
  renglones: readonly RenglonDeBorrador[];
  /** Por clave de subcampo (`claveDeSubcampo`). */
  errores: Readonly<Record<string, string>>;
  onSumar: () => void;
  onQuitar: (id: number) => void;
  onEditar: (id: number, code: string, valor: string) => void;
}) {
  const item = campo.itemLabel;
  const lleno = renglones.length >= campo.maxItems;
  return (
    <Pregunta
      cabecera={cabecera}
      rol="none"
      hijos={renglones.map((r, i) => (
        <Tarjeta key={r.id}>
          <Subtitulo>{`${conMayuscula(item)} ${i + 1}`}</Subtitulo>
          {campo.itemFields.map((sub) => (
            <Subcampo key={sub.code} sub={sub} valor={r.valores[sub.code] ?? ''} error={errores[claveDeSubcampo(campo.fieldCode, r.id, sub.code)] ?? null} onCambio={(v) => onEditar(r.id, sub.code, v)} />
          ))}
          <Boton texto={COPY_FORMULARIOS_V2.quitarRenglon(item)} etiqueta={`${COPY_FORMULARIOS_V2.quitarRenglon(item)} ${i + 1}`} tipo="enlace" icono="cerrar" onPress={() => onQuitar(r.id)} />
        </Tarjeta>
      ))}
      pie={
        <>
          <Text style={ui.tenue}>{T.renglones(renglones.length, campo.maxItems)}</Text>
          <Boton texto={COPY_FORMULARIOS_V2.sumarRenglon(item)} tipo="secundario" icono="mas" onPress={onSumar} deshabilitado={lleno} />
        </>
      }
    />
  );
}

// ─── La tabla: una pregunta por fila ────────────────────────────────────────────────────────────

export function TablaDeOpciones({
  cabecera,
  campo,
  celdas,
  onElegir,
}: {
  cabecera: CabeceraDePregunta;
  campo: Pick<CampoDeTabla, 'rows' | 'columns'>;
  /** Por fila, la columna elegida. */
  celdas: Readonly<Record<string, string>>;
  onElegir: (fila: string, columna: string | null) => void;
}) {
  return (
    <Pregunta
      cabecera={{ ...cabecera, ayuda: cabecera.ayuda ?? T.unaPorFila }}
      rol="none"
      hijos={campo.rows.map((fila) => (
        <View key={fila.code} style={estilos.filaDeTabla}>
          <Text style={estilos.nombreDeFila}>{fila.label}</Text>
          <ChipsExcluyentes etiqueta={`${cabecera.etiqueta}: ${fila.label}`} prefijo={fila.label} opciones={campo.columns} valor={celdas[fila.code] ?? null} onCambio={(c) => onElegir(fila.code, c)} />
        </View>
      ))}
    />
  );
}

// ─── Alimentos ──────────────────────────────────────────────────────────────────────────────────

const mismoNombre = (a: string, b: string) => a.trim().toLocaleLowerCase('es-AR') === b.trim().toLocaleLowerCase('es-AR');

export function CampoDeAlimentos({
  cabecera,
  campo,
  alimentos,
  onAlternarSugerido,
  onSumar,
  onQuitar,
  onMotivo,
}: {
  cabecera: CabeceraDePregunta;
  campo: Pick<CampoDeAlimentosDePlantilla, 'suggestions' | 'reasons' | 'maxItems'>;
  alimentos: readonly AlimentoDeBorrador[];
  onAlternarSugerido: (nombre: string) => void;
  onSumar: (nombre: string) => void;
  onQuitar: (nombre: string) => void;
  onMotivo: (nombre: string, motivo: string | null) => void;
}) {
  const [nuevo, setNuevo] = useState('');
  const lleno = alimentos.length >= campo.maxItems;
  const elegido = (nombre: string) => alimentos.some((a) => mismoNombre(a.nombre, nombre));
  const sumar = () => {
    if (nuevo.trim() === '' || lleno) return;
    onSumar(nuevo);
    setNuevo('');
  };
  return (
    <Pregunta
      cabecera={{ ...cabecera, ayuda: cabecera.ayuda ?? (campo.suggestions.length ? T.tocaLosQueApliquen : T.sinSugeridos) }}
      rol="none"
      hijos={
        <>
          {campo.suggestions.length ? (
            <View style={estilos.chips}>
              {campo.suggestions.map((s) => (
                <Chip key={s} texto={s} elegido={elegido(s)} rol="checkbox" deshabilitado={lleno && !elegido(s)} onPress={() => onAlternarSugerido(s)} />
              ))}
            </View>
          ) : null}
          <Campo etiqueta={T.nombreDelAlimento} value={nuevo} onChangeText={setNuevo} maxLength={LARGO_MAXIMO_DE_ALIMENTO} returnKeyType="done" onSubmitEditing={sumar} editable={!lleno} />
          <Boton texto={COPY_FORMULARIOS_V2.sumarAlimento} tipo="secundario" icono="mas" onPress={sumar} deshabilitado={lleno || nuevo.trim() === ''} />
        </>
      }
      pie={
        alimentos.length ? (
          <View>
            <Text style={ui.rotulo}>{T.elegidos}</Text>
            {alimentos.map((a) => (
              <View key={a.nombre} style={estilos.alimento}>
                <View style={estilos.filaDeAlimento}>
                  <Text style={estilos.nombreDeAlimento}>{a.nombre}</Text>
                  <Boton texto={T.quitar} etiqueta={`${T.quitar} ${a.nombre}`} tipo="enlace" icono="cerrar" onPress={() => onQuitar(a.nombre)} />
                </View>
                {campo.reasons.length ? <ChipsExcluyentes etiqueta={`${COPY_FORMULARIOS_V2.motivo}: ${a.nombre}`} prefijo={a.nombre} opciones={campo.reasons} valor={a.motivo} onCambio={(m) => onMotivo(a.nombre, m)} /> : null}
              </View>
            ))}
          </View>
        ) : null
      }
    />
  );
}

// ─── Horarios ───────────────────────────────────────────────────────────────────────────────────

export function CampoDeHorarios({
  cabecera,
  campo,
  horas,
  errores,
  onEditar,
}: {
  cabecera: CabeceraDePregunta;
  campo: Pick<CampoDeHorariosDePlantilla, 'fieldCode' | 'parts'>;
  horas: Readonly<Record<string, string>>;
  /** Por clave de parte (`claveDeParte`). */
  errores: Readonly<Record<string, string>>;
  onEditar: (parte: string, texto: string) => void;
}) {
  return (
    <Pregunta
      cabecera={cabecera}
      rol="none"
      hijos={campo.parts.map((p) => (
        <Campo
          key={p.code}
          etiqueta={`${p.label} (HH:MM)`}
          placeholder={T.horaEjemplo}
          value={horas[p.code] ?? ''}
          onChangeText={(t) => onEditar(p.code, t)}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          error={errores[claveDeParte(campo.fieldCode, p.code)] ?? null}
        />
      ))}
    />
  );
}

const estilos = estilosPorTema((COLOR) => ({
  preguntaConError: { borderLeftWidth: 3, borderLeftColor: COLOR.error, paddingLeft: 10 },
  // Un renglón de opción: 48 dp, el borde de control y, elegido, el acento y el escalón elevado (como el motivo de un diálogo).
  renglon: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderWidth: 1, borderColor: COLOR.bordeControl, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginVertical: 4, backgroundColor: COLOR.superficie },
  renglonElegido: { borderColor: COLOR.acento, borderWidth: 2, backgroundColor: COLOR.superficieElevada },
  circulo: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLOR.acento, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  punto: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLOR.acento },
  cajaEnRenglon: { marginRight: 12 },
  textoDeRenglon: { flex: 1, fontSize: 16, lineHeight: 22, color: COLOR.texto },
  // Chips: 44 dp de alto como mínimo; el elegido va lleno y en negrita, el color no es la única señal.
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 },
  chip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, borderWidth: 1, borderColor: COLOR.bordeControl, backgroundColor: COLOR.superficie, justifyContent: 'center' },
  chipElegido: { backgroundColor: COLOR.botonFondo, borderColor: COLOR.botonFondo },
  textoDeChip: { fontSize: 16, fontWeight: '600', color: COLOR.texto },
  textoDeChipElegido: { fontWeight: '800', color: COLOR.botonTexto },
  filaDeTabla: { marginVertical: 6 },
  nombreDeFila: { fontSize: 16, fontWeight: '700', color: COLOR.texto },
  alimento: { borderTopWidth: 1, borderTopColor: COLOR.borde, paddingTop: 4, marginTop: 4 },
  filaDeAlimento: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  nombreDeAlimento: { flex: 1, fontSize: 16, color: COLOR.texto },
}));
