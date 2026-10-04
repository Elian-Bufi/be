/**
 * APK · Inicio (DL-117, decisión de Dirección del 2026-10-04): la entrada después de iniciar sesión o de recuperar una
 * sesión guardada válida. Reúne lo disponible de los módulos; las tarjetas llegan en la etapa 3
 * (docs/ux/INICIO-Y-NAVEGACION.md §2). Por ahora saluda sin nombre, porque el perfil no tiene nombre (D-2).
 */
import { Parrafo, Titulo } from '../ui';

export function PantallaDeInicio() {
  return (
    <>
      <Titulo>Hola</Titulo>
      <Parrafo tenue>Elegí una sección en la barra de abajo.</Parrafo>
    </>
  );
}
