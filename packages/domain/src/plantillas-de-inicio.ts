/**
 * Las dos plantillas de inicio (WP-FORMULARIOS-DE-INICIO, FI-02; DL-164 D-7) como datos tipados del contrato V2:
 * «Cómo comés hoy» (FRM-NUTRICION-INICIO v1) y «Antes de entrenar» (FRM-ENTRENAMIENTO v2, sucesora de la v1 de DL-100).
 * De acá sale el `contenido` de la migración que solo agrega (`contenidoDePlantillaDeInicio`), y contra esto se valida
 * cada respuesta (`validarRespuestasV2`).
 *
 * Criterios del panel editorial (nutrición clínica y deportiva, entrenamiento de fuerza, medicina del deporte):
 * - cada pregunta dice para qué se usa, en palabras de la persona, y no hay ninguna que no cambie una decisión del plan
 *   (minimización); lo que la persona prefiera charlar en persona se puede dejar sin responder o marcarlo así;
 * - tocar antes que escribir: lo que en el diseño era «detalle» en texto es acá una opción o varias, y lo que se puede
 *   saltear va detrás de una condición (`showIf`) sobre una pregunta anterior;
 * - ubicar, nunca calificar: las opciones ubican a la persona («me cuesta», «con dudas»), no la puntúan;
 * - los códigos que ya existen en FRM-SALUD, FRM-HABITOS y FRM-ENTRENAMIENTO v1 se conservan cuando la pregunta es la
 *   misma; la v2 de entrenamiento mantiene los seis de la v1 porque `CONTEXTO_DE_ENTRENAMIENTO` los precargaba (DL-100;
 *   desde DL-165 D-29, el escritorio pide el formulario entero).
 */
import type { CampoDePlantillaV2, CondicionDeVisibilidad, OpcionDeCampo, SeccionDePlantillaV2, SubcampoDeLista, TopeDesdeTabla } from './contratos-formularios-v2';
import type { Alcance } from './alcance';
import { CategoriaDeDato } from './formularios';

export interface PlantillaDeInicio {
  readonly clave: string;
  readonly version: string;
  readonly nombre: string;
  readonly proposito: string;
  /** El área en la que se pide; `null` en «Tus hábitos» (FRM-HABITOS), que es transversal: se pide en el área de quien la pide. */
  readonly dominio: Alcance | null;
  /**
   * El formato del contenido: 2 en las de DL-164; 3 en las de la ronda 2 (DL-165), que usan lo que la APK 0.20 no lee
   * (`loQueUsaDelFormato3`) y solo se le entregan a un cliente que declara `forms-format-3`.
   */
  readonly formato: 2 | 3;
  /** Lo que tarda una persona en responderla. Desde DL-165 D-3 ya no se dice: las de formato 3 no lo traen (`null`). */
  readonly estimatedMinutes: number | null;
  readonly sections: SeccionDePlantillaV2[];
}

/**
 * El `contenido` de la versión en la base (WP §5): formato 2, con los minutos y las secciones; formato 3, sin los minutos
 * (DL-165 D-3). El JSON de las de formato 2 es el mismo que sembró la migración de DL-164, clave por clave.
 */
export function contenidoDePlantillaDeInicio(
  plantilla: PlantillaDeInicio,
): { format: 2; estimatedMinutes: number | null; sections: SeccionDePlantillaV2[] } | { format: 3; sections: SeccionDePlantillaV2[] } {
  return plantilla.formato === 3 ? { format: 3, sections: plantilla.sections } : { format: 2, estimatedMinutes: plantilla.estimatedMinutes, sections: plantilla.sections };
}

// ─── Constructores: dejan el contenido legible y tipado ───────────────────────────────────────────

const { SALUD_Y_SEGURIDAD: SALUD, HABITOS_Y_CONTEXTO: HABITOS, OBJETIVOS_Y_PREFERENCIAS: OBJETIVOS } = CategoriaDeDato;
type Categoria = CampoDePlantillaV2['category'];
type Limites = Extract<CampoDePlantillaV2, { dataType: 'NUMBER' }>['limits'];

interface Comun {
  readonly codigo: string;
  readonly etiqueta: string;
  readonly cat: Categoria;
  /** Para qué se usa, en palabras de la persona. */
  readonly paraQue: string;
  readonly ayuda?: string;
  readonly si?: CondicionDeVisibilidad;
  readonly requerida?: boolean;
  /** Formato 3 (DL-165 D-4): `false` si no viene pedida al elegir el formulario. Sin esto, viene pedida. */
  readonly pedida?: boolean;
}

const op = (code: string, label: string): OpcionDeCampo => ({ code, label });
const si = (fieldCode: string, ...anyOf: (string | boolean)[]): CondicionDeVisibilidad => ({ fieldCode, anyOf });

// `requestedByDefault` va solo cuando es `false`: así el JSON de las versiones de formato 2 queda igual que el sembrado.
const base = (c: Comun) => ({
  fieldCode: c.codigo,
  label: c.etiqueta,
  category: c.cat,
  helpText: c.ayuda ?? null,
  purpose: c.paraQue,
  showIf: c.si ?? null,
  requiredByDefault: c.requerida ?? false,
  ...(c.pedida === false ? { requestedByDefault: false } : {}),
});
const texto = (c: Comun, maxLength = 300, multiline = false): CampoDePlantillaV2 => ({ ...base(c), dataType: 'TEXT', multiline, maxLength });
const numero = (c: Comun, unit: string | null, limits: Limites, maxFromMatrix?: TopeDesdeTabla): CampoDePlantillaV2 =>
  ({ ...base(c), dataType: 'NUMBER', unit, limits, ...(maxFromMatrix ? { maxFromMatrix } : {}) });
const siONo = (c: Comun): CampoDePlantillaV2 => ({ ...base(c), dataType: 'BOOLEAN' });
const unaOpcion = (c: Comun, options: OpcionDeCampo[], otherOptionCode: string | null = null): CampoDePlantillaV2 =>
  ({ ...base(c), dataType: 'CHOICE', options, otherOptionCode });
const variasOpciones = (c: Comun, options: OpcionDeCampo[], extra: { maxSelected?: number; exclusivas?: string[]; otra?: string } = {}): CampoDePlantillaV2 =>
  ({ ...base(c), dataType: 'MULTI_CHOICE', options, maxSelected: extra.maxSelected ?? null, exclusiveOptionCodes: extra.exclusivas ?? [], otherOptionCode: extra.otra ?? null });
const lista = (c: Comun, itemLabel: string, itemFields: SubcampoDeLista[], minItems: number, maxItems: number): CampoDePlantillaV2 =>
  ({ ...base(c), dataType: 'LIST', itemLabel, itemFields, minItems, maxItems });
const tabla = (c: Comun, rows: OpcionDeCampo[], columns: OpcionDeCampo[]): CampoDePlantillaV2 => ({ ...base(c), dataType: 'MATRIX', rows, columns });
const alimentos = (c: Comun, reasons: OpcionDeCampo[], maxItems: number): CampoDePlantillaV2 =>
  ({ ...base(c), dataType: 'FOODS', suggestions: [...SUGERENCIAS_DE_ALIMENTOS], reasons, maxItems });
const horarios = (c: Comun, parts: OpcionDeCampo[]): CampoDePlantillaV2 => ({ ...base(c), dataType: 'TIMES', parts });

/** Un subcampo de texto; con `ejemplo` (formato 3, DL-165 D-2), su texto de muestra. */
const subTexto = (code: string, label: string, required: boolean, maxLength: number, ejemplo?: string): SubcampoDeLista =>
  ({ code, label, required, dataType: 'TEXT', maxLength, ...(ejemplo ? { helpText: ejemplo } : {}) });
const subNumero = (code: string, label: string, required: boolean, unit: string | null, limits: Limites): SubcampoDeLista => ({ code, label, required, dataType: 'NUMBER', unit, limits });
const subOpcion = (code: string, label: string, required: boolean, options: OpcionDeCampo[]): SubcampoDeLista => ({ code, label, required, dataType: 'CHOICE', options });
/** Formato 3 (DL-165 D-6): varias opciones dentro del renglón. */
const subVarias = (code: string, label: string, required: boolean, options: OpcionDeCampo[]): SubcampoDeLista => ({ code, label, required, dataType: 'MULTI_CHOICE', options });

// ─── Opciones compartidas ─────────────────────────────────────────────────────────────────────────

/** Los alimentos sugeridos en «que sí» y «que no», por grupo, para que la pantalla los pueda agrupar. */
export const GRUPOS_DE_ALIMENTOS_SUGERIDOS: readonly { readonly grupo: string; readonly alimentos: readonly string[] }[] = [
  { grupo: 'Verduras', alimentos: ['Tomate', 'Lechuga y hojas verdes', 'Zanahoria', 'Zapallo y calabaza', 'Zapallito', 'Brócoli y coliflor', 'Berenjena', 'Morrón', 'Cebolla', 'Choclo', 'Papa y batata', 'Espinaca y acelga'] },
  { grupo: 'Frutas', alimentos: ['Banana', 'Manzana', 'Naranja y mandarina', 'Frutillas y frutos rojos', 'Pera', 'Uvas', 'Durazno', 'Kiwi', 'Ananá', 'Palta'] },
  { grupo: 'Legumbres', alimentos: ['Lentejas', 'Garbanzos', 'Porotos', 'Arvejas', 'Soja'] },
  { grupo: 'Cereales y harinas', alimentos: ['Arroz', 'Fideos', 'Avena', 'Pan blanco', 'Pan integral', 'Polenta', 'Quinoa', 'Galletitas de agua o de arroz'] },
  { grupo: 'Carnes y huevos', alimentos: ['Carne vacuna', 'Pollo', 'Cerdo', 'Pescado', 'Mariscos', 'Atún o caballa en lata', 'Huevo', 'Fiambres', 'Hígado y achuras'] },
  { grupo: 'Lácteos', alimentos: ['Leche', 'Yogur', 'Queso fresco o untable', 'Quesos duros', 'Ricota'] },
  { grupo: 'Grasas y semillas', alimentos: ['Aceite de oliva', 'Frutos secos', 'Semillas', 'Manteca de maní'] },
];
export const SUGERENCIAS_DE_ALIMENTOS: readonly string[] = GRUPOS_DE_ALIMENTOS_SUGERIDOS.flatMap((g) => g.alimentos);

