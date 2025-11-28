import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
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
    updateJob: (id, data) => api.put(`/employer/jobs/${id}`, data),
    deleteJob: (id) => api.delete(`/employer/jobs/${id}`),
    searchWorkers: (params) => api.get('/employer/workers', { params }),
    getWorkerProfile: (workerId) => api.get(`/employer/worker/${workerId}`),
    getAllApplications: () => api.get('/employer/applications'),
    getApplications: (jobId) => api.get(`/employer/applications/${jobId}`),
    updateApplication: (id, data) => api.put(`/employer/applications/${id}`, data),
    createPayment: (data) => api.post('/employer/payments', data),
    getAnalytics: () => api.get('/employer/analytics'),
    createJobTitle: (title) => api.post('/employer/job-titles', { title }),
    getJobTitles: () => api.get('/employer/job-titles'),
    hireWorker: (data) => api.post('/employer/hire', data)
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

export default api;
