const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const Report = require('../models/Report');

// @route   GET /api/reports
// @desc    Get all reports for a user
// @access  Private
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id });
    res.json(reports);
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/reports
// @desc    Create a new report
// @access  Private
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { 
      name, 
      type, 
      period, 
      startDate, 
      endDate, 
      filters,
      isFavorite
    } = req.body;
    
    // Create new report
    const newReport = new Report({
      userId: req.user.id,
      name,
      type,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      filters: filters || {},
      isFavorite: isFavorite || false,
      lastGenerated: new Date(),
      data: {}
    });
    
    // Generate report data
    const reportData = await generateReportData(
      req.user.id,
      type,
      new Date(startDate),
      new Date(endDate),
      filters
    );
    
    newReport.data = reportData;
    
    const report = await newReport.save();
    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reports/:id
// @desc    Get a report by ID
// @access  Private
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const report = await Report.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/reports/:id
// @desc    Update a report
// @access  Private
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { 
      name, 
      type, 
      period, 
      startDate, 
      endDate, 
      filters,
      isFavorite
    } = req.body;
    
    const report = await Report.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Update fields
    if (name) report.name = name;
    if (type) report.type = type;
    if (period) report.period = period;
    if (startDate) report.startDate = new Date(startDate);
    if (endDate) report.endDate = new Date(endDate);
    if (filters) report.filters = filters;
    if (isFavorite !== undefined) report.isFavorite = isFavorite;
    
    // Regenerate report data if parameters changed
    if (type || startDate || endDate || filters) {
      const reportData = await generateReportData(
        req.user.id,
        type || report.type,
        startDate ? new Date(startDate) : report.startDate,
        endDate ? new Date(endDate) : report.endDate,
        filters || report.filters
      );
      
      report.data = reportData;
      report.lastGenerated = new Date();
    }
    
    const updatedReport = await report.save();
    res.json(updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete a report
// @access  Private
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const report = await Report.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    await report.remove();
    
    res.json({ message: 'Report removed' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/reports/:id/regenerate
// @desc    Regenerate report data
// @access  Private
router.post('/:id/regenerate', authenticateJWT, async (req, res) => {
  try {
    const report = await Report.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Regenerate report data
    const reportData = await generateReportData(
      req.user.id,
      report.type,
      report.startDate,
      report.endDate,
      report.filters
    );
    
    report.data = reportData;
    report.lastGenerated = new Date();
    
    const updatedReport = await report.save();
    res.json(updatedReport);
  } catch (error) {
    console.error('Error regenerating report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reports/generate/:type
// @desc    Generate a report without saving
// @access  Private
router.get('/generate/:type', authenticateJWT, async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, filters } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    // Generate report data
    const reportData = await generateReportData(
      req.user.id,
      type,
      new Date(startDate),
      new Date(endDate),
      filters ? JSON.parse(filters) : {}
    );
    
    res.json({
      type,
      startDate,
      endDate,
      filters: filters ? JSON.parse(filters) : {},
      generatedAt: new Date(),
      data: reportData
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to generate report data
async function generateReportData(userId, type, startDate, endDate, filters) {
  try {
    switch (type) {
      case 'income':
        return await generateIncomeReport(userId, startDate, endDate, filters);
      case 'expense':
        return await generateExpenseReport(userId, startDate, endDate, filters);
      case 'netWorth':
        return await generateNetWorthReport(userId, startDate, endDate, filters);
      case 'cashFlow':
        return await generateCashFlowReport(userId, startDate, endDate, filters);
      case 'budget':
        return await generateBudgetReport(userId, startDate, endDate, filters);
      case 'category':
        return await generateCategoryReport(userId, startDate, endDate, filters);
      case 'goal':
        return await generateGoalReport(userId, startDate, endDate, filters);
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  } catch (error) {
    console.error(`Error generating ${type} report:`, error);
    throw error;
  }
}

// Income Report
async function generateIncomeReport(userId, startDate, endDate, filters) {
  // Get income transactions
  const transactions = await Transaction.find({
    userId: mongoose.Types.ObjectId(userId),
    type: 'income',
    date: { $gte: startDate, $lte: endDate },
    ...(filters.accountId ? { accountId: filters.accountId } : {})
  }).sort('date');
  
  // Group by category
  const categoryGroups = {};
  let totalIncome = 0;
  
  transactions.forEach(transaction => {
    const category = transaction.category || 'Uncategorized';
    
    if (!categoryGroups[category]) {
      categoryGroups[category] = {
        total: 0,
        transactions: []
      };
    }
    
    categoryGroups[category].total += transaction.amount;
    categoryGroups[category].transactions.push({
      id: transaction._id,
      date: transaction.date,
      amount: transaction.amount,
      description: transaction.description,
      merchant: transaction.merchant
    });
    
    totalIncome += transaction.amount;
  });
  
  // Convert to array and sort by total
  const categories = Object.keys(categoryGroups).map(category => ({
    category,
    total: categoryGroups[category].total,
    percentage: (categoryGroups[category].total / totalIncome) * 100,
    transactions: categoryGroups[category].transactions
  })).sort((a, b) => b.total - a.total);
  
  // Group by month
  const monthlyData = {};
  
  transactions.forEach(transaction => {
    const month = new Date(transaction.date).toISOString().substring(0, 7); // YYYY-MM
    
    if (!monthlyData[month]) {
      monthlyData[month] = 0;
    }
    
    monthlyData[month] += transaction.amount;
  });
  
  // Convert to array and sort by month
  const monthly = Object.keys(monthlyData).map(month => ({
    month,
    total: monthlyData[month]
  })).sort((a, b) => a.month.localeCompare(b.month));
  
  return {
    totalIncome,
    categories,
    monthly,
    transactionCount: transactions.length
  };
}

// Expense Report
async function generateExpenseReport(userId, startDate, endDate, filters) {
  // Get expense transactions
  const transactions = await Transaction.find({
    userId: mongoose.Types.ObjectId(userId),
    type: 'expense',
    date: { $gte: startDate, $lte: endDate },
    ...(filters.accountId ? { accountId: filters.accountId } : {})
  }).sort('date');
  
  // Group by category
  const categoryGroups = {};
  let totalExpenses = 0;
  
  transactions.forEach(transaction => {
    const category = transaction.category || 'Uncategorized';
    
    if (!categoryGroups[category]) {
      categoryGroups[category] = {
        total: 0,
        transactions: []
      };
    }
    
    categoryGroups[category].total += Math.abs(transaction.amount);
    categoryGroups[category].transactions.push({
      id: transaction._id,
      date: transaction.date,
      amount: Math.abs(transaction.amount),
      description: transaction.description,
      merchant: transaction.merchant
    });
    
    totalExpenses += Math.abs(transaction.amount);
  });
  
  // Convert to array and sort by total
  const categories = Object.keys(categoryGroups).map(category => ({
    category,
    total: categoryGroups[category].total,
    percentage: (categoryGroups[category].total / totalExpenses) * 100,
    transactions: categoryGroups[category].transactions
  })).sort((a, b) => b.total - a.total);
  
  // Group by month
  const monthlyData = {};
  
  transactions.forEach(transaction => {
    const month = new Date(transaction.date).toISOString().substring(0, 7); // YYYY-MM
    
    if (!monthlyData[month]) {
      monthlyData[month] = 0;
    }
    
    monthlyData[month] += Math.abs(transaction.amount);
  });
  
  // Convert to array and sort by month
  const monthly = Object.keys(monthlyData).map(month => ({
    month,
    total: monthlyData[month]
  })).sort((a, b) => a.month.localeCompare(b.month));
  
  return {
    totalExpenses,
    categories,
    monthly,
    transactionCount: transactions.length
  };
}

// Net Worth Report
async function generateNetWorthReport(userId, startDate, endDate, filters) {
  // Get current accounts
  const accounts = await Account.find({
    userId: mongoose.Types.ObjectId(userId),
    isActive: true
  });
  
  // Calculate current net worth
  let assets = 0;
  let liabilities = 0;
  
  const accountData = accounts.map(account => {
    const isAsset = ['bank', 'investment', 'cash'].includes(account.type);
    const isLiability = ['credit', 'loan'].includes(account.type);
    
    if (isAsset) {
      assets += account.balance;
    } else if (isLiability) {
      liabilities += Math.abs(account.balance);
    }
    
    return {
      id: account._id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      isAsset,
      isLiability
    };
  });
  
  const netWorth = assets - liabilities;
  
  // Calculate historical net worth
  // This would require transaction history to calculate balances at different points in time
  // For simplicity, we'll just return the current values
  
  return {
    netWorth,
    assets,
    liabilities,
    accounts: accountData,
    // This would be populated with historical data in a real implementation
    history: []
  };
}

// Cash Flow Report
async function generateCashFlowReport(userId, startDate, endDate, filters) {
  // Get income and expense transactions
  const transactions = await Transaction.find({
    userId: mongoose.Types.ObjectId(userId),
    date: { $gte: startDate, $lte: endDate },
    ...(filters.accountId ? { accountId: filters.accountId } : {})
  }).sort('date');
  
  // Group by month and type
  const monthlyData = {};
  
  transactions.forEach(transaction => {
    const month = new Date(transaction.date).toISOString().substring(0, 7); // YYYY-MM
    
    if (!monthlyData[month]) {
      monthlyData[month] = {
        income: 0,
        expenses: 0,
        cashFlow: 0
      };
    }
    
    if (transaction.type === 'income') {
      monthlyData[month].income += transaction.amount;
    } else if (transaction.type === 'expense') {
      monthlyData[month].expenses += Math.abs(transaction.amount);
    }
    
    monthlyData[month].cashFlow = monthlyData[month].income - monthlyData[month].expenses;
  });
  
  // Convert to array and sort by month
  const monthly = Object.keys(monthlyData).map(month => ({
    month,
    income: monthlyData[month].income,
    expenses: monthlyData[month].expenses,
    cashFlow: monthlyData[month].cashFlow
  })).sort((a, b) => a.month.localeCompare(b.month));
  
  // Calculate totals
  const totalIncome = monthly.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = monthly.reduce((sum, item) => sum + item.expenses, 0);
  const totalCashFlow = totalIncome - totalExpenses;
  
  return {
    totalIncome,
    totalExpenses,
    totalCashFlow,
    monthly,
    transactionCount: transactions.length
  };
}

// Budget Report
async function generateBudgetReport(userId, startDate, endDate, filters) {
  // Get budgets
  const budgets = await Budget.find({
    userId: mongoose.Types.ObjectId(userId),
    isActive: true,
    ...(filters.budgetId ? { _id: filters.budgetId } : {})
  });
  
  // Get expenses for the period
  const expenses = await Transaction.find({
    userId: mongoose.Types.ObjectId(userId),
    type: 'expense',
    date: { $gte: startDate, $lte: endDate }
  });
  
  // Calculate budget progress
  const budgetData = await Promise.all(budgets.map(async budget => {
    // Determine if budget applies to this period
    const budgetStartDate = new Date(Math.max(budget.startDate, startDate));
    const budgetEndDate = budget.endDate ? new Date(Math.min(budget.endDate, endDate)) : new Date(endDate);
    
    // Skip if budget doesn't apply to this period
    if (budgetStartDate > budgetEndDate) {
      return null;
    }
    
    let totalSpent = 0;
    let categoryProgress = [];
    
    if (budget.categories && budget.categories.length > 0) {
      // If budget has specific categories, calculate progress for each
      categoryProgress = await Promise.all(budget.categories.map(async budgetCategory => {
        const categoryExpenses = expenses.filter(expense => 
          expense.category === budgetCategory.categoryId.toString()
        );
        
        const spent = categoryExpenses.reduce((sum, expense) => sum + Math.abs(expense.amount), 0);
        totalSpent += spent;
        
        return {
          categoryId: budgetCategory.categoryId,
          budgeted: budgetCategory.amount,
          spent,
          remaining: budgetCategory.amount - spent,
          percentage: (spent / budgetCategory.amount) * 100
        };
      }));
      
      // Calculate total budgeted
      const totalBudgeted = budget.categories.reduce((sum, cat) => sum + cat.amount, 0);
      
      return {
        id: budget._id,
        name: budget.name,
        period: budget.period,
        totalBudgeted,
        totalSpent,
        remaining: totalBudgeted - totalSpent,
        percentage: (totalSpent / totalBudgeted) * 100,
        categoryProgress
      };
    } else {
      // If budget doesn't have specific categories, use total amount
      totalSpent = expenses.reduce((sum, expense) => sum + Math.abs(expense.amount), 0);
      
      return {
        id: budget._id,
        name: budget.name,
        period: budget.period,
        totalBudgeted: budget.amount,
        totalSpent,
        remaining: budget.amount - totalSpent,
        percentage: (totalSpent / budget.amount) * 100
      };
    }
  }));
  
  // Filter out null values (budgets that don't apply to this period)
  const filteredBudgetData = budgetData.filter(budget => budget !== null);
  
  return {
    budgets: filteredBudgetData,
    totalBudgeted: filteredBudgetData.reduce((sum, budget) => sum + budget.totalBudgeted, 0),
    totalSpent: filteredBudgetData.reduce((sum, budget) => sum + budget.totalSpent, 0)
  };
}

// Category Report
async function generateCategoryReport(userId, startDate, endDate, filters) {
  // Get transactions for the period
  const transactions = await Transaction.find({
    userId: mongoose.Types.ObjectId(userId),
    date: { $gte: startDate, $lte: endDate },
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.accountId ? { accountId: filters.accountId } : {})
  }).sort('date');
  
  // Group by category and type
  const categoryData = {};
  
  transactions.forEach(transaction => {
    const category = transaction.category || 'Uncategorized';
    const type = transaction.type;
    
    if (!categoryData[category]) {
      categoryData[category] = {
        income: 0,
        expenses: 0,
        net: 0,
        transactions: []
      };
    }
    
    if (type === 'income') {
      categoryData[category].income += transaction.amount;
    } else if (type === 'expense') {
      categoryData[category].expenses += Math.abs(transaction.amount);
    }
    
    categoryData[category].net = categoryData[category].income - categoryData[category].expenses;
    
    categoryData[category].transactions.push({
      id: transaction._id,
      date: transaction.date,
      amount: type === 'expense' ? -Math.abs(transaction.amount) : transaction.amount,
      type,
      description: transaction.description,
      merchant: transaction.merchant
    });
  });
  
  // Convert to array and sort by total
  const categories = Object.keys(categoryData).map(category => ({
    category,
    income: categoryData[category].income,
    expenses: categoryData[category].expenses,
    net: categoryData[category].net,
    transactions: categoryData[category].transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
  })).sort((a, b) => b.expenses - a.expenses);
  
  // Calculate totals
  const totalIncome = categories.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = categories.reduce((sum, item) => sum + item.expenses, 0);
  const totalNet = totalIncome - totalExpenses;
  
  return {
    totalIncome,
    totalExpenses,
    totalNet,
    categories,
    transactionCount: transactions.length
  };
}

// Goal Report
async function generateGoalReport(userId, startDate, endDate, filters) {
  // Get goals
  const goals = await Goal.find({
    userId: mongoose.Types.ObjectId(userId),
    ...(filters.goalId ? { _id: filters.goalId } : {})
  });
  
  // Calculate goal progress
  const goalData = goals.map(goal => {
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
    const monthlyContributionNeeded = goal.isCompleted ? 0 : remaining / monthsRemaining;
    
    return {
      id: goal._id,
      name: goal.name,
      category: goal.category,
      priority: goal.priority,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remaining,
      percentage: Math.min(percentage, 100),
      startDate: goal.startDate,
      targetDate: goal.targetDate,
      timePercentage,
      isOnTrack,
      isCompleted: goal.isCompleted,
      monthlyContributionNeeded
    };
  });
  
  // Sort by priority and completion status
  goalData.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  // Calculate totals
  const totalTargetAmount = goalData.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = goalData.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalRemaining = totalTargetAmount - totalCurrentAmount;
  const overallPercentage = (totalCurrentAmount / totalTargetAmount) * 100;
  
  return {
    totalTargetAmount,
    totalCurrentAmount,
    totalRemaining,
    overallPercentage,
    goals: goalData,
    completedGoals: goalData.filter(goal => goal.isCompleted).length,
    totalGoals: goalData.length
  };
}

module.exports = router;
