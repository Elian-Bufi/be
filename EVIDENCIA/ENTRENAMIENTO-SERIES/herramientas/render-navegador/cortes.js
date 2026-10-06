(() => {
  // Los textos que no entran en su caja: con numberOfLines, react-native-web los corta con «…» sin avisar. Se mide con
  // decimales (Range), como el ajuste de la barra. Devuelve cuántos textos se miraron y cuáles quedaron cortados.
  const docs = [document, ...[...document.querySelectorAll('iframe')].map((f) => f.contentDocument).filter(Boolean)];
  const cortados = [];
  let mirados = 0;
  for (const d of docs) {
    for (const el of d.querySelectorAll('div[dir], span[dir]')) {
      if (!el.textContent || el.children.length > 0) continue;
      const estilo = d.defaultView.getComputedStyle(el);
      const recorta = estilo.overflow === 'hidden' || estilo.textOverflow === 'ellipsis' || estilo.webkitLineClamp !== 'none';
      if (!recorta) continue;
      mirados++;
      const rango = d.createRange();
      rango.selectNodeContents(el);
      const r = rango.getBoundingClientRect();
      const caja = el.getBoundingClientRect();
      if (r.width > caja.width + 0.5 || el.scrollHeight > el.clientHeight + 1) cortados.push(el.textContent.slice(0, 40));
    }
  }
  return JSON.stringify({ mirados, cortados });
})()
