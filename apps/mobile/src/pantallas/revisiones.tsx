/**
 * APK · Tus revisiones (REV-A; DL-134): las revisiones que tus profesionales registraron sobre vos, completas y sin notas
 * ocultas (08 §6.2; 08:495). Opciones A de la propuesta, tomadas el 2026-10-16 con el mandato de Dirección:
 * - **Completas:** el período, la interpretación, el resultado, el fundamento, la próxima acción, quién y cuándo.
 * - **Desde que se registran,** con su aplicación a la vista: «Todavía no se aplicó» o desde cuándo se aplicó.
 * - **Con el vínculo en pausa o terminado, siguen ahí:** son tu historia (08 §14.3). Sin el A3 vigente, la API no las da
 *   (403), como «Tu historial» (08:406).
 * - Sin juicios ni puntajes: el resultado se dice con su nombre y con lo que significa para tu plan (REG-06-117 y 125).
 * Se abren desde «Plan» de Nutrición o de Entrenamiento, o desde la novedad de una revisión.
 */
import { COPY_REVISIONES_PROPIAS, ETIQUETA_DE_RESULTADO, type Resultado, type Revision, type RevisionDeEntrenamiento } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { api } from '../api';
import { Cargando, ErrorConReintento, EstadoDeCarga, VerMas } from '../estados';
import { dia, fecha } from '../formato';
import { useListaPaginada } from '../lista';
import { useSesionPerdida, type Ir, type Salida } from '../navegacion';
import { Aviso, Dato, Parrafo, Seccion, Titulo, estilosPorTema } from '../ui';

export type AreaDeRevision = 'NUTRICION' | 'ENTRENAMIENTO';
type RevisionPropia = Revision | RevisionDeEntrenamiento;
type PaginaDeRevisiones = { readonly data: readonly RevisionPropia[]; readonly page: { readonly nextCursor: string | null; readonly hasMore: boolean } };

const textoDelArea = (area: AreaDeRevision) => (area === 'NUTRICION' ? 'Nutrición' : 'Entrenamiento');

/** El A3 revocado: la API responde 403 ACTION_FORBIDDEN y se dice por qué, sin mostrar nada. */
const sinA3 = (r: Resultado<unknown>): boolean => !r.ok && r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN';

export function PantallaDeRevisiones({ token, area, salir, ir }: { token: string; area: AreaDeRevision; salir: (m: Salida) => void; ir: Ir }) {
  const sesionPerdida = useSesionPerdida(salir);
  const [bloqueada, setBloqueada] = useState(false);
  const pedir = useCallback(
    async (cursor?: string): Promise<Resultado<PaginaDeRevisiones>> => {
      const r: Resultado<PaginaDeRevisiones> =
        area === 'NUTRICION' ? await api.consultarMisRevisionesNutricionales(token, { cursor }) : await api.consultarMisRevisionesDeEntrenamiento(token, { cursor });
      setBloqueada(sinA3(r));
      return r;
    },
    [token, area],
  );
  const lista = useListaPaginada(pedir, sesionPerdida);

  return (
    <>
      <Titulo>{`${COPY_REVISIONES_PROPIAS.titulo} · ${textoDelArea(area)}`}</Titulo>
      <Parrafo tenue>{COPY_REVISIONES_PROPIAS.explicacion}</Parrafo>
      {bloqueada ? <Aviso tipo="info" titulo={COPY_REVISIONES_PROPIAS.sinA3} /> : <EstadoDeCarga estado={lista.estado} onReintentar={lista.recargar} />}
      {lista.estado.tipo === 'listo' && lista.estado.items.length === 0 ? <Parrafo>{COPY_REVISIONES_PROPIAS.vacio}</Parrafo> : null}
      {lista.estado.tipo === 'listo'
        ? lista.estado.items.map((r) => (
            <Pressable
              key={r.reviewId}
              accessibilityRole="button"
              accessibilityLabel={`${COPY_REVISIONES_PROPIAS.revisionDel(fecha(r.recordedAt))}. ${ETIQUETA_DE_RESULTADO[r.result]}. ${r.author.displayName}`}
              onPress={() => ir({ nombre: 'revision', area, id: r.reviewId })}
              style={({ pressed }) => [estilos.fila, pressed && estilos.presionada]}
            >
              <Text style={estilos.titulo}>{COPY_REVISIONES_PROPIAS.revisionDel(fecha(r.recordedAt))}</Text>
              <Text style={estilos.texto}>
                {ETIQUETA_DE_RESULTADO[r.result]} · {r.author.displayName}
              </Text>
              <Text style={estilos.tenue}>{r.application ? COPY_REVISIONES_PROPIAS.aplicadaEl(dia(r.application.appliedAt)) : COPY_REVISIONES_PROPIAS.sinAplicar}</Text>
            </Pressable>
          ))
        : null}
      <VerMas estado={lista.estado} onVerMas={lista.verMas} />
    </>
  );
}

