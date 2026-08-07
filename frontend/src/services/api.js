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

// 18 Advanced GenAI Ecosystem APIs
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

export const learningPathAPI = {
  getRoadmap: () => API.get('/learning-path/generate'),
};

export const adaptiveQuestionAPI = {
  generate: (weakTopic, difficulty) => API.post(`/adaptive/generate?weakTopic=${weakTopic}&difficulty=${difficulty}`),
};

export const debuggerReplayAPI = {
  getReplay: (submissionId) => API.get(`/debugger/replay/${submissionId}`),
};

export const analyticsAPI = {
  getStudent: () => API.get('/analytics/student'),
};

export const placementAPI = {
  getReadiness: () => API.get('/placement/readiness'),
};

export const pairTutorAPI = {
  chat: (payload) => API.post('/pair-tutor/chat', payload),
};

export const revisionAPI = {
  getNotes: (topic) => API.get(`/revision/generate?topic=${topic}`),
};

export const facultyAssistantAPI = {
  generateLab: (problemIdea) => API.post(`/faculty-assistant/generate-lab?problemIdea=${problemIdea}`),
  generateEdgeCases: (problemStatement) => API.post('/faculty-assistant/generate-edge-cases', { problemStatement }),
};

export const labReportAPI = {
  downloadPdfUrl: (labId) => `/api/lab-report/download-pdf/${labId}`,
};

export const interviewSimAPI = {
  simulate: (payload) => API.post('/interview-sim/simulate', payload),
};

export const projectReviewAPI = {
  analyze: (payload) => API.post('/project-review/analyze', payload),
};

export default API;
