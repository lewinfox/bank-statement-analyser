const fs = require('fs');
const csv = require('csv-parser');
const transactionService = require('./transactionService');

class CsvService {
  /**
   * Parse a CSV file and process transactions for a user
   * @param {string} filePath - Path to the CSV file
   * @param {number} userId - ID of the user uploading the file
   * @returns {Promise<Object>} Upload summary with counts and any errors
   */
  async processTransactionsCsv(filePath, userId) {
    const results = {
      totalRows: 0,
      successfullyAdded: 0,
      duplicatesIgnored: 0,
      errors: []
    };

    const transactions = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          results.totalRows++;
          
          try {
            const transaction = this.parseTransactionRow(row, results.totalRows);
            if (transaction) {
              transactions.push(transaction);
            }
          } catch (error) {
            results.errors.push({
              row: results.totalRows,
              error: error.message,
              data: row
            });
          }
        })
        .on('end', async () => {
          try {
            // Process all valid transactions
            // Track existing transactions before processing
            const existingTransactionHashes = new Set();
            const allUserTransactions = await transactionService.getTransactionsByUser(userId);
            allUserTransactions.forEach(tx => existingTransactionHashes.add(tx.transaction_hash));
            
            for (const transaction of transactions) {
              try {
                const expectedHash = transactionService.generateTransactionHash(transaction);
                const isDuplicate = existingTransactionHashes.has(expectedHash);
                
                if (isDuplicate) {
                  results.duplicatesIgnored++;
                } else {
                  await transactionService.createTransaction(transaction, userId);
                  results.successfullyAdded++;
                  existingTransactionHashes.add(expectedHash); // Track for subsequent transactions in same file
                }
              } catch (error) {
                results.errors.push({
                  transaction: transaction,
                  error: error.message
                });
              }
            }
            
            resolve(results);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Parse a single CSV row into a transaction object
   * @param {Object} row - CSV row data
   * @param {number} rowNumber - Row number for error reporting
   * @returns {Object} Parsed transaction object
   */
  parseTransactionRow(row, rowNumber) {
    // Skip empty rows
    if (!row.Type && !row.Details && !row.Amount) {
      return null;
    }

    // Validate required fields - Details can be empty but must exist
    if (!row.Type || row.Details === undefined || !row.Amount || !row.Date) {
      throw new Error(`Missing required fields (Type, Details, Amount, Date) in row ${rowNumber}`);
    }

    // Parse date from DD/MM/YYYY format
    const date = this.parseDate(row.Date);
    if (!date) {
      throw new Error(`Invalid date format '${row.Date}' in row ${rowNumber}. Expected DD/MM/YYYY`);
    }

    // Parse amount
    const amount = parseFloat(row.Amount);
    if (isNaN(amount)) {
      throw new Error(`Invalid amount '${row.Amount}' in row ${rowNumber}`);
    }

    // Handle optional foreign currency fields as text
    let foreignCurrencyAmount = null;
    let conversionCharge = null;

    if (row.ForeignCurrencyAmount && row.ForeignCurrencyAmount.trim() !== '') {
      foreignCurrencyAmount = row.ForeignCurrencyAmount.trim();
    }

    if (row.ConversionCharge && row.ConversionCharge.trim() !== '') {
      conversionCharge = row.ConversionCharge.trim();
    }

    return {
      type: row.Type.trim(),
      details: (row.Details || '').trim() || null, // Handle empty details
      particulars: row.Particulars?.trim() || null,
      code: row.Code?.trim() || null, // This is actually the merchant/reference in the CSV
      reference: row.Reference?.trim() || null,
      amount: amount,
      date: date,
      foreign_currency_amount: foreignCurrencyAmount,
      conversion_charge: conversionCharge
    };
  }

  /**
   * Parse date from DD/MM/YYYY format to JavaScript Date
   * @param {string} dateString - Date string in DD/MM/YYYY format
   * @returns {Date|null} Parsed date or null if invalid
   */
  parseDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
      return null;
    }

    const parts = dateString.trim().split('/');
    if (parts.length !== 3) {
      return null;
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Basic validation
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return null;
    }

    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
      return null;
    }

    // Create date (month is 0-indexed in JavaScript Date)
    const date = new Date(year, month - 1, day);
    
    // Verify the date is valid (handles cases like 31/02/2025)
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return null;
    }

    return date;
  }

}

module.exports = new CsvService();