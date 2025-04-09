import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reportsAPI } from '../../services/api';

// Fetch all reports
export const fetchReports = createAsyncThunk(
  'reports/fetchReports',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await reportsAPI.getReports(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reports');
    }
  }
);

// Fetch single report
export const fetchReport = createAsyncThunk(
  'reports/fetchReport',
  async (id, { rejectWithValue }) => {
    try {
      const response = await reportsAPI.getReport(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch report');
    }
  }
);

// Create new report
export const createReport = createAsyncThunk(
  'reports/createReport',
  async (reportData, { rejectWithValue }) => {
    try {
      const response = await reportsAPI.createReport(reportData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create report');
    }
  }
);

// Update report
export const updateReport = createAsyncThunk(
  'reports/updateReport',
  async ({ id, reportData }, { rejectWithValue }) => {
    try {
      const response = await reportsAPI.updateReport(id, reportData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update report');
    }
  }
);

// Delete report
export const deleteReport = createAsyncThunk(
  'reports/deleteReport',
  async (id, { rejectWithValue }) => {
    try {
      await reportsAPI.deleteReport(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete report');
    }
  }
);

// Generate income/expense report
export const generateIncomeExpenseReport = createAsyncThunk(
  'reports/generateIncomeExpenseReport',
  async (params, { rejectWithValue }) => {
    try {
      const response = await reportsAPI.generateIncomeExpenseReport(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate income/expense report');
    }
  }
);

// Generate net worth report
export const generateNetWorthReport = createAsyncThunk(
  'reports/generateNetWorthReport',
  async (params, { rejectWithValue }) => {
    try {
      const response = await reportsAPI.generateNetWorthReport(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate net worth report');
    }
  }
);

// Generate category spending report
export const generateCategorySpendingReport = createAsyncThunk(
  'reports/generateCategorySpendingReport',
  async (params, { rejectWithValue }) => {
    try {
      const response = await reportsAPI.generateCategorySpendingReport(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate category spending report');
    }
  }
);

// Generate financial health report
export const generateFinancialHealthReport = createAsyncThunk(
  'reports/generateFinancialHealthReport',
  async (_, { rejectWithValue }) => {
    try {
      const response = await reportsAPI.generateFinancialHealthReport();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate financial health report');
    }
  }
);

// Export report
export const exportReport = createAsyncThunk(
  'reports/exportReport',
  async ({ id, format }, { rejectWithValue }) => {
    try {
      const response = await reportsAPI.exportReport(id, format);
      return { data: response.data, format };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to export report');
    }
  }
);

const initialState = {
  reports: [],
  report: null,
  generatedReports: {
    incomeExpense: null,
    netWorth: null,
    categorySpending: null,
    financialHealth: null
  },
  exportedReport: null,
  isLoading: false,
  error: null,
  message: null
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
    clearReport: (state) => {
      state.report = null;
    },
    clearExportedReport: (state) => {
      state.exportedReport = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Reports
      .addCase(fetchReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Report
      .addCase(fetchReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.report = action.payload;
      })
      .addCase(fetchReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Report
      .addCase(createReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports.push(action.payload);
        state.message = 'Report saved successfully';
      })
      .addCase(createReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Report
      .addCase(updateReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateReport.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update report in list
        state.reports = state.reports.map(report => 
          report._id === action.payload._id ? action.payload : report
        );
        
        // Update current report if it's the one being edited
        if (state.report && state.report._id === action.payload._id) {
          state.report = action.payload;
        }
        
        state.message = 'Report updated successfully';
      })
      .addCase(updateReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete Report
      .addCase(deleteReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Remove report from list
        state.reports = state.reports.filter(report => report._id !== action.payload);
        
        // Clear current report if it's the one being deleted
        if (state.report && state.report._id === action.payload) {
          state.report = null;
        }
        
        state.message = 'Report deleted successfully';
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Generate Income/Expense Report
      .addCase(generateIncomeExpenseReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateIncomeExpenseReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.generatedReports.incomeExpense = action.payload;
      })
      .addCase(generateIncomeExpenseReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Generate Net Worth Report
      .addCase(generateNetWorthReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateNetWorthReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.generatedReports.netWorth = action.payload;
      })
      .addCase(generateNetWorthReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Generate Category Spending Report
      .addCase(generateCategorySpendingReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateCategorySpendingReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.generatedReports.categorySpending = action.payload;
      })
      .addCase(generateCategorySpendingReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Generate Financial Health Report
      .addCase(generateFinancialHealthReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateFinancialHealthReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.generatedReports.financialHealth = action.payload;
      })
      .addCase(generateFinancialHealthReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Export Report
      .addCase(exportReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(exportReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.exportedReport = action.payload;
        state.message = `Report exported successfully as ${action.payload.format}`;
      })
      .addCase(exportReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearMessage, clearReport, clearExportedReport } = reportsSlice.actions;
export default reportsSlice.reducer;
