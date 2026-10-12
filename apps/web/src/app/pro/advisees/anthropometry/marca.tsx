/**
 * La marca de un dato de Antropometría: su ícono y su texto («Medido», «Corregida», «Anulada»…). Qué marcas lleva una
 * medición lo decide el dominio (`excepcionesDeLaMedicion`, `marcaDeLaClase`); acá solo se dibuja. El ícono no dice nada
 * que el texto no diga: va oculto para el lector de pantalla.
 */
import type { MarcaDeMedicion, NombreDeIcono } from '@be/domain';
import { Icono } from '../../../../components/icono';

const ICONO_DE_MARCA: Readonly<Record<MarcaDeMedicion['clase'], NombreDeIcono>> = {
  medido: 'medido',
  reportado: 'reportado',
  calculado: 'calculado',
  corregido: 'corregido',
  anulado: 'anulado',
  'sin-valor': 'sin-datos',
};

export function Marca({ marca }: { marca: MarcaDeMedicion }) {
  return (
    <span className="etiqueta-de-dato" data-marca={marca.clase}>
      <Icono nombre={ICONO_DE_MARCA[marca.clase]} tamano={15} />
      {marca.texto}
    </span>
  );
}
