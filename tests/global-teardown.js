/**
 * Jest Global Teardown Hook
 * This function runs once after all test suites have completed execution
 * It cleans up the test database and removes any test artifacts
 */

const { teardownTestDatabase } = require('./database-fixtures');

/**
 * Global teardown function called by Jest after all tests complete
 * @returns {Promise<void>}
 */
module.exports = async () => {
  await teardownTestDatabase();
};