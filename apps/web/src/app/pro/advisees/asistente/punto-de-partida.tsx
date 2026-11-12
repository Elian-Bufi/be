'use client';

/**
 * ED-14 y ED-20 (§2.1) · El paso 1 del asistente: el punto de partida, en tarjetas grandes y sin nada elegido. «Siguiente»
 * crea el borrador con la operación de hoy (copiar la vigente, desde una plantilla o en blanco) y espera la respuesta: si
 * falla, el paso queda abierto con el error. «Desde un preset» crea el borrador en blanco y abre la galería de
 * estructuras en el paso 2.
 */
import { useState } from 'react';
import { ArmazonDelAsistente } from './asistente';
import { COPY_ASISTENTE as C } from './paso-que-sigue';

export type PuntoDePartidaElegido = 'vigente' | 'plantilla' | 'preset' | 'blanco';

export function PuntoDePartida({ hayVigente, creando, onElegir }: { hayVigente: boolean; creando: boolean; onElegir: (p: PuntoDePartidaElegido) => void }) {
  const [elegido, setElegido] = useState<PuntoDePartidaElegido | null>(null);
  const [falta, setFalta] = useState(false);
  const opciones: readonly { readonly clave: PuntoDePartidaElegido; readonly titulo: string; readonly detalle: string }[] = [
    ...(hayVigente ? [{ clave: 'vigente' as const, titulo: C.copiarLaVigente, detalle: C.copiarLaVigenteDetalle }] : []),
    { clave: 'plantilla', titulo: C.desdeUnaPlantilla, detalle: C.desdeUnaPlantillaDetalle },
    { clave: 'preset', titulo: C.desdeUnPreset, detalle: C.desdeUnPresetDetalle },
    { clave: 'blanco', titulo: C.enBlanco, detalle: C.enBlancoDetalle },
  ];
  return (
    <ArmazonDelAsistente
      paso={1}
      sugerido={null}
      titulo={C.puntoDePartida}
      onElegirPaso={null}
      onAtras={null}
      onEstacion={null}
      principal={{
        texto: C.siguiente(2),
        ocupado: creando ? C.guardando : null,
        onClick: () => {
          if (!elegido) return setFalta(true);
          onElegir(elegido);
        },
      }}
      noAvanzo={false}
      onReintentar={() => undefined}
    >
      <fieldset className="asistente__tarjetas" aria-describedby={falta && !elegido ? 'falta-punto-de-partida' : undefined}>
        <legend className="visualmente-oculto">{C.puntoDePartida}</legend>
        {opciones.map((o) => (
          <label key={o.clave} className="asistente__tarjeta" data-punto-de-partida={o.clave}>
            <input type="radio" name="punto-de-partida" value={o.clave} checked={elegido === o.clave} onChange={() => setElegido(o.clave)} />
            <span className="asistente__tarjeta-titulo">{o.titulo}</span>
            <span className="nota">{o.detalle}</span>
          </label>
        ))}
      </fieldset>
      {falta && !elegido ? (
        <p id="falta-punto-de-partida" className="campo__error" role="alert">
          {C.elegiUnPuntoDePartida}
        </p>
      ) : null}
    </ArmazonDelAsistente>
  );
}
