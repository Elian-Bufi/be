# 03 — Negocio, modelo comercial y validación

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud
> **Código documental:** `BE-LEG-03`
> **Versión:** `0.2.1`
> **Estado:** `APROBADO`
> **Fecha de versión:** 2026-07-27
> **Fecha de aprobación:** 2026-07-27
> **Responsable de dirección:** Elian Gastón Bufi
> **Propietario documental:** Dirección de producto BE
> **Canon previsto:** `docs/legajo/03_Modelo_de_Negocio.md`
> **Gate propietario:** `G1 — Producto definido`
> **Canonización en Git:** pendiente

---

## 1. Propósito

Este documento define el modelo de negocio TO-BE de BE:

- cliente, usuario, beneficiario y pagador;
- mercado de entrada;
- propuesta de valor;
- unidad comercial;
- estructura de habilitaciones;
- estrategia de precios;
- adquisición y activación;
- competencia y posicionamiento;
- ingresos, costos y sostenibilidad;
- operación;
- hipótesis y plan de validación;
- métricas, riesgos y límites.

No fija importes definitivos, obligaciones fiscales, contratos ni medios de pago productivos.

---

## 2. Resumen ejecutivo

BE adoptará inicialmente un modelo **SaaS B2B2C**.

```text
BE
→ habilita al profesional
→ el profesional incorpora asesorados
→ los asesorados utilizan la APK
→ la evidencia vuelve al profesional
→ el profesional revisa y decide
```

### Decisiones centrales

| Dimensión | Decisión |
|---|---|
| Cliente y pagador | Profesional |
| Usuario operador | Profesional verificado |
| Usuario mobile | Asesorado adulto |
| Unidad comercial | Licencia profesional activa |
| Diferenciación | Habilitaciones y capacidad |
| Oferta | Nutrición, Entrenamiento e Integral |
| Cuenta del asesorado | Gratuita, propia y persistente |
| Ingreso principal | Suscripción mensual o anual |
| Entrada al mercado | Venta directa, pilotos y referidos |
| Activación | Primera revisión o decisión válida |
| Posicionamiento | Infraestructura longitudinal e interdisciplinaria |
| Publicidad y venta de datos | Excluidas |
| Cobros reales | Fuera del MVP académico |

---

## 3. Dos planos del modelo

### 3.1 Plano académico

El MVP de tesis deberá demostrar:

- habilitaciones;
- vínculos;
- consentimientos;
- capacidad conceptual;
- restricciones coherentes;
- ambos circuitos profesionales;
- Website y APK;
- seguridad, persistencia y trazabilidad.

Puede utilizar:

- configuración administrativa;
- datos demo;
- estados de licencia simulados o asignados manualmente.

No requiere:

- cobros;
- facturación;
- renovación;
- conciliación;
- reembolsos;
- mora;
- comisiones.

### 3.2 Plano comercial

La hipótesis comercial futura es una suscripción profesional por habilitaciones y banda de capacidad.

La existencia del modelo comercial no transforma automáticamente todas sus funciones en alcance técnico del MVP.

---

## 4. Actores económicos y tratamiento de datos

| Concepto | Actor |
|---|---|
| Cliente principal | Profesional independiente |
| Pagador inicial | Profesional |
| Usuario operador | Profesional verificado |
| Usuario mobile | Asesorado |
| Beneficiarios | Profesional y asesorado |
| Beneficiarios futuros | Equipos y organizaciones |
| Persona a quien refieren los datos del proceso | Asesorado |
| Proveedor tecnológico | BE |

Los profesionales también son titulares de los datos personales que les conciernen.

### 4.1 Separación obligatoria

- identidad;
- especialidad;
- habilitación comercial;
- vínculo;
- consentimiento;
- autorización.

```text
identidad
≠ especialidad
≠ paquete comercial
≠ habilitación
≠ vínculo
≠ autorización
```

### 4.2 Roles jurídicos pendientes

El Documento 08 deberá definir, según cada tratamiento:

- titular de datos;
- autor del registro;
- responsable;
- encargado;
- destinatario;
- custodio técnico;
- base de legitimación;
- derechos aplicables.

La identidad longitudinal persistente es un principio de producto; no implica propiedad irrestricta sobre todos los datos.

---

## 5. Mercado de entrada

### 5.1 Categoría

