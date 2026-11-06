/**
 * APK · una pregunta de un formulario V2, de cualquiera de los nueve tipos, con el borrador de `formulario-v2.ts`. La
 * dibujan igual una solicitud (`pantallas/formularios.tsx`) y «Mis hábitos» (`pantallas/mis-habitos.tsx`, DL-165 D-9):
 * - DL-165 D-2: la ayuda a la vista es corta (en un texto, es su texto de muestra), el «para qué» va plegado al pie y una
 *   pregunta opcional con algo elegido se suelta con «Quitar respuesta» (`puedeQuitar`, que decide quien la usa con
 *   `seOfreceQuitarRespuesta`, del dominio);
 * - DL-165 D-5: un número con su tope en una tabla dice cuánto admite con lo marcado (`tope`, de `topeDesdeLaTabla`);
 * - lo que la persona toca o escribe va al borrador (`editar`) y saca el aviso de esa pregunta (`alTocar`).
 * Solo dibuja: qué preguntas se ven, en qué orden y qué rótulo llevan lo decide la pantalla.
 */
import { ayudaDeLaPregunta, COPY_FORMULARIOS_V2 as V, valoresAdmitidos, type CampoDePlantillaV2 } from '@be/domain';
import { View } from 'react-native';
import { CampoDeAlimentos, CampoDeHorarios, ListaQueSeRepite, OpcionUnica, OpcionesMultiples, PieDePregunta, PreguntaSiONo, TablaDeOpciones } from './campos-de-formulario';
import { valorComo, type Borrador, type EventoDeBorrador } from './formulario-v2';
import { Campo, estilos as ui, estilosPorTema } from './ui';

