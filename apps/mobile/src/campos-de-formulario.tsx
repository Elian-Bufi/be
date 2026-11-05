/**
 * APK · los campos de un formulario V2 (WP-FORMULARIOS-DE-INICIO, FI-04), pensados para tocar y no para escribir:
 * una opción como renglones, varias como casillas, la lista que se repite con «Sumar» y «Quitar», la tabla como una
 * pregunta por fila, los alimentos como chips más los escritos, y los horarios como un campo por parte.
 *
 * Reglas comunes (10-B10 §7, §9):
 * - **nada viene elegido**: no responder es legítimo y tiene su estado. Una pregunta opcional con algo elegido se suelta
 *   con «Quitar respuesta» (DL-165 D-2), que reemplaza al «tocá de nuevo la opción elegida»: en una opción única, tocar
 *   la elegida no hace nada, como en cualquier botón de opción. Las casillas, los chips de una tabla y los de un renglón
 *   se siguen soltando con un toque, porque son casillas;
 * - **las ayudas, plegadas** (D-2): el «para qué» de cada pregunta se abre con «¿Para qué?», al pie de la pregunta, y el
 *   lector de pantalla lo anuncia como un botón que se despliega; la ayuda de una respuesta de texto es su texto de muestra;
 * - **roles y estados para el lector de pantalla:** `radiogroup`/`radio` con `checked`, `checkbox`, y cada opción de una
 *   tabla se lee con su fila («Sentadilla: Con ayuda»); el error de la pregunta se anuncia cuando aparece (la línea de
 *   error es una región viva) y entra en el nombre del primer control del grupo, como en `Campo` entra en el del campo;
 * - **objetivos de toque de 44 dp o más**, texto además de color, y solo colores de `tema.ts`.
 * Los textos de P0 (`Campo`, `CampoSiONo`) siguen en `ui.tsx`; acá están los tipos del formulario y lo que los compone.
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

/**
 * Lo que encabeza cada pregunta: su rótulo y su ayuda; al pie, para qué se usa el dato (minimización: cada pregunta lo
 * dice, plegado) y, si se ofrece, «Quitar respuesta» (`seOfreceQuitarRespuesta`, del dominio).
 */
export interface CabeceraDePregunta {
  readonly etiqueta: string;
  readonly ayuda?: string | null;
  readonly paraQue?: string | null;
  readonly error?: string | null;
  /** Suelta la respuesta de una pregunta opcional con algo elegido; `null` o ausente: no se ofrece. */
  readonly quitar?: (() => void) | null;
}

/** El nombre de un control con el error de su pregunta, con las mismas palabras que usa `Campo` para su campo. */
const nombreParaElLector = (etiqueta: string, error?: string | null): string => (error ? `${etiqueta}. Revisá este campo: ${error}` : etiqueta);
/** El nombre del primer control de un grupo: lleva el error de la pregunta; los demás, solo su texto. */
const nombreDelPrimero = (texto: string, esElPrimero: boolean, error?: string | null): string => (esElPrimero && error ? nombreParaElLector(texto, error) : texto);
/**
 * Para el primer `Campo` de un grupo: su nombre para el lector con el error de la pregunta (y el propio, si lo tiene),
 * armado como lo arma `Campo`. Sin error de la pregunta no se pasa nada y `Campo` arma el suyo: así no se lee dos veces.
 */
const nombreConErrorDelGrupo = (etiqueta: string, propio: string | null, delGrupo?: string | null): { accessibilityLabel?: string } =>
  delGrupo ? { accessibilityLabel: nombreParaElLector(etiqueta, [propio, delGrupo].filter((e): e is string => !!e).join(' ')) } : {};
const conMayuscula = (s: string): string => s.charAt(0).toLocaleUpperCase('es-AR') + s.slice(1);

function Cabecera({ etiqueta, ayuda }: CabeceraDePregunta) {
  return (
    <>
      <Text style={ui.etiqueta}>{etiqueta}</Text>
      {ayuda ? <Text style={ui.tenue}>{ayuda}</Text> : null}
    </>
  );
}

/**
 * El pie de una pregunta (DL-165 D-2): «¿Para qué?», que despliega para qué se usa el dato, y «Quitar respuesta», cuando
 * se ofrece. Los dos dicen de qué pregunta son, para el lector de pantalla; «¿Para qué?» dice si está desplegado.
 */