BE compite en la intersección de:

- software de nutrición profesional;
- software de entrenamiento;
- seguimiento mobile;
- gestión de procesos longitudinales;
- coordinación interdisciplinaria.

### 5.2 Geografía elegida

```text
Piloto:
AMBA y red accesible

Entrada comercial:
Argentina

Expansión:
Latinoamérica hispanohablante
```

### 5.3 Razón de la elección

- acceso real a validadores;
- idioma;
- conocimiento del contexto;
- posibilidad de soporte directo;
- necesidad de adaptar precios y operación local;
- expansión posterior sin diseñar inicialmente para múltiples jurisdicciones.

No se presentarán cifras de mercado no verificadas. La estimación cuantitativa futura deberá utilizar fuentes documentadas y un método reproducible.

---

## 6. Segmento prioritario

Profesionales de nutrición y entrenamiento que:

- mantienen cartera activa;
- revisan periódicamente;
- adaptan planes;
- usan varias herramientas;
- comparan planificación y ejecución;
- registran evolución;
- valoran antropometría;
- trabajan o podrían trabajar con otra especialidad;
- diferencian seguimiento de entrega aislada.

### Segmentos secundarios

- doble especialidad;
- antropometristas;
- pequeños equipos;
- gimnasios o consultorios pequeños;
- organizaciones futuras.

### Menor encaje inicial

- consultas únicas;
- entrega sin seguimiento;
- ausencia de registro;
- baja necesidad de coordinación;
- rechazo a la participación del asesorado.

---

## 7. Trabajo del cliente

### Funcional

- evaluar;
- planificar;
- comunicar;
- observar ejecución;
- revisar;
- adaptar;
- documentar.

### Profesional

- conservar historial;
- decidir con contexto;
- explicar cambios;
- mantener autoría;
- proteger responsabilidad.

### Coordinación

- consultar información pertinente;
- evitar contradicciones;
- identificar responsables;
- coordinar sin modificar el dominio ajeno.

### Comercial

- ofrecer continuidad;
- hacer visible el trabajo;
- diferenciar el servicio;
- administrar una cartera;
- justificar ajustes.

---

## 8. Propuesta de valor

> **BE convierte planes y registros dispersos en un proceso profesional longitudinal e interdisciplinario: el asesorado sabe qué hacer y registra lo que ocurre, mientras cada profesional recibe contexto autorizado, revisa evidencia y toma decisiones sucesivas con trazabilidad.**

### Profesional

- centralización contextual;
- comparación planificación–ejecución;
- historial y versiones;
- evidencia longitudinal;
- coordinación autorizada;
- decisiones trazables;
- operación estructurada.

### Asesorado

- claridad;
- registro desde la APK;
- evolución visible;
- comprensión de cambios;
- participación;
- control de vínculos y consentimientos;
- identidad persistente.

### Equipo

- contexto compartido;
- permisos separados;
- responsabilidad por especialidad;
- línea temporal integrada;
- autoría.

---

## 9. Posicionamiento

> **Infraestructura longitudinal e interdisciplinaria dirigida por profesionales, que conecta planificación, ejecución, evolución y decisiones sucesivas dentro de una identidad persistente del asesorado, preservando autorización, responsabilidad y trazabilidad por especialidad.**

### Se descarta posicionar BE como

- “todo en uno”;
- “la única plataforma”;
- “la opción más barata”;
- “una app de inteligencia artificial”;
- producto universalmente superior.

### Diferenciadores

- profundidad nutricional;
- profundidad de entrenamiento;
- antropometría transversal;
- identidad longitudinal;
- coordinación autorizada;
- continuidad trazable;
- participación del asesorado.

---

## 10. Competencia y alternativas

### 10.1 Alternativa informal

```text
WhatsApp
+
planillas
+
PDF
+
Drive
+
calendario
+
aplicaciones aisladas
```

Su ventaja es la familiaridad. Su costo oculto es la integración manual.

### 10.2 Benchmark representativo

