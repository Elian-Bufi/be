/**
 * WP-TABLERO-ALTA-GAMA TB-05 (DL-163 D-2) · el rostro y «Ocultar nombres», sin React:
 *  1. TEST-TAG-003 · `inicialesDe` (`apps/web/src/lib/retrato.ts`): títulos, partículas, tildes, una sola palabra, emojis,
 *     lo que va entre paréntesis y la referencia neutral, que no tiene iniciales (el monograma lleva el ícono «persona»);
 *  2. TEST-TAG-004 · «Ocultar nombres» cambia cada nombre por su referencia (`nombreQueSeVe`, `textoSinNombres`), y
 *     ninguna pantalla de /pro escribe un `displayName` sin pasar por `useNombres`;
 *  3. D-2 · el monograma no aparece en las solicitudes, las invitaciones, los avisos ni Administración, y el título de
 *     ninguna pestaña lleva un nombre.
 * El recorrido en el navegador (el Espacio y el Resumen con «Ocultar nombres») está en las capturas del tablero
 * (`EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/capturas.mjs`), que corre en la CI con la cohorte.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const { inicialesDe, nombreQueSeVe, referenciaDeProfesional, rolDe, textoSinNombres } = await import('../src/lib/retrato.ts');
const { referenciaNeutral } = await import('@be/domain');

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');
const ID = '9f1c2a7e-3b4d-4e5f-8a6b-0c1d2e3f4a5b';

// ─── TEST-TAG-003 · Las iniciales salen del nombre visible y nunca se inventan ─────────────────────────────────────

test('TEST-TAG-003 · dos palabras dan dos letras, y una sola, una', () => {
  assert.equal(inicialesDe('Diego Sosa'), 'DS');
  assert.equal(inicialesDe('Camila Ortiz'), 'CO');
  assert.equal(inicialesDe('Diego'), 'D');
  assert.equal(inicialesDe('diego sosa'), 'DS', 'en mayúscula, aunque el nombre esté en minúscula');
  assert.equal(inicialesDe('  Norma   Castro  '), 'NC');
  assert.equal(inicialesDe('Agustina María Ledesma'), 'AL', 'la primera y la última, no las del medio');
});

test('TEST-TAG-003 · los títulos no son iniciales', () => {
  assert.equal(inicialesDe('Lic. Sofía Paz'), 'SP');
  assert.equal(inicialesDe('Prof. Martín Acosta'), 'MA');
  assert.equal(inicialesDe('Dra. Ana Gil'), 'AG');
  assert.equal(inicialesDe('Lic Paula Ríos'), 'PR', 'también sin punto');
  assert.equal(inicialesDe('Mg. Lic. Juan Pérez'), 'JP', 'varios títulos seguidos');
  assert.equal(inicialesDe('Lic.'), null, 'un título solo no es un nombre');
  assert.equal(inicialesDe('J. Pérez'), 'JP', 'una inicial escrita sí cuenta');
});

test('TEST-TAG-003 · las partículas y lo que va entre paréntesis no cuentan', () => {
  assert.equal(inicialesDe('María de los Ángeles Pérez'), 'MP');
  assert.equal(inicialesDe('Ana del Valle'), 'AV');
  assert.equal(inicialesDe('Ludwig van Beethoven'), 'LB');
  assert.equal(inicialesDe('Lic. Sofía Paz (sintética)'), 'SP');
  assert.equal(inicialesDe('Diego Sosa (sintético)'), 'DS');
});

test('TEST-TAG-003 · las tildes y las eñes se conservan', () => {
  assert.equal(inicialesDe('Federico Álvarez'), 'FÁ');
  assert.equal(inicialesDe('Íñigo Ñúñez'), 'ÍÑ');
  assert.equal(inicialesDe('Héctor Funes'), 'HF');
  assert.equal(inicialesDe('Émilie Durand'), 'ÉD', 'una tilde escrita aparte se junta con su letra');
  assert.equal(inicialesDe('María-José Pérez'), 'MP', 'un nombre con guion es una palabra');
});

test('TEST-TAG-003 · lo que no es letra no da una inicial', () => {
  assert.equal(inicialesDe('🏋️ Diego Sosa'), 'DS');
  assert.equal(inicialesDe('Diego 💪'), 'D');
  assert.equal(inicialesDe('💪🔥'), null);
  assert.equal(inicialesDe('123 456'), null);
  assert.equal(inicialesDe('«Diego» Sosa'), 'DS');
  assert.equal(inicialesDe(''), null);
  assert.equal(inicialesDe(null), null);
  assert.equal(inicialesDe(undefined), null);
});

test('TEST-TAG-003 · la referencia neutral y el reemplazo de la API no tienen iniciales', () => {
  assert.equal(inicialesDe(referenciaNeutral(ID)), null);
  assert.equal(inicialesDe('Asesorado · a9be23'), null);
  assert.equal(inicialesDe('Profesional'), null, 'la API llama así a un profesional sin nombre: no es «P»');
  assert.equal(inicialesDe(referenciaDeProfesional(ID)), null);
  assert.equal(inicialesDe('Asesorado'), null);
});

// ─── TEST-TAG-004 · «Ocultar nombres» no deja pasar un nombre ──────────────────────────────────────────────────────

const DIEGO = { identityId: ID, displayName: 'Diego Sosa' };
const SOFIA = { identityId: '11111111-2222-4333-8444-5555aa66bb77', displayName: 'Lic. Sofía Paz' };

test('TEST-TAG-004 · con los nombres ocultos, cada persona es su referencia, sin iniciales', () => {
  assert.equal(nombreQueSeVe(DIEGO, false, 'asesorado'), 'Diego Sosa');
  assert.equal(nombreQueSeVe(DIEGO, true, 'asesorado'), referenciaNeutral(ID));
  assert.equal(nombreQueSeVe(SOFIA, true, 'profesional'), 'Profesional · 66bb77');
  for (const [actor, rol] of [
    [DIEGO, 'asesorado'],
    [SOFIA, 'profesional'],
  ]) {
    const visto = nombreQueSeVe(actor, true, rol);
    assert.equal(inicialesDe(visto), null, `${visto} no da iniciales`);
    assert.doesNotMatch(visto, /Diego|Sosa|Sofía|Paz/);
  }
});

test('TEST-TAG-004 · el papel de quien escribió sale de la entrada o de la ficha', () => {
  assert.equal(rolDe(DIEGO, ID), 'asesorado');
  assert.equal(rolDe({ ...SOFIA, role: 'PROFESSIONAL' }, ID), 'profesional');
  assert.equal(rolDe({ identityId: 'otro', displayName: 'Diego Sosa', role: 'ADVISEE' }, ID), 'asesorado');
});

test('TEST-TAG-004 · los textos que arma la API pierden los nombres conocidos', () => {
  const conocidos = [
    { actor: DIEGO, rol: 'asesorado' },
    { actor: SOFIA, rol: 'profesional' },
  ];
  assert.equal(textoSinNombres('Corregida por Diego Sosa', conocidos, false), 'Corregida por Diego Sosa');
  assert.equal(textoSinNombres('Corregida por Diego Sosa', conocidos, true), `Corregida por ${referenciaNeutral(ID)}`);
  assert.equal(textoSinNombres('Lic. Sofía Paz te escribió sobre Diego Sosa', conocidos, true), `Profesional · 66bb77 te escribió sobre ${referenciaNeutral(ID)}`);
  // El más largo primero: «Diego Sosa» no deja «Diego» suelto si también se conoce a un «Diego».
  assert.equal(textoSinNombres('Diego Sosa', [{ actor: { identityId: 'x', displayName: 'Diego' }, rol: 'asesorado' }, ...conocidos], true), referenciaNeutral(ID));
});

/** Los archivos de un directorio, recursivo. */
function archivos(dir, extension = /\.(tsx?|mjs)$/) {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    return statSync(ruta).isDirectory() ? archivos(ruta, extension) : extension.test(n) ? [ruta] : [];
  });
}

