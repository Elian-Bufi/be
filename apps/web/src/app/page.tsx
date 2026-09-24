import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { AvisoDeLlegada } from '../components/aviso-de-llegada';
import { Encabezado } from '../components/encabezado';
import { Pie } from '../components/pie';
import isotipo from '../marca/isotipo-640.png';

/** Dónde se descarga la APK de prueba: la última release de GitHub, con su SHA-256 en la evidencia (DESPLIEGUE.md). */
const APK = 'https://github.com/Elian-Bufi/be/releases/latest';

/**
 * Landing pública: el estado `PUBLIC` de la jornada de acceso (B10-02 §3), que lleva a «Crear cuenta» y a «Iniciar
 * sesión». El contenido sale del legajo, no se inventa: el nombre de las portadas del legajo, la declaración central
 * (02 §3.2) y la propuesta de valor (02 §9), y lo que queda fuera del alcance (02 §14). No promete resultados de salud
 * (RNF-ACC-002) y dice que es un ambiente de prueba con datos sintéticos (08 §33).
 */
export default function Inicio() {
  return (
    <div className="tema-oscuro">
      <Encabezado />
      <main id="contenido" className="landing">
        <section className="portada" aria-labelledby="titulo-portada">
          <div>
            <p className="portada__marca">BE · Better Everyday</p>
            <h1 id="titulo-portada">Plataforma integrada de inteligencia en salud</h1>
            <p className="portada__bajada">
              Nutrición, entrenamiento y antropometría en un mismo seguimiento. Cada profesional dirige su especialidad, y todos trabajan sobre la
              historia de la persona, con su autorización.
            </p>
            <Suspense fallback={null}>
              <AvisoDeLlegada />
            </Suspense>
            <nav className="acciones" aria-label="Acceso">
              <Link className="boton boton--primario" href="/register">
                Comenzar
              </Link>
              <Link className="boton boton--secundario" href="/login">
                Ya tengo una cuenta
              </Link>
            </nav>
          </div>
          <div className="portada__isotipo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={isotipo.src} width={320} height={320} alt="" />
          </div>
        </section>

        <section className="landing__seccion" aria-labelledby="titulo-que-es">
          <h2 id="titulo-que-es">Qué es BE</h2>
          <p className="landing__texto">
            BE convierte el seguimiento de salud y rendimiento en un proceso que se sostiene en el tiempo: conserva la historia de cada persona,
            respeta qué profesional es responsable de cada especialidad y ordena la información dispersa para que cada decisión se apoye en la
            anterior.
          </p>
          <p className="landing__texto tenue">
            Aprender, en BE, es conservar el historial, comparar períodos y facilitar decisiones humanas. BE no decide por nadie ni cambia un plan
            por su cuenta.
          </p>
        </section>

        <section className="landing__seccion landing__columnas" aria-label="Qué hace BE por cada persona">
          <article className="tarjeta">
            <h2>Para el profesional</h2>
            <ul>
              <li>Reunir la información pertinente de cada persona.</li>
              <li>Comparar lo planificado con lo realizado.</li>
              <li>Conservar el historial y ver la evolución.</li>
              <li>Consultar, con autorización, el contexto de las otras especialidades.</li>
              <li>Registrar decisiones y dejar trazable la continuidad del trabajo.</li>
            </ul>
          </article>
          <article className="tarjeta">
            <h2>Para el asesorado</h2>
            <ul>
              <li>Saber qué tiene que hacer.</li>
              <li>Registrar lo que hizo.</li>
              <li>Entender qué cambió y ver su evolución.</li>
              <li>Saber quién dirige cada especialidad.</li>
              <li>Administrar sus vínculos y sus consentimientos.</li>
            </ul>
          </article>
        </section>

        <section className="landing__seccion" aria-labelledby="titulo-dominios">
          <h2 id="titulo-dominios">Tres especialidades, una historia</h2>
          <div className="landing__columnas">
            <Especialidad titulo="Nutrición" icono={<IconoNutricion />}>
              El plan alimentario, lo que la persona registra que comió y la revisión de su profesional.
            </Especialidad>
            <Especialidad titulo="Entrenamiento" icono={<IconoEntrenamiento />}>
              El plan de entrenamiento, cada sesión que la persona ejecuta y la revisión de su profesional.
            </Especialidad>
            <Especialidad titulo="Antropometría" icono={<IconoAntropometria />}>
              Las evaluaciones con su protocolo, los cálculos con su método y la evolución de cada medida.
            </Especialidad>
          </div>
        </section>

        <section className="landing__seccion" aria-labelledby="titulo-limites">
          <h2 id="titulo-limites">Lo que BE no hace</h2>
          <ul className="landing__limites">
            <li>No diagnostica ni prescribe: acompaña el trabajo de profesionales.</li>
            <li>No calcula un puntaje de salud ni compara personas entre sí.</li>
            <li>No arma planes por su cuenta: cada plan lo arma un profesional.</li>
            <li>Un profesional ve tus datos solo si vos lo autorizaste, y podés retirar esa autorización.</li>
          </ul>
        </section>

        <section className="landing__seccion tarjeta landing__app" aria-labelledby="titulo-app">
          <div>
            <h2 id="titulo-app">La app para Android</h2>
            <p>El asesorado usa BE desde el celular: ve el plan de hoy, registra lo que hizo, sigue su evolución y administra sus vínculos.</p>
            <p className="nota">Se instala fuera de Google Play: Android te va a pedir permiso para instalar apps de origen desconocido.</p>
          </div>
          <a className="boton boton--secundario" href={APK}>
            Descargar la APK de prueba
          </a>
        </section>
      </main>
      <Pie />
    </div>
  );
}

function Especialidad({ titulo, icono, children }: { titulo: string; icono: ReactNode; children: ReactNode }) {
  return (
    <article className="tarjeta">
      <span className="tarjeta__icono" aria-hidden="true">
        {icono}
      </span>
      <h3>{titulo}</h3>
      <p>{children}</p>
    </article>
  );
}

/* Íconos de trazo, dibujados para BE: decorativos, el título de cada tarjeta dice lo mismo. */
const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function IconoNutricion() {
  return (
    <svg viewBox="0 0 24 24" {...trazo}>
      <path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0Z" />
      <path d="M12 8.5c0-2.8 1.8-4.8 4.5-5.2-.2 2.9-2 4.9-4.5 5.2Z" />
      <path d="M8 20.5h8" />
    </svg>
  );
}

function IconoEntrenamiento() {
  return (
    <svg viewBox="0 0 24 24" {...trazo}>
      <path d="M6.5 7v10M4 9.5v5M17.5 7v10M20 9.5v5M6.5 12h11" />
    </svg>
  );
}

function IconoAntropometria() {
  return (
    <svg viewBox="0 0 24 24" {...trazo}>
      <rect x="2.5" y="8" width="19" height="8" rx="2" />
      <path d="M6.5 8v3M10 8v4.5M13.5 8v3M17 8v4.5" />
    </svg>
  );
}
