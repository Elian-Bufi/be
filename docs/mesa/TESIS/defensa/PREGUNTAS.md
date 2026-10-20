# Preguntas probables de la mesa, con su respaldo

Cada respuesta es corta y dice dónde está la prueba: el apartado o anexo de la tesis, el archivo del código o la decisión
registrada (DL) que la sostiene. Cuando algo no está hecho o no está probado, la respuesta lo dice primero. Versión de
referencia: `main` `0fb1bff`.

## Producto y alcance

**1. ¿Qué problema resuelve BE y para quién?**
El seguimiento de una persona por profesionales de nutrición, entrenamiento y antropometría, que hoy se reparte entre
planillas, mensajes y fotos sin historia ni control de quién ve qué. BE da al profesional un espacio de trabajo en el
website y al asesorado una APK, sobre una misma historia que no se pisa.
*Respaldo:* apartado 2 (problema, público objetivo, uso previsto).

**2. ¿Qué no hace BE?**
No diagnostica, no puntúa personas, no arma planes por su cuenta y no calcula qué comer a partir de una foto. Las
decisiones son del profesional; BE las registra y las hace cumplir.
*Respaldo:* apartado 2 (límites); C-01 (la comida diferente queda «sin calcular»).

**3. ¿Qué quedó fuera de esta entrega?**
Fuera de alcance, por decisión de Dirección: la verificación de profesionales y de su capacidad (RF-008 a RF-014 y
RF-067; los profesionales de la demo se habilitan con un servicio interno, DL-036) y la recuperación del acceso
(RF-005). Aprobados y sin construir: las incidencias administrativas (RF-068), que dependen del administrador previsto
por el legajo, y la publicación de servicios antropométricos (RF-051). En parte: vincular métodos de acceso (RF-004:
solo Google a una cuenta con contraseña), el perfil propio (RF-017: un solo campo aprobado), la sustitución de
ejercicios en la candidata (RF-043, DL-151) y la capacidad del profesional, que existe pero no se configura desde una
pantalla (RF-066). Del contrato P0 faltan cinco operaciones: DSH-01, 02 y 05 (cubiertas en parte por la cartera, la
ficha y «Mi evolución») y PRJ-02 y 03.
*Respaldo:* apartado 3 (brechas); anexo K (K1 y K4).

## Privacidad y seguridad

**4. ¿Quién puede ver los datos de salud de una persona?**
Solo un profesional con un vínculo aceptado para esa área y con el consentimiento vigente del asesorado, más el
tratamiento de datos de salud (A3) aceptado. Lo decide el punto único de decisión de autorización (PDP), igual para el website y la
APK, dentro de la misma transacción que la operación, y cada decisión queda registrada.
*Respaldo:* apartado 7 (CL-02), anexo E (E-01); `apps/api/src/autorizacion/pdp.service.ts`.

**5. ¿Qué pasa si el asesorado revoca el consentimiento?**
La operación siguiente del profesional se deniega con el mismo 404 que si el recurso no existiera, y la decisión se
registra. Lo anterior no se borra: la revocación corta hacia adelante. El asesorado puede volver a otorgarlo.
*Respaldo:* anexo E (E-04, consentimiento); demo, paso 8 del apartado 11.

**6. ¿Por qué un 404 y no un 403?**
Para no revelar que el recurso existe. Un 403 le diría a quien no tiene acceso que ahí hay algo de esa persona.
*Respaldo:* `apps/api/src/plataforma/ejecutor.ts` (`noRevelable`).

**7. ¿Cómo se guardan las contraseñas y las sesiones?**
Las contraseñas con bcrypt (costo 10 como mínimo), nunca en claro ni en los registros; un intento con un correo
inexistente hace igual una verificación, así el tiempo de respuesta no lo delata. El token es un JWT corto que solo
identifica la fila de la sesión: la API vuelve a la base en cada pedido, así una sesión cerrada o revocada deja de
servir enseguida.
*Respaldo:* `apps/api/src/plataforma/credenciales.service.ts`, `apps/api/src/sesion/tokens.service.ts`, DL-012.

**8. ¿Cómo sobrevive la sesión del website a una recarga sin guardar el token en el navegador?**
Con una cookie de la API, HttpOnly, Secure, SameSite=None y particionada (CHIPS), que solo sirve para pedir un token
nuevo de la misma sesión; el token vive en la memoria de la pestaña. Cada uso rota el secreto, y una copia vieja revoca
la sesión. Se verificó en test el 2026-10-20 con Chrome (15 de 15) y Edge (13 de 13); Safari y Firefox no se probaron.
*Respaldo:* anexo E (E-02); DL-147; anexo K (K15).

**9. ¿Los avisos push exponen datos de salud?**
No. El aviso dice que hay una novedad, no qué pasó; el contenido se ve al abrir la app con sesión. Además, el aviso sale
después de confirmar la operación, fuera de la transacción: si Expo Push falla, la novedad ya está guardada. Todavía no
se verificó un aviso recibido en un teléfono real.
*Respaldo:* anexo E (E-01); `apps/api/src/novedades/despachador.ts`; anexo K (K14).

**10. ¿BE cumple la Ley 25.326 de protección de datos personales?**
El legajo no lo afirma, y esta tesis tampoco. El diseño toma como restricciones el marco normativo vigente (los datos de
salud son sensibles: consentimiento expreso, deber de seguridad, confidencialidad), pero la conformidad real exige
organización, contratos, proveedores, políticas y asesoramiento jurídico, que no son parte de un trabajo académico.
*Respaldo:* `docs/legajo/08_BE_LEG_08_v0.1.5.md`, declaración de conformidad.

