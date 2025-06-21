/**
 * Shared test helper functions
 * Provides common utilities for test isolation and data generation
 */

/**
 * Generates a unique username for testing purposes
 * Combines timestamp and random string to ensure uniqueness across parallel test runs
 * @param {string} prefix - Optional prefix for the username (e.g., 'testuser', 'authtest')
 * @returns {string} Unique username string
 */
const generateUniqueUsername = (prefix = 'user') => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  return `${prefix}_${timestamp}_${randomId}`;
};

module.exports = {
  generateUniqueUsername
};