export function PieDePregunta({ etiqueta, paraQue, quitar }: Pick<CabeceraDePregunta, 'etiqueta' | 'paraQue' | 'quitar'>) {
  const [abierto, setAbierto] = useState(false);
  if (!paraQue && !quitar) return null;
  return (
    <View>
      <View style={estilos.pie}>
        {paraQue ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={COPY_FORMULARIOS_V2.paraQueDe(etiqueta)}
            accessibilityState={{ expanded: abierto }}
            onPress={() => setAbierto((a) => !a)}
            hitSlop={8}
            style={({ pressed }) => [estilos.botonDelPie, pressed && ui.presionado]}
          >
            <Icono nombre="pregunta" tamano={18} tono="acento" />
            <Text style={estilos.textoDelPie}>{COPY_FORMULARIOS_V2.paraQueBoton}</Text>
          </Pressable>
        ) : null}
        {quitar ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={COPY_FORMULARIOS_V2.quitarRespuestaDe(etiqueta)}
            onPress={quitar}
            hitSlop={8}
            style={({ pressed }) => [estilos.botonDelPie, pressed && ui.presionado]}
          >
            <Icono nombre="cerrar" tamano={18} tono="acento" />
            <Text style={estilos.textoDelPie}>{COPY_FORMULARIOS_V2.quitarRespuesta}</Text>
          </Pressable>
        ) : null}
      </View>
      {abierto && paraQue ? <Text style={[ui.tenue, estilos.paraQue]}>{paraQue}</Text> : null}
    </View>
  );
}

/**
 * El error de una pregunta, con texto y el ícono, debajo del grupo. A diferencia del de `Campo` (que el lector ya oye en
 * el nombre del campo), acá sí es para el lector: el grupo no es un elemento enfocable que pueda llevarlo en su nombre,
 * así que la línea se anuncia sola cuando aparece (región viva) y se lee al recorrer el formulario.
 */
function LineaDeError({ texto }: { texto: string }) {
  return (
    <View style={ui.lineaDeError} accessible accessibilityRole="alert" accessibilityLiveRegion="polite" accessibilityLabel={texto}>
      <View style={ui.iconoDeError}>
        <Icono nombre="aviso" tamano={18} tono="error" />
      </View>
      <Text style={[ui.error, ui.textoDeError]}>{texto}</Text>
    </View>
  );
}

/**
 * El marco de una pregunta que no es un `Campo`: cabecera, el grupo con su nombre para el lector, y el error. El error
 * va en la línea de abajo (que el lector sí anuncia) y en el nombre del primer control del grupo (lo arma cada tipo).
 */
function Pregunta({ cabecera, rol, hijos, pie }: { cabecera: CabeceraDePregunta; rol: 'radiogroup' | 'none'; hijos: ReactNode; pie?: ReactNode }) {
  return (
    <View style={[ui.campo, cabecera.error ? estilos.preguntaConError : null]}>
      <Cabecera {...cabecera} />
      <View accessibilityRole={rol === 'none' ? undefined : rol} accessibilityLabel={cabecera.etiqueta}>
        {hijos}
      </View>
      {pie}
      {cabecera.error ? <LineaDeError texto={cabecera.error} /> : null}
      <PieDePregunta etiqueta={cabecera.etiqueta} paraQue={cabecera.paraQue} quitar={cabecera.quitar} />
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
      cabecera={cabecera}
      rol="radiogroup"
      // DL-165 D-2: tocar la elegida no la suelta (como cualquier botón de opción); una opcional se suelta con «Quitar respuesta».
      hijos={campo.options.map((o, i) => (
        <RenglonDeOpcion key={o.code} texto={o.label} etiqueta={nombreDelPrimero(o.label, i === 0, cabecera.error)} elegida={valor === o.code} onPress={() => onCambio(o.code)} />
      ))}
      pie={campo.otherOptionCode !== null && valor === campo.otherOptionCode ? <CampoDeOtro texto={otro} onCambio={onOtro} /> : null}
    />
  );
}

