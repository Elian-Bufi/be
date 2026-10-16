/**
 * APK · Invitación de un profesional (WP-INVITACION; DEUDA_LEGAJO DL-136), decidida por Dirección el 2026-10-16.
 * - Llega con el secreto del enlace (App Link o `be://`, `src/enlace-de-invitacion.ts`) o sin nada, desde «Tengo un
 *   código»: ahí se escribe el código.
 * - Primero se ve quién invita y para qué área (API-INV-04). Si la invitación ya no sirve, se dice por qué.
 * - «Aceptar vínculo» es la misma decisión de 10-B04 que en Vínculos, con su texto (`confirmarAceptacion`): usa la
 *   invitación (API-INV-05, que crea la solicitud del profesional) y la acepta (REL-03), en ese orden. Aceptar no
 *   autoriza el acceso: el paso siguiente es revisar el consentimiento, como en Vínculos (TEST-AUTH-006).
 * - Si ya había una solicitud igual pendiente, se acepta en Vínculos, donde está.
 */
import { COPY, COPY_INVITACION, COPY_VINCULO, normalizarCodigo, type Resultado, type SecretoDeInvitacionRequest, type VistaPreviaDeInvitacionResponse } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useClaveDeIntento } from '../intento';
import { useSesionPerdida, type Ruta, type Salida } from '../navegacion';
import { Aviso, Boton, Campo, Parrafo, Titulo } from '../ui';

type Vista = VistaPreviaDeInvitacionResponse['data'];
type Estado =
  | { readonly tipo: 'escribiendo'; readonly error?: string }
  | { readonly tipo: 'buscando' }
  | { readonly tipo: 'vista'; readonly vista: Vista; readonly error?: string }
  | { readonly tipo: 'aceptando'; readonly vista: Vista }
  | { readonly tipo: 'aceptada'; readonly vinculoId: string }
  | { readonly tipo: 'sin-salida'; readonly texto: string };

/** Por qué una invitación no sirve, dicho para la persona. Lo demás, el mensaje general. */
function motivoDe(r: Resultado<unknown>): string {
  if (r.ok) return COPY.noDisponible;
  if (r.tipo !== 'API') return COPY.resultadoIncierto;
  switch (r.codigo) {
    case 'RESOURCE_NOT_FOUND':
      return COPY_INVITACION.noEncontrada;
    case 'INVITATION_EXPIRED':
      return COPY_INVITACION.vencida;
    case 'INVITATION_USED':
      return COPY_INVITACION.usada;
    case 'INVITATION_REVOKED':
      return COPY_INVITACION.anuladaParaLaPersona;
    case 'COUNTERPART_NOT_ELIGIBLE':
      return COPY_INVITACION.propia;
    case 'RESOURCE_CONFLICT':
      return COPY_INVITACION.yaVinculados;
    case 'RATE_LIMITED':
      return COPY_INVITACION.muchosIntentos;
    default:
      return COPY.noDisponible;
  }
}

/** El estado de una vista previa que ya no se puede usar, con su motivo. `null` si está pendiente. */
function noSirve(v: Vista): string | null {
  if (v.state === 'EXPIRED') return COPY_INVITACION.vencida;
  if (v.state === 'USED') return COPY_INVITACION.usada;
  if (v.state === 'REVOKED') return COPY_INVITACION.anuladaParaLaPersona;
  return null;
}

