const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Budget = require('../models/Budget');
const Category = require('../models/Category');

// @route   GET /api/budgets
// @desc    Get all budgets for a user
// @access  Private
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.id });
    res.json(budgets);
  } catch (error) {
    console.error('Error getting budgets:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/budgets
// @desc    Create a new budget
// @access  Private
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { 
      name, 
      amount, 
      period, 
      startDate, 
      endDate, 
      categories,
      rollover,
      notifications
    } = req.body;
    
    // Validate categories
    if (categories && categories.length > 0) {
      for (const category of categories) {
        if (!category.categoryId) {
          return res.status(400).json({ message: 'Category ID is required for each category' });
        }
        
        if (category.amount === undefined) {
          return res.status(400).json({ message: 'Amount is required for each category' });
        }
      }
    }
    
    // Create new budget
    const newBudget = new Budget({
      userId: req.user.id,
      name,
      amount,
      period,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      categories: categories || [],
      isActive: true,
      rollover: rollover || false,
      notifications: notifications || {
        enabled: true,
        threshold: 80
      }
    });
    
    const budget = await newBudget.save();
    res.status(201).json(budget);
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/budgets/:id
// @desc    Get a budget by ID
// @access  Private
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const budget = await Budget.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (error) {
    console.error('Error getting budget:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/budgets/:id
// @desc    Update a budget
// @access  Private
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { 
      name, 
      amount, 
      period, 
      startDate, 
      endDate, 
      categories,
      isActive,
      rollover,
      notifications
    } = req.body;
    
    const budget = await Budget.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    // Update fields
    if (name) budget.name = name;
    if (amount !== undefined) budget.amount = amount;
    if (period) budget.period = period;
    if (startDate) budget.startDate = new Date(startDate);
    if (endDate !== undefined) budget.endDate = endDate ? new Date(endDate) : null;
    if (categories) budget.categories = categories;
    if (isActive !== undefined) budget.isActive = isActive;
    if (rollover !== undefined) budget.rollover = rollover;
    if (notifications) {
      budget.notifications = {
        ...budget.notifications,
        ...notifications
      };
    }
    
    budget.updatedAt = Date.now();
    
    const updatedBudget = await budget.save();
    res.json(updatedBudget);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const budget = await Budget.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    await budget.remove();
    
    res.json({ message: 'Budget removed' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/budgets/:id/progress
// @desc    Get budget progress
// @access  Private
router.get('/:id/progress', authenticateJWT, async (req, res) => {
  try {
    const budget = await Budget.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    // Determine date range based on budget period
    let startDate, endDate;
    const now = new Date();
    
    switch (budget.period) {
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'weekly':
        const day = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      default:
        startDate = budget.startDate;
        endDate = budget.endDate || now;
    }
    
    // Get expenses for the period
    let expenses = 0;
    
    if (budget.categories && budget.categories.length > 0) {
      // If budget has specific categories, only count those
      const categoryIds = budget.categories.map(cat => cat.categoryId);
      
      const expenseResult = await Transaction.aggregate([
        { 
          $match: { 
            userId: mongoose.Types.ObjectId(req.user.id),
            type: 'expense',
            date: { $gte: startDate, $lte: endDate },
            category: { $in: categoryIds }
          } 
        },
        { 
          $group: { 
            _id: '$category', 
            total: { $sum: '$amount' } 
          } 
        }
      ]);
      
      // Calculate total expenses
      expenses = expenseResult.reduce((sum, item) => sum + item.total, 0);
      
      // Calculate progress for each category
      const categoryProgress = budget.categories.map(budgetCategory => {
        const categoryExpense = expenseResult.find(
          item => item._id.toString() === budgetCategory.categoryId.toString()
        );
        
        const spent = categoryExpense ? categoryExpense.total : 0;
        const percentage = (spent / budgetCategory.amount) * 100;
        
        return {
          categoryId: budgetCategory.categoryId,
          budgeted: budgetCategory.amount,
          spent,
          remaining: budgetCategory.amount - spent,
          percentage: Math.min(percentage, 100)
        };
      });
      
      // Calculate overall progress
      const totalBudgeted = budget.categories.reduce((sum, cat) => sum + cat.amount, 0);
      const percentage = (expenses / totalBudgeted) * 100;
      
      res.json({
        budgetId: budget._id,
        name: budget.name,
        period: budget.period,
        startDate,
        endDate,
        totalBudgeted,
        spent: expenses,
        remaining: totalBudgeted - expenses,
        percentage: Math.min(percentage, 100),
        categoryProgress
      });
    } else {
      // If budget doesn't have specific categories, count all expenses
      const expenseResult = await Transaction.aggregate([
        { 
          $match: { 
            userId: mongoose.Types.ObjectId(req.user.id),
            type: 'expense',
            date: { $gte: startDate, $lte: endDate }
          } 
        },
        { 
          $group: { 
            _id: null, 
            total: { $sum: '$amount' } 
          } 
        }
      ]);
      
      expenses = expenseResult.length > 0 ? expenseResult[0].total : 0;
      const percentage = (expenses / budget.amount) * 100;
      
      res.json({
        budgetId: budget._id,
        name: budget.name,
        period: budget.period,
        startDate,
        endDate,
        totalBudgeted: budget.amount,
        spent: expenses,
        remaining: budget.amount - expenses,
        percentage: Math.min(percentage, 100)
      });
    }
  } catch (error) {
    console.error('Error getting budget progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
