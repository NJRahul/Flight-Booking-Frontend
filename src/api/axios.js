import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const createAxiosInstance = (subPath = '') => {
  const instance = axios.create({
    baseURL: `${BASE_URL}${subPath}`,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });

  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('flightbook_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('flightbook_token');
        localStorage.removeItem('flightbook_user');
        window.dispatchEvent(new Event('auth:logout'));
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const authApi = createAxiosInstance('/auth');
export const flightApi = createAxiosInstance('/flights');
export const airportApi = createAxiosInstance('/airports');
export const bookingApi = createAxiosInstance('/bookings');
export const paymentApi = createAxiosInstance('/payments');
export const adminApi = createAxiosInstance('/admin');
export const notificationApi = createAxiosInstance('/notifications');

export default createAxiosInstance();
