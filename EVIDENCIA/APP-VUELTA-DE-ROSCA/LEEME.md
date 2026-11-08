# WP-APP-VUELTA-DE-ROSCA — la evidencia de las etapas solo de app

> **Estado (2026-11-07):** las etapas 1 y 2 (AV-01 a AV-14, AV-17 y AV-18) están programadas en la rama
> `wp-app-vuelta-de-rosca` (PR #247, en borrador, sin integrar). Esta carpeta junta lo que se puede mostrar sin teléfono.
> Las capturas de cada pantalla en los dos temas, el antes y el después de Inicio, la medición del alto de la sesión y la
> prueba en el teléfono (TalkBack, letra al máximo y la pantalla bloqueada durante un descanso) son de AV-16 y quedan
> **pendientes**: ninguna de estas pruebas las da por aprobadas.

## Las pruebas y sus mutaciones

Los oráculos están en `docs/paquetes/WP-APP-VUELTA-DE-ROSCA-ORACULOS.md` y sus pruebas en
`scripts/vuelta-de-rosca.test.mjs` (31 casos). Cada una se verificó rompiendo la regla en el código: la prueba tiene que
ponerse en rojo. Las 26 mutaciones dieron rojo, y el código volvió a quedar como estaba.

| Oráculo | Mutación | Resultado |
|---|---|---|
| TEST-AVR-001 | Sacar «estado» de lo que nunca se pliega | Rojo |
| TEST-AVR-002 | Tolerancia de una fila en 0,9 | Rojo |
| TEST-AVR-003 | Borrar «Registros nutricionales» de la tabla | Rojo |
| TEST-AVR-004 | Cerrar mi cuenta antes de Avisos | Rojo |
| TEST-AVR-005 | Contar también los respondidos | Rojo |
| TEST-AVR-006 | Marca sin nada para responder | Rojo |
| TEST-AVR-007 | «No los ve» para quien los recibe | Rojo |
| TEST-AVR-008 | Un vínculo en pausa que «ve» | Rojo |
| TEST-AVR-009 | Una escritura en «Quién ve qué» | Rojo |
| TEST-AVR-010 | Fichas sin el orden del plan | Rojo |
| TEST-AVR-011 | Fichas sin día elegido | Rojo |
| TEST-AVR-012 | El número de la actividad, corrido | Rojo |
| TEST-AVR-013 | El desglose sin las no realizadas | Rojo |
| TEST-AVR-014 | Los ingredientes sin plegar | Rojo |
| TEST-AVR-015 | El reloj de siempre en «Mis hábitos» | Rojo |
| TEST-AVR-016 | Descanso también con el ajuste manual | Rojo |
| TEST-AVR-017 | Descanso en pausa | Rojo |
| TEST-AVR-018 | Tildar sin cerrar la serie cronometrada | Rojo |
| TEST-AVR-019 | Descanso tras la última serie | Rojo |
| TEST-AVR-020 | De fábrica, manual | Rojo |
| TEST-AVR-021 | El ejercicio en el texto del aviso | Rojo |
| TEST-AVR-022 | La alarma exacta sin bloquear | Rojo |
| TEST-AVR-023 | La del medio habilitada en pausa | Rojo |
| TEST-AVR-024 | «Empezar serie N» como «Iniciar descanso» | Rojo |
| TEST-AVR-029 | «Para responder» con cero filas | Rojo |
| TEST-AVR-030 | Esconder la navegación con letra grande | Rojo |

Además siguen verdes, sin cambiar lo que esperan, las pruebas del registro de comidas y de los formularios (TEST-AVR-014)
y la de la corrida (`tiempos-en-el-telefono.test.mjs`). Las de la navegación, la barra, Inicio y los permisos se
actualizaron solo en lo que DL-166 cambió, como pide AV-02 y AV-12.

## Dónde quedó cada cosa (AV-02, AV-03)

La tabla vive en `apps/mobile/src/perfil.ts` (`DONDE_QUEDO_CADA_COSA`) y la prueba busca cada enlace en su archivo.

| Lo que era | Dónde estaba | Dónde está |
|---|---|---|
| Vínculos | Menú | Perfil · Tus profesionales · Vínculos y solicitudes |
| Tu historial de entrenamiento | Menú | Entrenamiento · pestaña Historial |
| Registros nutricionales | Menú | Nutrición · pestaña Registros |
| Notas entre tus profesionales | Cuenta | Perfil · Tu información |
| Tengo un código | Cuenta | Perfil · al pie de Tus profesionales |
| Estado de la cuenta | Cuenta | Perfil · Mis datos |
| Tu nombre | Cuenta | Perfil · Mis datos (y arriba, en quién sos) |
| Tu identificador BE | Cuenta | Perfil · quién sos, con «Compartir» |
| Privacidad y consentimientos | Cuenta | Perfil · Ajustes |
| Apariencia | Cuenta | Perfil · Ajustes, ahí mismo |
| Avisos en este teléfono | Cuenta | Perfil · Ajustes · Avisos |
| Seguridad (cerrar sesión) | Cuenta | Perfil · Ajustes · Sesión y este teléfono |
| Cerrar mi cuenta | Cuenta | Perfil · Ajustes, al final |
| La bandeja de formularios | Información | Perfil · Formularios y pedidos |
| Mis hábitos | Información | Perfil · Tu información |

## Qué se pliega en cada pantalla (AV-01; GUIA-UX-UI III.7)

| Pantalla | A la vista | Plegado |
|---|---|---|
| Inicio · la sesión de hoy | Nombre, estado, «Empezar» y «Ya la hice» | «6 ejercicios · 18 series»: el bloque, la semana y los ejercicios |
| Inicio · «Para responder» | Qué es, quién lo pide, desde cuándo y si se puede responder | Nada |
| Perfil | Todo | Nada: el detalle está en cada destino |
| «Quién ve qué» | Quién, el área, desde cuándo y si ve | «Qué incluye»: la finalidad y el área |
| Registrar una comida | La foto, el nombre, las cifras y «Comí esta opción» | Ingredientes y preparación |
| Responder un formulario | Quién lo pide y «Queda como declarado por vos» | «Para qué lo pide», con «Podés no responder» |
| La sesión · el descanso | El conteo, el recomendado y la barra | «Cómo funciona el descanso», en la hoja del engranaje |

## Los íconos nuevos (AV-09)

La lámina a 18, 20 y 24 dp, en los dos temas, está en `iconos/` con su `LEEME.md`.

## Lo que falta (AV-16 y la etapa 3)

- Las capturas de cada pantalla en Claro y Azul noche, y el antes y el después de Inicio (palabras y botones).
- La medición del alto que queda para el contenido en la sesión, a 360 dp con letra ×1, ×1,3 y ×2 (AV-13, AV-18).
- En el teléfono: TalkBack en cada pieza de §4.0, la letra al máximo, y la vibración con la pantalla bloqueada durante un
  descanso, con su demora medida (AVD-5).
- La etapa 3 (AV-15 «Arranca sola» y AV-19 «Eligió no responder»), con servidor y base. Hasta entonces, la hoja del
  engranaje tiene dos ajustes y un formulario saca la marca de Perfil solo al responderse.
