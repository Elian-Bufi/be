// Guía central · nivel 5: el camino de un cambio hasta test, y el de la APK, que es otro. Fuentes:
// .github/workflows/ci.yml (cinco trabajos), render.yaml (autoDeployTrigger: checksPass y buildFilter por servicio),
// apps/api/scripts/iniciar.sh y /health/ready, docs/OPERACION (publicar una APK: build local y release en GitHub).
export const meta = {
  id: 'G-14',
  titulo: 'De una rama a test: la CI decide, Render despliega solo lo que cambió',
  alcance: 'La API y el website se despliegan solos después de la CI de main; la APK se arma y se publica aparte.',
  fuente: '.github/workflows/ci.yml · render.yaml · apps/api/scripts/iniciar.sh',
  estado: 'implementado',
  ancho: 750,
  alto: 336,
};

export function dibujar(L) {
  const wCab = 96;
  L.carril({ id: 'gh', x: 4, y: 4, w: 742, h: 104, titulo: 'GitHub', subtitulo: 'código y CI', wCabecera: wCab });
  L.carril({ id: 'rd', x: 4, y: 114, w: 742, h: 104, titulo: 'Render', subtitulo: 'API y website', wCabecera: wCab });
  L.carril({ id: 'ap', x: 4, y: 224, w: 742, h: 104, titulo: 'APK', subtitulo: 'aparte', wCabecera: wCab });

  const x0 = 4 + wCab + 12;
  const fila = (ids, y, h = 80) => {
    const w = 140;
    const g = (742 - wCab - 24 - ids.length * w) / (ids.length - 1);
    ids.forEach(([id, titulo, detalle, tipo = 'sistema'], i) => L.redondeado({ id, x: x0 + i * (w + g), y, w, h, titulo, detalle, tipo, radio: 6 }));
    for (let i = 0; i < ids.length - 1; i++) L.conector({ de: ids[i][0], lado: 'e', a: ids[i + 1][0], ladoA: 'o' });
  };
  fila(
    [
      ['pr', 'Rama y PR', 'En borrador hasta que se revisa.'],
      ['ci', 'CI del PR', 'Cinco trabajos: legajo, verificar, integración, recorridos, imagen.'],
      ['mg', 'Merge a main', 'Solo en verde y con la autorización de Dirección.', 'persona'],
      ['cim', 'CI de main', 'Los mismos cinco, sobre lo integrado.'],
    ],
    16,
  );
  fila(
    [
      ['flt', '¿Cambió lo suyo?', 'buildFilter: be-api mira apps/api, el dominio y prisma.'],
      ['cnt', 'Contenedor nuevo', 'Al arrancar: prisma migrate deploy.'],
      ['rdy', '/health/ready', 'Base y migraciones OK, y el commit.'],
      ['srv', 'Sirve test', 'Si no pasa, sigue la versión anterior.', 'persona'],
    ],
    126,
  );
  L.conector({ de: 'cim', lado: 's', a: 'flt', ladoA: 'n', via: [[664, 111], [182, 111]] });
  fila(
    [
      ['bld', 'Build local', 'Gradle en esta PC, con la firma guardada aparte.'],
      ['rel', 'Release en GitHub', 'Prerelease para una candidata; estable cuando Dirección lo dice.', 'persona'],
      ['tel', 'Teléfono', 'La instala una persona: nadie la actualiza sola.'],
    ],
    236,
  );
}