## Arquitectura

**11. ¿Por qué un monolito modular y no microservicios?**
Porque una operación de salud tiene que ser completa o no ocurrir: la autorización, el cambio, la novedad y la
auditoría van en una sola transacción local. Con microservicios harían falta sagas o commit en dos fases, más
complejidad sin beneficio para este tamaño. Los módulos están separados por dominio (22) y podrían separarse si hiciera
falta.
*Respaldo:* anexo H (ADR-01); apartado 8 (ARQ-02); apartado 9.

**12. ¿Qué pasa si el mismo pedido llega dos veces (doble toque, reintento de red)?**
Cada escritura lleva una clave de idempotencia: la primera vez se ejecuta; un reintento con la misma clave vuelve a
pasar por el PDP y recibe la respuesta guardada, sin escribir de nuevo.
*Respaldo:* anexo E (E-01); `apps/api/src/plataforma/idempotencia.service.ts`.

**13. ¿Y si dos personas editan lo mismo a la vez?**
Concurrencia optimista: cada escritura dice qué versión espera y, si cambió, responde 409. La base agrega 34 índices
únicos parciales como defensa final (por ejemplo, un solo proceso abierto por profesional, asesorado y área).
*Respaldo:* anexo H (ADR-07); apartado 6 (índices); DL-148 (borradores entre pestañas).

**14. ¿Por qué Render y no AWS?**
Para la etapa de prueba alcanzaba y es más simple de operar. La arquitectura es portable: una imagen Docker y
PostgreSQL estándar; hasta las fotos se guardan en la base (DL-120), sin almacenamiento propietario.
*Respaldo:* anexo H (ADR-05); apartado 8 (ARQ-03).

**15. ¿Por qué la APK no está en Google Play?**
Por decisión de diseño para esta etapa: se distribuye directamente, como release de GitHub con su huella SHA-256. Hay
28 versiones publicadas; la estable es la 0.13.2.
*Respaldo:* anexo H (ADR-06 y evolución).

## Datos

**16. ¿Por qué nada se borra?**
Porque es información de salud y de un seguimiento profesional: hay que poder reconstruir qué se sabía y qué se decidió
en cada momento. Corregir y anular agregan registros; las 212 claves foráneas son RESTRICT y los disparadores impiden
modificar lo emitido.
*Respaldo:* anexo H (ADR-03); apartado 6 (lo que garantiza la base).

**17. ¿Cuántas tablas tiene la base y cómo se organizan?**
113 tablas en 14 vistas por dominio, con 78 enumeraciones, 212 claves foráneas, 125 índices únicos (34 parciales), 134
restricciones CHECK y 275 disparadores. Las cifras salen del catálogo de PostgreSQL con las 51 migraciones aplicadas.
*Respaldo:* apartado 6 (DER-00 a DER-14); anexo G (diccionario).

## Calidad y pruebas

**18. ¿Cómo saben que funciona?**
De los 59 casos de prueba diseñados, 42 pasan en la CI, 9 pasan en parte y 8 no son ejecutables con lo que se entrega.
La CI de la versión de referencia corre 832 pruebas de dominio, 823 de integración contra PostgreSQL y 12 recorridos
de navegador, todo en verde. Además, se verificaron en test la sesión, los borradores y las recetas el 2026-10-20.
*Respaldo:* apartado 5; anexo F (trazabilidad).

**19. ¿Qué falta probar?**
La candidata 0.17.0 entera en el teléfono, un aviso push recibido en un teléfono real, TalkBack, Safari y Firefox. Y
hay una regresión conocida: la candidata no ofrece sustituir un ejercicio durante la sesión (la 0.13.2 sí); el
arreglo está en un PR en borrador. Por eso la candidata no se promovió a estable.
*Respaldo:* apartado 5 (lo que queda por probar); anexo K (K1, K14, K15).

**20. ¿Qué es la TVCC-30?**
La métrica de validación de la tesis: de los ciclos de seguimiento que vencieron en una ventana de 30 días, cuántos
tuvieron una revisión profesional aplicada antes del corte. No es retención ni resultado de salud. Sobre la cohorte
sintética local, el 2026-10-16, dio 5 de 7 (71,4 %): es una demostración del cálculo, no una medición del servicio.
*Respaldo:* RF-058, DL-135; `EVIDENCIA/TVCC-30/LEEME.md`; anexo D (proceso 8).

## Método

**21. ¿Cómo se trabajó y quién hizo qué?**
Con un legajo como fuente de verdad y paquetes de trabajo cortos, cada uno con su pull request y su CI en verde. Cada
diferencia entre el legajo y lo posible se registró como una decisión (DL) con opciones y la elección de Dirección.
Dirección definió el alcance, aprobó las etapas e integró los cambios; la implementación, las pruebas y la
documentación técnica se hicieron con asistentes de IA bajo esa dirección, y está declarado.
*Respaldo:* apartado 2 (roles); `docs/DEUDA_LEGAJO.md`.

**22. ¿Qué cambiarían si empezaran de nuevo?**
Probar en el teléfono antes y más seguido (la regresión de la sustitución se habría visto antes), y llevar el registro
de decisiones al día con cada integración (anexo K, K5 y K18).
*Respaldo:* anexo K.