| Producto | Categoría observada | Fortaleza representativa | Implicación para BE |
|---|---|---|---|
| ABC Trainerize | Entrenamiento y coaching | entrenamiento, nutrición, hábitos y app | integrar verticales no es diferencial suficiente |
| Nutrium | Nutrición profesional | planes, diario, progreso y operación nutricional | BE debe sostener profundidad nutricional |
| Practice Better | Gestión de práctica | portal, formularios, protocolos y operación | no competir por amplitud administrativa |
| Healthie | Gestión y atención digital | portal, agenda, pagos y teleatención | mantener límites no clínicos del MVP |
| Mapple | Nutrición local | app profesional/paciente, métricas y seguimiento | existe competencia argentina especializada |
| Treiner | Entrenamiento regional | rutinas, chat, historial físico y modelo trainer-paga | el modelo B2B2C ya es comprensible en la región |
| NutriasSoft | Gestión nutricional local | agenda, pacientes, planes, reservas y pagos | el precio local no puede ser único diferencial |
| DietoFlow | Nutrición para independientes | planes y app vinculada al profesional | “dejar Excel y WhatsApp” ya es promesa común |

**Fecha de corte:** 2026-07-27.
**Fuentes:** páginas oficiales de los productos.
**Regla:** revisar nuevamente antes de la defensa y no presentar mensajes comerciales como resultados comprobados.

---

## 11. Modelo comercial y unidad económica

### Modelo

```text
SaaS B2B2C
```

### Unidad comercial

> Licencia asociada a una identidad profesional verificada, con habilitaciones y banda de capacidad.

### Regla de implementación

Los paquetes comerciales conceden habilitaciones.

```text
paquete
→ habilitaciones
→ límites
```

No se modelará:

```text
plan == especialidad == rol == autorización
```

---

## 12. Estructura de oferta

### Nutrición

- evaluación;
- catálogo;
- planificación;
- versionado;
- adherencia;
- revisión;
- decisiones.

### Entrenamiento

- evaluación;
- bloques;
- sesiones;
- ejercicios;
- ejecución;
- progresión;
- decisiones.

### Integral

Concede ambas habilitaciones a una identidad verificada en las dos especialidades.

La oferta Integral podrá tener descuento frente a la contratación separada, pero esa relación es una hipótesis de precio, no una regla técnica irreversible.

---

## 13. Capacidades horizontales

Todas las licencias activas incluirán:

- identidad;
- vínculos;
- consentimientos;
- autorización;
- auditoría;
- perfil longitudinal;
- timeline;
- dashboard autorizado;
- consulta antropométrica;
- APK;
- seguridad;
- trazabilidad.

No serán complementos premium.

---

## 14. Capacidad y asesorado activo

### 14.1 Unidad de conteo

La capacidad pertenece a la identidad profesional.

- un asesorado cuenta una vez para el mismo profesional;
- no se duplica por operar Nutrición y Entrenamiento;
- cuenta separadamente para profesionales diferentes.

### 14.2 Estado activo

Un asesorado ocupa capacidad cuando:

- existe vínculo vigente;
- hay consentimiento aplicable;
- existe al menos un proceso operativo abierto bajo ese profesional.

La actividad no dependerá únicamente de logins recientes.

No ocupa capacidad cuando:

- la invitación está pendiente;
- el vínculo fue rechazado;
- todos los procesos finalizaron;
- fue archivado;
- el consentimiento aplicable fue revocado;
- solo consulta un servicio antropométrico.

Las pausas y períodos de gracia se definirán en el Documento 06.

### 14.3 Límite alcanzado

- continúan los procesos vigentes;
- pueden revisarse y cerrarse;
- no se eliminan datos;
- no se revocan vínculos;
- no se activan nuevos procesos hasta liberar capacidad o ampliar banda.

---

## 15. Cuenta del asesorado

Será:

- gratuita para el usuario en el MVP;
- propia;
- persistente;
- independiente de un profesional específico.

Al finalizar vínculos:

- se limitan funciones;
- no se elimina automáticamente la cuenta;
- no se elimina automáticamente el historial;
- se aplican políticas de retención y autorización.

La gratuidad no implica costo operativo nulo para BE.

---

## 16. Verificación profesional

En el MVP, “verificado” significa:

> evidencia documental revisada mediante un procedimiento administrativo trazable.

No significa automáticamente:

- certificación oficial;
- garantía de competencia;
- aval institucional;
- matrícula vigente;
- ausencia de sanciones.

Cuando se consulte una fuente externa, se conservarán:

- procedencia;
- fecha;
- resultado;
- limitaciones.

---

## 17. Antropometría

### Dentro de un seguimiento

