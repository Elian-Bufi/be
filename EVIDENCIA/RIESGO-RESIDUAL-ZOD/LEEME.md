# Riesgo residual de zod 4.6.6: las colecciones que validan entradas externas (2026-10-24)

**Qué se pidió.** Una comprobación puntual, no una auditoría general. El mantenedor de zod explica que la 4.6.6 protege
contra entradas demasiado grandes cuando hay límites explícitos, pero que las colecciones sin límite siguen siendo un
problema. Se buscaron las colecciones de los contratos de BE que validan datos no confiables sin un límite efectivo.

**Resultado.** Había una vía concreta, y quedó corregida en `apps/api/src/http/validacion.ts`, con pruebas de regresión.
No es una colección sin tope: son listas con tope que, anidadas, se multiplican.

## Qué cambia zod 4.6.6

El arreglo es `capSize` (`zod/src/v4/core/schemas.ts`):
- **Dónde corta.** En `z.array`, `z.map` y `z.set`, si la entrada pasa el tope declarado, falla antes de validar ningún
  elemento.
- **Qué cuenta como tope.** Solo los controles de tamaño que van **primero**: `.max()`, `.length()` (`util.sizeCaps`). Un
  `.max()` después de un `.refine()` no corta antes.
- **Qué no cubre.**
  - `z.record`, las tuplas con resto y los objetos con `catchall`.
  - Cualquier lista que no pase su propio tope. Ahí zod sigue juntando un error por cada elemento que falla.

## Qué se revisó

| Origen | Qué hay | Conclusión |
|---|---|---|
| **Cuerpos de pedido de la API** (expuestos) | 79 esquemas distintos: los que recibe `validarCuerpo` por nombre, los del ejecutor (`esquema:`) y las 3 transiciones de vínculo. Tienen 104 colecciones, todas listas, y todas con un tope que zod aplica antes. No hay registros, mapas, conjuntos, tuplas con resto ni topes tardíos | **Vía concreta:** las listas anidadas (ver abajo) |
| Parámetros de consulta | Escalares, validados uno por uno (`paginacion.ts`, `busqueda.ts`, `cartera.controller.ts`, `consultas.ts`). Los parámetros que sobran se rechazan (`sinParametrosDeQuery`) | Sin amplificación |
| Validaciones internas | La configuración de vistas leída de la base (`vistas.service.ts`), el tipo de imagen de una cabecera (`medios.service.ts`) y los datos de alta guardados (`cuenta-propia.service.ts`) | Origen propio, ya validado al guardarse |
| Respuestas de terceros | Open Food Facts, wger, el JWKS de Google y Expo. Se normalizan a mano, sin zod, y las de los proveedores se cortan a 2 MB (`proveedor-http.ts`) | Fuera de esta pregunta |
| Lo que la API manda a la APK y al website | El cliente compartido valida cada respuesta con zod (`cliente-http.ts`) | Origen propio, por HTTPS. Para aprovecharlo hace falta controlar la API |

La lista de esquemas sale del código de la API. La reproduce `validacion.spec.ts`, que además falla si aparece otra
forma de llamar a `validarCuerpo`.

## La vía concreta

- **Las listas anidadas se multiplican.** Ocho esquemas son los planes y plantillas de Nutrición y de Entrenamiento:
  `CrearPlanRequestSchema`, `EditarBorradorRequestSchema`, `CrearPlantillaNutricionalRequestSchema`,
  `NuevaVersionDePlantillaNutricionalRequestSchema`, `CrearPlanDeEntrenamientoRequestSchema`,
  `EditarPlanDeEntrenamientoRequestSchema`, `CrearPlantillaDeEntrenamientoRequestSchema` y
  `NuevaVersionDePlantillaRequestSchema`.
  - Tienen un tope por nivel: días 7 × comidas 12 × opciones 12 × ítems 40, y en Entrenamiento, bloques 12 × microciclos
    26 × sesiones 14 × prescripciones 40.
  - El producto pasa de 40.000 elementos. Dentro de 16 KB entran 4.800 ítems `{}` (3 caracteres cada uno), y cada uno da 3
    errores.
  - `GuardarComidaHabitualRequestSchema` y `GuardarSesionHabitualRequestSchema` llegan a unos 1.000 o 1.500 errores. El
    resto de los esquemas, a 600 o menos.
