'use client';

/**
 * Crear o editar una receta propia (DL-119; REG-06-135, inciso 2): nombre, porciones, ingredientes del catálogo por
 * identidad y versión, preparación e imagen de referencia.
 * - Cada ingrediente lleva gramos o mililitros **del estado elegido** (crudo, cocido, tal como se adquiere). BE no
 *   convierte entre estados ni entre mililitros y gramos: si la unidad no tiene equivalencia, el cálculo lo dice.
 * - El cálculo lo hace la API (API-REC-07) mientras se edita, y otra vez al guardar: la pantalla no suma nada.
 * - Guardar una receta existente emite una versión nueva (API-REC-04). Los planes ya activados conservan la suya.
 */
import {
  COPY_RECETAS,
  ETIQUETA_DE_PREPARACION,
  ETIQUETA_DE_PROVEEDOR,
  leerNumero,
  motivoDeNumeroIlegible,
  nutrienteParaMostrar,
  type CalcularRecetaRequest,
  type CalculoDeReceta,
  type DetalleDeRecetaResponse,
  type ElementoDeCatalogo,
  type EstadoDePreparacion,
  type Receta,
} from '@be/domain';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Ayuda } from '../../../components/ayuda';
import { Cargando, ErrorConReintento } from '../../../components/estados';
import { Aviso, Campo, ResumenDeErrores, erroresPorCampo } from '../../../components/formulario';
import { api, type Resultado } from '../../../lib/api';
import { fecha } from '../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../lib/intento';
import { procedenciaDeElemento } from '../advisees/nutrition/importacion';
import { TablaDeCalculo } from './calculo-de-receta';
import { ImagenDeReceta } from './imagen-de-receta';

type Detalle = DetalleDeRecetaResponse['data'];
type Unidad = 'g' | 'ml';

interface IngredienteEnEdicion {
  /** Estable mientras se edita, para que React no mezcle los campos al quitar uno. */
  readonly clave: string;
  readonly catalogItemId: string;
  readonly catalogItemVersionId: string;
  readonly nombre: string;
  /** La fuente del alimento, cuando se eligió en esta edición (USDA, importado o manual). */
  readonly fuente: string | null;
  readonly cantidad: string;
  readonly unidad: Unidad;
  readonly estado: EstadoDePreparacion | '';
}

type EstadoDelCalculo =
  | { readonly tipo: 'incompleto' }
  | { readonly tipo: 'calculando' }
  | { readonly tipo: 'listo'; readonly calculo: CalculoDeReceta; readonly actualizando: boolean }
  | { readonly tipo: 'fallo'; readonly texto: string };

let siguienteClave = 0;
const nuevaClave = () => `ing-${++siguienteClave}`;

/** La fuente de un alimento donde se lo elige: con USDA, el registro y su estado de preparación (RF-060; DL-119). */
function fuenteDelAlimento(e: ElementoDeCatalogo): string | null {
  const fuente = e.externalSource;
  if (fuente?.provider === 'USDA_FDC_SR_LEGACY' && fuente.usdaReference) {
    return `${ETIQUETA_DE_PROVEEDOR.USDA_FDC_SR_LEGACY} · NDB ${fuente.usdaReference.ndbNumber} · ${fuente.usdaReference.preparationDescription}`;
  }
  return procedenciaDeElemento(e);
}

/** La cantidad escrita, si es un número mayor que cero; si no, `null`. */
function cantidadValida(texto: string): number | null {
  const n = leerNumero(texto);
  return n !== null && n > 0 && n <= 5000 ? n : null;
}

/** Las porciones escritas, si son un entero de 1 a 50. */
function porcionesValidas(texto: string): number | null {
  const n = leerNumero(texto);
  return n !== null && Number.isInteger(n) && n >= 1 && n <= 50 ? n : null;
}