/** Las mismas seis comidas del día en la pregunta de los momentos y en cada renglón de la lista. */
const MOMENTOS_DEL_DIA = [op('desayuno', 'Desayuno'), op('media_manana', 'Media mañana'), op('almuerzo', 'Almuerzo'), op('merienda', 'Merienda'), op('cena', 'Cena'), op('despues_de_cenar', 'Después de cenar')];

/** `nivel_de_actividad` (FRM-HABITOS) con las mismas opciones en los dos formularios. */
const NIVEL_DE_ACTIVIDAD = [
  op('casi_todo_sentado', 'Casi todo el día sentado o sentada'),
  op('sentado_y_de_pie', 'Combino sentado y de pie'),
  op('de_pie_o_caminando', 'Mucho de pie o caminando'),
  op('trabajo_fisico', 'Trabajo físico'),
];

const NO_SI_NO_CORRESPONDE = [op('no', 'No'), op('si', 'Sí'), op('no_corresponde', 'No corresponde')];

// ─── «Cómo comés hoy» (FRM-NUTRICION-INICIO v1) ───────────────────────────────────────────────────

const CONDICIONES_QUE_PIDEN_INDICACION = ['diabetes', 'colesterol', 'presion_alta', 'hipotiroidismo', 'higado_graso', 'gota', 'anemia', 'renal', 'intestinal', 'reflujo', 'otra'];

