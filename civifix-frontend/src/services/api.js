import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, ENDPOINTS } from "../constants/endpoints";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export const unwrapResponse = (response) => response?.data?.data ?? response?.data;

export const getErrorMessage = (error, fallback = "Something went wrong") => {
  const data = error?.response?.data;
  if (data?.detail && Array.isArray(data.detail)) {
    return data.detail.map(err => `${err.loc?.join(".")}: ${err.msg}`).join("\n");
  }
  if (data?.message && Array.isArray(data.message)) {
    return data.message.join("\n");
  }
  return data?.message || data?.detail || data?.errors || error?.message || fallback;
};

api.interceptors.request.use(
  async (config) => {
    if (process.env.EXPO_PUBLIC_ENABLE_DEBUG === "true") {
      console.log("API request:", api.getUri(config));
    }

    const token = await AsyncStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        const response = await axios.post(`${API_URL}${ENDPOINTS.REFRESH_TOKEN}`, {
          refresh_token: refreshToken,
        });
        const tokens = unwrapResponse(response);
        const { access_token } = tokens || {};
        if (!access_token) {
          throw new Error("Refresh token response did not include an access token");
        }
        await AsyncStorage.setItem("authToken", access_token);
        api.defaults.headers.Authorization = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("refreshToken");
        import('react-native').then(({ DeviceEventEmitter }) => {
          DeviceEventEmitter.emit('SESSION_EXPIRED');
        });
        return Promise.reject(refreshError);
      }
    }
    
    // Also handle 403 or 503 globally if needed
    if (error.response?.status === 403 || error.response?.status === 503) {
      import('react-native').then(({ DeviceEventEmitter }) => {
        DeviceEventEmitter.emit('GLOBAL_ERROR', error.response.status);
      });
    }

    if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        console.error(`[Network Error] Could not connect to API at ${error.config?.baseURL}. This is often because the backend is not running, or running on 127.0.0.1 instead of 0.0.0.0.`);
    } else {
        console.error(`[API Error] ${error.response?.status}: ${error.message}`, error.response?.data);
    }
    
    return Promise.reject(error);
  }
);

export default api;