test('TEST-TAG-004 · ninguna pantalla de /pro escribe un nombre sin pasar por «Ocultar nombres»', () => {
  // Toda lectura del nombre de una persona en /pro pasa por `useNombres` (o por `nombreQueSeVe`): si alguien vuelve a
  // escribir `p.advisee.displayName` en una pantalla, el nombre se vería con «Ocultar nombres» prendido.
  const directos = archivos(join(WEB, 'src/app/pro')).flatMap((ruta) =>
    readFileSync(ruta, 'utf8')
      .split('\n')
      .flatMap((linea, i) => (/\.displayName\b/.test(linea) ? [`${relative(WEB, ruta)}:${i + 1}`] : [])),
  );
  assert.deepEqual(directos, []);
  // El centro de novedades se comparte con la cuenta de la persona: en /pro, sus nombres pasan por `useNombres`.
  const novedades = readFileSync(join(WEB, 'src/components/centro-de-novedades.tsx'), 'utf8');
  assert.doesNotMatch(novedades, /\{n\.title\}|\{n\.body\}|\.displayName/);
});

// ─── D-2 · Dónde no va el monograma, y el título de la pestaña ─────────────────────────────────────────────────────

test('D-2 · el monograma no va en solicitudes, invitaciones, avisos ni Administración', () => {
  const prohibidos = [
    'src/app/pro/solicitudes-enviadas.tsx',
    'src/app/pro/solicitar-vinculo.tsx',
    'src/app/pro/invitar-persona.tsx',
    'src/components/ayuda.tsx',
    'src/components/aviso-de-llegada.tsx',
    ...archivos(join(WEB, 'src/app/admin')).map((r) => relative(WEB, r)),
    ...archivos(join(WEB, 'src/app/invitacion')).map((r) => relative(WEB, r)),
  ];
  const conRetrato = prohibidos.filter((r) => {
    try {
      return /<Retrato\b|from '[./]*components\/retrato'|from '\.\/retrato'/.test(readFileSync(join(WEB, r), 'utf8'));
    } catch {
      return false;
    }
  });
  assert.deepEqual(conRetrato, []);
});

test('TEST-TAG-004 · el título de ninguna pestaña lleva un nombre', () => {
  // Los títulos son fijos (`metadata`) y nadie los cambia en el navegador: el título queda en el historial.
  const cambian = archivos(join(WEB, 'src')).filter((r) => /document\.title\s*=/.test(readFileSync(r, 'utf8')));
  assert.deepEqual(cambian, []);
  for (const ruta of archivos(join(WEB, 'src/app/pro'))) {
    const titulo = /export const metadata[^=]*=\s*\{\s*title:\s*([^,}]+)/.exec(readFileSync(ruta, 'utf8'))?.[1];
    if (titulo) assert.match(titulo.trim(), /^'[^'$]+'$/, `${relative(WEB, ruta)}: el título es un texto fijo`);
  }
});
