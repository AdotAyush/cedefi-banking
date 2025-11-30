#!/usr/bin/env bash
# Stop all services started by start-all.sh

PIDS_DIR="./.pids"

# Function to kill process on a specific port
kill_port() {
  local port=$1
  local name=$2
  
  # Try lsof first
  if command -v lsof >/dev/null 2>&1; then
    pid=$(lsof -t -i:$port)
  # Try fuser next
  elif command -v fuser >/dev/null 2>&1; then
    pid=$(fuser $port/tcp 2>/dev/null)
  # Try netstat/ss as last resort (harder to parse reliably across distros, so we stick to lsof/fuser usually)
  else
    echo "  [WARN] Neither lsof nor fuser found. Cannot kill by port $port."
    return
  fi

  if [ -n "$pid" ]; then
    echo "  Stopping $name on port $port (PID $pid)..."
    kill $pid 2>/dev/null || true
    sleep 1
    if kill -0 $pid 2>/dev/null; then
      echo "    Force killing $name..."
      kill -9 $pid 2>/dev/null || true
    fi
  fi
}

echo "Stopping all services..."

# 1. Kill by PID files first (graceful)
if [ -d "$PIDS_DIR" ]; then
  for pidfile in "$PIDS_DIR"/*.pid; do
    [ -e "$pidfile" ] || continue
    pid=$(cat "$pidfile")
    name=$(basename "$pidfile" .pid)
    
    if kill -0 "$pid" 2>/dev/null; then
      echo "  Stopping $name (PID $pid)..."
      kill "$pid" 2>/dev/null || true
    fi
  done
fi

# 2. Kill by Port (aggressive cleanup)
echo "Cleaning up ports..."
kill_port 8545 "Hardhat Node"
kill_port 3001 "Bank A"
kill_port 3002 "Bank B"
kill_port 3003 "Bank C"
kill_port 5000 "Backend"
kill_port 5173 "Frontend"
kill_port 5174 "Bank Frontend"

# Stop bank services script if running
if [ -d "bank-service" ]; then
  cd bank-service
  bash stop-banks.sh 2>/dev/null || true
  cd ..
fi

# Clean up
if [ -d "$PIDS_DIR" ]; then
  rm -f "$PIDS_DIR"/*.pid
fi

echo "All services stopped."
