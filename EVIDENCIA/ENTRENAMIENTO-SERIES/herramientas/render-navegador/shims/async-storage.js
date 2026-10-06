// AsyncStorage en memoria: la maqueta no guarda nada.
const datos = new Map();
export default {
  getItem: async (k) => (datos.has(k) ? datos.get(k) : null),
  setItem: async (k, v) => void datos.set(k, v),
  removeItem: async (k) => void datos.delete(k),
};
