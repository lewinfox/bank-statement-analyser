/**
 * Simple component loading system
 * Loads HTML components and inserts them into specified containers
 */
export class ComponentLoader {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Load a component from HTML file
   * @param {string} componentName - Name of the component file (without .html)
   * @param {string} containerId - ID of container to insert component into
   * @returns {Promise<void>}
   */
  async loadComponent(componentName, containerId) {
    try {
      let html;

      // Check cache first
      if (this.cache.has(componentName)) {
        html = this.cache.get(componentName);
      } else {
        const response = await fetch(`/components/${componentName}.html`);
        if (!response.ok) {
          throw new Error(`Failed to load component: ${componentName}`);
        }
        html = await response.text();
        this.cache.set(componentName, html);
      }

      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = html;

        // Dispatch custom event for component loaded
        container.dispatchEvent(
          new CustomEvent("componentLoaded", {
            detail: { componentName },
          })
        );
      }
    } catch (error) {
      console.error(`Error loading component ${componentName}:`, error);
    }
  }

  /**
   * Load multiple components
   * @param {Array<{name: string, container: string}>} components
   * @returns {Promise<void[]>}
   */
  async loadComponents(components) {
    const promises = components.map(({ name, container }) =>
      this.loadComponent(name, container)
    );
    return Promise.all(promises);
  }
}

export const componentLoader = new ComponentLoader();
