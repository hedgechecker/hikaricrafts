#!/bin/bash

# ---- CONFIG ----
SERVER_DIR="./server"
LOG_DIR="./logs"

mkdir -p "$LOG_DIR"

# Kill all background jobs on exit (Ctrl-C, error, etc.)
cleanup() {
    echo "Shutting down..."
    kill $(jobs -p) 2>/dev/null
    wait
    exit 0
}
trap cleanup INT TERM

echo "Starting all services..."

# --- Frontend ---
echo "Starting frontend (npm run dev)..."
npm run dev -- --host 0.0.0.0 --port 5173 > "$LOG_DIR/frontend.log" 2>&1 &

# --- Backend ---
echo "Starting backend (node index.js)..."
(
    cd "$SERVER_DIR" || exit
    node index.js
) > "$LOG_DIR/backend.log" 2>&1 &

# --- Prisma Studio ---
echo "Starting Prisma Studio..."
(
    cd "$SERVER_DIR" || exit
    npx prisma studio 
)> "$LOG_DIR/prisma.log" 2>&1 &

echo "All services started."
echo "Logs are stored in $LOG_DIR"
echo "Press Ctrl-C to stop everything."

# Keep script alive
wait
