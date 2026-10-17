/**
 * Las casillas de toda alta de la APK, con correo o con Google (PROTO-10-ACC-01; DL-138): A1, A2 y la declaración de
 * mayoría de edad (08 §24.7 a). Tres actos separados: cada uno con su etiqueta, su versión y su casilla, nunca premarcada
 * (10-B02:128-155). A3 no forma parte del alta (10-B02:137-141).
 * La casilla de mayoría de edad lleva como texto la versión vigente, literal: lo que se ve es lo que se declara. No tiene
 * «Leer…»: el texto entero está en la casilla.
 */
import { COPY, MENSAJE_DE_CAMPO, VERSION_VIGENTE, type VersionDeTexto } from '@be/domain';
import { useState } from 'react';
import { Text } from 'react-native';
import { TextoVersionado } from './texto-versionado';
import { Boton, Casilla, Parrafo, estilos as ui } from './ui';

export type ActoDelAlta = 'a1' | 'a2' | 'mayoria';
export type ActosMarcados = Readonly<Record<ActoDelAlta, boolean>>;
export type ErroresDeLosActos = Partial<Record<ActoDelAlta, string>>;

export const NINGUN_ACTO_MARCADO: ActosMarcados = { a1: false, a2: false, mayoria: false };

/** Sin las tres marcadas no hay alta: cada una falta con su propio mensaje. */
export function erroresDeLosActos(actos: ActosMarcados): ErroresDeLosActos {
  const errores: ErroresDeLosActos = {};
  if (!actos.a1) errores.a1 = MENSAJE_DE_CAMPO.A1_REQUERIDO;
  if (!actos.a2) errores.a2 = MENSAJE_DE_CAMPO.A2_REQUERIDO;
  if (!actos.mayoria) errores.mayoria = MENSAJE_DE_CAMPO.MAYORIA_REQUERIDA;
  return errores;
}

export function ActosDelAlta({
  marcados,
  errores,
  alCambiar,
}: {
  marcados: ActosMarcados;
  errores: ErroresDeLosActos;
  alCambiar: (acto: ActoDelAlta, valor: boolean) => void;
}) {
  // El texto completo de A1 o A2, en un modal sobre el formulario para no perder lo cargado.
  const [texto, setTexto] = useState<VersionDeTexto | null>(null);
  return (
    <>
      <Text style={[ui.etiqueta, { marginTop: 12 }]} accessibilityRole="header">
        Antes de crear la cuenta
      </Text>
      <Parrafo tenue>Son tres confirmaciones distintas, cada una con su propio texto y su propia versión.</Parrafo>

      <Casilla marcada={marcados.a1} onCambio={(v) => alCambiar('a1', v)} titulo={COPY.a1Titulo} texto={COPY.a1Texto} error={errores.a1}>
        <Boton texto="Leer los términos de uso" tipo="enlace" onPress={() => setTexto(VERSION_VIGENTE.TERMINOS)} />
        <Text style={ui.tenue}>versión {VERSION_VIGENTE.TERMINOS.id}</Text>
      </Casilla>
      <Casilla marcada={marcados.a2} onCambio={(v) => alCambiar('a2', v)} titulo={COPY.a2Titulo} texto={COPY.a2Texto} error={errores.a2}>
        <Boton texto="Leer la información de privacidad" tipo="enlace" onPress={() => setTexto(VERSION_VIGENTE.PRIVACIDAD_INFO)} />
        <Text style={ui.tenue}>versión {VERSION_VIGENTE.PRIVACIDAD_INFO.id}</Text>
      </Casilla>
      <Casilla
        marcada={marcados.mayoria}
        onCambio={(v) => alCambiar('mayoria', v)}
        titulo={COPY.mayoriaTitulo}
        texto={VERSION_VIGENTE.MAYORIA_DE_EDAD.texto}
        error={errores.mayoria}
      >
        <Text style={ui.tenue}>versión {VERSION_VIGENTE.MAYORIA_DE_EDAD.id}</Text>
      </Casilla>

      <Parrafo tenue>Crear la cuenta no autoriza el tratamiento de datos de salud. Esa autorización es un paso aparte, que podés dar o no más adelante.</Parrafo>

      <TextoVersionado version={texto} visible={texto !== null} alCerrar={() => setTexto(null)} />
    </>
  );
}