export const PLANTILLA_NUTRICION_INICIO: PlantillaDeInicio = {
  clave: 'FRM-NUTRICION-INICIO',
  version: '1',
  nombre: 'Cómo comés hoy',
  proposito: 'Cómo come hoy la persona, para armar el primer plan de alimentación: su día, las comidas de su semana, lo que sí y lo que no, lo que toma, lo que su salud pide tener en cuenta y lo que busca',
  dominio: 'NUTRICION',
  formato: 2,
  estimatedMinutes: 15,
  sections: [
    {
      sectionCode: 'tu_dia',
      title: 'Tu día',
      intro: 'Para ubicar las comidas en tu día real.',
      fields: [
        horarios({ codigo: 'nut_horarios', etiqueta: '¿A qué hora te levantás y te acostás?', cat: HABITOS, requerida: true,
          ayuda: 'Si un día cambia mucho, poné el más común.',
          paraQue: 'Ubicar las comidas en tu día y ver cuántas horas pasan entre una y otra.' }, [
          op('semana_me_levanto', 'Entre semana · me levanto'),
          op('semana_me_acuesto', 'Entre semana · me acuesto'),
          op('finde_me_levanto', 'Fin de semana · me levanto'),
          op('finde_me_acuesto', 'Fin de semana · me acuesto'),
        ]),
        unaOpcion({ codigo: 'nut_jornada', etiqueta: '¿Cómo es tu jornada de trabajo o estudio?', cat: HABITOS, requerida: true,
          paraQue: 'Saber dónde vas a estar a la hora de cada comida.' }, [
          op('en_casa', 'En casa'),
          op('fuera_horario_fijo', 'Fuera de casa, con horario fijo'),
          op('fuera_horarios_cambian', 'Fuera de casa, con horarios que cambian'),
          op('turnos_o_noche', 'Por turnos o de noche'),
          op('no_trabajo_ni_estudio', 'No trabajo ni estudio'),
        ]),
        variasOpciones({ codigo: 'nut_comida_en_jornada', etiqueta: 'Cuando estás afuera, ¿cómo resolvés la comida?', cat: HABITOS,
          si: si('nut_jornada', 'fuera_horario_fijo', 'fuera_horarios_cambian', 'turnos_o_noche'),
          paraQue: 'Proponerte opciones que puedas llevar o comprar.' }, [
          op('llevo_vianda', 'Llevo vianda'),
          op('compro_cerca', 'Compro algo cerca'),
          op('comedor', 'Como en un comedor o cantina'),
          op('vuelvo_a_casa', 'Vuelvo a casa'),
          op('no_como_hasta_salir', 'No como hasta salir'),
        ]),
        unaOpcion({ codigo: 'nivel_de_actividad', etiqueta: '¿Cómo es tu día, en movimiento?', cat: HABITOS, requerida: true,
          paraQue: 'Calcular cuánta energía gastás en un día común.' }, NIVEL_DE_ACTIVIDAD),
        unaOpcion({ codigo: 'nut_actividad_semanal', etiqueta: '¿Hacés ejercicio o deporte en la semana?', cat: HABITOS, requerida: true,
          paraQue: 'Sumar lo que gastás entrenando y ubicar las comidas de esos días.' }, [
          op('no_por_ahora', 'No, por ahora'),
          op('1_o_2_veces', '1 o 2 veces por semana'),
          op('3_o_4_veces', '3 o 4 veces por semana'),
          op('5_o_mas_veces', '5 o más veces por semana'),
        ]),
        unaOpcion({ codigo: 'nut_hora_de_entrenamiento', etiqueta: '¿En qué momento del día solés entrenar?', cat: HABITOS,
          si: si('nut_actividad_semanal', '1_o_2_veces', '3_o_4_veces', '5_o_mas_veces'),
          paraQue: 'Ubicar qué comés antes y después de entrenar.' }, [
          op('temprano', 'Temprano a la mañana'),
          op('media_manana', 'Media mañana'),
          op('mediodia', 'Mediodía'),
          op('tarde', 'Tarde'),
          op('noche', 'Noche'),
          op('cambia', 'Cambia según el día'),
        ]),
        unaOpcion({ codigo: 'nut_quien_cocina', etiqueta: '¿Quién cocina y hace las compras en tu casa?', cat: HABITOS, requerida: true,
          paraQue: 'Saber qué cambios dependen de vos y cuáles conviene charlar en casa.' }, [
          op('yo', 'Yo'),
          op('otra_persona', 'Otra persona'),
          op('compartido', 'Lo compartimos'),
          op('compro_hecho', 'Compro casi todo hecho'),
        ]),
        unaOpcion({ codigo: 'nut_tiempo_para_cocinar', etiqueta: 'Un día de semana, ¿cuánto tiempo tenés para cocinar?', cat: HABITOS, requerida: true,
          paraQue: 'Que las recetas del plan entren en tu tiempo.' }, [
          op('menos_de_15', 'Menos de 15 minutos'),
          op('15_a_30', '15 a 30 minutos'),
          op('30_a_60', '30 a 60 minutos'),
          op('mas_de_una_hora', 'Más de una hora'),
        ]),
        variasOpciones({ codigo: 'nut_equipamiento_cocina', etiqueta: '¿Con qué contás en la cocina?', cat: HABITOS,
          paraQue: 'Elegir recetas que puedas hacer, y dejar comida lista para otro día.' }, [
          op('horno', 'Horno'),
          op('microondas', 'Microondas'),
          op('freezer', 'Freezer'),
          op('air_fryer', 'Freidora de aire'),
          op('solo_hornallas', 'Solo hornallas'),
        ], { exclusivas: ['solo_hornallas'] }),
        unaOpcion({ codigo: 'nut_presupuesto', etiqueta: '¿El precio de los alimentos te limita al elegir?', cat: HABITOS,
          paraQue: 'Priorizar alimentos que puedas sostener en el tiempo.' }, [
          op('no', 'No'),
          op('a_veces', 'A veces'),
          op('bastante', 'Sí, bastante'),
        ]),
      ],
    },
    {
      sectionCode: 'tu_semana',
      title: 'Las comidas de tu semana',
      intro: 'Es la parte más importante: de acá salen las comidas que vamos a usar en tu plan.',
      fields: [
        variasOpciones({ codigo: 'nut_momentos', etiqueta: '¿Qué comidas hacés en un día típico?', cat: HABITOS, requerida: true,
          paraQue: 'Respetar tu ritmo: no sumar comidas que no hacés ni sacar las que necesitás.' }, MOMENTOS_DEL_DIA),
        lista({ codigo: 'nut_comidas_habituales', etiqueta: 'Contame las comidas que más se repiten en tu semana', cat: HABITOS, requerida: true,
          ayuda: 'Con detalle y con las medidas de tu casa: «milanesa de carne al horno con puré de papa», «2 tostadas con queso untable y café con leche». Sumá al menos tres.',
          paraQue: 'Muchas van al plan tal cual o con la porción ajustada; otras las vamos cambiando de a poco, con vos.' }, 'comida', [
          subOpcion('momento', 'Momento', true, MOMENTOS_DEL_DIA),
          subTexto('que', 'Qué comés', true, 160),
          subOpcion('veces', 'Cuántas veces por semana', true, [op('1_vez', '1 vez'), op('2_o_3', '2 o 3 veces'), op('4_a_6', '4 a 6 veces'), op('todos_los_dias', 'Todos los días')]),
          subTexto('porcion', 'Cuánto, con medidas de tu casa (1 plato playo, 2 unidades, 1 taza, 3 cucharadas…)', true, 120),
          subOpcion('preparacion', 'Cómo se prepara', true, [
            op('al_horno', 'Al horno'), op('plancha_o_parrilla', 'A la plancha o parrilla'), op('hervido_o_vapor', 'Hervido o al vapor'),
            op('salteado', 'Salteado'), op('frito', 'Frito'), op('crudo', 'Crudo'), op('comprado_hecho', 'Comprado hecho'),
          ]),
          subOpcion('donde', 'Dónde la comés', false, [op('en_casa', 'En casa'), op('vianda', 'Vianda'), op('afuera', 'Afuera'), op('delivery', 'Delivery')]),
          subTexto('bebida', 'Con qué la acompañás', false, 80),
          subOpcion('gusto', '¿Querés seguir comiéndola?', true, [op('me_encanta', 'Sí, me encanta'), op('me_da_igual', 'Me da igual'), op('por_costumbre', 'La como por costumbre o por falta de tiempo')]),
        ], 3, 15),
        unaOpcion({ codigo: 'nut_mas_hambre', etiqueta: '¿En qué momento del día tenés más hambre?', cat: HABITOS,
          paraQue: 'Poner las comidas más grandes donde más hambre tenés.' }, [
          op('manana', 'A la mañana'),
          op('mediodia', 'Al mediodía'),
          op('tarde', 'A la tarde'),
          op('noche', 'A la noche'),
          op('parecido', 'Es parecido todo el día'),
        ]),
        unaOpcion({ codigo: 'nut_fin_de_semana', etiqueta: '¿Tu forma de comer cambia el fin de semana?', cat: HABITOS, requerida: true,
          paraQue: 'Planificar también el sábado y el domingo, con lo que te gusta hacer esos días.' }, [
          op('casi_igual', 'Casi igual'),
          op('un_poco', 'Un poco'),
          op('bastante', 'Bastante'),
        ]),
        texto({ codigo: 'nut_fin_de_semana_que_cambia', etiqueta: '¿Qué cambia?', cat: HABITOS, si: si('nut_fin_de_semana', 'un_poco', 'bastante'),
          ayuda: 'Por ejemplo: asado el domingo, salgo a comer el sábado.',
          paraQue: 'Que el plan del fin de semana se parezca a tu fin de semana.' }, 200),
        unaOpcion({ codigo: 'nut_afuera', etiqueta: '¿Cuántas veces por semana comés afuera o pedís delivery?', cat: HABITOS, requerida: true,
          paraQue: 'Tener buenas opciones también para esos días.' }, [
          op('nunca', 'Nunca o casi nunca'),
          op('1_o_2', '1 o 2'),
          op('3_o_4', '3 o 4'),
          op('5_o_mas', '5 o más'),
        ]),
        texto({ codigo: 'nut_afuera_que_elegis', etiqueta: '¿Qué pedís o elegís habitualmente?', cat: HABITOS, si: si('nut_afuera', '1_o_2', '3_o_4', '5_o_mas'),
          paraQue: 'Buscar, entre lo que ya elegís, lo que mejor va con tu plan.' }, 200),
        unaOpcion({ codigo: 'nut_picoteo', etiqueta: '¿Picoteás entre comidas?', cat: HABITOS,
          paraQue: 'Ordenar las colaciones en lugar de prohibirlas.' }, [
          op('casi_nunca', 'Casi nunca'),
          op('a_veces', 'A veces'),
          op('casi_todos_los_dias', 'Casi todos los días'),
        ]),
        texto({ codigo: 'nut_picoteo_que', etiqueta: '¿Qué picoteás y en qué momento?', cat: HABITOS, si: si('nut_picoteo', 'a_veces', 'casi_todos_los_dias'),
          paraQue: 'Ver si falta una comida o una colación en ese momento del día.' }, 200),
        variasOpciones({ codigo: 'nut_saltea', etiqueta: '¿Te salteás alguna comida seguido?', cat: HABITOS,
          paraQue: 'Entender si falta tiempo o falta hambre, porque se resuelven distinto.' }, [
          op('no', 'No'),
          op('desayuno', 'El desayuno'),
          op('almuerzo', 'El almuerzo'),
          op('merienda', 'La merienda'),
          op('cena', 'La cena'),
        ], { exclusivas: ['no'] }),
        unaOpcion({ codigo: 'nut_saltea_por_que', etiqueta: '¿Por qué, la mayoría de las veces?', cat: HABITOS, si: si('nut_saltea', 'desayuno', 'almuerzo', 'merienda', 'cena'),
          paraQue: 'Si es tiempo, buscamos algo rápido; si es hambre, movemos las comidas.' }, [
          op('sin_hambre', 'No tengo hambre a esa hora'),
          op('sin_tiempo', 'No tengo tiempo'),
          op('costumbre', 'Costumbre'),
          op('para_comer_menos', 'Para comer menos'),
          op('otro', 'Otro motivo'),
        ], 'otro'),
      ],
    },
    {
      sectionCode: 'si_y_no',
      title: 'Alimentos que sí y que no',
      intro: 'Para que tu plan tenga lo que te gusta y nada que no vayas a comer.',
      fields: [
        alimentos({ codigo: 'nut_alimentos_si', etiqueta: 'Alimentos que te gustan y comerías seguido', cat: OBJETIVOS, requerida: true,
          ayuda: 'Tocá todos los que quieras. Abajo podés sumar otros.',
          paraQue: 'Armar el plan con lo que ya te gusta.' }, [], 40),
        alimentos({ codigo: 'nut_alimentos_no', etiqueta: 'Alimentos que no comés o no querés en tu plan', cat: OBJETIVOS,
          ayuda: 'Para cada uno, contame por qué: no me gusta, me cae mal o por elección. Si no hay ninguno, dejalo sin responder.',
          paraQue: 'Que no aparezcan en tu plan.' }, [op('no_me_gusta', 'No me gusta'), op('me_cae_mal', 'Me cae mal'), op('por_eleccion', 'Por elección')], 30),
        siONo({ codigo: 'nut_alergias', etiqueta: '¿Tenés alguna alergia alimentaria diagnosticada?', cat: SALUD, requerida: true,
          paraQue: 'Es lo primero que cuido: un alimento con alergia nunca entra en tu plan.' }),
        texto({ codigo: 'nut_alergias_cuales', etiqueta: '¿A qué alimento y qué te pasa si lo comés?', cat: SALUD, requerida: true, si: si('nut_alergias', true),
          paraQue: 'Sacarlo del plan y de las recetas, también cuando viene como ingrediente.' }, 300),
        variasOpciones({ codigo: 'nut_intolerancias', etiqueta: '¿Tenés que evitar algún alimento por una intolerancia o una condición?', cat: SALUD, requerida: true,
          paraQue: 'Elegir alimentos y marcas que puedas comer sin riesgo.' }, [
          op('celiaquia', 'Celiaquía (sin TACC)'),
          op('lactosa', 'Intolerancia a la lactosa'),
          op('otra', 'Otra'),
          op('ninguna', 'Ninguna'),
        ], { exclusivas: ['ninguna'], otra: 'otra' }),
        unaOpcion({ codigo: 'nut_intolerancias_quien', etiqueta: '¿Te lo diagnosticó un médico?', cat: SALUD, si: si('nut_intolerancias', 'celiaquia', 'lactosa', 'otra'),
          paraQue: 'Con la confirmación de un médico el plan lo evita siempre; si lo notaste vos, lo charlamos en la consulta.' }, [
          op('si_medico', 'Sí, un médico'),
          op('lo_note_yo', 'Lo noté yo'),
          op('no_se', 'No sé'),
        ]),
        unaOpcion({ codigo: 'nut_estilo', etiqueta: '¿Seguís algún estilo de alimentación?', cat: OBJETIVOS, requerida: true,
          paraQue: 'Respetarlo en cada comida del plan.' }, [
          op('de_todo', 'Como de todo'),
          op('sin_carnes_rojas', 'Sin carnes rojas'),
          op('vegetariano', 'Vegetariano'),
          op('vegano', 'Vegano'),
          op('otro', 'Otro'),
        ], 'otro'),
      ],
    },
    {
      sectionCode: 'lo_que_tomas',
      title: 'Lo que tomás',
      intro: 'Lo que tomás también cuenta. El mate, también.',
      fields: [
        unaOpcion({ codigo: 'nut_agua', etiqueta: '¿Cuánta agua tomás en un día?', cat: HABITOS, requerida: true, ayuda: 'Un vaso es de unos 250 ml.',
          paraQue: 'Saber de dónde partimos.' }, [
          op('menos_de_2', 'Menos de 2 vasos'),
          op('2_a_4', '2 a 4 vasos'),
          op('5_a_8', '5 a 8 vasos'),
          op('mas_de_8', 'Más de 8 vasos'),
        ]),
        unaOpcion({ codigo: 'nut_mate', etiqueta: '¿Tomás mate?', cat: HABITOS, requerida: true,
          paraQue: 'El mate marca horarios y a veces reemplaza una comida.' }, [
          op('no_tomo', 'No tomo'),
          op('amargo', 'Amargo'),
          op('con_azucar', 'Con azúcar'),
          op('con_edulcorante', 'Con edulcorante'),
        ]),
        unaOpcion({ codigo: 'nut_mate_cuanto', etiqueta: '¿Cuánto, más o menos, por día?', cat: HABITOS, si: si('nut_mate', 'amargo', 'con_azucar', 'con_edulcorante'),
          paraQue: 'Contarlo como líquido del día y ubicarlo entre las comidas.' }, [
          op('menos_de_un_termo', 'Menos de un termo'),
          op('un_termo', 'Un termo'),
          op('dos_termos', 'Dos termos'),
          op('tres_o_mas', 'Tres o más'),
        ]),
        unaOpcion({ codigo: 'nut_cafe_te', etiqueta: '¿Cuántas tazas de café o té tomás por día?', cat: HABITOS, requerida: true,
          paraQue: 'Contar lo que suman la leche y el azúcar, si los hay.' }, [
          op('no_tomo', 'No tomo'),
          op('1_o_2', '1 o 2'),
          op('3_o_4', '3 o 4'),
          op('5_o_mas', '5 o más'),
        ]),
        variasOpciones({ codigo: 'nut_cafe_te_como', etiqueta: '¿Cómo lo tomás?', cat: HABITOS, si: si('nut_cafe_te', '1_o_2', '3_o_4', '5_o_mas'),
          paraQue: 'Saber qué suma cada taza.' }, [
          op('solo', 'Solo'),
          op('con_leche', 'Con leche'),
          op('con_azucar', 'Con azúcar'),
          op('con_edulcorante', 'Con edulcorante'),
        ]),
        unaOpcion({ codigo: 'nut_gaseosas', etiqueta: '¿Gaseosas, aguas saborizadas o jugos?', cat: HABITOS, requerida: true,
          paraQue: 'Son una fuente de azúcar que no siempre se ve.' }, [
          op('no_tomo', 'No tomo'),
          op('solo_sin_azucar', 'Solo sin azúcar'),
          op('a_veces_comunes', 'A veces, comunes'),
          op('todos_los_dias_comunes', 'Todos los días, comunes'),
        ]),
        unaOpcion({ codigo: 'nut_alcohol', etiqueta: '¿Con qué frecuencia tomás bebidas con alcohol?', cat: HABITOS,
          paraQue: 'Tenerlo en cuenta en tu semana, no juzgarlo.' }, [
          op('no_tomo', 'No tomo'),
          op('de_vez_en_cuando', 'De vez en cuando'),
          op('fines_de_semana', 'Los fines de semana'),
          op('varias_por_semana', 'Varias veces por semana'),
        ]),
        variasOpciones({ codigo: 'nut_alcohol_que', etiqueta: '¿Qué tomás habitualmente?', cat: HABITOS, si: si('nut_alcohol', 'de_vez_en_cuando', 'fines_de_semana', 'varias_por_semana'),
          paraQue: 'Ubicarlo en el plan del fin de semana.' }, [
          op('cerveza', 'Cerveza'),
          op('vino', 'Vino'),
          op('fernet_o_tragos', 'Fernet o tragos'),
          op('otra', 'Otra'),
        ], { otra: 'otra' }),
      ],
    },
    {
      sectionCode: 'salud',
      title: 'Tu salud y la comida',
      intro: 'Solo lo que un plan de alimentación tiene que tener en cuenta. Lo que prefieras charlar en persona, marcalo así o dejalo sin responder.',
      fields: [
        variasOpciones({ codigo: 'condiciones_declaradas', etiqueta: '¿Tenés alguna de estas condiciones diagnosticadas?', cat: SALUD, requerida: true,
          paraQue: 'Si marcás alguna, el plan se ajusta a ella y a lo que te indicó tu médico.' }, [
          op('diabetes', 'Diabetes o prediabetes'),
          op('colesterol', 'Colesterol o triglicéridos altos'),
          op('presion_alta', 'Presión alta'),
          op('hipotiroidismo', 'Hipotiroidismo'),
          op('higado_graso', 'Hígado graso'),
          op('gota', 'Gota o ácido úrico alto'),
          op('anemia', 'Anemia o falta de hierro'),
          op('renal', 'Enfermedad renal'),
          op('intestinal', 'Enfermedad intestinal (colon irritable, Crohn, colitis)'),
          op('reflujo', 'Reflujo o gastritis'),
          op('ninguna', 'Ninguna'),
          op('otra', 'Otra'),
          op('prefiero_en_persona', 'Prefiero hablarlo en persona'),
        ], { exclusivas: ['ninguna', 'prefiero_en_persona'], otra: 'otra' }),
        unaOpcion({ codigo: 'nut_condiciones_indicacion', etiqueta: '¿Tu médico te dio alguna indicación de alimentación por eso?', cat: SALUD,
          si: si('condiciones_declaradas', ...CONDICIONES_QUE_PIDEN_INDICACION),
          paraQue: 'Armar el plan dentro de lo que te indicó tu médico; si la tenés por escrito, traela a la consulta.' }, [
          op('por_escrito', 'Sí, la tengo por escrito'),
          op('me_la_dijo', 'Sí, me la dijo'),
          op('no', 'No'),
          op('no_se', 'No sé'),
        ]),
        siONo({ codigo: 'medicacion_relevante', etiqueta: '¿Tomás alguna medicación todos los días?', cat: SALUD,
          paraQue: 'Algunas cambian el hambre, piden horarios o van con ciertos alimentos; lo tengo en cuenta en el plan.' }),
        texto({ codigo: 'nut_medicacion_cual', etiqueta: '¿Cuál?', cat: SALUD, si: si('medicacion_relevante', true), ayuda: 'Como figura en la caja alcanza.',
          paraQue: 'Ver si alguna va con horarios o con algún alimento.' }, 300),
        variasOpciones({ codigo: 'nut_suplementos', etiqueta: '¿Tomás suplementos?', cat: HABITOS,
          paraQue: 'Sumarlos o sacarlos del plan con criterio.' }, [
          op('no_tomo', 'No tomo'),
          op('proteina', 'Proteína en polvo'),
          op('creatina', 'Creatina'),
          op('vitaminas', 'Vitaminas o minerales'),
          op('otro', 'Otro'),
        ], { exclusivas: ['no_tomo'], otra: 'otro' }),
        unaOpcion({ codigo: 'nut_digestion', etiqueta: '¿Con qué frecuencia tenés acidez, hinchazón o constipación?', cat: SALUD,
          paraQue: 'Elegir alimentos y horarios que te caigan bien.' }, [
          op('casi_nunca', 'Casi nunca'),
          op('a_veces', 'A veces'),
          op('seguido', 'Seguido'),
        ]),
        variasOpciones({ codigo: 'nut_digestion_que', etiqueta: '¿Qué te pasa?', cat: SALUD, si: si('nut_digestion', 'a_veces', 'seguido'),
          paraQue: 'Cada una se acompaña con alimentos distintos.' }, [
          op('acidez', 'Acidez o reflujo'),
          op('hinchazon', 'Hinchazón o gases'),
          op('constipacion', 'Constipación'),
          op('diarrea', 'Diarrea'),
        ]),
        unaOpcion({ codigo: 'nut_peso_reciente', etiqueta: '¿Cómo vino tu peso en los últimos 6 meses?', cat: SALUD,
          paraQue: 'Ubicar de dónde partimos; el peso en sí lo vemos en la toma de medidas.' }, [
          op('se_mantuvo', 'Se mantuvo parecido'),
          op('subio', 'Subió'),
          op('bajo', 'Bajó'),
          op('subio_y_bajo', 'Subió y bajó varias veces'),
          op('no_se', 'No sé'),
        ]),
        unaOpcion({ codigo: 'nut_embarazo', etiqueta: '¿Estás cursando un embarazo o un período de lactancia?', cat: SALUD,
          paraQue: 'Si es así, el plan se arma junto con tu médico.' }, [
          op('no', 'No'),
          op('embarazo', 'Sí, embarazo'),
          op('lactancia', 'Sí, lactancia'),
          op('no_corresponde', 'No corresponde'),
        ]),
        unaOpcion({ codigo: 'nut_tca', etiqueta: '¿Tuviste o tenés algún trastorno de la conducta alimentaria (por ejemplo, anorexia, bulimia o atracones)?', cat: SALUD,
          paraQue: 'Si es así, armamos el plan de otra forma: sin números a la vista y junto con un profesional de la salud.' }, [
          op('no', 'No'),
          op('si', 'Sí'),
          op('prefiero_en_persona', 'Prefiero hablarlo en persona'),
        ]),
      ],
    },
    {
      sectionCode: 'lo_que_buscas',
      title: 'Lo que buscás',
      intro: 'Para que el plan apunte a lo que a vos te importa.',
      fields: [
        variasOpciones({ codigo: 'nut_objetivo', etiqueta: '¿Qué te gustaría lograr con tu alimentación?', cat: OBJETIVOS, requerida: true, ayuda: 'Elegí hasta dos.',
          paraQue: 'Elegir por dónde empezar.' }, [
          op('mas_ordenado', 'Comer más ordenado'),
          op('mas_energia', 'Tener más energía en el día'),
          op('acompanar_entrenamiento', 'Acompañar mi entrenamiento'),
          op('bajar_de_peso', 'Bajar de peso'),
          op('masa_muscular', 'Ganar masa muscular'),
          op('analisis', 'Mejorar un análisis de sangre'),
          op('cocinar', 'Aprender a cocinar más sano'),
          op('otro', 'Otro'),
        ], { maxSelected: 2, otra: 'otro' }),
        texto({ codigo: 'nut_objetivo_propio', etiqueta: 'Contalo con tus palabras', cat: OBJETIVOS, ayuda: 'Por ejemplo: «llegar a la noche sin estar muerto de hambre».',
          paraQue: 'Es lo que miramos juntos cuando revisemos cómo te fue.' }, 500, true),
        siONo({ codigo: 'nut_planes_previos', etiqueta: '¿Hiciste algún plan de alimentación antes?', cat: OBJETIVOS,
          paraQue: 'No repetir lo que no te funcionó.' }),
        texto({ codigo: 'nut_planes_previos_que', etiqueta: '¿Qué te sirvió y qué no?', cat: OBJETIVOS, si: si('nut_planes_previos', true),
          paraQue: 'Arrancar por lo que ya sabés que te resulta.' }, 500, true),
        texto({ codigo: 'nut_no_negociable', etiqueta: '¿Qué no estás dispuesto o dispuesta a cambiar?', cat: OBJETIVOS,
          ayuda: 'El asado del domingo, el mate con facturas del sábado… Lo que pongas acá lo respetamos.',
          paraQue: 'Un plan que respeta lo que te importa se sostiene mejor.' }, 300, true),
        unaOpcion({ codigo: 'nut_ritmo_de_cambio', etiqueta: '¿Cómo preferís hacer los cambios?', cat: OBJETIVOS, requerida: true,
          paraQue: 'Ir a tu ritmo.' }, [
          op('de_a_uno', 'De a uno y de a poco'),
          op('varios', 'Varios a la vez'),
          op('grande', 'Un cambio grande desde el principio'),
        ]),
        texto({ codigo: 'nut_algo_mas', etiqueta: '¿Algo más que quieras que tenga en cuenta?', cat: OBJETIVOS,
          paraQue: 'Lo que no entró en ninguna pregunta.' }, 600, true),
      ],
    },
  ],
};

