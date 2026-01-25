import axios from 'axios';

const api = axios.create({
    baseURL: '/api' // Use relative path to leverage Vite proxy in Dev and same-origin in Prod
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
export const getMyJobs = (userId, params = {}) => api.get(`/jobs/user/${userId}`, { params });
export const getJobsByTechnician = (techId) => api.get(`/jobs/technician/${techId}`);
export const createJob = (data) => api.post('/jobs', data);
export const searchTechnicians = (data) => api.post('/technicians/search', data);
export const updateTechnicianStatus = (techId, status) => api.put(`/technicians/${techId}/status`, { status });
export const acceptJob = (jobId, technicianId) => api.put(`/jobs/${jobId}/status`, { status: 'accepted', technicianId });
export const rejectJob = (jobId, reason) => api.put(`/jobs/${jobId}/status`, { status: 'rejected', reason });
export const startJob = (jobId) => api.put(`/jobs/${jobId}/status`, { status: 'in_progress' });
export const completeJob = (jobId, otp) => api.put(`/jobs/${jobId}/status`, { status: 'completed', otp });
export const cancelJob = (jobId, reason) => api.put(`/jobs/${jobId}/status`, { status: 'cancelled', reason }); // [NEW]
export const updateUserJob = (jobId, data) => api.put(`/jobs/${jobId}`, data); // [NEW] Reschedule
export const getAllJobs = () => api.get('/jobs');
export const createSupportSession = (userId) => api.post('/support/session', { userId }); // [NEW]
export const sendSupportMessage = (data) => api.post('/support/message', data);
export const closeSupportSession = (sessionId) => api.post('/support/close', { sessionId }); // [NEW]

// Chat API
export const sendChatMessage = (data) => api.post('/chat/send', data);
export const getChatHistory = (userId1, userId2, jobId) => api.get(`/chat/history/${userId1}/${userId2}${jobId ? `?jobId=${jobId}` : ''}`);

// Extended Features
export const getFinanceData = (userId) => api.get(`/finance/user/${userId}`);
export const startRide = (data) => api.post('/rides/start', data);
export const completeRide = (rideId) => api.put(`/rides/${rideId}/complete`);
export const getRidesByTechnician = (techId) => api.get(`/rides/technician/${techId}`);

export const getOffers = () => api.get('/offers');
export const createOffer = (data) => api.post('/offers', data);
export const acceptOffer = (offerId) => api.post(`/offers/${offerId}/accept`);
export const deleteOffer = (offerId) => api.delete(`/offers/${offerId}`);
export const getUserOffers = (userId) => api.get(`/offers/user/${userId}`);
export const getTestimonials = () => api.get('/testimonials'); // [NEW] Public Testimonials
export const getWalletBalance = (userId) => api.get(`/finance/wallet/${userId}`);
export const topUpWallet = (data) => api.post('/finance/wallet/top-up', data);
export const getPaymentMethods = (userId) => api.get(`/finance/methods/${userId}`);
export const addPaymentMethod = (data) => api.post('/finance/methods', data);
export const deletePaymentMethod = (id) => api.delete(`/finance/methods/${id}`);
export const verifyCoupon = (data) => api.post('/finance/verify-coupon', data);
export const initiatePhonePePayment = (data) => api.post('/finance/phonepe/pay', data);
export const downloadStatement = (userId) => api.get(`/finance/statement/${userId}`, { responseType: 'blob' });

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
export const estimateJobCost = (data) => api.post('/jobs/estimate', data);

export default api;
