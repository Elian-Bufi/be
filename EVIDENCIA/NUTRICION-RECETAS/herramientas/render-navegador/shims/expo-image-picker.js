// expo-image-picker en el render del navegador: no hay cámara ni galería. Elegir devuelve una foto SINTÉTICA (una de las
// imágenes del paquete de Dirección, generadas por IA), con el tipo, el tamaño y las medidas que daría el selector. Con
// ?selector=cancelar, la persona cancela. El permiso se concede salvo con ?permiso=negado.
import foto from '../salida/fotos/02_salmon_papa_brocoli.png';

const parametros = new URLSearchParams(globalThis.location?.search ?? '');
const permiso = parametros.get('permiso') === 'negado' ? { granted: false, status: 'denied', canAskAgain: false, expires: 'never' } : { granted: true, status: 'granted', canAskAgain: true, expires: 'never' };

function resultado() {
  if (parametros.get('selector') === 'cancelar') return { canceled: true, assets: null };
  return { canceled: false, assets: [{ uri: foto, mimeType: 'image/png', fileName: 'comida.png', fileSize: 2482477, width: 1254, height: 1254, type: 'image' }] };
}

export const requestCameraPermissionsAsync = async () => permiso;
export const requestMediaLibraryPermissionsAsync = async () => permiso;
export const launchCameraAsync = async () => resultado();
export const launchImageLibraryAsync = async () => resultado();
export const getPendingResultAsync = async () => null;