- **Qué costaba un pedido.** El peor cuerpo de 16 KB para API-NUT-07 daba:
  - 14.542 errores de zod y una respuesta de 1,4 MB con todos;
  - unos 16 MB asignados y entre 113 y 145 ms de CPU, contra 0,5 ms de un pedido normal con un error.

  Zod se lleva la mayor parte: acumular los errores lleva unos 57 ms y finalizarlos unos 22. Armar la respuesta suma el
  resto.
- **Quién llegaba:**
  - **cualquier cuenta**, y el alta es abierta, también como profesional (`RegistrationIntentSchema`);
  - el ejecutor valida el cuerpo antes de autorizar con la PDP y antes de exigir la `Idempotency-Key`
    (`plataforma/ejecutor.ts`), así que alcanza con mandarlo, con un `adviseeId` cualquiera;
  - las escrituras no tienen límite por actor: `consultaProtegida` cubre solo los `GET`.
- **Por qué 16 KB no alcanza.** El límite acota los bytes, no los errores por byte. Con `{}` hay un error por byte. Con
  respuestas de 1,4 MB, un cliente que no lee obliga a guardarlas en memoria; eso no se verificó detrás del proxy de
  Render.

## La corrección

`apps/api/src/http/validacion.ts` y `apps/api/src/http/cota-de-elementos.ts`. Solo la API: el dominio, los contratos y
el OpenAPI no cambian.

1. **Antes de zod, se cuentan los elementos de las listas del cuerpo** (`superaElementos`), y la cuenta se corta apenas
   pasa el máximo.
   - **El máximo** sale de `cotaDeElementos(esquema, caracteres)`: cuántos elementos puede tener un cuerpo **válido** de
     ese esquema y de ese tamaño.
   - **Cómo se calcula.** Cada elemento válido ocupa al menos sus bytes propios: sus campos obligatorios con el valor más
     corto que el esquema acepta, y sus listas internas vacías. Esos bytes no se comparten, y se llenan primero los
     elementos más baratos, hasta el tope de su camino.
   - **Los límites del máximo.** Va entre un piso de 64 y un techo de 1.500. La mayor cota de los 79 esquemas, a 16 KB,
     es 1.024 (`EditarPlanDeEntrenamientoRequestSchema`).
   - **Si se pasa**, la respuesta es 400 INVALID_REQUEST con un solo issue `{ code: 'TOO_BIG', path: '(body)' }`, sin
     validar elemento por elemento.
2. **Se informan como mucho 20 issues**, los primeros en el orden de zod. Los campos no declarados siguen teniendo
   prioridad, como siempre.

**Lo que no cambia para los clientes:**
- La forma de la respuesta es la misma.
- `ValidationIssue.code` es un texto libre, y `TOO_BIG` ya era un código posible de zod.
- El cliente compartido lee `details.issues` tal cual.
- Un cuerpo chico con una lista donde no va (`roles: ['ADMIN']`) sigue recibiendo su UNKNOWN_FIELD: el piso lo deja
  pasar a zod.

## Antes y después

Medido con la función real (`validacion.ts` y `errores.ts` transpilados), el dominio con zod 4.6.6 y Node 22.23.2. Es
una máquina con poca memoria libre: los tiempos absolutos varían de una corrida a otra, y lo que importa es la
proporción.

