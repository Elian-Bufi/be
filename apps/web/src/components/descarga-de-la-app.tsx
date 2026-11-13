'use client';

/**
 * PG-06 de WP-PULIDO-GRANDES (DL-173): «La app para Android» de la portada, sin pasar por GitHub.
 * - Desde la compu, un QR con «Escaneá para bajar BE»: se apunta con el teléfono y la APK baja directo, porque el QR
 *   lleva al archivo de la última publicación (`be.apk`, PG-D5), no a una página. Al lado, la versión y el tamaño.
 * - Desde el teléfono, en lugar del QR, un botón «Bajar BE» (el QR no se dibuja con el ancho de un teléfono).
 * - Debajo, los tres pasos para permitir la instalación, en castellano, con la marca elegible y su dibujo.
 * El QR se arma en el navegador con `CodigoQr` (DL-136), sin servicios externos. La versión y el tamaño se leen de la
 * lectura pública de GitHub (`lib/descarga-de-la-app.ts`); sin respuesta, la línea no se dibuja y el QR y el botón
 * siguen andando. No pide datos.
 */
import { useEffect, useId, useState } from 'react';
import {
  APK_DE_LA_ULTIMA,
  COPY_DESCARGA as C,
  datosDeLaUltima,
  ESPERA_DE_LA_LECTURA_MS,
  LECTURA_DE_LA_ULTIMA,
  PASOS_DE_LA_INSTALACION,
  type DatosDeLaUltima,
  type MarcaDelTelefono,
} from '../lib/descarga-de-la-app';
import { CodigoQr } from './codigo-qr';
import { Icono } from './icono';

const MARCAS: readonly MarcaDelTelefono[] = ['samsung', 'motorola', 'xiaomi'];

export function DescargaDeLaApp({ textoDelBoton }: { textoDelBoton: string }) {
  const id = useId();
  const [datos, setDatos] = useState<DatosDeLaUltima | null>(null);
  const [marca, setMarca] = useState<MarcaDelTelefono>('samsung');

  useEffect(() => {
    const control = new AbortController();
    const corte = setTimeout(() => control.abort(), ESPERA_DE_LA_LECTURA_MS);
    fetch(LECTURA_DE_LA_ULTIMA, { signal: control.signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: unknown) => setDatos(datosDeLaUltima(j)))
      .catch(() => setDatos(null))
      .finally(() => clearTimeout(corte));
    return () => {
      clearTimeout(corte);
      control.abort();
    };
  }, []);

  return (
    <section className="landing__seccion tarjeta descarga" aria-labelledby={`${id}-titulo`} data-descarga-de-la-app>
      <div className="descarga__cabeza">
        <div className="descarga__texto">
          <h2 id={`${id}-titulo`}>{C.titulo}</h2>
          <p>{C.queEs}</p>
          {datos ? (
            <p className="descarga__version" data-version-de-la-app>
              {C.version(datos.version, datos.tamano)}
            </p>
          ) : null}
          <p className="nota">{C.fueraDeGooglePlay}</p>
          {/* En el teléfono, el botón en lugar del QR. */}
          <a className="boton boton--primario descarga__en-el-telefono" href={APK_DE_LA_ULTIMA} download data-bajar-en-el-telefono>
            <Icono nombre="descargar" tamano={20} />
            {textoDelBoton}
          </a>
        </div>
        <figure className="descarga__qr" data-qr-de-la-app>
          <CodigoQr texto={APK_DE_LA_ULTIMA} etiqueta={C.etiquetaDelQr} tamano={192} />
          <figcaption>
            <strong>{C.escanea}</strong>
            <span className="nota">{C.conLaCamara}</span>
            <a className="boton boton--enlace" href={APK_DE_LA_ULTIMA} download data-bajar-en-la-compu>
              {C.enEstaCompu}
            </a>
          </figcaption>
        </figure>
      </div>

      <div className="descarga__pasos-y-marca">
        <h3>{C.pasos}</h3>
        <fieldset className="descarga__marcas">
          <legend className="visualmente-oculto">{C.tuTelefono}</legend>
          <span className="descarga__marcas-titulo" aria-hidden="true">
            {C.tuTelefono}
          </span>
          {MARCAS.map((m) => (
            <label key={m} className="descarga__marca">
              <input type="radio" name={`${id}-marca`} value={m} checked={marca === m} onChange={() => setMarca(m)} />
              <span>{C.marcas[m]}</span>
            </label>
          ))}
        </fieldset>
        <ol className="descarga__pasos" data-pasos-de={marca}>
          {PASOS_DE_LA_INSTALACION[marca].map((p, n) => (
            <li key={`${marca}-${n}`} className="descarga__paso">
              <DibujoDelPaso marca={marca} paso={(n + 1) as 1 | 2 | 3} etiqueta={`${C.marcas[marca]}, ${C.paso(n + 1).toLowerCase()}: ${p.enElDibujo}`} />
              <p>
                <strong>{C.paso(n + 1)}.</strong> {p.texto}
              </p>
            </li>
          ))}
        </ol>
        <p className="nota">{C.otraMarca}</p>
      </div>
    </section>
  );
}

