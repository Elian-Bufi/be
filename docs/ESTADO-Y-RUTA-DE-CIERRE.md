# Estado real y ruta de cierre · 2026-10-28

## Dónde estamos

Lo funcional de esta versión está integrado en `main` (`e4512cb`), desplegado en `test` y en una APK candidata
publicada. Lo que falta para cerrar es, sobre todo, validación con personas (las partes B y C de la prueba breve, el
teléfono y los profesionales) y decisiones tuyas. No hay trabajo técnico bloqueante: lo técnico pendiente está en dos PR
en borrador.

**Lo que necesito de vos, en corto:**

1. Terminar la prueba breve: partes B y C (#217 tiene el guion y los resultados de la parte A).
2. Decidir si se integran #218 (los pendientes técnicos de Administración) y #217 (la prueba breve).
3. Decidir las cuatro observaciones de la parte A (O-1 a O-4, abajo).
4. Antes del 30/11 a las 21:00, decidir las excepciones de seguridad de DL-114, que vencen ese día.
5. Elegir la herramienta y quién genera las imágenes del material visual (`EVIDENCIA/MATERIAL-VISUAL/LEEME.md`).

Este documento reemplaza como vigentes a la matriz del 23/10 (`EVIDENCIA/CONSOLIDACION-2026-10-23/MATRIZ-DE-ESTADO.md`)
y a las notas de `docs/QUE-FALTA.md`. Las dos quedan como historia.

## Cómo se leen los estados

Cada capacidad tiene el estado **más alto que alcanzó**, en este orden. Cada estado se prueba de una forma distinta.

| Estado | Quiere decir | Se prueba con |
|---|---|---|
| **Implementado** | El código existe en una rama. | El PR y su CI. |
| **Integrado** | Está en `main`. | El merge. |
| **Desplegado o distribuido** | Corre en `test`, o la APK está publicada. | `/health/ready` con el commit, o la release. |
| **Verificado automáticamente** | Lo comprueba la CI o un script contra `test`. | La corrida, con su número. |
| **Validado por una persona** | Alguien lo usó en una tarea real y se observó. | El registro de la prueba. |
| **Propuesto** | Escrito, sin código o sin decisión. | Nada: es una idea. |
| **Fuera de alcance** | Declarado así. No es pendiente. | El documento que lo declara. |

Una propuesta no es una funcionalidad aprobada. Un verde de la CI no es una validación con personas.

## Referencias de este corte

- **`main`:** `e4512cb` (2026-10-26). CI en verde (corrida 40387350649): 887 pruebas unitarias del dominio, 481 de
  scripts, 159 de la API, 909 de integración y 17 de 17 recorridos.
- **`test`:** la API responde `0.11.1` en `e4512cb`, con base y migraciones OK (comprobado el 2026-10-28). El website
  responde.
- **APK:** estable `0.13.2` (`be-apk-0.13.2`). Candidata `0.18.0-candidata.1` (prerelease del 26/10, `b64d0c4`, código 30):
  es el `main` del 25/10 con su número de versión.
- **PR abiertos:** #218 y #217 (borradores de este período); #204 (prueba de integración del 23/10, para cerrar sin
  integrar); #199 (tesis v1) y #193 (ampliaciones A a F), documentales.
- **Esta rama** (`wp-nocturno-2026-10-27`): la guía, el cuaderno, el plan de estudio, el material visual y este documento.

## Estado por capacidad

### La persona, en la APK

| Capacidad | Estado | Evidencia | Qué falta para cerrarlo | ¿Te necesita? |
|---|---|---|---|---|
| Plan del día, registro de comidas con recetas y fotos | Distribuido; verificado; validado en parte (0.15, 7 y 8/10) | #147, #151 · CI | Probarlo con la 0.18 (parte C) | Sí |
| Entrenamiento por serie, días de entrenamiento y sustitución de ejercicios | Distribuido en la 0.18.0-candidata.1; verificado | #149, #174, #175, #195 · DL-151 | Parte C en el teléfono | Sí |
| Toma antropométrica y evolución | Distribuido; validado en parte (0.14 y 0.15) | #126 a #131 · DL-111 a DL-113 | Ratificar DL-111 a DL-113; TalkBack | Sí |
| Acceso con Google e invitación por enlace o QR | Validado por una persona (17/10, candidata.2) | DL-138, DL-136 | — | — |
| Novedades y avisos push | Distribuido; verificado | #163 · DL-133 | Recibir un aviso en un teléfono | Sí |
| Leer sus revisiones | Distribuido; verificado | #164 · DL-134 | Verlo en el teléfono | Sí |
| TalkBack y letra del sistema al máximo | Sin comprobar | RNF-ACC-001 | Una pasada en un Android físico | Sí |

