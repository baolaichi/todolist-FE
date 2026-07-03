import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api', // URL Backend của bạn
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động gắn Token vào mỗi request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;