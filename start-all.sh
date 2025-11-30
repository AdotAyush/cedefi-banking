#!/usr/bin/env bash
#
# Master startup script for CeDeFi Voting System
# Starts all services in the correct order with proper logging
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STARTUP_LOG="startup.log"
PIDS_DIR="./.pids"
mkdir -p "$PIDS_DIR"

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$STARTUP_LOG"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$STARTUP_LOG"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$STARTUP_LOG"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$STARTUP_LOG"
}

cleanup() {
  log_warn "Stopping all services..."
  pkill -P $$ || true
  sleep 1
  log_info "Cleanup complete"
}

trap cleanup EXIT INT TERM

# Check prerequisites
log_info "Checking prerequisites..."

# MongoDB
if ! command -v mongosh &> /dev/null; then
  log_error "MongoDB CLI (mongosh) not found. Install MongoDB or mongosh."
  exit 1
fi

if ! mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
  log_error "MongoDB is not running. Please start MongoDB: mongod or systemctl start mongod"
  exit 1
fi
log_success "MongoDB is running"

# Node.js
if ! command -v node &> /dev/null; then
  log_error "Node.js not found. Install Node.js v16+."
  exit 1
fi
NODE_VERSION=$(node -v)
log_success "Node.js $NODE_VERSION available"

# Check all directories exist
for dir in bank-service main-system/chain main-system/backend main-system/frontend; do
  if [ ! -d "$dir" ]; then
    log_error "Directory $dir not found"
    exit 1
  fi
done
log_success "All directories exist"

check_port() {
  local port=$1
  local name=$2
  if lsof -i:$port -t >/dev/null 2>&1 || fuser $port/tcp >/dev/null 2>&1; then
    log_error "Port $port ($name) is already in use. Run ./stop-all.sh first."
    exit 1
  fi
}

# Check ports
log_info "Checking ports..."
check_port 8545 "Hardhat"
check_port 3001 "Bank A"
check_port 5000 "Backend"
check_port 5173 "Frontend"
check_port 5174 "Bank Frontend"
log_success "Ports are free"

# Step 1: Start Hardhat Node
log_info "Step 1/6: Starting Hardhat blockchain node..."
cd main-system/chain
if npx hardhat node > "$SCRIPT_DIR/$PIDS_DIR/hardhat.log" 2>&1 &
then
  HARDHAT_PID=$!
  echo "$HARDHAT_PID" > "$SCRIPT_DIR/$PIDS_DIR/hardhat.pid"
  sleep 3
  if kill -0 "$HARDHAT_PID" 2>/dev/null; then
    log_success "Hardhat node started (PID: $HARDHAT_PID)"
  else
    log_error "Hardhat node failed to start. Check $PIDS_DIR/hardhat.log"
    exit 1
  fi
else
  log_error "Failed to start Hardhat node"
  exit 1
fi
cd "$SCRIPT_DIR"

# Step 2: Deploy Smart Contracts
log_info "Step 2/6: Deploying smart contracts..."
cd main-system/chain
if npm run deploy > "$SCRIPT_DIR/$PIDS_DIR/deploy.log" 2>&1; then
  log_success "Smart contracts deployed"
else
  log_error "Deployment failed. Check $PIDS_DIR/deploy.log"
  exit 1
fi
cd "$SCRIPT_DIR"

# Step 3: Start Bank Services
log_info "Step 3/6: Starting bank services..."
cd bank-service
if bash start-banks.sh > "$SCRIPT_DIR/$PIDS_DIR/banks.log" 2>&1; then
  sleep 2
  log_success "Bank services started (3001, 3002, 3003)"
else
  log_error "Bank services failed to start. Check $PIDS_DIR/banks.log"
  exit 1
fi
cd "$SCRIPT_DIR"

# Step 4: Start Backend
log_info "Step 4/6: Starting backend..."
cd main-system/backend
if npm start > "$SCRIPT_DIR/$PIDS_DIR/backend.log" 2>&1 &
then
  BACKEND_PID=$!
  echo "$BACKEND_PID" > "$SCRIPT_DIR/$PIDS_DIR/backend.pid"
  sleep 2
  if kill -0 "$BACKEND_PID" 2>/dev/null; then
    log_success "Backend started (PID: $BACKEND_PID, port 5000)"
  else
    log_error "Backend failed to start. Check $PIDS_DIR/backend.log"
    exit 1
  fi
else
  log_error "Failed to start backend"
  exit 1
fi
cd "$SCRIPT_DIR"

# Step 5: Start Frontend
log_info "Step 5/6: Starting frontend..."
cd main-system/frontend
if npm run dev > "$SCRIPT_DIR/$PIDS_DIR/frontend.log" 2>&1 &
then
  FRONTEND_PID=$!
  echo "$FRONTEND_PID" > "$SCRIPT_DIR/$PIDS_DIR/frontend.pid"
  sleep 3
  if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    log_success "Frontend started (PID: $FRONTEND_PID, port 5173)"
  else
    log_error "Frontend failed to start. Check $PIDS_DIR/frontend.log"
    exit 1
  fi
else
  log_error "Failed to start frontend"
  exit 1
fi
cd "$SCRIPT_DIR"

# Step 6: Start Bank Frontend
log_info "Step 6/6: Starting bank frontend..."
cd bank-service/frontend
if npm run dev > "$SCRIPT_DIR/$PIDS_DIR/bank-frontend.log" 2>&1 &
then
  BANK_FRONTEND_PID=$!
  echo "$BANK_FRONTEND_PID" > "$SCRIPT_DIR/$PIDS_DIR/bank-frontend.pid"
  sleep 3
  if kill -0 "$BANK_FRONTEND_PID" 2>/dev/null; then
    log_success "Bank Frontend started (PID: $BANK_FRONTEND_PID, port 5174)"
  else
    log_error "Bank Frontend failed to start. Check $PIDS_DIR/bank-frontend.log"
    exit 1
  fi
else
  log_error "Failed to start bank frontend"
  exit 1
fi
cd "$SCRIPT_DIR"

# Final summary
echo ""
log_success "All services started successfully!"
echo ""
log_info "Service Status:"
echo "  🔗 Blockchain Node:  http://127.0.0.1:8545"
echo "  🏦 Bank A:           http://localhost:3001"
echo "  🏦 Bank B:           http://localhost:3002"
echo "  🏦 Bank C:           http://localhost:3003"
echo "  🔧 Backend:          http://localhost:5000"
echo "  🎨 Frontend:         http://localhost:5173  <-- Open this in browser"
echo "  🏦 Bank Admin:       http://localhost:5174  <-- Bank Admin UI"
echo ""
log_info "Logs available at: $PIDS_DIR/"
log_info "Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait
