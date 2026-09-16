# 02 — Visión, alcance y plan estratégico

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud
> **Código documental:** `BE-LEG-02`
> **Versión:** `0.2.1`
> **Estado:** `APROBADO`
> **Fecha de versión:** 2026-07-27
> **Fecha de aprobación:** 2026-07-27
> **Responsable de dirección:** Elian Gastón Bufi
> **Propietario documental:** Dirección de producto BE
> **Canon previsto:** `docs/legajo/02_Vision_Alcance_y_Plan_Estrategico.md`
> **Gate propietario:** `G1 — Producto definido`
> **Audiencia:** dirección del proyecto, tutor, tribunal, desarrollo, diseño y responsables de validación
> **Canonización en Git:** pendiente

---

## 1. Propósito

Este documento define la dirección estratégica TO-BE de BE:

- problema y oportunidad;
- misión y visión;
- público objetivo;
- objetivos;
- propuesta de valor;
- alcance y límites del MVP;
- prioridades de integración;
- criterios de éxito;
- North Star;
- roadmap;
- supuestos, riesgos y contingencias.

No especifica exhaustivamente requisitos, entidades, contratos, interfaces ni controles técnicos. Esos detalles pertenecen a los documentos 04, 05, 06, 07, 08, 09, 10, 11A y 12.

---

## 2. Problema central

BE aborda la dificultad para sostener una **individualización profesional longitudinal e interdisciplinaria** en procesos de nutrición y entrenamiento, enriquecidos con antropometría, hábitos y antecedentes relevantes.

En numerosos servicios profesionales, la intervención inicial puede estar personalizada, pero su evolución queda limitada por:

- planes que pierden vigencia frente a cambios reales;
- información dispersa entre documentos, planillas, mensajes y aplicaciones;
- seguimiento separado por especialidad;
- pérdida de contexto histórico;
- baja trazabilidad sobre evaluaciones, ejecuciones, revisiones y decisiones;
- escasa coordinación entre profesionales;
- dificultad para comparar lo planificado con lo ejecutado.

La fragmentación es una causa. El problema raíz es que el conocimiento acumulado de cada persona no siempre se conserva ni se convierte en contexto útil para decisiones profesionales sucesivas.

### 2.1 Consecuencias

- adaptación parcial de los planes;
- repetición de información;
- pérdida de aprendizaje acumulado;
- coordinación limitada;
- menor claridad para el asesorado;
- menor visibilidad del trabajo profesional;
- dificultad para justificar ajustes;
- continuidad insuficientemente trazable.

---

## 3. Oportunidad

La oportunidad consiste en utilizar a la persona como su propia referencia longitudinal, integrando únicamente información pertinente, autorizada y trazable.

BE combinará:

- conocimiento profesional general;
- protocolos y fuentes documentadas;
- historia individual;
- planificación;
- ejecución real;
- evolución temporal;
- contexto autorizado de otras especialidades;
- criterio profesional.

La plataforma no atribuirá causalidad a datos observacionales ni tratará a la persona como objeto experimental.

### 3.1 Personalización e individualización

- **Personalización:** adecuación inicial según objetivos, preferencias y características generales.
- **Individualización:** adaptación basada en la evolución concreta de una persona a lo largo del tiempo.
- **Individualización interdisciplinaria:** uso autorizado de contexto de otras especialidades sin transferir ni diluir la responsabilidad profesional.

### 3.2 Declaración central

> BE transforma el seguimiento de salud y rendimiento en un proceso longitudinal e interdisciplinario que aprende de la evolución de cada persona, conserva la responsabilidad por especialidad y convierte información dispersa en contexto útil para decisiones profesionales sucesivas.

En el MVP, **aprender** significa conservar historial, comparar períodos y facilitar decisiones humanas sucesivas. No implica entrenamiento automático de modelos ni modificación autónoma de planes.

---

## 4. Misión

> **La misión de BE es transformar el seguimiento de nutrición, entrenamiento y antropometría en un proceso longitudinal e interdisciplinario que preserve el conocimiento acumulado de cada persona, mantenga la responsabilidad profesional por especialidad y convierta información dispersa en contexto útil para decisiones sucesivas, coordinadas e individualizadas, promoviendo la participación activa del asesorado en su evolución.**

---

## 5. Visión

> **BE tendrá como visión construir una infraestructura digital longitudinal e interdisciplinaria, centrada en la persona y dirigida por profesionales, que preserve el conocimiento acumulado de cada proceso y lo convierta en contexto útil para decisiones sucesivas, coordinadas e individualizadas.**

En su evolución futura, la plataforma podrá incorporar profesionales médicos y otras especialidades clínicas como actores autorizados, brindándoles acceso contextual y trazable, sin sustituir:

- el criterio clínico;
- la historia médica;
- los sistemas formales de atención sanitaria;
- la responsabilidad profesional;
- los procesos regulatorios aplicables.

### 5.1 Horizontes

#### Horizonte 1 — MVP de tesis

- nutrición;
- entrenamiento;
- antropometría;
- hábitos y antecedentes relevantes como contexto;
- dashboard interdisciplinario;
- analítica longitudinal;
- Website profesional y administrativo;
- APK Android para asesorados.

#### Horizonte 2 — Ecosistema profesional ampliado

- nuevas disciplinas no médicas;
- equipos interdisciplinarios;
- organizaciones pequeñas;
- servicios profesionales complementarios;
- agenda, pagos y comunicación ampliada.

#### Horizonte 3 — Integración médico-clínica

- perfiles médicos verificados;
- permisos clínicos diferenciados;
- consentimiento específico;
- auditoría reforzada;
- integraciones sanitarias;
- gobernanza adicional.

### 5.2 Regla de interpretación

Estar contemplado como evolución arquitectónica no implica estar implementado, probado ni comprometido para el MVP.

---

## 6. Público objetivo y actores

### 6.1 Segmento principal

Profesionales independientes de nutrición y entrenamiento que realizan seguimiento longitudinal personalizado y actualmente administran planes, mediciones, ejecución y comunicación mediante herramientas desconectadas o parcialmente integradas.

### 6.2 Segmento secundario

Pequeños equipos de nutrición y entrenamiento que comparten asesorados y necesitan coordinar contexto sin perder autoridad por especialidad.

### 6.3 Asesorado objetivo

Persona adulta que:

- participa en un proceso profesional de nutrición o entrenamiento;
- consulta y ejecuta planes desde la APK;
- registra adherencia o ejecución;
- visualiza evolución;
- administra vínculos y consentimientos.

Una persona adulta podrá crear una cuenta sin vínculo activo para:

- aceptar una invitación;
- consultar servicios antropométricos publicados.

El acceso a planes, datos longitudinales o información profesional requerirá un vínculo válido y consentimientos aplicables.

### 6.4 Actores principales

| Actor | Función estratégica |
|---|---|
| Administrador | Gobierna validaciones, estados e incidencias |
| Profesional | Planifica, revisa, decide y responde por su especialidad |
| Asesorado | Ejecuta, registra, consulta y administra autorizaciones |
| Proveedor BE | Proporciona la infraestructura y sus controles |

### 6.5 Especialidades iniciales

- Nutrición.
- Entrenamiento.

Una misma identidad profesional podrá tener una o ambas especialidades verificadas.

La antropometría será una capacidad transversal. Su registro requerirá credencial o autorización específica según la política que definan los documentos 06 y 08.

### 6.6 Exclusiones iniciales

- menores de 18 años;
- atención de urgencias;
- diagnóstico o prescripción;
- autogestión clínica;
- gestión hospitalaria;
- aseguradoras;
- organizaciones complejas;
- investigación clínica;
- marketplace general;
- uso directo masivo sin proceso profesional, excepto descubrimiento antropométrico limitado.

---

## 7. Objetivo general

> **Desarrollar y validar un producto mínimo viable de BE que permita a profesionales de nutrición y entrenamiento gestionar procesos individualizados, longitudinales e interdisciplinarios, conectando evaluación, planificación, ejecución, antropometría, análisis y decisiones profesionales mediante un Website para profesionales y una aplicación Android para asesorados.**

---

## 8. Objetivos específicos

