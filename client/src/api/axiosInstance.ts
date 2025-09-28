import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // nếu cần gửi cookie
});

// Tự động gắn Authorization header từ localStorage cho mọi request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Chuẩn hóa error từ response để UI dễ hiển thị
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = new Error(
      error?.response?.data?.msg ||
      error?.response?.data?.error ||
      error?.message ||
      'Đã xảy ra lỗi, vui lòng thử lại sau'
    );
    return Promise.reject(normalized);
  }
);

export default axiosInstance;