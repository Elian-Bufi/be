-- Tramo D de docs/paquetes/WP-IDENTIDAD-VISUAL.md · un segundo protocolo sintético de demostración, con pliegues y
-- perímetros, para que la figura de la toma tenga qué ubicar.
--
-- B10-07 §18: «la identificación de la medición pertenece al protocolo/catálogo; el recurso visual es ayuda de
-- interacción». Por eso la figura no inventa métricas: dibuja las que declara el protocolo elegido. El de laboratorio de
-- WP-05 solo declara peso y talla; este suma, con nombre y familia (B10-07 §15), los sitios de toma que la figura sabe
-- ubicar. Valores sintéticos, rotulados como el resto del catálogo: no es un catálogo científico (REG-06-157).
-- Identificadores deterministas, iguales en todos los ambientes, como el catálogo de WP-05.

INSERT INTO "especificacion_antropometrica" ("id", "clave", "tipo", "momento_de_registro") VALUES
  ('3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a1f03', 'PROTO-CUERPO', 'PROTOCOLO', '2026-09-24T00:00:00.000Z');

INSERT INTO "version_de_especificacion_antropometrica" ("id", "especificacion_id", "predecesora_id", "version", "nombre", "contenido", "procedencia", "momento_de_registro") VALUES
  ('3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a2f04', '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a1f03', NULL, '1',
   'Pliegues y perímetros (demostración)',
   '{"metricas":[
      {"clave":"peso","nombre":"Peso","familia":"MASA_Y_ESTATURA","unidades":["kg"],"precision":1},
      {"clave":"talla","nombre":"Talla","familia":"MASA_Y_ESTATURA","unidades":["m","cm"],"precision":2},
      {"clave":"pliegue-triceps","nombre":"Pliegue tricipital","familia":"PLIEGUES","unidades":["mm"],"precision":1},
      {"clave":"pliegue-subescapular","nombre":"Pliegue subescapular","familia":"PLIEGUES","unidades":["mm"],"precision":1},
      {"clave":"pliegue-biceps","nombre":"Pliegue bicipital","familia":"PLIEGUES","unidades":["mm"],"precision":1},
      {"clave":"pliegue-cresta-iliaca","nombre":"Pliegue de la cresta ilíaca","familia":"PLIEGUES","unidades":["mm"],"precision":1},
      {"clave":"pliegue-supraespinal","nombre":"Pliegue supraespinal","familia":"PLIEGUES","unidades":["mm"],"precision":1},
      {"clave":"pliegue-abdominal","nombre":"Pliegue abdominal","familia":"PLIEGUES","unidades":["mm"],"precision":1},
      {"clave":"pliegue-muslo-frontal","nombre":"Pliegue del muslo frontal","familia":"PLIEGUES","unidades":["mm"],"precision":1},
      {"clave":"pliegue-pantorrilla","nombre":"Pliegue de la pantorrilla","familia":"PLIEGUES","unidades":["mm"],"precision":1},
      {"clave":"perimetro-brazo-relajado","nombre":"Perímetro del brazo relajado","familia":"PERIMETROS","unidades":["cm"],"precision":1},
      {"clave":"perimetro-brazo-flexionado","nombre":"Perímetro del brazo flexionado","familia":"PERIMETROS","unidades":["cm"],"precision":1},
      {"clave":"perimetro-cintura","nombre":"Perímetro de cintura","familia":"PERIMETROS","unidades":["cm"],"precision":1},
      {"clave":"perimetro-cadera","nombre":"Perímetro de cadera","familia":"PERIMETROS","unidades":["cm"],"precision":1},
      {"clave":"perimetro-muslo","nombre":"Perímetro del muslo","familia":"PERIMETROS","unidades":["cm"],"precision":1},
      {"clave":"perimetro-pantorrilla","nombre":"Perímetro de la pantorrilla","familia":"PERIMETROS","unidades":["cm"],"precision":1}
   ]}',
   '{"rotulo":"Valores sintéticos de demostración: no es un catálogo científico (REG-06-157)."}',
   '2026-09-24T00:00:00.000Z');
