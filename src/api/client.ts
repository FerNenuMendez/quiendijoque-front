import axios from 'axios';

// ⚠️ REEMPLAZÁ ESTA IP POR LA DE TU COMPU ⚠️
const MI_IP_WIFI = '192.168.0.7';

export const apiClient = axios.create({
  baseURL: `http://192.168.0.77:3000`,
  withCredentials: true, // Fundamental porque tu backend manda cookies
});
