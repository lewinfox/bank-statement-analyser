/**
 * Unit tests for UserService
 * Tests user creation, authentication, and user lookup functionality
 */

const userService = require('../server/services/userService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Helper function to clean database between tests
 * Removes all users to ensure test isolation
 */
const cleanDatabase = async () => {
  await prisma.user.deleteMany();
};

describe('UserService', () => {
  // Clean database before each test to ensure isolation
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('createUser', () => {
    /**
     * Test that a user can be created successfully with valid inputs
     */
    test('should create a user with hashed password', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123'
      };

      const user = await userService.createUser(userData.username, userData.password);

      // Verify returned user object
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username', 'testuser');
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('password_hash');

      // Verify user exists in database with hashed password
      const dbUser = await prisma.user.findUnique({
        where: { username: 'testuser' }
      });
      expect(dbUser).toBeTruthy();
      expect(dbUser.password_hash).toBeTruthy();
      expect(dbUser.password_hash).not.toBe('password123'); // Should be hashed
    });

    /**
     * Test that attempting to create a user with a duplicate username throws an error
     */
    test('should throw error for duplicate username', async () => {
      // Create first user
      const user1 = await userService.createUser('duplicate', 'password123');
      expect(user1).toHaveProperty('username', 'duplicate');

      // Attempt to create second user with same username
      await expect(
        userService.createUser('duplicate', 'differentpass')
      ).rejects.toThrow('Username already exists');
    });

    /**
     * Test that passwords are hashed with different salts for security
     */
    test('should hash passwords with different salts', async () => {
      const user1 = await userService.createUser('user1', 'samepassword');
      const user2 = await userService.createUser('user2', 'samepassword');

      const dbUser1 = await prisma.user.findUnique({ where: { username: 'user1' } });
      const dbUser2 = await prisma.user.findUnique({ where: { username: 'user2' } });

      // Same password should produce different hashes due to salt
      expect(dbUser1.password_hash).not.toBe(dbUser2.password_hash);
    });
  });

  describe('authenticateUser', () => {
    beforeEach(async () => {
      // Create a test user for authentication tests
      await userService.createUser('authtest', 'correctpassword');
    });

    /**
     * Test successful authentication with correct credentials
     */
    test('should authenticate user with correct credentials', async () => {
      const user = await userService.authenticateUser('authtest', 'correctpassword');

      expect(user).toBeTruthy();
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username', 'authtest');
      expect(user).not.toHaveProperty('password_hash');
    });

    /**
     * Test that authentication fails with incorrect password
     */
    test('should return null for incorrect password', async () => {
      const user = await userService.authenticateUser('authtest', 'wrongpassword');
      expect(user).toBeNull();
    });

    /**
     * Test that authentication fails with non-existent username
     */
    test('should return null for non-existent username', async () => {
      const user = await userService.authenticateUser('nonexistent', 'password');
      expect(user).toBeNull();
    });

    /**
     * Test that authentication fails with empty password
     */
    test('should return null for empty password', async () => {
      const user = await userService.authenticateUser('authtest', '');
      expect(user).toBeNull();
    });
  });

  describe('findUserById', () => {
    let testUserId;

    beforeEach(async () => {
      // Create a test user and store its ID
      const user = await userService.createUser('findtest', 'password123');
      testUserId = user.id;
    });

    /**
     * Test finding a user by valid ID
     */
    test('should find user by valid ID', async () => {
      const user = await userService.findUserById(testUserId);

      expect(user).toBeTruthy();
      expect(user).toHaveProperty('id', testUserId);
      expect(user).toHaveProperty('username', 'findtest');
      expect(user).not.toHaveProperty('password_hash');
    });

    /**
     * Test that non-existent ID returns null
     */
    test('should return null for non-existent ID', async () => {
      const user = await userService.findUserById(99999);
      expect(user).toBeNull();
    });

    /**
     * Test that invalid ID types return null
     */
    test('should return null for invalid ID types', async () => {
      // Test various invalid ID types
      expect(await userService.findUserById('invalid')).toBeNull();
      expect(await userService.findUserById(null)).toBeNull();
      expect(await userService.findUserById(undefined)).toBeNull();
      expect(await userService.findUserById(-1)).toBeNull();
      expect(await userService.findUserById(0)).toBeNull();
      expect(await userService.findUserById(1.5)).toBeNull();
    });
  });

  // Clean up after all tests in this suite
  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });
});