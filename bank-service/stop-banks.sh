#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORTS=(3001 3002 3003)

echo "=== Stopping processes via PID files ==="

if [ -d pids ]; then
  for pidfile in pids/*.pid; do
    [ -e "$pidfile" ] || continue
    pid=$(cat "$pidfile")
    if kill -0 "$pid" 2>/dev/null; then
      echo "Stopping PID $pid (from $pidfile)"
      kill "$pid"
      sleep 1
      if kill -0 "$pid" 2>/dev/null; then
        echo "PID $pid still running, sending SIGKILL"
        kill -9 "$pid" || true
      fi
    else
      echo "PID $pid not running"
    fi
    rm -f "$pidfile"
  done
else
  echo "No pids directory found."
fi

echo
echo "=== Stopping processes running on ports 3001, 3002, 3003 ==="

for PORT in "${PORTS[@]}"; do
  PID=$(lsof -ti :$PORT || true)
  if [ -n "$PID" ]; then
    echo "Killing process $PID on port $PORT"
    kill -9 $PID || true
  else
    echo "No process found on port $PORT"
  fi
done

echo
echo "All banks stopped."
