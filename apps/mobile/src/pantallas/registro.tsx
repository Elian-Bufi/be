/**
 * APK · Crear cuenta (PROTO-10-ACC-01). A1, A2 y la declaración de mayoría de edad (08 §24.7 a; DL-138): tres casillas
 * separadas, cada una con etiqueta, versión y texto propios; nunca premarcadas. A3 NO forma parte del registro
 * (10-B02:137-141). Después del alta no hay auto-login (10-B02:170-194).
 * DL-138: «Continuar con Google» arriba del formulario, si el build tiene el client ID. El alta con Google sí abre la
 * sesión (la API la devuelve con la cuenta), y sigue el mismo camino que la del login.
 * DL-169 (WP-USO-FINAL, UF-01 y UF-D5): «Nombre y apellido», obligatorio, arriba del correo. Sin nombre no se envía y el
 * campo dice qué falta; el 422 de la API por el nombre vuelve al campo. La cuenta nace con su nombre (perfil propio v1).
 * UF-08: el aviso de prueba, solo en las builds que lo muestran (`ambiente.ts`).
 */
import {
  AVISOS_DE_PRUEBA,
  COPY,
  COPY_DEL_NOMBRE,
  ISSUE_DE_MAYORIA_DE_EDAD,
  LARGO_MAXIMO_DEL_NOMBRE_VISIBLE,
  MENSAJE_DE_CAMPO,
  identificadorLocalValido,
  normalizarIdentificadorLocal,
  problemaDeCredencialLocal,
} from '@be/domain';
import { useRef, useState } from 'react';
import { ActosDelAlta, erroresDeLosActos, NINGUN_ACTO_MARCADO, type ActoDelAlta, type ActosMarcados } from '../actos-del-alta';
import { AVISOS_DE_PRUEBA_VISIBLES } from '../ambiente';
import { api, nuevaClaveDeIdempotencia } from '../api';
import { useCambiosSinGuardar } from '../cambios-sin-guardar';
import { mensajeDelNombreEnLaRespuesta, revisarElNombre } from '../nombre-obligatorio';
import { Aviso, Boton, Campo, Parrafo, Titulo } from '../ui';
import { AccesoConGoogle, type AlIniciar } from './acceso-con-google';

type Errores = Partial<Record<'nombre' | 'correo' | 'contrasena' | ActoDelAlta, string>>;
type Estado = 'editando' | 'enviando' | 'creada' | 'no-disponible' | 'incierto' | { error: string };

/**
 * `mostrarAviso` lleva la pantalla al principio, donde están el resumen de errores y el resultado: el botón «Crear
 * cuenta» queda al final de un formulario largo y, sin esto, el resultado aparecería fuera de la vista.
 */