// ─── «Antes de entrenar» (FRM-ENTRENAMIENTO v2) ───────────────────────────────────────────────────

export const PLANTILLA_ENTRENAMIENTO_V2: PlantillaDeInicio = {
  clave: 'FRM-ENTRENAMIENTO',
  version: '2',
  nombre: 'Antes de entrenar',
  proposito: 'Lo que la persona cuenta antes de entrenar, para armar el primer plan: su salud, dolor y lesiones, su experiencia, lo que busca, su semana y sus preferencias. Sucede a la v1 y conserva sus seis códigos (DL-100)',
  dominio: 'ENTRENAMIENTO',
  formato: 2,
  estimatedMinutes: 12,
  sections: [
    {
      sectionCode: 'salud',
      title: 'Tu salud antes de entrenar',
      intro: 'Siete preguntas de sí o no. Si alguna es «sí», antes de entrenar necesito el visto bueno de tu médico: no es un trámite, es para cuidarte.',
      fields: [
        siONo({ codigo: 'trn_salud_corazon', etiqueta: '¿Algún médico te dijo que tenés un problema del corazón o presión alta?', cat: SALUD, requerida: true,
          paraQue: 'Saber si necesito el visto bueno de tu médico antes de empezar, y con qué intensidad arrancamos.' }),
        siONo({ codigo: 'trn_salud_dolor_de_pecho', etiqueta: '¿Sentiste dolor en el pecho en reposo, en tu día o al hacer actividad física?', cat: SALUD, requerida: true,
          paraQue: 'Es una señal que un médico tiene que ver antes de que entrenes.' }),
        siONo({ codigo: 'trn_salud_mareos', etiqueta: 'En el último año, ¿perdiste el equilibrio por un mareo o perdiste el conocimiento?', cat: SALUD, requerida: true,
          paraQue: 'Elegir ejercicios seguros si hay riesgo de caída, y pedir el visto bueno de tu médico.' }),
        siONo({ codigo: 'trn_salud_cronica', etiqueta: '¿Tenés otra enfermedad crónica diagnosticada (por ejemplo, diabetes, asma o artrosis)?', cat: SALUD, requerida: true,
          paraQue: 'Adaptar el plan a lo que tengas: con diabetes, por ejemplo, cuido el horario y lo que comés antes.' }),
        texto({ codigo: 'trn_salud_cronica_cual', etiqueta: '¿Cuál?', cat: SALUD, si: si('trn_salud_cronica', true),
          paraQue: 'Adaptar el plan a eso.' }, 300),
        siONo({ codigo: 'medicacion_relevante', etiqueta: '¿Tomás medicación indicada para una enfermedad crónica?', cat: SALUD, requerida: true,
          paraQue: 'Algunas medicaciones cambian el pulso o la respuesta al esfuerzo.' }),
        texto({ codigo: 'trn_medicacion_cual', etiqueta: '¿Cuál?', cat: SALUD, si: si('medicacion_relevante', true), ayuda: 'Como figura en la caja alcanza.',
          paraQue: 'Ver si cambia el pulso o la respuesta al esfuerzo.' }, 300),
        siONo({ codigo: 'trn_salud_huesos', etiqueta: '¿Tenés, o tuviste en el último año, un problema de huesos, articulaciones o músculos que pueda empeorar con la actividad física?', cat: SALUD, requerida: true,
          paraQue: 'Elegir ejercicios que no lo empeoren.' }),
        siONo({ codigo: 'trn_salud_supervision', etiqueta: '¿Algún médico te dijo que solo hagas actividad física con supervisión médica?', cat: SALUD, requerida: true,
          paraQue: 'Si es sí, el plan se coordina con tu médico: esto no reemplaza esa supervisión.' }),
        unaOpcion({ codigo: 'trn_embarazo', etiqueta: '¿Estás cursando un embarazo o tuviste un parto en los últimos 6 meses?', cat: SALUD, requerida: true,
          paraQue: 'Si es así, el plan se arma con el visto bueno de tu médico.' }, NO_SI_NO_CORRESPONDE),
        unaOpcion({ codigo: 'trn_apto_medico', etiqueta: '¿Tenés un apto médico para hacer actividad física de los últimos 12 meses?', cat: SALUD, requerida: true,
          ayuda: 'Si no lo tenés, lo pedimos antes de la primera sesión.',
          paraQue: 'Entrenar con el visto bueno de tu médico.' }, [op('si', 'Sí'), op('no', 'No'), op('no_se', 'No sé')]),
        siONo({ codigo: 'fuma', etiqueta: '¿Fumás?', cat: HABITOS,
          paraQue: 'Es un dato que mira tu médico para el apto y que cambia cómo arrancamos con lo aeróbico.' }),
      ],
    },
    {
      sectionCode: 'dolor',
      title: 'Dolor y lesiones',
      intro: 'Para adaptar los ejercicios y no forzar lo que molesta.',
      fields: [
        siONo({ codigo: 'dolor_o_lesiones', etiqueta: '¿Tenés dolor o alguna lesión hoy?', cat: SALUD, requerida: true,
          paraQue: 'Elegir ejercicios que no lo empeoren.' }),
        variasOpciones({ codigo: 'trn_zonas', etiqueta: '¿Dónde?', cat: SALUD, si: si('dolor_o_lesiones', true),
          paraQue: 'Ubicar la molestia para cuidarla en cada sesión.' }, [
          op('cuello', 'Cuello'),
          op('hombros', 'Hombros'),
          op('codos', 'Codos'),
          op('munecas_o_manos', 'Muñecas o manos'),
          op('espalda_alta', 'Espalda alta'),
          op('lumbar', 'Zona lumbar'),
          op('cadera', 'Cadera'),
          op('rodillas', 'Rodillas'),
          op('tobillos_o_pies', 'Tobillos o pies'),
          op('otra', 'Otra'),
        ], { otra: 'otra' }),
        unaOpcion({ codigo: 'trn_dolor_cuando', etiqueta: '¿Cuándo te molesta?', cat: SALUD, si: si('dolor_o_lesiones', true),
          paraQue: 'Decidir qué se puede trabajar ya y qué espera.' }, [
          op('al_esforzarme', 'Solo al entrenar o al esforzarme'),
          op('en_el_dia', 'También en tareas del día'),
          op('casi_siempre', 'Casi todo el tiempo'),
        ]),
        texto({ codigo: 'trn_movimientos_que_molestan', etiqueta: '¿Qué movimientos te molestan?', cat: SALUD, si: si('dolor_o_lesiones', true),
          ayuda: 'Por ejemplo: bajar escaleras, ponerme en cuclillas.',
          paraQue: 'Evitarlos al principio y buscar la variante que no moleste.' }, 300),
        unaOpcion({ codigo: 'trn_dolor_tratamiento', etiqueta: '¿Lo estás tratando con alguien?', cat: SALUD, si: si('dolor_o_lesiones', true),
          paraQue: 'Coordinar con quien te trata y no pisar lo que te indicó.' }, [
          op('no_consulte', 'No lo consulté'),
          op('en_tratamiento', 'Sí, con un médico o kinesiólogo'),
          op('con_alta', 'Ya me dieron el alta'),
        ]),
        siONo({ codigo: 'trn_cirugias', etiqueta: '¿Tuviste alguna cirugía o lesión importante en los últimos 2 años?', cat: SALUD, requerida: true,
          paraQue: 'Saber qué zona cuidar y desde cuándo.' }),
        texto({ codigo: 'trn_cirugias_cual', etiqueta: '¿Qué fue, cuándo y si ya tenés el alta?', cat: SALUD, si: si('trn_cirugias', true),
          paraQue: 'Arrancar por lo que ya está habilitado.' }, 300),
      ],
    },
    {
      sectionCode: 'experiencia',
      title: 'Tu experiencia',
      intro: 'Para saber por dónde empezar.',
      fields: [
        texto({ codigo: 'trn_experiencia', etiqueta: '¿Qué actividad física venís haciendo y desde hace cuánto?', cat: HABITOS, requerida: true,
          ayuda: 'Por ejemplo: gimnasio 2 veces por semana desde hace un año, o nada en los últimos meses.',
          paraQue: 'Arrancar desde donde estás: ni de cero ni de más.' }, 500, true),
        unaOpcion({ codigo: 'trn_experiencia_en_fuerza', etiqueta: '¿Cuánta experiencia tenés con ejercicios de fuerza (pesas, máquinas o tu propio peso)?', cat: HABITOS, requerida: true,
          paraQue: 'Elegir cuánto te enseño antes de cargar peso.' }, [
          op('nunca', 'Nunca hice'),
          op('menos_de_6_meses', 'Menos de 6 meses'),
          op('6_meses_a_2_anos', 'De 6 meses a 2 años'),
          op('mas_de_2_anos', 'Más de 2 años'),
          op('deje', 'Hice hace tiempo y dejé'),
        ]),
        tabla({ codigo: 'trn_tecnica', etiqueta: '¿Cómo te llevás con estos ejercicios?', cat: HABITOS,
          paraQue: 'Elegir qué te enseño primero y con qué variante arrancamos.' }, [
          op('sentadilla', 'Sentadilla'),
          op('peso_muerto', 'Peso muerto'),
          op('press_de_banca', 'Press de banca'),
          op('remo', 'Remo'),
          op('dominadas', 'Dominadas'),
          op('estocadas', 'Estocadas'),
          op('press_de_hombros', 'Press de hombros'),
          op('puente_de_gluteos', 'Puente de glúteos'),
        ], [
          op('nunca', 'Nunca lo hice'),
          op('con_dudas', 'Lo hice, con dudas en la técnica'),
          op('con_confianza', 'Lo hago con confianza'),
        ]),
        unaOpcion({ codigo: 'trn_resistencia_hoy', etiqueta: 'Hoy, ¿cuánto podés caminar o trotar seguido?', cat: HABITOS,
          paraQue: 'Elegir desde dónde arranca lo aeróbico.' }, [
          op('caminar_me_cuesta', 'Caminar 30 minutos me cuesta'),
          op('camino_30', 'Camino 30 minutos sin problema'),
          op('troto_20_a_30', 'Troto 20 o 30 minutos seguidos'),
          op('corro_mas_de_30', 'Corro más de 30 minutos seguidos'),
        ]),
        unaOpcion({ codigo: 'trn_rir', etiqueta: '¿Conocés el RIR, las repeticiones que te quedan en reserva al terminar una serie?', cat: HABITOS,
          paraQue: 'En la app vas a anotar el RIR de cada serie. Si no lo conocés, te lo enseño en la primera sesión.' }, [
          op('lo_uso', 'Sí, lo uso'),
          op('lo_escuche', 'Lo escuché'),
          op('no', 'No'),
        ]),
        texto({ codigo: 'trn_cargas', etiqueta: 'Si sabés alguna de tus cargas, contámela', cat: HABITOS, ayuda: 'Por ejemplo: sentadilla 60 kg por 8 repeticiones.',
          paraQue: 'Arrancar con pesos que te queden bien desde la primera sesión.' }, 500, true),
      ],
    },
    {
      sectionCode: 'lo_que_buscas',
      title: 'Lo que buscás',
      intro: 'Para que el plan apunte a lo que te importa.',
      fields: [
        unaOpcion({ codigo: 'trn_objetivo_principal', etiqueta: '¿Qué es lo que más buscás?', cat: OBJETIVOS, requerida: true,
          paraQue: 'Ordenar el plan alrededor de una sola cosa primero.' }, [
          op('ganar_fuerza', 'Ganar fuerza'),
          op('masa_muscular', 'Ganar masa muscular'),
          op('bajar_grasa', 'Bajar grasa'),
          op('sentirme_mejor', 'Sentirme mejor y con más energía'),
          op('rendir_en_mi_deporte', 'Rendir más en mi deporte'),
          op('volver_de_lesion', 'Volver después de una lesión, con el alta'),
          op('sin_dolor', 'Moverme sin dolor'),
          op('otro', 'Otro'),
        ], 'otro'),
        texto({ codigo: 'trn_objetivo_declarado', etiqueta: '¿Qué te gustaría poder hacer en 5 semanas que hoy te cuesta?', cat: OBJETIVOS, requerida: true,
          ayuda: 'Contalo con tus palabras: es lo que buscás vos, no un objetivo que te fijo yo.',
          paraQue: 'Es lo que miramos juntos en la semana 5.' }, 500, true),
        texto({ codigo: 'trn_fecha_importante', etiqueta: '¿Hay alguna fecha que te importe?', cat: OBJETIVOS, ayuda: 'Un partido, un viaje, una carrera.',
          paraQue: 'Ordenar las semanas para llegar a esa fecha.' }, 160),
      ],
    },
    {
      sectionCode: 'tu_semana',
      title: 'Tu semana para entrenar',
      intro: 'Un plan que entra en tu semana es un plan que se hace.',
      fields: [
        numero({ codigo: 'trn_dias_por_semana', etiqueta: '¿Cuántos días por semana podrías reservar de manera realista?', cat: HABITOS, requerida: true,
          ayuda: 'Un número entero entre 1 y 7.',
          paraQue: 'Armar un plan que entre en tu semana.' }, 'días por semana', { minimum: 1, maximum: 7, integer: true }),
        variasOpciones({ codigo: 'trn_dias_posibles', etiqueta: '¿Qué días te quedan mejor?', cat: HABITOS, requerida: true,
          paraQue: 'Ubicar las sesiones en los días que sí podés.' }, [
          op('lun', 'Lunes'), op('mar', 'Martes'), op('mie', 'Miércoles'), op('jue', 'Jueves'), op('vie', 'Viernes'), op('sab', 'Sábado'), op('dom', 'Domingo'),
        ]),
        variasOpciones({ codigo: 'trn_franja', etiqueta: '¿En qué momento del día?', cat: HABITOS, requerida: true,
          paraQue: 'Elegir sesiones que entren en ese momento del día.' }, [
          op('temprano', 'Temprano'), op('manana', 'Mañana'), op('mediodia', 'Mediodía'), op('tarde', 'Tarde'), op('noche', 'Noche'),
        ]),
        numero({ codigo: 'trn_minutos_por_sesion', etiqueta: '¿Cuánto tiempo podrías dedicar a cada sesión?', cat: HABITOS, requerida: true,
          ayuda: 'En minutos: entre 10 y 240.',
          paraQue: 'Que cada sesión entre en tu tiempo, sin recortar lo importante.' }, 'min', { minimum: 10, maximum: 240, integer: true }),
        unaOpcion({ codigo: 'trn_lugar_y_equipamiento', etiqueta: '¿Dónde vas a entrenar?', cat: HABITOS, requerida: true,
          paraQue: 'Elegir ejercicios que puedas hacer ahí.' }, [
          op('gimnasio_completo', 'Gimnasio completo'),
          op('gimnasio_chico', 'Gimnasio chico o de barrio'),
          op('en_casa', 'En casa'),
          op('aire_libre', 'Al aire libre'),
          op('combinado', 'Combinado'),
        ]),
        variasOpciones({ codigo: 'trn_equipamiento', etiqueta: '¿Con qué contás?', cat: HABITOS, si: si('trn_lugar_y_equipamiento', 'gimnasio_chico', 'en_casa', 'aire_libre', 'combinado'),
          paraQue: 'Elegir ejercicios que puedas hacer con lo que tenés.' }, [
          op('mancuernas', 'Mancuernas'),
          op('barra_y_discos', 'Barra y discos'),
          op('rack', 'Rack'),
          op('banco', 'Banco'),
          op('poleas_o_maquinas', 'Poleas o máquinas'),
          op('kettlebell', 'Kettlebell'),
          op('bandas', 'Bandas elásticas'),
          op('barra_de_dominadas', 'Barra de dominadas'),
          op('cinta_bici_o_remo', 'Cinta, bici o remo'),
          op('nada', 'Nada por ahora'),
        ], { exclusivas: ['nada'] }),
        siONo({ codigo: 'trn_otro_deporte', etiqueta: '¿Hacés otro deporte o actividad en la semana, fuera de lo que vas a entrenar acá?', cat: HABITOS, requerida: true,
          paraQue: 'Contar esa carga en tu semana, para que el plan la acompañe en vez de sumarse encima.' }),
        lista({ codigo: 'trn_otros_deportes', etiqueta: 'Contame cuáles', cat: HABITOS, requerida: true, si: si('trn_otro_deporte', true),
          paraQue: 'Ubicar las sesiones lejos de los días más exigentes y no cargar de más esos días.' }, 'actividad', [
          subTexto('cual', 'Cuál', true, 80),
          subNumero('dias', 'Días por semana', true, 'días por semana', { minimum: 1, maximum: 7, integer: true }),
          subNumero('minutos', 'Minutos por vez, más o menos', true, 'min', { minimum: 10, maximum: 300, integer: true }),
          subOpcion('exigencia', 'Qué tan exigente', true, [
            op('suave', 'Suave: puedo charlar todo el tiempo'),
            op('moderada', 'Moderada: me agito, pero sigo'),
            op('exigente', 'Exigente: termino muy cansado o cansada'),
          ]),
        ], 1, 6),
        unaOpcion({ codigo: 'nivel_de_actividad', etiqueta: '¿Cómo es tu día fuera del entrenamiento?', cat: HABITOS, requerida: true,
          paraQue: 'Si tu día ya es físico, el plan lo tiene en cuenta.' }, NIVEL_DE_ACTIVIDAD),
      ],
    },
    {
      sectionCode: 'descanso',
      title: 'Descanso y preferencias',
      intro: 'Para que el plan te guste y te deje recuperar.',
      fields: [
        numero({ codigo: 'horas_de_sueno', etiqueta: '¿Cuántas horas dormís habitualmente?', cat: HABITOS, requerida: true, ayuda: 'Entre 3 y 14; vale con decimales (7,5).',
          paraQue: 'El descanso marca cuánto podés entrenar.' }, 'h', { minimum: 3, maximum: 14 }),
        unaOpcion({ codigo: 'trn_estres', etiqueta: '¿Cómo viene tu semana, en estrés?', cat: HABITOS,
          paraQue: 'En semanas cargadas, entrenamos un poco menos.' }, [
          op('tranquila', 'Tranquila'),
          op('normal', 'Normal'),
          op('cargada', 'Cargada'),
        ]),
        texto({ codigo: 'trn_preferencias', etiqueta: '¿Qué actividades disfrutás y cuáles preferís evitar?', cat: OBJETIVOS,
          paraQue: 'Que el plan tenga más de lo que te gusta.' }, 500, true),
        variasOpciones({ codigo: 'trn_aerobico', etiqueta: '¿Qué actividad aeróbica te gusta?', cat: OBJETIVOS,
          paraQue: 'Elegir lo aeróbico entre lo que hacés con ganas.' }, [
          op('caminar', 'Caminar'),
          op('correr', 'Correr'),
          op('bicicleta', 'Bicicleta'),
          op('natacion', 'Natación'),
          op('clases_grupales', 'Clases grupales'),
          op('ninguna', 'Ninguna en especial'),
        ], { exclusivas: ['ninguna'] }),
        texto({ codigo: 'trn_no_quiero', etiqueta: '¿Hay algún ejercicio que no quieras hacer o que te dé miedo?', cat: OBJETIVOS,
          paraQue: 'Lo charlamos y buscamos una variante con la que te sientas seguro o segura.' }, 300, true),
        texto({ codigo: 'trn_algo_mas', etiqueta: '¿Algo más que quieras que tenga en cuenta?', cat: OBJETIVOS,
          paraQue: 'Lo que no entró en ninguna pregunta.' }, 600, true),
      ],
    },
  ],
};

