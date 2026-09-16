# BE — Documentos del proyecto

> Para el ejecutor técnico. Esta carpeta se copia a `/docs` del repositorio nuevo.

| Carpeta | Qué contiene | Estatus |
|---|---|---|
| `legajo/` | los doce documentos canónicos vigentes | **fuente de verdad** |
| `actas/` | actas de dirección y gates | fuente de verdad |
| `mesa/` | MESA-01 y MESA-02 | **referencia**, no canon |
| `fuente_escolar/` | `Entregables.pdf` de Da Vinci | requisito de entrega |
| `intake/` | intake del repo anterior y matriz de convergencia | evidencia de por qué se empieza de cero |

## Los doce canónicos y su versión vigente

```text
00  Gobierno del legajo
01  v1.0-I   sumario ejecutivo
02  v0.2.1   visión, alcance y plan
03  v0.2.1   modelo de negocio
04  v0.4.2.1 requisitos — 69 RF activos · 38 RNF
05  v0.15    casos de uso — 56 UC
06  v0.1.1   modelo de dominio — 79 términos · 221 reglas · 226 invariantes
07  v0.1.11  arquitectura y despliegue
08  v0.1.5   seguridad, privacidad y gobernanza
09  v0.16.1  contratos de API — 122 operaciones P0
10  UX y prototipos
11A v1.0-H   plan y estrategia de pruebas
12  v1.0-H   trazabilidad y SPEC-TVCC30
```

**Verificá estas cifras** al copiar los documentos: si alguna no da, el archivo no es la versión vigente.

## Advertencias

`mesa/` es derivación para la presentación académica. Si el legajo se refina durante la implementación, la mesa puede quedar desactualizada. **No es fuente para implementar.**

Se excluyeron las carpetas `_obsoletos` y los archivos comprimidos redundantes.

`intake/` documenta el repositorio anterior, que **no se usa como base**. Está para justificar la decisión, no para copiar código.
