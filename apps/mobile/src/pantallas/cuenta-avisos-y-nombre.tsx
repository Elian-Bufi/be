/**
 * Dos secciones de Cuenta en la APK.
 * - **Avisos en este teléfono** (WP-NOVEDADES-Y-AVISOS, DL-133; RF-062): activarlos pide el permiso de Android en ese
 *   momento; un aviso dice solo que hay algo para ver, sin datos de salud ni nombres. Con los avisos activos, los
 *   recordatorios diarios de registro: comidas (15:00 y 22:00) y entrenamiento (22:00), si ese día no hay ninguno. Al
 *   activar los avisos por primera vez los dos recordatorios se encienden, porque se activan para eso; se apagan con su
 *   casilla. Sin Firebase en esta versión, se dice que no están disponibles: las novedades siguen en su pantalla.
 * - **Tu nombre** (DL-009 y DL-040, decididas por Dirección el 2026-10-15): el que ven tus profesionales mientras tengas un
 *   vínculo vigente con ellos. Se cambia o se quita; cada cambio es una versión.
 */
import {
  COPY_NOVEDADES,
  LARGO_MAXIMO_DEL_NOMBRE_VISIBLE,
  nombreVisibleValido,
  normalizarNombreVisible,
  type PerfilPropio,
  type PreferenciasDeAvisos,
  type Resultado,
} from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { activar, desactivar, estadoGuardado, type EstadoDeAvisos } from '../avisos';
import { dependenciasDeAvisos } from '../avisos-del-telefono';
import { Cargando, ErrorConReintento } from '../estados';
import { Aviso, Boton, Campo, Casilla, Parrafo, Seccion } from '../ui';

type Carga<T> = { tipo: 'cargando' } | { tipo: 'listo'; datos: T } | { tipo: 'error'; sinConexion: boolean };

