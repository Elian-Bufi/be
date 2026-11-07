// TA-71 · «Tu semana» no pisa la columna de al lado (WP-TABLERO-ALTA-GAMA, TB-07).
//
// En la galería de capturas del PR #240, a 1280 y a 1440, «Norma Castro» pisaba la raya de «Hoy» y «Diego Sosa» la de
// «mar 10»: la columna de las fichas crecía con el nombre y la elipsis nunca llegaba a cortar. Las capturas miden, en
// cada tamaño y en los dos temas, con los nombres a la vista y ocultos, que el monograma, el nombre y el área de cada
// ficha queden adentro de su columna. Una parte que se pasa hace fallar la corrida.
//
// Dos piezas, sin dependencias: `medirTuSemana` corre adentro de la página (`page.evaluate`) y solo mide;
// `partesQueSePasan` decide afuera, y la prueba `scripts/espacio-profesional.test.mjs` la ejercita en `npm test`.

/** Medio píxel de tolerancia: el redondeo de la grilla no es pisar la columna de al lado. */
export const TOLERANCIA_PX = 0.5;

/**
 * Corre en la página. Por cada columna de «Tu semana», su caja de contenido (sin el relleno) y, por cada ficha, lo que
 * se ve de su monograma, su nombre, el ícono del área y el área: la caja, si la parte recorta lo que no entra, o la caja
 * junto con su texto, si no recorta (un texto que se sale de su caja se ve igual). Una parte que no se dibuja no cuenta.
 */
export function medirTuSemana() {
  const loQueSeVe = (el) => {
    const caja = el.getBoundingClientRect();
    if (caja.width === 0 && caja.height === 0) return null;
    if (getComputedStyle(el).overflowX !== 'visible') return { izquierda: caja.left, derecha: caja.right };
    const rango = document.createRange();
    rango.selectNodeContents(el);
    const texto = rango.getBoundingClientRect();
    const conTexto = texto.width > 0;
    return { izquierda: Math.min(caja.left, conTexto ? texto.left : caja.left), derecha: Math.max(caja.right, conTexto ? texto.right : caja.right) };
  };
  return [...document.querySelectorAll('.tu-semana__dia')].map((col) => {
    const c = col.getBoundingClientRect();
    const estilo = getComputedStyle(col);
    return {
      dia: col.querySelector('h3')?.firstChild?.textContent?.trim() ?? '',
      columna: { izquierda: c.left + parseFloat(estilo.paddingLeft), derecha: c.right - parseFloat(estilo.paddingRight) },
      fichas: [...col.querySelectorAll('.ficha-de-la-semana')].map((ficha) =>
        [
          ['monograma', ficha.querySelector('.retrato')],
          ['nombre', ficha.querySelector('.ficha-de-la-semana__nombre')],
          ['ícono del área', ficha.querySelector('.ficha-de-la-semana__area > .icono')],
          ['área', ficha.querySelector('.ficha-de-la-semana__cual')],
        ].flatMap(([parte, el]) => {
          const visto = el ? loQueSeVe(el) : null;
          return visto ? [{ parte, ...visto }] : [];
        }),
      ),
    };
  });
}

/**
 * Lo que se pasa de su columna, por cualquiera de los dos lados: una frase por parte («lun 9 · nombre: sobresale 19 a la
 * derecha», en px de CSS), vacía si todo entra.
 */
export function partesQueSePasan(columnas, tolerancia = TOLERANCIA_PX) {
  const frases = [];
  for (const { dia, columna, fichas } of columnas) {
    fichas.forEach((partes, i) => {
      for (const p of partes) {
        const derecha = p.derecha - columna.derecha;
        const izquierda = columna.izquierda - p.izquierda;
        const quien = `${dia}${fichas.length > 1 ? ` (ficha ${i + 1})` : ''} · ${p.parte}`;
        if (derecha > tolerancia) frases.push(`${quien}: sobresale ${Math.round(derecha)} a la derecha`);
        if (izquierda > tolerancia) frases.push(`${quien}: sobresale ${Math.round(izquierda)} a la izquierda`);
      }
    });
  }
  return frases;
}

/** Cuántas fichas midió, para que una corrida sin fichas no pase por buena sin decirlo. */
export const fichasMedidas = (columnas) => columnas.reduce((n, c) => n + c.fichas.length, 0);
