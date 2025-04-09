import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { accountsAPI } from '../../services/api';

// Fetch all accounts
export const fetchAccounts = createAsyncThunk(
  'accounts/fetchAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await accountsAPI.getAccounts();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch accounts');
    }
  }
);

// Fetch single account
export const fetchAccount = createAsyncThunk(
  'accounts/fetchAccount',
  async (id, { rejectWithValue }) => {
    try {
      const response = await accountsAPI.getAccount(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch account');
    }
  }
);

// Create new account
export const createAccount = createAsyncThunk(
  'accounts/createAccount',
  async (accountData, { rejectWithValue }) => {
    try {
      const response = await accountsAPI.createAccount(accountData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create account');
    }
  }
);

// Update account
export const updateAccount = createAsyncThunk(
  'accounts/updateAccount',
  async ({ id, accountData }, { rejectWithValue }) => {
    try {
      const response = await accountsAPI.updateAccount(id, accountData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update account');
    }
  }
);

// Delete account
export const deleteAccount = createAsyncThunk(
  'accounts/deleteAccount',
  async (id, { rejectWithValue }) => {
    try {
      await accountsAPI.deleteAccount(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete account');
    }
  }
);

// Sync account
export const syncAccount = createAsyncThunk(
  'accounts/syncAccount',
  async (id, { rejectWithValue }) => {
    try {
      const response = await accountsAPI.syncAccount(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to sync account');
    }
  }
);

// Connect bank account via TrueLayer
export const connectBank = createAsyncThunk(
  'accounts/connectBank',
  async (code, { rejectWithValue }) => {
    try {
      const response = await accountsAPI.connectBank(code);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to connect bank account');
    }
  }
);

const initialState = {
  accounts: [],
  account: null,
  netWorth: {
    total: 0,
    assets: 0,
    liabilities: 0
  },
  isLoading: false,
  error: null,
  message: null
};

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
    clearAccount: (state) => {
      state.account = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Accounts
      .addCase(fetchAccounts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload;
        
        // Calculate net worth
        let assets = 0;
        let liabilities = 0;
        
        action.payload.forEach(account => {
          if (account.type === 'credit' || account.type === 'loan') {
            liabilities += Math.abs(account.balance);
          } else {
            assets += account.balance;
          }
        });
        
        state.netWorth = {
          total: assets - liabilities,
          assets,
          liabilities
        };
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Account
      .addCase(fetchAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.account = action.payload;
      })
      .addCase(fetchAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Account
      .addCase(createAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts.push(action.payload);
        state.message = 'Account created successfully';
        
        // Update net worth
        if (action.payload.type === 'credit' || action.payload.type === 'loan') {
          state.netWorth.liabilities += Math.abs(action.payload.balance);
        } else {
          state.netWorth.assets += action.payload.balance;
        }
        state.netWorth.total = state.netWorth.assets - state.netWorth.liabilities;
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Account
      .addCase(updateAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Find old account to calculate net worth difference
        const oldAccount = state.accounts.find(acc => acc._id === action.payload._id);
        
        // Update account in list
        state.accounts = state.accounts.map(account => 
          account._id === action.payload._id ? action.payload : account
        );
        
        // Update current account if it's the one being edited
        if (state.account && state.account._id === action.payload._id) {
          state.account = action.payload;
        }
        
        // Update net worth
        if (oldAccount) {
          // Remove old account from net worth
          if (oldAccount.type === 'credit' || oldAccount.type === 'loan') {
            state.netWorth.liabilities -= Math.abs(oldAccount.balance);
          } else {
            state.netWorth.assets -= oldAccount.balance;
          }
          
          // Add updated account to net worth
          if (action.payload.type === 'credit' || action.payload.type === 'loan') {
            state.netWorth.liabilities += Math.abs(action.payload.balance);
          } else {
            state.netWorth.assets += action.payload.balance;
          }
          
          state.netWorth.total = state.netWorth.assets - state.netWorth.liabilities;
        }
        
        state.message = 'Account updated successfully';
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete Account
      .addCase(deleteAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Find account to remove from net worth
        const accountToDelete = state.accounts.find(acc => acc._id === action.payload);
        
        // Remove account from list
        state.accounts = state.accounts.filter(account => account._id !== action.payload);
        
        // Clear current account if it's the one being deleted
        if (state.account && state.account._id === action.payload) {
          state.account = null;
        }
        
        // Update net worth
        if (accountToDelete) {
          if (accountToDelete.type === 'credit' || accountToDelete.type === 'loan') {
            state.netWorth.liabilities -= Math.abs(accountToDelete.balance);
          } else {
            state.netWorth.assets -= accountToDelete.balance;
          }
          state.netWorth.total = state.netWorth.assets - state.netWorth.liabilities;
        }
        
        state.message = 'Account deleted successfully';
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Sync Account
      .addCase(syncAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(syncAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Find old account to calculate net worth difference
        const oldAccount = state.accounts.find(acc => acc._id === action.payload._id);
        
        // Update account in list
        state.accounts = state.accounts.map(account => 
          account._id === action.payload._id ? action.payload : account
        );
        
        // Update current account if it's the one being synced
        if (state.account && state.account._id === action.payload._id) {
          state.account = action.payload;
        }
        
        // Update net worth
        if (oldAccount) {
          // Remove old account from net worth
          if (oldAccount.type === 'credit' || oldAccount.type === 'loan') {
            state.netWorth.liabilities -= Math.abs(oldAccount.balance);
          } else {
            state.netWorth.assets -= oldAccount.balance;
          }
          
          // Add updated account to net worth
          if (action.payload.type === 'credit' || action.payload.type === 'loan') {
            state.netWorth.liabilities += Math.abs(action.payload.balance);
          } else {
            state.netWorth.assets += action.payload.balance;
          }
          
          state.netWorth.total = state.netWorth.assets - state.netWorth.liabilities;
        }
        
        state.message = 'Account synced successfully';
      })
      .addCase(syncAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Connect Bank
      .addCase(connectBank.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(connectBank.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Add new accounts to list
        state.accounts = [...state.accounts, ...action.payload.accounts];
        
        // Update net worth with new accounts
        action.payload.accounts.forEach(account => {
          if (account.type === 'credit' || account.type === 'loan') {
            state.netWorth.liabilities += Math.abs(account.balance);
          } else {
            state.netWorth.assets += account.balance;
          }
        });
        
        state.netWorth.total = state.netWorth.assets - state.netWorth.liabilities;
        
        state.message = 'Bank account connected successfully';
      })
      .addCase(connectBank.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearMessage, clearAccount } = accountsSlice.actions;
export default accountsSlice.reducer;
