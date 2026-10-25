# Concurrencia al renovar los códigos de recuperación · pasada de cierre del 2026-10-25

**En criollo.** Generar códigos de recuperación nuevos tiene que dejar un solo juego que sirva y dejar sin valor los
anteriores. La sospecha de Dirección era esta: si llegan dos pedidos juntos, o si mientras uno espera el operador
restablece el segundo factor o se cierra la sesión, podían quedar dos juegos válidos, o salir códigos con un permiso que ya
no valía. **Se confirmó: pasaba.** Se corrigió con un cambio de pocas líneas en un solo método, sin migración ni cambio de
contrato, y quedan ocho pruebas que lo vigilan.

## 1. La hipótesis

En `regenerarCodigos` (API-ADM-09, `apps/api/src/administracion/acceso-administrativo.service.ts`), el guard comprueba
la sesión y el segundo factor antes de entrar al servicio. Después se comprueba la contraseña y, en una transacción, se
invalidan los códigos anteriores y se insertan los nuevos (`reemplazarCodigosDeRecuperacion`). En esa transacción no se
tomaba un bloqueo común que ordenara dos renovaciones, ni se volvía a leer el estado de la sesión.

En PostgreSQL, con lectura confirmada (`READ COMMITTED`), eso alcanza para el defecto. Si la segunda renovación ya estaba
esperando cuando la primera confirma, su `UPDATE` reevalúa solo las filas que esperaba (el lote viejo, ya invalidado), y no
ve el lote nuevo, que confirmó después de que empezó la sentencia. Entonces inserta su propio lote, y quedan dos.

## 2. Cómo se probó

- **Contra la base real:** PostgreSQL 16 local (un clúster propio de la sesión, en una base descartable), con la API
  completa (Nest) y el comando del operador. El comando se corre con la misma función que usa `comando.js`.
- **Sin pausas.** Una transacción de la prueba retiene una fila mientras llegan los pedidos: la identidad, los códigos
  vigentes u otra sesión. La suelta recién cuando `pg_stat_activity` informa que los pedidos quedaron esperando un
  bloqueo. El que espera primero sigue primero, así que cada prueba fija qué operación queda ordenada antes. Ninguna
  espera por tiempo decide un orden; el tope de 20 segundos solo hace que una prueba rota falle con un mensaje claro.
- **Sin secretos.** Ninguna aserción imprime un código: se comparan estados y cantidades. La primera prueba captura la
  salida de la API durante la carrera y lee la auditoría, y comprueba que ningún código, con o sin guiones, ni la
  contraseña aparezcan.
- **El archivo:** `test/integration/administracion-renovacion-de-codigos.int-spec.ts`, con ocho casos.

## 3. Lo que pasaba antes de la corrección (rama `wp-administracion` en `3520c47`): 8 de 8 fallan

| Caso | Lo que tiene que pasar | Lo que pasaba |
|---|---|---|
| Dos renovaciones simultáneas desde dos sesiones | Un lote (10 códigos). La segunda responde 401, porque la primera cerró su sesión | **Dos lotes vigentes (20 códigos)**: las dos respondieron 200 |
| Dos renovaciones simultáneas desde la misma sesión | Un lote: la segunda reemplaza a la primera | **Dos lotes vigentes (20 códigos)** |
| Primero el restablecimiento del operador, después la renovación que ya había pasado el guard | La renovación responde 401 y no emite nada | **Respondió 200 y entregó códigos**, con la sesión ya revocada |
| Primero la retirada del rol, después la renovación | Lo mismo | **Lo mismo: 200 con códigos** |
| Primero la renovación, después el restablecimiento | El restablecimiento invalida también el lote nuevo: 0 vigentes | **Quedaba vigente el lote nuevo (10 códigos)** |
| Primero la renovación, después la retirada | Lo mismo | **Lo mismo: 10 vigentes** |
| Primero el cierre de la propia sesión, después la renovación | La renovación responde 401 y el lote anterior sigue | **Respondió 200**, con la sesión ya cerrada |
| Primero la renovación, después el cierre de la sesión | El cierre espera a que la renovación confirme | **El cierre no esperaba**: nada ordenaba las dos operaciones |

En la primera versión de la prueba, los dos casos «primero la renovación, después el comando» pasaron. Pasaron por tiempo:
nada obligaba al comando a esperar a la renovación, y ganó la que llegó antes a su paso siguiente. La prueba se reforzó para
forzar ese orden: retiene otra sesión del administrador, que la renovación tiene que cerrar, y la deja a mitad de camino.
Desde ahí, sin la corrección, fallan siempre.

