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
  Tabs,
  Tab,
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
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
  AccountBalance as BankIcon,
  CreditCard as CreditCardIcon,
  Savings as SavingsIcon,
  Home as HomeIcon,
  DirectionsCar as CarIcon
} from '@mui/icons-material';
import { fetchAccounts, createAccount, updateAccount, deleteAccount, syncAccount, connectBank } from './accountsSlice';
import { trueLayerAPI } from '../../services/api';

const accountTypes = [
  { value: 'bank', label: 'Bank Account', icon: <BankIcon /> },
  { value: 'credit', label: 'Credit Card', icon: <CreditCardIcon /> },
  { value: 'investment', label: 'Investment', icon: <SavingsIcon /> },
  { value: 'loan', label: 'Loan', icon: <HomeIcon /> },
  { value: 'other', label: 'Other', icon: <CarIcon /> }
];

const Accounts = () => {
  const dispatch = useDispatch();
  const { accounts, netWorth, isLoading, error, message } = useSelector(state => state.accounts);
  
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openConnectBankDialog, setOpenConnectBankDialog] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    institution: '',
    accountNumber: '',
    balance: 0,
    currency: 'USD',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [connectBankUrl, setConnectBankUrl] = useState('');
  const [connectBankLoading, setConnectBankLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (account = null) => {
    if (account) {
      setCurrentAccount(account);
      setFormData({
        name: account.name,
        type: account.type,
        institution: account.institution || '',
        accountNumber: account.accountNumber || '',
        balance: account.balance,
        currency: account.currency || 'USD',
        isActive: account.isActive
      });
    } else {
      setCurrentAccount(null);
      setFormData({
        name: '',
        type: 'bank',
        institution: '',
        accountNumber: '',
        balance: 0,
        currency: 'USD',
        isActive: true
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (account) => {
    setCurrentAccount(account);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleOpenConnectBankDialog = async () => {
    setConnectBankLoading(true);
    try {
      const response = await trueLayerAPI.getAuthUrl();
      setConnectBankUrl(response.data.authUrl);
      setOpenConnectBankDialog(true);
    } catch (error) {
      console.error('Error getting auth URL:', error);
    } finally {
      setConnectBankLoading(false);
    }
  };

  const handleCloseConnectBankDialog = () => {
    setOpenConnectBankDialog(false);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : name === 'balance' ? parseFloat(value) || 0 : value
    });
    
    // Clear field error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name) {
      errors.name = 'Account name is required';
    }
    
    if (!formData.type) {
      errors.type = 'Account type is required';
    }
    
    if (formData.balance === '' || isNaN(formData.balance)) {
      errors.balance = 'Valid balance is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      if (currentAccount) {
        dispatch(updateAccount({ id: currentAccount._id, accountData: formData }));
      } else {
        dispatch(createAccount(formData));
      }
      handleCloseDialog();
    }
  };

  const handleDelete = () => {
    if (currentAccount) {
      dispatch(deleteAccount(currentAccount._id));
      handleCloseDeleteDialog();
    }
  };

  const handleSync = (accountId) => {
    dispatch(syncAccount(accountId));
  };

  const handleConnectBank = () => {
    window.open(connectBankUrl, '_blank');
    handleCloseConnectBankDialog();
  };

  const getAccountIcon = (type) => {
    const accountType = accountTypes.find(t => t.value === type);
    return accountType ? accountType.icon : <BankIcon />;
  };

  const filteredAccounts = tabValue === 0 
    ? accounts 
    : tabValue === 1 
      ? accounts.filter(account => ['bank', 'investment', 'other'].includes(account.type))
      : accounts.filter(account => ['credit', 'loan'].includes(account.type));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Accounts</Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<SyncIcon />}
            onClick={() => dispatch(fetchAccounts())}
            sx={{ mr: 1 }}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<BankIcon />}
            onClick={handleOpenConnectBankDialog}
            sx={{ mr: 1 }}
            disabled={isLoading || connectBankLoading}
          >
            Connect Bank
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={isLoading}
          >
            Add Account
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

      {/* Net Worth Summary */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Net Worth</Typography>
            <Typography variant="h3">${netWorth.total.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Assets</Typography>
            <Typography variant="h4" color="success.main">${netWorth.assets.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Liabilities</Typography>
            <Typography variant="h4" color="error.main">${netWorth.liabilities.toFixed(2)}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Account Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="account tabs">
          <Tab label="All Accounts" />
          <Tab label="Assets" />
          <Tab label="Liabilities" />
        </Tabs>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredAccounts.map((account) => (
            <Grid item xs={12} sm={6} md={4} key={account._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ mr: 2 }}>
                      {getAccountIcon(account.type)}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" noWrap>{account.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {account.institution || account.type}
                      </Typography>
                    </Box>
                    <Box>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDialog(account)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDeleteDialog(account)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Typography variant="h5" align="center" sx={{ mb: 1 }}>
                    ${account.balance.toFixed(2)}
                  </Typography>
                  {account.accountNumber && (
                    <Typography variant="body2" color="text.secondary" align="center">
                      Account: ••••{account.accountNumber.slice(-4)}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<SyncIcon />}
                    onClick={() => handleSync(account._id)}
                    fullWidth
                  >
                    Sync
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          {filteredAccounts.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No accounts found
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{ mt: 1 }}
                >
                  Add Account
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Floating Action Button for mobile */}
      <Fab 
        color="primary" 
        aria-label="add account"
        sx={{ position: 'fixed', bottom: 16, right: 16, display: { sm: 'none' } }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Add/Edit Account Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Name"
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
                <InputLabel>Account Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  label="Account Type"
                >
                  {accountTypes.map((type) => (
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
              <TextField
                fullWidth
                label="Institution"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                placeholder="e.g., Chase, Bank of America"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Balance"
                name="balance"
                type="number"
                value={formData.balance}
                onChange={handleChange}
                error={!!formErrors.balance}
                helperText={formErrors.balance}
                InputProps={{
                  startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  label="Currency"
                >
                  <MenuItem value="USD">USD - US Dollar</MenuItem>
                  <MenuItem value="EUR">EUR - Euro</MenuItem>
                  <MenuItem value="GBP">GBP - British Pound</MenuItem>
                  <MenuItem value="CAD">CAD - Canadian Dollar</MenuItem>
                  <MenuItem value="AUD">AUD - Australian Dollar</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Number (last 4 digits)"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="e.g., 1234"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {currentAccount ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the account "{currentAccount?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Connect Bank Dialog */}
      <Dialog open={openConnectBankDialog} onClose={handleCloseConnectBankDialog}>
        <DialogTitle>Connect Bank Account</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            You'll be redirected to a secure page to connect your bank account. This allows us to securely access your transaction data.
          </Typography>
          <Typography paragraph>
            We use TrueLayer, a regulated financial API provider, to securely connect to your bank. Your credentials are never stored by us.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConnectBankDialog}>Cancel</Button>
          <Button onClick={handleConnectBank} variant="contained">
            Connect Bank
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Accounts;
