import { componentLoader } from "../shared/components.js";
import { api } from "../shared/api.js";
/**
 * Navigation and page management
 */
export class Navigation {
  constructor() {
    this.currentPage = "";
    this.init();
  }

  init() {
    // Set current page based on URL
    this.currentPage = this.getCurrentPageFromUrl();

    // Set up navigation event listeners after navbar loads
    document.addEventListener("DOMContentLoaded", () => {
      this.setupNavigation();
    });
  }

  getCurrentPageFromUrl() {
    const path = window.location.pathname;
    const page = path.split("/").pop().replace(".html", "") || "dashboard";
    return page;
  }

  setupNavigation() {
    // Load header and navbar components
    this.loadHeaderAndNav();

    // Set up logout functionality
    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "logout-btn") {
        this.handleLogout();
      }
    });
  }

  async loadHeaderAndNav() {
    try {
      // Load header component
      await componentLoader.loadComponent("header", "header-container");

      // Load navbar into header
      await componentLoader.loadComponent("navbar", "navbar-container");

      // Set active nav item
      this.setActiveNavItem();
    } catch (error) {
      console.error("Error loading navigation:", error);
    }
  }

  setActiveNavItem() {
    const navLinks = document.querySelectorAll(".nav-btn[data-page]");
    navLinks.forEach((link) => {
      if (link.dataset.page === this.currentPage) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  async handleLogout() {
    try {
      await api.auth.logout();
      window.location.href = "index.html";
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if logout fails
      window.location.href = "index.html";
    }
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  async checkAuth() {
    // Validate API availability
    if (!api || !api.auth || !api.auth.me) {
      console.log("Navigation: API not available during auth check");
      return false;
    }

    try {
      console.log("Navigation: Checking authentication status");
      const result = await api.auth.me();
      console.log("Navigation: Authentication check successful:", result);
      return true;
    } catch (error) {
      console.log(
        "Navigation: Authentication check failed:",
        error.message || error
      );
      return false;
    }
  }

  /**
   * Redirect to login if not authenticated
   */
  async requireAuth() {
    console.log("Navigation: requireAuth called");

    const isAuthenticated = await this.checkAuth();
    console.log("Navigation: isAuthenticated =", isAuthenticated);

    if (!isAuthenticated) {
      console.log("Navigation: User not authenticated, redirecting to login");
      window.location.href = "index.html";
      return false;
    }

    console.log("Navigation: User authenticated, continuing");
    return true;
  }
}

export const navigation = new Navigation();
