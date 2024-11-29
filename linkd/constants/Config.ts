import { Platform } from 'react-native';

const DEV_API_URL = Platform.select({
  web: 'https://1902finalproject-production.up.railway.app',  // For web development
  ios: 'https://1902finalproject-production.up.railway.app',  // For iOS simulator
  android: 'https://1902finalproject-production.up.railway.app', // For Android emulator
  default: 'https://1902finalproject-production.up.railway.app',
});

const PROD_API_URL = 'https://1902finalproject-production.up.railway.app'; // Production API URL

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
