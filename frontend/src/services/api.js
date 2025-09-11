import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
});

export const sendSignupOtp = (email) => api.post('/auth/send-signup-otp', { email });
export const verifyOtp = (email, otp) => api.post('/auth/verify-otp', { email, otp });
export const setPassword = (email, password) => api.post('/auth/set-password', { email, password });
export const login = (email, password) => api.post('/auth/login', { email, password });
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (email, password) => api.post('/auth/reset-password', { email, password });
export const getProperties = () => api.get('/properties');
export const searchProperties = (params) => api.get('/properties/search', { params });
export const addProperty = (property, token) => api.post('/properties', property, { headers: { Authorization: `Bearer ${token}` } });
export const addInterest = (propertyId, token) => api.post('/properties/interest', { propertyId }, { headers: { Authorization: `Bearer ${token}` } });
export const getInterests = (token) => api.get('/properties/interests', { headers: { Authorization: `Bearer ${token}` } });
export const sendMessage = (toUserId, content, token) => api.post('/messages', { toUserId, content }, { headers: { Authorization: `Bearer ${token}` } });
export const getMessages = (withUserId, token) => api.get(`/messages/${withUserId}`, { headers: { Authorization: `Bearer ${token}` } });
export const scheduleMeeting = (meeting, token) => api.post('/messages/meeting', meeting, { headers: { Authorization: `Bearer ${token}` } });
export const getMeetings = (token) => api.get('/messages/meetings', { headers: { Authorization: `Bearer ${token}` } });
export const getProfile = (token) => api.get('/users/profile', { headers: { Authorization: `Bearer ${token}` } });
export const getUsers = () => api.get('/users');

export default api;