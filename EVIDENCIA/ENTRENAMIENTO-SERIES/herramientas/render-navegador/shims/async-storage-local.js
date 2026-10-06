// AsyncStorage sobre localStorage, solo en el modo de la API real: recargar la página es como un proceso nuevo de la APK
// (otra ancla del reloj) que encuentra lo que el anterior guardó. Así el recorrido prueba la recuperación en el navegador;
// que Android conserve lo guardado al matar el proceso se comprueba en el teléfono.
export default {
  getItem: async (k) => localStorage.getItem(k),
  setItem: async (k, v) => void localStorage.setItem(k, v),
  removeItem: async (k) => void localStorage.removeItem(k),
};
