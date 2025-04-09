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
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  InputAdornment,
  Autocomplete,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  ArrowUpward as IncomeIcon,
  ArrowDownward as ExpenseIcon,
  Receipt as ReceiptIcon,
  Category as CategoryIcon,
  CalendarMonth as CalendarIcon,
  AccountBalance as AccountIcon,
  ExpandLess,
  ExpandMore,
  Clear as ClearIcon,
  FileUpload as ImportIcon
} from '@mui/icons-material';
import { fetchTransactions, createTransaction, updateTransaction, deleteTransaction, fetchCategories, updateFilters, resetFilters } from './transactionsSlice';
import { fetchAccounts } from '../accounts/accountsSlice';
import { format } from 'date-fns';

const Transactions = () => {
  const dispatch = useDispatch();
  const { transactions, categories, isLoading, error, message, filters, pagination } = useSelector(state => state.transactions);
  const { accounts } = useSelector(state => state.accounts);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [formData, setFormData] = useState({
    accountId: '',
    date: new Date(),
    amount: '',
    type: 'expense',
    category: '',
    subcategory: '',
    description: '',
    merchant: '',
    notes: '',
    tags: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [expandedFilters, setExpandedFilters] = useState({
    date: true,
    amount: false,
    category: false,
    account: false
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    dispatch(fetchAccounts());
    dispatch(fetchCategories());
    dispatch(fetchTransactions(filters));
  }, [dispatch, filters]);

  const handleOpenDialog = (transaction = null) => {
    if (transaction) {
      setCurrentTransaction(transaction);
      setFormData({
        accountId: transaction.accountId._id || transaction.accountId,
        date: new Date(transaction.date),
        amount: Math.abs(transaction.amount),
        type: transaction.type,
        category: transaction.category || '',
        subcategory: transaction.subcategory || '',
        description: transaction.description || '',
        merchant: transaction.merchant || '',
        notes: transaction.notes || '',
        tags: transaction.tags || []
      });
    } else {
      setCurrentTransaction(null);
      setFormData({
        accountId: accounts.length > 0 ? accounts[0]._id : '',
        date: new Date(),
        amount: '',
        type: 'expense',
        category: '',
        subcategory: '',
        description: '',
        merchant: '',
        notes: '',
        tags: []
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (transaction) => {
    setCurrentTransaction(transaction);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const toggleFilterDrawer = () => {
    setOpenFilterDrawer(!openFilterDrawer);
  };

  const handleExpandFilter = (section) => {
    setExpandedFilters({
      ...expandedFilters,
      [section]: !expandedFilters[section]
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'amount' ? (value === '' ? '' : parseFloat(value) || 0) : value
    });
    
    // Clear field error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      date
    });
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.accountId) {
      errors.accountId = 'Account is required';
    }
    
    if (!formData.date) {
      errors.date = 'Date is required';
    }
    
    if (formData.amount === '' || isNaN(formData.amount) || formData.amount <= 0) {
      errors.amount = 'Valid amount is required';
    }
    
    if (!formData.type) {
      errors.type = 'Transaction type is required';
    }
    
    if (!formData.description && !formData.merchant) {
      errors.description = 'Description or merchant is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Adjust amount sign based on transaction type
      const adjustedAmount = formData.type === 'expense' ? -Math.abs(formData.amount) : Math.abs(formData.amount);
      
      const transactionData = {
        ...formData,
        amount: adjustedAmount
      };
      
      if (currentTransaction) {
        dispatch(updateTransaction({ id: currentTransaction._id, transactionData }));
      } else {
        dispatch(createTransaction(transactionData));
      }
      handleCloseDialog();
    }
  };

  const handleDelete = () => {
    if (currentTransaction) {
      dispatch(deleteTransaction(currentTransaction._id));
      handleCloseDeleteDialog();
    }
  };

  const handleFilterChange = (name, value) => {
    dispatch(updateFilters({ [name]: value }));
  };

  const handleClearFilters = () => {
    dispatch(resetFilters());
  };

  const handleChangePage = (event, newPage) => {
    dispatch(updateFilters({ page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event) => {
    dispatch(updateFilters({ 
      limit: parseInt(event.target.value, 10),
      page: 1
    }));
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(acc => acc._id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Transactions</Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<FilterIcon />}
            onClick={toggleFilterDrawer}
            sx={{ mr: 1 }}
          >
            Filters
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<ImportIcon />}
            sx={{ mr: 1 }}
          >
            Import
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={isLoading}
          >
            Add Transaction
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

      {/* Transactions Table */}
      <Paper elevation={2} sx={{ width: '100%', mb: 3 }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="transactions table">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Account</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No transactions found
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenDialog()}
                      sx={{ mt: 1 }}
                    >
                      Add Transaction
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction._id} hover>
                    <TableCell>
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.description || transaction.merchant}
                      </Typography>
                      {transaction.merchant && transaction.description && (
                        <Typography variant="caption" color="text.secondary">
                          {transaction.merchant}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.category || 'Uncategorized'} 
                        size="small"
                        icon={<CategoryIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      {typeof transaction.accountId === 'object' 
                        ? transaction.accountId.name 
                        : getAccountName(transaction.accountId)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                      >
                        {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDialog(transaction)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDeleteDialog(transaction)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={pagination.total || 0}
          rowsPerPage={pagination.limit || 10}
          page={(pagination.page || 1) - 1}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Floating Action Button for mobile */}
      <Fab 
        color="primary" 
        aria-label="add transaction"
        sx={{ position: 'fixed', bottom: 16, right: 16, display: { sm: 'none' } }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Add/Edit Transaction Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{currentTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!formErrors.accountId}>
                <InputLabel>Account</InputLabel>
                <Select
                  name="accountId"
                  value={formData.accountId}
                  onChange={handleChange}
                  label="Account"
                >
                  {accounts.map((account) => (
                    <MenuItem value={account._id} key={account._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountIcon sx={{ mr: 1 }} />
                        {account.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.accountId && (
                  <Typography variant="caption" color="error">
                    {formErrors.accountId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      required
                      error={!!formErrors.date}
                      helperText={formErrors.date}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
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
              <FormControl fullWidth required error={!!formErrors.type}>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  label="Transaction Type"
                >
                  <MenuItem value="expense">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ExpenseIcon sx={{ mr: 1, color: 'error.main' }} />
                      Expense
                    </Box>
                  </MenuItem>
                  <MenuItem value="income">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IncomeIcon sx={{ mr: 1, color: 'success.main' }} />
                      Income
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={categories.map(category => category.name)}
                value={formData.category}
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    category: newValue || ''
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    name="category"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Subcategory"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                error={!!formErrors.description && !formData.merchant}
                helperText={formErrors.description && !formData.merchant ? formErrors.description : ''}
                required={!formData.merchant}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Merchant"
                name="merchant"
                value={formData.merchant}
                onChange={handleChange}
                error={!!formErrors.description && !formData.description}
                helperText={formErrors.description && !formData.description ? 'Merchant or description is required' : ''}
                required={!formData.description}
              />
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Add Tags"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleAddTag} edge="end">
                        <AddIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {currentTransaction ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Transaction</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={openFilterDrawer}
        onClose={toggleFilterDrawer}
        sx={{
          '& .MuiDrawer-paper': { width: { xs: '100%', sm: 340 } },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Filters</Typography>
            <IconButton onClick={toggleFilterDrawer}>
              <ClearIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <List>
            {/* Date Filter */}
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleExpandFilter('date')}>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText primary="Date Range" />
                {expandedFilters.date ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={expandedFilters.date} timeout="auto" unmountOnExit>
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Start Date"
                        value={filters.startDate ? new Date(filters.startDate) : null}
                        onChange={(date) => handleFilterChange('startDate', date ? date.toISOString() : null)}
                        renderInput={(params) => (
                          <TextField {...params} fullWidth size="small" />
                        )}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="End Date"
                        value={filters.endDate ? new Date(filters.endDate) : null}
                        onChange={(date) => handleFilterChange('endDate', date ? date.toISOString() : null)}
                        renderInput={(params) => (
                          <TextField {...params} fullWidth size="small" />
                        )}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
            
            {/* Amount Filter */}
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleExpandFilter('amount')}>
                <ListItemIcon>
                  <ReceiptIcon />
                </ListItemIcon>
                <ListItemText primary="Amount" />
                {expandedFilters.amount ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={expandedFilters.amount} timeout="auto" unmountOnExit>
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Min"
                      type="number"
                      size="small"
                      value={filters.minAmount || ''}
                      onChange={(e) => handleFilterChange('minAmount', e.target.value ? parseFloat(e.target.value) : null)}
                      InputProps={{
                        startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Max"
                      type="number"
                      size="small"
                      value={filters.maxAmount || ''}
                      onChange={(e) => handleFilterChange('maxAmount', e.target.value ? parseFloat(e.target.value) : null)}
                      InputProps={{
                        startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
            
            {/* Category Filter */}
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleExpandFilter('category')}>
                <ListItemIcon>
                  <CategoryIcon />
                </ListItemIcon>
                <ListItemText primary="Category" />
                {expandedFilters.category ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={expandedFilters.category} timeout="auto" unmountOnExit>
              <Box sx={{ p: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Transaction Type</InputLabel>
                  <Select
                    value={filters.type || ''}
                    onChange={(e) => handleFilterChange('type', e.target.value || null)}
                    label="Transaction Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="expense">Expense</MenuItem>
                    <MenuItem value="income">Income</MenuItem>
                  </Select>
                </FormControl>
                <Autocomplete
                  sx={{ mt: 2 }}
                  options={categories.map(category => category.name)}
                  value={filters.category || null}
                  onChange={(event, newValue) => handleFilterChange('category', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Category"
                      size="small"
                      fullWidth
                    />
                  )}
                />
              </Box>
            </Collapse>
            
            {/* Account Filter */}
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleExpandFilter('account')}>
                <ListItemIcon>
                  <AccountIcon />
                </ListItemIcon>
                <ListItemText primary="Account" />
                {expandedFilters.account ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={expandedFilters.account} timeout="auto" unmountOnExit>
              <Box sx={{ p: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Account</InputLabel>
                  <Select
                    value={filters.accountId || ''}
                    onChange={(e) => handleFilterChange('accountId', e.target.value || null)}
                    label="Account"
                  >
                    <MenuItem value="">All Accounts</MenuItem>
                    {accounts.map((account) => (
                      <MenuItem value={account._id} key={account._id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Collapse>
            
            {/* Search */}
            <ListItem sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Search"
                size="small"
                value={filters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value || null)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </ListItem>
          </List>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              onClick={handleClearFilters}
              startIcon={<ClearIcon />}
            >
              Clear Filters
            </Button>
            <Button 
              variant="contained" 
              onClick={toggleFilterDrawer}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Transactions;
