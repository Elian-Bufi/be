'use client';

/**
 * El campo «Nombre y apellido» (WP-USO-FINAL UF-01, UF-D5; DL-169): uno solo, de 1 a 60 caracteres, el mismo en el alta
 * con correo, en el alta con Google, en «Antes de seguir» y en Cuenta. Lleva su etiqueta y su ayuda del dominio
 * (`COPY_DEL_NOMBRE`), y el error con texto, asociado al campo (`Campo`). Se valida antes de enviar con `errorDelNombre`.
 * Deja escribir un poco más que el máximo, para que un nombre largo se pueda corregir leyendo el error, en vez de
 * cortarse sin aviso.
 */
import { COPY_DEL_NOMBRE, LARGO_MAXIMO_DEL_NOMBRE_VISIBLE } from '@be/domain';
import { Campo } from './formulario';

export function CampoDeNombreYApellido({
  id,
  valor,
  alCambiar,
  error,
  ayuda = COPY_DEL_NOMBRE.ayuda,
}: {
  id: string;
  valor: string;
  alCambiar: (valor: string) => void;
  error?: string | null;
  ayuda?: string;
}) {
  return (
    <Campo
      id={id}
      etiqueta={COPY_DEL_NOMBRE.etiqueta}
      ayuda={ayuda}
      autoComplete="name"
      autoCapitalize="words"
      spellCheck={false}
      required
      maxLength={LARGO_MAXIMO_DEL_NOMBRE_VISIBLE + 20}
      value={valor}
      onChange={(e) => alCambiar(e.target.value)}
      error={error}
    />
  );
}
