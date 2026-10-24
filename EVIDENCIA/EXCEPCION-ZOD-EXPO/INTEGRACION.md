# Integración de #201, #202 y #206: procedimiento (preparado el 2026-10-24, no ejecutado)

**Para qué es.** Es la fase que Dirección todavía no autorizó: integrar en `main` y desplegar `test`. La ratificación de
la excepción del zod (DL-114, 2026-10-24) no la autoriza. Nada de lo que sigue se ejecutó.

## Antes de empezar

- **La autorización tiene que cubrir integrar y desplegar.** Cada integración en `main` despliega `test` sola, cuando
  pasa la CI de `main` (`render.yaml`, `autoDeployTrigger: checksPass`, filtrado por rutas):
  - **#201, con #202 adentro.** Cambia `package.json`, `package-lock.json`, `packages/domain/package.json` y
    `apps/web/package.json`, así que despliega la API (`be-api`) y el website (`be-web`).
  - **#206.** Cambia `apps/api/src/http/**`, así que despliega la API.
  - **`be-recordatorios` no se despliega con ninguno:** su filtro es solo `scripts/disparar-recordatorios.mjs`.
  - **Ninguno trae migraciones:** `prisma/` no cambia.
  - **Lo que no despliega:**
    - integrar #202 en la rama de #201, que no es `main`;
    - cambiar la base de un PR;
    - empujar a ramas `wp-*`, que solo corre la CI.

    El workflow de la APK corre solo a mano o con una etiqueta `apk-v*`, y este procedimiento no usa ninguna de las dos
    cosas.
- **Antes del 2026-11-01 a las 00:00 UTC**, el 31 a las 21:00 en Argentina. Desde ahí la auditoría falla en toda rama, y
  no se puede integrar sin una decisión nueva de Dirección.
- **Que nada haya cambiado:**

  ```
  git fetch origin
  git rev-parse --short origin/main        # 0fb1bff; si no, ver «Si main cambió»
  gh pr view 201 --json headRefOid,baseRefName,isDraft
  gh pr view 202 --json headRefOid,baseRefName,isDraft
  gh pr view 206 --json headRefOid,baseRefName,isDraft
  ```

  Las cabezas tienen que ser las que figuran en la descripción de cada PR, con los cuatro checks obligatorios en verde.
  `recorridos` no es obligatorio en `main`, pero este procedimiento lo exige en los pasos 2 y 5, sobre lo que se va a
  integrar (ver «El intermitente conocido»). Si cambió alguna cabeza, se repite el ensayo de abajo.

## Las ramas

| PR | Rama | Base | Commits propios |
|---|---|---|---|
| #201 | `seguridad/avisos-2026-10-23` | `main` | `1d7bb08` |
| #202 | `seguridad/excepcion-zod-expo-propuesta` | rama de #201 | `b48f732`, `916cb05`, `acda491`, `664f713`, `8aa545b` (la ratificación) y el que precisa este procedimiento |
| #206 | `wp-seguridad-validacion-acotada` | rama de #202 | `c645098`, `9cf5e61` y `9ac1972` (la corrección de un comentario) |

## El ensayo (ya hecho, en `wp-preintegracion-seguridad-2026-10-24`)

Repite el orden de abajo con commits de merge, sin tocar las ramas de los PR. La CI de esa rama prueba el árbol que va a
quedar en `main`.

```
git switch -c wp-preintegracion-seguridad-2026-10-24 origin/main
git switch -c ensayo-201 origin/seguridad/avisos-2026-10-23
git merge --no-ff origin/seguridad/excepcion-zod-expo-propuesta -m "Ensayo: integra #202 en la rama de #201"
git switch wp-preintegracion-seguridad-2026-10-24
git merge --no-ff ensayo-201 -m "Ensayo: integra #201 en main"
git switch -c ensayo-206 origin/wp-seguridad-validacion-acotada
git merge --no-ff wp-preintegracion-seguridad-2026-10-24 -m "Ensayo: pone #206 al día con main"
git switch wp-preintegracion-seguridad-2026-10-24
git merge --no-ff ensayo-206 -m "Ensayo: integra #206 en main"
git push origin wp-preintegracion-seguridad-2026-10-24    # corre la CI; no despliega
```