// ─── La ronda 2 (DL-165): FRM-NUTRICION-INICIO v2 y FRM-ENTRENAMIENTO v3, de formato 3 ─────────────────

/**
 * Una versión sucesora: las mismas secciones y preguntas, con las que cambian reemplazadas por código. Un reemplazo puede
 * ser una pregunta, varias (la tabla de los días va donde estaban sus dos preguntas) o ninguna (`[]`, la pregunta sale). Lo
 * que no se nombra queda igual, campo por campo: así se lee qué cambió de una versión a la otra.
 */
function conCambios(secciones: readonly SeccionDePlantillaV2[], cambios: Readonly<Record<string, readonly CampoDePlantillaV2[]>>): SeccionDePlantillaV2[] {
  const usados = new Set<string>();
  const nuevas = secciones.map((s) => ({
    ...s,
    fields: s.fields.flatMap((c) => {
      const reemplazo = cambios[c.fieldCode];
      if (!reemplazo) return [c];
      usados.add(c.fieldCode);
      return [...reemplazo];
    }),
  }));
  const sinUsar = Object.keys(cambios).filter((codigo) => !usados.has(codigo));
  if (sinUsar.length > 0) throw new Error(`plantillas-de-inicio: los cambios nombran preguntas que no están: ${sinUsar.join(', ')}`);
  return nuevas;
}

