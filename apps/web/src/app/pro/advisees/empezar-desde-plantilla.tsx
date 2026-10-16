'use client';

/**
 * «Empezar desde una plantilla» (PF-09; DL-108), para un plan de un área: las plantillas activas del profesional, en un
 * diálogo, y «Crear el borrador desde esta plantilla» (WP-ESCRITORIO-AREAS, parte 5).
 * - **La lista se lee al abrir,** no al entrar a la sección: es una acción de vez en cuando.
 * - **Una lectura que falla dice su motivo y se reintenta.** No es «No tenés plantillas»: una falla no es una ausencia.
 * - **Nada viene elegido:** crear el borrador exige elegir.
 * El área dice cómo se leen sus plantillas y cómo se describe cada una; el borrador lo crea ella.
 */
import { COPY_PLANTILLAS } from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { DialogoDeConfirmacion } from '../../../components/dialogo';
import { BloqueDeEstado, Cargando } from '../../../components/estados';
import type { Resultado } from '../../../lib/api';
import { ICONO_DE_FALLA, motivoDeFalla, razonDeFalla } from '../../../lib/fallas';

/** Una plantilla de la lista: la versión que se aplica, su nombre y lo que trae («4 comidas · Sin cantidades»). */
export interface PlantillaParaEmpezar {
  readonly versionId: string;
  readonly nombre: string;
  readonly detalle: string;
}

export function DialogoEmpezarDesdePlantilla({
  abierto,
  leer,
  creando,
  error,
  onCerrar,
  onAplicar,
}: {
  abierto: boolean;
  /** Las plantillas activas, todas. Una sesión vencida la resuelve quien llama. */
  leer: () => Promise<Resultado<readonly PlantillaParaEmpezar[]>>;
  creando: boolean;
  /** La falla al crear el borrador, si la hubo. */
  error: string | null;
  onCerrar: () => void;
  onAplicar: (templateVersionId: string) => void;
}) {
  const nombre = useId();
  const [lectura, setLectura] = useState<Resultado<readonly PlantillaParaEmpezar[]> | null>(null);
  const [elegida, setElegida] = useState('');
  const generacion = useRef(0);

  const cargar = useCallback(async () => {
    const esta = ++generacion.current;
    setLectura(null);
    const r = await leer();
    if (esta === generacion.current) setLectura(r);
  }, [leer]);

  useEffect(() => {
    if (!abierto) return;
    setElegida('');
    void cargar();
    return () => {
      generacion.current++;
    };
  }, [abierto, cargar]);

  return (
    <DialogoDeConfirmacion
      abierto={abierto}
      titulo={COPY_PLANTILLAS.empezarDesdePlantilla}
      textoVolver={COPY_PLANTILLAS.cancelar}
      textoConfirmar={COPY_PLANTILLAS.aplicar}
      textoEnviando={COPY_PLANTILLAS.creandoElBorrador}
      enviando={creando}
      error={error}
      confirmarDeshabilitado={!elegida}
      onVolver={onCerrar}
      onConfirmar={() => onAplicar(elegida)}
    >
      {!abierto ? null : !lectura ? (
        <Cargando />
      ) : !lectura.ok ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[motivoDeFalla(lectura)]} titulo={COPY_PLANTILLAS.noCargaron} onReintentar={() => void cargar()} deQue="la lectura de las plantillas">
          {razonDeFalla(motivoDeFalla(lectura))}
        </BloqueDeEstado>
      ) : lectura.datos.length === 0 ? (
        <>
          <p>{COPY_PLANTILLAS.sinPlantillasActivas}</p>
          <p className="nota">{COPY_PLANTILLAS.dondeSeArman}</p>
        </>
      ) : (
        <>
          <p className="nota">{COPY_PLANTILLAS.elegiUna}</p>
          <fieldset className="plantillas-para-empezar">
            <legend className="visualmente-oculto">{COPY_PLANTILLAS.plantillasActivas}</legend>
            {lectura.datos.map((p) => (
              <label key={p.versionId} className="plantilla-para-empezar">
                <input type="radio" name={nombre} value={p.versionId} checked={elegida === p.versionId} onChange={() => setElegida(p.versionId)} disabled={creando} />
                <span className="plantilla-para-empezar__nombre">{p.nombre}</span>
                <span className="plantilla-para-empezar__detalle nota">{p.detalle}</span>
              </label>
            ))}
          </fieldset>
        </>
      )}
    </DialogoDeConfirmacion>
  );
}