export function PantallaDeRegistro({ irALogin, mostrarAviso, alIniciar }: { irALogin: () => void; mostrarAviso: () => void; alIniciar: AlIniciar }) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [actos, setActos] = useState<ActosMarcados>(NINGUN_ACTO_MARCADO);
  const [errores, setErrores] = useState<Errores>({});
  const [estado, setEstado] = useState<Estado>('editando');
  const clave = useRef(nuevaClaveDeIdempotencia());
  // Volver a Bienvenida con los datos escritos pregunta antes (DL-117: sin pérdidas silenciosas).
  useCambiosSinGuardar(estado !== 'creada' && (nombre.trim() !== '' || correo.trim() !== '' || contrasena !== '') ? 'los datos de tu cuenta nueva' : null);
  const cambiar = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    clave.current = nuevaClaveDeIdempotencia(); // otros datos = otro intento lógico
  };

  async function enviar() {
    if (estado === 'enviando') return;
    const encontrados: Errores = {};
    // DL-169: el nombre es obligatorio; se manda como se guarda (sin espacios de más).
    const revisado = revisarElNombre(nombre);
    if (!revisado.ok) encontrados.nombre = revisado.mensaje;
    if (!identificadorLocalValido(normalizarIdentificadorLocal(correo))) encontrados.correo = MENSAJE_DE_CAMPO.INVALID_LOCAL_IDENTIFIER;
    const problema = problemaDeCredencialLocal(contrasena);
    if (problema) encontrados.contrasena = MENSAJE_DE_CAMPO[problema];
    Object.assign(encontrados, erroresDeLosActos(actos));
    setErrores(encontrados);
    if (!revisado.ok || Object.keys(encontrados).length > 0) return mostrarAviso();

    setEstado('enviando');
    const r = await api.registrar({ correo, contrasena, nombre: revisado.nombre, mayoriaDeEdad: actos.mayoria }, clave.current);
    mostrarAviso();
    if (r.ok) {
      setContrasena('');
      return setEstado('creada');
    }
    if (r.tipo === 'RED') return setEstado('incierto');
    if (r.codigo === 'REGISTRATION_NOT_AVAILABLE') {
      clave.current = nuevaClaveDeIdempotencia();
      return setEstado('no-disponible');
    }
    if (r.codigo === 'INVALID_REQUEST') {
      const deLaApi: Errores = {};
      for (const i of r.issues) {
        if (i.path === 'profile.displayName') deLaApi.nombre = MENSAJE_DE_CAMPO[i.code] ?? MENSAJE_DE_CAMPO.INVALID_DISPLAY_NAME;
        if (i.path === 'identity.localIdentifier') deLaApi.correo = MENSAJE_DE_CAMPO[i.code] ?? MENSAJE_DE_CAMPO.INVALID_LOCAL_IDENTIFIER;
        if (i.path === 'identity.localCredential') deLaApi.contrasena = MENSAJE_DE_CAMPO[i.code] ?? MENSAJE_DE_CAMPO.CREDENCIAL_DEMASIADO_CORTA;
      }
      setErrores(deLaApi);
      return setEstado('editando');
    }
    if (r.codigo === 'VALIDATION_FAILED') {
      // DL-138: la declaración sin marcar vuelve a su casilla; con otra versión, los textos cambiaron.
      clave.current = nuevaClaveDeIdempotencia();
      // DL-169: el nombre vacío o que no se puede guardar vuelve a su campo.
      const delNombre = mensajeDelNombreEnLaRespuesta(r.issues);
      if (delNombre) {
        setErrores({ nombre: delNombre });
        return setEstado('editando');
      }
      if (r.issues.some((i) => i.code === ISSUE_DE_MAYORIA_DE_EDAD.REQUERIDA)) {
        setErrores({ mayoria: MENSAJE_DE_CAMPO.MAYORIA_REQUERIDA });
        return setEstado('editando');
      }
      if (r.issues.some((i) => i.code === ISSUE_DE_MAYORIA_DE_EDAD.VERSION_NO_VIGENTE)) return setEstado({ error: COPY.versionDesactualizadaApk });
      return setEstado({ error: COPY.noDisponible });
    }
    if (r.codigo === 'TERMS_VERSION_NOT_ACCEPTABLE' || r.codigo === 'PRIVACY_VERSION_NOT_ACCEPTABLE') return setEstado({ error: COPY.versionDesactualizadaApk });
    if (r.codigo === 'RATE_LIMITED') return setEstado({ error: COPY.demasiadosIntentos });
    return setEstado({ error: COPY.noDisponible });
  }

  if (estado === 'creada') {
    return (
      <>
        <Titulo>Crear cuenta</Titulo>
        <Aviso tipo="exito" titulo={COPY.cuentaCreada}>
          <Boton texto={COPY.iniciarSesion} onPress={irALogin} />
        </Aviso>
      </>
    );
  }

  const cantidad = Object.keys(errores).length;
  return (
    <>
      <Titulo>Crear cuenta</Titulo>
      <AccesoConGoogle alIniciar={alIniciar} subir={mostrarAviso}>
        {cantidad > 0 ? <Aviso tipo="error" titulo={COPY.resumenDeErrores(cantidad)} /> : null}
        {estado === 'no-disponible' ? (
          <Aviso tipo="error" titulo={COPY.registroNoDisponible}>
            <Parrafo>{COPY.registroNoDisponibleAyuda}</Parrafo>
            <Boton texto={COPY.iniciarSesion} tipo="enlace" onPress={irALogin} />
          </Aviso>
        ) : null}
        {estado === 'incierto' ? <Aviso tipo="error" titulo={COPY.resultadoIncierto} /> : null}
        {typeof estado === 'object' ? <Aviso tipo="error" titulo={estado.error} /> : null}

        {AVISOS_DE_PRUEBA_VISIBLES ? <Parrafo tenue>{AVISOS_DE_PRUEBA.registro}</Parrafo> : null}

        <Campo
          etiqueta={COPY_DEL_NOMBRE.etiqueta}
          ayuda={COPY_DEL_NOMBRE.ayuda}
          value={nombre}
          onChangeText={cambiar(setNombre)}
          maxLength={LARGO_MAXIMO_DEL_NOMBRE_VISIBLE + 20}
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="name"
          textContentType="name"
          error={errores.nombre}
        />
        <Campo
          etiqueta="Correo electrónico"
          value={correo}
          onChangeText={cambiar(setCorreo)}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          error={errores.correo}
        />
        <Campo
          etiqueta="Contraseña"
          ayuda="Al menos 12 caracteres."
          value={contrasena}
          onChangeText={cambiar(setContrasena)}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          error={errores.contrasena}
        />

        <ActosDelAlta marcados={actos} errores={errores} alCambiar={(acto, valor) => cambiar(setActos)({ ...actos, [acto]: valor })} />

        <Boton texto={estado === 'enviando' ? 'Creando cuenta…' : estado === 'incierto' ? COPY.reintentar : 'Crear cuenta'} onPress={enviar} ocupado={estado === 'enviando'} />
        <Boton texto="¿Ya tenés cuenta? Iniciar sesión" tipo="enlace" onPress={irALogin} />
      </AccesoConGoogle>
    </>
  );
}
