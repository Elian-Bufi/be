// expo-crypto en el render del navegador: el generador del navegador y AES-GCM de WebCrypto con la misma forma que el de
// expo-crypto 57 (AESEncryptionKey, aesEncryptAsync, aesDecryptAsync, AESSealedData, AESKeySize). Así el recorrido usa el
// cifrado real del entrenamiento en curso (`apps/mobile/src/almacen-cifrado.ts`), con el mismo algoritmo: vector de 12
// bytes, etiqueta de 16 y datos asociados.
export const randomUUID = () => globalThis.crypto.randomUUID();

export const AESKeySize = { AES128: 128, AES192: 192, AES256: 256 };

const aBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
const desdeBase64 = (texto) => Uint8Array.from(atob(texto), (c) => c.charCodeAt(0));
const aBytes = (x) => (typeof x === 'string' ? desdeBase64(x) : x instanceof Uint8Array ? x : new Uint8Array(x));

export class AESEncryptionKey {
  constructor(crudo) {
    this.crudo = crudo;
    this.size = crudo.length * 8;
  }
  static async generate(tamano = 256) {
    return new AESEncryptionKey(globalThis.crypto.getRandomValues(new Uint8Array(tamano / 8)));
  }
  static async import(valor, codificacion) {
    const bytes = typeof valor === 'string' ? (codificacion === 'hex' ? Uint8Array.from(valor.match(/../g).map((h) => parseInt(h, 16))) : desdeBase64(valor)) : valor;
    if (![16, 24, 32].includes(bytes.length)) throw new Error('Tamaño de clave inválido');
    return new AESEncryptionKey(bytes);
  }
  async bytes() {
    return this.crudo;
  }
  async encoded(codificacion) {
    return codificacion === 'hex' ? [...this.crudo].map((b) => b.toString(16).padStart(2, '0')).join('') : aBase64(this.crudo);
  }
}

export class AESSealedData {
  constructor(combinado) {
    this.todo = combinado;
  }
  static fromCombined(combinado) {
    return new AESSealedData(aBytes(combinado));
  }
  async combined(codificacion) {
    return codificacion === 'base64' ? aBase64(this.todo) : this.todo;
  }
}

const claveDeWebCrypto = (clave) => globalThis.crypto.subtle.importKey('raw', clave.crudo, 'AES-GCM', false, ['encrypt', 'decrypt']);

export async function aesEncryptAsync(datos, clave, opciones = {}) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const parametros = { name: 'AES-GCM', iv, tagLength: 128, ...(opciones.additionalData ? { additionalData: aBytes(opciones.additionalData) } : {}) };
  const cifrado = new Uint8Array(await globalThis.crypto.subtle.encrypt(parametros, await claveDeWebCrypto(clave), aBytes(datos)));
  const todo = new Uint8Array(iv.length + cifrado.length);
  todo.set(iv);
  todo.set(cifrado, iv.length);
  return new AESSealedData(todo);
}

export async function aesDecryptAsync(sellado, clave, opciones = {}) {
  const iv = sellado.todo.slice(0, 12);
  const parametros = { name: 'AES-GCM', iv, tagLength: 128, ...(opciones.additionalData ? { additionalData: aBytes(opciones.additionalData) } : {}) };
  const claro = new Uint8Array(await globalThis.crypto.subtle.decrypt(parametros, await claveDeWebCrypto(clave), sellado.todo.slice(12)));
  return opciones.output === 'base64' ? aBase64(claro) : claro;
}
