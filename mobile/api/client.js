import axios from 'axios';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
};

const client = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config) => {
  try {
    const SecureStore = require('expo-secure-store');
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const SecureStore = require('expo-secure-store');
        await SecureStore.deleteItemAsync('auth_token');
      } catch {}
    }
    return Promise.reject(error);
  }
);

export default client;
