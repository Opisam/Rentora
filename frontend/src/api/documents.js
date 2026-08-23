import api from './axios';

export const uploadDocument = (leaseId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/documents/${leaseId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getDocumentsForLease = (leaseId) => api.get(`/documents/${leaseId}`);