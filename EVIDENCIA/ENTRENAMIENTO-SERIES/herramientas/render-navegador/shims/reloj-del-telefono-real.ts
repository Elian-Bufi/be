// El reloj del teléfono con la API real (`apps/mobile/src/reloj-del-telefono.ts`): el controlado del recorrido, del
// proceso o del arranque simulado (`reloj-controlado.ts`). Es el mismo módulo que reemplaza a `reloj-de-sesion`, así que
// el almacén y las pantallas comparten el mismo reloj.
export { relojDeLaSesion } from './reloj-controlado';