export function PantallaDeRevision({ token, area, id, salir }: { token: string; area: AreaDeRevision; id: string; salir: (m: Salida) => void }) {
  const sesionPerdida = useSesionPerdida(salir);
  const [estado, setEstado] = useState<{ tipo: 'cargando' } | { tipo: 'listo'; r: RevisionPropia } | { tipo: 'error'; sinConexion: boolean } | { tipo: 'sin-a3' } | { tipo: 'no-disponible' }>({
    tipo: 'cargando',
  });
  const cargar = useCallback(async () => {
    setEstado({ tipo: 'cargando' });
    const r = area === 'NUTRICION' ? await api.consultarMiRevisionNutricional(token, id) : await api.consultarMiRevisionDeEntrenamiento(token, id);
    if (sesionPerdida(r)) return;
    if (r.ok) setEstado({ tipo: 'listo', r: r.datos.data });
    else if (sinA3(r)) setEstado({ tipo: 'sin-a3' });
    else if (r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') setEstado({ tipo: 'no-disponible' });
    else setEstado({ tipo: 'error', sinConexion: r.tipo === 'RED' });
  }, [token, area, id, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (estado.tipo === 'cargando') return <Cargando />;
  if (estado.tipo === 'error') return <ErrorConReintento sinConexion={estado.sinConexion} onReintentar={() => void cargar()} />;
  if (estado.tipo === 'sin-a3') return <Aviso tipo="info" titulo={COPY_REVISIONES_PROPIAS.sinA3} />;
  if (estado.tipo === 'no-disponible') return <Aviso tipo="info" titulo={COPY_REVISIONES_PROPIAS.noDisponible} />;
  const r = estado.r;
  return (
    <>
      <Titulo>{COPY_REVISIONES_PROPIAS.revisionDel(fecha(r.recordedAt))}</Titulo>
      <Dato etiqueta="Área" valor={textoDelArea(area)} />
      <Dato etiqueta="Profesional" valor={r.author.displayName} />
      <Dato etiqueta="Período revisado" valor={`${dia(`${r.period.start}T12:00:00Z`)} al ${dia(`${r.period.end}T12:00:00Z`)}`} />
      <Seccion titulo="Qué observó">
        <Parrafo>{r.interpretation}</Parrafo>
      </Seccion>
      <Seccion titulo="Resultado">
        <Text style={estilos.resultado}>{ETIQUETA_DE_RESULTADO[r.result]}</Text>
        <Parrafo tenue>{COPY_REVISIONES_PROPIAS.queSignifica[r.result]}</Parrafo>
      </Seccion>
      <Seccion titulo="Por qué">
        <Parrafo>{r.rationale}</Parrafo>
      </Seccion>
      <Seccion titulo="Lo que sigue">
        <Parrafo>{r.nextAction.description}</Parrafo>
        {r.nextAction.nextReviewAt ? <Dato etiqueta="Próxima revisión" valor={dia(`${r.nextAction.nextReviewAt}T12:00:00Z`)} /> : null}
      </Seccion>
      <View style={estilos.pie}>
        <Text style={estilos.tenue}>{r.application ? COPY_REVISIONES_PROPIAS.aplicadaEl(dia(r.application.appliedAt)) : COPY_REVISIONES_PROPIAS.sinAplicar}</Text>
      </View>
    </>
  );
}

const estilos = estilosPorTema((COLOR) => ({
  fila: { borderWidth: 1, borderColor: COLOR.borde, borderRadius: 12, padding: 14, marginBottom: 10, backgroundColor: COLOR.superficie, minHeight: 48 },
  presionada: { opacity: 0.7 },
  titulo: { fontSize: 16, fontWeight: '700', color: COLOR.texto },
  texto: { fontSize: 15, color: COLOR.texto, marginTop: 4 },
  tenue: { fontSize: 13, color: COLOR.tenue, marginTop: 4 },
  resultado: { fontSize: 18, fontWeight: '700', color: COLOR.texto, marginBottom: 4 },
  pie: { marginTop: 8 },
}));
