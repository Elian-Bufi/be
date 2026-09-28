# Evidencia · PF-02 — contexto de entrenamiento conectado con la evaluación

Ficha y decisiones: `docs/propuestas/PF-01-02_contexto-de-entrenamiento.md` (DL-100 a DL-103).

| PR | Qué entrega | Estado |
|---|---|---|
| #100 (1/3) | Plantilla «Antecedentes para entrenamiento» (DL-100) y límites NUMBER validados en el servidor (DL-101) | **Integrado** (`ea3e1ec`). Limitación de interfaz: DL-104, abierta |
| #101 (2/3) | Citas de respuestas en la evaluación, verificadas en el servidor (DL-102) | **Integrado** (`ff2001e`). Evidencia por dimensión: `auditoria-pr-101.md` |
| #102 (3/3) | Website: «Solicitar contexto» desde la evaluación, con retorno; citar respuestas y ver lo citado | **Para auditoría** con las tres correcciones pedidas sobre `e688368`, sin autorización de integración. Evidencia: `auditoria-pr-102.md` |

## Correcciones de la auditoría del #102

La auditoría sobre `e688368` pidió tres correcciones. El detalle, las pruebas y las capturas (`auditoria-pr-102/`) están en `auditoria-pr-102.md`:
1. **Versión vista y versión citada.** El website envía la versión que mostró (`expectedVersion`). Si la persona rectificó en el medio, la API responde 409 sin registrar nada; el website conserva lo escrito y pide actualizar y revisar la selección.
2. **Paginación del contexto**, con el cursor de FRM-04 y «Cargar más». Una página sin respuestas de entrenamiento ya no se toma como vacío definitivo.
3. **Máximo de 20 citas**, visible en pantalla, sin descartar selecciones y validado también antes de enviar.

## Adaptación del #102 al #101 integrado

Con el #101, la API devuelve en cada cita la unidad **que declaró la persona** o, si falta, la del campo de la plantilla. La lista de respuestas citables del formulario de evaluación usaba siempre la de la plantilla. Ahora aplica la misma regla (commit `c5435e2`), así lo que el profesional marca coincide con lo que después muestra «Contexto citado».

## Recorrido local del website (previo a la integración)

**Qué es y qué no es.** Es un recorrido en la máquina de desarrollo, el 2026-09-28, con el código del #102 sobre `main`: commit `c5435e2`, que incluye el #101 integrado. Se usó:
- la API compilada contra PostgreSQL 16 local, con todas las migraciones aplicadas;
- el website en `next dev`;
- Chrome sin interfaz manejado con `puppeteer-core`;
- datos sintéticos sembrados por la API: un profesional de ENTRENAMIENTO verificado como demo y un asesorado con A3, vínculo y B2. El asesorado responde por la API, como lo haría la APK, **declarando la unidad «minutos»**.

**No es el ambiente `test` de Render** y no reemplaza la prueba completa web → respuesta desde la APK → evaluación en el ambiente desplegado, que sigue pendiente.

| Control | Resultado |
|---|---|
| El resumen de Entrenamiento ofrece «Solicitar contexto» junto a «Nueva evaluación» (`01`) | ✅ |
| El pedido llega precargado: «Antecedentes para entrenamiento», los seis campos, cinco requeridos (preferencias opcional), propósito «Planificar tu entrenamiento» y alcance Entrenamiento (`02`) | ✅ |
| Aviso «Viniste desde Entrenamiento», con enlace de vuelta (`02`) | ✅ |
| Al enviar, vuelve a Entrenamiento (CA-FOR-06, `03`) | ✅ |
| Respondida la Solicitud, el formulario de evaluación ofrece las cinco respuestas para citar (`04`) | ✅ |
| Cada citable dice «Declarado por la persona», con fecha y unidad: «45 **minutos**» (la declarada) y «3 días por semana» (la de la plantilla) (`04`) | ✅ |
| La evaluación registrada muestra «Contexto citado», con lo citado (`05`) | ✅ |
| Lo citado no aparece como dato de la valoración (CA-FOR-04, `05`) | ✅ |
| Errores en la consola del navegador | ninguno |

Son 10 controles, todos en verde. Las capturas están en `recorrido-local/`.

## Pendiente

- La prueba completa **web → respuesta desde la APK → evaluación** en el ambiente desplegado, una vez integrado el #102.
- La **prueba de concurrencia real** de las citas (#101). El caso secuencial de la auditoría del #102 (v1 → v2 → 409) no la reemplaza.
- **DL-104** (mensaje ante un valor fuera de rango).

Solo datos sintéticos. Sin credenciales.
