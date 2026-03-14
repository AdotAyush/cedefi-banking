# CeDeFi Banking System - Project Structure

## Project Overview

CeDeFi Banking is a decentralized finance (DeFi) voting system that integrates traditional banking with blockchain technology. The system allows banks to collaborate in a voting mechanism for transactions and node management through smart contracts.

**Tech Stack:**
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Blockchain:** Hardhat + Solidity
- **Database:** MongoDB
- **Smart Contracts:** EVM-compatible (Ethereum Virtual Machine)

---

## 📁 Directory Structure

```
cedefi-banking/
├── BANK_ADMIN_ACCESS.md          # Bank admin credentials/documentation
├── README.md                       # Project README
├── package.json                    # Root package config
├── start-all.sh                    # Main startup script (Bash - for Linux/macOS)
├── stop-all.sh                     # Shutdown script
├── startup.log                     # Startup logs
│
├── bank-service/                   # Bank-specific microservice
│   ├── server.js                   # Bank service backend entry point
│   ├── package.json
│   ├── start-banks.sh              # Script to start multiple bank instances
│   ├── stop-banks.sh
│   ├── logs/                       # Bank service logs
│   │
│   ├── frontend/                   # Bank admin dashboard frontend
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   └── src/
│   │       ├── main.jsx            # Vite entry point
│   │       ├── App.jsx             # Main React component
│   │       ├── index.css           # Global styles
│   │       └── components/
│   │           ├── Dashboard.jsx   # Bank dashboard
│   │           ├── NodeManagement.jsx  # Node management UI
│   │           └── Settings.jsx    # Settings page
│   │
│   └── src/                        # Bank backend source code
│       ├── controllers/
│       │   └── bankController.js   # Bank business logic
│       ├── routes/
│       │   └── bankRoutes.js       # Bank API routes
│       ├── services/
│       │   └── validatorService.js # Transaction validation
│       └── utils/
│           └── crypto.js           # Cryptographic utilities
│
├── main-system/                    # Main system (core voting & transaction)
│   │
│   ├── frontend/                   # Main system frontend (User-facing)
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── jsconfig.json
│   │   ├── vite.config.js
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   └── src/
│   │       ├── main.jsx            # Vite entry point
│   │       ├── App.jsx             # Main React component
│   │       ├── index.css           # Global styles
│   │       ├── components/
│   │       │   ├── Layout.jsx      # Page layout wrapper
│   │       │   ├── Sidebar.jsx     # Navigation sidebar
│   │       │   ├── Topbar.jsx      # Top navigation bar
│   │       │   ├── OTPInput.jsx    # OTP input component
│   │       │   ├── ExistingUserDialog.jsx
│   │       │   ├── auth/           # Authentication components
│   │       │   └── ui/             # UI components (buttons, cards, etc.)
│   │       ├── pages/              # Page components
│   │       │   ├── Login.jsx       # User login
│   │       │   ├── Register.jsx    # User registration
│   │       │   ├── Dashboard.jsx   # Main dashboard
│   │       │   ├── Transactions.jsx  # Transaction history
│   │       │   ├── History.jsx     # Account history
│   │       │   ├── Analytics.jsx   # Analytics & charts
│   │       │   ├── Simulator.jsx   # Transaction simulator
│   │       │   └── Settings.jsx    # User settings
│   │       ├── context/
│   │       │   └── AuthContext.jsx # Global auth state management
│   │       ├── lib/
│   │       │   └── utils.js        # Utility functions
│   │       └── utils/              # Additional utilities
│   │
│   ├── backend/                    # Main system backend (API server)
│   │   ├── app.js                  # Express app entry point
│   │   ├── drop_index.js           # MongoDB index management
│   │   ├── package.json
│   │   │
│   │   └── src/
│   │       ├── config/
│   │       │   ├── db.js           # MongoDB connection
│   │       │   └── contracts.json  # Deployed contract addresses
│   │       │
│   │       ├── controllers/        # Business logic handlers
│   │       │   ├── authController.js   # Authentication (login, register, OTP)
│   │       │   ├── nodeController.js   # Node management
│   │       │   └── transactionController.js  # Transaction processing
│   │       │
│   │       ├── models/             # MongoDB data models
│   │       │   ├── User.js         # User profile schema
│   │       │   ├── Node.js         # Blockchain node schema
│   │       │   ├── Transaction.js  # Transaction schema
│   │       │   └── OTP.js          # One-time password schema
│   │       │
│   │       ├── routes/             # API route definitions
│   │       │   ├── authRoutes.js   # Auth endpoints (/api/auth/*)
│   │       │   ├── nodeRoutes.js   # Node endpoints (/api/nodes/*)
│   │       │   └── transactionRoutes.js  # Transaction endpoints (/api/transactions/*)
│   │       │
│   │       └── services/           # Service layer (business logic)
│   │           ├── authService.js  # Auth business logic
│   │           ├── BankIntegrationService.js  # Bank communication
│   │           ├── BlockchainService.js  # Smart contract interaction
│   │           ├── ConsensusService.js   # Voting consensus logic
│   │           ├── emailService.js   # Email notifications
│   │           ├── otpService.js      # OTP generation & validation
│   │           └── smsService.js      # SMS notifications
│   │
│   ├── chain/                      # Blockchain layer (Smart contracts)
│   │   ├── hardhat.config.js       # Hardhat configuration
│   │   ├── package.json
│   │   │
│   │   ├── contracts/              # Solidity smart contracts
│   │   │   ├── NodeRegistry.sol    # Node registration & management
│   │   │   ├── VoteManager.sol     # Voting mechanism
│   │   │   ├── TransactionStore.sol  # Transaction storage
│   │   │   └── BankApproval.sol    # Bank approval logic
│   │   │
│   │   ├── scripts/
│   │   │   └── deploy.js           # Contract deployment script
│   │   │
│   │   ├── artifacts/              # Compiled contract artifacts
│   │   │   ├── build-info/         # Build metadata
│   │   │   └── contracts/          # Compiled ABI files
│   │   │
│   │   └── cache/                  # Hardhat cache files
│   │
│   └── docs/
│       └── architecture.md         # System architecture documentation
```

