/**
 * APK · Consentimiento profesional B2 (CAND-10-CON-01, CON-A y CON-02; 10-B04 §10-§14).
 * - Antes del acto: quién (el profesional y el aviso de su perfil, 08 §12.3), para qué (finalidad), en qué ámbito
 *   (alcance), qué información (categorías pertinentes; sin matriz todavía, se dice y no se inventa: DL-039), la
 *   aclaración obligatoria (10-B04:398) y el texto exacto de la versión que se acepta, con id, vigencia y huella.
 * - El acto es explícito: «Autorizar acceso», sin casilla premarcada ni «continuar = aceptar» (CAND-10-CON-A). Se envía
 *   la versión que la pantalla mostró; profesional, alcance y finalidad son del servidor (09v8:1595-1605).
 * - Vigente con esta misma versión: no hay nada que decidir. Vigente con otra: se avisa que hay una versión nueva. Con el
 *   vínculo en pausa o finalizado la API no admite consentir, y el acto no se ofrece.
 * - Éxito (CAND-10-CON-02): profesional, alcance, finalidad, fecha y estado, con «Ver vínculo». Nunca «Ahora
 *   [Profesional] puede ver todos tus datos».
 */
import {
  COPY,
  COPY_VINCULO,
  ETIQUETA_DE_FINALIDAD,
  type ConsentimientoOtorgadoResponse,
  type DetalleDeVinculoResponse,
  type RequisitosDeConsentimientoResponse,
  type Resultado,
} from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { api } from '../api';
import { Cargando, ErrorConReintento } from '../estados';
import { fecha } from '../formato';
import { falloDe, useClaveDeIntento, type Fallo } from '../intento';
import { useSesionPerdida, type Ruta, type Salida } from '../navegacion';
import { TextoDesplegable } from '../texto-versionado';
import { Aviso, Boton, COLOR, Dato, Parrafo, Subtitulo, Titulo, estilos as ui } from '../ui';

interface Datos {
  readonly req: RequisitosDeConsentimientoResponse['data'];
  readonly v: DetalleDeVinculoResponse['data'];
}
type Carga = { readonly tipo: 'cargando' } | { readonly tipo: 'no-revelable' } | { readonly tipo: 'error'; readonly sinConexion: boolean } | { readonly tipo: 'listo'; readonly datos: Datos };
type Acto =
  | { readonly tipo: 'libre' }
  | { readonly tipo: 'enviando' }
  | { readonly tipo: 'fallo'; readonly fallo: Fallo }
  | { readonly tipo: 'otorgado'; readonly datos: ConsentimientoOtorgadoResponse['data'] }
  | { readonly tipo: 'ya-autorizado' };

const noRevelable = (r: Resultado<unknown>) => !r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND';

