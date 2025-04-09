import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Tooltip,
  Fab,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Category as CategoryIcon,
  Download as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { 
  generateIncomeExpenseReport, 
  generateNetWorthReport, 
  generateCategorySpendingReport, 
  generateFinancialHealthReport,
  fetchReports,
  createReport,
  updateReport,
  deleteReport
} from './reportsSlice';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend 
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

const Reports = () => {
  const dispatch = useDispatch();
  const { 
    reports, 
    generatedReports, 
    isLoading, 
    error, 
    message 
  } = useSelector(state => state.reports);
  
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [reportParams, setReportParams] = useState({
    startDate: startOfMonth(subMonths(new Date(), 5)),
    endDate: endOfMonth(new Date()),
    type: 'income-expense',
    period: 'monthly'
  });
  const [formData, setFormData] = useState({
    name: '',
    type: 'income-expense',
    startDate: startOfMonth(subMonths(new Date(), 5)),
    endDate: endOfMonth(new Date()),
    period: 'monthly',
    description: '',
    isPublic: false
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchReports());
    generateReports();
  }, [dispatch]);

  const generateReports = () => {
    dispatch(generateIncomeExpenseReport({
      startDate: reportParams.startDate.toISOString(),
      endDate: reportParams.endDate.toISOString(),
      period: reportParams.period
    }));
    
    dispatch(generateNetWorthReport({
      startDate: reportParams.startDate.toISOString(),
      endDate: reportParams.endDate.toISOString(),
      period: reportParams.period
    }));
    
    dispatch(generateCategorySpendingReport({
      startDate: reportParams.startDate.toISOString(),
      endDate: reportParams.endDate.toISOString()
    }));
    
    dispatch(generateFinancialHealthReport());
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (report = null) => {
    if (report) {
      setCurrentReport(report);
      setFormData({
        name: report.name,
        type: report.type,
        startDate: new Date(report.startDate),
        endDate: new Date(report.endDate),
        period: report.period || 'monthly',
        description: report.description || '',
        isPublic: report.isPublic || false
      });
    } else {
      setCurrentReport(null);
      setFormData({
        name: '',
        type: 'income-expense',
        startDate: startOfMonth(subMonths(new Date(), 5)),
        endDate: endOfMonth(new Date()),
        period: 'monthly',
        description: '',
        isPublic: false
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (report) => {
    setCurrentReport(report);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear field error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleReportParamsChange = (e) => {
    const { name, value } = e.target;
    setReportParams({
      ...reportParams,
      [name]: value
    });
  };

  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date
    });
  };

  const handleReportParamsDateChange = (name, date) => {
    setReportParams({
      ...reportParams,
      [name]: date
    });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name) {
      errors.name = 'Report name is required';
    }
    
    if (!formData.type) {
      errors.type = 'Report type is required';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }
    
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      errors.endDate = 'End date must be after start date';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      if (currentReport) {
        dispatch(updateReport({ id: currentReport._id, reportData: formData }));
      } else {
        dispatch(createReport(formData));
      }
      handleCloseDialog();
    }
  };

  const handleDelete = () => {
    if (currentReport) {
      dispatch(deleteReport(currentReport._id));
      handleCloseDeleteDialog();
    }
  };

  const handleRefreshReports = () => {
    generateReports();
  };

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (date) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Income/Expense Chart Data
  const getIncomeExpenseChartData = () => {
    if (!generatedReports.incomeExpense) return null;
    
    const labels = generatedReports.incomeExpense.data.map(item => item.period);
    
    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: generatedReports.incomeExpense.data.map(item => item.income),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
        },
        {
          label: 'Expenses',
          data: generatedReports.incomeExpense.data.map(item => item.expenses),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
        },
        {
          label: 'Net',
          data: generatedReports.incomeExpense.data.map(item => item.net),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
        }
      ]
    };
  };

  // Net Worth Chart Data
  const getNetWorthChartData = () => {
    if (!generatedReports.netWorth) return null;
    
    const labels = generatedReports.netWorth.data.map(item => item.period);
    
    return {
      labels,
      datasets: [
        {
          label: 'Assets',
          data: generatedReports.netWorth.data.map(item => item.assets),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
        },
        {
          label: 'Liabilities',
          data: generatedReports.netWorth.data.map(item => item.liabilities),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
        },
        {
          label: 'Net Worth',
          data: generatedReports.netWorth.data.map(item => item.netWorth),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
        }
      ]
    };
  };

  // Category Spending Chart Data
  const getCategorySpendingChartData = () => {
    if (!generatedReports.categorySpending) return null;
    
    const backgroundColors = [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
      'rgba(199, 199, 199, 0.6)',
      'rgba(83, 102, 255, 0.6)',
      'rgba(40, 159, 64, 0.6)',
      'rgba(210, 199, 199, 0.6)',
    ];
    
    return {
      labels: generatedReports.categorySpending.data.map(item => item.category),
      datasets: [
        {
          data: generatedReports.categorySpending.data.map(item => item.amount),
          backgroundColor: backgroundColors,
          borderWidth: 1,
        }
      ]
    };
  };

  // Financial Health Indicators
  const getFinancialHealthData = () => {
    if (!generatedReports.financialHealth) return null;
    
    return generatedReports.financialHealth;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '',
      },
    },
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Financial Reports</Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            sx={{ mr: 1 }}
          >
            Export
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<PrintIcon />}
            sx={{ mr: 1 }}
          >
            Print
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<AssessmentIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mr: 1 }}
          >
            Save Report
          </Button>
          <Button 
            variant="contained" 
            onClick={handleRefreshReports}
            disabled={isLoading}
          >
            Refresh Data
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {message && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      {/* Report Parameters */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Report Parameters</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={reportParams.startDate}
                onChange={(date) => handleReportParamsDateChange('startDate', date)}
                renderInput={(params) => (
                  <TextField {...params} fullWidth size="small" />
                )}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={reportParams.endDate}
                onChange={(date) => handleReportParamsDateChange('endDate', date)}
                renderInput={(params) => (
                  <TextField {...params} fullWidth size="small" />
                )}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Period</InputLabel>
              <Select
                name="period"
                value={reportParams.period}
                onChange={handleReportParamsChange}
                label="Period"
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button 
              variant="contained" 
              fullWidth
              onClick={handleRefreshReports}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Generate Reports'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Report Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
          <Tab label="Income & Expenses" icon={<BarChartIcon />} iconPosition="start" />
          <Tab label="Net Worth" icon={<LineChartIcon />} iconPosition="start" />
          <Tab label="Spending by Category" icon={<PieChartIcon />} iconPosition="start" />
          <Tab label="Financial Health" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label="Saved Reports" icon={<ReceiptIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Income & Expenses Tab */}
      {tabValue === 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Income & Expenses</Typography>
          
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : !generatedReports.incomeExpense ? (
            <Box sx={{ textAlign: 'center', p: 5 }}>
              <Typography variant="body1" color="text.secondary">
                No data available. Please generate reports.
              </Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Total Income
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {formatCurrency(generatedReports.incomeExpense.summary.totalIncome)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Total Expenses
                      </Typography>
                      <Typography variant="h4" color="error.main">
                        {formatCurrency(generatedReports.incomeExpense.summary.totalExpenses)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Net Income
                      </Typography>
                      <Typography 
                        variant="h4" 
                        color={generatedReports.incomeExpense.summary.netIncome >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatCurrency(generatedReports.incomeExpense.summary.netIncome)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ height: 400 }}>
                <Bar 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        ...chartOptions.plugins.title,
                        text: 'Income vs Expenses'
                      }
                    }
                  }} 
                  data={getIncomeExpenseChartData()} 
                />
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* Net Worth Tab */}
      {tabValue === 1 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Net Worth</Typography>
          
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : !generatedReports.netWorth ? (
            <Box sx={{ textAlign: 'center', p: 5 }}>
              <Typography variant="body1" color="text.secondary">
                No data available. Please generate reports.
              </Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Total Assets
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {formatCurrency(generatedReports.netWorth.summary.totalAssets)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Total Liabilities
                      </Typography>
                      <Typography variant="h4" color="error.main">
                        {formatCurrency(generatedReports.netWorth.summary.totalLiabilities)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Net Worth
                      </Typography>
                      <Typography 
                        variant="h4" 
                        color={generatedReports.netWorth.summary.netWorth >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatCurrency(generatedReports.netWorth.summary.netWorth)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ height: 400 }}>
                <Line 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        ...chartOptions.plugins.title,
                        text: 'Net Worth Over Time'
                      }
                    }
                  }} 
                  data={getNetWorthChartData()} 
                />
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* Spending by Category Tab */}
      {tabValue === 2 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Spending by Category</Typography>
          
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : !generatedReports.categorySpending ? (
            <Box sx={{ textAlign: 'center', p: 5 }}>
              <Typography variant="body1" color="text.secondary">
                No data available. Please generate reports.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 400 }}>
                  <Doughnut 
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          ...chartOptions.plugins.title,
                          text: 'Spending by Category'
                        }
                      }
                    }} 
                    data={getCategorySpendingChartData()} 
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Top Spending Categories</Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {generatedReports.categorySpending.data.map((category, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1">{category.category}</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(category.amount)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4, 
                            width: `${(category.amount / generatedReports.categorySpending.summary.totalSpending) * 100}%`,
                            backgroundColor: `rgba(${index * 30 % 255}, ${index * 50 % 255}, ${index * 70 % 255}, 0.6)`,
                            mr: 1
                          }} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          {((category.amount / generatedReports.categorySpending.summary.totalSpending) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </Paper>
      )}

      {/* Financial Health Tab */}
      {tabValue === 3 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Financial Health</Typography>
          
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : !generatedReports.financialHealth ? (
            <Box sx={{ textAlign: 'center', p: 5 }}>
              <Typography variant="body1" color="text.secondary">
                No data available. Please generate reports.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Overall Financial Health</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                        <CircularProgress 
                          variant="determinate" 
                          value={generatedReports.financialHealth.overallScore} 
                          size={80}
                          thickness={8}
                          sx={{ 
                            color: generatedReports.financialHealth.overallScore > 70 
                              ? 'success.main' 
                              : generatedReports.financialHealth.overallScore > 40 
                                ? 'warning.main' 
                                : 'error.main' 
                          }}
                        />
                        <Box
                          sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="h6" component="div">
                            {generatedReports.financialHealth.overallScore}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="h5">
                          {generatedReports.financialHealth.overallRating}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {generatedReports.financialHealth.summary}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>Key Indicators</Typography>
                    {generatedReports.financialHealth.indicators.map((indicator, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{indicator.name}</Typography>
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            color={
                              indicator.status === 'good' 
                                ? 'success.main' 
                                : indicator.status === 'warning' 
                                  ? 'warning.main' 
                                  : 'error.main'
                            }
                          >
                            {indicator.value}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {indicator.description}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Recommendations</Typography>
                    <Box sx={{ mb: 2 }}>
                      {generatedReports.financialHealth.recommendations.map((recommendation, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            {recommendation.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {recommendation.description}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>Budget Adherence</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Overall Budget Adherence</Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={
                            generatedReports.financialHealth.budgetAdherence.score > 70 
                              ? 'success.main' 
                              : generatedReports.financialHealth.budgetAdherence.score > 40 
                                ? 'warning.main' 
                                : 'error.main'
                          }
                        >
                          {generatedReports.financialHealth.budgetAdherence.score}%
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {generatedReports.financialHealth.budgetAdherence.description}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Paper>
      )}

      {/* Saved Reports Tab */}
      {tabValue === 4 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Saved Reports</Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Save New Report
            </Button>
          </Box>
          
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : reports.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 5 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No saved reports found
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Save your current report settings for quick access in the future
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Save New Report
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {reports.map((report) => (
                <Grid item xs={12} sm={6} md={4} key={report._id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {report.type === 'income-expense' ? (
                          <BarChartIcon sx={{ mr: 1 }} />
                        ) : report.type === 'net-worth' ? (
                          <LineChartIcon sx={{ mr: 1 }} />
                        ) : report.type === 'category-spending' ? (
                          <PieChartIcon sx={{ mr: 1 }} />
                        ) : (
                          <AssessmentIcon sx={{ mr: 1 }} />
                        )}
                        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                          {report.name}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {formatDate(report.startDate)} - {formatDate(report.endDate)}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Period: {report.period}
                      </Typography>
                      
                      {report.description && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {report.description}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        startIcon={<AssessmentIcon />}
                        onClick={() => {
                          setReportParams({
                            startDate: new Date(report.startDate),
                            endDate: new Date(report.endDate),
                            type: report.type,
                            period: report.period
                          });
                          handleRefreshReports();
                          setTabValue(
                            report.type === 'income-expense' ? 0 :
                            report.type === 'net-worth' ? 1 :
                            report.type === 'category-spending' ? 2 : 3
                          );
                        }}
                      >
                        Load
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog(report)}
                      >
                        Edit
                      </Button>
                      <Box sx={{ flexGrow: 1 }} />
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleOpenDeleteDialog(report)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}

      {/* Save Report Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentReport ? 'Edit Report' : 'Save Report'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Report Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!formErrors.type}>
                <InputLabel>Report Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  label="Report Type"
                >
                  <MenuItem value="income-expense">Income & Expenses</MenuItem>
                  <MenuItem value="net-worth">Net Worth</MenuItem>
                  <MenuItem value="category-spending">Category Spending</MenuItem>
                  <MenuItem value="financial-health">Financial Health</MenuItem>
                </Select>
                {formErrors.type && (
                  <Typography variant="caption" color="error">
                    {formErrors.type}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  name="period"
                  value={formData.period}
                  onChange={handleChange}
                  label="Period"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(date) => handleDateChange('startDate', date)}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      required
                      error={!!formErrors.startDate}
                      helperText={formErrors.startDate}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(date) => handleDateChange('endDate', date)}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      required
                      error={!!formErrors.endDate}
                      helperText={formErrors.endDate}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {currentReport ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Report</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the report "{currentReport?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;