1. Implementar identidad, especialidades, verificación, vínculos, consentimientos y autorización contextual.
2. Cerrar el circuito nutricional de extremo a extremo.
3. Cerrar el circuito de entrenamiento de extremo a extremo.
4. Implementar antropometría transversal y trazable.
5. Desarrollar un dashboard interdisciplinario.
6. Desarrollar una APK Android para el asesorado.
7. Incorporar analítica longitudinal y continuidad.
8. Garantizar seguridad, auditoría y revocación efectiva.
9. Validar ambos dominios profesionales y los recorridos principales mediante pruebas y usuarios.
10. Demostrar integraciones externas con fallback y procedencia.

---

## 9. Propuesta de valor

### 9.1 Para el profesional

BE permite:

- concentrar información pertinente;
- comparar planificación y ejecución;
- conservar historial;
- visualizar evolución;
- consultar contexto autorizado de otras especialidades;
- coordinar revisiones;
- registrar decisiones;
- hacer visible y trazable la continuidad del trabajo profesional.

### 9.2 Para el asesorado

BE permite:

- conocer qué debe hacer;
- registrar qué hizo;
- comprender qué cambió;
- visualizar su evolución;
- identificar quién dirige cada dominio;
- administrar vínculos y consentimientos;
- participar activamente en el proceso.

### 9.3 Regla de pertinencia de datos

Cada dato deberá responder:

1. qué decisión apoya;
2. quién lo registra;
3. quién puede verlo;
4. cuál es su procedencia;
5. qué período representa;
6. qué significa;
7. cuáles son sus límites;
8. qué autorización requiere;
9. cómo se versiona;
10. cómo se audita.

---

## 10. Clasificación ejecutiva del alcance

| Nivel | Capacidades |
|---|---|
| **Núcleo no recortable** | identidad local, administración, vínculos, consentimientos, nutrición, entrenamiento, antropometría, dashboard, Website, APK, seguridad, trazabilidad y pruebas |
| **Compromiso académico de APIs** | Open Food Facts y wger |
| **Alta prioridad** | Google Identity y Google Maps con descubrimiento antropométrico limitado |
| **Condicionado** | Expo Push, medicamentos reportados, exportaciones, Resend, WhatsApp, calendario, pagos y wearables |
| **Fuera del MVP** | medicina operativa, IA clínica, marketplace general, organizaciones complejas, menores, iOS y comunicación en tiempo real |

La clasificación controla el orden de implementación y el recorte ante contingencias.

---

## 11. Alcance funcional del MVP

### 11.1 Identidad y acceso

- autenticación local;
- sesión gestionada por BE;
- Google como método federado adicional;
- roles y perfiles;
- especialidades verificadas;
- autorización contextual.

La identidad canónica pertenecerá a BE y podrá vincular más de un método de acceso. Una cuenta creada exclusivamente con Google no tendrá recuperación de contraseña local hasta que configure una credencial local.

### 11.2 Administración mínima

- revisión de perfiles profesionales;
- validación, observación, rechazo y suspensión;
- consulta de estados;
- gestión de cuentas demo;
- acceso a evidencia básica de auditoría.

### 11.3 Vínculos y consentimientos

- solicitud o invitación;
- aceptación o rechazo;
- consentimientos específicos, versionados y revocables;
- alcance según profesional, especialidad y propósito;
- activación, pausa, finalización y revocación;
- bloqueo de accesos futuros;
- conservación trazable de eventos históricos.

### 11.4 Circuito nutricional

```text
evaluación
→ plan válido y versionado
→ activación
→ consulta en APK
→ adherencia o ejecución
→ revisión profesional
→ decisión
→ continuidad o cierre
```

El detalle de datos, estados e invariantes pertenecerá a los documentos 04, 05, 06, 08 y 09.

### 11.5 Circuito de entrenamiento

```text
evaluación
→ planificación por bloques y sesiones
→ activación
→ consulta en APK
→ ejecución real
→ revisión profesional
→ progresión, ajuste o cierre
```

La prescripción podrá incluir series, repeticiones, carga, descanso y esfuerzo cuando corresponda, sin convertir este documento en especificación exhaustiva.

### 11.6 Antropometría