### El profesional, en el website

| Capacidad | Estado | Evidencia | Qué falta para cerrarlo | ¿Te necesita? |
|---|---|---|---|---|
| Escritorio por áreas: Resumen, Línea de tiempo, Analizar, Preparar revisión | Desplegado; verificado; validado en parte (diseño revisado por Dirección, 15/10) | #153 a #159 | Prueba con profesionales | Sí: convocarlos |
| «Analizar» con registrado, objetivo e indicado | Desplegado; verificado | #211 · DL-158 | Parte B y prueba con profesionales | Sí |
| El número de Nutrición dice qué falta; la revisión dice su evidencia | Desplegado; verificado | #200, #203, #209 · DL-153, DL-154 | Prueba con profesionales | Sí |
| Notas de coordinación | Desplegado; verificado | #178 · DL-140 | — | — |
| TVCC-30 (métrica de la tesis) | Integrado (cálculo interno, sin pantalla) | #167 · DL-135 | Ratificar D-1 a D-9 | Sí |
| La sesión sobrevive a una recarga | Desplegado; verificado | #186 · DL-147 | Probar en Chrome, Edge y Firefox contra `test` | Sí |

### Administración

| Capacidad | Estado | Evidencia | Qué falta para cerrarlo | ¿Te necesita? |
|---|---|---|---|---|
| Habilitar, observar, suspender y rehabilitar profesionales por área, con segundo factor | Desplegado; verificado; **validado en parte** (parte A, 27/10: las siete filas coincidieron) | #210, #214 · `RESULTADOS.md` en #217 | Decidir O-1 a O-4 | Sí |
| Pruebas de carrera sin esperas fijas; dos reemplazos del autenticador a la vez; rechazos dentro de la transacción auditados | Implementado; verificado (912 de 912, mutaciones 8 de 912 como se esperaba) | #218 (borrador) · `EVIDENCIA/ADMINISTRACION/PENDIENTES-DEL-14.md` | Integrar #218: corrige un 500 real | Sí: autorizar |

Las observaciones de la parte A, a decidir:

- **O-1.** En Azul noche, el botón «Continuar con Google» se ve con un borde blanco.
- **O-2.** Con un área suspendida, el aviso «Por ahora no tenés acceso… puede que todavía no haya completado sus
  autorizaciones» apunta a la persona, cuando la causa es la suspensión.
- **O-3.** La predicción sobre Prueba Dos fue distinta: rehabilitar no exige volver a vincular ni autorizar.
- **O-4.** Al escanear el QR del segundo factor con la cámara, se abrió Samsung Pass.

### Plataforma y operación

| Capacidad | Estado | Evidencia | Qué falta para cerrarlo | ¿Te necesita? |
|---|---|---|---|---|
| Las APK publicadas siguen leyendo la API de hoy | Integrado; verificado (lo que leen la 0.13.2, la 0.17.0-candidata.3 y la 0.18.0-candidata.1) | #198, #216 · DL-152 | — | — |
| Excepciones de la auditoría de dependencias (el zod 3 de Expo y node-forge) | Integrado; **vencen el 2026-12-01 a las 00:00 UTC** (21:00 del 30/11) | #208 · DL-114 | Revisar las fuentes y decidir antes del vencimiento; no se prorroga sola | Sí |
| Escenarios «Prueba» en `test` | Desplegado (cargados el 26/10); verificado (6 de 6; pantalla 48 de 48) | #217 (borrador) | Decidir si se integra la herramienta y el guion | Sí |
| Recetas de ejemplo en `test` | Integrada la herramienta; **no consta que se hayan cargado** (al 23/10, sin cargar) | #192 | Autorizar la carga | Sí |
| Exportar los datos de la persona | Propuesto: la definición está solo en la rama local `wp-exportar-mis-datos` | DL-021, DL-142 | Publicarla como borrador o descartarla | Sí |
| Rendimiento de la cartera con 50, 100 y 200 personas | Verificado automáticamente **fuera de Render** (runner de GitHub, 28/10): 312, 617 y 1.233 ms de mediana; 3 filas nuevas en `decision_de_acceso` por persona en cada lectura | `EVIDENCIA/RENDIMIENTO-CARTERA` · corrida 40641148313 | Decidir si 1,2 s con 200 personas y 600 filas por lectura son aceptables; medir en el ambiente real si hay piloto | Sí: decidir |

### Lo académico y lo documental

