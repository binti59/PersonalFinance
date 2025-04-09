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
  Divider,
  LinearProgress,
  Chip,
  Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  Savings as SavingsIcon,
  Home as HomeIcon,
  DirectionsCar as CarIcon,
  School as EducationIcon,
  Celebration as CelebrationIcon,
  Flight as TravelIcon,
  MonetizationOn as ContributeIcon
} from '@mui/icons-material';
import { fetchGoals, createGoal, updateGoal, deleteGoal, contributeToGoal } from './goalsSlice';
import { format, addMonths, differenceInMonths } from 'date-fns';

const goalTypes = [
  { value: 'savings', label: 'Savings', icon: <SavingsIcon /> },
  { value: 'home', label: 'Home', icon: <HomeIcon /> },
  { value: 'car', label: 'Vehicle', icon: <CarIcon /> },
  { value: 'education', label: 'Education', icon: <EducationIcon /> },
  { value: 'travel', label: 'Travel', icon: <TravelIcon /> },
  { value: 'celebration', label: 'Celebration', icon: <CelebrationIcon /> },
  { value: 'other', label: 'Other', icon: <FlagIcon /> }
];

const Goals = () => {
  const dispatch = useDispatch();
  const { goals, activeGoals, completedGoals, totalGoalAmount, totalSaved, totalRemaining, isLoading, error, message } = useSelector(state => state.goals);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openContributeDialog, setOpenContributeDialog] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'savings',
    targetAmount: '',
    currentAmount: 0,
    targetDate: addMonths(new Date(), 12),
    description: '',
    priority: 'medium',
    isCompleted: false
  });
  const [contributeData, setContributeData] = useState({
    amount: '',
    date: new Date(),
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [contributeErrors, setContributeErrors] = useState({});
  const [viewMode, setViewMode] = useState('active');

  useEffect(() => {
    dispatch(fetchGoals());
  }, [dispatch]);

  const handleOpenDialog = (goal = null) => {
    if (goal) {
      setCurrentGoal(goal);
      setFormData({
        name: goal.name,
        type: goal.type || 'savings',
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: new Date(goal.targetDate),
        description: goal.description || '',
        priority: goal.priority || 'medium',
        isCompleted: goal.isCompleted
      });
    } else {
      setCurrentGoal(null);
      setFormData({
        name: '',
        type: 'savings',
        targetAmount: '',
        currentAmount: 0,
        targetDate: addMonths(new Date(), 12),
        description: '',
        priority: 'medium',
        isCompleted: false
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (goal) => {
    setCurrentGoal(goal);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleOpenContributeDialog = (goal) => {
    setCurrentGoal(goal);
    setContributeData({
      amount: '',
      date: new Date(),
      notes: ''
    });
    setContributeErrors({});
    setOpenContributeDialog(true);
  };

  const handleCloseContributeDialog = () => {
    setOpenContributeDialog(false);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' 
        ? checked 
        : (name === 'targetAmount' || name === 'currentAmount') 
          ? (value === '' ? '' : parseFloat(value) || 0) 
          : value
    });
    
    // Clear field error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleContributeChange = (e) => {
    const { name, value } = e.target;
    setContributeData({
      ...contributeData,
      [name]: name === 'amount' ? (value === '' ? '' : parseFloat(value) || 0) : value
    });
    
    // Clear field error when user types
    if (contributeErrors[name]) {
      setContributeErrors({
        ...contributeErrors,
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

  const handleContributeDateChange = (date) => {
    setContributeData({
      ...contributeData,
      date
    });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name) {
      errors.name = 'Goal name is required';
    }
    
    if (formData.targetAmount === '' || isNaN(formData.targetAmount) || formData.targetAmount <= 0) {
      errors.targetAmount = 'Valid target amount is required';
    }
    
    if (formData.currentAmount === '' || isNaN(formData.currentAmount) || formData.currentAmount < 0) {
      errors.currentAmount = 'Valid current amount is required';
    }
    
    if (formData.currentAmount > formData.targetAmount) {
      errors.currentAmount = 'Current amount cannot exceed target amount';
    }
    
    if (!formData.targetDate) {
      errors.targetDate = 'Target date is required';
    }
    
    if (formData.targetDate && formData.targetDate < new Date()) {
      errors.targetDate = 'Target date must be in the future';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateContributeForm = () => {
    const errors = {};
    
    if (contributeData.amount === '' || isNaN(contributeData.amount) || contributeData.amount <= 0) {
      errors.amount = 'Valid contribution amount is required';
    }
    
    if (!contributeData.date) {
      errors.date = 'Date is required';
    }
    
    setContributeErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      if (currentGoal) {
        dispatch(updateGoal({ id: currentGoal._id, goalData: formData }));
      } else {
        dispatch(createGoal(formData));
      }
      handleCloseDialog();
    }
  };

  const handleDelete = () => {
    if (currentGoal) {
      dispatch(deleteGoal(currentGoal._id));
      handleCloseDeleteDialog();
    }
  };

  const handleContribute = () => {
    if (validateContributeForm() && currentGoal) {
      dispatch(contributeToGoal({ 
        id: currentGoal._id, 
        contributionData: contributeData 
      }));
      handleCloseContributeDialog();
    }
  };

  const getGoalIcon = (type) => {
    const goalType = goalTypes.find(t => t.value === type);
    return goalType ? goalType.icon : <FlagIcon />;
  };

  const getGoalProgress = (goal) => {
    return (goal.currentAmount / goal.targetAmount) * 100;
  };

  const getMonthlyContributionNeeded = (goal) => {
    const monthsLeft = differenceInMonths(new Date(goal.targetDate), new Date());
    if (monthsLeft <= 0) return goal.targetAmount - goal.currentAmount;
    return (goal.targetAmount - goal.currentAmount) / monthsLeft;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error.main';
      case 'medium': return 'warning.main';
      case 'low': return 'success.main';
      default: return 'primary.main';
    }
  };

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (date) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  const displayedGoals = viewMode === 'active' ? activeGoals : completedGoals;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Financial Goals</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={isLoading}
        >
          Create Goal
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

      {/* Goals Summary */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Total Goals</Typography>
            <Typography variant="h3">{formatCurrency(totalGoalAmount)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {activeGoals.length} active goals
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Total Saved</Typography>
            <Typography variant="h4" color="success.main">{formatCurrency(totalSaved)}</Typography>
            <LinearProgress 
              variant="determinate" 
              value={totalGoalAmount > 0 ? (totalSaved / totalGoalAmount) * 100 : 0} 
              sx={{ mt: 1, height: 8, borderRadius: 4 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Remaining</Typography>
            <Typography variant="h4" color="primary.main">{formatCurrency(totalRemaining)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {totalGoalAmount > 0 ? ((totalSaved / totalGoalAmount) * 100).toFixed(0) : 0}% of goals funded
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* View Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Stack direction="row" spacing={1}>
          <Button 
            variant={viewMode === 'active' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('active')}
          >
            Active Goals ({activeGoals.length})
          </Button>
          <Button 
            variant={viewMode === 'completed' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('completed')}
          >
            Completed Goals ({completedGoals.length})
          </Button>
        </Stack>
      </Box>

      {/* Goals List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : displayedGoals.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No {viewMode} goals found
          </Typography>
          {viewMode === 'active' && (
            <>
              <Typography variant="body1" color="text.secondary" paragraph>
                Create your first goal to start tracking your progress
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Create Goal
              </Button>
            </>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {displayedGoals.map((goal) => {
            const progress = getGoalProgress(goal);
            const monthlyNeeded = getMonthlyContributionNeeded(goal);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={goal._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ mr: 1 }}>
                        {getGoalIcon(goal.type)}
                      </Box>
                      <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                        {goal.name}
                      </Typography>
                      <Chip 
                        label={goal.priority} 
                        size="small"
                        sx={{ 
                          backgroundColor: getPriorityColor(goal.priority),
                          color: 'white'
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center', mb: 2 }}>
                        <CircularProgress 
                          variant="determinate" 
                          value={progress} 
                          size={80}
                          thickness={4}
                          sx={{ color: progress >= 100 ? 'success.main' : 'primary.main' }}
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
                          <Typography variant="h6" component="div" color="text.secondary">
                            {progress.toFixed(0)}%
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          {formatCurrency(goal.currentAmount)} saved
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(goal.targetAmount)} goal
                        </Typography>
                      </Box>
                      
                      <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    
                    {!goal.isCompleted && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Target Date
                            </Typography>
                            <Typography variant="body1">
                              {formatDate(goal.targetDate)}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="text.secondary">
                              Monthly Needed
                            </Typography>
                            <Typography variant="body1" color={monthlyNeeded > 0 ? 'primary.main' : 'success.main'}>
                              {formatCurrency(monthlyNeeded > 0 ? monthlyNeeded : 0)}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    )}
                    
                    {goal.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {goal.description}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    {!goal.isCompleted && (
                      <Button 
                        size="small" 
                        startIcon={<ContributeIcon />}
                        onClick={() => handleOpenContributeDialog(goal)}
                        color="primary"
                      >
                        Contribute
                      </Button>
                    )}
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(goal)}
                    >
                      Edit
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleOpenDeleteDialog(goal)}
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
        aria-label="add goal"
        sx={{ position: 'fixed', bottom: 16, right: 16, display: { sm: 'none' } }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Add/Edit Goal Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentGoal ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Goal Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Goal Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  label="Goal Type"
                >
                  {goalTypes.map((type) => (
                    <MenuItem value={type.value} key={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 1 }}>{type.icon}</Box>
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  label="Priority"
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Target Amount"
                name="targetAmount"
                type="number"
                value={formData.targetAmount}
                onChange={handleChange}
                error={!!formErrors.targetAmount}
                helperText={formErrors.targetAmount}
                InputProps={{
                  startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Current Amount"
                name="currentAmount"
                type="number"
                value={formData.currentAmount}
                onChange={handleChange}
                error={!!formErrors.currentAmount}
                helperText={formErrors.currentAmount}
                InputProps={{
                  startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Target Date"
                  value={formData.targetDate}
                  onChange={(date) => handleDateChange('targetDate', date)}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      required
                      error={!!formErrors.targetDate}
                      helperText={formErrors.targetDate}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="isCompleted"
                  value={formData.isCompleted}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value={false}>Active</MenuItem>
                  <MenuItem value={true}>Completed</MenuItem>
                </Select>
              </FormControl>
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
            {currentGoal ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Goal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the goal "{currentGoal?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Contribute Dialog */}
      <Dialog open={openContributeDialog} onClose={handleCloseContributeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Contribute to {currentGoal?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contribution Amount"
                name="amount"
                type="number"
                value={contributeData.amount}
                onChange={handleContributeChange}
                error={!!contributeErrors.amount}
                helperText={contributeErrors.amount}
                InputProps={{
                  startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={contributeData.date}
                  onChange={handleContributeDateChange}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      required
                      error={!!contributeErrors.date}
                      helperText={contributeErrors.date}
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
                value={contributeData.notes}
                onChange={handleContributeChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseContributeDialog}>Cancel</Button>
          <Button onClick={handleContribute} variant="contained">
            Contribute
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Goals;
