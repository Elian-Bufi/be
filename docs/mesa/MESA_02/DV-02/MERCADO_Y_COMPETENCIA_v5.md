# Investigación de mercado y competencia — soporte de DV-02 v5

Consulta: 2026-09-13. Método: revisión documental de páginas oficiales de producto y centros de ayuda. No se realizaron entrevistas, contratación, auditoría de seguridad ni pruebas de los productos comparados. Fecha de consulta no equivale a fecha de publicación. La selección es intencional y no representa una muestra estadística del mercado argentino.

## 7. Análisis de mercado

### 7.1. Oferta observada

La oferta consultada cubre nutrición profesional, seguimiento de actividad física y gestión de prácticas de salud/bienestar. Nutrium documenta planes, diarios y mediciones en su aplicación para clientes. Hexfit presenta creación de programas, seguimiento, nutrición y aplicación móvil. NutriAdmin documenta planes, cuestionarios y diarios mediante un portal web. Estas fuentes permiten afirmar que existe oferta de software con funciones que se superponen con BE; no permiten medir su tamaño de mercado, adopción en Argentina ni participación relativa. [S1, S2, S3]

La colaboración entre varios profesionales tampoco es una función exclusiva de BE: Healthie documenta equipos de atención, varios prestadores asociados a un cliente y permisos configurables. Esto impide sostener, como ocurría en una versión anterior, que los productos existentes necesariamente mezclan todos los datos o carecen de restricciones entre profesionales. [S4]

Practice Better presenta gestión de la práctica, registros, protocolos e integración de planificación nutricional. Su presencia amplía la comparación hacia suites de gestión, no solo aplicaciones de planes. Sus declaraciones comerciales se consideran funciones publicitadas, no evidencia independiente de calidad, resultados clínicos o desempeño. [S5]

### 7.2. Hipótesis de posicionamiento de BE

Según BE-LEG-02 v0.2.1 y BE-LEG-03 v0.2.1, BE se orienta al trabajo profesional longitudinal con asesorados. En su especificación, combina Nutrición, Entrenamiento y Antropometría con consentimiento contextual, versionado histórico y separación entre prescripción, ejecución y revisión. Las reglas concretas residen en 04/05/06/08/09; no nacen de este análisis de competencia.

La oportunidad que se propone validar es si ese recorrido integrado y explicable reduce la dispersión de información y facilita que el profesional reconstruya el fundamento de cada decisión. Es una hipótesis de producto. No se presenta como demanda comprobada, liderazgo competitivo ni conformidad legal certificada.

### 7.3. Qué falta para validar comercialmente

No hay en esta revisión una estimación defendible de TAM/SAM/SOM, ingresos, disposición a pagar o retención. Para obtenerla se propone, fuera del cierre estático de MESA-02, entrevistar profesionales del segmento definido en 02/03 y observar tareas con un prototipo autorizado. Registrar tarea, tiempo, errores de interpretación, pasos de reconstrucción y valoración cualitativa. Cualquier tamaño de muestra y resultado se informará cuando exista; no se inventan encuestas realizadas.

Para la tesis, el resultado demostrable será el sistema analizado, diseñado y verificado contra requisitos. El éxito académico no exige probar una superioridad comercial todavía no medida. El modelo SaaS B2B2C de BE-LEG-03 sigue siendo el encuadre de negocio; no se fijan aquí precios ni cobros reales.

### 7.4. Depuración respecto de v4

Se retiran las afirmaciones no respaldadas sobre saturación del mercado, imposibilidad de competir contra software gratuito, lanzamiento institucional fechado, obligatoriedad de digitalización y sincronización total sin control del titular. Tampoco se afirma que los competidores incumplan normativa o que no puedan incorporar versionado. No se sustituyen por nuevos hechos supuestos. Las conclusiones jurídicas permanecen bajo sus fuentes/políticas propietarias y revisión profesional correspondiente; esta comparación no audita cumplimiento.

## 8. Comparación con la competencia

### 8.1. Regla de lectura

Los cinco ejes se mantienen: control del titular por finalidad, multiprofesionalidad sin mezcla indebida, ausencia de diagnóstico automático, trazabilidad versionada y canales. **NE** significa «no establecido por las páginas oficiales consultadas para el criterio exacto»; no significa «el producto no lo tiene». Registrar seguimiento no demuestra inmutabilidad histórica; ofrecer permisos de equipo no demuestra ni refuta el modelo A3/B2 de BE. No se deducen capacidades negativas por silencio de una web comercial.

