# Lector de pantalla en la ficha del asesorado (encargo §3.E y CP-28)

**Estado: no probado con una persona.** Este documento dice qué se verificó con herramientas, qué no se pudo hacer y
cómo hacer la prueba que falta. Nada de lo que sigue es una aprobación humana.

## Qué se intentó y por qué no se pudo completar

| Lector | Situación en el equipo de trabajo (2026-10-09) |
|---|---|
| NVDA | No está instalado (ni en `Program Files` ni en `Program Files (x86)`). Instalarlo es instalar software nuevo en la máquina de Dirección: no lo hice sin pedirlo. |
| JAWS | No está instalado (es pago). |
| Narrador (Windows) | Está (`C:\Windows\System32\Narrator.exe`), pero lo que dice sale por el audio: ni el navegador sin interfaz que usan los recorridos ni ninguna herramienta de esta sesión puede escucharlo ni registrarlo. Encenderlo sin una persona que escuche no prueba nada. |

## Qué sí se verificó con herramientas

Son verificaciones automáticas del navegador (Chrome, sin interfaz) sobre la compilación del recorrido. No reemplazan a
un lector de pantalla:

- **El árbol de accesibilidad** del Resumen, el que leen los lectores de pantalla: encabezados, nombres de enlaces y
  botones, regiones. Queda en `recorridos/arbol-de-accesibilidad-resumen.txt` (recorrido `funcional`, CP-28): ningún
  enlace ni botón sin nombre, y los encabezados «Objetivo y planificación», «Para tu próxima revisión», «Acciones»,
  «Indicadores».
- **axe** (WCAG 2.0 a 2.2, A y AA) en las 20 pantallas nuevas o cambiadas a 1440 px (`mirar`, compilación `269d930`): sin violaciones.
- **Teclado:** con Tab se alcanzan las acciones de las observaciones y las preguntas del Resumen, con el foco visible;
  el panel de origen se cierra con Esc y devuelve el foco al disparador (CP-21).
- **Nombres accesibles hechos para el lector:** cada enlace de una observación dice su área («Ver en la línea de tiempo
  (Nutrición)», con la parte entre paréntesis oculta a la vista); cada botón de una fila de tabla dice su fila («Ver lo
  indicado y lo registrado: Comida registrada · Cena, 8 oct 2026»); la tabla de objetivo y planificación tiene encabezados
  de fila y de columna; los gráficos tienen su tabla equivalente y un resumen en texto.

## Guion para la prueba con una persona (NVDA o Narrador, 15 minutos)

Con los datos sintéticos de la guía de demostración, en Chrome o Edge, la ficha del asesorado A:

1. **Encabezados (tecla H en NVDA; H con Narrador en modo de examen):** se oyen, en orden, el nombre de la persona,
   «Objetivo y planificación», «Para tu próxima revisión», «Acciones», «Indicadores», «Qué se registró en el período» y
   «Lo último que pasó». ¿Se entiende dónde se está?
2. **La tabla de objetivo y planificación (T, y Ctrl+Alt+flechas):** al moverse por las celdas, ¿se oye el encabezado de
   la fila (el área) y el de la columna (Objetivo, Planificación, Revisiones)?
3. **Una observación de la síntesis:** se oyen el área y el alcance («Nutrición · Desde la revisión del 19 sept 2026»),
   el hecho y «Sale de…». El enlace dice adónde lleva y de qué área.
4. **Analizar, «¿Cómo viene progresando este ejercicio?»:** el formulario pide el ejercicio; al enviarlo, ¿se anuncia la
   pregunta en curso? En el gráfico (con Tab), ¿se oyen el título y la indicación de las flechas? ¿Se llega a «Tabla de
   datos» y al «Resumen en texto»?
5. **El panel de origen** («Ver el origen de este dato»): al abrirse, ¿el foco entra al diálogo y se oye su título? Al
   cerrarlo con Esc, ¿vuelve al botón?
6. **La línea de tiempo filtrada** desde una observación: ¿se oye el aviso «Lo nuevo desde la revisión…» y cuántos hechos
   coinciden?

Qué anotar: lo que se oyó distinto de lo esperado, lo que faltó y lo que sobró (repeticiones). Con eso se abre un
pendiente con su severidad; no se marca CP-28 como aprobado sin esta prueba.
