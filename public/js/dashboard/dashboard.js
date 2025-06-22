/**
 * Dashboard page module
 */
class DashboardPage {
    constructor() {
        this.init();
    }

    async init() {
        // Small delay to ensure session is established
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check authentication
        const isAuthenticated = await window.Navigation.requireAuth();
        if (!isAuthenticated) return;

        document.addEventListener('DOMContentLoaded', () => {
            this.setupPage();
        });
    }

    async setupPage() {
        // Load header and navigation
        await window.Navigation.loadHeaderAndNav();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Server status check button
        const statusButton = document.getElementById('check-status-btn');
        if (statusButton) {
            statusButton.addEventListener('click', () => this.checkServerStatus());
        }
    }

    async checkServerStatus() {
        const resultDiv = document.getElementById('status-result');
        if (!resultDiv) return;
        
        try {
            const data = await API.health.check();
            
            resultDiv.innerHTML = `
                <div style="color: green; background: #d4edda; padding: 10px; border-radius: 4px;">
                    ✓ ${data.message}
                </div>
            `;
        } catch (error) {
            resultDiv.innerHTML = `
                <div style="color: red; background: #f8d7da; padding: 10px; border-radius: 4px;">
                    ✗ Error: ${error.message}
                </div>
            `;
        }
    }
}

// Initialize when script loads
window.DashboardPage = new DashboardPage();