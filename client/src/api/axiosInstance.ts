import axios from "axios";

const envApi = import.meta.env.VITE_API_URL as string | undefined;
const currentOrigin = window.location.origin.replace(/\/$/, "");
const defaultApiBase = window.location.port === "3000"
  ? "http://localhost:5000/api"
  : `${currentOrigin}/api`;
const baseURL = (envApi && envApi.trim().length > 0 ? envApi : defaultApiBase).replace(/\/$/, "");

export const apiBaseURL = baseURL;

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = new Error(
      error?.response?.data?.msg ||
        error?.response?.data?.error ||
        error?.message ||
        "Đã xảy ra lỗi, vui lòng thử lại sau"
    );
    return Promise.reject(normalized);
  }
);

export default axiosInstance;
