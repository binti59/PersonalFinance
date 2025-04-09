const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const Goal = require('../models/Goal');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// @route   GET /api/goals
// @desc    Get all goals for a user
// @access  Private
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id });
    res.json(goals);
  } catch (error) {
    console.error('Error getting goals:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/goals
// @desc    Create a new goal
// @access  Private
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { 
      name, 
      targetAmount, 
      currentAmount, 
      startDate, 
      targetDate, 
      category,
      priority,
      accounts,
      notes,
      icon
    } = req.body;
    
    // Validate accounts if provided
    if (accounts && accounts.length > 0) {
      for (const accountId of accounts) {
        const account = await Account.findOne({ 
          _id: accountId,
          userId: req.user.id
        });
        
        if (!account) {
          return res.status(400).json({ message: `Account ${accountId} not found` });
        }
      }
    }
    
    // Create new goal
    const newGoal = new Goal({
      userId: req.user.id,
      name,
      targetAmount,
      currentAmount: currentAmount || 0,
      startDate: new Date(startDate || Date.now()),
      targetDate: new Date(targetDate),
      category,
      priority: priority || 'medium',
      accounts: accounts || [],
      notes,
      icon: icon || 'flag',
      isCompleted: false
    });
    
    const goal = await newGoal.save();
    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/goals/:id
// @desc    Get a goal by ID
// @access  Private
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const goal = await Goal.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.json(goal);
  } catch (error) {
    console.error('Error getting goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update a goal
// @access  Private
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { 
      name, 
      targetAmount, 
      currentAmount, 
      startDate, 
      targetDate, 
      category,
      priority,
      accounts,
      notes,
      icon,
      isCompleted
    } = req.body;
    
    const goal = await Goal.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Validate accounts if provided
    if (accounts && accounts.length > 0) {
      for (const accountId of accounts) {
        const account = await Account.findOne({ 
          _id: accountId,
          userId: req.user.id
        });
        
        if (!account) {
          return res.status(400).json({ message: `Account ${accountId} not found` });
        }
      }
    }
    
    // Update fields
    if (name) goal.name = name;
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (currentAmount !== undefined) goal.currentAmount = currentAmount;
    if (startDate) goal.startDate = new Date(startDate);
    if (targetDate) goal.targetDate = new Date(targetDate);
    if (category) goal.category = category;
    if (priority) goal.priority = priority;
    if (accounts) goal.accounts = accounts;
    if (notes !== undefined) goal.notes = notes;
    if (icon) goal.icon = icon;
    if (isCompleted !== undefined) goal.isCompleted = isCompleted;
    
    goal.updatedAt = Date.now();
    
    // Check if goal is completed based on current amount
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    }
    
    const updatedGoal = await goal.save();
    res.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const goal = await Goal.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    await goal.remove();
    
    res.json({ message: 'Goal removed' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/goals/:id/contribute
// @desc    Contribute to a goal
// @access  Private
router.post('/:id/contribute', authenticateJWT, async (req, res) => {
  try {
    const { amount, accountId, date, notes } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid contribution amount is required' });
    }
    
    const goal = await Goal.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Verify account if provided
    let account;
    if (accountId) {
      account = await Account.findOne({ 
        _id: accountId,
        userId: req.user.id
      });
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }
    }
    
    // Update goal current amount
    goal.currentAmount += amount;
    
    // Check if goal is completed
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    }
    
    goal.updatedAt = Date.now();
    await goal.save();
    
    // Create transaction record if account is provided
    if (account) {
      const transaction = new Transaction({
        userId: req.user.id,
        accountId,
        date: new Date(date || Date.now()),
        amount: -amount, // Negative amount for expense
        type: 'expense',
        category: 'Savings',
        subcategory: goal.category,
        description: `Contribution to ${goal.name}`,
        notes: notes || `Goal contribution: ${goal.name}`,
        tags: ['Goal Contribution', goal.name]
      });
      
      await transaction.save();
      
      // Update account balance
      account.balance -= amount;
      account.updatedAt = Date.now();
      await account.save();
    }
    
    res.json({
      goal,
      message: 'Contribution added successfully'
    });
  } catch (error) {
    console.error('Error contributing to goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/goals/:id/progress
// @desc    Get goal progress
// @access  Private
router.get('/:id/progress', authenticateJWT, async (req, res) => {
  try {
    const goal = await Goal.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Calculate progress
    const percentage = (goal.currentAmount / goal.targetAmount) * 100;
    const remaining = goal.targetAmount - goal.currentAmount;
    
    // Calculate time progress
    const now = new Date();
    const totalDuration = goal.targetDate - goal.startDate;
    const elapsedDuration = now - goal.startDate;
    const timePercentage = Math.min((elapsedDuration / totalDuration) * 100, 100);
    
    // Calculate if on track
    const isOnTrack = percentage >= timePercentage;
    
    // Calculate monthly contribution needed
    const monthsRemaining = Math.max(
      (goal.targetDate - now) / (1000 * 60 * 60 * 24 * 30.5),
      1
    );
    const monthlyContributionNeeded = remaining / monthsRemaining;
    
    res.json({
      goalId: goal._id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remaining,
      percentage: Math.min(percentage, 100),
      startDate: goal.startDate,
      targetDate: goal.targetDate,
      timePercentage,
      isOnTrack,
      isCompleted: goal.isCompleted,
      monthlyContributionNeeded: goal.isCompleted ? 0 : monthlyContributionNeeded
    });
  } catch (error) {
    console.error('Error getting goal progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
