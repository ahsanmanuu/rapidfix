import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'
});

// Add a request interceptor to attach auth token if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('sessionToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle global errors (like 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Robust check for login requests - don't redirect if we're actually TRYING to log in
        const isLoginRequest = error.config?.url?.includes('/login') ||
            window.location.pathname.includes('/login');

        if (error.response && error.response.status === 401 && !isLoginRequest) {
            console.log('🔒 401 Unauthorized detected. Redirecting to context-aware login...');

            localStorage.removeItem('user');
            localStorage.removeItem('sessionToken');

            const currentPath = window.location.pathname;

            if (currentPath.includes('/admin')) {
                window.location.href = '/admin/login';
            } else {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const getAvailableJobs = (serviceType) => api.get(`/jobs/available?serviceType=${serviceType}`);
export const getUserProfile = (userId) => api.get(`/users/${userId}`);
export const updateMyProfile = (userId, data) => api.put(`/users/${userId}`, data); // General user update
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

// Admin User Management
export const getAdminUsers = () => api.get('/admin/users');
export const getDashboardStats = () => api.get('/admin/stats');
export const banUser = (id) => api.put(`/admin/users/${id}/ban`);
export const unbanUser = (id) => api.put(`/admin/users/${id}/unban`);
export const updateUserMembership = (id, tier) => api.put(`/admin/users/${id}/membership`, { tier });
export const createUser = (userData) => api.post('/admin/users', userData);
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const updateJob = (id, data) => api.put(`/admin/jobs/${id}`, data);

export const getTopRatedTechnicians = () => api.get('/technicians/top-rated');

export default api;