- registro autorizado;
- protocolo, autor, fecha y unidades;
- mediciones directas diferenciadas de cálculos;
- historial;
- comparación;
- correcciones trazables;
- consulta transversal según autorización.

### 11.7 Dashboard interdisciplinario

- situación operativa del asesorado;
- profesionales vinculados;
- consentimientos y alcances;
- estado de ambos dominios;
- adherencia y ejecución;
- evolución antropométrica;
- línea temporal integrada;
- revisiones pendientes;
- notas de coordinación;
- decisiones y próxima acción.

No se incluirá un score global de salud.

### 11.8 Website

Canal para:

- administración;
- gestión profesional;
- planificación;
- revisión;
- dashboard;
- analíticas;
- decisiones;
- trazabilidad.

### 11.9 APK Android

Canal para:

- autenticación;
- pantalla Hoy;
- consulta de planes;
- adherencia nutricional;
- ejecución de entrenamiento;
- progreso;
- antropometría autorizada;
- vínculos;
- consentimientos;
- novedades.

---

## 12. Descubrimiento limitado de servicios antropométricos

BE incluirá un módulo acotado que permita:

1. publicar un servicio antropométrico presencial;
2. asociar una ubicación;
3. visualizar profesionales próximos en lista y mapa;
4. consultar su perfil y credenciales;
5. generar una solicitud de vinculación.

No incluirá:

- reserva automática;
- pago;
- comisión;
- ranking;
- reseñas;
- reputación;
- contratación automática;
- marketplace general.

### 12.1 Elegibilidad para aparecer

Un profesional podrá publicarse cuando tenga:

- identidad activa;
- credencial antropométrica declarada y validada según política;
- servicio habilitado;
- ubicación utilizable;
- autorización para publicar la información;
- estado profesional válido.

La fuente de profesionales será la base de BE. Google Maps representará ubicaciones y facilitará la experiencia geográfica, pero no determinará la elegibilidad profesional.

---

## 13. Estrategia de integraciones externas

### 13.1 Fuente primaria propia

BE mantendrá:

- catálogo nutricional propio;
- catálogo de ejercicios propio;
- servicios y ubicaciones profesionales propios;
- autenticación local;
- centro interno de novedades.

### 13.2 APIs obligatorias para aceptación académica

#### Open Food Facts

- fallback nutricional;
- consulta por producto o código;
- importación profesional controlada;
- procedencia y snapshot según licencia.

#### wger

- fallback del catálogo de ejercicios;
- importación profesional controlada;
- procedencia y atribución según licencia.

### 13.3 APIs de alta prioridad

#### Google Identity

- registro o inicio federado;
- coexistencia con acceso local;
- sesión final emitida por BE;
- Google no valida especialidades ni roles profesionales.

#### Google Maps Platform

- selección y representación de ubicaciones;
- mapa de servicios antropométricos;
- búsqueda y elegibilidad controladas por BE.

### 13.4 Integración condicionada

#### Expo Push

Conjunto inicial reducido:

- invitación recibida;
- plan activado;
- plan actualizado;
- revisión profesional completada.

El contenido sensible permanecerá dentro de la APK autenticada. El centro de novedades será la fuente de verdad.

### 13.5 Regla de resiliencia

```text
fuente propia
→ proveedor externo cuando aporta valor
→ importación controlada
→ persistencia trazable
→ fallback manual
```

La indisponibilidad de un tercero no podrá impedir crear, consultar, ejecutar o revisar un plan.

---

## 14. Fuera del alcance

- diagnóstico;
- prescripción;
- historia clínica completa;
- decisiones médicas automatizadas;
- reducción o suspensión de medicación;
- inferencia causal;
- generación automática de planes;
- predicción clínica;
- marketplace general;
- pagos en producción;
- organizaciones complejas;
- reputación y rankings;
- wearables en el MVP;
- chat en tiempo real;
- videollamadas;
- integración completa con WhatsApp;
- menores y responsables legales;
- iOS;
- modo offline integral;
- múltiples idiomas;
- análisis técnico mediante cámara.

---

## 15. Criterios de éxito

El éxito no se medirá por cantidad de pantallas o endpoints, sino por circuitos verificables.

### 15.1 Criterio funcional

La demo deberá cerrar:

```text
ADMIN valida
→ PROFESIONAL se vincula
→ ASESORADO consiente
→ se activa un plan
→ ASESORADO consulta y ejecuta
→ PROFESIONAL revisa evidencia
→ consulta contexto interdisciplinario
→ registra una decisión
→ inicia continuidad o cierra correctamente
→ queda trazabilidad
```

El recorrido deberá demostrarse en nutrición y entrenamiento.

### 15.2 Criterio técnico

- Website desplegado;
- APK instalable en dispositivo Android físico;
- backend desplegado;
- PostgreSQL persistente;
- configuración por ambiente;
- integraciones mediante adaptadores;
- datos persistidos en una base real usando información sintética, anonimizada o expresamente autorizada;
- ausencia de datos codificados como fuente funcional principal.

### 15.3 Seguridad y gobernanza

- autenticación;
- autorización por rol, especialidad, vínculo, consentimiento, alcance y estado;
- revocación efectiva;
- versionado;
- auditoría;
- secretos fuera del repositorio;
- procedencia de importaciones;
- responsabilidad separada por dominio.

### 15.4 APIs

Como mínimo deberán demostrarse:

- Open Food Facts;
- wger;

incluyendo fallback y carga manual.

Google Identity y Maps forman parte del objetivo de alta prioridad. Expo Push solo se incorporará si alcanza estabilidad sin comprometer el núcleo.

### 15.5 Validación

La cobertura funcional requerirá:

- un nutricionista y un entrenador; o
- un profesional con ambas especialidades verificables;
- al menos un asesorado adulto.

El mismo asesorado podrá validar los dos recorridos. La muestra será exploratoria y no permitirá generalizaciones estadísticas.

### 15.6 Defectos

Para la presentación:

- cero defectos críticos abiertos;
- cero defectos altos en recorridos principales;
- defectos menores documentados con impacto y alternativa operativa.

### 15.7 Definition of Done

Una capacidad estará terminada cuando esté:

- diseñada;
- implementada;
- integrada;
- autorizada;
- persistida;
- probada;
- documentada;
- demostrable.

### 15.8 Límites de validación

La tesis no afirmará haber demostrado:

- mejoras clínicas atribuibles a BE;
- reducción de medicación;
- aumento real de retención;
- rentabilidad;
- cambios corporales causados por la plataforma.

---

## 16. North Star

La North Star será:

> **TVCC-30 — Tasa de Vínculos con Cierre y Continuidad Trazable en 30 días.**

Definición estratégica:

```text
TVCC-30 =
vínculos elegibles que cerraron un ciclo y registraron
una siguiente acción válida dentro de 30 días
/
total de vínculos elegibles con ciclo esperado en el período
```

Una siguiente acción válida puede ser:

- mantener;
- ajustar;
- sustituir;
- iniciar un nuevo bloque;
- reprogramar;
- cambiar objetivo;
- programar revisión;
- finalizar correctamente cuando no corresponde continuar.

La continuidad no equivale a retención, fidelidad, adherencia ni resultado corporal. La definición operacional completa pertenecerá a los documentos 04, 06 y 12.

---

## 17. Modelo comercial — síntesis estratégica

Esta sección constituye una síntesis aprobada, sujeta a desarrollo y validación en el Documento 03.

BE adoptará un modelo SaaS B2B2C basado en:

- licencias individuales para profesionales;
- especialidades verificadas;
- habilitaciones comerciales separadas de la autorización de datos;
- bandas de capacidad por asesorados activos;
- descuento combinado para una persona verificada en nutrición y entrenamiento;
- capacidades horizontales incluidas;
- evolución futura hacia organizaciones con asientos individuales.

El MVP no requiere pagos reales ni facturación integrada.

---

## 18. Roadmap gobernado por gates

El roadmap adopta literalmente los gates definidos por `BE-LEG-00 v0.2.1`. Las condiciones adicionales se gestionan como restricciones o hitos operativos y no se confunden con requisitos formales del gate.

