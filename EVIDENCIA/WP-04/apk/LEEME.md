# Capturas del APK 0.4.0 en el teléfono de Dirección

El tramo del asesorado del circuito nutricional (partes 0, 2 y 4 de `../GUIA-DEMO.md`), en un Android real, el 2026-09-19 entre las 20:24 y las 23:15 (hora de Buenos Aires). Cuenta **DEMO-A01** contra el ambiente `test`, con la profesional **DEMO-PN** operando desde la API. Datos sintéticos. Sin metadatos EXIF.

| Captura | Paso | Qué demuestra |
|---|---|---|
| `apk-01-bienvenida-0.4.0` | 0.1 | Identidad del build: `app 0.4.0 · test · commit 7b21cc7` (07 §34, TEST-APK-008) |
| `apk-02-hoy-sin-plan` | 0.6 | Con vínculo, B2 y A3 vigentes pero sin plan activado: «Actualmente no tenés un plan activo de Nutrición.» El borrador del profesional no es visible (REG-06-105) |
| `apk-03-hoy-plan-vigente-a` | 2.1 | La instantánea de la versión activada, tal como la emitió la profesional: almuerzo (arroz 100 g, pollo 120 g) y cena |
| `apk-03-hoy-plan-vigente-b` | 2.1 | El pie de la misma pantalla: «Todavía no registraste comidas hoy.» Sin puntajes ni porcentajes |
| `apk-04-registrar-almuerzo` | 2.2 | Registrar una comida del plan: las cantidades dicen «opcional» y muestran lo indicado («Indicado: 100 g»). La cantidad informada es 80 g |
| `apk-05-almuerzo-registrado` | 2.3 | «Comida registrada» y la comida queda **«Registrado»**, nunca «Cumplido» (B05:836-846; REG-06-125) |
| `apk-06-fuera-del-plan` | 2.4 | Modalidad C: «Contanos qué comiste.» con texto libre y porción aproximada opcional (B05:854-895) |
| `apk-07-registros-de-hoy` | 2.5 | Los dos registros del día, etiquetados DEL PLAN y FUERA DEL PLAN. La cena sin registro **no** lleva marca de falta (INV-06-135) |
| `apk-08-plan-actual` | 2.6 | La versión vigente con su fecha y el «Objetivo declarado por el profesional» (2200 kcal, 110/270/70 g). BE no calcula: lo declara la profesional (REG-06-123) |
| `apk-09-detalle-registro` | 2.7 | «Tu descripción original» con el texto tal como lo escribió la persona, conservado (TEST-NUT-003) |
| `apk-10-hoy-version-nueva` | 4.1 | Después de que la profesional corrigiera el plan y activara una versión sucesora: el almuerzo **sigue «Registrado»** aunque se registró contra la versión anterior, y la cena muestra el cambio (zapallo 110 g). Lo registrado no se pierde (INV-06-13) |

## Sobre `apk-10`

Es el momento más fino del paquete, y conviene leerlo con los datos de la API:

- el **almuerzo** se registró a las 22:59 contra la versión `c7df904a`;
- la profesional activó después la versión `9b5fa7b9` (corrigió el zapallo de la cena de 100 a 110 g);
- en la captura, con `9b5fa7b9` vigente, el almuerzo **sigue mostrando «Registrado»**: la sucesora conserva los identificadores de cada comida, así que el registro previo no queda huérfano ni se vuelve a pedir;
- la **cena** se registró a las 23:15, ya contra la versión nueva.

Durante la corrida, una primera corrección se hizo por la API sin reutilizar los identificadores de los nodos (algo que el editor del website hace solo). El resultado fue que la comida ya registrada volvió a aparecer como pendiente, sin perder ningún dato: el registro siguió entero en «Ver todos mis registros» y en el contraste de la profesional, que lee cada registro contra la versión que referencia (`DEFENSA/WP-04.md` §5). La corrección se rehízo por el camino correcto —«Crear nueva versión a partir de esta»— y es la que quedó capturada.
