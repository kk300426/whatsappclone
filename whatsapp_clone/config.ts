import { Platform } from 'react-native';

const PHYSICAL_DEVICE_IP = '192.168.1.3';

const getHost = () => {
  if (Platform.OS === 'android') return PHYSICAL_DEVICE_IP;
  return 'localhost';
};

export const API_URL = `http://${getHost()}:3001`;
export const SOCKET_URL = `http://${getHost()}:3001`;

export const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const getApiUrl = (path: string = '') => `${API_URL}${path}`;