/** El campo de una plantilla por su código: la base de cada cambio. */
function campoDe(plantilla: PlantillaDeInicio, codigo: string): CampoDePlantillaV2 {
  const campo = plantilla.sections.flatMap((s) => s.fields).find((c) => c.fieldCode === codigo);
  if (!campo) throw new Error(`plantillas-de-inicio: ${plantilla.clave} no tiene ${codigo}`);
  return campo;
}

/** Una lista que se repite de una plantilla, por su código. */
function listaDe(plantilla: PlantillaDeInicio, codigo: string): Extract<CampoDePlantillaV2, { dataType: 'LIST' }> {
  const campo = campoDe(plantilla, codigo);
  if (campo.dataType !== 'LIST') throw new Error(`plantillas-de-inicio: ${plantilla.clave} · ${codigo} no es una lista`);
  return campo;
}

/**
 * Las secciones con una parte nueva antes de la sección `antesDe` (o al principio, con `null`). Si `antesDe` no está, es
 * un error de la plantilla: nunca se agrega al final en silencio.
 */
function conParteAntesDe(secciones: readonly SeccionDePlantillaV2[], antesDe: string | null, parte: SeccionDePlantillaV2): SeccionDePlantillaV2[] {
  if (antesDe === null) return [parte, ...secciones];
  const i = secciones.findIndex((s) => s.sectionCode === antesDe);
  if (i < 0) throw new Error(`plantillas-de-inicio: no hay una sección ${antesDe} antes de la cual poner ${parte.sectionCode}`);
  return [...secciones.slice(0, i), parte, ...secciones.slice(i)];
}

