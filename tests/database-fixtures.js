const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Database URL for test database
 * Uses a dedicated test.db file in the prisma directory to avoid conflicts
 */
const DATABASE_URL = "file:test.db"

/**
 * Deletes a SQLite database file and its associated journal file
 * @param {string} db_file_path - Path to the database file to delete
 * @returns {Promise<void>}
 */
const deleteTestDb = async (db_file_path) => {
  const db_file = `prisma/${db_file_path}`
  const journal_path = `${db_file}-journal`

  try {
    if (fs.existsSync(db_file)) {
      console.log(`Deleting ${db_file}`)
      fs.unlinkSync(db_file)
    }
    if (fs.existsSync(journal_path)) {
      fs.unlinkSync(journal_path)
    }
  } catch {
    console.error(`Unable to delete pre-existing database ${db_file}`)
  }
}

/**
 * Sets up a fresh test database by removing any existing database and applying all Prisma migrations
 * This function is called once at the beginning of the entire test suite
 * @returns {Promise<void>}
 */
const setupTestDatabase = async () => {
  // Get database path from environment variable
  const testDbPath = DATABASE_URL.replace('file:', '');

  // 1. Remove existing test database if it exists
  await deleteTestDb(testDbPath)

  // 2. Apply all migrations to create fresh database
  try {
    execSync(`npx prisma migrate deploy`, {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: DATABASE_URL }
    });
    console.log('   Applied migrations successfully');
  } catch (error) {
    console.error('   Failed to apply migrations:', error.message);
    throw error;
  }

  // 3. Verify database was created (Prisma already confirmed success above)

  console.log('✅ Test database ready');
};

/**
 * Cleans up the test database by removing the database file and its journal
 * This function is called once at the end of the entire test suite
 * @returns {Promise<void>}
 */
const teardownTestDatabase = async () => {
  console.log('🧹 Cleaning up test database...');

  // The database is created within the `prisma/` directory so we need to use a different file path
  // to delete it.
  const testDbPath = DATABASE_URL.replace('file:', '');

  // Remove test database
  await deleteTestDb(testDbPath)

  console.log('✅ Test cleanup complete');
};

module.exports = {
  setupTestDatabase,
  teardownTestDatabase
};