| Gate | Propósito | Condición formal |
|---|---|---|
| G0 | Gobierno aprobado | Documento 00 aprobado |
| G1 | Producto definido | Documentos 02 y 03 aprobados |
| G2 | Comportamiento definido | Documentos 04 y 05 aprobados |
| G3 | Fundamentos definidos | Documentos 06 y 08 aprobados |
| G4 | Solución diseñada | Documentos 07, 09 y 10 aprobados |
| G5 | Verificación preparada | Documentos 11 y 12 aprobados |
| G6 | Presentación final | Documento 01 definitivo, documentos baselineados, evidencia, trazabilidad y riesgos residuales |

Las preguntas `Q-001`, `Q-009` y `Q-010` se resuelven en los documentos que las gobiernan. `Q-000` es una restricción adicional de recuperación introducida durante la definición del producto y resuelta por `DEC-012`; no forma parte literal de los requisitos de G1.

Cada gate hereda los anteriores.

### 18.1 Secuencia

```text
G0
→ 02 y 03
→ G1
→ 04 y 05
→ G2
→ 06 y 08
→ G3
→ 07, 09 y 10
→ G4
→ 11 y 12
→ G5
→ implementación aceptada y evidencia cerrada
→ 01 definitivo y baseline integral
→ G6
```

### 18.2 Fecha provisional

El roadmap se planifica contra una **fecha objetivo interna del 27 de agosto de 2026** y una reserva del 28 al 31 de agosto.

No constituye una fecha institucional confirmada.

Antes de aprobar el Gantt definitivo deberán confirmarse:

- fecha de entrega;
- fecha estimada de defensa;
- plazo de revisión del tutor;
- fecha límite para solicitar mesa;
- requisito exacto sobre APIs externas.

---

## 19. Secuencia de implementación

### 19.1 Convergencia del código existente

Cada módulo se clasificará como:

- PRESERVAR;
- REFACTORIZAR;
- REEMPLAZAR;
- RETIRAR.

La decisión se basará en:

- fidelidad al dominio;
- requisitos;
- seguridad;
- trazabilidad;
- mantenibilidad;
- capacidad de prueba;
- costo total;
- riesgo;
- deuda residual.

No se preservará por costo hundido ni se reescribirá por preferencia estética.

### 19.2 Nutrición como primer circuito

En conformidad con el Gobierno del Legajo:

1. nutrición será el primer circuito recuperado y demostrado;
2. la documentación y diseño de entrenamiento podrán avanzar;
3. la expansión canónica de entrenamiento se realizará después de demostrar Q-000 o mediante un cambio sustantivo formal que reemplace esa restricción.

El objetivo final del MVP continúa incluyendo ambas verticales completas.

### 19.3 APK temprana

Hitos:

- M0: build instalable;
- M1: lectura real;
- M2: escritura real;
- M3: circuito integrado;
- M4: versión de defensa.

---

## 20. Supuestos y preguntas abiertas

### Supuestos

- capacidad aproximada de 15 horas semanales;
- acceso a repositorio, base, hosting, Google Cloud, Expo y dispositivo Android;
- recuperación parcial del código existente;
- disponibilidad de validadores;
- datos sintéticos, anonimizados o autorizados;
- fecha interna de cierre hacia finales de agosto.

### Preguntas abiertas

| ID | Pregunta | Límite |
|---|---|---|
| Q-FECHA-001 | Fecha exacta de entrega y defensa | Antes del Gantt definitivo |
| Q-API-001 | Cantidad mínima formal de APIs externas | Antes de G1 o confirmación del tutor |
| Q-VALID-001 | Participantes concretos para ambos dominios | Plan disponible antes de G2 |
| Q-GOV-001 | Momento exacto para habilitar expansión de entrenamiento tras Q-000 | Antes de implementación canónica de entrenamiento |

---

## 21. Riesgos prioritarios