/** Una sección con otro código, título o introducción (sus preguntas no cambian). */
function seccionCambiada(secciones: readonly SeccionDePlantillaV2[], codigo: string, cambios: Partial<Omit<SeccionDePlantillaV2, 'fields'>>): SeccionDePlantillaV2[] {
  if (!secciones.some((s) => s.sectionCode === codigo)) throw new Error(`plantillas-de-inicio: no hay una sección ${codigo}`);
  return secciones.map((s) => (s.sectionCode === codigo ? { ...s, ...cambios } : s));
}

/** DL-165 D-4: la pregunta del embarazo no viene pedida ni es obligatoria; el profesional la suma cuando corresponde. */
const sinPedirNiExigir = (c: CampoDePlantillaV2): CampoDePlantillaV2 => ({ ...c, requiredByDefault: false, requestedByDefault: false });

const DIAS_DE_LA_SEMANA = [op('lun', 'Lunes'), op('mar', 'Martes'), op('mie', 'Miércoles'), op('jue', 'Jueves'), op('vie', 'Viernes'), op('sab', 'Sábado'), op('dom', 'Domingo')];
/** D-5: una opción por día. «Varía» y «No puedo» también son respuestas: «No puedo» no cuenta como día marcado. */
const MOMENTOS_PARA_ENTRENAR = [op('temprano', 'Temprano'), op('manana', 'Mañana'), op('mediodia', 'Mediodía'), op('tarde', 'Tarde'), op('noche', 'Noche'), op('varia', 'Varía'), op('no_puedo', 'No puedo')];
const otrosDeportes = listaDe(PLANTILLA_ENTRENAMIENTO_V2, 'trn_otros_deportes');

// ─── DL-165 D-9 (FR-10) · la parte común «Tus hábitos» ────────────────────────────────────────────

/**
 * La parte «Tus hábitos» (WP-FORMULARIOS-RONDA-2 §4.1), **igual en los dos formularios** de formato 3. Entran solo
 * hábitos: el sueño y los horarios, la actividad del día, el deporte en la semana y el estrés. La salud (medicación,
 * condiciones, embarazo) queda en cada área, y sumar una pregunta acá es una decisión de Dirección.
 * - Reutiliza los códigos que ya existían cuando la pregunta es la misma (`horas_de_sueno`, `nivel_de_actividad`), y los
 *   que llevaban el prefijo de un área pasan a `habitos_` (`nut_horarios`, `trn_otro_deporte` y `nut_actividad_semanal`,
 *   `trn_otros_deportes` de la v3, `trn_estres`).
 * - Lo que se responde acá también queda en «Mis hábitos», la historia de la persona (`habitos_de_la_persona`, API-FRI-04):
 *   lo dice la introducción, y cada «para qué» habla de las dos áreas, porque la persona puede compartir sus hábitos con
 *   todos sus profesionales (API-HBT-03).
 * - «Contame cuáles» es la otra actividad de la v3 (D-6): qué, qué días, en qué momento, minutos y qué tan exigente.
 */
export const SECCION_DE_HABITOS: SeccionDePlantillaV2 = {
  sectionCode: 'tus_habitos',
  title: 'Tus hábitos',
  intro: 'Tu sueño, tu día y tu semana. Quedan también en «Mis hábitos», así no te los preguntamos de nuevo.',
  fields: [
    horarios({ codigo: 'habitos_horarios', etiqueta: '¿A qué hora te levantás y te acostás?', cat: HABITOS, requerida: true,
      ayuda: 'Si un día cambia mucho, poné el más común.',
      paraQue: 'Ubicar tus comidas y tus entrenamientos en tu día real.' }, [
      op('semana_me_levanto', 'Entre semana · me levanto'),
      op('semana_me_acuesto', 'Entre semana · me acuesto'),
      op('finde_me_levanto', 'Fin de semana · me levanto'),
      op('finde_me_acuesto', 'Fin de semana · me acuesto'),
    ]),
    numero({ codigo: 'horas_de_sueno', etiqueta: '¿Cuántas horas dormís habitualmente?', cat: HABITOS, requerida: true, ayuda: 'Entre 3 y 14; vale con decimales (7,5).',
      paraQue: 'El descanso cambia tu energía en el día y cuánto podés entrenar.' }, 'h', { minimum: 3, maximum: 14 }),
    unaOpcion({ codigo: 'nivel_de_actividad', etiqueta: '¿Cómo es tu día, en movimiento?', cat: HABITOS, requerida: true,
      paraQue: 'Saber cuánto te movés en un día común: cambia la energía que gastás y cómo arranca tu plan.' }, NIVEL_DE_ACTIVIDAD),
    siONo({ codigo: 'habitos_hace_deporte', etiqueta: '¿Hacés ejercicio, deporte u otra actividad en la semana?', cat: HABITOS, requerida: true,
      paraQue: 'Contar esa actividad en tu semana: en lo que gastás y en cómo se arma tu plan.' }),
    lista({ codigo: 'habitos_deportes', etiqueta: 'Contame cuáles', cat: HABITOS, requerida: true, si: si('habitos_hace_deporte', true),
      paraQue: 'Que tus comidas y tus sesiones acompañen esos días, en vez de sumarse encima.' }, 'actividad', [
      subTexto('cual', 'Cuál', true, 80, 'Fútbol, natación, baile…'),
      subVarias('que_dias', 'Qué días', true, DIAS_DE_LA_SEMANA),
      subOpcion('momento', 'En qué momento', true, MOMENTOS_PARA_ENTRENAR.filter((m) => m.code !== 'no_puedo')),
      subNumero('minutos', 'Minutos por vez, más o menos', true, 'min', { minimum: 10, maximum: 300, integer: true }),
      ...otrosDeportes.itemFields.filter((sub) => sub.code === 'exigencia'),
    ], 1, 6),
    unaOpcion({ codigo: 'habitos_estres', etiqueta: '¿Cómo viene tu semana, en estrés?', cat: HABITOS,
      paraQue: 'En semanas cargadas, el plan se adapta.' }, [
      op('tranquila', 'Tranquila'),
      op('normal', 'Normal'),
      op('cargada', 'Cargada'),
    ]),
  ],
};

const comidasHabituales = listaDe(PLANTILLA_NUTRICION_INICIO, 'nut_comidas_habituales');

/**
 * «Cómo comés hoy» v2 (DL-165): la v1 con lo que decidió Dirección.
 * - D-9 (FR-10) · la parte «Tus hábitos» va primera, donde la v1 abría con los horarios: salen de «Tu día» los horarios,
 *   la actividad del día y la de la semana, y «¿En qué momento del día solés entrenar?» (`nut_hora_de_entrenamiento`, que
 *   es de Nutrición) se abre con «Sí» en el deporte de la semana.
 * - D-4 · el embarazo, sin pedir por defecto (ya no era obligatoria).
 * - D-2 · los ejemplos de las comidas pasan a su texto de muestra, en el renglón: «Qué comés» y «Cuánto».
 * - D-3 · sin los minutos. D-7 · quedan todas las obligatorias de la v1; las de la parte común suman las suyas (D-15).
 */
export const PLANTILLA_NUTRICION_INICIO_V2: PlantillaDeInicio = {
  ...PLANTILLA_NUTRICION_INICIO,
  version: '2',
  proposito: `${PLANTILLA_NUTRICION_INICIO.proposito}. Sucede a la v1 (DL-165): empieza con la parte común «Tus hábitos», el embarazo no viene pedido y los ejemplos de las comidas van como texto de muestra`,
  formato: 3,
  estimatedMinutes: null,
  sections: conParteAntesDe(
    conCambios(PLANTILLA_NUTRICION_INICIO.sections, {
      nut_horarios: [],
      nivel_de_actividad: [],
      nut_actividad_semanal: [],
      nut_hora_de_entrenamiento: [{ ...campoDe(PLANTILLA_NUTRICION_INICIO, 'nut_hora_de_entrenamiento'), showIf: si('habitos_hace_deporte', true) }],
      nut_embarazo: [sinPedirNiExigir(campoDe(PLANTILLA_NUTRICION_INICIO, 'nut_embarazo'))],
      nut_comidas_habituales: [
        {
          ...comidasHabituales,
          helpText: 'Con detalle y con las medidas de tu casa. Sumá al menos tres.',
          itemFields: comidasHabituales.itemFields.map((sub) =>
            sub.code === 'que'
              ? subTexto('que', 'Qué comés', true, 160, 'Milanesa de carne al horno con puré de papa')
              : sub.code === 'porcion'
                ? subTexto('porcion', 'Cuánto, con medidas de tu casa', true, 120, '1 plato playo, 2 unidades, 1 taza, 3 cucharadas…')
                : sub,
          ),
        },
      ],
    }),
    null,
    SECCION_DE_HABITOS,
  ),
};

