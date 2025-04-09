# Personal Finance Manager - Database Schema

## Overview
This document outlines the MongoDB schema design for the Personal Finance Manager application.

## Collections

### 1. Users
```javascript
{
  _id: ObjectId,
  email: String,
  password: String,  // Hashed
  firstName: String,
  lastName: String,
  createdAt: Date,
  updatedAt: Date,
  settings: {
    currency: String,
    dateFormat: String,
    theme: String
  },
  socialLogins: [
    {
      provider: String,  // "google", "facebook", etc.
      providerId: String,
      email: String,
      lastLogin: Date
    }
  ],
  isVerified: Boolean,
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}
```

### 2. Accounts
```javascript
{
  _id: ObjectId,
  userId: ObjectId,  // Reference to Users collection
  name: String,
  type: String,  // "bank", "credit", "investment", etc.
  institution: String,
  balance: Number,
  currency: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  lastSynced: Date,
  accountNumber: String,  // Masked for security
  connectionId: ObjectId,  // Reference to Connections collection
  metadata: {
    color: String,
    icon: String,
    order: Number
  }
}
```

### 3. Transactions
```javascript
{
  _id: ObjectId,
  userId: ObjectId,  // Reference to Users collection
  accountId: ObjectId,  // Reference to Accounts collection
  date: Date,
  amount: Number,
  type: String,  // "income", "expense", "transfer"
  category: String,
  subcategory: String,
  description: String,
  merchant: String,
  isRecurring: Boolean,
  recurringId: ObjectId,  // Reference to RecurringTransactions collection
  tags: [String],
  notes: String,
  createdAt: Date,
  updatedAt: Date,
  externalId: String,  // ID from banking API
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  attachments: [
    {
      name: String,
      url: String,
      type: String,
      size: Number
    }
  ]
}
```

### 4. Categories
```javascript
{
  _id: ObjectId,
  userId: ObjectId,  // Reference to Users collection
  name: String,
  type: String,  // "income", "expense"
  icon: String,
  color: String,
  isDefault: Boolean,
  parentId: ObjectId,  // For subcategories
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Budgets
```javascript
{
  _id: ObjectId,
  userId: ObjectId,  // Reference to Users collection
  name: String,
  amount: Number,
  period: String,  // "monthly", "yearly", etc.
  startDate: Date,
  endDate: Date,
  categories: [
    {
      categoryId: ObjectId,  // Reference to Categories collection
      amount: Number
    }
  ],
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean,
  rollover: Boolean,  // Whether unused budget rolls over to next period
  notifications: {
    enabled: Boolean,
    threshold: Number  // Percentage at which to notify
  }
}
```

### 6. Goals
```javascript
{
  _id: ObjectId,
  userId: ObjectId,  // Reference to Users collection
  name: String,
  targetAmount: Number,
  currentAmount: Number,
  startDate: Date,
  targetDate: Date,
  category: String,  // "retirement", "house", "education", etc.
  priority: String,  // "high", "medium", "low"
  accounts: [ObjectId],  // References to Accounts collection
  createdAt: Date,
  updatedAt: Date,
  isCompleted: Boolean,
  notes: String,
  icon: String
}
```

### 7. Connections
```javascript
{
  _id: ObjectId,
  userId: ObjectId,  // Reference to Users collection
  provider: String,  // "truelayer", etc.
  accessToken: String,  // Encrypted
  refreshToken: String,  // Encrypted
  expiresAt: Date,
  institutionId: String,
  institutionName: String,
  status: String,  // "active", "expired", "revoked"
  createdAt: Date,
  updatedAt: Date,
  lastSynced: Date,
  consentId: String,
  metadata: Object  // Provider-specific data
}
```

### 8. Reports
```javascript
{
  _id: ObjectId,
  userId: ObjectId,  // Reference to Users collection
  name: String,
  type: String,  // "income", "expense", "netWorth", etc.
  period: String,  // "monthly", "yearly", etc.
  startDate: Date,
  endDate: Date,
  createdAt: Date,
  filters: Object,
  isFavorite: Boolean,
  lastGenerated: Date,
  data: Object  // Cached report data
}
```

### 9. Notifications
```javascript
{
  _id: ObjectId,
  userId: ObjectId,  // Reference to Users collection
  type: String,  // "budget", "goal", "bill", etc.
  message: String,
  isRead: Boolean,
  createdAt: Date,
  relatedId: ObjectId,  // Reference to related entity
  relatedType: String,  // Collection name of related entity
  priority: String,  // "high", "medium", "low"
  action: String  // Action URL or identifier
}
```

### 10. RecurringTransactions
```javascript
{
  _id: ObjectId,
  userId: ObjectId,  // Reference to Users collection
  accountId: ObjectId,  // Reference to Accounts collection
  amount: Number,
  type: String,  // "income", "expense"
  category: String,
  description: String,
  frequency: String,  // "daily", "weekly", "monthly", "yearly"
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  lastProcessed: Date,
  nextOccurrence: Date,
  dayOfMonth: Number,
  dayOfWeek: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

### Users Collection
- `email`: Unique index
- `socialLogins.providerId`: Index

### Accounts Collection
- `userId`: Index
- `userId` + `type`: Compound index
- `connectionId`: Index

### Transactions Collection
- `userId`: Index
- `accountId`: Index
- `date`: Index
- `userId` + `date`: Compound index
- `userId` + `category`: Compound index
- `externalId`: Unique index

### Categories Collection
- `userId`: Index
- `userId` + `name`: Unique compound index

### Budgets Collection
- `userId`: Index
- `userId` + `period` + `startDate`: Compound index

### Goals Collection
- `userId`: Index
- `targetDate`: Index

### Connections Collection
- `userId`: Index
- `userId` + `provider`: Unique compound index
- `accessToken`: Index

### Reports Collection
- `userId`: Index
- `userId` + `type`: Compound index

### Notifications Collection
- `userId`: Index
- `userId` + `isRead`: Compound index
- `createdAt`: Index

### RecurringTransactions Collection
- `userId`: Index
- `nextOccurrence`: Index
- `userId` + `isActive`: Compound index

## Relationships

- Users -> Accounts: One-to-Many
- Users -> Transactions: One-to-Many
- Users -> Categories: One-to-Many
- Users -> Budgets: One-to-Many
- Users -> Goals: One-to-Many
- Users -> Connections: One-to-Many
- Users -> Reports: One-to-Many
- Users -> Notifications: One-to-Many
- Users -> RecurringTransactions: One-to-Many
- Accounts -> Transactions: One-to-Many
- Categories -> Transactions: One-to-Many
- Connections -> Accounts: One-to-Many
- RecurringTransactions -> Transactions: One-to-Many

## Data Validation

MongoDB schema validation will be implemented to ensure data integrity:
- Required fields
- Data types
- Value ranges
- Enumerated values
- Custom validation rules

## Data Migration Strategy

For future schema changes:
- Versioning of schema changes
- Backward compatibility
- Migration scripts
- Rollback procedures
