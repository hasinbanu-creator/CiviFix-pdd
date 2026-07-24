import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_URL, ENDPOINTS } from "@/constants/endpoints";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export const unwrapResponse = <T>(response: any): T => {
  return response?.data?.data ?? response?.data;
};

export const getErrorMessage = (error: any, fallback = "Something went wrong"): string => {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  return data?.message || data?.detail || data?.errors || error?.message || fallback;
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log("--- OUTGOING API REQUEST ---");
    console.log("URL:", api.getUri(config));
    console.log("Headers:", config.headers);
    console.log("Data:", config.data instanceof FormData ? "[FormData Object]" : config.data);
    if (config.data instanceof FormData) {
      for (let [key, value] of config.data.entries()) {
        console.log(`  ${key}:`, value);
      }
    }

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (typeof window !== "undefined") {
          const refreshToken = localStorage.getItem("refreshToken");
          if (!refreshToken) {
            throw new Error("No refresh token available");
          }
          const response = await axios.post(`${API_URL}${ENDPOINTS.REFRESH_TOKEN}`, {
            refresh_token: refreshToken,
          });
          const tokens = unwrapResponse<{ access_token: string }>(response);
          const { access_token } = tokens || {};
          if (!access_token) {
            throw new Error("Refresh token response did not include an access token");
          }
          localStorage.setItem("authToken", access_token);
          api.defaults.headers.Authorization = `Bearer ${access_token}`;
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
