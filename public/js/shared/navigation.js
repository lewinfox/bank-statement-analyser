/**
 * Navigation and page management
 */
class Navigation {
    constructor() {
        this.currentPage = '';
        this.init();
    }

    init() {
        // Set current page based on URL
        this.currentPage = this.getCurrentPageFromUrl();
        
        // Set up navigation event listeners after navbar loads
        document.addEventListener('DOMContentLoaded', () => {
            this.setupNavigation();
        });
    }

    getCurrentPageFromUrl() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '') || 'dashboard';
        return page;
    }

    setupNavigation() {
        // Load header and navbar components
        this.loadHeaderAndNav();
        
        // Set up logout functionality
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'logout-btn') {
                this.handleLogout();
            }
        });
    }

    async loadHeaderAndNav() {
        try {
            // Load header component
            await window.ComponentLoader.loadComponent('header', 'header-container');
            
            // Load navbar into header
            await window.ComponentLoader.loadComponent('navbar', 'navbar-container');
            
            // Set active nav item
            this.setActiveNavItem();
            
        } catch (error) {
            console.error('Error loading navigation:', error);
        }
    }

    setActiveNavItem() {
        const navLinks = document.querySelectorAll('.nav-btn[data-page]');
        navLinks.forEach(link => {
            if (link.dataset.page === this.currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    async handleLogout() {
        try {
            await API.auth.logout();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Still redirect even if logout fails
            window.location.href = 'index.html';
        }
    }

    /**
     * Check if user is authenticated
     * @returns {Promise<boolean>}
     */
    async checkAuth() {
        // Validate API availability
        if (!window.API || !window.API.auth || !window.API.auth.me) {
            console.log('Navigation: API not available during auth check');
            return false;
        }

        try {
            console.log('Navigation: Checking authentication status');
            const result = await window.API.auth.me();
            console.log('Navigation: Authentication check successful:', result);
            return true;
        } catch (error) {
            console.log('Navigation: Authentication check failed:', error.message || error);
            return false;
        }
    }

    /**
     * Wait for the API object to be available
     * @returns {Promise} Promise that resolves when API is ready
     */
    async waitForAPI() {
        return new Promise((resolve) => {
            if (window.API && window.API.auth) {
                resolve();
                return;
            }
            
            let attempts = 0;
            const checkAPI = () => {
                attempts++;
                
                if (window.API && window.API.auth) {
                    resolve();
                } else {
                    if (attempts > 1000) { // Stop after 10 seconds
                        console.error('Navigation: Timeout waiting for API');
                        resolve(); // Resolve anyway to prevent hanging
                    } else {
                        setTimeout(checkAPI, 10);
                    }
                }
            };
            
            checkAPI();
        });
    }

    /**
     * Redirect to login if not authenticated
     */
    async requireAuth() {
        console.log('Navigation: requireAuth called');
        
        // Wait for API to be available first
        await this.waitForAPI();
        
        const isAuthenticated = await this.checkAuth();
        console.log('Navigation: isAuthenticated =', isAuthenticated);
        
        if (!isAuthenticated) {
            console.log('Navigation: User not authenticated, redirecting to login');
            window.location.href = 'index.html';
            return false;
        }
        
        console.log('Navigation: User authenticated, continuing');
        return true;
    }
}

// Global instance
window.Navigation = new Navigation();