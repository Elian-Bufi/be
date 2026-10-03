// Proxy TCP entre la API y PostgreSQL que demora cada paquete un tiempo fijo, en los dos sentidos. Estira cada ida y
// vuelta de la API a la base, como pasa cuando la máquina se queda sin CPU, pero de forma repetible.
// Uso: node proxy-con-latencia.cjs <puertoLocal> <puertoDeLaBase> <msPorSentido>
const net = require('net');
const [puerto = '55433', destino = '55432', ms = '10'] = process.argv.slice(2);
const demora = Number(ms);
// Mantiene el orden de los paquetes: cada uno sale `demora` ms después de llegar, nunca antes que el anterior.
function conDemora(origen, salida) {
  let ultimo = 0;
  origen.on('data', (chunk) => {
    const sale = Math.max(Date.now() + demora, ultimo);
    ultimo = sale;
    setTimeout(() => { if (!salida.destroyed) salida.write(chunk); }, sale - Date.now());
  });
}
net.createServer((cliente) => {
  const base = net.connect(Number(destino), '127.0.0.1');
  conDemora(cliente, base);
  conDemora(base, cliente);
  const cerrar = () => { cliente.destroy(); base.destroy(); };
  cliente.on('error', cerrar); base.on('error', cerrar); cliente.on('close', cerrar); base.on('close', cerrar);
}).listen(Number(puerto), '127.0.0.1', () => console.log(`proxy ${puerto} → ${destino} con ${demora} ms por sentido`));
