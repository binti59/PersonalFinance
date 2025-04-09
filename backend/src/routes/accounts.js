const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// @route   GET /api/accounts
// @desc    Get all accounts for a user
// @access  Private
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id });
    res.json(accounts);
  } catch (error) {
    console.error('Error getting accounts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/accounts
// @desc    Create a new account
// @access  Private
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { name, type, institution, balance, currency, accountNumber, metadata } = req.body;
    
    const newAccount = new Account({
      userId: req.user.id,
      name,
      type,
      institution,
      balance,
      currency,
      accountNumber,
      isActive: true,
      metadata
    });
    
    const account = await newAccount.save();
    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/accounts/:id
// @desc    Get an account by ID
// @access  Private
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const account = await Account.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    res.json(account);
  } catch (error) {
    console.error('Error getting account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/accounts/:id
// @desc    Update an account
// @access  Private
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { name, type, institution, balance, currency, isActive, metadata } = req.body;
    
    const account = await Account.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Update fields
    if (name) account.name = name;
    if (type) account.type = type;
    if (institution) account.institution = institution;
    if (balance !== undefined) account.balance = balance;
    if (currency) account.currency = currency;
    if (isActive !== undefined) account.isActive = isActive;
    if (metadata) {
      account.metadata = {
        ...account.metadata,
        ...metadata
      };
    }
    
    account.updatedAt = Date.now();
    
    const updatedAccount = await account.save();
    res.json(updatedAccount);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/accounts/:id
// @desc    Delete an account
// @access  Private
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const account = await Account.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Check if account is connected to a bank
    if (account.connectionId) {
      return res.status(400).json({ 
        message: 'Cannot delete a connected account. Please disconnect from the bank first.' 
      });
    }
    
    // Delete associated transactions
    await Transaction.deleteMany({ 
      accountId: account._id,
      userId: req.user.id
    });
    
    // Delete account
    await account.remove();
    
    res.json({ message: 'Account removed' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/accounts/:id/transactions
// @desc    Get transactions for an account
// @access  Private
router.get('/:id/transactions', authenticateJWT, async (req, res) => {
  try {
    const account = await Account.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Get query parameters
    const { startDate, endDate, category, type, limit = 50, skip = 0, sort = '-date' } = req.query;
    
    // Build query
    const query = { 
      accountId: account._id,
      userId: req.user.id
    };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (category) query.category = category;
    if (type) query.type = type;
    
    // Execute query
    const transactions = await Transaction.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    // Get total count
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/accounts/summary
// @desc    Get account summary (total assets, liabilities, net worth)
// @access  Private
router.get('/summary', authenticateJWT, async (req, res) => {
  try {
    const accounts = await Account.find({ 
      userId: req.user.id,
      isActive: true
    });
    
    let assets = 0;
    let liabilities = 0;
    
    accounts.forEach(account => {
      if (['bank', 'investment', 'cash'].includes(account.type)) {
        assets += account.balance;
      } else if (['credit', 'loan'].includes(account.type)) {
        liabilities += Math.abs(account.balance);
      }
    });
    
    const netWorth = assets - liabilities;
    
    res.json({
      assets,
      liabilities,
      netWorth,
      accountCount: accounts.length
    });
  } catch (error) {
    console.error('Error getting account summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