Si después cambia una cabeza, el ensayo se pone al día con merges nuevos en el mismo orden, sobre las mismas ramas y sin
force push.

## El orden, con la autorización

1. **#202 en la rama de #201**, con commit de merge. No borrar la rama (sin `--delete-branch`): si se borra, GitHub
   cambia la base de #206 solo.

   ```
   gh pr ready 202
   gh pr merge 202 --merge --subject "Integra #202: la excepción del zod 3 de la CLI de Expo, con procedencia comprobada (DL-114, ratificada el 2026-10-24)"
   ```

2. **La CI de #201.** El merge cambia la cabeza de #201 y dispara su CI.

   ```
   gh pr checks 201 --watch
   ```

   Tienen que dar verde los cuatro obligatorios, `verificar`, `integración`, `imagen API` y `legajo`, y también
   `recorridos`; si `recorridos` falla, ver «El intermitente conocido». En el log de `verificar`, la auditoría tiene que
   mostrar, en `@be/mobile`, el zod exceptuado con «procedencia comprobada … ← @be/mobile» y «bundle de Android …
   ninguno de node_modules/zod». Esa cabeza tiene el mismo árbol que la de #202: es lo que queda en `main` y se
   despliega en el paso 3.

3. **#201 en `main`**, con commit de merge, sin `--auto` ni `--admin`. `main` exige la rama al día (strict): si `main`
   cambió, ver «Si main cambió».

   ```
   gh pr ready 201
   gh pr merge 201 --merge --subject "Integra #201: Next 15.5.28, zod 4.6.6, multer 2.5.0 y body-parser 2.4.0, con la excepción del zod de Expo (#202)"
   ```

   Corre la CI de `main` y, si pasa, Render despliega `be-api` y `be-web`.
4. **Comprobar `test`**, como se describe abajo, antes de seguir.
5. **#206: base a `main` y al día.** Las dos cosas recién ahora, cuando su base ya está en `main`.

   ```
   gh pr edit 206 --base main
   git fetch origin
   git switch wp-seguridad-validacion-acotada
   git merge --no-ff origin/main -m "Pone #206 al día con main, con #201 y #202 integrados"
   git push origin wp-seguridad-validacion-acotada
   gh pr checks 206 --watch
   ```

   Corren dos CI, la del push a la rama `wp-` y la del PR, y las dos tienen que dar verde: los cuatro obligatorios y
   `recorridos`, con `validacion.spec.ts` y `sin-falsos-rechazos.spec.ts` en la suite de la API. Si `recorridos` falla,
   ver «El intermitente conocido».
6. **#206 en `main`**, con commit de merge, sin `--auto` ni `--admin`.

   ```
   gh pr ready 206
   gh pr merge 206 --merge --subject "Integra #206: la validación de cuerpos ya no deja que zod junte miles de errores"
   ```

   Corre la CI de `main` y, si pasa, Render despliega `be-api`.
7. **Comprobar `test`** otra vez.

## Comprobar `test` y la auditoría

- **La CI de `main`:**

  ```
  gh run list --branch main --workflow ci.yml --limit 3
  gh run view <corrida> --attempt 1 --json jobs --jq '.jobs[] | select(.name|startswith("verificar")) | .databaseId'
  gh api --allow-escape-sequences repos/Elian-Bufi/be/actions/jobs/<trabajo>/logs | grep -E "✓ @be/|exceptuado hasta|procedencia comprobada|bundle de Android"
  ```

  `--attempt 1` es porque, si se volvió a correr otro trabajo, el log de `verificar` queda en el intento en que corrió.
  `@be/api` y `@be/web` tienen que dar «sin avisos altos ni críticos». En `@be/mobile` tienen que aparecer node-forge y el
  zod exceptuados hasta el 2026-10-31, el zod con su procedencia y el bundle sin `node_modules/zod`.
