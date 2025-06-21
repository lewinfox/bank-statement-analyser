# Personal Finance Dashboard

A Node.js application for managing and categorizing personal bank transactions from CSV files.

## Project Overview

This is a personal finance dashboard that allows users to:
- Upload and parse bank transaction CSV files
- Automatically deduplicate transactions using hash-based detection
- Categorize transactions with user-specific categories
- View and manage transaction history
- User authentication with secure password hashing

## Architecture

### Backend (Node.js + Express)
- **Express server** (`server.js`) - Main application entry point
- **Prisma ORM** with SQLite database for data persistence
- **Services layer** for business logic:
  - `UserService` - User management, authentication, password hashing
  - `TransactionService` - Transaction CRUD, deduplication, hash generation
- **bcrypt** for secure password hashing (12 salt rounds)

### Database Schema
- **Users** - Authentication and user management
- **Transactions** - Bank transaction data with hash-based deduplication
- **Categories** - User-specific transaction categories
- **TransactionCategory** - Many-to-many relationship for transaction categorization

Key features:
- Snake_case field naming convention
- Composite unique constraint on `(user_id, transaction_hash)` for deduplication
- Cascade deletion for data integrity

### Frontend
- Minimal HTML/CSS/JavaScript (no frameworks)
- Located in `public/` directory
- Focuses on functionality over aesthetics

## Key Technical Decisions

### Transaction Deduplication
Uses SHA-256 hashing of transaction data (excluding user_id) to detect duplicates:
- Same transaction can exist for different users
- Prevents duplicate imports for the same user
- Hash includes: type, details, particulars, code, reference, amount, date, foreign currency fields

### Testing Strategy
- Jest test framework with global setup/teardown
- Serial test execution (`--runInBand`) to avoid concurrency issues
- Shared test helpers for unique username generation
- **No database cleaning** during tests - uses unique usernames for isolation
- Comprehensive unit tests for services layer

### Security
- Password hashing with bcrypt (12 salt rounds)
- User-specific data isolation
- Input validation and sanitization

## Development Workflow

### Running Tests
```bash
npm test                           # Run all tests
npm test -- tests/userService.test.js    # Run specific test file
```

### Database Management
```bash
npx prisma migrate dev            # Apply migrations
npx prisma generate              # Regenerate Prisma client
npx prisma studio               # Database GUI
```

### Code Standards
- Snake_case for database fields
- Consistent error handling
- Comprehensive test coverage
- Addd docstrings for all functions
- Directory-level README.md files should be created to explain what the code in each dir does, and
  how it fits into the architecture of the project as a whole.

## File Structure
```
├── server/
│   ├── services/
│   │   ├── userService.js       # User management & auth
│   │   └── transactionService.js # Transaction operations
│   └── server.js               # Express app
├── tests/
│   ├── userService.test.js     # User service tests
│   ├── transactionService.test.js # Transaction service tests
│   ├── test-helpers.js         # Shared test utilities
│   └── database-fixtures.js    # Test database setup
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── public/                     # Frontend assets
└── package.json               # Dependencies & scripts
```

## Future Features
- CSV file upload and parsing
- Category management interface
- Transaction categorization UI
- Docker deployment
- Enhanced frontend with better UX

## Testing Notes
- Tests use unique usernames to avoid conflicts in parallel execution
- No database cleaning between tests - data persists for isolation
- Global Jest setup handles database initialization
- All services have comprehensive unit test coverage
