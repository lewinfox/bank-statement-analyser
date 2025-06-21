/**
 * Unit tests for CsvService
 * Tests CSV parsing, transaction processing, and duplicate detection functionality
 */

const csvService = require('../server/services/csvService');
const userService = require('../server/services/userService');
const transactionService = require('../server/services/transactionService');
const { generateUniqueUsername } = require('./test-helpers');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('CsvService', () => {
  let testUser;
  const testCsvPath = path.join(__dirname, '..', 'demo-statement.csv');

  beforeEach(async () => {
    // Create a test user with unique username
    testUser = await userService.createUser(generateUniqueUsername('csvuser'), 'password123');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('parseDate', () => {
    /**
     * Test date parsing from DD/MM/YYYY format
     */
    test('should parse valid DD/MM/YYYY dates correctly', () => {
      const date = csvService.parseDate('31/03/2025');
      
      expect(date).toBeInstanceOf(Date);
      expect(date.getDate()).toBe(31);
      expect(date.getMonth()).toBe(2); // March is 2 (0-indexed)
      expect(date.getFullYear()).toBe(2025);
    });

    test('should handle leap year dates correctly', () => {
      const date = csvService.parseDate('29/02/2024'); // 2024 is a leap year
      
      expect(date).toBeInstanceOf(Date);
      expect(date.getDate()).toBe(29);
      expect(date.getMonth()).toBe(1); // February is 1 (0-indexed)
    });

    test('should return null for invalid dates', () => {
      expect(csvService.parseDate('32/01/2025')).toBeNull(); // Invalid day
      expect(csvService.parseDate('31/13/2025')).toBeNull(); // Invalid month
      expect(csvService.parseDate('29/02/2023')).toBeNull(); // Not a leap year
      expect(csvService.parseDate('invalid')).toBeNull();
      expect(csvService.parseDate('')).toBeNull();
      expect(csvService.parseDate(null)).toBeNull();
    });

    test('should handle different date formats incorrectly', () => {
      expect(csvService.parseDate('2025-03-31')).toBeNull(); // Wrong format
      expect(csvService.parseDate('03/31/2025')).toBeNull(); // US format
    });
  });

  describe('parseTransactionRow', () => {
    /**
     * Test parsing individual CSV rows into transaction objects
     */
    test('should parse a complete transaction row correctly', () => {
      const row = {
        Type: 'Visa Purchase',
        Details: '4835-****-****-9703  Df',
        Particulars: '',
        Code: 'Woolworths N',
        Reference: '',
        Amount: '-105.87',
        Date: '31/03/2025',
        ForeignCurrencyAmount: '',
        ConversionCharge: ''
      };

      const transaction = csvService.parseTransactionRow(row, 1);

      expect(transaction).toEqual({
        type: 'Visa Purchase',
        details: '4835-****-****-9703  Df',
        particulars: null,
        code: 'Woolworths N',
        reference: null,
        amount: -105.87,
        date: new Date(2025, 2, 31), // March 31, 2025 (month is 0-indexed)
        foreign_currency_amount: null,
        conversion_charge: null
      });
    });

    test('should parse row with foreign currency fields', () => {
      const row = {
        Type: 'International Transfer',
        Details: 'Transfer to USD account',
        Particulars: 'International',
        Code: 'INT',
        Reference: 'REF123',
        Amount: '-1000.00',
        Date: '15/03/2025',
        ForeignCurrencyAmount: '750.50',
        ConversionCharge: '15.25'
      };

      const transaction = csvService.parseTransactionRow(row, 1);

      expect(transaction.foreign_currency_amount).toBe(750.50);
      expect(transaction.conversion_charge).toBe(15.25);
    });

    test('should handle rows with empty details', () => {
      const row = {
        Type: 'Debit Interest',
        Details: '', // Empty details
        Particulars: '',
        Code: '',
        Reference: '',
        Amount: '-81.52',
        Date: '31/03/2025',
        ForeignCurrencyAmount: '',
        ConversionCharge: ''
      };

      const transaction = csvService.parseTransactionRow(row, 1);

      expect(transaction.type).toBe('Debit Interest');
      expect(transaction.details).toBeNull(); // Empty details should become null
      expect(transaction.amount).toBe(-81.52);
    });

    test('should handle rows with minimal data', () => {
      const row = {
        Type: 'Bank Fee',
        Details: 'Monthly A/C Fee',
        Particulars: '',
        Code: '',
        Reference: '',
        Amount: '-12.50',
        Date: '31/03/2025',
        ForeignCurrencyAmount: '',
        ConversionCharge: ''
      };

      const transaction = csvService.parseTransactionRow(row, 1);

      expect(transaction.type).toBe('Bank Fee');
      expect(transaction.details).toBe('Monthly A/C Fee');
      expect(transaction.particulars).toBeNull();
      expect(transaction.amount).toBe(-12.50);
    });

    test('should return null for completely empty rows', () => {
      const emptyRow = {
        Type: '',
        Details: '',
        Particulars: '',
        Code: '',
        Reference: '',
        Amount: '',
        Date: '',
        ForeignCurrencyAmount: '',
        ConversionCharge: ''
      };

      const transaction = csvService.parseTransactionRow(emptyRow, 1);
      expect(transaction).toBeNull();
    });

    test('should throw error for missing required fields', () => {
      const incompleteRow = {
        Type: 'Visa Purchase',
        Details: 'Some details',
        Amount: '-105.87'
        // Missing Date
      };

      expect(() => {
        csvService.parseTransactionRow(incompleteRow, 1);
      }).toThrow('Missing required fields (Type, Details, Amount, Date) in row 1');
    });

    test('should throw error for invalid amount', () => {
      const row = {
        Type: 'Visa Purchase',
        Details: 'Test purchase',
        Amount: 'invalid',
        Date: '31/03/2025'
      };

      expect(() => {
        csvService.parseTransactionRow(row, 1);
      }).toThrow('Invalid amount \'invalid\' in row 1');
    });

    test('should throw error for invalid date', () => {
      const row = {
        Type: 'Visa Purchase',
        Details: 'Test purchase',
        Amount: '-105.87',
        Date: 'invalid-date'
      };

      expect(() => {
        csvService.parseTransactionRow(row, 1);
      }).toThrow('Invalid date format \'invalid-date\' in row 1. Expected DD/MM/YYYY');
    });
  });

  describe('processTransactionsCsv', () => {
    /**
     * Test processing the demo CSV file
     */
    test('should process demo-statement.csv successfully', async () => {
      // Verify the test file exists
      expect(fs.existsSync(testCsvPath)).toBe(true);

      const results = await csvService.processTransactionsCsv(testCsvPath, testUser.id);

      expect(results.totalRows).toBe(9); // 9 transactions in demo file
      expect(results.successfullyAdded).toBe(9);
      expect(results.duplicatesIgnored).toBe(0);
      expect(results.errors).toHaveLength(0);
    });

    test('should detect duplicates when processing same file twice', async () => {
      // First upload
      const firstUpload = await csvService.processTransactionsCsv(testCsvPath, testUser.id);
      expect(firstUpload.successfullyAdded).toBe(9);
      expect(firstUpload.duplicatesIgnored).toBe(0);

      // Second upload of same file
      const secondUpload = await csvService.processTransactionsCsv(testCsvPath, testUser.id);
      expect(secondUpload.successfullyAdded).toBe(0);
      expect(secondUpload.duplicatesIgnored).toBe(9); // All should be duplicates
      expect(secondUpload.errors).toHaveLength(0);
    });

    test('should verify transactions are actually stored in database', async () => {
      await csvService.processTransactionsCsv(testCsvPath, testUser.id);

      // Check that transactions were actually created
      const userTransactions = await transactionService.getTransactionsByUser(testUser.id);
      expect(userTransactions).toHaveLength(9);

      // Verify sample transaction details
      const woolworthsTransaction = userTransactions.find(t => 
        t.code === 'Woolworths N'
      );
      expect(woolworthsTransaction).toBeTruthy();
      expect(woolworthsTransaction.type).toBe('Visa Purchase');
      expect(woolworthsTransaction.amount.toString()).toBe('-105.87');
      expect(woolworthsTransaction.date).toEqual(new Date(2025, 2, 31));
    });

    test('should handle different users independently', async () => {
      // Create second user
      const testUser2 = await userService.createUser(generateUniqueUsername('csvuser2'), 'password123');

      // Upload same file for both users
      const user1Results = await csvService.processTransactionsCsv(testCsvPath, testUser.id);
      const user2Results = await csvService.processTransactionsCsv(testCsvPath, testUser2.id);

      // Both should succeed with no duplicates between users
      expect(user1Results.successfullyAdded).toBe(9);
      expect(user1Results.duplicatesIgnored).toBe(0);
      expect(user2Results.successfullyAdded).toBe(9);
      expect(user2Results.duplicatesIgnored).toBe(0);

      // Verify each user has their own transactions
      const user1Transactions = await transactionService.getTransactionsByUser(testUser.id);
      const user2Transactions = await transactionService.getTransactionsByUser(testUser2.id);

      expect(user1Transactions).toHaveLength(9);
      expect(user2Transactions).toHaveLength(9);

      // Verify transactions have different IDs but same hashes
      expect(user1Transactions[0].id).not.toBe(user2Transactions[0].id);
      expect(user1Transactions[0].transaction_hash).toBe(user2Transactions[0].transaction_hash);
    });

    test('should handle file with parsing errors gracefully', async () => {
      // Create a test CSV with some bad data
      const badCsvPath = path.join(__dirname, 'test-bad-data.csv');
      const badCsvContent = `Type,Details,Particulars,Code,Reference,Amount,Date,ForeignCurrencyAmount,ConversionCharge
Bank Fee,Monthly A/C Fee,,,,-12.50,31/03/2025,,
Invalid Row,Test,,,INVALID_AMOUNT,32/13/2025,,
Visa Purchase,Good Transaction,,,,-50.00,15/03/2025,,`;

      fs.writeFileSync(badCsvPath, badCsvContent);

      try {
        const results = await csvService.processTransactionsCsv(badCsvPath, testUser.id);

        expect(results.totalRows).toBe(3);
        expect(results.successfullyAdded).toBe(2); // First and third rows
        expect(results.duplicatesIgnored).toBe(0);
        expect(results.errors).toHaveLength(1); // Second row should fail
        expect(results.errors[0].row).toBe(2);
      } finally {
        // Clean up test file
        if (fs.existsSync(badCsvPath)) {
          fs.unlinkSync(badCsvPath);
        }
      }
    });
  });
});