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
  Slider,
  Divider,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { fetchBudgets, createBudget, updateBudget, deleteBudget, resetBudget } from './budgetsSlice';
import { fetchCategories } from '../transactions/transactionsSlice';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const Budgets = () => {
  const dispatch = useDispatch();
  const { budgets, activeBudgets, isLoading, error, message } = useSelector(state => state.budgets);
  const { categories } = useSelector(state => state.transactions);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [currentBudget, setCurrentBudget] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    amount: '',
    period: 'monthly',
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    rollover: false,
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchBudgets());
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleOpenDialog = (budget = null) => {
    if (budget) {
      setCurrentBudget(budget);
      setFormData({
        name: budget.name,
        category: budget.category,
        amount: budget.amount,
        period: budget.period || 'monthly',
        startDate: new Date(budget.startDate),
        endDate: new Date(budget.endDate),
        rollover: budget.rollover || false,
        notes: budget.notes || ''
      });
    } else {
      setCurrentBudget(null);
      setFormData({
        name: '',
        category: '',
        amount: '',
        period: 'monthly',
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date()),
        rollover: false,
        notes: ''
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (budget) => {
    setCurrentBudget(budget);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleOpenResetDialog = (budget) => {
    setCurrentBudget(budget);
    setOpenResetDialog(true);
  };

  const handleCloseResetDialog = () => {
    setOpenResetDialog(false);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : name === 'amount' ? (value === '' ? '' : parseFloat(value) || 0) : value
    });
    
    // Clear field error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date
    });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name) {
      errors.name = 'Budget name is required';
    }
    
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    
    if (formData.amount === '' || isNaN(formData.amount) || formData.amount <= 0) {
      errors.amount = 'Valid amount is required';
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
      if (currentBudget) {
        dispatch(updateBudget({ id: currentBudget._id, budgetData: formData }));
      } else {
        dispatch(createBudget(formData));
      }
      handleCloseDialog();
    }
  };

  const handleDelete = () => {
    if (currentBudget) {
      dispatch(deleteBudget(currentBudget._id));
      handleCloseDeleteDialog();
    }
  };

  const handleReset = () => {
    if (currentBudget) {
      dispatch(resetBudget(currentBudget._id));
      handleCloseResetDialog();
    }
  };

  const getBudgetProgress = (budget) => {
    const percentage = (budget.spent / budget.amount) * 100;
    return Math.min(percentage, 100);
  };

  const getBudgetStatus = (budget) => {
    const percentage = (budget.spent / budget.amount) * 100;
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 90) return 'warning';
    if (percentage >= 75) return 'caution';
    return 'good';
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'exceeded': return 'error';
      case 'warning': return 'error';
      case 'caution': return 'warning';
      default: return 'primary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'exceeded': return 'Exceeded';
      case 'warning': return 'Almost Exceeded';
      case 'caution': return 'Approaching Limit';
      default: return 'On Track';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'exceeded': return 'error.main';
      case 'warning': return 'error.main';
      case 'caution': return 'warning.main';
      default: return 'success.main';
    }
  };

  const formatDateRange = (startDate, endDate) => {
    return `${format(new Date(startDate), 'MMM d')} - ${format(new Date(endDate), 'MMM d, yyyy')}`;
  };

  const calculateTotalBudget = () => {
    return activeBudgets.reduce((total, budget) => total + budget.amount, 0);
  };

  const calculateTotalSpent = () => {
    return activeBudgets.reduce((total, budget) => total + budget.spent, 0);
  };

  const calculateTotalRemaining = () => {
    return calculateTotalBudget() - calculateTotalSpent();
  };

  const calculateOverallProgress = () => {
    const totalBudget = calculateTotalBudget();
    if (totalBudget === 0) return 0;
    return (calculateTotalSpent() / totalBudget) * 100;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Budgets</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={isLoading}
        >
          Create Budget
        </Button>
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

      {/* Budget Summary */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Total Budget</Typography>
            <Typography variant="h3">${calculateTotalBudget().toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Spent</Typography>
            <Typography variant="h4" color="error.main">${calculateTotalSpent().toFixed(2)}</Typography>
            <LinearProgress 
              variant="determinate" 
              value={calculateOverallProgress()} 
              sx={{ mt: 1, height: 8, borderRadius: 4 }}
              color={calculateOverallProgress() > 90 ? "error" : "primary"}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Remaining</Typography>
            <Typography variant="h4" color="success.main">${calculateTotalRemaining().toFixed(2)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {calculateOverallProgress().toFixed(0)}% of budget used
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Budget List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : activeBudgets.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No budgets found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Create your first budget to start tracking your spending
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Budget
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {activeBudgets.map((budget) => {
            const progress = getBudgetProgress(budget);
            const status = getBudgetStatus(budget);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={budget._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CategoryIcon sx={{ mr: 1 }} />
                      <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                        {budget.name}
                      </Typography>
                      <Chip 
                        label={getStatusText(status)} 
                        size="small"
                        sx={{ 
                          backgroundColor: getStatusColor(status),
                          color: 'white'
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {budget.category}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDateRange(budget.startDate, budget.endDate)}
                        </Typography>
                      </Box>
                      
                      <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        sx={{ height: 8, borderRadius: 4 }}
                        color={getProgressColor(status)}
                      />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2">
                          ${budget.spent.toFixed(2)} spent
                        </Typography>
                        <Typography variant="body2">
                          ${(budget.amount - budget.spent).toFixed(2)} left
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">
                        ${budget.amount.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {progress.toFixed(0)}% used
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(budget)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<RefreshIcon />}
                      onClick={() => handleOpenResetDialog(budget)}
                    >
                      Reset
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleOpenDeleteDialog(budget)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Floating Action Button for mobile */}
      <Fab 
        color="primary" 
        aria-label="add budget"
        sx={{ position: 'fixed', bottom: 16, right: 16, display: { sm: 'none' } }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Add/Edit Budget Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentBudget ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Budget Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!formErrors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem value={category.name} key={category.name}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.category && (
                  <Typography variant="caption" color="error">
                    {formErrors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Budget Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                InputProps={{
                  startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
                }}
                required
              />
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
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rollover Unused Amount</InputLabel>
                <Select
                  name="rollover"
                  value={formData.rollover}
                  onChange={handleChange}
                  label="Rollover Unused Amount"
                >
                  <MenuItem value={true}>Yes</MenuItem>
                  <MenuItem value={false}>No</MenuItem>
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
                label="Notes"
                name="notes"
                value={formData.notes}
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
            {currentBudget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Budget</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the budget "{currentBudget?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={openResetDialog} onClose={handleCloseResetDialog}>
        <DialogTitle>Reset Budget</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset the spent amount for "{currentBudget?.name}" to zero? This will not affect your transaction history.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetDialog}>Cancel</Button>
          <Button onClick={handleReset} color="primary">Reset</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Budgets;
