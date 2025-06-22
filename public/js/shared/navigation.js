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
            await ComponentLoader.loadComponent('header', 'header-container');
            
            // Load navbar into header
            await ComponentLoader.loadComponent('navbar', 'navbar-container');
            
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
        try {
            await API.auth.me();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Redirect to login if not authenticated
     */
    async requireAuth() {
        const isAuthenticated = await this.checkAuth();
        if (!isAuthenticated) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
}

// Global instance
window.Navigation = new Navigation();