/** El pedido de cálculo, solo si todo lo necesario está completo y es válido. */
function pedidoDeCalculo(porciones: string, ingredientes: readonly IngredienteEnEdicion[]): CalcularRecetaRequest | null {
  const servings = porcionesValidas(porciones);
  if (servings === null || ingredientes.length === 0) return null;
  const lista: CalcularRecetaRequest['ingredients'][number][] = [];
  for (const i of ingredientes) {
    const valor = cantidadValida(i.cantidad);
    if (valor === null || i.estado === '') return null;
    lista.push({ catalogItemId: i.catalogItemId, catalogItemVersionId: i.catalogItemVersionId, quantity: { value: valor, unit: i.unidad }, preparationState: i.estado });
  }
  return { servings, ingredients: lista };
}

const comoTexto = (n: number) => String(n).replace('.', ',');

export function EditorDeReceta({
  token,
  sesionPerdida,
  recetaId,
  onGuardada,
  onVolver,
}: {
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  recetaId: string | null;
  onGuardada: (r: Receta, aviso: string) => void;
  onVolver: () => void;
}) {
  const [cargada, setCargada] = useState<Detalle | null>(null);
  const [lectura, setLectura] = useState<'cargando' | 'lista' | 'no-disponible' | 'sin-area' | 'error'>(recetaId ? 'cargando' : 'lista');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [porciones, setPorciones] = useState('1');
  const [ingredientes, setIngredientes] = useState<IngredienteEnEdicion[]>([]);
  const [pasos, setPasos] = useState<string[]>([]);
  const [sucio, setSucio] = useState(false);
  const [calculo, setCalculo] = useState<EstadoDelCalculo>({ tipo: 'incompleto' });
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<readonly { id: string; texto: string }[]>([]);
  const [envios, setEnvios] = useState(0);
  const [fallo, setFallo] = useState<string | null>(null);
  const [avisoDeImagen, setAvisoDeImagen] = useState<string | null>(null);
  const intento = useClaveDeIntento();
  const generacion = useRef(0);

  async function cargar() {
    if (!recetaId) return;
    setLectura('cargando');
    const r = await api.consultarReceta(token, recetaId);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setLectura(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND' ? 'no-disponible' : r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN' ? 'sin-area' : 'error');
    const d = r.datos.data;
    setCargada(d);
    setNombre(d.name);
    setDescripcion(d.description ?? '');
    setPorciones(String(d.servings));
    setIngredientes(
      d.ingredients.map((i) => ({
        clave: nuevaClave(),
        catalogItemId: i.catalogItemId,
        catalogItemVersionId: i.catalogItemVersionId,
        nombre: i.name,
        fuente: null,
        cantidad: comoTexto(i.quantity.value),
        unidad: i.quantity.unit,
        estado: i.preparationState,
      })),
    );
    setPasos([...d.steps]);
    setCalculo({ tipo: 'listo', calculo: d.calculation, actualizando: false });
    setSucio(false);
    setLectura('lista');
  }

  useEffect(() => {
    void cargar();
    // Se carga al montar: la página vuelve a montar el editor al cambiar de receta.
  }, []);

  // El cálculo de la API mientras se edita, con una espera corta para no pedirlo en cada tecla.
  const pedido = useMemo(() => pedidoDeCalculo(porciones, ingredientes), [porciones, ingredientes]);
  const clavePedido = pedido ? JSON.stringify(pedido) : null;
  useEffect(() => {
    if (!sucio) return;
    const esta = ++generacion.current;
    if (!pedido) return setCalculo({ tipo: 'incompleto' });
    setCalculo((c) => (c.tipo === 'listo' ? { ...c, actualizando: true } : { tipo: 'calculando' }));
    const espera = setTimeout(async () => {
      const r = await api.calcularReceta(token, pedido);
      if (esta !== generacion.current || sesionPerdida(r)) return;
      if (r.ok) return setCalculo({ tipo: 'listo', calculo: r.datos.data, actualizando: false });
      setCalculo({ tipo: 'fallo', texto: r.tipo === 'API' && r.codigo === 'CATALOG_REFERENCE_INVALID' ? COPY_RECETAS.ingredienteNoDisponible : COPY_RECETAS.noSePudoCalcular });
    }, 350);
    return () => clearTimeout(espera);
    // `clavePedido` resume el pedido: el efecto corre cuando cambia lo que se calcula, no en cada render.
  }, [clavePedido, sucio, token, sesionPerdida]);

  const cambiar = () => {
    setSucio(true);
    setFallo(null);
  };
  const cambiarIngrediente = (clave: string, cambio: Partial<IngredienteEnEdicion>) => {
    setIngredientes((lista) => lista.map((i) => (i.clave === clave ? { ...i, ...cambio } : i)));
    cambiar();
  };

  function validar(): readonly { id: string; texto: string }[] {
    const problemas: { id: string; texto: string }[] = [];
    if (!nombre.trim()) problemas.push({ id: 'receta-nombre', texto: COPY_RECETAS.faltaElNombre });
    if (porcionesValidas(porciones) === null) problemas.push({ id: 'receta-porciones', texto: COPY_RECETAS.porcionesInvalidas });
    if (ingredientes.length === 0) problemas.push({ id: 'receta-buscar-texto', texto: COPY_RECETAS.sinIngredientes });
    for (const i of ingredientes) {
      if (cantidadValida(i.cantidad) === null) {
        const ilegible = i.cantidad.trim() !== '' && leerNumero(i.cantidad) === null;
        problemas.push({ id: `${i.clave}-cantidad`, texto: `${i.nombre}: ${ilegible ? motivoDeNumeroIlegible(i.cantidad) : COPY_RECETAS.cantidadInvalida}` });
      }
      if (i.estado === '') problemas.push({ id: `${i.clave}-estado`, texto: `${i.nombre}: ${COPY_RECETAS.faltaElEstado}` });
    }
    return problemas;
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const problemas = validar();
    setErrores(problemas);
    setEnvios((n) => n + 1);
    const calculable = pedidoDeCalculo(porciones, ingredientes);
    if (problemas.length > 0 || !calculable) return;
    setEnviando(true);
    setFallo(null);
    const cuerpo = { ...calculable, name: nombre.trim(), description: descripcion.trim() || null, steps: pasos.map((p) => p.trim()).filter(Boolean) };
    const r = cargada ? await api.editarReceta(token, cargada.recipeId, { ...cuerpo, expectedVersion: cargada.version }, intento.actual()) : await api.crearReceta(token, cuerpo, intento.actual());
    intento.registrar(r);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'CATALOG_REFERENCE_INVALID') return setFallo(COPY_RECETAS.ingredienteNoDisponible);
      if (r.tipo === 'API' && r.codigo === 'ACTION_FORBIDDEN') return setFallo(COPY_RECETAS.soloNutricion);
      return setFallo(mensajeDeFallo(r));
    }
    setSucio(false);
    onGuardada(r.datos.data, cargada ? COPY_RECETAS.versionNueva(r.datos.data.versionNumber) : COPY_RECETAS.guardada);
  }

  if (lectura === 'cargando') return <Cargando />;
  if (lectura === 'error') return <ErrorConReintento onReintentar={() => void cargar()} />;
  if (lectura === 'no-disponible' || lectura === 'sin-area') {
    return (
      <Aviso tipo="info">
        <p>{lectura === 'sin-area' ? COPY_RECETAS.soloNutricion : 'No pudimos abrir esta receta.'}</p>
        <p>
          <button type="button" className="boton boton--enlace" onClick={onVolver}>
            {COPY_RECETAS.volverALaLista}
          </button>
        </p>
      </Aviso>
    );
  }

  const porCampo = erroresPorCampo(errores);
  const nombres = Object.fromEntries(ingredientes.map((i, n) => [String(n + 1), i.nombre]));
  return (
    <div className="secciones">
      <p>
        <button type="button" className="boton boton--enlace" onClick={onVolver}>
          ← {COPY_RECETAS.volverALaLista}
        </button>
      </p>
      <h2>{cargada ? `${COPY_RECETAS.editarReceta} · ${COPY_RECETAS.version(cargada.versionNumber)}` : COPY_RECETAS.nuevaReceta}</h2>
      <form onSubmit={(e) => void guardar(e)} noValidate className="secciones">
        <ResumenDeErrores titulo="Revisá estos datos antes de guardar" errores={errores} intento={envios} />
        <section className="seccion" aria-labelledby="receta-datos">
          <h3 id="receta-datos">Datos</h3>
          <Campo id="receta-nombre" etiqueta={COPY_RECETAS.nombre} value={nombre} maxLength={120} error={porCampo['receta-nombre'] ?? null} onChange={(e) => (setNombre(e.target.value), cambiar())} />
          <div className="campo">
            <label htmlFor="receta-descripcion">{COPY_RECETAS.descripcion}</label>
            <textarea id="receta-descripcion" value={descripcion} maxLength={500} rows={2} onChange={(e) => (setDescripcion(e.target.value), cambiar())} />
          </div>
          <Campo
            id="receta-porciones"
            etiqueta={COPY_RECETAS.porciones}
            inputMode="numeric"
            value={porciones}
            error={porCampo['receta-porciones'] ?? null}
            onChange={(e) => (setPorciones(e.target.value), cambiar())}
          />
        </section>

        <section className="seccion" aria-labelledby="receta-ingredientes">
          <h3 id="receta-ingredientes">{COPY_RECETAS.ingredientes}</h3>
          <p className="nota">{COPY_RECETAS.avisoDeCantidades}</p>
          {ingredientes.length > 0 ? (
            <ol className="ingredientes-de-receta">
              {ingredientes.map((i, n) => (
                <li key={i.clave} className="fila-de-item">
                  <p className="lista__titulo">
                    {n + 1}. {i.nombre}
                  </p>
                  {i.fuente ? <p className="nota">{i.fuente}</p> : null}
                  <div className="fila-de-dato">
                    <Campo
                      id={`${i.clave}-cantidad`}
                      etiqueta={`${COPY_RECETAS.cantidad} de ${i.nombre}`}
                      inputMode="decimal"
                      value={i.cantidad}
                      error={porCampo[`${i.clave}-cantidad`] ?? null}
                      onChange={(e) => cambiarIngrediente(i.clave, { cantidad: e.target.value })}
                    />
                    <div className="campo">
                      <label htmlFor={`${i.clave}-unidad`}>Unidad</label>
                      <select id={`${i.clave}-unidad`} value={i.unidad} onChange={(e) => cambiarIngrediente(i.clave, { unidad: e.target.value === 'ml' ? 'ml' : 'g' })}>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                      </select>
                    </div>
                    <div className={`campo${porCampo[`${i.clave}-estado`] ? ' campo--error' : ''}`}>
                      <label htmlFor={`${i.clave}-estado`}>{COPY_RECETAS.estadoDePreparacion}</label>
                      <select
                        id={`${i.clave}-estado`}
                        value={i.estado}
                        aria-invalid={porCampo[`${i.clave}-estado`] ? true : undefined}
                        aria-describedby={porCampo[`${i.clave}-estado`] ? `${i.clave}-estado-error` : undefined}
                        onChange={(e) => cambiarIngrediente(i.clave, { estado: (e.target.value || '') as EstadoDePreparacion | '' })}
                      >
                        <option value="">Elegí el estado</option>
                        {(Object.keys(ETIQUETA_DE_PREPARACION) as EstadoDePreparacion[]).map((p) => (
                          <option key={p} value={p}>
                            {ETIQUETA_DE_PREPARACION[p]}
                          </option>
                        ))}
                      </select>
                      {porCampo[`${i.clave}-estado`] ? (
                        <p id={`${i.clave}-estado-error`} className="campo__error">
                          <span aria-hidden="true">⚠ </span>
                          {porCampo[`${i.clave}-estado`]}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="boton boton--enlace"
                    onClick={() => {
                      setIngredientes((lista) => lista.filter((x) => x.clave !== i.clave));
                      cambiar();
                    }}
                  >
                    {COPY_RECETAS.quitarIngrediente} {i.nombre}
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
          <BuscadorDeAlimentos
            token={token}
            sesionPerdida={sesionPerdida}
            error={porCampo['receta-buscar-texto'] ?? null}
            onElegir={(e) => {
              setIngredientes((lista) => [
                ...lista,
                {
                  clave: nuevaClave(),
                  catalogItemId: e.catalogItemId,
                  catalogItemVersionId: e.versionId,
                  nombre: e.name,
                  fuente: fuenteDelAlimento(e),
                  cantidad: '',
                  unidad: e.composition.referenceAmount === '100ml' ? 'ml' : 'g',
                  estado: '',
                },
              ]);
              cambiar();
            }}
          />
        </section>

        <section className="seccion" aria-labelledby="receta-calculo" aria-busy={calculo.tipo === 'calculando' || (calculo.tipo === 'listo' && calculo.actualizando)}>
          <h3 id="receta-calculo">{COPY_RECETAS.calculo}</h3>
          <Ayuda titulo="Cómo se calcula">
            <p>{COPY_RECETAS.metodo}</p>
            <p>{COPY_RECETAS.fuenteUsda}</p>
          </Ayuda>
          <div aria-live="polite">
            {calculo.tipo === 'incompleto' ? <p className="nota">{COPY_RECETAS.completaParaCalcular}</p> : null}
            {calculo.tipo === 'calculando' ? <p className="nota">{COPY_RECETAS.calculando}</p> : null}
            {calculo.tipo === 'fallo' ? (
              <Aviso tipo="error">
                <p>{calculo.texto}</p>
              </Aviso>
            ) : null}
            {calculo.tipo === 'listo' && calculo.actualizando ? <p className="nota">{COPY_RECETAS.calculando}</p> : null}
          </div>
          {calculo.tipo === 'listo' ? <TablaDeCalculo calculo={calculo.calculo} nombres={nombres} /> : null}
        </section>

        <section className="seccion" aria-labelledby="receta-pasos">
          <h3 id="receta-pasos">{COPY_RECETAS.pasos}</h3>
          {pasos.length > 0 ? (
            <ol className="pasos-de-receta">
              {pasos.map((p, n) => (
                <li key={n}>
                  <div className="campo">
                    <label htmlFor={`receta-paso-${n}`}>Paso {n + 1}</label>
                    <textarea id={`receta-paso-${n}`} value={p} maxLength={500} rows={2} onChange={(e) => (setPasos((l) => l.map((x, k) => (k === n ? e.target.value : x))), cambiar())} />
                  </div>
                  <button type="button" className="boton boton--enlace" onClick={() => (setPasos((l) => l.filter((_, k) => k !== n)), cambiar())}>
                    {COPY_RECETAS.quitarPaso} {n + 1}
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
          <button type="button" className="boton boton--secundario" disabled={pasos.length >= 20} onClick={() => (setPasos((l) => [...l, '']), cambiar())}>
            {COPY_RECETAS.agregarPaso}
          </button>
        </section>

        {fallo ? (
          <Aviso tipo="error" enfocar>
            <p>{fallo}</p>
          </Aviso>
        ) : null}
        <div className="acciones">
          <button type="submit" className="boton boton--primario" disabled={enviando || (cargada !== null && !sucio)}>
            {enviando ? COPY_RECETAS.guardando : COPY_RECETAS.guardar}
          </button>
        </div>
        {cargada && sucio ? <p className="nota">Al guardar se crea la versión {cargada.versionNumber + 1}. Los planes ya activados conservan la que tenían.</p> : null}
      </form>

      {cargada ? (
        <section className="seccion" aria-labelledby="receta-imagen">
          <h3 id="receta-imagen">{COPY_RECETAS.imagenDeReferencia}</h3>
          {avisoDeImagen ? (
            <Aviso tipo="exito">
              <p>{avisoDeImagen}</p>
            </Aviso>
          ) : null}
          <ImagenDeReceta
            token={token}
            receta={cargada}
            sesionPerdida={sesionPerdida}
            onCambio={(r, aviso) => {
              setCargada((d) => (d ? { ...d, ...r } : d));
              setAvisoDeImagen(aviso);
            }}
          />
        </section>
      ) : (
        <p className="nota">{COPY_RECETAS.guardaAntesDeLaImagen}</p>
      )}

      {cargada ? (
        <section className="seccion" aria-labelledby="receta-versiones">
          <h3 id="receta-versiones">{COPY_RECETAS.historial}</h3>
          <ol className="lista-compacta" reversed>
            {[...cargada.versions].reverse().map((v) => (
              <li key={v.recipeVersionId}>
                {COPY_RECETAS.version(v.versionNumber)} · {v.name} · {fecha(v.recordedAt)}
                {v.recipeVersionId === cargada.recipeVersionId ? <span className="insignia">vigente</span> : null}
              </li>
            ))}
          </ol>
          <p className="nota">
            {COPY_RECETAS.porcionesYEnergia(cargada.servings, nutrienteParaMostrar(cargada.calculation.perServing.energyKcal, 'energyKcal'))}
          </p>
        </section>
      ) : null}
    </div>
  );
}

function BuscadorDeAlimentos({
  token,
  sesionPerdida,
  error,
  onElegir,
}: {
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  error: string | null;
  onElegir: (e: ElementoDeCatalogo) => void;
}) {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<readonly ElementoDeCatalogo[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [fallo, setFallo] = useState(false);

  async function buscar() {
    if (!texto.trim()) return;
    setBuscando(true);
    setFallo(false);
    const r = await api.buscarEnCatalogo(token, texto.trim());
    setBuscando(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setFallo(true);
    setResultados(r.datos.data.filter((e) => e.available));
  }

  return (
    <div className="buscador">
      <div className="fila-de-dato">
        <Campo
          id="receta-buscar-texto"
          etiqueta={COPY_RECETAS.buscarIngrediente}
          value={texto}
          error={error}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            // Enter busca, sin enviar el formulario de la receta.
            if (e.key === 'Enter') {
              e.preventDefault();
              void buscar();
            }
          }}
        />
        <button type="button" className="boton boton--secundario" onClick={() => void buscar()} disabled={buscando}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </div>
      {fallo ? (
        <Aviso tipo="error">
          <p>No pudimos buscar en el catálogo. Probá de nuevo.</p>
        </Aviso>
      ) : null}
      {resultados ? (
        resultados.length === 0 ? (
          <p className="nota">No encontramos alimentos con ese nombre.</p>
        ) : (
          <ul className="lista">
            {resultados.map((e) => (
              <li key={e.catalogItemId} className="lista__item">
                <p className="lista__titulo">{e.name}</p>
                <p className="nota">
                  {COPY_RECETAS.cada100(String(e.composition.energyKcal).replace('.', ','), e.composition.referenceAmount)}
                  {fuenteDelAlimento(e) ? ` · ${fuenteDelAlimento(e)}` : ''}
                </p>
                <button
                  type="button"
                  className="boton boton--enlace"
                  onClick={() => {
                    onElegir(e);
                    setResultados(null);
                    setTexto('');
                  }}
                >
                  {COPY_RECETAS.agregarIngrediente}: {e.name}
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