| Pieza | Estado | Evidencia | Qué falta para cerrarlo | ¿Te necesita? |
|---|---|---|---|---|
| Documentación de tesis v1 | Propuesto (documental, en borrador) | #199 · `INFORME.md` | Lo que completa Dirección | Sí |
| Auditoría crítica del 21/10 | Propuesto, sin publicar (rama local `mesa/auditoria-v1`) | — | Decidir si se publica | Sí |
| Guía central (24 páginas) y cuaderno de datos (19) | Implementado en esta rama | `docs/guias/ENTENDER-BE` | Leerlos, corregir lo que no se entienda e integrarlos | Sí |
| Material visual (32 de Nutrición y 15 ejercicios) | Propuesto: fichas, prompts y tres imágenes existentes; no hay herramienta de generación en esta sesión | `EVIDENCIA/MATERIAL-VISUAL` | Elegir la herramienta y generar en tandas | Sí |
| Ampliaciones A a F | Propuesto | #193 | Decidir cuando toque | Sí |
| #204, integración de prueba del 23/10 | Todo lo que probaba ya está en `main` | — | Cerrarlo sin integrar | Sí: autorizar |

## Rutas de cierre

Cada pendiente dice cuándo se da por cerrado y si te necesita.

### 1. Cierre académico: llegar a la defensa

| Pendiente | Se cierra cuando… | ¿Te necesita? |
|---|---|---|
| La documentación de tesis (#199) | Completaste lo de `INFORME.md` y la aprobaste para integrar. | Sí |
| Saber explicar BE sin ayuda | Hacés el ejercicio 1 del plan de estudio en 90 segundos, sin mirar, y nombra las cinco piezas. | Sí |
| La prueba breve (partes B y C) | Está el guion completo en `RESULTADOS.md`, con cada observación anotada sin corregir. | Sí |
| Separar lo verificado de lo validado en la defensa | La tabla del nivel 1 de la guía coincide con este documento el día de la defensa. | No: está al día al 28/10 |

### 2. Demostración: mostrar BE funcionando

| Pendiente | Se cierra cuando… | ¿Te necesita? |
|---|---|---|
| `test` estable | `/health/ready` responde OK con el commit esperado el día anterior. | No |
| Datos de la demo | La verificación de los escenarios da 6 de 6 el día anterior. Necesita abrir una IP de la base por un rato. | Sí: autorizar la IP |
| La APK que se muestra | Decidiste si la 0.18.0-candidata.1 pasa a estable («pasala a estable»), después de la parte C. | Sí |
| El recorrido de la demo | Recorriste `EVIDENCIA/ENTREGA/GUIA-DEMO.md` una vez contra `test` sin trabarte. | Sí |

### 3. Piloto: personas reales con datos reales

No está autorizado ni es parte de la entrega. Antes de un piloto hace falta, como mínimo:

| Pendiente | Se cierra cuando… | ¿Te necesita? |
|---|---|---|
| El gate de 24 condiciones del 08 §42 (textos legales, backups con restauración probada, producción separada, DPA, canal de derechos, entre otras) | Cada condición tiene su evidencia. | Sí |
| Exportar los datos de la persona (DL-021) | Está implementado, verificado y validado. | Sí |
| Rendimiento con la escala del piloto | La medición aislada se corrió y una prueba en el ambiente del piloto la confirma. Un resultado local no dice nada de Render. | Sí |
| Una decisión explícita de hacer un piloto | Dirección la escribe, con su alcance. | Sí |

### 4. Evolución: lo que sigue después

Todo esto está **propuesto**, ninguno aprobado:

- Las operaciones del 09 sin operación propia: PRO-01 a 08 (el alta pública de profesionales, fuera de esta versión),
  DSH-01, 02 y 05, y PRJ-02 y 03. PRO-09 a 13 se cubren con la familia ADM (DL-155).
- Infraestructura: el paso previo al despliegue (DL-006), el límite de intentos en memoria (DL-015), la purga de la
  idempotencia y de las sesiones (DL-019, DL-026) y el `P2028` intermitente con lecturas concurrentes.
- Producto: macros planificados por día y por comida, el material didáctico de ejercicios (DL-081), la búsqueda por
  texto en los catálogos externos (DL-098) y las ampliaciones A a F (#193).

## Fuera de alcance declarado

No es pendiente, salvo que Dirección lo pida: pagos, chat, turnos, wearables, prescripción, modo sin conexión,
temporizador de descanso, editor libre de plantillas, protocolos y fórmulas propias del profesional, cardio y
circuitos. El detalle está en `docs/QUE-FALTA.md`, §7.
