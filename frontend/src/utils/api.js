import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Auth APIs
export const registerUser = (userData) => apiClient.post('/auth/register', userData);
export const loginUser = (email, password) => apiClient.post('/auth/login', { email, password });
export const logoutUser = () => apiClient.get('/auth/logout');
export const getCurrentUser = () => apiClient.get('/auth/me');

// Admin APIs
export const createExam = (examData) => apiClient.post('/admin/exam/create', examData);
export const importExamQuestions = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/admin/exam/questions/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
export const getAdminExams = () => apiClient.get('/admin/exams');
export const updateExam = (examId, examData) => apiClient.put(`/admin/exam/${examId}`, examData);
export const publishExam = (examId, publishData) => apiClient.put(`/admin/exam/${examId}/publish`, publishData);
export const deleteExam = (examId) => apiClient.delete(`/admin/exam/${examId}`);
export const getAdminExamAttempts = (examId) => apiClient.get(`/admin/exam/${examId}/attempts`);

// Student APIs
export const getPublishedExams = () => apiClient.get('/student/exams');
export const getExamDetails = (examId) => apiClient.get(`/student/exam/${examId}`);
export const startExam = (examId) => apiClient.post(`/student/exam/${examId}/start`);
export const submitAnswer = (attemptId, answerData) => apiClient.put(`/student/exam/attempt/${attemptId}/answer`, answerData);
export const submitExam = (attemptId) => apiClient.post(`/student/exam/attempt/${attemptId}/submit`);
export const getExamResult = (attemptId) => apiClient.get(`/student/exam/attempt/${attemptId}/result`);
export const getExamHistory = () => apiClient.get('/student/exam-history');

export default apiClient;
