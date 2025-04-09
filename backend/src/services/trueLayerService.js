const axios = require('axios');
const qs = require('querystring');
const Connection = require('../models/Connection');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

class TrueLayerService {
  constructor() {
    this.clientId = process.env.TRUELAYER_CLIENT_ID;
    this.clientSecret = process.env.TRUELAYER_CLIENT_SECRET;
    this.redirectUri = process.env.TRUELAYER_REDIRECT_URI;
    this.baseUrl = 'https://auth.truelayer.com';
    this.apiUrl = 'https://api.truelayer.com';
  }

  /**
   * Generate the authorization URL for TrueLayer
   * @param {string} userId - The user ID
   * @returns {string} - The authorization URL
   */
  getAuthorizationUrl(userId) {
    const scope = 'info accounts balance transactions';
    const responseType = 'code';
    const state = userId; // Using userId as state to identify the user after redirect

    const queryParams = qs.stringify({
      response_type: responseType,
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope,
      state
    });

    return `${this.baseUrl}/authorize?${queryParams}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - The authorization code
   * @returns {Promise<Object>} - The token response
   */
  async getAccessToken(code) {
    try {
      const response = await axios.post(`${this.baseUrl}/connect/token`, qs.stringify({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting access token:', error.response?.data || error.message);
      throw new Error('Failed to get access token from TrueLayer');
    }
  }

  /**
   * Refresh the access token
   * @param {string} refreshToken - The refresh token
   * @returns {Promise<Object>} - The token response
   */
  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post(`${this.baseUrl}/connect/token`, qs.stringify({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error refreshing access token:', error.response?.data || error.message);
      throw new Error('Failed to refresh access token from TrueLayer');
    }
  }

  /**
   * Get user information
   * @param {string} accessToken - The access token
   * @returns {Promise<Object>} - The user info
   */
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(`${this.apiUrl}/data/v1/info`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return response.data.results[0];
    } catch (error) {
      console.error('Error getting user info:', error.response?.data || error.message);
      throw new Error('Failed to get user info from TrueLayer');
    }
  }

  /**
   * Get accounts for a user
   * @param {string} accessToken - The access token
   * @returns {Promise<Array>} - The accounts
   */
  async getAccounts(accessToken) {
    try {
      const response = await axios.get(`${this.apiUrl}/data/v1/accounts`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return response.data.results;
    } catch (error) {
      console.error('Error getting accounts:', error.response?.data || error.message);
      throw new Error('Failed to get accounts from TrueLayer');
    }
  }

  /**
   * Get account balance
   * @param {string} accessToken - The access token
   * @param {string} accountId - The account ID
   * @returns {Promise<Object>} - The account balance
   */
  async getAccountBalance(accessToken, accountId) {
    try {
      const response = await axios.get(`${this.apiUrl}/data/v1/accounts/${accountId}/balance`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return response.data.results[0];
    } catch (error) {
      console.error('Error getting account balance:', error.response?.data || error.message);
      throw new Error('Failed to get account balance from TrueLayer');
    }
  }

  /**
   * Get transactions for an account
   * @param {string} accessToken - The access token
   * @param {string} accountId - The account ID
   * @param {string} from - Start date (YYYY-MM-DD)
   * @param {string} to - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} - The transactions
   */
  async getTransactions(accessToken, accountId, from, to) {
    try {
      const response = await axios.get(`${this.apiUrl}/data/v1/accounts/${accountId}/transactions`, {
        params: { from, to },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return response.data.results;
    } catch (error) {
      console.error('Error getting transactions:', error.response?.data || error.message);
      throw new Error('Failed to get transactions from TrueLayer');
    }
  }

  /**
   * Save connection to database
   * @param {string} userId - The user ID
   * @param {Object} tokenData - The token data
   * @param {Object} institutionData - The institution data
   * @returns {Promise<Object>} - The saved connection
   */
  async saveConnection(userId, tokenData, institutionData) {
    try {
      // Check if connection already exists
      let connection = await Connection.findOne({ 
        userId, 
        provider: 'truelayer',
        institutionId: institutionData.provider.provider_id
      });

      if (connection) {
        // Update existing connection
        connection.accessToken = tokenData.access_token;
        connection.refreshToken = tokenData.refresh_token;
        connection.expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
        connection.status = 'active';
        connection.lastSynced = new Date();
        connection.metadata = institutionData;
      } else {
        // Create new connection
        connection = new Connection({
          userId,
          provider: 'truelayer',
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          institutionId: institutionData.provider.provider_id,
          institutionName: institutionData.provider.display_name,
          status: 'active',
          lastSynced: new Date(),
          consentId: tokenData.consent_id || null,
          metadata: institutionData
        });
      }

      await connection.save();
      return connection;
    } catch (error) {
      console.error('Error saving connection:', error);
      throw new Error('Failed to save connection to database');
    }
  }

  /**
   * Sync accounts for a connection
   * @param {string} userId - The user ID
   * @param {Object} connection - The connection object
   * @returns {Promise<Array>} - The synced accounts
   */
  async syncAccounts(userId, connection) {
    try {
      // Get accounts from TrueLayer
      const accounts = await this.getAccounts(connection.accessToken);
      const syncedAccounts = [];

      // Process each account
      for (const accountData of accounts) {
        // Get balance for the account
        const balance = await this.getAccountBalance(connection.accessToken, accountData.account_id);

        // Check if account already exists
        let account = await Account.findOne({ 
          userId, 
          connectionId: connection._id,
          'metadata.externalId': accountData.account_id
        });

        if (account) {
          // Update existing account
          account.balance = balance.current;
          account.lastSynced = new Date();
        } else {
          // Create new account
          account = new Account({
            userId,
            name: accountData.display_name,
            type: this.mapAccountType(accountData.account_type),
            institution: connection.institutionName,
            balance: balance.current,
            currency: accountData.currency,
            isActive: true,
            lastSynced: new Date(),
            accountNumber: accountData.account_number?.last_4_digits ? `****${accountData.account_number.last_4_digits}` : null,
            connectionId: connection._id,
            metadata: {
              externalId: accountData.account_id,
              color: '#1976d2',
              icon: 'account_balance',
              order: 0
            }
          });
        }

        await account.save();
        syncedAccounts.push(account);
      }

      // Update connection last synced date
      connection.lastSynced = new Date();
      await connection.save();

      return syncedAccounts;
    } catch (error) {
      console.error('Error syncing accounts:', error);
      throw new Error('Failed to sync accounts from TrueLayer');
    }
  }

  /**
   * Sync transactions for an account
   * @param {string} userId - The user ID
   * @param {Object} account - The account object
   * @param {Object} connection - The connection object
   * @param {string} from - Start date (YYYY-MM-DD)
   * @param {string} to - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} - The synced transactions
   */
  async syncTransactions(userId, account, connection, from, to) {
    try {
      // Get transactions from TrueLayer
      const transactions = await this.getTransactions(
        connection.accessToken, 
        account.metadata.externalId, 
        from, 
        to
      );

      const syncedTransactions = [];

      // Process each transaction
      for (const transactionData of transactions) {
        // Check if transaction already exists
        let transaction = await Transaction.findOne({ 
          userId, 
          accountId: account._id,
          externalId: transactionData.transaction_id
        });

        if (!transaction) {
          // Create new transaction
          transaction = new Transaction({
            userId,
            accountId: account._id,
            date: new Date(transactionData.timestamp),
            amount: transactionData.amount,
            type: transactionData.amount < 0 ? 'expense' : 'income',
            category: this.mapTransactionCategory(transactionData.transaction_category),
            description: transactionData.description,
            merchant: transactionData.merchant_name || null,
            isRecurring: false, // This would need more logic to determine
            tags: [],
            externalId: transactionData.transaction_id,
            location: transactionData.merchant_location ? {
              address: transactionData.merchant_location.address
            } : null
          });

          await transaction.save();
          syncedTransactions.push(transaction);
        }
      }

      return syncedTransactions;
    } catch (error) {
      console.error('Error syncing transactions:', error);
      throw new Error('Failed to sync transactions from TrueLayer');
    }
  }

  /**
   * Map TrueLayer account type to internal account type
   * @param {string} trueLayerType - The TrueLayer account type
   * @returns {string} - The internal account type
   */
  mapAccountType(trueLayerType) {
    const typeMap = {
      'TRANSACTION': 'bank',
      'SAVINGS': 'bank',
      'CREDIT_CARD': 'credit',
      'LOAN': 'loan',
      'MORTGAGE': 'loan',
      'INVESTMENT': 'investment',
      'PENSION': 'investment'
    };

    return typeMap[trueLayerType] || 'other';
  }

  /**
   * Map TrueLayer transaction category to internal category
   * @param {string} trueLayerCategory - The TrueLayer transaction category
   * @returns {string} - The internal category
   */
  mapTransactionCategory(trueLayerCategory) {
    const categoryMap = {
      'BILLS_AND_SERVICES': 'Bills',
      'ENTERTAINMENT': 'Entertainment',
      'EXPENSES': 'Miscellaneous',
      'FAMILY': 'Family',
      'FOOD_AND_DRINK': 'Food & Dining',
      'GENERAL': 'Miscellaneous',
      'INCOME': 'Income',
      'PAYMENTS': 'Transfers',
      'SAVINGS_AND_INVESTMENTS': 'Investments',
      'SHOPPING': 'Shopping',
      'TRANSPORT': 'Transportation',
      'TRAVEL': 'Travel'
    };

    return categoryMap[trueLayerCategory] || 'Uncategorized';
  }
}

module.exports = new TrueLayerService();