export function PreguntaV2({
  campo: c,
  etiqueta,
  borrador,
  errores,
  puedeQuitar,
  tope,
  editar,
  alTocar,
}: {
  campo: CampoDePlantillaV2;
  /** El rótulo de la pregunta: en una solicitud, con «(Opcional)» si no es obligatoria (`rotuloDe`). */
  etiqueta: string;
  borrador: Borrador;
  /** Los avisos por campo, subcampo o parte: lo que no se entiende o la API no aceptó. */
  errores: Readonly<Record<string, string>>;
  puedeQuitar: boolean;
  tope: { readonly tope: number; readonly tabla: string } | null;
  editar: (ev: EventoDeBorrador) => void;
  alTocar: (fieldCode: string) => void;
}) {
  const error = errores[c.fieldCode] ?? null;
  const ayuda = ayudaDeLaPregunta(c);
  const quitar = puedeQuitar
    ? () => {
        editar({ tipo: 'quitar', fieldCode: c.fieldCode });
        alTocar(c.fieldCode);
      }
    : null;
  const cabecera = { etiqueta, ayuda: ayuda.aLaVista, paraQue: c.purpose, error, quitar };
  switch (c.dataType) {
    case 'TEXT':
      return (
        <View>
          <Campo
            etiqueta={etiqueta}
            // El ejemplo es el texto de muestra: se lee donde se escribe y se va al escribir. El lector lo dice igual.
            placeholder={ayuda.deMuestra ?? undefined}
            accessibilityHint={ayuda.deMuestra ?? undefined}
            value={valorComo(borrador, c.fieldCode, 'TEXT').texto}
            error={error}
            onChangeText={(t) => {
              editar({ tipo: 'escribir', fieldCode: c.fieldCode, como: 'TEXT', texto: t });
              alTocar(c.fieldCode);
            }}
            maxLength={c.maxLength}
            {...(c.multiline ? { multiline: true, style: [ui.entrada, estilos.textoLargo, error ? ui.entradaConError : null] } : {})}
          />
          <PieDePregunta etiqueta={etiqueta} paraQue={c.purpose} />
        </View>
      );
    case 'NUMBER': {
      // DL-165 D-5: si el número toma su tope de una tabla («días por semana» y los días marcados), se dice cuánto admite.
      const ayudaDelNumero = [ayuda.aLaVista ?? (c.limits ? valoresAdmitidos(c.limits, c.unit) : null), tope ? V.hastaLoMarcado(tope.tope, tope.tabla) : null].filter((t): t is string => !!t).join(' ');
      return (
        <View>
          <Campo
            etiqueta={c.unit ? `${etiqueta} (${c.unit})` : etiqueta}
            ayuda={ayudaDelNumero || undefined}
            value={valorComo(borrador, c.fieldCode, 'NUMBER').texto}
            error={error}
            onChangeText={(t) => {
              editar({ tipo: 'escribir', fieldCode: c.fieldCode, como: 'NUMBER', texto: t });
              alTocar(c.fieldCode);
            }}
            // El teclado decimal de Android puede ofrecer coma: por eso el valor se lee con `leerNumero` al enviar.
            keyboardType="decimal-pad"
          />
          <PieDePregunta etiqueta={etiqueta} paraQue={c.purpose} />
        </View>
      );
    }
    case 'BOOLEAN':
      // Sí/No se elige entre dos opciones: escribirlo obligaría a interpretar el texto, y lo mal interpretado quedaría
      // guardado como declarado por la persona (09 §22.7).
      return (
        <PreguntaSiONo
          cabecera={cabecera}
          valor={valorComo(borrador, c.fieldCode, 'BOOLEAN').eleccion}
          onCambio={(v) => {
            editar({ tipo: 'elegir-si-o-no', fieldCode: c.fieldCode, eleccion: v });
            alTocar(c.fieldCode);
          }}
        />
      );
    case 'CHOICE': {
      const v = valorComo(borrador, c.fieldCode, 'CHOICE');
      return (
        <OpcionUnica
          cabecera={cabecera}
          campo={c}
          valor={v.opcion}
          otro={v.otro}
          onCambio={(opcion) => {
            editar({ tipo: 'elegir-opcion', fieldCode: c.fieldCode, opcion });
            alTocar(c.fieldCode);
          }}
          onOtro={(texto) => editar({ tipo: 'escribir-otro', fieldCode: c.fieldCode, texto })}
        />
      );
    }
    case 'MULTI_CHOICE': {
      const v = valorComo(borrador, c.fieldCode, 'MULTI_CHOICE');
      return (
        <OpcionesMultiples
          cabecera={cabecera}
          campo={c}
          elegidas={v.opciones}
          otro={v.otro}
          onAlternar={(opcion) => {
            editar({ tipo: 'alternar-opcion', fieldCode: c.fieldCode, opcion, exclusivas: c.exclusiveOptionCodes, maximo: c.maxSelected });
            alTocar(c.fieldCode);
          }}
          onOtro={(texto) => editar({ tipo: 'escribir-otro', fieldCode: c.fieldCode, texto })}
        />
      );
    }
    case 'LIST':
      return (
        <ListaQueSeRepite
          cabecera={cabecera}
          campo={c}
          renglones={valorComo(borrador, c.fieldCode, 'LIST').renglones}
          errores={errores}
          onSumar={() => editar({ tipo: 'sumar-renglon', fieldCode: c.fieldCode, maximo: c.maxItems })}
          onQuitar={(renglon) => {
            editar({ tipo: 'quitar-renglon', fieldCode: c.fieldCode, id: renglon });
            alTocar(c.fieldCode);
          }}
          onEditar={(renglon, code, valor) => {
            editar({ tipo: 'editar-subcampo', fieldCode: c.fieldCode, id: renglon, code, valor });
            alTocar(c.fieldCode);
          }}
        />
      );
    case 'MATRIX':
      return (
        <TablaDeOpciones
          cabecera={cabecera}
          campo={c}
          celdas={valorComo(borrador, c.fieldCode, 'MATRIX').celdas}
          onElegir={(fila, columna) => {
            editar({ tipo: 'elegir-celda', fieldCode: c.fieldCode, fila, columna });
            alTocar(c.fieldCode);
          }}
        />
      );
    case 'FOODS':
      return (
        <CampoDeAlimentos
          cabecera={cabecera}
          campo={c}
          alimentos={valorComo(borrador, c.fieldCode, 'FOODS').alimentos}
          onAlternarSugerido={(nombre) => {
            editar({ tipo: 'alternar-alimento', fieldCode: c.fieldCode, nombre, maximo: c.maxItems });
            alTocar(c.fieldCode);
          }}
          onSumar={(nombre) => {
            editar({ tipo: 'sumar-alimento', fieldCode: c.fieldCode, nombre, maximo: c.maxItems });
            alTocar(c.fieldCode);
          }}
          onQuitar={(nombre) => {
            editar({ tipo: 'quitar-alimento', fieldCode: c.fieldCode, nombre });
            alTocar(c.fieldCode);
          }}
          onMotivo={(nombre, motivoDelAlimento) => editar({ tipo: 'motivo-de-alimento', fieldCode: c.fieldCode, nombre, motivo: motivoDelAlimento })}
        />
      );
    case 'TIMES':
      return (
        <CampoDeHorarios
          cabecera={cabecera}
          campo={c}
          horas={valorComo(borrador, c.fieldCode, 'TIMES').horas}
          errores={errores}
          onEditar={(parte, texto) => {
            editar({ tipo: 'escribir-hora', fieldCode: c.fieldCode, parte, texto });
            alTocar(c.fieldCode);
          }}
        />
      );
  }
}

const estilos = estilosPorTema(() => ({
  // Un texto de varias líneas, con lo escrito arriba: el estilo del campo, más alto (como en «Comí algo diferente»).
  textoLargo: { minHeight: 96, paddingTop: 12, paddingBottom: 12, textAlignVertical: 'top' },
}));
