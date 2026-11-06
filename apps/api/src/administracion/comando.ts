/**
 * El comando interno de Administración (WP-ADMINISTRACION, D-3; DL-155). Lo corre el operador, con acceso a la base del
 * ambiente (08 §28.3-bis: con su registro manual), nunca la API al arrancar ni una variable de entorno.
 *
 *   node apps/api/dist/administracion/comando.js incorporar --correo <cuenta> --nombre "<nombre en el historial>" --fundamento "<por qué>" --operador "<quién lo corre>"
 *   node apps/api/dist/administracion/comando.js restablecer-segundo-factor --correo <cuenta> --fundamento "<por qué>" --operador "<quién>"
 *   node apps/api/dist/administracion/comando.js retirar --correo <cuenta> --fundamento "<por qué>" --operador "<quién>"
 *
 * Lee `DATABASE_URL` y `APP_ENV`. El código de incorporación se muestra una sola vez, en esta terminal: no queda guardado
 * (la base tiene su huella) ni se escribe en ningún registro. Con `--salida json` lo imprime en JSON, para las pruebas
 * automáticas, que lo leen de la salida y no lo guardan. Procedimiento completo: EVIDENCIA/ADMINISTRACION/OPERACION.md.
 */
import { PrismaClient } from '@prisma/client';
import { ErrorDeComando, incorporarAdministrador, restablecerSegundoFactor, retirarAdministrador } from './incorporacion';

const AYUDA = [
  'Uso:',
  '  incorporar --correo <cuenta> --nombre "<nombre>" --fundamento "<por qué>" --operador "<quién lo corre>"',
  '  restablecer-segundo-factor --correo <cuenta> --fundamento "<por qué>" --operador "<quién>"',
  '  retirar --correo <cuenta> --fundamento "<por qué>" --operador "<quién>"',
  'Opcional: --salida json. Requiere DATABASE_URL y APP_ENV.',
].join('\n');

function opciones(args: readonly string[]): Record<string, string> {
  const salida: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (!a.startsWith('--')) throw new ErrorDeComando(`Argumento inesperado: ${a.slice(0, 40)}\n${AYUDA}`);
    const valor = args[i + 1];
    if (valor === undefined || valor.startsWith('--')) throw new ErrorDeComando(`Falta el valor de ${a}.\n${AYUDA}`);
    salida[a.slice(2)] = valor;
    i++;
  }
  return salida;
}

const fecha = (d: Date): string => `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`;

async function principal(): Promise<number> {
  const [accion, ...resto] = process.argv.slice(2);
  if (!accion || accion === '--ayuda' || accion === 'ayuda') {
    process.stdout.write(`${AYUDA}\n`);
    return accion ? 0 : 1;
  }
  const o = opciones(resto);
  const json = o.salida === 'json';
  const appEnv = process.env.APP_ENV ?? '';
  if (!['development', 'test', 'production'].includes(appEnv)) throw new ErrorDeComando('APP_ENV tiene que ser development, test o production.');
  if (!process.env.DATABASE_URL) throw new ErrorDeComando('Falta DATABASE_URL.');
  const prisma = new PrismaClient();
  try {
    const datos = { correo: o.correo ?? '', fundamento: o.fundamento ?? '', operador: o.operador ?? '' };
    if (accion === 'incorporar') {
      const r = await incorporarAdministrador(prisma, { ...datos, nombre: o.nombre ?? '', appEnv });
      if (json) process.stdout.write(`${JSON.stringify({ identidadId: r.identidadId, codigoDeIncorporacion: r.codigo, venceEn: r.venceEn.toISOString() })}\n`);
      else {
        process.stdout.write(
          [
            `Listo: la cuenta es administradora de BE y sus sesiones comunes quedaron cerradas.`,
            `Código de incorporación (un solo uso, vence el ${fecha(r.venceEn)}):`,
            `  ${r.codigo}`,
            'Se muestra una sola vez y no queda guardado. Dáselo a la persona por un canal seguro: con él configura su autenticador al entrar en /admin.',
          ].join('\n') + '\n',
        );
      }
      return 0;
    }
    if (accion === 'restablecer-segundo-factor') {
      const r = await restablecerSegundoFactor(prisma, datos);
      if (json) process.stdout.write(`${JSON.stringify({ identidadId: r.identidadId, codigoDeIncorporacion: r.codigo, venceEn: r.venceEn.toISOString() })}\n`);
      else {
        process.stdout.write(
          [
            'Listo: el autenticador, los códigos de recuperación y las sesiones de Administración de esa cuenta dejaron de valer.',
            `Código de incorporación nuevo (un solo uso, vence el ${fecha(r.venceEn)}):`,
            `  ${r.codigo}`,
            'Se muestra una sola vez. Sin configurar un autenticador nuevo, esa cuenta no entra a Administración.',
          ].join('\n') + '\n',
        );
      }
      return 0;
    }
    if (accion === 'retirar') {
      const r = await retirarAdministrador(prisma, datos);
      process.stdout.write(json ? `${JSON.stringify({ identidadId: r.identidadId, retirado: true })}\n` : 'Listo: la cuenta dejó de ser administradora; su segundo factor y sus sesiones quedaron revocados.\n');
      return 0;
    }
    throw new ErrorDeComando(`Acción desconocida: ${accion.slice(0, 40)}\n${AYUDA}`);
  } finally {
    await prisma.$disconnect();
  }
}

principal()
  .then((codigo) => process.exit(codigo))
  .catch((e: unknown) => {
    if (e instanceof ErrorDeComando) {
      process.stderr.write(`${e.message}\n`);
      process.exit(1);
    }
    // Sin el detalle de la base: un mensaje de Prisma puede nombrar la URL o el host.
    process.stderr.write(`Falla inesperada: ${e instanceof Error ? e.name : 'error'}. No se cambió nada (la operación es una transacción).\n`);
    process.exit(2);
  });
