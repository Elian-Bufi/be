/**
 * «Fuentes del catálogo» (DL-141 D-6; tramos 2 y 3): la página pública que reúne las atribuciones que piden las
 * licencias de los catálogos base. Cada ítem dice además su fuente y su licencia donde se consulta.
 * Los enlaces van escritos en la página (`apps/web/src/app/legal/fuentes/page.tsx`): la prueba de enlaces del website
 * exige ver el destino.
 */
export const COPY_FUENTES_DEL_CATALOGO = {
  titulo: 'Fuentes del catálogo',
  bajada:
    'El catálogo de BE junta alimentos y ejercicios de fuentes libres. Cada uno dice de dónde sale y con qué licencia; esta página reúne las atribuciones que esas licencias piden. El catálogo sirve para elegir: no es una recomendación ni una prescripción.',
  alimentos: {
    titulo: 'Alimentos: USDA FoodData Central',
    texto:
      'La composición de los alimentos del catálogo base sale de FoodData Central (SR Legacy), del Servicio de Investigación Agrícola del Departamento de Agricultura de los Estados Unidos. Es de dominio público (CC0 1.0). Los nombres en castellano los curó BE; la descripción original, en inglés, queda como nombre alternativo. Ningún valor se completa ni se estima.',
    cita: 'Cita: U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, SR Legacy (2019).',
  },
  ejercicios: {
    titulo: 'Ejercicios: wger',
    texto:
      'Los ejercicios del catálogo base salen de wger, un proyecto libre de entrenamiento. Cada nombre lleva la licencia y la autoría que wger declara para su texto: CC BY-SA 3.0, CC BY-SA 4.0 o CC0. Cuando el nombre en castellano es una traducción de BE, su procedencia lo dice. Las imágenes de wger no se usan.',
    lista: 'La lista de cada ejercicio, con su licencia y su autoría',
  },
  importados: {
    titulo: 'Productos importados: Open Food Facts',
    texto:
      'Un profesional puede importar un producto de Open Food Facts por su código de barras, después de revisarlo. Su base de datos se publica con la licencia ODbL; cada producto importado dice su fuente y la fecha en que se importó.',
  },
  demostracion: {
    titulo: 'Lo que es de demostración',
    texto: 'Algunos alimentos y ejercicios del ambiente de prueba son de demostración: sus valores son sintéticos y su procedencia lo dice.',
  },
} as const;