export function SeccionDeAvisos({ token, identidadId, sesionPerdida }: { token: string; identidadId: string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const [estado, setEstado] = useState<EstadoDeAvisos | null>(null);
  const [preferencias, setPreferencias] = useState<Carga<PreferenciasDeAvisos & { updatedAt: string | null }>>({ tipo: 'cargando' });
  const [ocupado, setOcupado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargarPreferencias = useCallback(async () => {
    setPreferencias({ tipo: 'cargando' });
    const r = await api.consultarPreferenciasDeAvisos(token);
    if (sesionPerdida(r)) return;
    setPreferencias(r.ok ? { tipo: 'listo', datos: r.datos.data } : { tipo: 'error', sinConexion: r.tipo === 'RED' });
  }, [token, sesionPerdida]);

  useEffect(() => {
    void estadoGuardado(dependenciasDeAvisos, identidadId).then(setEstado);
    void cargarPreferencias();
  }, [identidadId, cargarPreferencias]);

  async function guardarPreferencias(nuevas: PreferenciasDeAvisos) {
    setGuardando(true);
    setAviso(null);
    const r = await api.reemplazarPreferenciasDeAvisos(token, nuevas);
    setGuardando(false);
    if (sesionPerdida(r)) return;
    if (r.ok) setPreferencias({ tipo: 'listo', datos: r.datos.data });
    else setAviso(r.tipo === 'RED' ? 'No pudimos guardar el cambio: no hay conexión. Probá de nuevo.' : 'No pudimos guardar el cambio. Probá de nuevo.');
  }

  async function alternar() {
    if (ocupado) return;
    setOcupado(true);
    setAviso(null);
    const sesion = { token, identidadId };
    const nuevo = estado?.tipo === 'activos' ? await desactivar(dependenciasDeAvisos, sesion) : await activar(dependenciasDeAvisos, sesion);
    setOcupado(false);
    if (nuevo.tipo === 'error') {
      if (sesionPerdida(nuevo.resultado)) return;
      setAviso(nuevo.sinConexion ? 'No hay conexión: no sabemos si el cambio quedó. Probá de nuevo.' : 'No pudimos registrar el cambio. Probá de nuevo.');
      return;
    }
    setEstado(nuevo);
    // La primera vez que se activan, los recordatorios se encienden: los avisos se activan para eso.
    if (nuevo.tipo === 'activos' && preferencias.tipo === 'listo' && preferencias.datos.updatedAt === null) {
      void guardarPreferencias({ mealLogReminder: true, trainingLogReminder: true });
    }
  }

  const activos = estado?.tipo === 'activos';
  return (
    <Seccion titulo={COPY_NOVEDADES.avisosTitulo}>
      <Parrafo tenue>{COPY_NOVEDADES.avisosExplicacion}</Parrafo>
      {estado === null ? <Cargando /> : null}
      {estado?.tipo === 'activos' ? <Parrafo>{COPY_NOVEDADES.avisosActivos}</Parrafo> : null}
      {estado?.tipo === 'apagados' ? <Parrafo>{COPY_NOVEDADES.avisosInactivos}</Parrafo> : null}
      {estado?.tipo === 'sin-permiso' ? <Aviso tipo="info" titulo={COPY_NOVEDADES.avisosSinPermiso} /> : null}
      {estado?.tipo === 'no-disponibles' ? <Aviso tipo="info" titulo={COPY_NOVEDADES.avisosNoDisponibles} /> : null}
      {aviso ? <Aviso tipo="error" titulo={aviso} /> : null}
      {estado !== null ? (
        <Boton
          texto={ocupado ? 'Un momento…' : activos ? COPY_NOVEDADES.avisosDesactivar : COPY_NOVEDADES.avisosActivar}
          tipo={activos ? 'secundario' : 'primario'}
          onPress={() => void alternar()}
          ocupado={ocupado}
        />
      ) : null}
      {activos ? (
        <>
          {preferencias.tipo === 'cargando' ? <Cargando /> : null}
          {preferencias.tipo === 'error' ? <ErrorConReintento sinConexion={preferencias.sinConexion} onReintentar={cargarPreferencias} /> : null}
          {preferencias.tipo === 'listo' ? (
            <>
              <Casilla
                marcada={preferencias.datos.mealLogReminder}
                titulo="Comidas"
                texto={COPY_NOVEDADES.recordatorioComidas}
                onCambio={(v) => !guardando && void guardarPreferencias({ mealLogReminder: v, trainingLogReminder: preferencias.datos.trainingLogReminder })}
              />
              <Casilla
                marcada={preferencias.datos.trainingLogReminder}
                titulo="Entrenamiento"
                texto={COPY_NOVEDADES.recordatorioEntrenamiento}
                onCambio={(v) => !guardando && void guardarPreferencias({ mealLogReminder: preferencias.datos.mealLogReminder, trainingLogReminder: v })}
              />
              <Parrafo tenue>{COPY_NOVEDADES.recordatoriosExplicacion}</Parrafo>
            </>
          ) : null}
        </>
      ) : null}
    </Seccion>
  );
}

export function SeccionDeTuNombre({ token, sesionPerdida }: { token: string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const [perfil, setPerfil] = useState<Carga<PerfilPropio>>({ tipo: 'cargando' });
  const [texto, setTexto] = useState('');
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const cargar = useCallback(async () => {
    setPerfil({ tipo: 'cargando' });
    const r = await api.consultarPerfilPropio(token);
    if (sesionPerdida(r)) return;
    if (r.ok) {
      setPerfil({ tipo: 'listo', datos: r.datos.data });
      setTexto(r.datos.data.displayName ?? '');
    } else setPerfil({ tipo: 'error', sinConexion: r.tipo === 'RED' });
  }, [token, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function guardar(quitar: boolean) {
    if (perfil.tipo !== 'listo' || guardando) return;
    const nombre = quitar ? null : nombreVisibleValido(texto);
    if (!quitar && nombre === null) {
      setError(`Escribí un nombre de 1 a ${LARGO_MAXIMO_DEL_NOMBRE_VISIBLE} caracteres.`);
      return;
    }
    setGuardando(true);
    setError(null);
    setGuardado(false);
    const r = await api.editarPerfilPropio(token, { expectedVersion: perfil.datos.version, changes: { displayName: nombre } });
    setGuardando(false);
    if (sesionPerdida(r)) return;
    if (r.ok) {
      setPerfil({ tipo: 'listo', datos: r.datos.data });
      setTexto(r.datos.data.displayName ?? '');
      setEditando(false);
      setGuardado(true);
      return;
    }
    if (r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') {
      setError('Tu nombre cambió en otro lugar. Lo volvimos a leer: revisalo y guardá de nuevo.');
      void cargar();
      return;
    }
    setError(r.tipo === 'RED' ? 'No hay conexión: no sabemos si el cambio quedó. Probá de nuevo.' : 'No pudimos guardar tu nombre. Probá de nuevo.');
  }

  return (
    <Seccion titulo="Tu nombre">
      {perfil.tipo === 'cargando' ? <Cargando /> : null}
      {perfil.tipo === 'error' ? <ErrorConReintento sinConexion={perfil.sinConexion} onReintentar={cargar} /> : null}
      {perfil.tipo === 'listo' ? (
        <>
          <Parrafo>{perfil.datos.displayName ? perfil.datos.displayName : 'Todavía no pusiste un nombre: tus profesionales te ven por una referencia.'}</Parrafo>
          <Parrafo tenue>Es el nombre que ven tus profesionales mientras tengas un vínculo vigente con ellos. Nunca ven tu correo.</Parrafo>
          {guardado ? <Aviso tipo="exito" titulo={COPY_NOVEDADES.guardado} /> : null}
          {editando ? (
            <>
              <Campo
                etiqueta="Nombre"
                value={texto}
                onChangeText={setTexto}
                onBlur={() => setTexto(normalizarNombreVisible(texto))}
                maxLength={LARGO_MAXIMO_DEL_NOMBRE_VISIBLE + 20}
                autoCapitalize="words"
                autoComplete="name"
                error={error}
              />
              <Boton texto={guardando ? 'Guardando…' : 'Guardar'} onPress={() => void guardar(false)} ocupado={guardando} />
              {perfil.datos.displayName ? <Boton texto="Quitar mi nombre" tipo="secundario" onPress={() => void guardar(true)} deshabilitado={guardando} /> : null}
              <Boton
                texto="Cancelar"
                tipo="secundario"
                onPress={() => {
                  setEditando(false);
                  setError(null);
                  setTexto(perfil.datos.displayName ?? '');
                }}
                deshabilitado={guardando}
              />
            </>
          ) : (
            <Boton texto={perfil.datos.displayName ? 'Cambiar mi nombre' : 'Poner mi nombre'} tipo="secundario" onPress={() => setEditando(true)} />
          )}
          {!editando && error ? <Aviso tipo="error" titulo={error} /> : null}
        </>
      ) : null}
    </Seccion>
  );
}
