import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000', // Point to Backend
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const instanceApi = {
    getStatus: () => api.get('/instance/status'),
    create: () => api.post('/instance/create'),
    connect: () => api.get('/instance/connect'),
    delete: () => api.delete('/instance'),
};

export const configApi = {
    getSettings: () => api.get('/config'),
    updateSettings: (data: any) => api.put('/config', data),
};

export default api;
