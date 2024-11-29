import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DEV_API_URL = Platform.select({
  web: 'http://127.0.0.1:8000',  // FastAPI development server
  ios: 'http://localhost:8000',  // For iOS simulator
  android: 'http://10.0.2.2:8000', // For Android emulator (special IP for localhost)
  default: 'http://127.0.0.1:8000',
});

const PROD_API_URL = 'https://1902finalproject-production.up.railway.app'; // Production API URL

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';
