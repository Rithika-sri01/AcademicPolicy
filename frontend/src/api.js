import axios from 'axios';

const BASE = 'http://localhost:5000/api';

const client = axios.create({ baseURL: BASE });

client.interceptors.request.use(cfg => {
  const tok = localStorage.getItem('ap_token');
  if (tok) cfg.headers.Authorization = `Bearer ${tok}`;
  return cfg;
});

export const api = {
  login:    (email, password)     => client.post('/auth/login', { email, password }),
  me:       ()                    => client.get('/auth/me'),
  health:   ()                    => client.get('/health'),

  // Admin
  adminDashboard: ()              => client.get('/admin/dashboard'),
  adminPolicy:    ()              => client.get('/admin/policy'),
  updatePolicyB:  (data)          => client.put('/admin/policy/b', data),
  resetPolicyB:   ()              => client.post('/admin/policy/reset'),
  adminImpact:    ()              => client.get('/admin/impact'),
  adminReports:   ()              => client.get('/admin/reports'),

  // Faculty
  facDashboard: (year)            => client.get('/faculty/dashboard' + (year ? `?year=${year}` : '')),
  facRisk:      (year)            => client.get('/faculty/risk'      + (year ? `?year=${year}` : '')),
  facStudents:  (year)            => client.get('/faculty/students'  + (year ? `?year=${year}` : '')),
  facStudent:   (id)              => client.get(`/faculty/student/${id}`),
  facIntv:      (id)              => client.get(`/faculty/intervention/${id}`),
  updateIntv:   (id, action, status) => client.put(`/faculty/intervention/${id}`, { action, status }),
  facReports:   (year)            => client.get('/faculty/reports'   + (year ? `?year=${year}` : '')),
};

export default api;
