-- PF-01/02 · DL-100 y DL-101 (docs/propuestas/PF-01-02_contexto-de-entrenamiento.md): plantilla «Antecedentes para
-- entrenamiento» (CAND-10-TRN-A, B10-06 §4), de dominio ENTRENAMIENTO, con los seis conceptos ratificados por Dirección
-- el 2026-09-27. Solo agrega filas: el catálogo es de solo agregado (triggers be_solo_agregar) y sintético de
-- demostración (D-D, WP-07.md), igual que FRM-SALUD y FRM-HABITOS.
--
-- `numberLimits` (DL-101) va fuera de `sections` a propósito: FRM-02 devuelve solo `sections`, y la APK la lee con
-- esquemas estrictos; una propiedad nueva en un campo le impediría abrir el formulario. Los límites los valida el
-- servidor al responder y al rectificar, y el rango se le dice a la persona en el `helpText`.

INSERT INTO "plantilla_de_formulario" ("id", "clave", "momento_de_registro") VALUES
  ('67e4d0b3-cf4a-41e7-9d84-6864c5dde951', 'FRM-ENTRENAMIENTO', '2026-09-28T00:00:00.000Z');

INSERT INTO "version_de_plantilla_de_formulario"
  ("id", "plantilla_id", "predecesora_id", "version", "nombre", "proposito", "dominio", "contenido", "procedencia", "momento_de_registro") VALUES
  ('0fba80db-0a80-47a7-b183-130232ab7a9c', '67e4d0b3-cf4a-41e7-9d84-6864c5dde951', NULL, '1',
   'Antecedentes para entrenamiento',
   'Contexto que la persona declara para planificar su entrenamiento: qué busca, su experiencia, cuánto tiempo tiene, dónde entrena y qué prefiere (CAND-10-TRN-A)',
   'ENTRENAMIENTO',
   '{"sections":[{"sectionCode":"antecedentes","title":"Antecedentes para entrenamiento","fields":[{"fieldCode":"trn_objetivo_declarado","label":"Qué te gustaría poder hacer o mejorar con el entrenamiento","dataType":"TEXT","unit":null,"category":"OBJETIVOS_Y_PREFERENCIAS","helpText":"Contalo con tus palabras: es lo que buscás, no un objetivo fijado por tu profesional"},{"fieldCode":"trn_experiencia","label":"Qué actividad venís haciendo y desde hace cuánto","dataType":"TEXT","unit":null,"category":"HABITOS_Y_CONTEXTO","helpText":"Por ejemplo: gimnasio 2 veces por semana desde hace un año, o nada en los últimos meses"},{"fieldCode":"trn_dias_por_semana","label":"Cuántos días por semana podrías reservar de manera realista","dataType":"NUMBER","unit":"días por semana","category":"HABITOS_Y_CONTEXTO","helpText":"Un número entero entre 1 y 7"},{"fieldCode":"trn_minutos_por_sesion","label":"Cuánto tiempo podrías dedicar a cada sesión","dataType":"NUMBER","unit":"min","category":"HABITOS_Y_CONTEXTO","helpText":"En minutos: un número entero entre 1 y 600"},{"fieldCode":"trn_lugar_y_equipamiento","label":"Dónde entrenarías y con qué equipamiento contás","dataType":"TEXT","unit":null,"category":"HABITOS_Y_CONTEXTO","helpText":"Por ejemplo: en casa con mancuernas y una banda elástica, o en un gimnasio completo. No hace falta la dirección"},{"fieldCode":"trn_preferencias","label":"Qué actividades disfrutás y cuáles preferís evitar","dataType":"TEXT","unit":null,"category":"OBJETIVOS_Y_PREFERENCIAS","helpText":null}]}],"numberLimits":{"trn_dias_por_semana":{"minimum":1,"maximum":7,"integer":true},"trn_minutos_por_sesion":{"minimum":1,"maximum":600,"integer":true}}}',
   '{"rotulo":"Catálogo sintético de demostración: preguntas de producto, no un instrumento clínico ni una evaluación de aptitud (DL-100; D-D, docs/paquetes/WP-07.md)."}',
   '2026-09-28T00:00:00.000Z');
