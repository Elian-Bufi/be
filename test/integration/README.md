# Pruebas de integración

Corren contra **PostgreSQL 16 real** en un contenedor efímero (Testcontainers), con las migraciones aplicadas por `prisma migrate deploy`, igual que en el despliegue.

```bash
npm run test:integration
```

Requisitos: Docker en ejecución. En CI (GitHub Actions, `ubuntu-latest`) Docker ya está disponible.

| Archivo | Qué verifica |
|---|---|
| `schema.int-spec.ts` | que el schema desplegado coincida con el 06: enum `T-06-02` idéntico a `@be/domain`, par temporal `T-06-24` con ocurrencia anulable, sin booleanos |
| `despliegue.int-spec.ts` | readiness contra base real, migraciones pendientes → 503, migración fallida aborta el deploy (07 §62) |

Solo datos sintéticos, dentro de transacciones revertidas o schemas descartables.