| Producto / fuente | Control del titular por finalidad, equivalente al criterio BE | Multiprofesionalidad y separación | Ausencia de diagnóstico automático como garantía | Versionado histórico inmutable y corrección aditiva | Canal documentado |
|---|---|---|---|---|---|
| Nutrium [S1] | NE | NE en esta página | NE | NE; consulta de mediciones no prueba versionado | App de cliente; interacción con el software profesional |
| Hexfit [S2] | NE | Seguimiento profesional anunciado; separación por finalidad NE | NE | NE; gráficos de progreso no prueban inmutabilidad | Plataforma profesional y app móvil anunciadas |
| NutriAdmin [S3] | NE | NE en el alcance de la guía | NE | NE | Portal de cliente accesible por navegador, también en smartphone |
| Healthie [S4] | NE para consentimiento revocable por finalidad bajo criterio BE | Care Teams y permisos por miembro documentados; equivalencia completa con BE NE | NE | NE en esta página | Gestión en plataforma y reservas con Care Teams en app móvil documentadas |
| Practice Better [S5] | NE | NE para el criterio exacto | NE | NE | Plataforma de gestión; el sitio presenta portal y app como funciones, sin prueba ejecutada aquí |
| BE — especificación 06/08/09 | A3 y B2 separados; autorización actual por operación | Alcances independientes y vista parcial autorizada | No diagnóstico ni score global según límites canónicos | Versiones emitidas inmutables y correcciones trazables | Website profesional/administrador y APK asesorado, objetivos de 07 |

### 8.2. Conclusión comparativa defendible

La documentación pública muestra solapamiento funcional, y al menos una alternativa describe colaboración con permisos. Por ello, BE no se presenta como «el único que integra» ni como el único que protege datos. Su aporte de tesis es hacer explícita y trazable una solución: cada permiso, estado, transición, versión, contrato y prueba debe poder justificarse desde un requisito. La diferencia será demostrada contra sus propios criterios de aceptación y tareas de uso, no inferida de celdas NE.

BE permanece especificado y en preparación de implementación. No se atribuyen a la plataforma usuarios, despliegue, métricas de éxito, APK operativa ni controles ya ensayados. Una comparación empírica futura requerirá cuentas de prueba autorizadas, configuración registrada y un protocolo igual para cada producto.

## Fuentes primarias y correspondencia de afirmaciones

| ID | Fuente y URL directa | Consulta | Pasaje/localizador verificable | Afirmación que sostiene y límite |
|---|---|---|---|---|
| S1 | [Nutrium — funciones de la app del cliente](https://help.nutrium.com/en/articles/3372169-what-are-the-features-of-the-nutrium-mobile-app-for-nutrition-clients) | 2026-09-13 | Lista de funciones después de “Once they log in”; configuración individual de funciones | Plan, mediciones y diarios de cliente; no acredita consentimiento BE ni inmutabilidad |
| S2 | [Hexfit — sitio oficial](https://www.myhexfit.com/en/) | 2026-09-13 | Program creation, Files management, Mobile app, Nutritional tracking | Oferta de programas, seguimiento, nutrición y móvil; no se utilizan cifras promocionales como resultados verificados |
| S3 | [NutriAdmin — introducción al portal del cliente](https://nutriadmin.com/docs/introduction-to-the-client-portal-in-nutriadmin/) | 2026-09-13 | Primeros dos párrafos; acceso mediante navegador en smartphone | Compartir planes/reportes/cuestionarios y completar diarios; no demuestra app nativa ni criterio BE de permisos |
| S4 | [Healthie — Care Teams](https://help.gethealthie.com/article/480-care-teams) | 2026-09-13 | Introducción; Care Team Member Settings; soporte de reservas en app | Varios proveedores por cliente y permisos por miembro; no valida todos los criterios del modelo BE |
| S5 | [Practice Better — sitio oficial](https://practicebetter.io/) | 2026-09-13 | Tools to scale your practice; integración That Clean Life; catálogo de funciones | Suite de práctica y planificación integrada declaradas; no se usan testimonios ni cifras de usuarios como evidencia de eficacia |

Fuentes de terceros o URL no verificadas de v4 no sustentan esta versión. Los cinco productos seleccionados no constituyen un ranking ni una recomendación de compra. No se mantuvieron citas HTML con índices de una conversación anterior.
