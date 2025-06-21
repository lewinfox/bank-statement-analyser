const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csvService = require('../services/csvService');

const router = express.Router();

// Configure multer for CSV file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'transactions-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only allow CSV files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

/**
 * Upload and process CSV transactions file
 * POST /api/transactions/upload-csv
 */
router.post('/upload-csv', requireAuth, upload.single('csvFile'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const filePath = req.file.path;
    const userId = req.session.userId;

    console.log(`Processing CSV upload for user ${userId}: ${req.file.originalname}`);

    // Process the CSV file
    const results = await csvService.processTransactionsCsv(filePath, userId);

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error('Error cleaning up uploaded file:', cleanupError);
    }

    // Return processing results
    res.json({
      message: 'CSV file processed successfully',
      filename: req.file.originalname,
      results: {
        totalRows: results.totalRows,
        successfullyAdded: results.successfullyAdded,
        duplicatesIgnored: results.duplicatesIgnored,
        errorsCount: results.errors.length,
        errors: results.errors.slice(0, 10) // Limit errors in response to first 10
      }
    });

  } catch (error) {
    console.error('CSV upload error:', error);

    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file after error:', cleanupError);
      }
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }

    if (error.message === 'Only CSV files are allowed') {
      return res.status(400).json({ error: 'Only CSV files are allowed' });
    }

    res.status(500).json({ 
      error: 'Failed to process CSV file',
      details: error.message 
    });
  }
});

module.exports = router;