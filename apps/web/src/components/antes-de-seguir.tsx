'use client';

/**
 * «Antes de seguir» (WP-USO-FINAL UF-01 y UF-D4; DL-169; TEST-UF-005): la compuerta de `/account` y `/pro`. Va en los
 * layouts de las dos rutas, así ninguna página se la saltea. La consola `/admin` usa otra identidad y queda afuera.
 * Con una sesión de persona o de profesional, antes de mostrar la página se pregunta a la API qué falta para seguir
 * (API-ACC-07, `pasoQueSigue`):
 * - **Nada:** va la página. Se pregunta una vez por sesión: con la misma sesión, cambiar de página, o de `/account` a
 *   `/pro`, no vuelve a preguntar.
 * - **El nombre** (una cuenta anterior a DL-169): en lugar de la página, «¿Cómo te llamás?», con el nombre profesional
 *   propuesto si la identidad lo tiene. No se puede saltear, y «Cerrar sesión» siempre está. Guardar lee el perfil propio
 *   para su `expectedVersion` (API-ACC-06-PROPIA) y lo cambia (API-ACC-06); después se vuelve a preguntar.
 * - **Un paso que este website no conoce:** pide recargar la página; tampoco se saltea.
 * - **Sin respuesta:** «Reintentar», como cualquier vista que no cargó, y se reintenta solo al volver la conexión. No se
 *   deja pasar.
 * Sin sesión, cada página hace lo de siempre: mandar a Iniciar sesión, o mostrarse si no la pide. Mientras la sesión se
 * recupera, o mientras se pregunta, la página todavía no se monta: no lee nada antes de tiempo ni se monta dos veces.
 * Accesible: el paso lleva el foco a su título al aparecer, el campo tiene su etiqueta y su error, y los avisos se anuncian.
 */
import { clasificarFalla, COPY, COPY_DEL_NOMBRE, COPY_TEXTOS_VIGENTES, type PerfilPropio, type TextoAAceptar, type VersionDeTexto } from '@be/domain';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { api, type Resultado } from '../lib/api';
import { CERRANDO_SESION, useCerrarSesion } from '../lib/cerrar-sesion';
import { alGuardarElNombre, errorDelNombre, pasoQueSigue, yaSeGuardo, type PasoQueSigue } from '../lib/nombre-y-apellido';
import { EsperandoSesion, useSesion } from '../lib/sesion';
import { useSesionPerdida } from '../lib/sesion-requerida';
import { Encabezado } from './encabezado';
import { Cargando, ErrorConReintento } from './estados';
import { CierreDeCuenta } from '../app/account/cuenta';
import { dia } from '../lib/formato';
import { Aviso, ResumenDeErrores } from './formulario';
import { NavegacionDeCuenta, NavegacionProfesional } from './navegacion';
import { CampoDeNombreYApellido } from './nombre-y-apellido';

type Espacio = 'cuenta' | 'pro';

/**
 * La sesión a la que API-ACC-07 ya le dijo que no falta nada: con ella, esta pestaña no vuelve a preguntar. Vive en la
 * memoria de la pestaña, como la sesión; otra sesión (otro token) pregunta de nuevo.
 */
let sinPendientes: string | null = null;

/** Lo que respondió API-ACC-07 y para qué sesión: una respuesta de otra sesión no cuenta. */
type Lectura = { readonly para: string; readonly paso: PasoQueSigue };