---

## 🔄 System Architecture

### Components Interaction Flow

```
┌─────────────────────────────────────────────────────────┐
│                  User Interface Layer                    │
├─────────────────────────────────────────────────────────┤
│  Frontend (React)     │      Bank Frontend (React)       │
│  Port: 5175          │      Port: 5174                   │
│  - Dashboard         │      - Admin Panel                │
│  - Transactions      │      - Node Management            │
│  - Analytics         │      - Settings                   │
└──────────────┬───────────────────────┬──────────────────┘
               │                       │
               ▼                       ▼
┌─────────────────────────────────────────────────────────┐
│                   API Layer (Express)                    │
├─────────────────────────────────────────────────────────┤
│  Backend Server          │   Bank Service                │
│  Port: 5000             │   Port: 3001, 3002, 3003      │
│  - Auth Routes          │   - Bank-specific endpoints    │
│  - Transaction Routes   │   - Validation                 │
│  - Node Routes          │   - Crypto operations          │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────────────────────────────────────────┐
│               Service Layer (Business Logic)              │
├──────────────────────────────────────────────────────────┤
│  - BlockchainService (Contract interaction)              │
│  - ConsensusService (Voting logic)                       │
│  - BankIntegrationService (Inter-bank communication)     │
│  - AuthService, OTPService, EmailService                │
└──────────────┬────────────────────────────────────────┬──┘
               │                                        │
               ▼                                        ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   Data Layer (MongoDB)   │    │  Blockchain Layer        │
├──────────────────────────┤    ├──────────────────────────┤
│ - User Collection        │    │ Hardhat Node             │
│ - Node Collection        │    │ Port: 8545               │
│ - Transaction Collection │    │                          │
│ - OTP Collection         │    │ Smart Contracts:         │
│ - Bank Integration Data  │    │ - NodeRegistry.sol       │
│                          │    │ - VoteManager.sol        │
│                          │    │ - TransactionStore.sol   │
│                          │    │ - BankApproval.sol       │
└──────────────────────────┘    └──────────────────────────┘
```

---

## 🚀 Starting the Project

### Windows (PowerShell)

```powershell
# Install all dependencies
cd cedefi-banking
npm install
cd bank-service && npm install && cd ../main-system/backend && npm install && cd ../frontend && npm install && cd ../chain && npm install

# Start services individually (as shown in the terminal contexts):
# Terminal 1: Backend
cd main-system/backend
npm start

# Terminal 2: Frontend
cd main-system/frontend
npm run dev

# Terminal 3: Bank Service Backend
cd bank-service
node server.js

# Terminal 4: Bank Service Frontend
cd bank-service/frontend
npm run dev

# Terminal 5 (Optional): Hardhat blockchain
cd main-system/chain
npx hardhat node
```

### Prerequisites

- **Node.js** v16+ (v22.22.0 installed)
- **MongoDB** (running on localhost:27017)
- **npm** package manager
- Port availability: 5000, 5173-5175, 3001-3003, 8545

---

## 📋 API Endpoints

### Authentication Endpoints
```
POST   /api/auth/register       - User registration
POST   /api/auth/login          - User login
POST   /api/auth/verify-otp     - OTP verification
GET    /api/auth/logout         - User logout
```

### Transaction Endpoints
```
GET    /api/transactions        - Get user transactions
POST   /api/transactions        - Create new transaction
GET    /api/transactions/:id    - Get transaction details
PUT    /api/transactions/:id    - Update transaction
DELETE /api/transactions/:id    - Delete transaction
```