Capacidad transversal autorizada.

El registro requerirá:

- credencial o habilitación definida;
- permiso;
- vínculo;
- consentimiento.

### Descubrimiento limitado

- publicación de servicio;
- ubicación;
- mapa y lista;
- consulta de perfil;
- solicitud de vínculo.

Sin:

- reservas;
- pagos;
- comisiones;
- ranking;
- reputación;
- patrocinio.

Es un canal secundario y no desplazará los circuitos centrales.

---

## 18. Estrategia de precios

### Método

- valor percibido;
- costos;
- competencia;
- disposición a pagar.

### Estructura conceptual

```text
suscripción
+
habilitaciones
+
banda
+
mensual o anual
```

### Prueba comercial

Hipótesis futura:

- limitada por tiempo;
- limitada por capacidad;
- funcionalmente completa.

No es requisito del MVP académico.

### Pendientes

- importes;
- moneda;
- bandas;
- duración;
- descuentos;
- actualización.

---

## 19. Adquisición

### Principal

- venta directa;
- entrevistas;
- demos;
- pilotos;
- referidos;
- comunidades.

### Complementaria

- contenido;
- alianzas pequeñas;
- gimnasios;
- consultorios;
- formaciones;
- equipos;
- comunidades antropométricas.

### No prioritaria

- publicidad masiva;
- influencers generalistas;
- marketplace general;
- venta empresarial compleja;
- adquisición directa de pacientes.

---

## 20. Embudo y activación

```text
conoce BE
→ demo
→ prueba
→ verificación
→ primer asesorado
→ primer plan
→ primera ejecución
→ primera revisión o decisión válida
→ continuidad o cierre
→ evaluación comercial
```

### Activación

> El profesional activa un plan, recibe evidencia de ejecución y registra una revisión o decisión válida.

La decisión puede mantener, ajustar, sustituir, programar otra revisión o finalizar.

---

## 21. Ciclos de crecimiento

- profesional → asesorados;
- profesional → colega de otra especialidad;
- antropometría → solicitud de vínculo;
- ciclos completados → referidos.

No se utilizarán datos de asesorados para marketing sin autorización específica.

---

## 22. Ingresos

### Principal

- suscripción profesional.

### Futuros

- organizaciones;
- asientos;
- expansión de capacidad;
- complementos;
- integraciones institucionales;
- transacciones controladas.

### Excluidos

- publicidad dentro de BE;
- venta de datos;
- comercialización de información de salud.

---

## 23. Costos y sostenibilidad

### Costos

- infraestructura;
- almacenamiento;
- APIs;
- desarrollo;
- mantenimiento;
- seguridad;
- soporte;
- verificación;
- catálogos;
- adquisición;
- administración.

### Unidad económica

Licencia profesional activa.

### Margen conceptual

```text
ingreso
-
costos variables atribuibles
=
margen de contribución
```

No se afirmará rentabilidad sin operaciones verificables.

---

## 24. Modelo operativo

```text
núcleo estratégico propio
+
proveedores especializados
+
validación profesional externa
```

### Bajo control de BE

- producto;
- dominio;
- arquitectura central;
- identidad longitudinal;
- autorización;
- consentimiento;
- continuidad;
- gobernanza;
- aceptación.

### Apoyo externo

- infraestructura;
- base;
- mapas;
- identidad federada;
- notificaciones;
- datos externos;
- servicios futuros.

Delegar ejecución no delega responsabilidad.

---

## 25. Actividades, recursos y socios

### Actividades

- dirección;
- desarrollo;
- mantenimiento;
- validación;
- verificación;
- catálogos;
- seguridad;
- infraestructura;
- onboarding;
- soporte;
- adquisición;
- medición.

### Recursos

- conocimiento del dominio;
- plataforma;
- catálogos;
- taxonomías;
- documentación;
- red profesional;
- marca;
- evidencia.

Los datos personales no son un recurso comercial vendible.

### Socios

- profesionales validadores;
- asesorados piloto;
- infraestructura;
- APIs;
- instituciones futuras.

No se afirmará una alianza sin acuerdo verificable.

---

## 26. Business Model Canvas

