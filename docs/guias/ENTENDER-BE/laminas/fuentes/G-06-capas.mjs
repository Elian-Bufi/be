// Guía central · nivel 3: las capas que revisan una escritura, en el orden real de API-ING-02 (registrar una comida).
// Cada capa responde una pregunta distinta; si falla, se responde y no se guarda nada. Fuentes:
// apps/api/src/sesion/sesion.guard.ts, apps/api/src/http/validacion.ts (validarCuerpo) y filtro-de-errores.ts,
// apps/api/src/plataforma/idempotencia.service.ts, apps/api/src/autorizacion/pdp.service.ts,
// apps/api/src/nutricion/registro-de-comidas.service.ts y apps/api/src/prisma/concurrencia.ts.
export const meta = {
  id: 'G-06',
  titulo: 'Las capas que revisan una escritura',
  alcance: 'Registrar una comida (API-ING-02): de arriba hacia abajo, en el orden en que corren.',
  fuente: 'apps/api/src/sesion · http · plataforma · autorizacion · nutricion · prisma/concurrencia.ts',
  estado: 'implementado',
  ancho: 500,
  alto: 440,
};

export function dibujar(L) {
  const xC = 16;
  const wC = 284;
  const xS = 330;
  const wS = 166;
  const h = 42;
  const capas = [
    ['pan', 'Pantalla · APK o website', 'Ayuda: avisa, deshabilita y completa.', 4],
    ['ses', 'Sesión · SesionGuard', 'Token firmado y sesión ACTIVA en la base.', 56],
    ['for', 'Forma · validarCuerpo (zod)', 'Campos, tipos y largos; uno de más, no.', 108],
    ['cla', 'Clave · IdempotenciaService', 'BEGIN y bloqueo: ¿ya se hizo este pedido?', 174],
    ['per', 'Permiso · PdpService', 'Las siete dimensiones; la decisión se guarda.', 226],
    ['reg', 'Reglas · servicio y dominio', 'Plan vigente, no futura, opción del plan.', 278],
    ['bas', 'Base · disparadores e índices', 'Solo agregar, transiciones, unicidad.', 330],
  ];
  L.marco({ id: 'tx', x: 6, y: 154, w: 304, h: 282, titulo: 'Una sola transacción', subtitulo: null });
  for (const [id, titulo, detalle, y] of capas) L.redondeado({ id, x: xC, y, w: wC, h, titulo, detalle, tipo: id === 'pan' ? 'externo' : 'sistema', radio: 6 });
  L.redondeado({ id: 'ok', x: xC, y: 386, w: wC, h: 42, titulo: 'COMMIT · 201', detalle: 'Todo queda guardado junto.', tipo: 'persona', radio: 6 });
  for (let i = 0; i < capas.length; i++) L.conector({ de: capas[i][0], lado: 's', a: i + 1 < capas.length ? capas[i + 1][0] : 'ok', ladoA: 'n' });

  L.nota({ x: xS, y: 4, w: wS, texto: 'No decide: la API no confía en ella.' });
  const salidas = [
    ['ses', '401', 'Sin sesión válida.'],
    ['for', '400', 'Forma inválida.'],
    ['cla', 'Respuesta guardada', 'Reintento: misma respuesta.', 'sistema'],
    ['per', '404', 'Ni dice si existe.'],
    ['reg', '422 o 409', 'Una regla no se cumple.'],
    ['bas', 'Se revierte todo', '409 previsto; 500, defecto.'],
  ];
  for (const [de, titulo, detalle, tipo = 'pendiente'] of salidas) {
    const y = capas.find((c) => c[0] === de)[3];
    L.redondeado({ id: `s-${de}`, x: xS, y, w: wS, h, titulo, detalle, tipo, radio: 6 });
    L.conector({ de, lado: 'e', a: `s-${de}`, ladoA: 'o' });
  }

  L.leyenda({
    x: xS,
    y: 388,
    w: wS,
    columnas: 1,
    titulo: null,
    items: [
      { muestra: 'linea:flecha', texto: 'abajo: pasa y sigue' },
      { muestra: 'linea:flecha', texto: 'derecha: responde así' },
    ],
  });
}
