# Matriz de estado reconciliada · 2026-10-23

**Base que se tomó:**
- `main` = `0fb1bff` (2026-10-20 02:22 -03).
- El ambiente `test` corre ese commit: la API (`/health/ready`: aplicación 0.11.1, construida el 2026-10-20 05:33 UTC) y el website (el pie dice `0fb1bff`).
- **APK estable:** 0.13.2 (`be-apk-0.13.2`, `4b49d43`, 2026-10-03), la que marca `releases/latest`.
- **APK candidata:** 0.17.0-candidata.3 (`be-apk-0.17.0-candidata.3`, `cf55288`, 2026-10-19), prerelease. Se construyó desde `4091d5e` más la versión, no desde `main`.
- Comprobado de nuevo al cierre, el 2026-10-24: `main` sigue en `0fb1bff`.

**Cómo se reconcilió:**
- Se contrastaron `main`, las ramas remotas y locales, los PR abiertos, las releases y el ambiente.
- El código se leyó en `0fb1bff`. No se dio por vigente un pendiente por estar en un documento viejo, ni por hecha una propuesta por tener PR.
- Las operaciones P0 se contaron por ID contra el inventario del 09 (`docs/legajo/09_AUX/INVENTARIO_API_P0_…_122_OPERACIONES`): hay 18 sin operación en el contrato.
- Las ramas locales: solo dos tienen contenido sin publicar, `wp-exportar-mis-datos` y `mesa/auditoria-v1`. Las de los agentes ya están en `main`.

**Cómo leer las columnas:**
- **Implementación:**
  - **integrado:** en `main`;
  - **preparado en PR:** con su número;
  - **parcial;**
  - **propuesta:** escrita, sin código;
  - **no encontrado:** se buscó y no aparece; puede existir afuera del repositorio;
  - **no existe:** se comprobó que no está.
- **Verificación:**
  - **automática:** la CI o pruebas locales;
  - **manual:** una persona en el website;
  - **teléfono:** una APK en un teléfono;
  - **remoto:** contra el ambiente `test`;
  - **sin comprobar.**
- Una verificación automática no es una validación de utilidad: ninguna fila está probada con profesionales.

## Lo de este encargo

| Capacidad o pendiente | Implementación | Verificación | Referencia | Siguiente acción |
|---|---|---|---|---|
| El número de Nutrición dice qué representa y qué falta registrar del plan (UX-01) | Preparado en PR | Automática: dominio 848/848 en local; en la CI de #200 (`a81ada6`), integración 824/824 y recorridos 13/13, con el nuevo `completitud`. Sin comprobar con profesionales | #200 (`wp-nutricion-cobertura`, `a81ada6`) · DL-153 | Decidir D-1 a D-4; integrar en el orden de `LEEME.md` |
| Una revisión registrada dice en qué evidencia se apoyó (UX-02) | Preparado en PR, apilado sobre #200 | Automática: dominio 853/853 en local; en la CI de #203 (`1cc6593`), integración 829/829 y recorridos 14/14, con el nuevo `evidencia`; en #204, 851/851 y 14/14. Sin comprobar con profesionales | #203 (`wp-revision-evidencia`, `1cc6593`) · DL-154 | Decidir D-1 a D-3; integrar después de #200 |
| La sustitución de ejercicios vuelve a la APK | Preparado en PR, al día con main el 2026-10-23 | Automática: 82 pruebas de la APK en local; en la CI de #195 (`294e1a8`), integración 826/826 y recorridos 12/12 (en una de las dos corridas, 11/12 por el intermitente); en #204, junto con lo demás. **Teléfono: sin comprobar** | #195 (`wp-apk-sustitucion`, `294e1a8`) · DL-151 | Ratificar R-1 a R-6; nueva candidata desde la integración; probarla en el teléfono |
| Las APK publicadas siguen leyendo la API (compatibilidad) | Preparado en PR, al día con main | Automática: en la CI de #198 (`0c96901`), integración 842/842; en #204 (`f64083b`), las respuestas de las 44 operaciones que llama la 0.13.2 y de las 80 que llama la candidata.3 pasan con lo congelado, contra la API combinada | #198 (`wp-compatibilidad-apk`, `0c96901`) · DL-152 | Integrar antes que cualquier cambio de respuestas que lean las APK |
| La auditoría de dependencias frena la CI de toda rama | Preparado en PR: #201, las correcciones. #202, la propuesta de excepción, **sin decidir** | Automática: en la CI de #201 (`1d7bb08`), integración 823/823, recorridos 12/12 y todo `verificar` en verde salvo la auditoría de la APK (el zod 3 de la CLI de Expo). Con #202, la auditoría aprueba en los tres espacios: comprobado en local en `916cb05`, porque la CI no corre en una rama apilada sobre otra | #201 (`1d7bb08`), #202 (`916cb05`) · DL-114, adenda del 2026-10-23 | Decidir #202. Revisar node-forge antes del 2026-10-31 (sigue sin corrección; braces ya no aparece) |
| La combinación, probada junta | Rama de prueba, no se integra | Automática: la CI de #204 en `f64083b` (corrida 40058651719): integración 851/851 en 64 suites, recorridos 14/14, imagen y legajo en verde; `verificar`, en verde salvo la auditoría de la APK | #204 (`wp-integracion-2026-10-23`) | Ninguna: se integra cada PR por su lado |
| El recorrido `faltaUnaParte` de la CI falla a veces | Integrado (es una prueba) | Automática: falló en una de las dos corridas de #195 (40047106407, 11/12, sin cambios de website) y de #200 (40051923458, 12/13); pasó en la otra, y en #198, #201, #203 y #204 | Artefacto `resultados-recorridos` de la corrida 40051923458: dos pedidos que no son la falla simulada no llegan a la API | Ver la recomendación 2 de `LEEME.md` |