| Bloque | Definición |
|---|---|
| Segmentos | Profesionales; equipos futuros |
| Propuesta | Proceso longitudinal e interdisciplinario trazable |
| Canales | Venta directa, pilotos, referidos y alianzas |
| Relación | Onboarding, autoservicio progresivo y soporte |
| Ingresos | Suscripciones |
| Recursos | Dominio, plataforma, catálogos, red y evidencia |
| Actividades | Producto, desarrollo, seguridad, validación y soporte |
| Socios | Profesionales, pilotos, infraestructura y APIs |
| Costos | Desarrollo, infraestructura, seguridad, soporte y adquisición |

---

## 27. Hipótesis

| ID | Hipótesis | Evidencia |
|---|---|---|
| H-BIZ-01 | Fragmentación recurrente | herramientas y relatos |
| H-BIZ-02 | Reconstruir contexto genera esfuerzo | tareas y observación |
| H-BIZ-03 | El ciclo longitudinal aporta valor | priorización |
| H-BIZ-04 | El profesional incorpora asesorados | piloto |
| H-BIZ-05 | La APK es comprensible | tareas |
| H-BIZ-06 | La coordinación aporta valor | caso interdisciplinario |
| H-BIZ-07 | Existe disposición a pagar | sensibilidad de precios |
| H-BIZ-08 | La activación es repetible | ciclos |
| H-BIZ-09 | Antropometría genera vínculos | prueba geográfica |
| H-BIZ-10 | El soporte es sostenible | incidencias |

---

## 28. Estrategia de validación

### Método elegido

```text
entrevistas
+
pruebas de tareas
+
piloto
+
disposición a pagar
```

Se descarta una encuesta masiva inicial porque el objetivo actual es comprender comportamiento, lenguaje y fricción.

### Muestra objetivo

- 8 profesionales;
- 4 asesorados.

Distribución profesional:

- 3 nutricionistas;
- 3 entrenadores;
- 2 perfiles interdisciplinarios, de doble especialidad o antropometría.

### Mínimo defendible

- 5 profesionales;
- 2 asesorados;
- cobertura de Nutrición;
- cobertura de Entrenamiento;
- un caso interdisciplinario o de doble especialidad.

No alcanzar el objetivo deberá registrarse como limitación.

### Piloto

- un nutricionista y un entrenador; o
- una persona de doble especialidad;
- entre 2 y 4 asesorados;
- demostración de ambos dominios.

---

## 29. Etapas de validación

### Descubrimiento

- herramientas;
- flujo real;
- fricción;
- frecuencia;
- coordinación;
- costos;
- disparadores.

### Propuesta

- comprensión;
- prioridad;
- comparación;
- utilidad;
- objeciones.

### Tareas

Profesional:

- vínculo;
- plan;
- revisión;
- contexto;
- decisión.

Asesorado:

- aceptación;
- consentimiento;
- Hoy;
- ejecución;
- evolución.

### Piloto

- ambos dominios;
- al menos un ciclo revisado por vertical;
- incidencias;
- asistencia;
- continuidad.

### Precio

- demasiado bajo;
- económico;
- alto pero justificable;
- demasiado alto;
- modalidad preferida;
- intención de continuar.

---

## 30. Reglas exploratorias de decisión

Los resultados no se tratarán como inferencia estadística.

### Evidencia fuerte

- convergencia de al menos 75 % de la muestra disponible;
- coherencia cualitativa;
- evidencia conductual o de tarea;
- ausencia de contradicción crítica.

### Evidencia parcial

- convergencia entre 50 % y 74 %;
- diferencias relevantes por perfil;
- opinión favorable sin conducta;
- necesidad de ajuste.

### Evidencia débil

- menos de 50 %;
- fallos de tarea;
- contradicción entre discurso y conducta;
- rechazo del valor central.

### Umbrales operativos objetivo

| Área | Objetivo |
|---|---|
| Fragmentación | 6 de 8 |
| Relevancia | 5 de 8 |
| Comprensión | 6 de 8 |
| Valor | 5 de 8 |
| Mobile | 3 de 4 |
| Activación | un ciclo revisado por vertical |
| Coordinación | un caso útil |
| Continuidad | dos profesionales solicitan continuar |
| Precio | cinco entrevistas utilizables |

Con muestra mínima, se reportarán conteos absolutos y limitaciones, sin extrapolación.

---

## 31. Política ante resultados

