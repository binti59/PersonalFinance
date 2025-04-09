import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { budgetsAPI } from '../../services/api';

// Fetch all budgets
export const fetchBudgets = createAsyncThunk(
  'budgets/fetchBudgets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await budgetsAPI.getBudgets();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch budgets');
    }
  }
);

// Fetch single budget
export const fetchBudget = createAsyncThunk(
  'budgets/fetchBudget',
  async (id, { rejectWithValue }) => {
    try {
      const response = await budgetsAPI.getBudget(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch budget');
    }
  }
);

// Create new budget
export const createBudget = createAsyncThunk(
  'budgets/createBudget',
  async (budgetData, { rejectWithValue }) => {
    try {
      const response = await budgetsAPI.createBudget(budgetData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create budget');
    }
  }
);

// Update budget
export const updateBudget = createAsyncThunk(
  'budgets/updateBudget',
  async ({ id, budgetData }, { rejectWithValue }) => {
    try {
      const response = await budgetsAPI.updateBudget(id, budgetData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update budget');
    }
  }
);

// Delete budget
export const deleteBudget = createAsyncThunk(
  'budgets/deleteBudget',
  async (id, { rejectWithValue }) => {
    try {
      await budgetsAPI.deleteBudget(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete budget');
    }
  }
);

// Reset budget
export const resetBudget = createAsyncThunk(
  'budgets/resetBudget',
  async (id, { rejectWithValue }) => {
    try {
      const response = await budgetsAPI.resetBudget(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset budget');
    }
  }
);

const initialState = {
  budgets: [],
  activeBudgets: [],
  budget: null,
  isLoading: false,
  error: null,
  message: null
};

const budgetsSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
    clearBudget: (state) => {
      state.budget = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Budgets
      .addCase(fetchBudgets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.budgets = action.payload;
        
        // Filter active budgets (current date is between start and end date)
        const now = new Date();
        state.activeBudgets = action.payload.filter(budget => {
          const startDate = new Date(budget.startDate);
          const endDate = new Date(budget.endDate);
          return startDate <= now && endDate >= now;
        });
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Budget
      .addCase(fetchBudget.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        state.budget = action.payload;
      })
      .addCase(fetchBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Budget
      .addCase(createBudget.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        state.budgets.push(action.payload);
        
        // Check if budget is active
        const now = new Date();
        const startDate = new Date(action.payload.startDate);
        const endDate = new Date(action.payload.endDate);
        
        if (startDate <= now && endDate >= now) {
          state.activeBudgets.push(action.payload);
        }
        
        state.message = 'Budget created successfully';
      })
      .addCase(createBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Budget
      .addCase(updateBudget.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update budget in list
        state.budgets = state.budgets.map(budget => 
          budget._id === action.payload._id ? action.payload : budget
        );
        
        // Update current budget if it's the one being edited
        if (state.budget && state.budget._id === action.payload._id) {
          state.budget = action.payload;
        }
        
        // Update active budgets
        const now = new Date();
        state.activeBudgets = state.budgets.filter(budget => {
          const startDate = new Date(budget.startDate);
          const endDate = new Date(budget.endDate);
          return startDate <= now && endDate >= now;
        });
        
        state.message = 'Budget updated successfully';
      })
      .addCase(updateBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete Budget
      .addCase(deleteBudget.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Remove budget from lists
        state.budgets = state.budgets.filter(budget => budget._id !== action.payload);
        state.activeBudgets = state.activeBudgets.filter(budget => budget._id !== action.payload);
        
        // Clear current budget if it's the one being deleted
        if (state.budget && state.budget._id === action.payload) {
          state.budget = null;
        }
        
        state.message = 'Budget deleted successfully';
      })
      .addCase(deleteBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Reset Budget
      .addCase(resetBudget.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update budget in lists
        state.budgets = state.budgets.map(budget => 
          budget._id === action.payload._id ? action.payload : budget
        );
        
        state.activeBudgets = state.activeBudgets.map(budget => 
          budget._id === action.payload._id ? action.payload : budget
        );
        
        // Update current budget if it's the one being reset
        if (state.budget && state.budget._id === action.payload._id) {
          state.budget = action.payload;
        }
        
        state.message = 'Budget reset successfully';
      })
      .addCase(resetBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearMessage, clearBudget } = budgetsSlice.actions;
export default budgetsSlice.reducer;
