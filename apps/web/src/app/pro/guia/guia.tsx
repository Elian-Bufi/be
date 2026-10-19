'use client';

/**
 * La Guía del espacio profesional (DL-145): las ayudas de cada pantalla, en el orden en que se trabaja con una persona.
 * Son las mismas piezas que se abren con «Cómo se lee esta vista»; adentro de `GuiaDeAyudas` se muestran enteras, como
 * texto corrido. La pantalla trae solo sus renglones esenciales y un enlace al ancla de su sección (DL-146).
 */
import { METRICAS_DEL_DICCIONARIO } from '@be/domain';
import { useEffect, type ReactNode } from 'react';
import { GuiaDeAyudas } from '../../../components/ayuda-de-vista';
import { AyudaDeEvolucion } from '../advisees/anthropometry/ayuda-de-evolucion';
import { AyudaDeLaCarga } from '../advisees/anthropometry/ayuda-de-la-carga';
import { AyudaDeLaLamina } from '../advisees/anthropometry/ayuda-de-la-lamina';
import { AyudaDeTomas } from '../advisees/anthropometry/ayuda-de-tomas';
import { AyudaDeRevisiones } from '../advisees/ayuda-de-revisiones';
import { AyudaDeSolicitudes } from '../advisees/forms/ayuda-de-solicitudes';
import { AyudaDeRegistros } from '../advisees/nutrition/ayuda-de-registros';
import { AyudaDelPlan } from '../advisees/nutrition/ayuda-del-plan';
import { ComoSeLeeEstaVista } from '../advisees/seguimiento/como-se-lee';
import { AyudaDeRegistrosDeEntrenamiento } from '../advisees/training/ayuda-de-registros';
import { AyudaDelPlanDeEntrenamiento } from '../advisees/training/ayuda-del-plan';

/** Las métricas del diccionario que todavía no se pueden mirar, con su porqué: antes, un plegable en Analizar. */
const NO_OFRECIDAS = METRICAS_DEL_DICCIONARIO.filter((m) => !m.implementada);

const PARTES = [
  { id: 'ficha', titulo: 'La ficha de la persona' },
  { id: 'nutricion', titulo: 'Nutrición' },
  { id: 'entrenamiento', titulo: 'Entrenamiento' },
  { id: 'antropometria', titulo: 'Antropometría' },
  { id: 'informacion', titulo: 'Información' },
] as const;

export function Guia() {
  // El enlace del diálogo de una pantalla trae el ancla de su ayuda: al llegar navegando, se lleva la sección a la vista.
  useEffect(() => {
    const ancla = decodeURIComponent(window.location.hash.slice(1));
    if (ancla) document.getElementById(ancla)?.scrollIntoView();
  }, []);
  return (
    <GuiaDeAyudas>
      <nav className="guia__indice" aria-label="Partes de la guía">
        {PARTES.map((p) => (
          <a key={p.id} href={`#guia-${p.id}`}>
            {p.titulo}
          </a>
        ))}
      </nav>
      <div className="guia">
        <Parte id="ficha" titulo="La ficha de la persona">
          <ComoSeLeeEstaVista vista="resumen" />
          <ComoSeLeeEstaVista vista="linea" />
          <ComoSeLeeEstaVista vista="analizar" />
          <section className="guia__seccion" aria-labelledby="guia-no-ofrecidas">
            <h3 id="guia-no-ofrecidas">Lo que Analizar todavía no ofrece</h3>
            <ul>
              {NO_OFRECIDAS.map((m) => (
                <li key={m.id}>
                  <strong>{m.nombre}:</strong> {m.explicacion}
                </li>
              ))}
            </ul>
          </section>
        </Parte>
        <Parte id="nutricion" titulo="Nutrición">
          <AyudaDelPlan />
          <AyudaDeRegistros />
          <AyudaDeRevisiones area="NUTRICION" />
        </Parte>
        <Parte id="entrenamiento" titulo="Entrenamiento">
          <AyudaDelPlanDeEntrenamiento />
          <AyudaDeRegistrosDeEntrenamiento />
          <AyudaDeRevisiones area="ENTRENAMIENTO" />
        </Parte>
        <Parte id="antropometria" titulo="Antropometría">
          <AyudaDeTomas />
          <AyudaDeLaCarga />
          <AyudaDeEvolucion />
          <AyudaDeLaLamina />
        </Parte>
        <Parte id="informacion" titulo="Información">
          <AyudaDeSolicitudes />
        </Parte>
      </div>
    </GuiaDeAyudas>
  );
}

function Parte({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section className="guia__parte" id={`guia-${id}`} aria-labelledby={`guia-${id}-titulo`}>
      <h2 id={`guia-${id}-titulo`}>{titulo}</h2>
      {children}
    </section>
  );
}