### Node Endpoints
```
GET    /api/nodes              - List all nodes
POST   /api/nodes              - Register new node
GET    /api/nodes/:id          - Get node details
PUT    /api/nodes/:id          - Update node
DELETE /api/nodes/:id          - Delete node
```

---

## 🔗 Smart Contracts Overview

### NodeRegistry.sol
- **Purpose:** Register and manage blockchain nodes
- **Functions:** registerNode(), getNode(), updateNode(), removeNode()

### VoteManager.sol
- **Purpose:** Handle voting mechanism for transaction approval
- **Functions:** createVote(), castVote(), tallVotes(), getVoteStatus()

### TransactionStore.sol
- **Purpose:** Store and track transaction data on-chain
- **Functions:** storeTransaction(), getTransaction(), updateStatus()

### BankApproval.sol
- **Purpose:** Manage bank approval requirements
- **Functions:** approveBankTransaction(), checkBankStatus()

---

## 🔐 Key Configuration Files

### `main-system/chain/contracts.json`
Contains deployed smart contract addresses for the current network:
```json
{
  "NodeRegistry": "0x...",
  "VoteManager": "0x...",
  "BankApproval": "0x...",
  "TransactionStore": "0x..."
}
```

### `main-system/backend/src/config/db.js`
MongoDB connection configuration - connects to localhost:27017

### Hardhat Config (`main-system/chain/hardhat.config.js`)
- Local network: localhost:8545
- Chain ID: 1337
- Solidity version: 0.8.20

---

## 📊 Database Models (MongoDB)

### User Schema
```
- email (unique)
- password (hashed)
- firstName, lastName
- phone
- address
- role (user/admin/bank)
- createdAt
- updatedAt
```

### Transaction Schema
```
- from (User ID)
- to (User ID)
- amount
- status (pending/approved/rejected)
- bankApprovals (array of bank approvals)
- timestamp
- hash (blockchain hash)
```

### Node Schema
```
- nodeAddress (blockchain address)
- nodeType (validator/standard)
- bankId
- status (active/inactive)
- registeredAt
- lastHeartbeat
```

### OTP Schema
```
- userId
- code
- expiresAt
- used (boolean)
- createdAt
```

---

## 🔄 Data Flow Example: User Transaction

1. **User submits transaction** → Frontend sends to `/api/transactions` (Backend)
2. **Backend validates** → AuthService checks user, OTPService validates OTP
3. **Create transaction record** → Saved to MongoDB
4. **Send to banks** → BankIntegrationService notifies banks
5. **Banks vote** → Via BlockchainService → VoteManager.sol
6. **Consensus reached** → Transaction stored in TransactionStore.sol
7. **Update status** → Backend updates MongoDB record
8. **Notify user** → EmailService sends confirmation

---

## 🛠️ Environment Variables (if used)

Create `.env` files in:
- `main-system/backend/.env`
- `bank-service/.env`

Common variables:
```
MONGODB_URI=mongodb://localhost:27017/cedefi
JWT_SECRET=your_secret_key
BLOCKCHAIN_RPC_URL=http://localhost:8545
EMAIL_SERVICE_KEY=your_email_key
SMS_SERVICE_KEY=your_sms_key
```

---

## 📝 Important Notes for Developers

1. **Blockchain Deployment:**
   - Run `npm run deploy` in `main-system/chain` to deploy contracts
   - Contract addresses are saved to `contracts.json`

2. **MongoDB Required:**
   - Start MongoDB before running the backend
   - Collections are auto-created on first use

3. **Port Management:**
   - Ensure all required ports are free before starting
   - Use `stop-all.sh` to cleanly shutdown (on Linux/macOS)
   - On Windows, manually kill processes or use task manager

4. **Bank Services:**
   - Multiple bank instances can run on 3001, 3002, 3003
   - Each bank has its own frontend and backend

5. **File Modifications:**
   - Smart contracts → Redeploy with `npm run deploy`
   - Backend code → Restart `npm start`
   - Frontend code → Auto-reloads via Vite

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection refused | Start MongoDB with `mongod` |
| Port already in use | Kill process or change port in config |
| Hardhat node failed | Ensure Node.js v16+ installed, check Hardhat config |
| Frontend blank page | Check browser console, restart Vite server |
| Smart contracts not found | Run `npm run deploy` in chain directory |
| OTP not received | Check emailService.js configuration |

---

## 📚 Key Files to Modify

When making changes, refer to these key files:

- **Add new API endpoint** → Modify `main-system/backend/src/routes/*.js`
- **Change business logic** → Modify `main-system/backend/src/services/*.js`
- **Update UI** → Modify React components in `*/src/components/` or `*/src/pages/`
- **Add smart contract function** → Modify `main-system/chain/contracts/*.sol` and redeploy
- **Change data schema** → Modify `main-system/backend/src/models/*.js`
- **Add bank functionality** → Modify `bank-service/src/`

---

**Last Updated:** March 14, 2026  
**Project Status:** Running and Deployed
