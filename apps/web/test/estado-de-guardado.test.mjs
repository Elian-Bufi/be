/**
 * ED-03 · El estado de guardado, inequívoco, y el error recuperable (WP-EDITORES-PROFESIONAL; TEST-EDP-004).
 *
 * - «Guardado» solo con la respuesta del servidor; después de recargar, sin hora (DJ-10). Los textos son los del dominio
 *   (`COPY_GUARDADO`), con ícono, nunca solo color.
 * - Un fallo ofrece «Reintentar» y, plegado, el detalle técnico: la operación, el motivo, el código y la hora, sin datos
 *   de la persona.
 * - «Guardar ahora», fijo y secundario junto al estado (DJ-6): apagado, con su motivo, cuando no hay nada que guardar.
 *   «Guardar cambios» dejó de existir.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const EDITORES = ['app/pro/advisees/training/editor.tsx', 'app/pro/advisees/nutrition/editor.tsx'];

test('TEST-EDP-004 · los textos del estado son los del dominio, y «Guardado» nunca sale de un fallo', () => {
  const base = { guardando: false, sucio: false, puedeGuardar: true, fallo: false, conflicto: false, guardadoA: null };
  assert.equal(d.estadoDeGuardado({ ...base, guardadoA: '23:34' }).texto, 'Guardado a las 23:34');
  assert.equal(d.estadoDeGuardado(base).texto, 'Guardado');
  for (const e of [{ ...base, fallo: true }, { ...base, conflicto: true }, { ...base, guardando: true }, { ...base, fallo: true, sucio: true }]) {
    assert.doesNotMatch(d.estadoDeGuardado(e).texto, /^Guardado/);
  }
  assert.equal(d.COPY_GUARDADO.noSePudoReintento, 'No se pudo guardar: se reintenta al seguir editando o con «Reintentar»');
});

test('TEST-EDP-004 · el caso automático: un autoguardado sin respuesta dice el texto de DL-168 en la barra, con «Reintentar»', () => {
  // La barra recibe el motivo del detalle del último fallo; el editor lo deja en cada fallo.
  const fuente = leer('components/estado-de-guardado.tsx');
  assert.match(fuente, /estadoDeGuardado\(\{ \.\.\.entrada, motivoDelFallo: entrada\.motivoDelFallo \?\? detalle\?\.motivo \?\? null \}\)/);
  const base = { guardando: false, sucio: true, puedeGuardar: true, fallo: true, conflicto: false, guardadoA: null };
  assert.equal(d.estadoDeGuardado({ ...base, motivoDelFallo: d.detalleDelFallo({ ok: false, tipo: 'RED' }, '10:44').motivo }).texto, d.COPY_GUARDADO.sinRespuesta);
  for (const ruta of EDITORES) {
    const fuente = leer(ruta);
    // Sin respuesta, el texto lo dice la barra (también en el autoguardado): no hay un segundo aviso igual que se lleve el foco.
    assert.match(fuente, /if \(automatico \|\| motivo === 'SIN_RESPUESTA'\) return null;/, ruta);
    assert.doesNotMatch(fuente, /setMensaje\(\{ tipo: 'error', texto: COPY_GUARDADO\.sinRespuesta \}\)/, ruta);
  }
});

test('TEST-EDP-004 · el componente: texto con ícono, «Reintentar» y el detalle técnico plegado', () => {
  const fuente = leer('components/estado-de-guardado.tsx');
  // El estado se anuncia, y el ícono acompaña al texto.
  assert.match(fuente, /role="status" aria-live="polite"/);
  assert.match(fuente, /<Icono nombre=\{ICONO\[tipo\]\} tamano=\{15\} \/>\n\s*\{texto\}/);
  // Un fallo (que no es el conflicto) ofrece «Reintentar» y el detalle plegado.
  assert.match(fuente, /const conFallo = tipo === 'fallo' && !entrada\.conflicto;/);
  assert.match(fuente, /\{conFallo && onReintentar \? \([\s\S]*?onClick=\{onReintentar\}[\s\S]*?COPY_GUARDADO\.reintentar/);
  assert.match(fuente, /<details className="estado-de-guardado__detalle" data-detalle-tecnico>\s*<summary>\{COPY_GUARDADO\.detalleTecnico\}<\/summary>[\s\S]*?textoDelDetalleDelFallo\(detalle\)/);
  // El detalle no lleva nada de la persona: solo la operación, el motivo, el código y la hora.
  assert.equal(
    d.textoDelDetalleDelFallo(d.detalleDelFallo({ ok: false, tipo: 'API', status: 503, codigo: 'DB_UNAVAILABLE', issues: [] }, '10:44')),
    'guardar el borrador · sin respuesta · 503 DB_UNAVAILABLE · 10:44 · sin datos de la persona',
  );
});

test('TEST-EDP-004 · los dos editores: «Guardar ahora», fijo y secundario, con su motivo cuando no hay nada que guardar', () => {
  for (const ruta of EDITORES) {
    const fuente = leer(ruta);
    assert.match(fuente, /const sinGuardarAhora = motivoSinGuardarAhora\(\{ guardando, sucio, conflicto \}\);/, ruta);
    // Secundario siempre (no cambia de forma mientras se escribe), apagado con `aria-disabled` y su motivo.
    assert.match(
      fuente,
      /className="boton boton--secundario"\n\s*data-guardar-ahora\n\s*aria-disabled=\{sinGuardarAhora \? true : undefined\}\n\s*aria-describedby=\{sinGuardarAhora \? 'motivo-sin-guardar-ahora' : undefined\}/,
      ruta,
    );
    assert.match(fuente, /<span id="motivo-sin-guardar-ahora" className="visualmente-oculto">\s*\{sinGuardarAhora\}/, ruta);
    assert.match(fuente, /\{COPY_GUARDADO\.guardarAhora\}/, ruta);
    // «Guardar ahora» va junto al estado: es lo primero después de él.
    const estado = fuente.indexOf('<EstadoDeGuardado');
    assert.ok(estado > 0 && fuente.indexOf('data-guardar-ahora', estado) < fuente.indexOf('<button', fuente.indexOf('data-guardar-ahora', estado) + 1), ruta);
    // El fallo trae «Reintentar» (guarda con lo que está en pantalla) y su detalle.
    assert.match(fuente, /detalle=\{detalle\}\n\s*onReintentar=\{\(\) => void guardar\(\)\}/, ruta);
    assert.match(fuente, /setFallo\(true\);\n\s*setDetalle\(detalleDelFallo\(r, horaDelDia\(new Date\(\)\)\)\);/, ruta);
    // «Guardar cambios» dejó de existir, y el botón lleno no cambia con lo escrito.
    assert.doesNotMatch(fuente, /guardarCambios|Guardar cambios/, ruta);
    assert.doesNotMatch(fuente, /sucio \? 'boton--primario'|sucio \? 'boton--secundario'/, ruta);
  }
  for (const copia of [d.COPY_ENTRENAMIENTO, d.COPY_NUTRICION]) assert.equal(copia.guardarCambios, undefined);
});
