# Banking Web Application - Frontend

A modern banking web application frontend built with React + TypeScript + Vite, featuring multi-currency account management, transaction processing, KYC verification, and Two-Factor Authentication (TOTP/2FA).

## Purpose

This is the frontend client for a banking application that allows:
- **Account Holders**: Manage multi-currency accounts, perform transactions (deposit, withdraw, convert), and complete KYC verification
- **Administrators**: Manage users, approve/reject KYC submissions, view audit logs, and run account reconciliation

## Key Features

### Authentication & Security
- **JWT-based authentication** with automatic token refresh on 401
- **Two-Factor Authentication (TOTP/2FA)** using time-based one-time passwords
  - QR code setup with authenticator apps (Google Authenticator, Authy, 1Password)
  - Required for all transactional actions (deposit, withdraw, convert, close account)
  - Account holders must enable 2FA before accessing account features
  - Admins can reset 2FA for any user

### Account Management
- Multi-currency accounts (USD, EUR, GBP)
- Create, view, and close accounts (zero balance required for closing)
- Real-time balance display with transaction history
- Account status management (OPEN/CLOSED)

### Transactions
- **Deposit**: Add funds to accounts with idempotency protection
- **Withdraw**: Remove funds with balance validation
- **Currency Conversion**: Convert funds between accounts with indicative FX rates
  - Real-time FX rate fetching from external API
  - KYC verification required
  - Destination account validation
- **Transaction History**: Paginated view of all account transactions
- All transactions require OTP when 2FA is enabled

### KYC (Know Your Customer)
- Account holders can submit KYC information (full name, country)
- View KYC status (VERIFIED, PENDING, REJECTED)
- Admins can update KYC status for any user

### Admin Features
- **User Management**: Search, list, and view user details
- **KYC Administration**: Approve, reject, or mark KYC as pending
- **Account Reconciliation**: Run and view reconciliation status with mismatch detection
- **Audit Logs**: Filterable audit trail with pagination (by actor, action, date range)
- **2FA Management**: Reset 2FA for any user

### User Experience
- Role-based routing (Account Holders → blue theme, Admins → green theme)
- Responsive design with Tailwind CSS
- Inline error/success alerts
- Confirmation screens for sensitive actions
- Loading states and form validation

## Technology Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router DOM** for client-side routing
- **Axios** for HTTP requests
- **Tailwind CSS v4** for styling
- **Local Storage** for token persistence

## Development Setup

### Prerequisites

- Node.js 20+
- npm or yarn
- Backend API running at `http://localhost:3001/api/v1` (or configure `VITE_API_BASE_URL`)

### Installation

```bash
cd frontend
npm install
```

### Configuration

Create a `.env` file (optional for local dev, defaults to localhost):

