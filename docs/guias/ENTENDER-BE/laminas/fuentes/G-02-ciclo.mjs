// Guía central · nivel 1: el trabajo que BE ordena, como un ciclo entre el profesional y la persona, con la decisión de la
// persona (vínculo y autorización por área) en el centro. Fuentes: legajo (06 §8 proceso operativo, §10 nutrición) y las
// pantallas reales (website /pro y APK).
export const meta = {
  id: 'G-02',
  titulo: 'El ciclo de trabajo que BE ordena',
  alcance: 'Evaluar, fijar un objetivo, indicar un plan, registrar, analizar y revisar: quién hace cada paso y con qué superficie.',
  fuente: 'legajo 06 §8 y §10 · apps/web/src/app/pro · apps/mobile/src',
  estado: 'implementado',
  ancho: 750,
  alto: 300,
};

export function dibujar(L) {
  const w = 190;
  const xs = [14, 280, 546];
  const yArriba = 8;
  const yAbajo = 196;
  const paso = (id, x, y, titulo, detalle, tipo = 'sistema', enfasis = false) => L.redondeado({ id, x, y, w, h: 82, titulo, detalle, tipo, enfasis });
  paso('evaluacion', xs[0], yArriba, '1 · Evaluar', 'El profesional registra cómo está la persona hoy (website).');
  paso('objetivo', xs[1], yArriba, '2 · Fijar un objetivo', 'Hacia dónde, con números por día: kcal, macros o cargas.');
  paso('plan', xs[2], yArriba, '3 · Indicar un plan', 'Qué comer o entrenar. Al activarlo queda como versión.', 'sistema', true);
  paso('registro', xs[2], yAbajo, '4 · Registrar', 'La persona anota lo que hizo en la APK; lo que falta queda declarado.', 'persona');
  paso('analisis', xs[1], yAbajo, '5 · Analizar', 'Objetivo, indicado y registrado, lado a lado y sin calificar.');
  paso('revision', xs[0], yAbajo, '6 · Revisar', 'El profesional decide: seguir, ajustar o una nueva versión.');

  L.conector({ de: 'evaluacion', lado: 'e', a: 'objetivo', ladoA: 'o' });
  L.conector({ de: 'objetivo', lado: 'e', a: 'plan', ladoA: 'o' });
  L.conector({ de: 'plan', lado: 's', a: 'registro', ladoA: 'n', etiqueta: { texto: ['el plan del día'], lado: 'der' } });
  L.conector({ de: 'registro', lado: 'o', a: 'analisis', ladoA: 'e' });
  L.conector({ de: 'analisis', lado: 'o', a: 'revision', ladoA: 'e' });
  L.conector({ de: 'revision', lado: 'n', a: 'evaluacion', ladoA: 's', estilo: 'discontinuo', etiqueta: { texto: ['vuelve a', 'empezar'], lado: 'der' } });

  // En el centro: lo que habilita todo el ciclo.
  L.nota({
    x: xs[1] - 22,
    y: 106,
    w: w + 44,
    titulo: 'Lo que habilita el ciclo',
    texto: 'La persona decide quién accede: un vínculo por área y su autorización. Sin eso, el profesional no ve nada.',
  });
}
