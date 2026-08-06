import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  me: () => API.get('/auth/me'),
};

export const labAPI = {
  getAll: () => API.get('/labs'),
  getById: (id) => API.get(`/labs/${id}`),
  create: (labData) => API.post('/labs', labData),
  getQuestion: (id) => API.get(`/labs/questions/${id}`),
};

export const submissionAPI = {
  run: (payload) => API.post('/submissions/run', payload),
  submit: (payload) => API.post('/submissions/submit', payload),
  getMySubmissions: () => API.get('/submissions/my-submissions'),
  getById: (id) => API.get(`/submissions/${id}`),
};

export const dashboardAPI = {
  getStudentStats: () => API.get('/dashboard/student'),
  getFacultyStats: () => API.get('/dashboard/faculty'),
};

export default API;
