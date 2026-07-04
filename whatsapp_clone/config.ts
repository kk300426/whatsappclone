import { Platform } from 'react-native';

/**
 * API Configuration for WhatsApp Clone
 *
 * Uses EXPO_PUBLIC environment variables.
 * In development, usually http://192.168.1.3:3001
 */

const PHYSICAL_DEVICE_IP = process.env.EXPO_PUBLIC_PHYSICAL_DEVICE_IP || '192.168.1.3';
const PORT = process.env.EXPO_PUBLIC_BACKEND_PORT || '3001';

const getHost = () => {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    // Return LAN IP for mobile devices (simulators/emulators/physical)
    return PHYSICAL_DEVICE_IP;
  }
  return 'localhost';
};

export const API_URL = `http://${getHost()}:${PORT}`;
export const SOCKET_URL = `http://${getHost()}:${PORT}`;

export const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const getApiUrl = (path: string = '') => `${API_URL}${path}`;