- **La API desplegada.** Tiene que responder con el commit de `main`, completo:

  ```
  git fetch origin && git rev-parse origin/main
  curl -s https://be-api-hndp.onrender.com/health/ready
  ```

  En la respuesta, `"estado":"OK"`, `"baseDeDatos":"OK"`, `"migraciones":"OK"` y `"commit"` igual al de `main`. Render
  despliega unos minutos después de la CI de `main`; hasta entonces responde el commit anterior.
- **El website**, solo después de #201. El pie de la portada muestra los primeros siete caracteres del commit:

  ```
  curl -s https://be-web-1ngj.onrender.com/ | grep -o 'commit <!-- -->[0-9a-f]\{7\}'
  git rev-parse origin/main | cut -c1-7
  ```

  Tienen que coincidir. #206 no despliega el website: después de #206, el pie sigue con el commit de #201.
- **La APK no cambia.** Hace falta una autorización aparte para construir una nueva, y es la que corrige el zod 4.6.5
  de las instaladas.

## Si main cambió

Se pone al día cada rama con `git merge origin/main`, sin rebase ni force push. Después vuelve a correr la CI de cada PR,
y se repite el ensayo.

## Si algo falla

- **No se integra.** Tampoco se saltan checks, se cambia la protección de `main` ni se reemplaza una CI con una
  declaración.
- **El intermitente conocido, `faltaUnaParte`.** Es anterior a estos PR.
  - El 20/10, después de llegar a `main`, `recorridos` pasó las 9 veces que terminó, tres de ellas en `main`.
  - Entre la noche del 23/10 y el 24/10, `faltaUnaParte` falló en 11 de 27 intentos. Cinco de esas fallas fueron en
    ramas que no tienen #201, #202 ni #206, entre ellas la de #205, que en código es igual a `main` (corridas
    40095438520, sobre `68cca09`, y 40061646161, sobre `f7a75eb`).
  - Falla con uno de dos errores, y los dos aparecen en esas ramas: «Waiting failed: 30000ms exceeded» y «el plan activo
    sigue a la vista».
  - En la cabeza `8aa545b` de #202 falló las dos veces (corrida 40113494398), y en el ensayo, una de dos (40114017223).
  - Arreglarlo es el pendiente 2 de la consolidación del 23/10 (`EVIDENCIA/CONSOLIDACION-2026-10-23/LEEME.md`, en #205),
    fuera de estos PR.

  Qué se hace:
  1. Si falla solo `faltaUnaParte`, con uno de esos dos errores, se vuelve a correr ese trabajo una vez (`gh run rerun
     <corrida> --failed`) y se lo anota en el PR.
  2. Si vuelve a fallar, no se integra. Se guardan el log y el artefacto (`gh run download <corrida> -n
     resultados-recorridos`), y decide Dirección.
  3. Si falla otro recorrido, o este con otro error, se frena sin volver a correr.
- **Una falla en la CI de `main`.** Render no despliega, porque espera los checks. Se corrige con un PR nuevo, o se
  revierte el merge con un PR de `git revert -m 1 <merge>`. Nunca con force push.
- **`test` quedó mal después de desplegar**, porque `/health/ready` no da «OK» o el website no carga. Vuelve atrás
  Dirección, en Render: `be-api` o `be-web` → Events → el deploy anterior → Rollback (`docs/DESPLIEGUE.md`, «Rollback»).
  Después va el PR de revert. Como ninguno de los tres trae migraciones, el rollback no choca con la base.
- **La excepción vence a mitad de camino.** La auditoría falla en todas las ramas, también en `main`, y hace falta una
  decisión nueva de Dirección.

## Trazabilidad

- **Merges con commit de merge, sin squash ni rebase.** Así quedan los commits de cada PR y su orden.
- **Cada PR conserva su descripción**, con la cabeza integrada, la corrida de CI que la probó y, si hubo que volver a
  correr `recorridos`, también eso.
- **Las ramas se borran recién al final**, con los tres PR integrados.
