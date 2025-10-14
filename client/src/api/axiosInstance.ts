import axios from "axios";
import { getValidToken } from "../utils/tokenUtils";

const STORAGE_KEY = "apiBaseURL:v2";

const normalizeBase = (value: string) => value.replace(/\/$/, "");

const parseEnvApiList = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeBase);

const devDefaultBases = ["http://localhost:5001/api", "http://localhost:5000/api"];

const currentOrigin = window.location.origin.replace(/\/$/, "");
const defaultCandidates =
  window.location.port === "3000"
    ? devDefaultBases
    : [`${currentOrigin}/api`];

const candidateBases = (() => {
  const envCandidates = parseEnvApiList(import.meta.env.VITE_API_URL as string | undefined);
  const merged = envCandidates.length > 0 ? envCandidates : defaultCandidates;
  return merged
    .map(normalizeBase)
    .filter((base, index, list) => list.indexOf(base) === index);
})();

if (candidateBases.length === 0) {
  candidateBases.push(`${currentOrigin}/api`);
}

const listeners = new Set<(url: string) => void>();

const notifyBaseChange = (url: string) => {
  listeners.forEach((listener) => {
    try {
      listener(url);
    } catch {
      // ignore subscriber errors
    }
  });
};

const getStoredBase = () => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored && candidateBases.includes(stored) ? stored : null;
  } catch {
    return null;
  }
};

let currentBaseURL = getStoredBase() ?? candidateBases[0];

const axiosInstance = axios.create({
  baseURL: currentBaseURL,
  withCredentials: true,
});

const setCurrentBaseURL = (nextBase: string) => {
  if (currentBaseURL === nextBase) return;
  currentBaseURL = nextBase;
  axiosInstance.defaults.baseURL = nextBase;
  try {
    sessionStorage.setItem(STORAGE_KEY, nextBase);
  } catch {
    // session storage unavailable
  }
  notifyBaseChange(nextBase);
};

export const getApiBaseURL = () => currentBaseURL;

export const subscribeApiBaseURL = (listener: (url: string) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const findNextBase = (attemptedBase?: string) => {
  const normalized = attemptedBase ? normalizeBase(attemptedBase) : currentBaseURL;
  const startIndex = candidateBases.findIndex((base) => base === normalized);
  for (let index = startIndex + 1; index < candidateBases.length; index += 1) {
    if (candidateBases[index] !== currentBaseURL) {
      return candidateBases[index];
    }
  }
  return null;
};

export const advanceApiBaseURL = (attemptedBase?: string) => {
  const nextBase = findNextBase(attemptedBase);
  if (nextBase) {
    setCurrentBaseURL(nextBase);
  }
  return nextBase;
};

export const getApiOriginURL = () => currentBaseURL.replace(/\/api$/, "");

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
  async (error) => {
    const requestConfig = error?.config as (typeof error.config & {
      __retriedWithAlternate?: boolean;
    }) | undefined;
    const isNetworkIssue = !error?.response;
    if (
      isNetworkIssue &&
      requestConfig &&
      !requestConfig.__retriedWithAlternate
    ) {
      const nextBase = findNextBase(requestConfig.baseURL);
      if (nextBase) {
        requestConfig.__retriedWithAlternate = true;
        requestConfig.baseURL = nextBase;
        setCurrentBaseURL(nextBase);
        return axiosInstance(requestConfig);
      }
    }

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
