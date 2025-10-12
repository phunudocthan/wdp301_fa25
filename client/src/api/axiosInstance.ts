import axios from "axios";
import { getValidToken } from "../utils/tokenUtils";

const envApi = import.meta.env.VITE_API_URL as string | undefined;
const currentOrigin = window.location.origin.replace(/\/$/, "");
const defaultApiBase =
  window.location.port === "3000"
    ? "http://localhost:5000/api"
    : `${currentOrigin}/api`;
const baseURL = (
  envApi && envApi.trim().length > 0 ? envApi : defaultApiBase
).replace(/\/$/, "");

export const apiBaseURL = baseURL;

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getValidToken(); // Use utility function to get valid token
  if (token) {
    config.headers = config.headers || {};
    (
      config.headers as Record<string, string>
    ).Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle token expired error specifically
    if (error?.response?.status === 401) {
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.message;

      if (errorCode === "TOKEN_EXPIRED" || errorMessage === "Token expired") {
        // Clear expired token
        localStorage.removeItem("token");

        // Redirect to login page if not already there
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login?expired=true";
          return Promise.reject(
            new Error("Session expired. Please login again.")
          );
        }
      }
    }

    const normalized = new Error(
      error?.response?.data?.msg ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Đã xảy ra lỗi, vui lòng thử lại sau"
    );
    return Promise.reject(normalized);
  }
);

export default axiosInstance;
