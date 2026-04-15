import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const apiClient = axios.create({
  baseURL: `http://192.168.0.77:3000`,
  withCredentials: true, // Fundamental porque tu backend manda cookies
});

// EL INTERCEPTOR
apiClient.interceptors.request.use(
  async (config) => {
    // Antes de que salga la petición, buscamos el token
    const token = await SecureStore.getItemAsync('access_token');

    // 🔥 EL CHISMOSO: Mirá la consola de Expo cuando toques "Crear Partida"
    // console.log(
    //   '🕵️‍♂️ ¿Axios encontró el token en la memoria?:',
    //   token ? 'SÍ, HAY TOKEN' : 'NO, ESTÁ NULL',
    // );

    // Si lo tenemos, lo inyectamos como Bearer Token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
