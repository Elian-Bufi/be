'use client';

/**
 * Plantillas del profesional en el plan de entrenamiento (PF-09; DL-108):
 * - «Guardar como plantilla»: un diálogo con nombre, descripción, el interruptor de cargas (D-2, apagado) y **cada nota
 *   de texto libre** para confirmarla o vaciarla antes de guardar (D-3). La estructura sale de la versión con
 *   `estructuraComoEntrada`, sin objetivo ni próxima revisión (D-5).
 * - «Empezar desde una plantilla»: elegir una plantilla activa y crear el borrador (API-TRN-07 con
 *   `fromTemplateVersionId`); el plan nace de la persona y se adapta en el editor.
 * - La nota de origen en un borrador que salió de una plantilla.
 */
import {
  COPY_PLANTILLAS,
  notasDeLaEstructura,
  vaciarNota,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type OrigenDePlanEnPlantilla,
  type ResumenDePlantillaDeEntrenamiento,
} from '@be/domain';
import { useEffect, useId, useState } from 'react';
import { Ayuda } from '../../../../components/ayuda';
import { DialogoDeConfirmacion } from '../../../../components/dialogo';
import { Campo } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';

export function DialogoGuardarPlantilla({
  token,
  abierto,
  estructura: inicial,
  origen,
  onCerrar,
  onGuardada,
}: {
  token: string;
  abierto: boolean;
  estructura: EstructuraDePlanDeEntrenamientoEntrada;
  /** La versión de plan de la que sale, para dejarlo registrado; `null` si sale de un borrador sin activar. */
  origen: string | null;
  onCerrar: () => void;
  onGuardada: (nombre: string) => void;
}) {
  const id = useId();
  const intento = useClaveDeIntento();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [conCargas, setConCargas] = useState(false);
  const [estructura, setEstructura] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (abierto) {
      setEstructura(inicial);
      setError(null);
    }
  }, [abierto, inicial]);
  const notas = notasDeLaEstructura(estructura);

  async function guardar() {
    setEnviando(true);
    setError(null);
    const r = await api.crearPlantillaDeEntrenamiento(
      token,
      { name: nombre.trim(), description: descripcion.trim() || null, structure: estructura, copySuggestedLoads: conCargas, ...(origen ? { origin: { planVersionId: origen } } : {}) },
      intento.actual(),
    );
    intento.registrar(r);
    setEnviando(false);
    if (!r.ok) return setError(esCodigo(r, 'TEMPLATE_NAME_TAKEN') ? COPY_PLANTILLAS.nombreTomado : mensajeDeFallo(r));
    onGuardada(r.datos.data.name);
    setNombre('');
    setDescripcion('');
    setConCargas(false);
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
      <Campo id={`${id}-nombre`} etiqueta={COPY_PLANTILLAS.nombre} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />
      <Campo id={`${id}-descripcion`} etiqueta={COPY_PLANTILLAS.descripcion} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={1000} />
      <div className="campo">
        <label>
          <input type="checkbox" checked={conCargas} onChange={(e) => setConCargas(e.target.checked)} /> {COPY_PLANTILLAS.cargas}
        </label>
        <p className="nota">{COPY_PLANTILLAS.cargasAyuda}</p>
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
      {/* DL-113: lo que explica la plantilla, plegado y al final: así el foco del diálogo abre en el nombre. */}
      <Ayuda titulo="Qué se copia y quién lo ve">
        <p>{COPY_PLANTILLAS.queCopia}</p>
        <p>{COPY_PLANTILLAS.soloTuya}</p>
      </Ayuda>
    </DialogoDeConfirmacion>
  );
}

/** Elegir una plantilla activa y crear el borrador desde ella. */
export function InicioDesdePlantilla({ token, deshabilitado, onAplicar }: { token: string; deshabilitado: boolean; onAplicar: (templateVersionId: string) => void }) {
  const id = useId();
  const [plantillas, setPlantillas] = useState<readonly ResumenDePlantillaDeEntrenamiento[] | null>(null);
  const [elegida, setElegida] = useState('');
  useEffect(() => {
    let vigente = true;
    void api.listarPlantillasDeEntrenamiento(token, { state: 'ACTIVE' }).then((r) => {
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
            {p.name} · {COPY_PLANTILLAS.sesiones(p.sessionCount)} · {p.copiedLoads ? COPY_PLANTILLAS.conCargas : COPY_PLANTILLAS.sinCargas}
          </option>
        ))}
      </select>
      <button type="button" className="boton boton--secundario" disabled={deshabilitado || !elegida} onClick={() => onAplicar(elegida)}>
        {COPY_PLANTILLAS.aplicar}
      </button>
    </div>
  );
}

/** «Creada desde la plantilla X, versión N» en un borrador que salió de una plantilla. */
export function NotaDeOrigen({ token, origen }: { token: string; origen: OrigenDePlanEnPlantilla }) {
  const [texto, setTexto] = useState<string | null>(null);
  useEffect(() => {
    let vigente = true;
    void api.consultarPlantillaDeEntrenamiento(token, origen.templateId).then((r) => {
      if (!vigente) return;
      // La versión aplicada puede no ser la vigente de la plantilla: se muestra el número de la que se aplicó si coincide, o el nombre solo.
      setTexto(r.ok ? COPY_PLANTILLAS.creadaDesde(r.datos.data.name, r.datos.data.versionId === origen.templateVersionId ? r.datos.data.versionNumber : r.datos.data.versionNumber) : COPY_PLANTILLAS.origenDesconocido);
    });
    return () => {
      vigente = false;
    };
  }, [token, origen]);
  return texto ? <p className="nota">{texto}</p> : null;
}

function esCodigo(r: Resultado<unknown>, codigo: string): boolean {
  return !r.ok && r.tipo === 'API' && r.codigo === codigo;
}
