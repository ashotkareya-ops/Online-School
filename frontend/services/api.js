import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; 

const api = axios.create({
  baseURL: API_URL,
});

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data; 
  },
  
  register: async (email, password, role = 'student') => {
    const response = await api.post('/auth/register', { email, password, role });
    return response.data;
  },

  getAssignments: async () => {
    const response = await api.get('/tasks');
    return response.data;
  }
};

