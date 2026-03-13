import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1', withCredentials: true });

// Attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh on 401
let refreshing = false;
let queue = [];

api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      if (refreshing) return new Promise((res, rej) => queue.push({ res, rej })).then(() => api(orig));
      refreshing = true;
      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        localStorage.setItem('accessToken', data.accessToken);
        queue.forEach(({ res }) => res());
        queue = [];
        orig.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(orig);
      } catch {
        queue.forEach(({ rej }) => rej(err));
        queue = [];
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      } finally { refreshing = false; }
    }
    return Promise.reject(err);
  }
);

export default api;
