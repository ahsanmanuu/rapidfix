import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'
});

// Add a request interceptor to attach auth token if available
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        // const token = user?.token; 
        // if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

export const getAvailableJobs = (serviceType) => api.get(`/jobs/available?serviceType=${serviceType}`);
export const getMyJobs = (userId) => api.get(`/jobs/user/${userId}`);
export const getJobsByTechnician = (techId) => api.get(`/jobs/technician/${techId}`);
export const createJob = (data) => api.post('/jobs', data);
export const searchTechnicians = (data) => api.post('/technicians/search', data);
export const acceptJob = (jobId, technicianId) => api.put(`/jobs/${jobId}/status`, { status: 'accepted', technicianId });
export const completeJob = (jobId) => api.put(`/jobs/${jobId}/status`, { status: 'completed' });
export const getAllJobs = () => api.get('/jobs');

// Extended Features
export const getFinanceData = (userId) => api.get(`/finance/user/${userId}`);
export const startRide = (data) => api.post('/rides/start', data);
export const completeRide = (rideId) => api.put(`/rides/${rideId}/complete`);
export const getRidesByTechnician = (techId) => api.get(`/rides/technician/${techId}`);

export const getOffers = () => api.get('/offers');
export const getWalletBalance = (userId) => api.get(`/finance/wallet/${userId}`);
export const addFunds = (userId, amount) => api.post('/finance/wallet/add', { userId, amount });

export default api;