## Plataforma, cuenta y vínculos

| Capacidad o pendiente | Implementación | Verificación | Referencia | Siguiente acción |
|---|---|---|---|---|
| Alta, ingreso y mayoría de edad en toda alta | Integrado | Automática; remoto; teléfono (alta con Google en la candidata.2, por Dirección, 17/10) | #176 · DL-138 | — |
| La sesión del website sobrevive a una recarga | Integrado | Automática (recorrido `sesion`). Remoto en Chrome, Edge y Firefox: **sin comprobar**. Safari, sin CHIPS: vuelve a pedir el ingreso | #186 · DL-147 | Probar en `test` con los tres navegadores (guion, parte web) |
| Invitación por enlace, QR o código | Integrado | Automática; teléfono (QR y enlace, candidata.2, 17/10) | #171 a #173 · DL-136 | — |
| Aceptar un vínculo es un solo recorrido, con el paso de datos de salud | Integrado | Automática. Teléfono: en la candidata.3, **sin comprobar** | #181 · DL-143 | Probar en el teléfono |
| Consentimiento por área, corte prospectivo al revocar | Integrado | Automática (también el recorrido `accesoRevocado`) | WP-03 · 08 §14 | — |
| Administración: habilitar, observar, suspender y restablecer profesionales por área | **Parcial:** el modelo de datos y las transiciones existen; lo opera un servicio interno (DL-036). El rol administrador, sus pantallas, API-PRO-01 a 13 y el MFA **no existen** | Automática, de lo interno (el PDP deniega por alcance no verificado, suspendido o retirado) | `apps/api/src/profesional/verificacion.service.ts` · `prisma/schema.prisma` (`VerificacionProfesional`, `Habilitacion`, `EventoDeVerificacion`) · DL-036 · DL-020 | Registrado como el próximo paquete: `docs/paquetes/WP-ADMINISTRACION.md` |
| Suspender y restablecer una cuenta | Parcial: solo el servicio interno | Automática, de la regla | DL-020 | Entra en WP-ADMINISTRACION |
| Exportar los datos de la persona | **No encontrado** en `main` ni en las ramas remotas. Hay una propuesta (la definición del paquete) en la rama **local** `wp-exportar-mis-datos` (`aae3584`, 2026-10-16), sin publicar | Sin comprobar | DL-021 · DL-142 (en esa rama) · PRIV-02 de la auditoría | Publicar esa definición como borrador o descartarla: hoy solo está en esta máquina |

## Nutrición, Entrenamiento y Antropometría