export function PantallaDeInvitacion({
  token,
  secreto: delEnlace,
  salir,
  ir,
}: {
  token: string;
  /** El secreto que trajo el enlace; sin él, la persona escribe el código. */
  secreto?: SecretoDeInvitacionRequest;
  salir: (motivo: Salida) => void;
  ir: (r: Ruta) => void;
}) {
  const sesionPerdida = useSesionPerdida(salir);
  const usar = useClaveDeIntento();
  const aceptar = useClaveDeIntento();
  const [codigo, setCodigo] = useState('');
  const [secreto, setSecreto] = useState<SecretoDeInvitacionRequest | null>(delEnlace ?? null);
  const [estado, setEstado] = useState<Estado>(delEnlace ? { tipo: 'buscando' } : { tipo: 'escribiendo' });

  const ver = useCallback(
    async (s: SecretoDeInvitacionRequest) => {
      setEstado({ tipo: 'buscando' });
      const r = await api.verInvitacion(token, s);
      if (r.ok) return setEstado({ tipo: 'vista', vista: r.datos.data });
      if (sesionPerdida(r)) return;
      // Un código mal escrito se corrige acá mismo; un enlace que no sirve no tiene arreglo en la app.
      setEstado('code' in s ? { tipo: 'escribiendo', error: motivoDe(r) } : { tipo: 'sin-salida', texto: motivoDe(r) });
    },
    [token, sesionPerdida],
  );

  useEffect(() => {
    if (delEnlace) void ver(delEnlace);
  }, [delEnlace, ver]);

  function buscar() {
    const normalizado = normalizarCodigo(codigo);
    if (!normalizado) return setEstado({ tipo: 'escribiendo', error: COPY_INVITACION.noEncontrada });
    const s = { code: codigo };
    setSecreto(s);
    void ver(s);
  }

  async function decidir(vista: Vista) {
    if (!secreto) return;
    setEstado({ tipo: 'aceptando', vista });
    // 1) Usar la invitación: crea la solicitud del profesional dirigida a esta cuenta (o devuelve la igual pendiente).
    const usada = await api.usarInvitacion(token, secreto, usar.actual());
    usar.registrar(usada);
    if (!usada.ok) {
      if (sesionPerdida(usada)) return;
      return setEstado({ tipo: 'vista', vista, error: motivoDe(usada) });
    }
    const solicitud = usada.datos.data;
    // Ya había una igual pendiente: se acepta en Vínculos, con su versión a la vista.
    if (!('version' in solicitud)) return ir({ nombre: 'vinculos' });
    // 2) Aceptarla: la misma decisión explícita de 10-B04 que en Vínculos.
    const r = await api.aceptarSolicitud(token, solicitud.relationshipRequestId, solicitud.version, aceptar.actual());
    aceptar.registrar(r);
    if (r.ok) return setEstado({ tipo: 'aceptada', vinculoId: r.datos.data.relationshipId });
    if (sesionPerdida(r)) return;
    // La solicitud ya existe: si aceptarla falló, queda en Vínculos para decidir ahí.
    setEstado({ tipo: 'sin-salida', texto: `${motivoDe(r)} La solicitud quedó en Vínculos.` });
  }

  return (
    <>
      <Titulo>Invitación</Titulo>

      {estado.tipo === 'escribiendo' ? (
        <>
          {estado.error ? <Aviso tipo="error" titulo={estado.error} /> : null}
          <Campo
            etiqueta={COPY_INVITACION.escribirCodigo}
            ayuda={COPY_INVITACION.codigoEjemplo}
            value={codigo}
            onChangeText={setCodigo}
            autoCapitalize="characters"
            autoCorrect={false}
            onSubmitEditing={buscar}
          />
          <Boton texto={COPY_INVITACION.verInvitacion} onPress={buscar} />
        </>
      ) : null}

      {estado.tipo === 'buscando' ? <Parrafo tenue>{COPY_INVITACION.buscando}</Parrafo> : null}

      {estado.tipo === 'vista' || estado.tipo === 'aceptando' ? (
        <>
          <Parrafo>{COPY_INVITACION.teInvita(estado.vista.professional.displayName, estado.vista.scope.label)}</Parrafo>
          {noSirve(estado.vista) ? (
            <Aviso tipo="error" titulo={noSirve(estado.vista) ?? undefined} />
          ) : (
            <>
              {estado.tipo === 'vista' && estado.error ? <Aviso tipo="error" titulo={estado.error} /> : null}
              {/* 10-B04:265: lo que implica aceptar, justo encima del botón, como en Vínculos. */}
              <Parrafo>{COPY_VINCULO.confirmarAceptacion(estado.vista.professional.displayName, estado.vista.scope.label)}</Parrafo>
              <Boton
                texto={estado.tipo === 'aceptando' ? 'Aceptando…' : COPY_VINCULO.aceptarVinculo}
                onPress={() => void decidir(estado.vista)}
                ocupado={estado.tipo === 'aceptando'}
              />
              <Boton texto={COPY_INVITACION.ahoraNo} tipo="secundario" onPress={() => ir({ nombre: 'vinculos' })} deshabilitado={estado.tipo === 'aceptando'} />
            </>
          )}
        </>
      ) : null}

      {estado.tipo === 'aceptada' ? (
        <Aviso tipo="exito" titulo={COPY_VINCULO.vinculoAceptado}>
          <Parrafo>{COPY_VINCULO.vinculoAceptadoDetalle}</Parrafo>
          <Boton texto={COPY_VINCULO.revisarConsentimiento} onPress={() => ir({ nombre: 'consentimiento', vinculoId: estado.vinculoId })} />
        </Aviso>
      ) : null}

      {estado.tipo === 'sin-salida' ? (
        <>
          <Aviso tipo="error" titulo={estado.texto} />
          <Boton texto={COPY_INVITACION.tengoUnCodigo} tipo="secundario" onPress={() => setEstado({ tipo: 'escribiendo' })} />
        </>
      ) : null}
    </>
  );
}
