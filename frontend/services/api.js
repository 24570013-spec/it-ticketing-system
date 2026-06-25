import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Inject Bearer token on every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// Categories
export const getCategories    = ()             => api.get('/api/categories');
export const createCategory   = (data)         => api.post('/api/categories', data);
export const updateCategory   = (id, data)     => api.put(`/api/categories/${id}`, data);
export const deleteCategory   = (id)           => api.delete(`/api/categories/${id}`);

// Auth
export const loginUser    = (data) => api.post('/api/auth/login', data);
export const registerUser = (data) => api.post('/api/auth/register', data);

// Tickets
export const getTickets    = (params = {}) => api.get('/api/tickets', { params });
export const getTicketById = (id)       => api.get(`/api/tickets/${id}`);
export const createTicket  = (data)     => api.post('/api/tickets', data);
export const updateTicket  = (id, data) => api.put(`/api/tickets/${id}`, data);
export const deleteTicket  = (id)       => api.delete(`/api/tickets/${id}`);

// Comments
export const getComments  = (ticketId)       => api.get(`/api/tickets/${ticketId}/comments`);
export const postComment  = (ticketId, data) => api.post(`/api/tickets/${ticketId}/comments`, data);
export const deleteComment = (commentId)     => api.delete(`/api/comments/${commentId}`);

// Users (admin)
export const getUsers       = ()             => api.get('/api/users');
export const getUserById    = (id)           => api.get(`/api/users/${id}`);
export const updateUserRole = (id, role)     => api.put(`/api/users/${id}/role`, { role });
export const deleteUser     = (id)           => api.delete(`/api/users/${id}`);

// Notifications
export const getNotifications  = ()    => api.get('/api/notifications');
export const readNotification  = (id)  => api.put(`/api/notifications/${id}/read`);
export const readAllNotifications = () => api.put('/api/notifications/read-all');

// Dashboard stats (admin)
export const getDashboardStats = () => api.get('/api/dashboard/stats');

// Export tickets to CSV (admin)
export const exportTicketsCSV = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  // Use window.open to trigger file download
  const token = localStorage.getItem('token');
  const url = `${api.defaults.baseURL}/api/dashboard/export/tickets${query ? '?' + query : ''}`;
  // Fetch with auth header and trigger download
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `tickets_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
};

// Audit log
export const getAuditLog   = (ticketId) => api.get(`/api/tickets/${ticketId}/audit`);
// Status timeline
export const getTimeline   = (ticketId) => api.get(`/api/tickets/${ticketId}/timeline`);

// Attachments
export const uploadAttachment  = (ticketId, formData) =>
  api.post(`/api/tickets/${ticketId}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getAttachments    = (ticketId) => api.get(`/api/tickets/${ticketId}/attachments`);
export const deleteAttachment  = (ticketId, attachId) => api.delete(`/api/tickets/${ticketId}/attachments/${attachId}`);
