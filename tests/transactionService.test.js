/**
 * Unit tests for TransactionService
 * Tests transaction creation, hash generation, deduplication, and retrieval functionality
 */

const transactionService = require('../server/services/transactionService');
const userService = require('../server/services/userService');
const { PrismaClient } = require('@prisma/client');
const { generateUniqueUsername } = require('./test-helpers');

const prisma = new PrismaClient();

describe('TransactionService', () => {
  let testUser1, testUser2;

  // Create test users before each test with unique usernames
  beforeEach(async () => {
    testUser1 = await userService.createUser(generateUniqueUsername('txuser1'), 'password123');
    testUser2 = await userService.createUser(generateUniqueUsername('txuser2'), 'password123');
  });

  /**
   * Sample transaction data for testing
   */
  const sampleTransaction = {
    type: 'Visa Purchase',
    details: 'Test Store Purchase',
    particulars: 'Store Location',
    code: 'VISA',
    reference: 'REF123',
    amount: -25.50,
    date: new Date('2025-01-01'),
    foreign_currency_amount: null,
    conversion_charge: null
  };

  describe('generateTransactionHash', () => {
    /**
     * Test that the same transaction data produces consistent hashes
     */
    test('should generate consistent hash for same transaction data', () => {
      const hash1 = transactionService.generateTransactionHash(sampleTransaction);
      const hash2 = transactionService.generateTransactionHash(sampleTransaction);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex string length
    });

    /**
     * Test that different transaction data produces different hashes
     */
    test('should generate different hashes for different transaction data', () => {
      const transaction2 = { ...sampleTransaction, amount: -30.00 };

      const hash1 = transactionService.generateTransactionHash(sampleTransaction);
      const hash2 = transactionService.generateTransactionHash(transaction2);

      expect(hash1).not.toBe(hash2);
    });

    /**
     * Test that null and undefined values are handled consistently
     */
    test('should handle null/undefined values consistently', () => {
      const transactionWithNulls = {
        type: 'Transfer',
        details: 'Bank Transfer',
        particulars: null,
        code: null,
        reference: null,
        amount: 100.00,
        date: new Date('2025-01-01'),
        foreign_currency_amount: null,
        conversion_charge: null
      };

      const hash = transactionService.generateTransactionHash(transactionWithNulls);
      expect(hash).toHaveLength(64);
    });

    /**
     * Test that the hash does not include user ID (same transaction for different users should have same hash)
     */
    test('should not include user ID in hash', () => {
      // Same transaction data should produce same hash regardless of which user
      const hash1 = transactionService.generateTransactionHash(sampleTransaction);
      const hash2 = transactionService.generateTransactionHash(sampleTransaction);

      expect(hash1).toBe(hash2);
    });

    /**
     * Test that changing any field changes the hash
     */
    test('should generate different hash when any field changes', () => {
      const baseHash = transactionService.generateTransactionHash(sampleTransaction);

      // Test each field
      const typeChanged = { ...sampleTransaction, type: 'Different Type' };
      const detailsChanged = { ...sampleTransaction, details: 'Different Details' };
      const amountChanged = { ...sampleTransaction, amount: -50.00 };
      const dateChanged = { ...sampleTransaction, date: new Date('2025-02-01') };

      expect(transactionService.generateTransactionHash(typeChanged)).not.toBe(baseHash);
      expect(transactionService.generateTransactionHash(detailsChanged)).not.toBe(baseHash);
      expect(transactionService.generateTransactionHash(amountChanged)).not.toBe(baseHash);
      expect(transactionService.generateTransactionHash(dateChanged)).not.toBe(baseHash);
    });
  });

  describe('createTransaction', () => {
    /**
     * Test creating a new transaction successfully
     */
    test('should create a new transaction', async () => {
      const transaction = await transactionService.createTransaction(sampleTransaction, testUser1.id);

      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('transaction_hash');
      expect(transaction).toHaveProperty('user_id', testUser1.id);
      expect(transaction).toHaveProperty('type', 'Visa Purchase');
      expect(transaction).toHaveProperty('amount');
      expect(transaction.amount.toString()).toBe('-25.5'); // Decimal handling
    });

    /**
     * Test that duplicate transactions for the same user are prevented
     */
    test('should prevent duplicate transactions for same user', async () => {
      const transaction1 = await transactionService.createTransaction(sampleTransaction, testUser1.id);
      const transaction2 = await transactionService.createTransaction(sampleTransaction, testUser1.id);

      expect(transaction1.id).toBe(transaction2.id);
      expect(transaction1.transaction_hash).toBe(transaction2.transaction_hash);

      // Verify only one transaction exists for this user with this hash
      const allTransactions = await prisma.transaction.findMany({
        where: { 
          user_id: testUser1.id,
          transaction_hash: transaction1.transaction_hash
        }
      });
      expect(allTransactions).toHaveLength(1);
    });

    /**
     * Test that the same transaction can exist for different users
     */
    test('should allow same transaction for different users', async () => {
      const transaction1 = await transactionService.createTransaction(sampleTransaction, testUser1.id);
      const transaction2 = await transactionService.createTransaction(sampleTransaction, testUser2.id);

      expect(transaction1.id).not.toBe(transaction2.id);
      expect(transaction1.transaction_hash).toBe(transaction2.transaction_hash); // Same hash
      expect(transaction1.user_id).not.toBe(transaction2.user_id);

      // Verify both transactions exist with the same hash but different users
      const user1Transactions = await prisma.transaction.findMany({
        where: { 
          user_id: testUser1.id,
          transaction_hash: transaction1.transaction_hash
        }
      });
      const user2Transactions = await prisma.transaction.findMany({
        where: { 
          user_id: testUser2.id,
          transaction_hash: transaction2.transaction_hash
        }
      });

      expect(user1Transactions).toHaveLength(1);
      expect(user2Transactions).toHaveLength(1);
    });

    /**
     * Test that decimal amounts are handled correctly
     */
    test('should handle decimal amounts correctly', async () => {
      const decimalTransaction = {
        ...sampleTransaction,
        amount: -123.456789
      };

      const transaction = await transactionService.createTransaction(decimalTransaction, testUser1.id);
      expect(transaction.amount.toString()).toBe('-123.456789');
    });

    /**
     * Test that null values are stored correctly
     */
    test('should store null values correctly', async () => {
      const minimalTransaction = {
        type: 'Transfer',
        details: 'Simple Transfer',
        particulars: null,
        code: null,
        reference: null,
        amount: 50.00,
        date: new Date('2025-01-01'),
        foreign_currency_amount: null,
        conversion_charge: null
      };

      const transaction = await transactionService.createTransaction(minimalTransaction, testUser1.id);

      expect(transaction.particulars).toBeNull();
      expect(transaction.code).toBeNull();
      expect(transaction.reference).toBeNull();
      expect(transaction.foreign_currency_amount).toBeNull();
      expect(transaction.conversion_charge).toBeNull();
    });
  });

  describe('getTransactionsByUser', () => {
    let createdTransactions = [];
    
    beforeEach(async () => {
      // Create multiple transactions for testing
      const transactions = [
        { ...sampleTransaction, amount: -10, date: new Date('2025-01-01') },
        { ...sampleTransaction, amount: -20, date: new Date('2025-01-02'), details: 'Different details 1' },
        { ...sampleTransaction, amount: -30, date: new Date('2025-01-03'), details: 'Different details 2' }
      ];

      createdTransactions = [];
      for (const tx of transactions) {
        const created = await transactionService.createTransaction(tx, testUser1.id);
        createdTransactions.push(created);
      }
    });

    /**
     * Test that transactions are returned ordered by date desc by default
     */
    test('should return transactions for user ordered by date desc', async () => {
      const transactions = await transactionService.getTransactionsByUser(testUser1.id);

      // Filter to only our created transactions
      const ourTransactions = transactions.filter(tx => 
        createdTransactions.some(created => created.id === tx.id)
      );

      expect(ourTransactions).toHaveLength(3);
      expect(ourTransactions[0].amount.toString()).toBe('-30'); // Most recent first
      expect(ourTransactions[1].amount.toString()).toBe('-20');
      expect(ourTransactions[2].amount.toString()).toBe('-10');
    });

    /**
     * Test pagination options
     */
    test('should respect pagination options', async () => {
      // Get all transactions first, then test pagination on our created transactions
      const allTransactions = await transactionService.getTransactionsByUser(testUser1.id, {
        orderBy: { date: 'desc' }
      });
      
      // Filter to only our created transactions
      const ourTransactions = allTransactions.filter(tx => 
        createdTransactions.some(created => created.id === tx.id)
      );

      expect(ourTransactions.length).toBeGreaterThanOrEqual(3);
      expect(ourTransactions[1].amount.toString()).toBe('-20'); // Second transaction by date
    });

    /**
     * Test that empty array is returned for user with no transactions
     */
    test('should return empty array for user with no transactions', async () => {
      const transactions = await transactionService.getTransactionsByUser(testUser2.id);
      expect(transactions).toHaveLength(0);
    });

    /**
     * Test that transaction categories are included in response
     */
    test('should include transaction categories in response', async () => {
      const transactions = await transactionService.getTransactionsByUser(testUser1.id);

      // Find one of our created transactions
      const ourTransaction = transactions.find(tx => 
        createdTransactions.some(created => created.id === tx.id)
      );
      
      expect(ourTransaction).toBeTruthy();
      expect(ourTransaction).toHaveProperty('transaction_categories');
      expect(Array.isArray(ourTransaction.transaction_categories)).toBe(true);
    });

    /**
     * Test custom ordering options
     */
    test('should respect custom ordering options', async () => {
      const transactions = await transactionService.getTransactionsByUser(testUser1.id, {
        orderBy: { amount: 'asc' }
      });

      // Filter to only our created transactions
      const ourTransactions = transactions.filter(tx => 
        createdTransactions.some(created => created.id === tx.id)
      );

      expect(ourTransactions).toHaveLength(3);
      expect(ourTransactions[0].amount.toString()).toBe('-30'); // Smallest (most negative) first
      expect(ourTransactions[1].amount.toString()).toBe('-20');
      expect(ourTransactions[2].amount.toString()).toBe('-10');
    });
  });

  describe('getTransactionById', () => {
    let testTransaction;

    beforeEach(async () => {
      testTransaction = await transactionService.createTransaction(sampleTransaction, testUser1.id);
    });

    /**
     * Test finding transaction by ID for correct user
     */
    test('should return transaction by ID for correct user', async () => {
      const transaction = await transactionService.getTransactionById(testTransaction.id, testUser1.id);

      expect(transaction).toBeTruthy();
      expect(transaction.id).toBe(testTransaction.id);
      expect(transaction.user_id).toBe(testUser1.id);
    });

    /**
     * Test that transaction belonging to different user returns null
     */
    test('should return null for transaction belonging to different user', async () => {
      const transaction = await transactionService.getTransactionById(testTransaction.id, testUser2.id);
      expect(transaction).toBeNull();
    });

    /**
     * Test that non-existent transaction ID returns null
     */
    test('should return null for non-existent transaction ID', async () => {
      const transaction = await transactionService.getTransactionById(99999, testUser1.id);
      expect(transaction).toBeNull();
    });

    /**
     * Test that transaction categories are included in response
     */
    test('should include transaction categories in response', async () => {
      const transaction = await transactionService.getTransactionById(testTransaction.id, testUser1.id);

      expect(transaction).toHaveProperty('transaction_categories');
      expect(Array.isArray(transaction.transaction_categories)).toBe(true);
    });
  });

  // Clean up after all tests in this suite
  afterAll(async () => {
    await prisma.$disconnect();
  });
});