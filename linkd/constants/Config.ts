import { Platform } from 'react-native';

const DEV_API_URL = Platform.select({
  web: 'http://localhost:8000',  // For web development
  ios: 'http://localhost:8000',  // For iOS simulator
  android: 'http://10.0.2.2:8000', // For Android emulator
  default: 'http://localhost:8000',
});

const PROD_API_URL = 'https://your-production-api-url.com'; // Replace with your production API URL

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
