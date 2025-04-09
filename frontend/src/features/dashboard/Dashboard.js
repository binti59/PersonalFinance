import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  ArrowUpward as IncomeIcon,
  ArrowDownward as ExpenseIcon,
  Savings as SavingsIcon,
  Flag as GoalIcon,
  PieChart as BudgetIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { fetchAccounts } from '../accounts/accountsSlice';
import { fetchTransactions } from '../transactions/transactionsSlice';
import { fetchBudgets } from '../budgets/budgetsSlice';
import { fetchGoals } from '../goals/goalsSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { accounts, netWorth, isLoading: accountsLoading, error: accountsError } = useSelector(state => state.accounts);
  const { transactions, isLoading: transactionsLoading, error: transactionsError } = useSelector(state => state.transactions);
  const { activeBudgets, isLoading: budgetsLoading, error: budgetsError } = useSelector(state => state.budgets);
  const { activeGoals, isLoading: goalsLoading, error: goalsError } = useSelector(state => state.goals);

  useEffect(() => {
    // Fetch data for dashboard
    dispatch(fetchAccounts());
    dispatch(fetchTransactions({ limit: 5, sortBy: 'date', sortOrder: 'desc' }));
    dispatch(fetchBudgets());
    dispatch(fetchGoals());
  }, [dispatch]);

  const isLoading = accountsLoading || transactionsLoading || budgetsLoading || goalsLoading;
  const hasError = accountsError || transactionsError || budgetsError || goalsError;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName || 'User'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your finances
        </Typography>
      </Box>

      {hasError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {accountsError || transactionsError || budgetsError || goalsError}
        </Alert>
      )}

      {/* Financial Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Net Worth
            </Typography>
            <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
              ${netWorth?.total?.toFixed(2) || '0.00'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Assets: ${netWorth?.assets?.toFixed(2) || '0.00'}
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Liabilities: ${netWorth?.liabilities?.toFixed(2) || '0.00'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Monthly Income
            </Typography>
            <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
              $3,250.00
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IncomeIcon color="success" fontSize="small" />
              <Typography variant="body2" color="success.main" sx={{ ml: 1 }}>
                +5% from last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Monthly Expenses
            </Typography>
            <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
              $2,180.00
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ExpenseIcon color="error" fontSize="small" />
              <Typography variant="body2" color="error.main" sx={{ ml: 1 }}>
                +2% from last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Savings Rate
            </Typography>
            <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
              33%
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SavingsIcon color="primary" fontSize="small" />
              <Typography variant="body2" color="primary.main" sx={{ ml: 1 }}>
                $1,070.00 saved this month
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Dashboard Content */}
      <Grid container spacing={3}>
        {/* Accounts Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Accounts</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button 
                component={Link} 
                to="/accounts" 
                size="small" 
                color="primary"
              >
                View All
              </Button>
            </Box>
            <List>
              {accounts.slice(0, 5).map((account) => (
                <React.Fragment key={account._id}>
                  <ListItem>
                    <ListItemIcon>
                      <AccountIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={account.name} 
                      secondary={account.institution || account.type} 
                    />
                    <Typography variant="body2" fontWeight="bold">
                      ${account.balance.toFixed(2)}
                    </Typography>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
              {accounts.length === 0 && (
                <ListItem>
                  <ListItemText 
                    primary="No accounts found" 
                    secondary="Add your first account to get started" 
                  />
                  <Button 
                    component={Link} 
                    to="/accounts/new" 
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="small"
                  >
                    Add Account
                  </Button>
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Recent Transactions Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Transactions</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button 
                component={Link} 
                to="/transactions" 
                size="small" 
                color="primary"
              >
                View All
              </Button>
            </Box>
            <List>
              {transactions.slice(0, 5).map((transaction) => (
                <React.Fragment key={transaction._id}>
                  <ListItem>
                    <ListItemIcon>
                      {transaction.type === 'income' ? (
                        <IncomeIcon color="success" />
                      ) : (
                        <ExpenseIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={transaction.description || transaction.merchant} 
                      secondary={new Date(transaction.date).toLocaleDateString()} 
                    />
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                    >
                      {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                    </Typography>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
              {transactions.length === 0 && (
                <ListItem>
                  <ListItemText 
                    primary="No transactions found" 
                    secondary="Add your first transaction to get started" 
                  />
                  <Button 
                    component={Link} 
                    to="/transactions/new" 
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="small"
                  >
                    Add Transaction
                  </Button>
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Budgets Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Budgets</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button 
                component={Link} 
                to="/budgets" 
                size="small" 
                color="primary"
              >
                View All
              </Button>
            </Box>
            <Grid container spacing={2}>
              {activeBudgets.slice(0, 3).map((budget) => (
                <Grid item xs={12} sm={4} key={budget._id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <BudgetIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2" noWrap>
                          {budget.name}
                        </Typography>
                      </Box>
                      <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center', mb: 1 }}>
                        <CircularProgress 
                          variant="determinate" 
                          value={Math.min((budget.spent / budget.amount) * 100, 100)} 
                          color={(budget.spent / budget.amount) > 0.9 ? "error" : "primary"}
                          size={60}
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
                          <Typography variant="caption" component="div" color="text.secondary">
                            {Math.round((budget.spent / budget.amount) * 100)}%
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" align="center">
                        ${budget.spent.toFixed(2)} / ${budget.amount.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {activeBudgets.length === 0 && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      No active budgets found
                    </Typography>
                    <Button 
                      component={Link} 
                      to="/budgets/new" 
                      startIcon={<AddIcon />}
                      variant="outlined"
                      size="small"
                    >
                      Create Budget
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Goals Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Financial Goals</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button 
                component={Link} 
                to="/goals" 
                size="small" 
                color="primary"
              >
                View All
              </Button>
            </Box>
            <Grid container spacing={2}>
              {activeGoals.slice(0, 3).map((goal) => (
                <Grid item xs={12} sm={4} key={goal._id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <GoalIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2" noWrap>
                          {goal.name}
                        </Typography>
                      </Box>
                      <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center', mb: 1 }}>
                        <CircularProgress 
                          variant="determinate" 
                          value={Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)} 
                          color="primary"
                          size={60}
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
                          <Typography variant="caption" component="div" color="text.secondary">
                            {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" align="center">
                        ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        component={Link} 
                        to={`/goals/${goal._id}`}
                        fullWidth
                      >
                        Contribute
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              {activeGoals.length === 0 && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      No active goals found
                    </Typography>
                    <Button 
                      component={Link} 
                      to="/goals/new" 
                      startIcon={<AddIcon />}
                      variant="outlined"
                      size="small"
                    >
                      Create Goal
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
