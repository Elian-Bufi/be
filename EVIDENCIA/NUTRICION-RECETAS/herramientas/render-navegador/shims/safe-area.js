// react-native-safe-area-context en el render del navegador. ?abajo=24 (gestos) o ?abajo=48 (tres botones).
import { createElement, Fragment } from 'react';
const abajo = Number(new URLSearchParams(globalThis.location?.search ?? '').get('abajo') ?? '24');
export const SafeAreaProvider = ({ children }) => createElement(Fragment, null, children);
export const useSafeAreaInsets = () => ({ top: 24, bottom: abajo, left: 0, right: 0 });
