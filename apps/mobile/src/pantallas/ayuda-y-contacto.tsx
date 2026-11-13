/**
 * APK · Ayuda y contacto (UF-07 de WP-USO-FINAL, DL-169): Perfil → «Ayuda y contacto». El canal de ayuda se lee de la API
 * (API-SOP-01) cada vez que se abre: ninguna dirección viaja dentro de la APK, así que si Dirección la cambia, la app
 * instalada muestra la nueva sin reconstruirse. Cada dirección abre la app de correo del teléfono con un asunto.
 * Sin configuración, dice que el canal todavía no está publicado; sin respuesta, lo dice y ofrece reintentar.
 * `CanalDeContacto` también lo usa Recuperar el acceso, que no tiene sesión, para la recuperación asistida.
 */
import { COPY_AYUDA, enlaceDeCorreo, type CanalDeContactoResponse } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { api } from '../api';
import { Boton, Parrafo, Seccion, Titulo } from '../ui';

type Estado = { readonly tipo: 'cargando' } | { readonly tipo: 'sin-respuesta' } | { readonly tipo: 'listo'; readonly canal: CanalDeContactoResponse['data'] };
const A = COPY_AYUDA;
type TextosDeLaVia = { readonly titulo: string; readonly queEs: string; readonly escribir: string; readonly asunto: string };

export function CanalDeContacto({ soloSoporte = false }: { soloSoporte?: boolean }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const leer = useCallback(async () => {
    setEstado({ tipo: 'cargando' });
    const r = await api.consultarCanalDeContacto();
    setEstado(r.ok ? { tipo: 'listo', canal: r.datos.data } : { tipo: 'sin-respuesta' });
  }, []);
  useEffect(() => {
    void leer();
  }, [leer]);

  if (estado.tipo === 'cargando') return <Parrafo tenue>{A.cargando}</Parrafo>;
  if (estado.tipo === 'sin-respuesta') {
    return (
      <>
        <Parrafo tenue icono="info">
          {A.sinRespuesta}
        </Parrafo>
        <Boton texto={A.reintentar} tipo="secundario" onPress={() => void leer()} />
      </>
    );
  }
  const posibles: readonly { readonly textos: TextosDeLaVia; readonly direccion: string | null }[] = [
    { textos: A.soporte, direccion: estado.canal.supportEmail },
    ...(soloSoporte ? [] : [{ textos: A.privacidad, direccion: estado.canal.privacyEmail }]),
  ];
  const vias = posibles.flatMap((v) => (v.direccion ? [{ textos: v.textos, direccion: v.direccion }] : []));
  if (vias.length === 0) return <Parrafo tenue>{A.sinCanal}</Parrafo>;
  return (
    <>
      {vias.map((v) => (
        <ViaDeContacto key={v.textos.titulo} titulo={v.textos.titulo} queEs={v.textos.queEs} direccion={v.direccion} escribir={v.textos.escribir} asunto={v.textos.asunto} />
      ))}
    </>
  );
}

/** Cada vía va en su sección: con el vidrio de la etapa B (DL-170), lo que se toca va sobre una superficie, no suelto sobre el fondo. */
function ViaDeContacto({ titulo, queEs, direccion, escribir, asunto }: { titulo: string; queEs: string; direccion: string; escribir: string; asunto: string }) {
  return (
    <Seccion titulo={titulo}>
      <Parrafo>{queEs}</Parrafo>
      <Parrafo tenue>{direccion}</Parrafo>
      <Boton texto={escribir} tipo="secundario" icono="abrir" etiqueta={`${escribir}: ${direccion}`} onPress={() => void Linking.openURL(enlaceDeCorreo(direccion, asunto))} />
    </Seccion>
  );
}

export function PantallaDeAyudaYContacto() {
  return (
    <>
      <Titulo>{A.titulo}</Titulo>
      <Parrafo>{A.queEs}</Parrafo>
      <CanalDeContacto />
      <Seccion titulo="Lo más común">
        {A.casos.map((c) => (
          <Parrafo key={c.titulo}>
            {c.titulo}: {c.texto}
          </Parrafo>
        ))}
      </Seccion>
    </>
  );
}
