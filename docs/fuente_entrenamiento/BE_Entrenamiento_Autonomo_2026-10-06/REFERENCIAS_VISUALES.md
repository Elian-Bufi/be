# Qué imagen usar y para qué

Los archivos tienen nombres descriptivos. Para hablar de una captura, usar su título además del nombre; no referirse solo a un número.

| Archivo | Título visible / finalidad | Autoridad |
|---|---|---|
| `referencias/01_series_y_descanso_actualizado.png` | **BE · Entrenamiento por serie**. Izquierda: registrar serie; derecha: descanso en curso. | Referencia principal nueva. Sustituye las alternativas anteriores. |
| `referencias/02_carga_y_reintento.png` | **Volver a BE con claridad**. Comprobación de sesión y demora recuperable. | Referencia de composición para carga/reconexión. |
| `referencias/03_hoy_y_plan_estilo.png` | **BE · Entrenamiento**. Hoy y Plan. | Solo composición general. Aplicar todas las excepciones de abajo. |

## Excepciones que evitan copiar errores del dibujo

1. El logo de las exploraciones es aproximado; reutilizar el logo y los iconos reales del repositorio. En la nueva referencia se dejó solo la palabra BE para no sugerir otro símbolo.
2. Los valores son sintéticos. `datos/sesion_demo.json` define la sesión de tres ejercicios y nueve series; la referencia antigua Hoy/Plan tiene cuatro y doce. No copiar sus contadores.
3. Hoy/Plan antiguo muestra calendario semanal y «Bloque principal / Complementarios». En el contrato revisado no hay asignación semanal ni esos bloques dentro de una sesión. Mostrar las sesiones reales y su secuencia; no inventar agenda, calentamiento o días de descanso por copiar el PNG. Los bloques de plan existentes tienen otra semántica.
4. Ya no comparar principalmente con la sesión previa. Comparar cada serie con su propio plan. El historial sigue disponible en su lugar.
5. Ya no hay +15 s ni lista de otros ejercicios bajo la tabla. Solo iniciar/finalizar descanso con recomendado visible.
6. Los grises de una imagen no certifican contraste. Medir contraste en componentes implementados. Todos los campos requieren etiquetas persistentes y objetivos accesibles incluso al escribir.
7. La ayuda RIR definitiva está en el prompt y usa «podrías haber hecho». El dibujo usa una abreviación visual. No cambiar la definición por ahorrar una línea.
8. La maqueta muestra el estado de la serie 1 y su descanso. Después de terminarlo se puede enfocar la serie 2, pero editar esa fila durante el descanso no reasigna el descanso a la serie 2.
9. Registrar vacío no guarda las sugerencias; por eso el botón inicial está deshabilitado en el dibujo. La alternativa explícita sin detalle, si el contrato la permite, se define en el prompt.
10. El aro del descanso es apoyo visual, no un reloj que finaliza al completar la circunferencia. El tiempo sigue y el botón Finalizar es manual.
11. No copiar carcasas, barras del sistema iOS, píxeles ni teclados dibujados. Implementar Android, safe areas, teclado real y componentes responsivos.
12. La sesión enfocada no muestra barra inferior; conservar navegación segura y el estado al salir/volver. Las otras pantallas mantienen los cinco destinos existentes.
13. Brillos internos: evitar las placas translúcidas recortadas observadas en antropometría; usar superficies uniformes con bordes consistentes.

No se incluyen las láminas anteriores incompatibles de comparación con sesión previa o descanso +15 s, para evitar que se implementen por error. No son necesarios para el encargo.
