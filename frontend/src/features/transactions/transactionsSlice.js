import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transactionsAPI } from '../../services/api';

// Fetch transactions with optional filters
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.getTransactions(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

// Fetch single transaction
export const fetchTransaction = createAsyncThunk(
  'transactions/fetchTransaction',
  async (id, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.getTransaction(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transaction');
    }
  }
);

// Create new transaction
export const createTransaction = createAsyncThunk(
  'transactions/createTransaction',
  async (transactionData, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.createTransaction(transactionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create transaction');
    }
  }
);

// Update transaction
export const updateTransaction = createAsyncThunk(
  'transactions/updateTransaction',
  async ({ id, transactionData }, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.updateTransaction(id, transactionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update transaction');
    }
  }
);

// Delete transaction
export const deleteTransaction = createAsyncThunk(
  'transactions/deleteTransaction',
  async (id, { rejectWithValue }) => {
    try {
      await transactionsAPI.deleteTransaction(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete transaction');
    }
  }
);

// Fetch categories
export const fetchCategories = createAsyncThunk(
  'transactions/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.getCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

// Import transactions from file
export const importTransactions = createAsyncThunk(
  'transactions/importTransactions',
  async (fileData, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.importTransactions(fileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to import transactions');
    }
  }
);

const initialState = {
  transactions: [],
  transaction: null,
  categories: [],
  summary: {
    income: 0,
    expenses: 0,
    balance: 0
  },
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  },
  isLoading: false,
  error: null,
  message: null
};

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
    clearTransaction: (state) => {
      state.transaction = null;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload.transactions;
        state.summary = action.payload.summary;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Transaction
      .addCase(fetchTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transaction = action.payload;
      })
      .addCase(fetchTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Transaction
      .addCase(createTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions.unshift(action.payload);
        
        // Update summary
        if (action.payload.type === 'income') {
          state.summary.income += action.payload.amount;
          state.summary.balance += action.payload.amount;
        } else {
          state.summary.expenses += action.payload.amount;
          state.summary.balance -= action.payload.amount;
        }
        
        state.message = 'Transaction created successfully';
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Transaction
      .addCase(updateTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Find old transaction to update summary
        const oldTransaction = state.transactions.find(t => t._id === action.payload._id);
        
        // Update transaction in list
        state.transactions = state.transactions.map(transaction => 
          transaction._id === action.payload._id ? action.payload : transaction
        );
        
        // Update current transaction if it's the one being edited
        if (state.transaction && state.transaction._id === action.payload._id) {
          state.transaction = action.payload;
        }
        
        // Update summary
        if (oldTransaction) {
          // Remove old transaction from summary
          if (oldTransaction.type === 'income') {
            state.summary.income -= oldTransaction.amount;
            state.summary.balance -= oldTransaction.amount;
          } else {
            state.summary.expenses -= oldTransaction.amount;
            state.summary.balance += oldTransaction.amount;
          }
          
          // Add updated transaction to summary
          if (action.payload.type === 'income') {
            state.summary.income += action.payload.amount;
            state.summary.balance += action.payload.amount;
          } else {
            state.summary.expenses += action.payload.amount;
            state.summary.balance -= action.payload.amount;
          }
        }
        
        state.message = 'Transaction updated successfully';
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete Transaction
      .addCase(deleteTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Find transaction to remove from summary
        const transactionToDelete = state.transactions.find(t => t._id === action.payload);
        
        // Remove transaction from list
        state.transactions = state.transactions.filter(transaction => transaction._id !== action.payload);
        
        // Clear current transaction if it's the one being deleted
        if (state.transaction && state.transaction._id === action.payload) {
          state.transaction = null;
        }
        
        // Update summary
        if (transactionToDelete) {
          if (transactionToDelete.type === 'income') {
            state.summary.income -= transactionToDelete.amount;
            state.summary.balance -= transactionToDelete.amount;
          } else {
            state.summary.expenses -= transactionToDelete.amount;
            state.summary.balance += transactionToDelete.amount;
          }
        }
        
        state.message = 'Transaction deleted successfully';
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Import Transactions
      .addCase(importTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(importTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Add imported transactions to list
        state.transactions = [...action.payload.transactions, ...state.transactions];
        
        // Update summary
        state.summary = action.payload.summary;
        
        state.message = `${action.payload.transactions.length} transactions imported successfully`;
      })
      .addCase(importTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearMessage, clearTransaction, setPage, setLimit } = transactionsSlice.actions;
export default transactionsSlice.reducer;