/**
 * El dibujo de un paso: un teléfono esquemático con lo que hay que tocar resaltado. No copia la pantalla de ninguna
 * marca; cambia lo que distingue a cada una (la cabecera alta de Samsung, el cuadro al centro de Motorola y la hoja
 * desde abajo de Xiaomi) para que la persona reconozca lo que va a ver.
 */
function DibujoDelPaso({ marca, paso, etiqueta }: { marca: MarcaDelTelefono; paso: 1 | 2 | 3; etiqueta: string }) {
  const cabecera = marca === 'samsung' ? 46 : 22;
  return (
    <svg className="dibujo-del-paso" viewBox="0 0 96 168" width={96} height={168} role="img" aria-label={etiqueta} data-marca={marca} data-paso={paso}>
      <rect className="dibujo-del-paso__marco" x="2" y="2" width="92" height="164" rx="14" />
      <rect className="dibujo-del-paso__pantalla" x="8" y="12" width="80" height="144" rx="6" />
      {paso === 1 ? (
        <>
          {/* El aviso de la descarga, arriba. */}
          <rect className="dibujo-del-paso__resalte" x="12" y="18" width="72" height="30" rx="6" />
          <path className="dibujo-del-paso__icono" d="M22 26v8m-4-4 4 4 4-4M18 38h8" />
          <text className="dibujo-del-paso__texto" x="32" y="32">
            be.apk
          </text>
          <rect className="dibujo-del-paso__linea" x="32" y="37" width="40" height="3" rx="1.5" />
          <rect className="dibujo-del-paso__linea" x="14" y="62" width="68" height="4" rx="2" />
          <rect className="dibujo-del-paso__linea" x="14" y="72" width="52" height="4" rx="2" />
        </>
      ) : paso === 2 ? (
        <>
          {/* Ajustes: la fuente de la descarga, con el interruptor. */}
          <rect className="dibujo-del-paso__linea" x="14" y={12 + cabecera - 14} width="44" height="6" rx="3" />
          {marca === 'xiaomi' ? <rect className="dibujo-del-paso__hoja" x="8" y="88" width="80" height="68" rx="10" /> : null}
          <rect className="dibujo-del-paso__resalte" x="12" y={marca === 'xiaomi' ? 104 : 20 + cabecera} width="72" height="24" rx="6" />
          <rect className="dibujo-del-paso__linea" x="16" y={(marca === 'xiaomi' ? 104 : 20 + cabecera) + 10} width="36" height="4" rx="2" />
          <rect className="dibujo-del-paso__interruptor" x="60" y={(marca === 'xiaomi' ? 104 : 20 + cabecera) + 7} width="18" height="10" rx="5" />
          <circle className="dibujo-del-paso__perilla" cx="73" cy={(marca === 'xiaomi' ? 104 : 20 + cabecera) + 12} r="3.5" />
        </>
      ) : (
        <>
          {/* El cuadro de instalar, con el botón resaltado. */}
          <rect className="dibujo-del-paso__hoja" x="12" y={marca === 'motorola' ? 54 : 92} width="72" height="58" rx="8" />
          <rect className="dibujo-del-paso__app" x="20" y={(marca === 'motorola' ? 54 : 92) + 8} width="14" height="14" rx="4" />
          <rect className="dibujo-del-paso__linea" x="38" y={(marca === 'motorola' ? 54 : 92) + 13} width="30" height="4" rx="2" />
          <rect className="dibujo-del-paso__resalte" x="46" y={(marca === 'motorola' ? 54 : 92) + 36} width="34" height="16" rx="8" />
          <text className="dibujo-del-paso__texto dibujo-del-paso__texto--boton" x="63" y={(marca === 'motorola' ? 54 : 92) + 47} textAnchor="middle">
            Instalar
          </text>
        </>
      )}
    </svg>
  );
}