| Cuerpo para API-NUT-07 | Antes | Ahora |
|---|---|---|
| El peor de 16 KB (4.800 ítems `{}`) | 113 a 145 ms · respuesta de 1.440 KB · 14.542 errores | 1,3 ms · 0,1 KB · un `TOO_BIG` |
| Denso y chico (1.440 ítems en 4,8 KB) | 43 a 57 ms · 432 KB · 4.364 errores | 0,5 ms · 0,1 KB · un `TOO_BIG` |
| **El peor que la cota deja pasar**: un texto relleno hasta 16 KB y 632 ítems `{}` | 15 ms · 190 KB · 1.917 errores | **11 ms · 2 KB · 20 errores informados** |
| Un pedido normal con un error | 0,5 ms | 0,5 ms |

## Pruebas

`apps/api/src/http/validacion.spec.ts`, 12 pruebas:
- **La reproducción:** sin el corte, el peor plan de 16 KB da más de 14.000 errores.
- **Los rechazos:**
  - el peor plan de Nutrición y el de Entrenamiento se rechazan con un solo `TOO_BIG`, sin llamar a `safeParse`;
  - un cuerpo chico pero denso también se rechaza, porque la cota depende del tamaño.
- **Lo que se informa:**
  - dentro de la cota se informan los primeros 20 errores, en el orden de zod;
  - la prioridad de UNKNOWN_FIELD se mantiene, también acotada;
  - `roles: ['ADMIN']` sigue siendo UNKNOWN_FIELD.
- **La cota no deja afuera cuerpos válidos:**
  - nunca da menos que el máximo verdadero en esquemas donde se lo conoce: números, objetos, campos opcionales y con
    valor por defecto, URL, listas anidadas y registros;
  - cada largo mínimo de formato tiene un ejemplo válido que zod acepta;
  - para los 79 esquemas de entrada, un cuerpo válido de 16 KB no llega al techo, y la prueba falla si cambia el límite
    de `bootstrap.ts`.
- **El conteo:** suma las listas anidadas, también las que están dentro de objetos, y no se queda sin pila con 20.000
  niveles.

**Mutaciones.** Se desactivó cada parte de la corrección y de la cota, una por vez: 12 de 12 hicieron fallar al menos
una prueba. Dos de ellas encontraron defectos de la cota antes del commit:
- contaba como obligatorios los campos con valor por defecto, porque zod 4.6.6 los marca `optin: "defaulted"`;
- no leía el formato de `z.uuid()` y los demás, que va en la definición del esquema.

**En local:**
- `npm run typecheck -w @be/api`, en verde;
- `npm run test -w @be/api`: 147 de 147, en 18 suites.

## Límites de esta conclusión

- **Lo que queda.** El peor cuerpo que la cota deja pasar sigue costando unos 11 ms en Nutrición, medido. En
  Entrenamiento la cota es más alta (hasta 1.024 elementos), y el peor ronda los 3.000 errores; eso es una estimación, no
  una medición.
- **La repetición.** Sin un límite de escrituras por actor, alguien puede repetir el pedido. Ver la recomendación.
- **La memoria de las respuestas retenidas,** con un cliente que no lee, no se midió en Render. Con 2 KB por respuesta
  deja de importar.
- **La cota lee la definición interna de zod 4** (`_zod.def`). `validacion.spec.ts` la ata: actualizar zod tiene que
  pasar esas pruebas.
- **No se revisó** la validación de dominio que corre después de autorizar: los 422 de planes, plantillas y habituales,
  que ya trabajan sobre un cuerpo validado.

## Recomendación

1. **Integrar esta corrección después de #201 y #202.** Va apilada sobre #202 para que su CI quede completa en verde. En
   contenido no depende de ellas: toca solo `apps/api/src/http/`.
2. **Un límite de escrituras por actor**, con el limitador que ya existe (`limitador.consumir`). Es lo único que acota
   cuántas veces se repite un pedido caro. Las cifras son de Dirección, porque el editor guarda borradores a menudo.
3. **Opcional:** autorizar antes de validar el cuerpo en las operaciones de profesional. Es un cambio del ejecutor, no
   localizado.
