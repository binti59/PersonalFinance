import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { goalsAPI } from '../../services/api';

// Fetch all goals
export const fetchGoals = createAsyncThunk(
  'goals/fetchGoals',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await goalsAPI.getGoals(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch goals');
    }
  }
);

// Fetch single goal
export const fetchGoal = createAsyncThunk(
  'goals/fetchGoal',
  async (id, { rejectWithValue }) => {
    try {
      const response = await goalsAPI.getGoal(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch goal');
    }
  }
);

// Create new goal
export const createGoal = createAsyncThunk(
  'goals/createGoal',
  async (goalData, { rejectWithValue }) => {
    try {
      const response = await goalsAPI.createGoal(goalData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create goal');
    }
  }
);

// Update goal
export const updateGoal = createAsyncThunk(
  'goals/updateGoal',
  async ({ id, goalData }, { rejectWithValue }) => {
    try {
      const response = await goalsAPI.updateGoal(id, goalData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update goal');
    }
  }
);

// Delete goal
export const deleteGoal = createAsyncThunk(
  'goals/deleteGoal',
  async (id, { rejectWithValue }) => {
    try {
      await goalsAPI.deleteGoal(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete goal');
    }
  }
);

// Contribute to goal
export const contributeToGoal = createAsyncThunk(
  'goals/contributeToGoal',
  async ({ id, contributionData }, { rejectWithValue }) => {
    try {
      const response = await goalsAPI.contributeToGoal(id, contributionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to contribute to goal');
    }
  }
);

// Get goal history
export const getGoalHistory = createAsyncThunk(
  'goals/getGoalHistory',
  async (id, { rejectWithValue }) => {
    try {
      const response = await goalsAPI.getGoalHistory(id);
      return { id, history: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch goal history');
    }
  }
);

const initialState = {
  goals: [],
  activeGoals: [],
  completedGoals: [],
  goal: null,
  goalHistory: {},
  totalGoalAmount: 0,
  totalSaved: 0,
  totalRemaining: 0,
  isLoading: false,
  error: null,
  message: null
};

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
    clearGoal: (state) => {
      state.goal = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Goals
      .addCase(fetchGoals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.goals = action.payload;
        
        // Filter active and completed goals
        state.activeGoals = action.payload.filter(goal => !goal.isCompleted);
        state.completedGoals = action.payload.filter(goal => goal.isCompleted);
        
        // Calculate totals
        let totalGoalAmount = 0;
        let totalSaved = 0;
        
        state.activeGoals.forEach(goal => {
          totalGoalAmount += goal.targetAmount;
          totalSaved += goal.currentAmount;
        });
        
        state.totalGoalAmount = totalGoalAmount;
        state.totalSaved = totalSaved;
        state.totalRemaining = totalGoalAmount - totalSaved;
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Goal
      .addCase(fetchGoal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGoal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.goal = action.payload;
      })
      .addCase(fetchGoal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Goal
      .addCase(createGoal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createGoal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.goals.push(action.payload);
        
        // Update active or completed goals
        if (action.payload.isCompleted) {
          state.completedGoals.push(action.payload);
        } else {
          state.activeGoals.push(action.payload);
          
          // Update totals
          state.totalGoalAmount += action.payload.targetAmount;
          state.totalSaved += action.payload.currentAmount;
          state.totalRemaining = state.totalGoalAmount - state.totalSaved;
        }
        
        state.message = 'Goal created successfully';
      })
      .addCase(createGoal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Goal
      .addCase(updateGoal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateGoal.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Find old goal to update totals
        const oldGoal = state.goals.find(g => g._id === action.payload._id);
        
        // Update goal in list
        state.goals = state.goals.map(goal => 
          goal._id === action.payload._id ? action.payload : goal
        );
        
        // Update current goal if it's the one being edited
        if (state.goal && state.goal._id === action.payload._id) {
          state.goal = action.payload;
        }
        
        // Handle status change (active <-> completed)
        if (oldGoal) {
          // If status changed from active to completed
          if (!oldGoal.isCompleted && action.payload.isCompleted) {
            state.activeGoals = state.activeGoals.filter(g => g._id !== action.payload._id);
            state.completedGoals.push(action.payload);
            
            // Update totals
            state.totalGoalAmount -= oldGoal.targetAmount;
            state.totalSaved -= oldGoal.currentAmount;
          } 
          // If status changed from completed to active
          else if (oldGoal.isCompleted && !action.payload.isCompleted) {
            state.completedGoals = state.completedGoals.filter(g => g._id !== action.payload._id);
            state.activeGoals.push(action.payload);
            
            // Update totals
            state.totalGoalAmount += action.payload.targetAmount;
            state.totalSaved += action.payload.currentAmount;
          }
          // If still active, update the active goals list and totals
          else if (!action.payload.isCompleted) {
            state.activeGoals = state.activeGoals.map(goal => 
              goal._id === action.payload._id ? action.payload : goal
            );
            
            // Update totals
            state.totalGoalAmount = state.totalGoalAmount - oldGoal.targetAmount + action.payload.targetAmount;
            state.totalSaved = state.totalSaved - oldGoal.currentAmount + action.payload.currentAmount;
          }
          // If still completed, update the completed goals list
          else {
            state.completedGoals = state.completedGoals.map(goal => 
              goal._id === action.payload._id ? action.payload : goal
            );
          }
          
          state.totalRemaining = state.totalGoalAmount - state.totalSaved;
        }
        
        state.message = 'Goal updated successfully';
      })
      .addCase(updateGoal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete Goal
      .addCase(deleteGoal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Find goal to remove
        const goalToDelete = state.goals.find(g => g._id === action.payload);
        
        // Remove goal from lists
        state.goals = state.goals.filter(goal => goal._id !== action.payload);
        state.activeGoals = state.activeGoals.filter(goal => goal._id !== action.payload);
        state.completedGoals = state.completedGoals.filter(goal => goal._id !== action.payload);
        
        // Clear current goal if it's the one being deleted
        if (state.goal && state.goal._id === action.payload) {
          state.goal = null;
        }
        
        // Update totals if it was an active goal
        if (goalToDelete && !goalToDelete.isCompleted) {
          state.totalGoalAmount -= goalToDelete.targetAmount;
          state.totalSaved -= goalToDelete.currentAmount;
          state.totalRemaining = state.totalGoalAmount - state.totalSaved;
        }
        
        state.message = 'Goal deleted successfully';
      })
      .addCase(deleteGoal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Contribute to Goal
      .addCase(contributeToGoal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(contributeToGoal.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Find old goal to update totals
        const oldGoal = state.goals.find(g => g._id === action.payload._id);
        
        // Update goal in lists
        state.goals = state.goals.map(goal => 
          goal._id === action.payload._id ? action.payload : goal
        );
        
        state.activeGoals = state.activeGoals.map(goal => 
          goal._id === action.payload._id ? action.payload : goal
        );
        
        // Update current goal if it's the one being contributed to
        if (state.goal && state.goal._id === action.payload._id) {
          state.goal = action.payload;
        }
        
        // Update totals
        if (oldGoal) {
          state.totalSaved = state.totalSaved - oldGoal.currentAmount + action.payload.currentAmount;
          state.totalRemaining = state.totalGoalAmount - state.totalSaved;
        }
        
        // If goal is now completed, move it to completed goals
        if (action.payload.isCompleted && oldGoal && !oldGoal.isCompleted) {
          state.activeGoals = state.activeGoals.filter(g => g._id !== action.payload._id);
          state.completedGoals.push(action.payload);
          
          // Update totals
          state.totalGoalAmount -= action.payload.targetAmount;
          state.totalSaved -= action.payload.currentAmount;
          state.totalRemaining = state.totalGoalAmount - state.totalSaved;
        }
        
        state.message = 'Contribution added successfully';
      })
      .addCase(contributeToGoal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Goal History
      .addCase(getGoalHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getGoalHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.goalHistory = {
          ...state.goalHistory,
          [action.payload.id]: action.payload.history
        };
      })
      .addCase(getGoalHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearMessage, clearGoal } = goalsSlice.actions;
export default goalsSlice.reducer;
