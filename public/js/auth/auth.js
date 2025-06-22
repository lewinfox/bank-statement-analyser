import { api } from "../shared/api.js";
import { Utils } from "../shared/utils.js";

/**
 * Authentication module
 */
export class Auth {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener("DOMContentLoaded", () => {
      // Ensure API is loaded before initializing
      this.initializeAuthPage();
    });
  }

  initializeAuthPage() {
    // Set up form toggle buttons
    const showLoginBtn = document.getElementById("show-login");
    const showRegisterBtn = document.getElementById("show-register");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (showLoginBtn && showRegisterBtn) {
      showLoginBtn.addEventListener("click", () => {
        this.showLoginForm();
      });

      showRegisterBtn.addEventListener("click", () => {
        this.showRegisterForm();
      });
    }

    // Set up form submissions
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));

      // Also add Enter key handling for login form inputs
      const loginUsername = document.getElementById("login-username");
      const loginPassword = document.getElementById("login-password");

      if (loginUsername) {
        loginUsername.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            this.handleLogin(e);
          }
        });
      }

      if (loginPassword) {
        loginPassword.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            this.handleLogin(e);
          }
        });
      }
    }

    if (registerForm) {
      registerForm.addEventListener("submit", (e) => this.handleRegister(e));
    }

    // Check if already logged in (only if we're not coming from a login)
    if (!this.isReturningFromLogin()) {
      this.checkAuthStatus();
    }
  }

  showLoginForm() {
    const showLoginBtn = document.getElementById("show-login");
    const showRegisterBtn = document.getElementById("show-register");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    showLoginBtn.classList.add("active");
    showRegisterBtn.classList.remove("active");
    loginForm.classList.add("active");
    registerForm.classList.remove("active");
    Utils.clearMessage("auth-message");
  }

  showRegisterForm() {
    const showLoginBtn = document.getElementById("show-login");
    const showRegisterBtn = document.getElementById("show-register");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    showRegisterBtn.classList.add("active");
    showLoginBtn.classList.remove("active");
    registerForm.classList.add("active");
    loginForm.classList.remove("active");
    Utils.clearMessage("auth-message");
  }

  async handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    if (!username || !password) {
      Utils.showMessage("auth-message", "Please fill in all fields", "error");
      return;
    }

    // Validate API availability
    if (!api || !api.auth || !api.auth.login) {
      console.error("Auth: API not available during login");
      Utils.showMessage(
        "auth-message",
        "Application not ready. Please refresh the page.",
        "error"
      );
      return;
    }

    try {
      const loginResult = await api.auth.login(username, password);
      console.log("Auth: Login successful, result:", loginResult);
      Utils.showMessage("auth-message", "Login successful!", "success");

      // Set flag to indicate we just logged in
      sessionStorage.setItem("justLoggedIn", "true");

      // Give more time for session to be established on server
      setTimeout(() => {
        console.log("Auth: Redirecting to dashboard");
        window.location.href = "dashboard.html";
      }, 100);
    } catch (error) {
      console.error("Auth: Login failed:", error.message || error);

      let errorMessage = "Login failed";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      Utils.showMessage("auth-message", errorMessage, "error");
    }
  }

  async handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById("register-username").value;
    const password = document.getElementById("register-password").value;
    const passwordConfirm = document.getElementById(
      "register-password-confirm"
    ).value;

    // Client-side validation
    if (!username || !password || !passwordConfirm) {
      Utils.showMessage("auth-message", "Please fill in all fields", "error");
      return;
    }

    if (password !== passwordConfirm) {
      Utils.showMessage("auth-message", "Passwords do not match", "error");
      return;
    }

    if (password.length < 6) {
      Utils.showMessage(
        "auth-message",
        "Password must be at least 6 characters long",
        "error"
      );
      return;
    }

    try {
      await api.auth.register(username, password);
      Utils.showMessage(
        "auth-message",
        "Registration successful! You can now log in.",
        "success"
      );

      // Switch to login form after successful registration
      setTimeout(() => {
        this.showLoginForm();
        this.clearForms();
      }, 2000);
    } catch (error) {
      Utils.showMessage(
        "auth-message",
        error.message || "Registration failed",
        "error"
      );
    }
  }

  async checkAuthStatus() {
    try {
      console.log("Auth: Checking if user is already authenticated");
      console.log("Auth: Current cookies:", document.cookie);
      const result = await api.auth.me();
      console.log("Auth: User is already authenticated:", result);
      // If successful, user is authenticated, redirect to dashboard
      window.location.href = "dashboard.html";
    } catch (error) {
      console.log("Auth: User not authenticated, staying on login page");
      console.log("Auth: Authentication error details:", error);
      console.log("Auth: Error status:", error.status);
      console.log("Auth: Error message:", error.message);
      // User is not authenticated, stay on login page
    }
  }

  isReturningFromLogin() {
    // Check if we have a flag indicating we just performed a login
    const justLoggedIn = sessionStorage.getItem("justLoggedIn");
    if (justLoggedIn) {
      sessionStorage.removeItem("justLoggedIn");
      return true;
    }
    return false;
  }

  clearForms() {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (loginForm) loginForm.reset();
    if (registerForm) registerForm.reset();
    Utils.clearMessage("auth-message");
  }
}
