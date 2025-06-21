const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

class TransactionService {
  generateTransactionHash(transactionData) {
    // Create hash from all CSV fields (excluding user_id)
    const hashData = [
      transactionData.type || '',
      transactionData.details || '',
      transactionData.particulars || '',
      transactionData.code || '',
      transactionData.reference || '',
      transactionData.amount?.toString() || '',
      transactionData.date?.toISOString() || '',
      transactionData.foreign_currency_amount?.toString() || '',
      transactionData.conversion_charge?.toString() || ''
    ].join('|');
    
    return crypto.createHash('sha256').update(hashData).digest('hex');
  }

  async createTransaction(transactionData, userId) {
    const transaction_hash = this.generateTransactionHash(transactionData);
    
    // Check if transaction already exists for this user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        user_id: userId,
        transaction_hash: transaction_hash
      }
    });
    
    if (existingTransaction) {
      return existingTransaction;
    }
    
    try {
      const transaction = await prisma.transaction.create({
        data: {
          transaction_hash,
          user_id: userId,
          type: transactionData.type,
          details: transactionData.details,
          particulars: transactionData.particulars || null,
          code: transactionData.code || null,
          reference: transactionData.reference || null,
          amount: transactionData.amount,
          date: transactionData.date,
          foreign_currency_amount: transactionData.foreign_currency_amount || null,
          conversion_charge: transactionData.conversion_charge || null
        }
      });
      
      return transaction;
    } catch (error) {
      if (error.code === 'P2002') {
        // Unique constraint violation, return existing transaction
        return await prisma.transaction.findFirst({
          where: {
            user_id: userId,
            transaction_hash: transaction_hash
          }
        });
      }
      throw error;
    }
  }

  async getTransactionsByUser(userId, options = {}) {
    const { skip = 0, take = 100, orderBy = { date: 'desc' } } = options;
    
    return await prisma.transaction.findMany({
      where: { user_id: userId },
      skip,
      take,
      orderBy,
      include: {
        transaction_categories: {
          include: {
            category: true
          }
        }
      }
    });
  }

  async getTransactionById(id, userId) {
    return await prisma.transaction.findFirst({
      where: { 
        id,
        user_id: userId 
      },
      include: {
        transaction_categories: {
          include: {
            category: true
          }
        }
      }
    });
  }
}

module.exports = new TransactionService();