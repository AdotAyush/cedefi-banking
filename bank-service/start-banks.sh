#!/usr/bin/env bash
set -euo pipefail

# Start three Bank service instances in background.
# Logs are written to ./logs, PIDs to ./pids

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

mkdir -p logs pids

start_instance() {
  local name="$1"; local port="$2"; local id="$3"; local key="$4"
  local log="logs/${id}.log"
  echo "Starting $name on port $port (BANK_ID=$id). Log: $log"
  PORT="$port" BANK_ID="$id" BANK_PRIVATE_KEY="$key" nohup npm start > "$log" 2>&1 &
  local pid=$!
  echo "$pid" > "pids/${id}.pid"
  echo "Started $name (PID: $pid)"
}

start_instance "Bank A" 3001 "BankA" "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
start_instance "Bank B" 3002 "BankB" "0x1123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
start_instance "Bank C" 3003 "BankC" "0x2123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

echo "Started Bank A (3001), Bank B (3002), Bank C (3003)"
