# Ampliación de las recetas de ejemplo · 50 recetas nuevas

Encargo nocturno de Dirección del 2026-10-28 («50 recetas nuevas, fotografías y cierre técnico»), §6 a §10. Commit de
referencia del código y del catálogo: `main` en `e4512cb`.

## En una línea

50 recetas nuevas de cocina familiar argentina, con cantidades en gramos y estados resueltos contra el catálogo de BE.
Se suman a las 16 originales, que no se tocan: **66 en total**. **Ninguna tiene foto todavía:** esta sesión no tenía con
qué generarlas (ver `EVIDENCIA/RECETAS-AMPLIACION/`).

## En qué nivel están

| Nivel | Estado |
|---|---|
| **Lista para cargar** | **Sí, las 50**. `cargar.mjs preparar` lo comprueba sin red, y la prueba de contenido (`scripts/recetas-ampliacion.test.mjs`) también |
| **Cargada en una base efímera** | La comprueba la prueba de integración `test/integration/recetas-ampliacion.int-spec.ts` en la CI: la herramienta real contra la API, con una cuenta sintética, cortes y reanudación. El resultado está en la nota del encargo (`docs/paquetes/NOCTURNO-2026-10-28.md`) |
| **Disponible en test** | **No.** El encargo no autoriza escribir en test. Cargarlas en la cuenta de Lic. Sofía Paz es `cargar` con `--confirmo-escritura`, después de la autorización de Dirección |

Y la composición de cada receta tiene sus propios estados (§9), que se dicen por separado:

| Estado | |
|---|---|
| Calculado por el sistema | Lo comprueba la prueba de integración: API-REC-07 da lo mismo que el manifiesto |
| Revisado por el agente | Sí: formulación, estados, cantidades, decisiones y composición |
| Cocinado y pesado | **No** |
| Validado por una persona | **No** |

## Qué hay en esta carpeta

| Archivo | Qué es |
|---|---|
| `fuente/` | **La fuente, escrita a mano**, una familia por archivo. Cada ingrediente lleva su FDC, los gramos, el estado y lo que dice la receta; si el catálogo es ambiguo, lleva su decisión. También tiene los pasos, el equipo, los tiempos, la foto esperada, las adaptaciones y los supuestos |
| `catalogo.mjs` | El catálogo como lo sembraron las migraciones, leído de los datos del repositorio. La identidad y la versión salen de las mismas funciones UUID v5 que escribieron las migraciones |
| `armar.mjs` | Resuelve la fuente contra el catálogo y escribe `manifiesto.json` y `vista-combinada.json`. Con `--verificar` no escribe: falla si algo no coincide. Con `--resumen` imprime la composición por porción |
| `manifiesto.json` | **El paquete**: las 50, con cada ingrediente resuelto (identidad, versión, nombre, preparación de la fuente, cantidad y estado), la composición total y por porción, la huella de la formulación, la clave de idempotencia de creación y la foto esperada. **Generado: no se edita a mano** |
| `vista-combinada.json` | Las 66 juntas, con el código editorial R001 a R066, la familia, el origen (original o nueva) y el archivo de foto de cada una |
| `ampliacion.mjs` | Las funciones puras: forma del paquete, nombre de la foto, búsqueda de la foto, huella, clave de idempotencia y la regla de que los pasos no usen ingredientes fuera de la lista |
| `cargar.mjs` | La herramienta de carga, en tres modos (abajo) |

## Cómo conviven con las 16 originales

El manifiesto congelado de las originales (`../manifiesto.json`) numera de 1 a 16. Su herramienta busca la foto por el
número y su clave de idempotencia lleva ese número. Esta ampliación no se mezcla con él:

| | Originales | Ampliación |
|---|---|---|
| Identificador | El número, de 1 a 16 (en la vista combinada, R001 a R016) | El código editorial, de R017 a R066 |
| Archivo de foto | `01-avena-cocida-con-banana-y-canela.jpg` | `R017-tarta-de-pollo-y-puerro.jpg` |
| Cómo se busca la foto | Por el número del principio | Por el código del principio: una foto de una no la toma la otra, así que pueden vivir en la misma carpeta |
| Clave de idempotencia | `recetas-de-ejemplo-v1-01-…` | `recetas-ampliacion-2026-10-28-v1-R017-…` |
| Herramienta | `../recetas.mjs` | `cargar.mjs` |

