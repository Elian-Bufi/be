// WP-ENTORNO-DEL-TUTOR (DL-184) · el borrador de una versión de plan, a prueba de cortes. La API lo crea en dos pasos
// (POST desde la versión anterior o una plantilla, y PATCH con la estructura de la historia); si la carga se corta entre
// los dos, el borrador queda con el contenido de su base. La corrida siguiente lo encuentra y, como sigue en borrador, le
// vuelve a escribir la estructura: un borrador se puede editar, así que reescribirla cuando ya estaba no cambia nada. Una
// versión activada no se toca.

/**
 * `existente`: { id, estado } de la versión k si ya está en la base, o null.
 * `crear()` → { planId, version }; `versionDe(planId)` → el token de versión vigente («vN»);
 * `escribir(planId, version, { reintento })` deja la estructura de la historia.
 * Devuelve el id de la versión.
 */
export async function asegurarBorrador({ existente, crear, versionDe, escribir }) {
  if (existente?.estado === 'ACTIVADA') return existente.id;
  if (existente) {
    await escribir(existente.id, await versionDe(existente.id), { reintento: true });
    return existente.id;
  }
  const b = await crear();
  await escribir(b.planId, b.version, { reintento: false });
  return b.planId;
}