## 4. La corrección

Dentro de la transacción de `regenerarCodigos`, antes de tocar los códigos:

1. **La identidad, en modo exclusivo** (`SELECT … FROM identidad … FOR NO KEY UPDATE`, nuevo `tomarLaIdentidadEnExclusiva`).
   Choca con otra renovación, con el comando del operador (que toma la identidad igual) y con el modo compartido de
   configurar y confirmar el autenticador (API-ADM-07 y 08). Respeta el orden único de bloqueos del proyecto, que empieza
   por la identidad (`prisma/concurrencia.ts`), y su convención de `FOR NO KEY UPDATE`, que no frena las claves
   foráneas.
2. **La sesión y su segundo factor, otra vez, con la identidad tomada** (`estadoBloqueado`, el mismo de API-ADM-05 a 08).
   Una sesión revocada o cerrada mientras esperaba responde 401 `SESSION_REVOKED`, sin escribir nada. Un segundo factor
   que dejó de estar vigente responde 403 `MFA_REQUIRED`, auditado como en el guard. Las dos respuestas ya estaban en el
   contrato de API-ADM-09.

En el caso normal, sin carrera, la respuesta es la misma de antes.

## 5. Cada parte de la corrección tiene una prueba que la detecta (mutaciones)

| Mutación | Pruebas que fallan |
|---|---|
| M1 · sin tomar la identidad, con la relectura | 5 de 8: restablecimiento o retirada primero; renovación primero y después restablecimiento o retirada; cierre primero |
| M2 · con la identidad tomada, sin la relectura | 5 de 8: dos sesiones; restablecimiento o retirada primero; cierre primero; renovación y cierre |

Cada mutación se revirtió después de correrla. El caso «la misma sesión» falla sin las dos partes y pasa con cualquiera de
ellas: dos pedidos de la misma sesión ya quedan en fila por la fila del segundo factor de esa sesión.

## 6. Con la corrección

- Local: las 8 pruebas nuevas y las 33 de `administracion.int-spec.ts` (41 de 41), sobre una base recién migrada.
- La CI de la rama (con el chequeo de tipos y la integración completa) está en el PR #210.

## 7. Las garantías, una por una

| Garantía | Cómo queda | Dónde se ve |
|---|---|---|
| Como máximo un lote vigente | Dos renovaciones quedan una después de la otra; la segunda ve el lote de la primera y lo invalida, o ve su sesión cerrada | Casos 1 y 2 |
| Los códigos anteriores dejan de servir | Un código del lote anterior no abre una sesión; uno del lote nuevo, sí | Casos 1 y 2 |
| Una operación ordenada después de una revocación no emite códigos | Con la identidad tomada se vuelve a leer la sesión: revocada o cerrada, 401 sin escribir | Casos 1, 3, 4 y 7 |
| Si la renovación confirma primero, el restablecimiento o la retirada invalidan lo que corresponde | El comando espera la identidad y después ve el lote nuevo | Casos 5 y 6 |
| Sin secretos en registros ni respuestas de error | La auditoría guarda operación, resultado y motivo; la línea de log de cada pedido, ruta y estado (07 §41) | Caso 1 |

Los bloqueos son de PostgreSQL, no de la memoria de un proceso: las garantías valen igual con varias instancias de la API.

## 8. Lo que esta evidencia no cubre

- **Reemplazar el autenticador desde dos sesiones a la vez** (dos API-ADM-08 simultáneas, que exigen antes dos
  configuraciones también simultáneas). Se revisó leyendo el código, no con una carrera. Cada confirmación toma la
  identidad en modo compartido, su autenticador pendiente y la fila de su sesión, y cierra las otras sesiones. En el
  cruce peor, PostgreSQL detecta un interbloqueo y corta una; `conReintento` la repite y, al repetirse, ve su sesión
  cerrada. Queda como mejora una prueba de carrera para ese caso.
- **Dos pestañas de la misma sesión:** las dos renovaciones responden 200 y vale solo el lote de la que quedó después. La
  consola no manda dos veces desde la misma pantalla (`enviando`), pero dos pestañas podrían mostrar lotes distintos.
- No es una prueba de carga ni una demostración formal. Que la CI pase no es una garantía absoluta de seguridad.