/**
 * Un Sí o no del formulario, con el mismo marco que las demás preguntas: los dos renglones, el pie con «¿Para qué?» y,
 * si es opcional y hay algo elegido, «Quitar respuesta». Nada viene elegido: «sin elegir» es el tercer estado (09:1586).
 */
export function PreguntaSiONo({ cabecera, valor, onCambio }: { cabecera: CabeceraDePregunta; valor: EleccionSiONo; onCambio: (v: EleccionSiONo) => void }) {
  return (
    <Pregunta
      cabecera={cabecera}
      rol="radiogroup"
      hijos={OPCIONES_SI_O_NO.map((o, i) => (
        <RenglonDeOpcion key={o.valor} texto={o.texto} etiqueta={nombreDelPrimero(o.texto, i === 0, cabecera.error)} elegida={valor === o.valor} onPress={() => onCambio(o.valor)} />
      ))}
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
      hijos={campo.options.map((o, i) => {
        const marcada = elegidas.includes(o.code);
        // Con el tope alcanzado, las que no están marcadas esperan; una exclusiva («Ninguna») se puede tocar siempre.
        const deshabilitada = tope && !marcada && !campo.exclusiveOptionCodes.includes(o.code);
        return (
          <Pressable
            key={o.code}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: marcada, disabled: deshabilitada }}
            accessibilityLabel={nombreDelPrimero(o.label, i === 0, cabecera.error)}
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

/**
 * Chips excluyentes (`radiogroup`); tocar el elegido lo suelta. `prefijo` nombra cada chip con su fila para el lector;
 * `errorDelGrupo` es el error de la pregunta cuando estos son sus primeros controles: va en el nombre del primero.
 */
function ChipsExcluyentes({
  etiqueta,
  opciones,
  valor,
  onCambio,
  prefijo,
  errorDelGrupo,
}: {
  etiqueta: string;
  opciones: readonly OpcionDeCampo[];
  valor: string | null;
  onCambio: (code: string | null) => void;
  prefijo?: string;
  errorDelGrupo?: string | null;
}) {
  return (
    <View style={estilos.chips} accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
      {opciones.map((o, i) => (
        <Chip key={o.code} texto={o.label} etiqueta={nombreDelPrimero(prefijo ? `${prefijo}: ${o.label}` : o.label, i === 0, errorDelGrupo)} elegido={valor === o.code} rol="radio" onPress={() => onCambio(valor === o.code ? null : o.code)} />
      ))}
    </View>
  );
}

// ─── La lista que se repite ─────────────────────────────────────────────────────────────────────

/** Un subcampo de un renglón. `errorDelGrupo` llega solo al primero del primer renglón: el error de la lista va en su nombre. */
function Subcampo({ sub, valor, error, onCambio, errorDelGrupo }: { sub: SubcampoDeLista; valor: string; error: string | null; onCambio: (v: string) => void; errorDelGrupo?: string | null }) {
  const rotulo = sub.required ? sub.label : `${sub.label} (${COPY_FORMULARIOS_V2.opcional})`;
  switch (sub.dataType) {
    case 'TEXT':
      return <Campo etiqueta={rotulo} value={valor} onChangeText={onCambio} maxLength={sub.maxLength} error={error} {...nombreConErrorDelGrupo(rotulo, error, errorDelGrupo)} />;
    case 'NUMBER': {
      const etiqueta = sub.unit ? `${rotulo} (${sub.unit})` : rotulo;
      return <Campo etiqueta={etiqueta} value={valor} onChangeText={onCambio} keyboardType="decimal-pad" error={error} {...nombreConErrorDelGrupo(etiqueta, error, errorDelGrupo)} />;
    }
    case 'BOOLEAN':
      // `CampoSiONo` (P0) no lleva error en el nombre de sus opciones: el de la lista queda en la línea de error, que se anuncia.
      return <CampoSiONo etiqueta={rotulo} opciones={OPCIONES_SI_O_NO} valor={valor} onCambio={onCambio} />;
    case 'CHOICE':
      return (
        <View style={ui.campo}>
          <Text style={ui.etiqueta}>{rotulo}</Text>
          <ChipsExcluyentes etiqueta={rotulo} opciones={sub.options} valor={valor === '' ? null : valor} onCambio={(c) => onCambio(c ?? '')} errorDelGrupo={errorDelGrupo} />
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
          {campo.itemFields.map((sub, j) => (
            <Subcampo
              key={sub.code}
              sub={sub}
              valor={r.valores[sub.code] ?? ''}
              error={errores[claveDeSubcampo(campo.fieldCode, r.id, sub.code)] ?? null}
              onCambio={(v) => onEditar(r.id, sub.code, v)}
              errorDelGrupo={i === 0 && j === 0 ? cabecera.error : null}
            />
          ))}
          <Boton texto={COPY_FORMULARIOS_V2.quitarRenglon(item)} etiqueta={`${COPY_FORMULARIOS_V2.quitarRenglon(item)} ${i + 1}`} tipo="enlace" icono="cerrar" onPress={() => onQuitar(r.id)} />
        </Tarjeta>
      ))}
      pie={
        <>
          <Text style={ui.tenue}>{T.renglones(renglones.length, campo.maxItems)}</Text>
          {/* Sin renglones, «Sumar» es el primer control de la lista: el error de la pregunta va en su nombre. */}
          <Boton
            texto={COPY_FORMULARIOS_V2.sumarRenglon(item)}
            etiqueta={renglones.length === 0 && cabecera.error ? nombreParaElLector(COPY_FORMULARIOS_V2.sumarRenglon(item), cabecera.error) : undefined}
            tipo="secundario"
            icono="mas"
            onPress={onSumar}
            deshabilitado={lleno}
          />
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
      hijos={campo.rows.map((fila, i) => (
        <View key={fila.code} style={estilos.filaDeTabla}>
          <Text style={estilos.nombreDeFila}>{fila.label}</Text>
          <ChipsExcluyentes
            etiqueta={`${cabecera.etiqueta}: ${fila.label}`}
            prefijo={fila.label}
            opciones={campo.columns}
            valor={celdas[fila.code] ?? null}
            onCambio={(c) => onElegir(fila.code, c)}
            errorDelGrupo={i === 0 ? cabecera.error : null}
          />
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
              {campo.suggestions.map((s, i) => (
                <Chip key={s} texto={s} etiqueta={nombreDelPrimero(s, i === 0, cabecera.error)} elegido={elegido(s)} rol="checkbox" deshabilitado={lleno && !elegido(s)} onPress={() => onAlternarSugerido(s)} />
              ))}
            </View>
          ) : null}
          {/* Sin sugeridos, el campo «Alimento» es el primer control: el error de la pregunta va en su nombre. */}
          <Campo
            etiqueta={T.nombreDelAlimento}
            value={nuevo}
            onChangeText={setNuevo}
            maxLength={LARGO_MAXIMO_DE_ALIMENTO}
            returnKeyType="done"
            onSubmitEditing={sumar}
            editable={!lleno}
            {...nombreConErrorDelGrupo(T.nombreDelAlimento, null, campo.suggestions.length ? null : cabecera.error)}
          />
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
      hijos={campo.parts.map((p, i) => {
        const etiqueta = `${p.label} (HH:MM)`;
        const error = errores[claveDeParte(campo.fieldCode, p.code)] ?? null;
        return (
          <Campo
            key={p.code}
            etiqueta={etiqueta}
            placeholder={T.horaEjemplo}
            value={horas[p.code] ?? ''}
            onChangeText={(t) => onEditar(p.code, t)}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            error={error}
            // La primera parte es el primer control del grupo: el error de la pregunta va en su nombre, con el propio si lo tiene.
            {...nombreConErrorDelGrupo(etiqueta, error, i === 0 ? cabecera.error : null)}
          />
        );
      })}
    />
  );
}

const estilos = estilosPorTema((COLOR) => ({
  preguntaConError: { borderLeftWidth: 3, borderLeftColor: COLOR.error, paddingLeft: 10 },
  // El pie de una pregunta: «¿Para qué?» y «Quitar respuesta», en una fila que se parte con letra grande; 44 dp de toque.
  pie: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 20, rowGap: 4, marginTop: 4 },
  botonDelPie: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingVertical: 8 },
  textoDelPie: { fontSize: 15, fontWeight: '600', color: COLOR.acento, textDecorationLine: 'underline' },
  paraQue: { marginBottom: 4 },
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
