# CeDeFi Voting System

A hybrid financial transaction authorization system combining Centralized Banks and Decentralized Blockchain Consensus.

## Project Structure
- `bank-service/`: Centralized Bank Microservice (Runs multiple instances)
- `main-system/`:
  - `chain/`: Hardhat Blockchain Project (Smart Contracts)
  - `backend/`: Node.js/Express Backend (Consensus Engine)
  - `frontend/`: React/Vite Frontend (Dashboard & Simulator)

## Prerequisites
- Node.js (v16+)
- MongoDB (Running locally on default port 27017)

## Setup & Run Instructions

### 1. Install Dependencies
Run `npm install` in all directories:
```bash
cd bank-service && npm install
cd ../main-system/chain && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

### 2. Start Blockchain Network
Open a terminal:
```bash
cd main-system/chain
npx hardhat node
```

### 3. Deploy Smart Contracts
Open a new terminal:
```bash
cd main-system/chain
npx hardhat run scripts/deploy.js --network localhost
```
*Note the deployed addresses if you need to update them in backend config (currently backend assumes local defaults or needs env vars).*

### 4. Start Bank Services
Open a new terminal.

**Windows:**
```bash
cd bank-service
start-banks.bat
```

**Linux/macOS:**
```bash
cd bank-service
chmod +x start-banks.sh
./start-banks.sh
```

This will launch 3 bank instances on ports 3001, 3002, 3003.

### 5. Start Main Backend
Open a new terminal:
```bash
cd main-system/backend
npm start
```

### 6. Start Frontend
Open a new terminal:
```bash
cd main-system/frontend
npm run dev
```
Access the UI at `http://localhost:5173`.

## Usage Flow
1.  Go to **Simulator** page and "Register New Node" to add nodes to the network.
2.  Go to **Transactions** page and create a new transaction.
3.  The backend automatically requests approval from Banks.
4.  Go to **Simulator** page to cast votes from registered nodes.
5.  Watch the status change to APPROVED once consensus is reached (Rule A or Rule B).

## Quick Start (All-in-One)
Instead of opening multiple terminals, use the master startup script:

**Linux/macOS:**
```bash
chmod +x start-all.sh
./start-all.sh
```

This will start all services in order:
1. Hardhat Blockchain Node
2. Deploy Smart Contracts
3. Bank Services (3 instances)
4. Backend API
5. Frontend UI

Then open **http://localhost:5173** in your browser.

To stop all services:
```bash
./stop-all.sh
```

## Troubleshooting

### Port Already in Use
If you see `EADDRINUSE` errors, kill lingering processes:
```bash
pkill -f "npm start" || true
pkill -f "npm run dev" || true
pkill -f "hardhat node" || true
```

### MongoDB Connection Error
Ensure MongoDB is running:
```bash
# Check if running
mongosh --eval "db.adminCommand('ping')"

# If not running, start it (Linux)
sudo systemctl start mongodb
# Or (macOS with Homebrew)
brew services start mongodb-community
```

### Contract Addresses Not Found
If `backend/src/config/contracts.json` is missing, redeploy:
```bash
cd main-system/chain
npx hardhat node &
sleep 2
npm run deploy
```
