import { api } from './api';

export const classifyComplaint = async (subject: string, description: string) => {
  const res = await api.post('/ai/classify', { subject, description });
  return res.data.data;
};

export const findDuplicates = async (subject: string, description: string) => {
  const res = await api.post('/ai/duplicates', { subject, description });
  return res.data.data;
};

export const sendChatMessage = async (message: string) => {
  const res = await api.post('/ai/chat', { message });
  return res.data.data;
};

export const getPredictiveAnalytics = async () => {
  const res = await api.get('/ai/analytics');
  return res.data.data;
};
