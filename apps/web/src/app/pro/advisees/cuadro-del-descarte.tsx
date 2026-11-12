'use client';

/**
 * ED-01 · El cuadro «¿Descartar la versión N en preparación?», igual en los dos editores de planes (maqueta 11 de la v3).
 * - Dice de qué versión salió, que lo armado se borra, que la vigente no cambia y la persona no ve nada distinto, y que no
 *   se deshace; con cambios sin guardar, que también se pierden (`cuadroDelDescarte`).
 * - «Cancelar» tiene el foco al abrirse (la acción de efecto nunca es la opción por defecto); Escape es «Cancelar», y
 *   ninguno de los dos llama a la API.
 * - Un solo botón de efecto, el que descarta, con el color de lo que no se deshace y su nombre completo.
 */
import { COPY_DESCARTAR_LA_VERSION as D } from '@be/domain';
import { DialogoDeConfirmacion } from '../../../components/dialogo';
import { Icono } from '../../../components/icono';
import { cuadroDelDescarte, type VigenteParaElCuadro } from './descartar-el-borrador';

export function CuadroDelDescarte({
  abierto,
  numero,
  vigente,
  sinGuardar,
  enviando,
  error,
  onCancelar,
  onDescartar,
}: {
  abierto: boolean;
  numero: number;
  vigente: VigenteParaElCuadro | null;
  sinGuardar: boolean;
  enviando: boolean;
  error: string | null;
  onCancelar: () => void;
  onDescartar: () => void;
}) {
  const cuadro = cuadroDelDescarte({ numero, vigente, sinGuardar });
  return (
    <DialogoDeConfirmacion
      abierto={abierto}
      titulo={cuadro.titulo}
      textoVolver={D.cancelar}
      textoConfirmar={cuadro.confirmar}
      textoEnviando={D.descartando}
      peligro
      enviando={enviando}
      error={error}
      focoEnVolver
      onVolver={onCancelar}
      onConfirmar={onDescartar}
    >
      <div className="cuadro-del-descarte" data-cuadro-del-descarte>
        {cuadro.parrafos.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="cuadro-del-descarte__aviso">
          <Icono nombre="aviso" tamano={18} />
          <span>
            <strong>{D.noSeDeshace}</strong> {D.paraConservar}
          </span>
        </p>
      </div>
    </DialogoDeConfirmacion>
  );
}