export function AntesDeSeguir({ espacio, children }: { espacio: Espacio; children: ReactNode }) {
  const ruta = usePathname();
  const { sesion, restaurando } = useSesion();
  const token = sesion?.token ?? null;
  const { sesionPerdida } = useSesionPerdida(ruta);
  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const [vuelta, setVuelta] = useState(0);
  // La última `sesionPerdida`: cambia con la ruta, y lo que falta para seguir no depende de la ruta.
  const perdida = useRef(sesionPerdida);
  perdida.current = sesionPerdida;

  /** La sesión ya no sirve: se olvida y se vuelve a Iniciar sesión. Mientras tanto, la página no se monta. */
  const alPerderLaSesion = useCallback((r: Resultado<unknown>): boolean => {
    if (r.ok || clasificarFalla(r) !== 'sesion') return false;
    setSaliendo(true);
    return perdida.current(r);
  }, []);
  const preguntarDeNuevo = useCallback(() => setVuelta((n) => n + 1), []);

  useEffect(() => {
    if (!token || token === sinPendientes) return;
    let vigente = true;
    setLectura(null);
    void api.loQueFaltaParaSeguir(token).then((r) => {
      if (!vigente) return;
      const paso = pasoQueSigue(r);
      if (paso.tipo === 'sesion') {
        alPerderLaSesion(r);
        return;
      }
      if (paso.tipo === 'seguir') sinPendientes = token;
      setLectura({ para: token, paso });
    });
    return () => {
      vigente = false;
    };
  }, [token, vuelta, alPerderLaSesion]);

  const paso: PasoQueSigue | null = token === null ? null : token === sinPendientes ? { tipo: 'seguir' } : lectura?.para === token ? lectura.paso : null;

  // Sin conexión no se deja pasar: se reintenta al tocar «Reintentar» o, solo, cuando vuelve la conexión.
  const sinRespuesta = paso?.tipo === 'sin-respuesta';
  useEffect(() => {
    if (!sinRespuesta) return;
    window.addEventListener('online', preguntarDeNuevo);
    return () => window.removeEventListener('online', preguntarDeNuevo);
  }, [sinRespuesta, preguntarDeNuevo]);

  if (saliendo) {
    return (
      <Marco espacio={espacio}>
        <EsperandoSesion />
      </Marco>
    );
  }
  if (token === null) {
    if (!restaurando) return <>{children}</>;
    return (
      <Marco espacio={espacio}>
        <EsperandoSesion />
      </Marco>
    );
  }
  if (paso === null) {
    return (
      <Marco espacio={espacio}>
        <Cargando />
      </Marco>
    );
  }
  switch (paso.tipo) {
    case 'seguir':
      return <>{children}</>;
    case 'nombre':
      return (
        <MarcoDelPaso>
          <PasoDelNombre key={token} token={token} sugerencia={paso.sugerencia} alGuardar={preguntarDeNuevo} alPerderLaSesion={alPerderLaSesion} />
        </MarcoDelPaso>
      );
    case 'textos':
      return (
        <MarcoDelPaso>
          <PasoDeLosTextos key={token} token={token} pendientes={paso.pendientes} alAceptar={preguntarDeNuevo} alPerderLaSesion={alPerderLaSesion} />
        </MarcoDelPaso>
      );
    case 'desconocido':
      return (
        <MarcoDelPaso>
          <PasoDesconocido />
        </MarcoDelPaso>
      );
    case 'sin-respuesta':
    case 'sesion':
      return (
        <Marco espacio={espacio}>
          <ErrorConReintento onReintentar={preguntarDeNuevo} />
        </Marco>
      );
  }
}

/** Mientras se espera o si no hubo respuesta: el encabezado de la página, con su navegación, para que nada salte. */
function Marco({ espacio, children }: { espacio: Espacio; children: ReactNode }) {
  return (
    <>
      <Encabezado navegacion={espacio === 'pro' ? <NavegacionProfesional /> : <NavegacionDeCuenta />} />
      <main id="contenido" className="contenido">
        {children}
      </main>
    </>
  );
}

/** El paso, solo: sin la navegación ni las novedades, que llevarían a otra pantalla. El menú de la cuenta queda. */
function MarcoDelPaso({ children }: { children: ReactNode }) {
  return (
    <>
      <Encabezado campana={false} />
      <main id="contenido" className="contenido acceso">
        {children}
      </main>
    </>
  );
}

/** El título del paso, con el foco al aparecer: el lector de pantalla anuncia dónde está la persona. */
function TituloDelPaso() {
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titulo.current?.focus();
  }, []);
  return (
    <h1 ref={titulo} tabIndex={-1}>
      {COPY_DEL_NOMBRE.antesDeSeguir}
    </h1>
  );
}

/** «Cerrar sesión», siempre a mano en el paso. */
function CerrarSesion({ salida }: { salida: ReturnType<typeof useCerrarSesion> }) {
  return (
    <button type="button" className="boton boton--secundario" onClick={() => void salida.cerrar()} disabled={salida.cerrando} aria-busy={salida.cerrando}>
      {salida.cerrando ? CERRANDO_SESION : COPY_DEL_NOMBRE.salir}
    </button>
  );
}