| Resultado | Acción |
|---|---|
| Evidencia fuerte | preservar y profundizar |
| Evidencia parcial | ajustar y volver a probar |
| Problema válido, solución débil | rediseñar solución |
| Problema débil | revisar segmento o propuesta |
| Función sin valor | postergar o retirar |
| Riesgo crítico | detener la capacidad afectada |

La validación deberá poder cambiar el producto.

---

## 32. Evidencia

Cada actividad conservará:

- fecha;
- perfil;
- consentimiento;
- guion;
- tareas;
- observaciones;
- resultados;
- incidencias;
- decisiones derivadas;
- cambio asociado.

Se distinguirá:

- evidencia declarada;
- evidencia observada;
- evidencia conductual;
- evidencia técnica.

---

## 33. Métricas

### Producto

- tiempo hasta plan;
- ejecución;
- revisión;
- ciclos;
- TVCC-30.

### Experiencia

- tareas;
- errores;
- asistencia;
- comprensión;
- abandono.

### Negocio

- demos;
- pruebas;
- activaciones;
- continuidad;
- disposición a pagar;
- preferencia de oferta.

### Operación

- soporte;
- verificación;
- integraciones;
- carga manual;
- costo de atención.

Estas métricas tienen finalidad exploratoria hasta contar con una base suficiente.

---

## 34. Riesgos

| Riesgo | Respuesta |
|---|---|
| Mercado saturado | posicionamiento y evidencia |
| Valor insuficiente | demostrar circuito |
| Precio incorrecto | validar antes de fijar |
| Onboarding complejo | pruebas y simplificación |
| Soporte excesivo | medir y automatizar |
| Coordinación poco usada | validar con casos reales |
| Reclutamiento insuficiente | muestra mínima y alternativas |
| Desvío a marketplace | alcance limitado |
| Costos externos | adaptadores y fallback |
| Verificación mal interpretada | lenguaje y procedencia |
| Tratamiento de datos ambiguo | Documento 08 |
| Benchmark desactualizado | revisión antes de defensa |
| Promesas exageradas | límites explícitos |

---

## 35. Límites de afirmación

BE podrá demostrar que:

- conecta planificación y ejecución;
- conserva versiones;
- integra antropometría;
- mantiene autoría;
- aplica permisos;
- permite coordinación;
- registra decisiones;
- opera mediante Website y APK.

No afirmará todavía:

- rentabilidad;
- crecimiento;
- retención;
- mejora clínica;
- mayor capacidad;
- reducción de costos;
- mejores resultados corporales;
- superioridad general.

---

## 36. Trazabilidad

| Decisión | Materia |
|---|---|
| DEC-029 | actor económico |
| DEC-030 | propuesta de valor |
| DEC-031 | estructura de oferta |
| DEC-032 | precios |
| DEC-033 | adquisición |
| DEC-034 | competencia |
| DEC-035 | sostenibilidad |
| DEC-036 | operación |
| DEC-037 | planos académico y comercial |
| DEC-038 | conteo de capacidad |
| DEC-039 | mercado de entrada |
| DEC-040 | validación escalonada |
| DEC-041 | verificación profesional |

---

## 37. Preguntas abiertas

- importes;
- bandas;
- duración de prueba;
- moneda;
- política de actualización;
- participantes concretos;
- tratamiento jurídico por categoría;
- pausas y períodos de gracia;
- organizaciones;
- monetización futura de antropometría;
- medios de pago futuros.

No bloquean la aprobación estratégica. Sí condicionan comercialización o documentos posteriores.

---

## 38. Registro de aprobación

La dirección aprobó expresamente la versión 0.2 el 2026-07-27 después de:

1. aceptar las resoluciones de REV-003;
2. verificar su coherencia con el Documento 02;
3. clasificar las preguntas abiertas;
4. disponer el cierre de la revisión;
5. autorizar una versión 0.2.1 con correcciones exclusivamente editoriales: fecha, ruta canónica y estado de gate.

La aprobación satisface la condición documental de G1 correspondiente al Documento 03. La versión 0.2.1 queda incorporada al canon mediante el commit de cierre de G1.

---

## 39. Estado

```text
BE-LEG-03 v0.2.1:
APROBADO POR DIRECCIÓN
CORRECCIÓN EDITORIAL INCORPORADA
REV-003 CERRADA
CANONIZADO EN EL COMMIT DE CIERRE DE G1
```
