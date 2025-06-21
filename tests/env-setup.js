/**
 * Environment setup for tests
 * This file runs before any modules are loaded and sets up the test environment
 * It is executed once per Jest worker process
 */

// Set test environment variables BEFORE any modules load
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:test.db";
