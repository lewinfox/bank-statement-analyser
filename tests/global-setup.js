/**
 * Jest Global Setup Hook
 * This function runs once before all test suites begin execution
 * It sets up the test database that will be used by all tests
 */

const { setupTestDatabase } = require('./database-fixtures');

/**
 * Global setup function called by Jest before running any tests
 * @returns {Promise<void>}
 */
module.exports = async () => {
  await setupTestDatabase();
};