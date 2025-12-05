import axios from 'axios';

// Create axios instance with base URL
// Create axios instance with base URL
// Dynamically determine the backend URL based on current hostname
const hostname = window.location.hostname;
const protocol = window.location.protocol;
const backendPort = '4000'; // Assuming backend runs on 4000

let BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
    // If no env var, construct URL from current hostname
    BASE_URL = `${protocol}//${hostname}:${backendPort}/api`;
}

console.log('🌐 API Base URL:', BASE_URL);

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('rozgaar-token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.message || 'An error occurred';
        console.error('API Error:', message);

        // Handle unauthorized errors
        if (error.response?.status === 401) {
            localStorage.removeItem('rozgaar-token');
            localStorage.removeItem('rozgaar-auth');
            window.location.href = '/login';
        }

        return Promise.reject(error.response?.data || { message });
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data)
};

// Worker API
export const workerAPI = {
    getProfile: () => api.get('/worker/profile'),
    browseJobs: (params) => api.get('/worker/jobs', { params }),
    applyToJob: (jobId, data) => api.post(`/worker/apply/${jobId}`, data),
    getApplications: () => api.get('/worker/applications'),
    getCalendar: () => api.get('/worker/calendar'),
    createCalendarEvent: (data) => api.post('/worker/calendar', data),
    getEarnings: () => api.get('/worker/earnings'),
    getPayments: () => api.get('/worker/payments'),
    getHireRequests: (params) => api.get('/worker/hire-requests', { params }),
    updateHireRequest: (id, data) => api.put(`/worker/hire-requests/${id}`, data)
};

// Employer API
export const employerAPI = {
    getProfile: () => api.get('/employer/profile'),
    createJob: (data) => api.post('/employer/jobs', data),
    getJobs: (params) => api.get('/employer/jobs', { params }),
    getJobById: (id: string) => api.get(`/jobs/${id}`),
    updateJob: (id, data) => api.put(`/employer/jobs/${id}`, data),
    deleteJob: (id) => api.delete(`/employer/jobs/${id}`),
    searchWorkers: (params) => api.get('/employer/workers', { params }),
    getWorkerProfile: (workerId) => api.get(`/employer/worker/${workerId}`),
    getWorkerById: (id: string) => api.get(`/employer/worker/${id}`),
    getAllApplications: () => api.get('/employer/applications'),
    getApplications: (jobId) => api.get(`/employer/applications/${jobId}`),
    updateApplication: (id, data) => api.put(`/employer/applications/${id}`, data),
    createPayment: (data) => api.post('/employer/payments', data),
    getAnalytics: () => api.get('/employer/analytics'),
    createJobTitle: (title) => api.post('/employer/job-titles', { title }),
    getJobTitles: () => api.get('/employer/job-titles'),
    hireWorker: (data: any) => api.post('/employer/hire', data),
    getHireRequests: () => api.get('/employer/hire-requests'),
    markHireRequestPaid: (id: string) => api.post(`/employer/hire-requests/${id}/pay`),
    completeJobWithRating: (id: string, data: { rating: number; feedback: string }) => api.post(`/employer/hire-requests/${id}/complete`, data)
};

// Common API
export const commonAPI = {
    getJob: (id) => api.get(`/jobs/${id}`),
    getUser: (id) => api.get(`/user/${id}`),
    submitReview: (data) => api.post('/reviews', data),
    getUserReviews: (userId) => api.get(`/reviews/${userId}`),
    deleteCalendarEvent: (id) => api.delete(`/calendar/${id}`),
    // Notification methods
    getNotifications: (params) => api.get('/notifications', { params }),
    markNotificationRead: (id) => api.put(`/notifications/${id}/read`),
    markAllNotificationsRead: () => api.put('/notifications/read-all'),
    deleteNotification: (id) => api.delete(`/notifications/${id}`),
    deleteReadNotifications: () => api.delete('/notifications/read')
};


// Message API
export const messageAPI = {
    sendMessage: (data: any) => api.post('/messages/send', data),
    getMessages: (connectionId: string, page = 1) => api.get(`/messages/${connectionId}`, { params: { page } }),
    getConversations: () => api.get('/messages/conversations'),
    markAsRead: (connectionId: string) => api.put('/messages/mark-read', { connectionId }),
    getUnreadCount: () => api.get('/messages/unread-count')
};

// Wallet API
export const walletAPI = {
    getWallet: () => api.get('/wallet'),
    getTransactions: (params?: { type?: string }) => api.get('/wallet/transactions', { params }),
    sendMoney: (data: { recipientWalletId: string; amount: number; description?: string }) => api.post('/wallet/send', data),
    addMoney: (data: { amount: number; paymentMethod?: string }) => api.post('/wallet/topup', data),
    withdraw: (data: { amount: number; description?: string; bankAccountId?: string }) => api.post('/wallet/withdraw', data),
    linkBankAccount: (data: { accountHolderName: string; accountNumber: string; ifscCode: string; bankName: string; isDefault?: boolean }) => api.post('/wallet/bank-account', data),
    removeBankAccount: (id: string) => api.delete(`/wallet/bank-account/${id}`),
    searchUser: (query: string) => api.get('/wallet/search', { params: { query } })
};

// Recharge API
export const rechargeAPI = {
    getOperators: () => api.get('/recharge/operators'),
    mobileRecharge: (data: { mobileNumber: string; operator: string; amount: number }) => api.post('/recharge/mobile', data),
    dthRecharge: (data: { subscriberId: string; operator: string; amount: number }) => api.post('/recharge/dth', data)
};

// Payment API (Razorpay)
export const paymentAPI = {
    createOrder: (hireRequestId: string) => api.post('/payments/create-order', { hireRequestId }),
    verifyPayment: (data: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        hireRequestId: string;
        simulationMode?: boolean;
    }) => api.post('/payments/verify', data),
    getPaymentHistory: () => api.get('/payments/history'),
    getPendingPayments: () => api.get('/payments/pending')
};

// Calendar API
export const calendarAPI = {
    getTodaysTasks: () => api.get('/calendar/today'),
    getCalendarEvents: (params?: { start?: string; end?: string }) =>
        api.get('/calendar/events', { params }),
    getUpcomingTasks: (limit?: number) =>
        api.get('/calendar/upcoming', { params: { limit } })
};

// Bill Payment API
export const billAPI = {
    payElectricity: (data: { consumerNumber: string; provider: string; amount: number }) => api.post('/bills/electricity', data),
    payWater: (data: { consumerNumber: string; provider: string; amount: number }) => api.post('/bills/water', data),
    payBroadband: (data: { accountNumber: string; provider: string; amount: number }) => api.post('/bills/broadband', data)
};

export default api;
