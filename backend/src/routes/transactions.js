const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Category = require('../models/Category');

// @route   GET /api/transactions
// @desc    Get all transactions for a user
// @access  Private
router.get('/', authenticateJWT, async (req, res) => {
  try {
    // Get query parameters
    const { 
      startDate, 
      endDate, 
      category, 
      type, 
      accountId,
      search,
      limit = 50, 
      skip = 0, 
      sort = '-date' 
    } = req.query;
    
    // Build query
    const query = { userId: req.user.id };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (category) query.category = category;
    if (type) query.type = type;
    if (accountId) query.accountId = accountId;
    
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { merchant: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query
    const transactions = await Transaction.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('accountId', 'name type institution');
    
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

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Private
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { 
      accountId, 
      date, 
      amount, 
      type, 
      category, 
      subcategory,
      description, 
      merchant, 
      isRecurring,
      tags,
      notes,
      location
    } = req.body;
    
    // Verify account exists and belongs to user
    const account = await Account.findOne({ 
      _id: accountId,
      userId: req.user.id
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Create new transaction
    const newTransaction = new Transaction({
      userId: req.user.id,
      accountId,
      date: new Date(date),
      amount,
      type,
      category,
      subcategory,
      description,
      merchant,
      isRecurring: isRecurring || false,
      tags: tags || [],
      notes,
      location
    });
    
    const transaction = await newTransaction.save();
    
    // Update account balance
    if (type === 'expense') {
      account.balance -= amount;
    } else if (type === 'income') {
      account.balance += amount;
    }
    
    account.updatedAt = Date.now();
    await account.save();
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get a transaction by ID
// @access  Private
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    }).populate('accountId', 'name type institution');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update a transaction
// @access  Private
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { 
      accountId, 
      date, 
      amount, 
      type, 
      category, 
      subcategory,
      description, 
      merchant, 
      isRecurring,
      tags,
      notes,
      location
    } = req.body;
    
    // Find transaction
    const transaction = await Transaction.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // If account is changing, verify new account exists and belongs to user
    let oldAccount, newAccount;
    if (accountId && accountId !== transaction.accountId.toString()) {
      newAccount = await Account.findOne({ 
        _id: accountId,
        userId: req.user.id
      });
      
      if (!newAccount) {
        return res.status(404).json({ message: 'New account not found' });
      }
      
      oldAccount = await Account.findById(transaction.accountId);
    } else if (amount !== transaction.amount || type !== transaction.type) {
      // If amount or type is changing, we need to update the account balance
      oldAccount = await Account.findById(transaction.accountId);
    }
    
    // Update transaction fields
    if (accountId) transaction.accountId = accountId;
    if (date) transaction.date = new Date(date);
    if (amount !== undefined) transaction.amount = amount;
    if (type) transaction.type = type;
    if (category) transaction.category = category;
    if (subcategory !== undefined) transaction.subcategory = subcategory;
    if (description) transaction.description = description;
    if (merchant !== undefined) transaction.merchant = merchant;
    if (isRecurring !== undefined) transaction.isRecurring = isRecurring;
    if (tags) transaction.tags = tags;
    if (notes !== undefined) transaction.notes = notes;
    if (location) transaction.location = location;
    
    transaction.updatedAt = Date.now();
    
    const updatedTransaction = await transaction.save();
    
    // Update account balances if necessary
    if (oldAccount) {
      // Reverse the effect of the old transaction
      if (transaction.type === 'expense') {
        oldAccount.balance += transaction.amount;
      } else if (transaction.type === 'income') {
        oldAccount.balance -= transaction.amount;
      }
      
      oldAccount.updatedAt = Date.now();
      await oldAccount.save();
    }
    
    if (newAccount) {
      // Apply the effect of the transaction to the new account
      if (transaction.type === 'expense') {
        newAccount.balance -= transaction.amount;
      } else if (transaction.type === 'income') {
        newAccount.balance += transaction.amount;
      }
      
      newAccount.updatedAt = Date.now();
      await newAccount.save();
    } else if (oldAccount && (amount !== transaction.amount || type !== transaction.type)) {
      // Apply the updated transaction to the same account
      if (type === 'expense' || (!type && transaction.type === 'expense')) {
        oldAccount.balance -= amount;
      } else if (type === 'income' || (!type && transaction.type === 'income')) {
        oldAccount.balance += amount;
      }
      
      oldAccount.updatedAt = Date.now();
      await oldAccount.save();
    }
    
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Update account balance
    const account = await Account.findById(transaction.accountId);
    
    if (account) {
      if (transaction.type === 'expense') {
        account.balance += transaction.amount;
      } else if (transaction.type === 'income') {
        account.balance -= transaction.amount;
      }
      
      account.updatedAt = Date.now();
      await account.save();
    }
    
    // Delete transaction
    await transaction.remove();
    
    res.json({ message: 'Transaction removed' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/transactions/categories
// @desc    Get all transaction categories
// @access  Private
router.get('/categories', authenticateJWT, async (req, res) => {
  try {
    // Get user-defined categories
    const userCategories = await Category.find({ userId: req.user.id });
    
    // Get default categories
    const defaultCategories = await Category.find({ isDefault: true });
    
    // Combine and deduplicate
    const allCategories = [...userCategories, ...defaultCategories];
    const uniqueCategories = Array.from(new Map(allCategories.map(cat => [cat.name, cat])).values());
    
    res.json(uniqueCategories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/transactions/summary
// @desc    Get transaction summary (income, expenses, savings rate)
// @access  Private
router.get('/summary', authenticateJWT, async (req, res) => {
  try {
    // Get query parameters
    const { startDate, endDate } = req.query;
    
    // Build date range
    const dateRange = {};
    if (startDate) dateRange.$gte = new Date(startDate);
    if (endDate) dateRange.$lte = new Date(endDate);
    
    // Get income
    const incomeResult = await Transaction.aggregate([
      { 
        $match: { 
          userId: mongoose.Types.ObjectId(req.user.id),
          type: 'income',
          ...(Object.keys(dateRange).length > 0 ? { date: dateRange } : {})
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);
    
    // Get expenses
    const expenseResult = await Transaction.aggregate([
      { 
        $match: { 
          userId: mongoose.Types.ObjectId(req.user.id),
          type: 'expense',
          ...(Object.keys(dateRange).length > 0 ? { date: dateRange } : {})
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);
    
    const income = incomeResult.length > 0 ? incomeResult[0].total : 0;
    const expenses = expenseResult.length > 0 ? expenseResult[0].total : 0;
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    
    res.json({
      income,
      expenses,
      savings,
      savingsRate
    });
  } catch (error) {
    console.error('Error getting transaction summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