```
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output: `dist/`

## Testing Scenarios

### Scenario 1: Account Holder Signup and 2FA Setup

1. **Sign Up**
   - Go to `/signup`
   - Enter email and password
   - Submit → redirected to Security page (2FA required)

2. **Enable 2FA**
   - On `/security`, click "Set up TOTP"
   - Scan QR code with authenticator app (or enter secret manually)
   - Enter 6-digit code from authenticator
   - Submit → redirected to Accounts page

3. **Submit KYC**
   - Navigate to `/kyc` (from navbar)
   - Enter full name and country
   - Submit → status shows "Pending review"

### Scenario 2: Account Holder Account Operations

1. **Create Account**
   - Go to `/accounts`
   - Select currency (USD, EUR, GBP)
   - Click "Create account"
   - Account appears in list

2. **View Account Detail**
   - Click "View" on any account
   - See balance, status, transaction history

3. **Deposit Funds**
   - On account detail page, enter amount
   - Click "Deposit"
   - Review confirmation screen
   - Enter 6-digit OTP from authenticator
   - Confirm → balance updates, transaction appears in history

4. **Withdraw Funds**
   - Enter withdrawal amount (must not exceed balance)
   - Click "Withdraw"
   - Confirm with OTP
   - Balance decreases

5. **Convert Currency**
   - Ensure you have accounts in both source and destination currencies
   - On source account detail, select target currency
   - Enter amount to convert
   - Review FX rate and estimated received amount
   - Confirm with OTP
   - Both account balances update

6. **Close Account**
   - Withdraw all funds first (balance must be 0)
   - Click "Close account" button (now enabled)
   - Confirm with OTP
   - Account status changes to CLOSED

### Scenario 3: Admin Operations

**Prerequisites**: Sign up/login as a user with `ADMIN` role (or update user role in backend)

1. **View Users List**
   - Go to `/admin` (Holders tab)
   - See table of all account holders
   - Search by email/user ID
   - Pagination controls (hidden if only one page)

2. **View User Detail**
   - Click on any user row
   - See user info, KYC status, 2FA status, and accounts list

3. **Update KYC Status**
   - On user detail page, use buttons:
     - "Verify" → sets KYC to VERIFIED
     - "Reject" → sets KYC to REJECTED
     - "Mark pending" → sets KYC to PENDING

4. **Reset User 2FA**
   - On user detail page, click "Reset 2FA"
   - Confirm → user must reconfigure 2FA

5. **Run Reconciliation**
   - Go to `/admin` → Reconcile tab
   - Click "Run Reconcile"
   - View mismatches table (if any)
   - Click "Refresh Status" to check current state
   - Green "Mismatches: 0" or red with count

6. **View Audit Logs**
   - Go to `/admin` → Audit tab
   - Filter by actor ID, action, or date range
   - Use pagination to navigate results

### Scenario 4: Error Handling

1. **Invalid OTP**
   - Try a transaction with wrong OTP code
   - See error: "Invalid code. Try again."

2. **Insufficient Balance**
   - Attempt withdrawal exceeding balance
   - See inline error at top of page

3. **KYC Required**
   - Try currency conversion with KYC status PENDING/REJECTED
   - See error: "KYC verification required" with link to KYC page

4. **Missing Destination Account**
   - Try converting to a currency without an account
   - See error prompting to create destination account

5. **2FA Not Enabled**
   - Attempt transaction (should be blocked by route guard)
   - Redirected to `/security` to enable 2FA

### Scenario 5: Session Management

1. **Token Refresh**
   - Use app normally until access token expires
   - Next API call triggers automatic refresh
   - No user interruption

2. **Logout**
   - Click logout in navbar
   - Redirected to home page
   - Tokens cleared from storage

## Deploy to Vercel via GitHub Actions

### 1) Create Vercel Project and Token

1. Create a project in Vercel for this `frontend/` app
2. Get values from Vercel → Project Settings:
   - `VERCEL_PROJECT_ID`
   - `VERCEL_ORG_ID`
3. Create a personal token at Vercel → Account Settings → Tokens (`VERCEL_TOKEN`)

### 2) Add GitHub Secrets

In your GitHub repo → Settings → Secrets → Actions, add:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VITE_API_BASE_URL` (e.g., `https://your-backend.example.com/api/v1`)

### 3) GitHub Actions Workflow

The workflow file is already created at `.github/workflows/vercel-deploy.yml`. It will:
- Build the app with `VITE_API_BASE_URL` from secrets
- Deploy `frontend/dist` to Vercel on push to `main`

### 4) Backend CORS Configuration

Ensure your backend CORS settings allow your Vercel domain (and any custom domains added in Vercel).

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client with auth interceptors
│   ├── auth/              # Auth context and hooks
│   ├── components/        # Reusable components (Alert, etc.)
│   ├── pages/             # Page components
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Kyc.tsx
│   │   ├── AccountsList.tsx
│   │   ├── AccountDetail.tsx
│   │   ├── Security.tsx       # 2FA setup
│   │   ├── Admin.tsx
│   │   ├── AdminUserDetail.tsx
│   │   ├── AdminReconcile.tsx
│   │   └── AdminAudit.tsx
│   ├── types.ts           # TypeScript interfaces
│   ├── App.tsx            # Main app with navbar
│   └── main.tsx           # Entry point with routing
├── .github/workflows/     # CI/CD workflows
└── README.md

```

## API Integration

The frontend expects a backend API at `VITE_API_BASE_URL` with the following endpoints:

- **Auth**: `/auth/signup`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`
- **KYC**: `/kyc/submit`, `/kyc/status`, `/kyc/admin/:userId/status`
- **Accounts**: `/accounts` (POST, GET), `/accounts/:accountId` (GET, PATCH, DELETE)
- **Transactions**: `/accounts/:accountId/deposits`, `/accounts/:accountId/withdrawals`, `/accounts/:accountId/transactions`, `/accounts/:accountId/convert`
- **MFA**: `/mfa/totp/setup`, `/mfa/totp/enable`
- **Admin**: `/admin/users`, `/admin/users/:userId`, `/admin/users/:userId/totp/reset`, `/admin/reconcile/run`, `/admin/reconcile/status`, `/admin/audit`

All endpoints return error responses in format: `{ error: { code, message } }`

## License

MIT
