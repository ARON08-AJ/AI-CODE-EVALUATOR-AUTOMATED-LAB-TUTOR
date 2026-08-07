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

// Phase 2 AI Placement & Career Ecosystem APIs
export const codeReviewAPI = {
  analyze: (payload) => API.post('/code-review/analyze', payload),
};

export const plagiarismAPI = {
  checkPair: (payload) => API.post('/plagiarism/check', payload),
  scanCohort: (labId) => API.get(`/plagiarism/cohort-scan/${labId}`),
};

export const resumeAPI = {
  analyze: (payload) => API.post('/resume/analyze', payload),
  uploadPdf: (formData) => API.post('/resume/upload-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const interviewAPI = {
  generate: (payload) => API.post('/interview/generate', payload),
  evaluate: (payload) => API.post('/interview/evaluate', payload),
};

export const aptitudeAPI = {
  getQuiz: (category) => API.get(`/aptitude/quiz?category=${category}`),
  reviewEmail: (payload) => API.post('/aptitude/email-review', payload),
};

export const contestAPI = {
  getActive: () => API.get('/contests/active'),
};

export const vivaAPI = {
  generate: (payload) => API.post('/viva/generate', payload),
  evaluate: (payload) => API.post('/viva/evaluate', payload),
};

export default API;