function ProblemaAlCerrar({ salida }: { salida: ReturnType<typeof useCerrarSesion> }) {
  if (!salida.problema) return null;
  return (
    <p className="campo__error" role="alert">
      {salida.problema}
    </p>
  );
}

const ID_DEL_CAMPO = 'antes-de-seguir-nombre';

/**
 * El paso del nombre. `sugerencia` es el nombre profesional de la identidad, si tiene perfil profesional: llega escrito,
 * y la persona lo confirma o lo corrige.
 * - Antes de enviar, la misma regla que la API (vacío, largo o con invisibles): el error va al campo y al resumen.
 * - Guardar lee el perfil propio para su versión (la primera vez) y lo cambia con esa versión.
 * - 409: el nombre cambió en otro lugar. Se vuelve a leer, se muestra y se dice; se guarda de nuevo con la versión nueva.
 *   Si lo que se leyó es justo lo que se quería guardar, el intento anterior (sin respuesta) se guardó: se sigue.
 * - 422: el error vuelve al campo. Sin respuesta: se dice, y reintentar es seguro por la versión.
 */
function PasoDelNombre({
  token,
  sugerencia,
  alGuardar,
  alPerderLaSesion,
}: {
  token: string;
  sugerencia: string | null;
  alGuardar: () => void;
  alPerderLaSesion: (r: Resultado<unknown>) => boolean;
}) {
  const salida = useCerrarSesion();
  const [escrito, setEscrito] = useState(sugerencia ?? '');
  const [version, setVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [intento, setIntento] = useState(0);

  /** El perfil propio, para la versión con que se guarda. `null` si no se pudo leer (y ya se dijo por qué). */
  async function leerElPerfil(): Promise<PerfilPropio | null> {
    const r = await api.consultarPerfilPropio(token);
    if (r.ok) {
      setVersion(r.datos.data.version);
      return r.datos.data;
    }
    if (!alPerderLaSesion(r)) setAviso(COPY.noDisponible);
    return null;
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (guardando) return;
    setAviso(null);
    const problema = errorDelNombre(escrito);
    setError(problema);
    setIntento((n) => n + 1);
    if (problema) return;
    setGuardando(true);
    try {
      const conVersion = version ?? (await leerElPerfil())?.version ?? null;
      if (conVersion === null) return;
      const r = await api.editarPerfilPropio(token, { expectedVersion: conVersion, changes: { displayName: escrito } });
      const que = alGuardarElNombre(r);
      switch (que.tipo) {
        case 'guardado':
          return alGuardar();
        case 'campo':
          setError(que.mensaje);
          setIntento((n) => n + 1);
          return;
        case 'sesion':
          alPerderLaSesion(r);
          return;
        case 'aviso':
          setAviso(que.mensaje);
          return;
        case 'releer': {
          const perfil = await leerElPerfil();
          if (!perfil) return;
          if (yaSeGuardo(perfil, escrito)) return alGuardar();
          if (perfil.displayName) setEscrito(perfil.displayName);
          setAviso(COPY_DEL_NOMBRE.cambioEnOtroLugar);
          return;
        }
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <TituloDelPaso />
      <form className="formulario" onSubmit={guardar} noValidate aria-labelledby="antes-de-seguir-pregunta" aria-describedby="antes-de-seguir-explicacion">
        <ResumenDeErrores titulo={COPY.resumenDeErrores(error ? 1 : 0)} errores={error ? [{ id: ID_DEL_CAMPO, texto: error }] : []} intento={intento} />
        {aviso ? (
          <Aviso tipo="error" enfocar>
            <p>{aviso}</p>
          </Aviso>
        ) : null}
        <h2 id="antes-de-seguir-pregunta">{COPY_DEL_NOMBRE.pregunta}</h2>
        <p id="antes-de-seguir-explicacion">{COPY_DEL_NOMBRE.explicacion}</p>
        <CampoDeNombreYApellido
          id={ID_DEL_CAMPO}
          valor={escrito}
          alCambiar={setEscrito}
          error={error}
          ayuda={sugerencia ? COPY_DEL_NOMBRE.ayudaConElNombreProfesional : COPY_DEL_NOMBRE.ayuda}
        />
        <div className="acciones">
          <button type="submit" className="boton boton--primario" disabled={guardando} aria-busy={guardando}>
            {guardando ? COPY_DEL_NOMBRE.guardando : COPY_DEL_NOMBRE.guardarYSeguir}
          </button>
          <CerrarSesion salida={salida} />
        </div>
        <ProblemaAlCerrar salida={salida} />
      </form>
    </>
  );
}

/**
 * UF-05 (DL-169): la versión vigente de los términos y de la información de privacidad, cada una con su texto completo, su
 * versión y su fecha. Aceptar manda la versión que se mostró (API-ACC-08), de a una, y vuelve a preguntar qué falta. Si la
 * API dice que ya no es la vigente, se pide recargar. No se saltea: se puede cerrar sesión o cerrar la cuenta.
 */
function PasoDeLosTextos({
  token,
  pendientes,
  alAceptar,
  alPerderLaSesion,
}: {
  token: string;
  pendientes: readonly { readonly texto: TextoAAceptar; readonly version: VersionDeTexto }[];
  alAceptar: () => void;
  alPerderLaSesion: (r: Resultado<unknown>) => boolean;
}) {
  const salida = useCerrarSesion();
  const router = useRouter();
  const { olvidar } = useSesion();
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function aceptar(evento: FormEvent) {
    evento.preventDefault();
    if (guardando) return;
    setAviso(null);
    setGuardando(true);
    try {
      for (const p of pendientes) {
        const r = await api.aceptarVersionVigente(token, p.texto, p.version.id);
        if (r.ok) continue;
        if (alPerderLaSesion(r)) return;
        if (r.tipo === 'API' && (r.codigo === 'TERMS_VERSION_NOT_ACCEPTABLE' || r.codigo === 'PRIVACY_VERSION_NOT_ACCEPTABLE')) return setAviso(COPY_TEXTOS_VIGENTES.cambioDeVersionWeb);
        return setAviso(r.tipo === 'RED' ? COPY.resultadoIncierto : COPY.noDisponible);
      }
      alAceptar();
    } finally {
      setGuardando(false);
    }
  }

  const salirA = (destino: string) => {
    olvidar();
    router.replace(destino);
  };

  return (
    <>
      <TituloDelPaso />
      <form className="formulario" onSubmit={aceptar} noValidate>
        {aviso ? (
          <Aviso tipo="error" enfocar>
            <p>{aviso}</p>
          </Aviso>
        ) : null}
        <p>{COPY_TEXTOS_VIGENTES.explicacion}</p>
        {pendientes.map((p) => (
          <section key={p.version.id} className="texto-vigente" aria-labelledby={`texto-${p.version.id}`}>
            <h2 id={`texto-${p.version.id}`}>{COPY_TEXTOS_VIGENTES.titulo[p.texto]}</h2>
            <p className="nota">{COPY_TEXTOS_VIGENTES.version(p.version.id, dia(p.version.vigenteDesde))}</p>
            <div className="texto-vigente__cuerpo" tabIndex={0} role="region" aria-label={`Texto completo: ${COPY_TEXTOS_VIGENTES.titulo[p.texto]}`}>
              {p.version.texto.split('\n\n').map((parrafo, i) => (
                <p key={i}>{parrafo}</p>
              ))}
            </div>
          </section>
        ))}
        <div className="acciones">
          <button type="submit" className="boton boton--primario" disabled={guardando} aria-busy={guardando}>
            {guardando ? COPY_TEXTOS_VIGENTES.aceptando : pendientes.map((p) => COPY_TEXTOS_VIGENTES.aceptar[p.texto]).join(' y ')}
          </button>
          <CerrarSesion salida={salida} />
        </div>
        <ProblemaAlCerrar salida={salida} />
      </form>
      <p>{COPY_TEXTOS_VIGENTES.cerrarCuenta}</p>
      <CierreDeCuenta token={token} alTerminar={() => salirA('/?aviso=cierre-registrado')} alPerderSesion={alPerderLaSesion} alReautenticar={() => salirA('/login?volver=/account&aviso=reautenticar')} />
    </>
  );
}

/** La API pide un paso que este website no sabe resolver: la versión nueva de BE llega al recargar la página. */
function PasoDesconocido() {
  const salida = useCerrarSesion();
  return (
    <>
      <TituloDelPaso />
      <Aviso tipo="info">
        <p>{COPY_DEL_NOMBRE.pasoDesconocidoWeb}</p>
      </Aviso>
      <div className="acciones">
        <CerrarSesion salida={salida} />
      </div>
      <ProblemaAlCerrar salida={salida} />
    </>
  );
}
