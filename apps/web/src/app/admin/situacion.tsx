/**
 * La situación de un área, igual en la lista y en la ficha: un ícono y su palabra. Se reconoce por el texto y por la forma,
 * no por un color (GUIA-UX-UI I.6): ningún color dice «bien» o «mal». El candado cerrado es «no puede operar el área»
 * (suspendida, rechazada o sin habilitación); el abierto, que puede; las dos casillas, lo pendiente de revisión.
 */
import { COPY_ADMINISTRACION, type NombreDeIcono, type SituacionDeArea } from '@be/domain';
import { Icono } from '../../components/icono';

const ICONO: Readonly<Record<SituacionDeArea, NombreDeIcono | null>> = {
  NOT_PRESENTED: null,
  PENDING_REVIEW: 'pendientes',
  CAN_OPERATE: 'acceso',
  VERIFIED_NOT_ENABLED: 'candado',
  SUSPENDED: 'candado',
  REJECTED: 'candado',
};

const CLASE: Readonly<Record<SituacionDeArea, string>> = {
  NOT_PRESENTED: 'situacion--sin-presentacion',
  PENDING_REVIEW: 'situacion--pendiente',
  CAN_OPERATE: 'situacion--opera',
  VERIFIED_NOT_ENABLED: 'situacion--no-opera',
  SUSPENDED: 'situacion--no-opera',
  REJECTED: 'situacion--no-opera',
};

export function Situacion({ situacion }: { situacion: SituacionDeArea }) {
  const icono = ICONO[situacion];
  return (
    <span className={`situacion ${CLASE[situacion]}`}>
      {icono ? <Icono nombre={icono} tamano={18} /> : null}
      {COPY_ADMINISTRACION.situacion[situacion]}
    </span>
  );
}
