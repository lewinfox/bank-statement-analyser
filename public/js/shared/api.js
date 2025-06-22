/**
 * Centralized API communication layer
 */
class API {
    constructor() {
        this.baseUrl = '';
        
        // Initialize auth methods
        const apiInstance = this;
        this.auth = {
            login: async (username, password) => {
                return apiInstance.request('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
            },

            register: async (username, password) => {
                return apiInstance.request('/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
            },

            logout: async () => {
                return apiInstance.request('/auth/logout', { method: 'POST' });
            },

            me: async () => {
                return apiInstance.request('/auth/me');
            }
        };

        // Initialize transaction methods
        this.transactions = {
            getAll: async (filters = {}) => {
                const queryParams = new URLSearchParams({
                    page: 1,
                    limit: 5000,
                    ...filters
                });
                return apiInstance.request(`/api/transactions?${queryParams}`);
            },

            uploadCsv: async (file) => {
                const formData = new FormData();
                formData.append('csvFile', file);
                
                return apiInstance.request('/api/transactions/upload-csv', {
                    method: 'POST',
                    body: formData
                });
            }
        };

        // Initialize health methods
        this.health = {
            check: async () => {
                return apiInstance.request('/api/health');
            }
        };
    }

    /**
     * Make HTTP request with error handling
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @returns {Promise<any>} Response data
     */
    async request(url, options = {}) {
        try {
            const fullUrl = this.baseUrl + url;
            const response = await fetch(fullUrl, options);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error - ${url}:`, error.message || error);
            throw error;
        }
    }

}

// Global instance
try {
    window.API = new API();
} catch (error) {
    console.error('API: Error creating global instance:', error);
}