/**
 * «Antes de entrenar» v3 (DL-165): la v2 con lo que decidió Dirección. Conserva los seis códigos de la v1 (DL-100).
 * - D-9 (FR-10) · la parte «Tus hábitos» va antes de «Tu semana para entrenar», donde estaban esas preguntas: salen de ahí
 *   la actividad del día y la otra actividad (con sus días y su momento, D-6), y de «Descanso y preferencias» el sueño y
 *   el estrés. Esa sección queda con las preferencias: «Tus preferencias». La salud sigue primera.
 * - D-4 · el embarazo, sin pedir por defecto y no obligatorio; la pregunta de las indicaciones médicas suma el ejemplo.
 * - D-5 · los días y el horario, en una tabla (reemplaza a `trn_dias_posibles` y `trn_franja`), y los días por semana no
 *   pasan de los marcados (`maxFromMatrix`).
 * - D-2 · el ejemplo de «Cuál» va como texto de muestra (en la parte común). D-3 · sin los minutos.
 */
export const PLANTILLA_ENTRENAMIENTO_V3: PlantillaDeInicio = {
  ...PLANTILLA_ENTRENAMIENTO_V2,
  version: '3',
  proposito:
    'Lo que la persona cuenta antes de entrenar, para armar el primer plan: su salud, dolor y lesiones, su experiencia, lo que busca, sus hábitos, su semana y sus preferencias. Sucede a la v2 (DL-165): la parte común «Tus hábitos», los días y el momento en una tabla y el embarazo sin pedir por defecto. Conserva los seis códigos de la v1 (DL-100)',
  formato: 3,
  estimatedMinutes: null,
  sections: conParteAntesDe(
    seccionCambiada(
      conCambios(PLANTILLA_ENTRENAMIENTO_V2.sections, {
        trn_embarazo: [sinPedirNiExigir(campoDe(PLANTILLA_ENTRENAMIENTO_V2, 'trn_embarazo'))],
        trn_salud_supervision: [{ ...campoDe(PLANTILLA_ENTRENAMIENTO_V2, 'trn_salud_supervision'), helpText: 'Por ejemplo, por un embarazo o un parto reciente.' }],
        // La tabla va primero y el número después: se cuentan los días marcados antes de decir cuántos se pueden reservar.
        trn_dias_por_semana: [
          tabla({ codigo: 'trn_dias_y_horario', etiqueta: '¿Qué días y en qué momento podés?', cat: HABITOS, requerida: true,
            ayuda: 'Una opción por día. Si un día no podés, marcá «No puedo».',
            paraQue: 'Ubicar cada sesión en un día y en un momento que te queden bien.' }, DIAS_DE_LA_SEMANA, MOMENTOS_PARA_ENTRENAR),
          numero({ codigo: 'trn_dias_por_semana', etiqueta: '¿Cuántos días por semana podrías reservar de manera realista?', cat: HABITOS, requerida: true,
            ayuda: 'Un número entero entre 1 y 7.',
            paraQue: 'Armar un plan que entre en tu semana.' }, 'días por semana', { minimum: 1, maximum: 7, integer: true }, { fieldCode: 'trn_dias_y_horario', exceptColumns: ['no_puedo'] }),
        ],
        trn_dias_posibles: [],
        trn_franja: [],
        // DL-165 D-9: a la parte común.
        trn_otro_deporte: [],
        trn_otros_deportes: [],
        nivel_de_actividad: [],
        horas_de_sueno: [],
        trn_estres: [],
      }),
      'descanso',
      { sectionCode: 'preferencias', title: 'Tus preferencias', intro: 'Para que el plan te guste.' },
    ),
    'tu_semana',
    SECCION_DE_HABITOS,
  ),
};

// ─── DL-165, ronda 2.1 (D-15 nueva, 2026-11-06) · «Tus hábitos», un formulario aparte ─────────────

/** Las secciones sin la parte «Tus hábitos»: las versiones de área de la ronda 2.1 no la traen. */
function sinLaParteDeHabitos(secciones: readonly SeccionDePlantillaV2[]): SeccionDePlantillaV2[] {
  if (!secciones.some((s) => s.sectionCode === SECCION_DE_HABITOS.sectionCode)) throw new Error('plantillas-de-inicio: la versión no trae la parte «Tus hábitos»');
  return secciones.filter((s) => s.sectionCode !== SECCION_DE_HABITOS.sectionCode);
}

/**
 * «Tus hábitos» (FRM-HABITOS v2): la parte común como formulario propio. D-15 nueva de Dirección (2026-11-06): «puede estar
 * en un formulario separado que sea de hábitos, que puedan enviar ambos profesionales». Sucede a la v1 de P0 («Hábitos y
 * contexto», migración 20260921220000), que queda histórica: sus Solicitudes siguen en su versión.
 * - Una sola parte, **la misma** `SECCION_DE_HABITOS` de «Cómo comés hoy» v2 y «Antes de entrenar» v3, campo por campo:
 *   responderla agrega una versión de los hábitos de la persona, como esas (API-FRI-04, la regla general de D-20).
 * - Sin área propia, como la v1: la pide cualquier profesional con el vínculo vigente, en su área (FRM-03 la deja pedir en
 *   las tres), y la puede volver a pedir cuando quiera saber si todo sigue igual.
 * - Formato 3: el renglón de la otra actividad trae «Qué días», con varias opciones, y el ejemplo de «Cuál». La APK 0.21 lo lee.
 */
export const PLANTILLA_HABITOS_V2: PlantillaDeInicio = {
  clave: 'FRM-HABITOS',
  version: '2',
  nombre: 'Tus hábitos',
  proposito:
    'Los hábitos de la persona, en un formulario aparte que puede pedir cualquiera de sus profesionales: el sueño y los horarios, la actividad del día, el deporte en la semana y el estrés. Responderlo actualiza «Mis hábitos». Sucede a la v1 de P0 (DL-165, ronda 2.1)',
  dominio: null,
  formato: 3,
  estimatedMinutes: null,
  sections: [SECCION_DE_HABITOS],
};

/** «¿En qué momento del día solés entrenar?», sin la condición de la parte común, que «Cómo comés hoy» v3 ya no trae (D-21). */
function horaDeEntrenamientoSinLaParte(): CampoDePlantillaV2 {
  const campo = campoDe(PLANTILLA_NUTRICION_INICIO_V2, 'nut_hora_de_entrenamiento');
  if (campo.dataType !== 'CHOICE') throw new Error('plantillas-de-inicio: nut_hora_de_entrenamiento tiene que ser de una opción');
  return { ...campo, showIf: null, options: [...campo.options, op('no_entreno', 'No entreno')] };
}

/**
 * «Cómo comés hoy» v3 (D-15 nueva): la v2 sin la parte «Tus hábitos», que va en su propio formulario. Lo demás queda como
 * en la v2 (D-2, D-4, D-7). «¿En qué momento del día solés entrenar?» se abría con el «Sí» de la parte común: sin ella,
 * queda a la vista, opcional, y suma «No entreno» (D-21).
 */
export const PLANTILLA_NUTRICION_INICIO_V3: PlantillaDeInicio = {
  ...PLANTILLA_NUTRICION_INICIO_V2,
  version: '3',
  proposito: `${PLANTILLA_NUTRICION_INICIO.proposito}. Sucede a la v2 (DL-165, ronda 2.1): los hábitos van en «Tus hábitos», un formulario aparte; el embarazo no viene pedido y los ejemplos de las comidas van como texto de muestra`,
  sections: conCambios(sinLaParteDeHabitos(PLANTILLA_NUTRICION_INICIO_V2.sections), { nut_hora_de_entrenamiento: [horaDeEntrenamientoSinLaParte()] }),
};

/**
 * «Antes de entrenar» v4 (D-15 nueva): la v3 sin la parte «Tus hábitos», que va en su propio formulario. Lo demás queda como
 * en la v3 (D-4, D-5), y conserva los seis códigos de la v1 (DL-100).
 */
export const PLANTILLA_ENTRENAMIENTO_V4: PlantillaDeInicio = {
  ...PLANTILLA_ENTRENAMIENTO_V3,
  version: '4',
  proposito:
    'Lo que la persona cuenta antes de entrenar, para armar el primer plan: su salud, dolor y lesiones, su experiencia, lo que busca, su semana y sus preferencias. Sucede a la v3 (DL-165, ronda 2.1): los hábitos van en «Tus hábitos», un formulario aparte; los días y el momento siguen en una tabla, y el embarazo sin pedir por defecto. Conserva los seis códigos de la v1 (DL-100)',
  sections: sinLaParteDeHabitos(PLANTILLA_ENTRENAMIENTO_V3.sections),
};

/**
 * Todas las versiones de inicio, en el orden en que se siembran: las de DL-164 (formato 2), las de la ronda 2 (DL-165,
 * formato 3, con la parte «Tus hábitos») y las de la ronda 2.1 (formato 3: «Tus hábitos» aparte y las de área sin la parte).
 */
export const PLANTILLAS_DE_INICIO: readonly PlantillaDeInicio[] = [
  PLANTILLA_NUTRICION_INICIO,
  PLANTILLA_ENTRENAMIENTO_V2,
  PLANTILLA_NUTRICION_INICIO_V2,
  PLANTILLA_ENTRENAMIENTO_V3,
  PLANTILLA_HABITOS_V2,
  PLANTILLA_NUTRICION_INICIO_V3,
  PLANTILLA_ENTRENAMIENTO_V4,
];

/** Las vigentes: las que se piden hoy (las anteriores quedan históricas, REG-06-209). */
export const PLANTILLAS_VIGENTES_DE_INICIO: readonly PlantillaDeInicio[] = [PLANTILLA_NUTRICION_INICIO_V3, PLANTILLA_ENTRENAMIENTO_V4, PLANTILLA_HABITOS_V2];

/** Las de área vigentes: al pedir una, el cajón del website sugiere sumar «Tus hábitos» (D-15 nueva; D-22). */
export const PLANTILLAS_DE_AREA_VIGENTES: readonly PlantillaDeInicio[] = [PLANTILLA_NUTRICION_INICIO_V3, PLANTILLA_ENTRENAMIENTO_V4];

