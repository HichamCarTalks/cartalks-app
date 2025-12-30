import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// CONFIGURATION
// Replace this with your actual Azure Static Web App URL after deployment
const PROD_API_URL = 'https://victorious-grass-0e1c45703.4.azurestaticapps.net'; 

// Helper to determine the API Base URL
// Web: Relative path is fine (proxied by SWA)
// Mobile: Needs absolute URL. In Dev, use your computer's IP (e.g., http://192.168.1.50:7071)
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return '/api';
  }
  
  if (__DEV__) {
    // CHANGE THIS TO YOUR LOCAL IP ADDRESS FOR MOBILE DEV
    // e.g., 'http://192.168.1.100:7071/api'
    return 'http://10.0.2.2:7071/api'; // Android Emulator default
  }

  return `${PROD_API_URL}/api`;
};

export const API_BASE = getBaseUrl();

// AUTH HELPER
export const Auth = {
  async saveUser(user) {
    try {
      await AsyncStorage.setItem('user_session', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save session', e);
    }
  },

  async getUser() {
    try {
      const json = await AsyncStorage.getItem('user_session');
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.error('Failed to get session', e);
      return null;
    }
  },

  async logout() {
    try {
      await AsyncStorage.removeItem('user_session');
    } catch (e) {
      console.error('Failed to logout', e);
    }
  }
};

// API CALL WRAPPER
export const api = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`);
    return response;
  },

  async post(endpoint, body) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return response;
  },

  async put(endpoint, body) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return response;
  },

  async delete(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
    });
    return response;
  },

  async upload(endpoint, formData) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  }
};