| ID | Riesgo | P | I | Indicador temprano | Respuesta |
|---|---|---:|---:|---|---|
| RSK-001 | Alcance superior a la capacidad | 5 | 5 | múltiples módulos incompletos | aplicar clasificación de alcance y recorte |
| RSK-002 | Código previo incompatible | 5 | 4 | parches acumulativos | clasificar y reemplazar cuando corresponda |
| RSK-003 | Reescritura innecesaria | 3 | 4 | refactors sin criterio funcional | exigir fundamento y prueba |
| RSK-004 | Modelo de datos inestable | 4 | 5 | migraciones repetidas y estados implícitos | detener expansión y corregir dominio |
| RSK-005 | Autorización defectuosa | 3 | 5 | acceso basado solo en rol | bloquear función y corregir antes de continuar |
| RSK-006 | APK tardía o no instalable | 4 | 5 | dependencia de Expo Go | alcanzar M0 y M1 tempranamente |
| RSK-007 | Integraciones desplazan el núcleo | 4 | 4 | Maps o login avanzan antes que circuitos | suspender integración |
| RSK-008 | Despliegue diverge de local | 4 | 5 | solo funciona localmente | desplegar y probar incrementalmente |
| RSK-009 | Evidencia y documentos atrasados | 4 | 5 | requisitos sin pruebas o capturas | producir evidencia en paralelo |
| RSK-010 | Falla durante la defensa | 3 | 5 | entorno inestable | versión congelada, datos demo y video de respaldo |
| RSK-011 | Validación insuficiente | 3 | 4 | falta de profesional de un dominio | reclutar alternativas antes de G2 |
| RSK-012 | Cambios masivos insuficientemente revisados | 4 | 4 | diffs extensos sin comprensión | aislar, revisar y revertir si corresponde |

P: probabilidad. I: impacto. Escala de 1 a 5.

---

## 22. Contingencias

### Se recorta primero

1. medicamentos reportados;
2. exportaciones;
3. notificaciones secundarias;
4. Expo Push;
5. filtros avanzados del mapa;
6. funciones avanzadas de cuenta híbrida;
7. mejoras visuales no funcionales;
8. integraciones posteriores.

### Se preserva

- autenticación local;
- Website;
- APK;
- vínculos;
- consentimientos;
- nutrición;
- entrenamiento;
- antropometría;
- dashboard;
- seguridad;
- trazabilidad;
- pruebas;
- Open Food Facts;
- wger.

### Fallbacks

| Capacidad | Fallback |
|---|---|
| Google Identity | autenticación local |
| Open Food Facts | catálogo BE y carga manual |
| wger | catálogo BE y carga manual |
| Google Maps | lista y ubicación textual |
| Expo Push | centro interno de novedades |

---

## 23. Trazabilidad de decisiones incorporadas

| Decisión | Materia |
|---|---|
| DEC-012 | circuito nutricional cerrado |
| DEC-013 | especialidades y antropometría transversal |
| DEC-014 | dashboard interdisciplinario |
| DEC-015 | analítica descriptiva y límites |
| DEC-016 | TVCC-30 |
| DEC-017 | modelo comercial |
| DEC-018 | Website + APK React Native/Expo |
| DEC-019 | problema y oportunidad |
| DEC-020 | visión |
| DEC-021 | público objetivo |
| DEC-022 | objetivos |
| DEC-023 | alcance |
| DEC-024 | integraciones externas |
| DEC-025 | criterios de éxito |
| DEC-026 | roadmap y política sobre código previo |
| DEC-027 | riesgos y contingencias |

Las normas operativas internas que no describen el producto se mantienen fuera del documento entregable.

---

## 24. Condición de aprobación

Esta versión fue aprobada por dirección después de verificar que:

1. las resoluciones de `REV-002` fueron aceptadas;
2. el contenido fue alineado con `BE-LEG-00 v0.2.1`;
3. las preguntas abiertas fueron clasificadas como no bloqueantes para la dirección estratégica;
4. dirección aprobó expresamente la versión 0.2 el 2026-07-27;
5. la versión 0.2.1 corrigió únicamente nomenclatura documental, fecha de versión y correspondencia literal de gates, sin modificar decisiones de producto.

La aprobación de este documento satisface la condición de G1 correspondiente al Documento 02. El cierre de G1 requiere además el Documento 03 aprobado y la incorporación de ambos documentos al canon.

---

## 25. Estado

```text
Documento 02 v0.2.1:
APROBADO POR DIRECCIÓN
CORRECCIÓN EDITORIAL Y DE GOBIERNO INCORPORADA
REV-002 CERRADA
CANONIZADO EN EL COMMIT DE CIERRE DE G1
```
