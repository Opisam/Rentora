import client from './client';

export const uploadDocument = (leaseId, formData) =>
  client.post(`/documents/${leaseId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const getDocuments = (leaseId) =>
  client.get(`/documents/${leaseId}`).then((r) => r.data);