| Capacidad o pendiente | Implementación | Verificación | Referencia | Siguiente acción |
|---|---|---|---|---|
| Plan nutricional con versiones, recetas con foto y registro v2 de comidas | Integrado | Automática. Teléfono: la 0.15.0-candidata.1 (7 y 8/10), con la foto corregida después (#151); la candidata.3, **sin comprobar** | #147, #151 · DL-121 | Probar en el teléfono |
| Catálogo base de alimentos y ejercicios, con su origen | Integrado | Automática; remoto (en `test` desde `0fb1bff`) | #180, #184, #185, #189 · DL-141 | — |
| Recetas de ejemplo | Integrada la herramienta; **las recetas no están cargadas** en `test` | Automática (16 preparadas, 16 verificadas contra `test`, el 19/10) | #192 | Cargarlas necesita tu autorización |
| Sesión de entrenamiento por serie, con tiempos | Integrado | Automática. Teléfono: **sin comprobar** con la candidata.3 | #149 · DL-122 a DL-124 | Probar en el teléfono |
| Días de entrenamiento («Hoy», saltear, avisos) | Integrado | Automática. Teléfono: **sin comprobar** | #174, #175 · DL-137 | Probar en el teléfono |
| Toma antropométrica sobre la figura y 40 métodos | Integrado | Automática; teléfono parcial (las candidatas 0.14 y 0.15, del 5 al 8/10) | #126, #128, #131 · DL-111 a DL-113 | Ratificar DL-111 a DL-113; TalkBack sigue sin probar |

## Seguimiento profesional

| Capacidad o pendiente | Implementación | Verificación | Referencia | Siguiente acción |
|---|---|---|---|---|
| Escritorio por áreas (Resumen, Línea de tiempo, Analizar, Preparar revisión) | Integrado | Automática (recorridos); manual (Dirección revisó la crítica de diseño y la aprobó el 15/10) | #153 a #159 | — |
| Novedades y avisos | Integrado. Push con Firebase en la candidata.2 y la .3 | Automática. Teléfono: **no se recibió ningún aviso todavía** | #163 · DL-133 | Probar un aviso en el teléfono |
| La persona lee sus revisiones (REV-A) | Integrado; en la APK desde la 0.16.0-candidata.1 | Automática; teléfono **sin comprobar** con la .3 | #164 · DL-134 | Probar en el teléfono |
| Notas de coordinación | Integrado | Automática | #178 · DL-140 | — |
| TVCC-30 | Integrado (cálculo interno, sin HTTP) | Automática | #167, #169 · DL-135 | Ratificar D-1 a D-9 |
| Proyecciones que faltan del 09 (PRJ-02, PRJ-03) y tablero (DSH-01, 02 y 05) | No existen como operación | — | Conteo por ID (18 P0 sin operación, con las 13 PRO) | Fuera del alcance de hoy |

## Calidad, operación y entrega

| Capacidad o pendiente | Implementación | Verificación | Referencia | Siguiente acción |
|---|---|---|---|---|
| Recorridos de navegador en la CI | Integrado (12 recorridos; 14 con los de #200 y #203) | Automática | #191 · DL-150 · `test/navegador/LEEME.md` | El intermitente, arriba |
| Excepciones de la auditoría (node-forge, braces) | Integrado; **vencen el 2026-10-31** | Automática | DL-114 | Revisarlas antes del 31/10 (adenda en #202) |
| APK estable 0.13.2 | Publicada | Teléfono (3/10) | `docs/DESPLIEGUE.md` | No promover la candidata sin la sustitución y la prueba completa (DL-152) |
| APK 0.17.0-candidata.3 | Publicada como prerelease | Teléfono: parcial (Google e invitación, con la .2); entera, **sin comprobar** | `be-apk-0.17.0-candidata.3` | Una candidata nueva desde la integración |
| Tesis v1 | Preparado en PR (documental) | Revisión propia; sin tutor | #199 · `docs/mesa/TESIS/` | Lo que completa Dirección (`INFORME.md`) |
| Auditoría del 21/10 | Rama **local** `mesa/auditoria-v1` (`c43c4b5`), sin publicar | — | Informe y registro en esa rama | Decidir si se publica |
| Otros PR abiertos | #193, las ampliaciones A a F (solo documentación, 20/10): **propuesta** abierta, que este encargo no toca (punto 8). #144 y #145 (DL-117, 4/10): su contenido ya estaba en `main` por #146; **se cerraron el 2026-10-24**, con un comentario | Comprobado: sus cabezas son ancestros de `main` | `git merge-base --is-ancestor` | Decidir #193 cuando toque |
