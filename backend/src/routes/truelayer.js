const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');
const Connection = require('../models/Connection');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const trueLayerService = require('../services/trueLayerService');

// @route   GET /api/truelayer/auth-url
// @desc    Get TrueLayer authorization URL
// @access  Private
router.get('/auth-url', authenticateJWT, (req, res) => {
  try {
    const authUrl = trueLayerService.getAuthorizationUrl(req.user.id);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/truelayer/callback
// @desc    Handle TrueLayer callback
// @access  Private
router.post('/callback', authenticateJWT, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }
    
    // Exchange code for token
    const tokenData = await trueLayerService.getAccessToken(code);
    
    // Get user info from TrueLayer
    const userInfo = await trueLayerService.getUserInfo(tokenData.access_token);
    
    // Save connection to database
    const connection = await trueLayerService.saveConnection(req.user.id, tokenData, userInfo);
    
    // Sync accounts
    const accounts = await trueLayerService.syncAccounts(req.user.id, connection);
    
    // Sync transactions for each account
    const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 90 days ago
    const to = new Date().toISOString().split('T')[0]; // Today
    
    const transactionPromises = accounts.map(account => 
      trueLayerService.syncTransactions(req.user.id, account, connection, from, to)
    );
    
    const transactions = await Promise.all(transactionPromises);
    
    res.json({ 
      connection,
      accounts,
      transactionsCount: transactions.flat().length,
      message: 'Bank connection successful'
    });
  } catch (error) {
    console.error('Error handling callback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/truelayer/connections
// @desc    Get all TrueLayer connections for a user
// @access  Private
router.get('/connections', authenticateJWT, async (req, res) => {
  try {
    const connections = await Connection.find({ 
      userId: req.user.id,
      provider: 'truelayer'
    });
    res.json(connections);
  } catch (error) {
    console.error('Error getting connections:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/truelayer/sync/:connectionId
// @desc    Sync accounts and transactions for a connection
// @access  Private
router.post('/sync/:connectionId', authenticateJWT, async (req, res) => {
  try {
    const connection = await Connection.findOne({ 
      _id: req.params.connectionId,
      userId: req.user.id,
      provider: 'truelayer'
    });
    
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }
    
    // Check if token is expired
    if (new Date(connection.expiresAt) < new Date()) {
      // Refresh token
      const tokenData = await trueLayerService.refreshAccessToken(connection.refreshToken);
      
      // Update connection
      connection.accessToken = tokenData.access_token;
      connection.refreshToken = tokenData.refresh_token;
      connection.expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      await connection.save();
    }
    
    // Sync accounts
    const accounts = await trueLayerService.syncAccounts(req.user.id, connection);
    
    // Sync transactions for each account
    const from = req.body.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
    const to = req.body.to || new Date().toISOString().split('T')[0]; // Today
    
    const transactionPromises = accounts.map(account => 
      trueLayerService.syncTransactions(req.user.id, account, connection, from, to)
    );
    
    const transactions = await Promise.all(transactionPromises);
    
    res.json({
      accounts,
      transactionsCount: transactions.flat().length,
      message: 'Sync completed successfully'
    });
  } catch (error) {
    console.error('Error syncing connection:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/truelayer/connections/:connectionId
// @desc    Delete a TrueLayer connection
// @access  Private
router.delete('/connections/:connectionId', authenticateJWT, async (req, res) => {
  try {
    const connection = await Connection.findOne({ 
      _id: req.params.connectionId,
      userId: req.user.id,
      provider: 'truelayer'
    });
    
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }
    
    // Get accounts associated with this connection
    const accounts = await Account.find({
      connectionId: connection._id,
      userId: req.user.id
    });
    
    // Delete transactions for these accounts
    for (const account of accounts) {
      await Transaction.deleteMany({
        accountId: account._id,
        userId: req.user.id
      });
    }
    
    // Delete accounts
    await Account.deleteMany({
      connectionId: connection._id,
      userId: req.user.id
    });
    
    // Delete connection
    await connection.deleteOne();
    
    res.json({ message: 'Connection and associated data removed successfully' });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