Los códigos R017 a R066 son **editoriales**: no son identificadores del producto. En BE, cada receta tiene el UUID
que le da la API al crearla. La herramienta reconoce una receta ya cargada por su nombre, como la de las originales, y
los 66 nombres son distintos.

## La herramienta

```bash
node cargar.mjs [preparar] [--fotos <carpeta>] [--informe <archivo.json>]
node cargar.mjs revisar --origen <API> --cuentas <cuentas.env> [--cuenta PRO_N] [--fotos <carpeta>] [--informe <archivo.json>]
node cargar.mjs cargar  --origen <API> --cuentas <cuentas.env> [--cuenta PRO_N] --fotos <carpeta> --estado <carpeta> --confirmo-escritura [--solo-con-foto]
```

- **Por omisión no escribe:**
  - sin modo, corre «preparar», que no usa la red;
  - «revisar» solo lee. Inicia una sesión, y eso deja la sesión y su auditoría, como cualquier ingreso;
  - «cargar» exige el origen, el archivo de cuentas y `--confirmo-escritura`. No hay valores por omisión.
- **Se puede cortar y retomar.** Cada escritura lleva su clave de idempotencia:
  - una receta que ya está con su nombre no se crea de nuevo;
  - la intención de una foto repetida devuelve el mismo medio;
  - subir dos veces los mismos bytes responde como un reintento;
  - nunca se reemplaza la imagen que ya tiene una receta.

  Lo hecho queda en `--estado`.
- `--cortar-en R030:subida` termina el proceso de golpe en ese punto, para la prueba de reanudación. Solo funciona contra
  una API local.

## Las decisiones de la formulación

- **Todo en gramos.** Lo crudo se pesa crudo y lo cocido, cocido: el arroz cocido se calcula con el arroz cocido, y la
  papa de los ñoquis con la papa hervida. No se convierten mililitros.
- **Masas, panes, rebozados, huevo, aceite, queso, azúcar y aderezos van en la lista.** Las masas caseras (tarta,
  empanadas, pizza, ravioles, panqueques) están descompuestas en harina, aceite, agua, huevo y sal.
- **Un nutriente sin dato quedaría desconocido, nunca cero.** El catálogo base exige la composición completa, así que en
  las 50 los cinco nutrientes tienen valor.
- **Equivalentes del catálogo, con su decisión escrita:**
  - el pan de hamburguesa se calcula como «Pan tipo francés o de Viena»;
  - las placas de lasaña, como pasta seca;
  - los zapallitos, como zucchini;
  - la calabaza, como zapallo anco;
  - el queso rallado, como parmesano, y la receta dice «parmesano»;
  - el arroz para risotto y para arroz con leche, como grano largo.
- **Supuestos explícitos:** el agua que sueltan los zapallitos, el tomate o la espinaca se descarta y no se descuenta; el
  huevo para pintar se cuenta entero; el pan rallado de la milanesa, 120 g para cuatro.
- **Más estricta que la de las originales:** una coincidencia exacta de nombre resuelve solo si es de USDA. «Pechuga de
  pollo», «Avena arrollada» y «Pan francés» se llaman casi igual que alimentos del catálogo de demostración, así que
  llevan su decisión.

## El reemplazo

**R054 iba a ser «Locro de maíz y porotos con carne magra».** El catálogo de BE no tiene maíz blanco pisado, la base del
locro, y con choclo dejaría de ser locro. Se reemplazó por **«Bifes a la criolla con papas»**, otra olla familiar que el
catálogo cubre entera.

Para sumar el locro, primero hay que incorporar ese alimento al catálogo:
1. buscar en USDA FoodData Central · SR Legacy un registro de maíz blanco seco;
2. revisar que corresponda al maíz pisado;
3. agregarlo con una migración nueva, como el resto del catálogo base.

## Cómo regenerar y verificar

```bash
node armar.mjs                     # escribe manifiesto.json y vista-combinada.json desde fuente/
node armar.mjs --verificar         # 0 si coinciden; 1 si no, o si la fuente tiene un problema
node armar.mjs --resumen           # la composición por porción de cada receta
node cargar.mjs                    # «preparar»: 50 listas para cargar, sin red
node --test ../../../../../../scripts/recetas-ampliacion.test.mjs   # después de npm run build:domain
```
