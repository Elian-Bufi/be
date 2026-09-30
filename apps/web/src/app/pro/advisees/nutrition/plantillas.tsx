'use client';

/**
 * Plantillas del profesional en el plan de comidas (PF-09; DL-108), el mismo flujo que en entrenamiento:
 * - «Guardar como plantilla»: nombre, descripción, el interruptor de cantidades (D-2, apagado) y cada nota de ítem para
 *   confirmarla o vaciarla (D-3). La estructura sale de `estructuraNutricionalComoEntrada`, sin objetivo (D-5).
 * - «Empezar desde una plantilla»: elegir una plantilla activa y crear el borrador (API-NUT-07 con `fromTemplateVersionId`).
 * - La nota de origen en un borrador que salió de una plantilla.
 */
import {
  COPY_PLANTILLAS,
  notasDeLaEstructuraNutricional,
  vaciarNota,
  type EstructuraDePlanEntrada,
  type OrigenDePlanEnPlantilla,
  type ResumenDePlantillaNutricional,
} from '@be/domain';
import { useEffect, useId, useState } from 'react';
import { DialogoDeConfirmacion } from '../../../../components/dialogo';
import { Campo } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';

export function DialogoGuardarPlantillaNutricional({
  token,
  abierto,
  estructura: inicial,
  origen,
  onCerrar,
  onGuardada,
}: {
  token: string;
  abierto: boolean;
  estructura: EstructuraDePlanEntrada;
  origen: string | null;
  onCerrar: () => void;
  onGuardada: (nombre: string) => void;
}) {
  const id = useId();
  const intento = useClaveDeIntento();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [conCantidades, setConCantidades] = useState(false);
  const [estructura, setEstructura] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (abierto) {
      setEstructura(inicial);
      setError(null);
    }
  }, [abierto, inicial]);
  const notas = notasDeLaEstructuraNutricional(estructura);

  async function guardar() {
    setEnviando(true);
    setError(null);
    const r = await api.crearPlantillaNutricional(
      token,
      { name: nombre.trim(), description: descripcion.trim() || null, structure: estructura, copyQuantities: conCantidades, ...(origen ? { origin: { planVersionId: origen } } : {}) },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    if (!r.ok) return setError(!r.ok && r.tipo === 'API' && r.codigo === 'TEMPLATE_NAME_TAKEN' ? COPY_PLANTILLAS.nombreTomado : mensajeDeFallo(r));
    onGuardada(r.datos.data.name);
    setNombre('');
    setDescripcion('');
    setConCantidades(false);
  }

  return (
    <DialogoDeConfirmacion
      abierto={abierto}
      titulo={COPY_PLANTILLAS.guardarComoPlantilla}
      textoVolver={COPY_PLANTILLAS.cancelar}
      textoConfirmar={COPY_PLANTILLAS.guardar}
      textoEnviando="Guardando…"
      enviando={enviando}
      error={error}
      confirmarDeshabilitado={nombre.trim().length === 0}
      onVolver={onCerrar}
      onConfirmar={() => void guardar()}
    >
      <p className="nota">{COPY_PLANTILLAS.queCopiaNutricion}</p>
      <Campo id={`${id}-nombre`} etiqueta={COPY_PLANTILLAS.nombre} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />
      <Campo id={`${id}-descripcion`} etiqueta={COPY_PLANTILLAS.descripcion} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={1000} />
      <div className="campo">
        <label>
          <input type="checkbox" checked={conCantidades} onChange={(e) => setConCantidades(e.target.checked)} /> {COPY_PLANTILLAS.cantidades}
        </label>
        <p className="nota">{COPY_PLANTILLAS.cantidadesAyuda}</p>
      </div>
      <h4>{COPY_PLANTILLAS.notasTitulo}</h4>
      {notas.length === 0 ? (
        <p className="nota">{COPY_PLANTILLAS.sinNotas}</p>
      ) : (
        <>
          <p className="nota">{COPY_PLANTILLAS.notasAyuda}</p>
          <ul className="lista-compacta">
            {notas.map((n) => (
              <li key={n.lugar}>
                <span className="nota">{n.rotulo}:</span> «{n.texto}»{' '}
                <button type="button" className="boton boton--enlace" onClick={() => setEstructura((e) => vaciarNota(e, n.lugar))} aria-label={`${COPY_PLANTILLAS.vaciarNota}: ${n.rotulo}`}>
                  {COPY_PLANTILLAS.vaciarNota}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="nota">{COPY_PLANTILLAS.soloTuya}</p>
    </DialogoDeConfirmacion>
  );
}

export function InicioDesdePlantillaNutricional({ token, deshabilitado, onAplicar }: { token: string; deshabilitado: boolean; onAplicar: (templateVersionId: string) => void }) {
  const id = useId();
  const [plantillas, setPlantillas] = useState<readonly ResumenDePlantillaNutricional[] | null>(null);
  const [elegida, setElegida] = useState('');
  useEffect(() => {
    let vigente = true;
    void api.listarPlantillasNutricionales(token, { state: 'ACTIVE' }).then((r) => {
      if (vigente) setPlantillas(r.ok ? r.datos.data : []);
    });
    return () => {
      vigente = false;
    };
  }, [token]);
  if (plantillas === null) return null;
  if (plantillas.length === 0) return <p className="nota">{COPY_PLANTILLAS.sinPlantillasActivas}</p>;
  return (
    <div className="campo">
      <label htmlFor={`${id}-plantilla`}>{COPY_PLANTILLAS.empezarDesdePlantilla}</label>
      <select id={`${id}-plantilla`} value={elegida} onChange={(e) => setElegida(e.target.value)}>
        <option value="">—</option>
        {plantillas.map((p) => (
          <option key={p.templateId} value={p.versionId}>
            {p.name} · {COPY_PLANTILLAS.comidas(p.mealCount)} · {p.copiedQuantities ? COPY_PLANTILLAS.conCantidades : COPY_PLANTILLAS.sinCantidades}
          </option>
        ))}
      </select>
      <button type="button" className="boton boton--secundario" disabled={deshabilitado || !elegida} onClick={() => onAplicar(elegida)}>
        {COPY_PLANTILLAS.aplicar}
      </button>
    </div>
  );
}

export function NotaDeOrigenNutricional({ token, origen }: { token: string; origen: OrigenDePlanEnPlantilla }) {
  const [texto, setTexto] = useState<string | null>(null);
  useEffect(() => {
    let vigente = true;
    void api.consultarPlantillaNutricional(token, origen.templateId).then((r: Resultado<{ data: { name: string; versionNumber: number } }>) => {
      if (!vigente) return;
      setTexto(r.ok ? COPY_PLANTILLAS.creadaDesde(r.datos.data.name, r.datos.data.versionNumber) : COPY_PLANTILLAS.origenDesconocido);
    });
    return () => {
      vigente = false;
    };
  }, [token, origen]);
  return texto ? <p className="nota">{texto}</p> : null;
}
