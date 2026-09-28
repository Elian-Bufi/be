# Evidencia · PF-02 — contexto de entrenamiento conectado con la evaluación

Ficha y decisiones: `docs/propuestas/PF-01-02_contexto-de-entrenamiento.md` (DL-100 a DL-103).

| PR | Qué entrega | Estado |
|---|---|---|
| #100 (1/3) | Plantilla «Antecedentes para entrenamiento» (DL-100) y límites NUMBER validados en el servidor (DL-101) | Para auditoría |
| #101 (2/3) | Citas de respuestas en la evaluación, verificadas en el servidor (DL-102) | Para auditoría (encadenado sobre #100) |
| #102 (3/3) | Website: «Solicitar contexto» desde la evaluación, con retorno; citar respuestas y ver lo citado | Para auditoría (encadenado sobre #101) |

## Recorrido local del website (previo a la integración)

**Qué es y qué no es.** Es un recorrido en la máquina de desarrollo, el 2026-09-27, con el código de los tres PR:
- API compilada contra PostgreSQL 16 local, con las migraciones aplicadas;
- website en `next dev`;
- Chrome sin interfaz manejado con `puppeteer-core`;
- datos sintéticos sembrados por la API: un profesional de ENTRENAMIENTO verificado como demo y un asesorado con A3, vínculo y B2.

**No es el ambiente `test` de Render** y no reemplaza la verificación después de integrar.

| Control | Resultado |
|---|---|
| El resumen de Entrenamiento ofrece «Solicitar contexto» junto a «Nueva evaluación» (`01`) | ✅ |
| El pedido llega precargado: «Antecedentes para entrenamiento», los seis campos, cinco requeridos (preferencias opcional), propósito «Planificar tu entrenamiento» y alcance Entrenamiento, con aviso de que se puede cambiar (`02`) | ✅ |
| Al enviar, vuelve a Entrenamiento (CA-FOR-06, `03`) | ✅ |
| Respondida la Solicitud (por la API, como el asesorado), el formulario de evaluación ofrece las cinco respuestas para citar, cada una «Declarado por la persona», con fecha y unidad («3 días por semana», «45 min») (`04`) | ✅ |
| La evaluación registrada muestra «Contexto citado» aparte de la valoración, y lo citado no aparece como dato observado (CA-FOR-04, `05`) | ✅ |
| Errores en la consola del navegador | ninguno |

**Pendiente:**
- el mismo recorrido en el ambiente `test`, una vez integrados los tres PR;
- el pedido respondido desde la APK. La APK no cambia: responde con la pantalla genérica de formularios.

Solo datos sintéticos. Sin credenciales.
