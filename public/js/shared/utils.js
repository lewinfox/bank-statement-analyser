/**
 * Shared utility functions
 */
const Utils = {
    /**
     * Format date for display
     * @param {string} dateString - Date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Format currency for display
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        if (amount === null || amount === undefined) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    /**
     * Format date for display in indicators
     * @param {string} dateString - Date string
     * @returns {string} Formatted date
     */
    formatDateForDisplay(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Get default date range (last 12 months)
     * @returns {Object} Object with startDate and endDate
     */
    getDefaultDateRange() {
        const today = new Date();
        const startDate = new Date(today);
        
        // Go back 12 months
        startDate.setMonth(startDate.getMonth() - 12);
        
        // Set to first day of that month
        startDate.setDate(1);
        
        return {
            startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
            endDate: today.toISOString().split('T')[0]
        };
    },

    /**
     * Debounce function to limit API calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Show message in a container
     * @param {string} containerId - ID of message container
     * @param {string} message - Message text
     * @param {string} type - Message type (success, error, warning)
     */
    showMessage(containerId, message, type) {
        const messageDiv = document.getElementById(containerId);
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `message ${type}`;
            messageDiv.style.display = 'block';
        }
    },

    /**
     * Clear message from container
     * @param {string} containerId - ID of message container
     */
    clearMessage(containerId) {
        const messageDiv = document.getElementById(containerId);
        if (messageDiv) {
            messageDiv.style.display = 'none';
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }
    }
};

window.Utils = Utils;