'use client';

/**
 * RP-25 (WP-RECORRIDO-PLAN-PULIDO; DL-188, DL-191) · El cuadro «Guardar como receta»: una opción de alimentos del plan se
 * guarda en Mis recetas (API-REC-01) y pasa a ser esa receta; después, en el mismo cuadro, se le puede cargar la foto con
 * el recuadro de siempre (`ImagenDeReceta`). Se llega desde «Guardar como receta», en la opción abierta, o desde «Agregar
 * foto», en su cabecera: ahí la primera línea explica por qué la foto pide una receta.
 *
 * - Antes de guardar, lo que lleva (una porción) y lo que una receta no admite, alimento por alimento. Con algo que
 *   impide, el botón queda apagado y dice por qué (el cuadro enfocado lo pone a su lado).
 * - La versión del catálogo de cada alimento se lee en el momento (API-ALI-04, por identidad): la receta cita versiones.
 * - Una clave de intento por pedido: un reintento sin respuesta no crea dos recetas (ED-62).
 * - El error del pedido tiene su renglón reservado al pie (RP-19): aparecer no corre lo de arriba.
 * La lógica, sin React, en `opcion-como-receta.ts`.
 */
import type { Receta } from '@be/domain';
import { useState } from 'react';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { Aviso, RenglonDelAviso } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { ImagenDeReceta } from '../../recipes/imagen-de-receta';
import type { OpcionEnEdicion } from './comida-del-editor';
import { alimentosQueNoSePudieron, conMedidasCaseras, COPY_OPCION_COMO_RECETA as C, cuerpoDeLaReceta, descripcionConLasNotas, loQueImpide, loQueLleva, nombreDeLaReceta } from './opcion-como-receta';

/** Lo que se pidió: qué opción (su lugar) y por dónde se llegó. */
export interface PedidoDeGuardarComoReceta {
  readonly i: number;
  readonly j: number;
  readonly k: number;
  readonly optionId: string | null;
  readonly label: string;
  readonly origen: 'foto' | 'receta';
}

export function GuardarComoReceta({
  token,
  sesionPerdida,
  pedido,
  opcion,
  nombres,
  persona,
  onGuardada,
  onImagen,
  onCerrar,
}: {
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  pedido: PedidoDeGuardarComoReceta | null;
  /** La opción como está ahora en el borrador (`null` si ya no está). */
  opcion: OpcionEnEdicion | null;
  nombres: Readonly<Record<string, string>>;
  persona: string | null;
  /** La receta quedó en Mis recetas: el editor la vuelve la opción y dice si pudo. */
  onGuardada: (r: Receta) => boolean;
  /** La imagen se cargó, cambió o se retiró: la cabecera de la opción la muestra. */
  onImagen: (r: Receta) => void;
  /** Al cerrar: lo que pasó, para decirlo en el plan (`null` si no se guardó nada). */
  onCerrar: (hecho: string | null) => void;
}) {
  const intento = useClaveDeIntento();
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [guardada, setGuardada] = useState<{ readonly receta: Receta; readonly texto: string; readonly aviso: string | null } | null>(null);
  const abierto = pedido !== null;
  const k = pedido?.k ?? 0;
  const nombre = opcion ? nombreDeLaReceta(opcion, k) : (pedido?.label ?? '');
  const impide = opcion && !guardada ? loQueImpide(opcion, nombres) : [];

  const cerrar = () => {
    const hecho = guardada ? (guardada.aviso ? `${guardada.texto} ${guardada.aviso}` : guardada.texto) : null;
    setGuardada(null);
    setFallo(null);
    intento.descartar();
    onCerrar(hecho);
  };

  async function guardar() {
    if (!opcion || enviando) return;
    setEnviando(true);
    setFallo(null);
    try {
      const ids = [...new Set(opcion.items.map((it) => it.catalogItemId))];
      const leidos = await api.consultarAlimentos(token, ids);
      if (sesionPerdida(leidos)) return;
      if (!leidos.ok) return setFallo(mensajeDeFallo(leidos));
      const versiones = new Map(leidos.datos.data.map((e) => [e.catalogItemId, e.versionId] as const));
      const armado = cuerpoDeLaReceta(opcion, k, nombres, versiones);
      if (armado.tipo === 'no-se-puede') return setFallo(armado.lineas.join(' '));
      if (armado.tipo === 'sin-version') return setFallo(C.sinVersion(armado.nombres));
      const r = await api.crearReceta(token, armado.cuerpo, intento.actual(JSON.stringify(armado.cuerpo)));
      intento.registrar(r);
      if (sesionPerdida(r)) return;
      if (!r.ok) {
        const cuales = r.tipo === 'API' && r.codigo === 'CATALOG_REFERENCE_INVALID' ? alimentosQueNoSePudieron(r.issues, opcion, nombres) : [];
        return setFallo(cuales.length > 0 ? C.noSePudieron(cuales) : mensajeDeFallo(r));
      }
      const receta = r.datos.data;
      const quedo = onGuardada(receta);
      setGuardada({ receta, texto: quedo ? C.guardada(receta.name) : C.guardadaSinOpcion(receta.name), aviso: null });
    } finally {
      setEnviando(false);
    }
  }

  const notas = opcion ? descripcionConLasNotas(opcion.items, nombres) : null;
  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="dialogo"
      titulo={C.titulo(nombre)}
      sobretitulo={persona}
      paso={guardada ? 'foto' : 'guardar'}
      ocupado={enviando}
      principal={
        guardada
          ? { texto: C.volver, alTocar: cerrar }
          : { texto: C.guardarComoReceta, alTocar: () => void guardar(), apagado: !opcion || impide.length > 0 ? C.apagado : null, enviando, textoEnviando: C.guardando }
      }
      onCerrar={cerrar}
    >
      {guardada ? (
        <div data-foto-de-la-opcion-como-receta>
          <Aviso tipo="exito">
            <p>{guardada.texto}</p>
          </Aviso>
          <h3>{C.fotoTitulo}</h3>
          <p className="nota">{C.fotoQueEs}</p>
          <ImagenDeReceta
            token={token}
            receta={guardada.receta}
            sesionPerdida={sesionPerdida}
            onCambio={(r, aviso) => {
              const receta = { ...guardada.receta, ...r };
              setGuardada((g) => (g ? { ...g, receta, aviso } : g));
              onImagen(receta);
            }}
          />
        </div>
      ) : opcion ? (
        <div className="guardar-como-receta" data-guardar-como-receta>
          <p>{pedido?.origen === 'foto' ? C.laFotoEsDeLaReceta : C.queHace}</p>
          <p className="nota">{C.loQueLleva}</p>
          <ul className="lista-compacta" data-lo-que-lleva>
            {loQueLleva(opcion.items, nombres).map((l, n) => (
              <li key={`${n}-${l}`}>{l}</li>
            ))}
          </ul>
          <p className="nota">
            {C.laPersonaVeLoMismo}
            {notas ? ` ${C.notasALaDescripcion}` : ''}
            {conMedidasCaseras(opcion.items) ? ` ${C.medidasEnGramos}` : ''}
          </p>
          {impide.length > 0 ? (
            <div className="guardar-como-receta__falta" data-lo-que-impide>
              <p className="nota">{C.noSePuedeTodavia}</p>
              <ul className="lista-compacta">
                {impide.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {/* RP-19: el renglón del error ya ocupa su lugar; aparecer no corre lo de arriba. */}
          <RenglonDelAviso tipo="error" anunciar data-fallo-de-la-receta>
            {fallo}
          </RenglonDelAviso>
        </div>
      ) : null}
    </CuadroEnfocado>
  );
}
