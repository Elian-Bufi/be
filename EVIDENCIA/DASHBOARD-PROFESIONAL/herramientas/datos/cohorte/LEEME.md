# La cohorte realista

Pedido de Dirección del 2026-10-16: «carga por lo menos 5 usuarios finales y con diferente cantidad de tiempo usando la
plataforma. Desde 6 meses a 3 años. Y desde novatos en entrenamiento y como evolucionaron con grandes cambios hasta
deportistas y personas mayores». Son datos de prueba, para demostrar el funcionamiento y los gráficos. **Ninguna
persona es real.**

## Quiénes son

| Persona | En BE | Áreas (profesional) | Qué cuenta su historia |
|---|---|---|---|
| Diego Sosa, 36 | 3 años | Nutrición y Antropometría (Sofía Paz) · Entrenamiento (Martín Acosta) | Nunca había entrenado: de 104,5 a 80,8 kg, la cintura de 113 a 86 cm y la sentadilla de 20 a 135 kg. Vacaciones de enero con un kilo de más, una molestia en el hombro, el cambio de objetivo a mantenimiento |
| Camila Ortiz, 29 | 1 año y medio | Entrenamiento (Martín Acosta) · Antropometría (Lucía Benítez) | Recomposición: el peso casi no cambia (62 kg), los pliegues bajan de 128 a 92 mm y el hip thrust pasa de 30 a 120 kg. Hoy, una revisión aplicada que dejó un borrador del plan |
| Federico Álvarez, 25 | 2 años | Nutrición y Antropometría (Sofía Paz) · Entrenamiento (Martín Acosta) | Rugby: fuera de temporada, pretemporada y temporada, dos veces. Dos días tipo en el plan nutricional. Ayer, una revisión registrada y sin aplicar |
| Norma Castro, 71 | 3 años | Nutrición y Antropometría (Sofía Paz) · Entrenamiento (Martín Acosta) | Empezó a los 68 a hacer fuerza para no depender de nadie: la prensa de 30 a 72,5 kg, la pantorrilla de 32 a 33,7 cm. Una gripe y un viaje largo. La revisión de Nutrición, vencida hace 4 días |
| Héctor Funes, 65 | 1 año | Nutrición y Antropometría (Sofía Paz) | Lo derivó su médico por la glucemia: 7,4 kg menos y la cintura de 109 a 100,5 cm. Hace 8 días, una revisión que cambió el objetivo a mantenimiento |
| Agustina Ledesma, 21 | 6 meses | Nutrición y Antropometría (Sofía Paz) · Entrenamiento (Martín Acosta) | Quiere ganar peso: de 51 a 55 kg y la sentadilla de 15 a 42,5 kg. Una toma ayer; el plan nuevo, activado hace 10 días |

Cada una tiene sus etapas (planes activados en el pasado, con la revisión que los abrió), sus revisiones intermedias,
comidas con lo que pasa de verdad (porciones del plan, cantidades informadas, sin confirmar, comidas diferentes los
fines de semana, cargas del día siguiente), sesiones por serie con la carga de cada una, faltas y desvíos, y tomas
antropométricas con el perfil completo y sus cálculos (IMC, suma de seis pliegues, % de grasa de Durnin-Womersley,
índice cintura-talla; RFM para Héctor). La historia es reproducible: con el mismo día, la misma en local y en test.

## Cómo se carga

```
node cargar.mjs <local|test> profesionales   # las tres cuentas profesionales y BE_DEMO_PROFESIONALES
# (reiniciar la API con ese valor: en local, entorno.sh; en test, el PR solo de configuración #160)
node cargar.mjs <local|test> ejercicios      # los ejercicios propios de Martín Acosta
node cargar.mjs <local|test> personas        # las seis personas, en pasos que se retoman si algo se corta
node cargar.mjs test nombres-demo            # el nombre de DEMO-A01 y DEMO-A02
node cargar.mjs <local|test> resumen
```

- **local:** la API en `localhost:3001` y la base `be_test_cohorte` del PostgreSQL local. Estado y credenciales en
  `herramientas/trabajo-cohorte` (git lo ignora).
- **test:** la API pública de Render y la base por su URL externa, leída de un archivo fuera del repo. Dirección abre la
  lista de IP de `be-db-test` solo para esta máquina mientras dura la carga y la cierra después: es el «acceso del
  operador» que admite el 07 §29. Estado y credenciales en `C:\Users\bufim\BE-datos-locales\cohorte-test`, fuera del
  repo.

## Qué es por la API y qué por SQL, y por qué

La API no deja registrar nada en el pasado, a propósito. Lo que es de hoy va por la API, como lo haría un cliente:
- las cuentas, el consentimiento de datos de salud y el nombre de cada persona;
- las evaluaciones, con la fecha del hecho;
- cada versión de un plan, como borrador;
- los cálculos;
- la revisión que Martín Acosta registra y aplica hoy.

Lo que pasó antes va por SQL, con su fecha:
- los vínculos, para que «Desde el…» de «Tus asesorados» sea la fecha real;
- los objetivos, las revisiones y su continuidad;
- la activación de cada versión;
- las comidas, las sesiones y las tomas.

Lo escrito por SQL sigue las reglas de la base:
- los disparadores quedan activos;
- cada estado nace como en la API, por ejemplo una solicitud nace pendiente y después se acepta;
- cada transición deja su hecho en la misma transacción;
- la instantánea de un plan se arma con la misma función del dominio que usa la API.

Todo lleva la procedencia `DATOS-SINTETICOS` / `SIEMBRA-COHORTE`, así que se distingue de lo que registra la API.

**Lo que no es real:** las fechas de los textos de consentimiento son anteriores a su vigencia, y BE no existía hace
tres años. Es una historia sintética para la demostración, no un registro.
