document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the application
 * Check authentication status and set up event listeners
 */
async function initializeApp() {
    setupAuthEventListeners();
    setupDashboardEventListeners();
    
    // Check if user is already logged in
    await checkAuthStatus();
}

/**
 * Set up authentication-related event listeners
 */
function setupAuthEventListeners() {
    // Auth toggle buttons
    const showLoginBtn = document.getElementById('show-login');
    const showRegisterBtn = document.getElementById('show-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    showLoginBtn.addEventListener('click', () => {
        showLoginBtn.classList.add('active');
        showRegisterBtn.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        clearAuthMessage();
    });

    showRegisterBtn.addEventListener('click', () => {
        showRegisterBtn.classList.add('active');
        showLoginBtn.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        clearAuthMessage();
    });

    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', handleLogout);
}

/**
 * Set up dashboard navigation event listeners
 */
function setupDashboardEventListeners() {
    const navButtons = document.querySelectorAll('.nav-btn:not(#logout-btn)');
    const views = document.querySelectorAll('.view');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetView = this.id.replace('-btn', '-view');
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            views.forEach(view => view.classList.remove('active'));
            
            this.classList.add('active');
            const targetElement = document.getElementById(targetView);
            if (targetElement) {
                targetElement.classList.add('active');
            }
        });
    });
}

/**
 * Handle user login
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        showAuthMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showAuthMessage('Login successful!', 'success');
            setTimeout(() => {
                showDashboard();
                clearAuthForms();
            }, 1000);
        } else {
            showAuthMessage(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showAuthMessage('Network error. Please try again.', 'error');
        console.error('Login error:', error);
    }
}

/**
 * Handle user registration
 */
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    // Client-side validation
    if (!username || !password || !passwordConfirm) {
        showAuthMessage('Please fill in all fields', 'error');
        return;
    }

    if (password !== passwordConfirm) {
        showAuthMessage('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showAuthMessage('Password must be at least 6 characters long', 'error');
        return;
    }

    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showAuthMessage('Registration successful! You can now log in.', 'success');
            // Switch to login form after successful registration
            setTimeout(() => {
                document.getElementById('show-login').click();
                clearAuthForms();
            }, 2000);
        } else {
            showAuthMessage(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showAuthMessage('Network error. Please try again.', 'error');
        console.error('Registration error:', error);
    }
}

/**
 * Handle user logout
 */
async function handleLogout() {
    try {
        const response = await fetch('/auth/logout', {
            method: 'POST',
        });

        if (response.ok) {
            showAuthContainer();
            clearAuthForms();
        } else {
            console.error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

/**
 * Check if user is currently authenticated
 */
async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/me');
        
        if (response.ok) {
            const data = await response.json();
            showDashboard();
        } else {
            showAuthContainer();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showAuthContainer();
    }
}

/**
 * Show the authentication container and hide dashboard
 */
function showAuthContainer() {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('dashboard-container').style.display = 'none';
}

/**
 * Show the dashboard and hide authentication container
 */
function showDashboard() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';
}

/**
 * Display authentication messages
 */
function showAuthMessage(message, type) {
    const messageDiv = document.getElementById('auth-message');
    messageDiv.textContent = message;
    messageDiv.className = `auth-message ${type}`;
    messageDiv.style.display = 'block';
}

/**
 * Clear authentication messages
 */
function clearAuthMessage() {
    const messageDiv = document.getElementById('auth-message');
    messageDiv.style.display = 'none';
    messageDiv.textContent = '';
    messageDiv.className = 'auth-message';
}

/**
 * Clear all authentication form fields
 */
function clearAuthForms() {
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    clearAuthMessage();
}

/**
 * Check server status (existing function)
 */
async function checkServerStatus() {
    const resultDiv = document.getElementById('status-result');
    
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
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