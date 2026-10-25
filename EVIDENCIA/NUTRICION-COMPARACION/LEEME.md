# Evidencia · Comparación de Nutrición (WP-NUTRICION-COMPARACION, DL-158)

Qué hay acá: las capturas de «Analizar» con las tres capas de Nutrición —registrado, objetivo del profesional e indicado
en el plan—, tomadas por los recorridos de navegador `comparacion` y `comparacionConOpciones`
(`test/navegador/recorridos.mjs`). La definición está en `docs/paquetes/WP-NUTRICION-COMPARACION.md`.

**Estado:** implementado y probado de forma automática (dominio, integración y navegador). **No** está integrado ni
desplegado: vive en la rama `wp-nutricion-comparacion` (PR #211, borrador, sobre #210). Nadie lo usó todavía con un lector
de pantalla ni con profesionales.

**Alcance de esta entrega:**
- **No prueba consumo ni adherencia.** Pone tres capas una al lado de la otra: lo que la persona registró, el objetivo que
  fijó el profesional y lo indicado en el plan. Lo registrado no es lo consumido: falta lo que no se registró, y un
  registro sin cantidades no da números. Que dos capas se acerquen no dice que la persona cumplió ni que una cosa causó
  la otra. No hay porcentajes, puntajes ni promedios.
- **Con alternativas no hay un único total diario indicado, y la pantalla dice por qué.** Si una comida del plan deja
  elegir entre opciones, BE no elige una ni las suma: ese día no tiene rombo, y la lectura nombra la comida y cuántas
  opciones tiene. Lo que sí existe se consulta en «Ver origen»: lo indicado de la opción que se registró en cada comida,
  al lado de lo registrado.
- La regla de los planes con alternativas es la decidida (C-D1) y no cambia en esta entrega.
- Con Nutrición suspendida por Administración, «Analizar» no muestra ninguna de las tres capas; al rehabilitar vuelven
  iguales (prueba permanente en `test/integration/comparacion-nutricional.int-spec.ts`).

## Los datos de los recorridos

Sintéticos, de una base local descartable (`@example.invalid`). Un plan de dos comidas (avena 80 g y arroz 300 g) y dos
versiones del objetivo: 750 kcal y 26 g de proteínas, y desde anteayer 700 kcal y 24 g (números del recorrido, no una
recomendación). La persona registró desde la APK: hace seis días, las dos comidas; hace cinco, nada; hace cuatro, solo
el desayuno; hace tres, el desayuno y algo diferente en el almuerzo; ayer, las dos. El plan se activó hoy, así que los
días sin registros de antes no tenían un plan vigente. En `comparacionConOpciones`, el almuerzo además deja elegir pollo.

## Las capturas

1440 × 900, con la API y el website locales de la rama. Cada una en Claro y en Azul noche.

| Archivo | Qué muestra |
|---|---|
| `comparacion-lectura-ayer-*` | Calorías y proteínas por día, cada panel con su leyenda de tres capas. Los rombos están en los días con registros y hoy; el punto del día completo queda adentro de su rombo. El objetivo cambia de escalón anteayer. La lectura de ayer dice el objetivo con desde cuándo rige, lo indicado con la versión y el día tipo, y la regla |
| `comparacion-tabla-*` | La tabla de datos: las columnas «Objetivo del profesional (por día)» e «Indicado en el plan», con una fila para hoy, que no tiene registros pero sí rombo |
| `comparacion-origen-ayer-*` | «Ver origen» de ayer: cada comida con lo registrado y lo indicado de su opción, el total del día y lo indicado para el día |
| `comparacion-con-opciones-lectura-*` | Con alternativas en el almuerzo: ningún rombo, la nota debajo del gráfico con el motivo, y la lectura que dice qué comida tiene opciones y que BE no elige ni suma |
| `comparacion-con-opciones-origen-*` | El origen con alternativas: lo indicado de la opción que se registró en cada comida, y el día sin indicado, con su motivo |

## Lo que comprueban los recorridos

- Los rombos son uno por día con indicado (los de la API), están a una misma altura y a la del valor de la API, leída
  con las marcas del eje, y el del día completo rodea al punto registrado.
- La línea de lo registrado se corta en los días sin registros: una línea por tramo.
- La lectura, la tabla y «Ver origen» dicen lo mismo que la API, con los mismos textos del dominio.
- Con alternativas no hay ningún rombo y se dice por qué.

## Cómo se reproducen

```bash
npm run build -w @be/api
BE_API_BASE_URL=http://localhost:3101 npm run build -w @be/web
BE_RECORRIDOS_DATABASE_URL=postgresql://usuario:clave@localhost:<puerto>/be_recorridos_<algo> \
  node test/navegador/correr.mjs <carpeta de salida> --solo comparacion,comparacionConOpciones
```

## Lo que no prueba esta evidencia

- Un lector de pantalla real: los recorridos comprueban los textos y la leyenda, no cómo se usan.
- Profesionales: si se entiende la diferencia entre «Objetivo del profesional» e «Indicado en el plan».
- Un plan con varios días tipo o porciones de intercambio en la pantalla: están en las pruebas del dominio y de
  integración, no en una captura.