export function PantallaDeConsentimiento({
  token,
  vinculoId,
  salir,
  ir,
  volver,
  subir,
}: {
  token: string;
  vinculoId: string;
  salir: (motivo: Salida) => void;
  ir: (r: Ruta) => void;
  volver: () => void;
  /** Lleva la pantalla al principio, donde queda el resultado del acto. */
  subir: () => void;
}) {
  const sesionPerdida = useSesionPerdida(salir);
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });
  const [acto, setActo] = useState<Acto>({ tipo: 'libre' });
  const intento = useClaveDeIntento();
  const enCurso = useRef(false);
  const generacion = useRef(0);

  // CON-01 dice qué se acepta; REL-06, cómo está hoy el vínculo y su consentimiento. CON-01 es solo del asesorado titular.
  const cargar = useCallback(async () => {
    const esta = ++generacion.current;
    setCarga({ tipo: 'cargando' });
    const [req, v] = await Promise.all([api.consultarRequisitosDeConsentimiento(token, vinculoId), api.consultarVinculo(token, vinculoId)]);
    if (esta !== generacion.current || sesionPerdida(req) || sesionPerdida(v)) return;
    if (noRevelable(req) || noRevelable(v)) return setCarga({ tipo: 'no-revelable' });
    if (!req.ok || !v.ok) return setCarga({ tipo: 'error', sinConexion: (!req.ok && req.tipo === 'RED') || (!v.ok && v.tipo === 'RED') });
    setCarga({ tipo: 'listo', datos: { req: req.datos.data, v: v.datos.data } });
  }, [token, vinculoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** Lo que la pantalla mostró ya no es lo vigente: se descarta el intento y se vuelve a leer. */
  const actualizar = () => {
    intento.descartar();
    setActo({ tipo: 'libre' });
    void cargar();
  };

  async function autorizar(versionMostrada: string) {
    if (enCurso.current) return;
    enCurso.current = true;
    setActo({ tipo: 'enviando' });
    const r = await api.otorgarConsentimiento(token, vinculoId, versionMostrada, intento.actual());
    enCurso.current = false;
    intento.registrar(r);
    if (r.ok) {
      setActo({ tipo: 'otorgado', datos: r.datos.data });
      subir();
      return;
    }
    if (sesionPerdida(r)) return;
    if (r.tipo === 'API' && r.codigo === 'CONSENT_ALREADY_ACTIVE') return setActo({ tipo: 'ya-autorizado' });
    setActo({ tipo: 'fallo', fallo: falloDe(r) });
  }

  const irAlVinculo = () => ir({ nombre: 'vinculo', id: vinculoId });

  if (acto.tipo === 'otorgado') {
    const d = acto.datos;
    return (
      <>
        <Titulo>Consentimiento</Titulo>
        <Aviso tipo="exito" titulo={COPY_VINCULO.accesoAutorizado}>
          {carga.tipo === 'listo' ? <Dato etiqueta="Profesional" valor={carga.datos.req.professional.displayName} /> : null}
          <Dato etiqueta={COPY_VINCULO.alcance} valor={d.scope.label} />
          <Dato etiqueta={COPY_VINCULO.finalidad} valor={ETIQUETA_DE_FINALIDAD[d.purpose]} />
          <Dato etiqueta="Fecha" valor={fecha(d.acceptedAt)} />
          <Dato etiqueta="Estado" valor={COPY_VINCULO.estadoDeConsentimiento.ACTIVE} />
          <Boton texto={COPY_VINCULO.verVinculo} onPress={() => ir({ nombre: 'vinculo', id: d.relationshipId })} />
        </Aviso>
      </>
    );
  }

  if (carga.tipo !== 'listo') {
    return (
      <>
        <Titulo>Consentimiento</Titulo>
        {carga.tipo === 'cargando' ? <Cargando /> : null}
        {carga.tipo === 'error' ? <ErrorConReintento sinConexion={carga.sinConexion} onReintentar={() => void cargar()} /> : null}
        {carga.tipo === 'no-revelable' ? (
          <Aviso tipo="info" titulo={COPY_VINCULO.noPudimosAbrir}>
            <Boton texto={COPY_VINCULO.volver} tipo="secundario" onPress={volver} />
          </Aviso>
        ) : null}
      </>
    );
  }

  const { req, v } = carga.datos;
  const profesional = req.professional.displayName;
  const vigente = v.consent?.state === 'ACTIVE' ? v.consent : null;
  const yaAutorizado = acto.tipo === 'ya-autorizado' || (vigente !== null && vigente.consentVersionId === req.consentVersion.id);
  const fallo = acto.tipo === 'fallo' ? acto.fallo : null;
  const enviando = acto.tipo === 'enviando';
  // Con la vista vieja o el vínculo fuera de alcance, autorizar de nuevo fallaría igual.
  const puedeAutorizar = !fallo || fallo.tipo === 'incierto' || fallo.tipo === 'otro';

  return (
    <>
      <Titulo>Consentimiento</Titulo>

      <Text style={estilos.resumen}>
        <Text style={ui.negrita}>{profesional}</Text> {COPY_VINCULO.quiereAcceder}
      </Text>
      <Text style={estilos.destacado}>{ETIQUETA_DE_FINALIDAD[req.purpose]}</Text>
      <Text style={estilos.resumen}>{COPY_VINCULO.dentroDe}</Text>
      <Text style={estilos.destacado}>{req.scope.label}</Text>
      <Parrafo>{req.professionalProfileDisclosure.notice}</Parrafo>

      <Subtitulo>Qué información</Subtitulo>
      {req.pertinentCategories.length === 0 ? <Parrafo>{COPY_VINCULO.sinCategoriasTodavia}</Parrafo> : null}
      {req.pertinentCategories.map((c) => (
        <Parrafo key={c.code}>✓ {c.label}</Parrafo>
      ))}

      <Aviso tipo="info" titulo={COPY_VINCULO.aclaracionDeConsentimiento} />

      <TextoDesplegable version={req.consentVersion} textoDelBoton={COPY_VINCULO.verDetalleCompleto} />

      {v.relationshipState !== 'ACEPTADO' ? (
        <>
          <Dato etiqueta="Estado del vínculo" valor={COPY_VINCULO.estadoDeVinculo[v.relationshipState]} />
          <Boton texto={COPY_VINCULO.verVinculo} tipo="secundario" onPress={irAlVinculo} />
        </>
      ) : yaAutorizado ? (
        <Aviso tipo="info" titulo={COPY_VINCULO.yaAutorizado}>
          <Boton texto={COPY_VINCULO.verVinculo} tipo="secundario" onPress={irAlVinculo} />
        </Aviso>
      ) : (
        <>
          {vigente ? <Aviso tipo="info" titulo={COPY_VINCULO.versionNuevaDeConsentimiento} /> : null}
          {fallo ? (
            <Aviso tipo="error" titulo={fallo.mensaje}>
              {fallo.tipo === 'actualizar' ? <Boton texto="Actualizar" tipo="secundario" onPress={actualizar} /> : null}
              {fallo.tipo === 'no-revelable' ? <Boton texto={COPY_VINCULO.volver} tipo="secundario" onPress={volver} /> : null}
            </Aviso>
          ) : null}
          {puedeAutorizar ? (
            <Boton
              texto={enviando ? 'Autorizando…' : fallo?.tipo === 'incierto' ? COPY.reintentar : COPY_VINCULO.autorizarAcceso}
              onPress={() => void autorizar(req.consentVersion.id)}
              ocupado={enviando}
            />
          ) : null}
        </>
      )}
    </>
  );
}

const estilos = StyleSheet.create({
  resumen: { fontSize: 17, color: COLOR.texto, lineHeight: 24, marginTop: 4 },
  destacado: { fontSize: 19, fontWeight: '700', color: COLOR.texto, marginBottom: 8 },
});
