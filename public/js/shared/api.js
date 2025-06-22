/**
 * Centralized API communication layer
 */
class API {
  constructor() {
    console.log("API instantiated");
    this.baseUrl = "";

    // Initialize auth methods
    this.auth = {
      login: async (username, password) => {
        return this.request("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
      },

      register: async (username, password) => {
        return this.request("/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
      },

      logout: async () => {
        return this.request("/auth/logout", { method: "POST" });
      },

      me: async () => {
        return this.request("/auth/me");
      },
    };

    // Initialize transaction methods
    this.transactions = {
      getAll: async (filters = {}) => {
        const queryParams = new URLSearchParams({
          page: 1,
          limit: 5000,
          ...filters,
        });
        return this.request(`/api/transactions?${queryParams}`);
      },

      uploadCsv: async (file) => {
        const formData = new FormData();
        formData.append("csvFile", file);

        return this.request("/api/transactions/upload-csv", {
          method: "POST",
          body: formData,
        });
      },
    };

    // Initialize health methods
    this.health = {
      check: async () => {
        return this.request("/api/health");
      },
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
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error - ${url}:`, error.message || error);
      throw error;
    }
  }
}

export const api = new API();
