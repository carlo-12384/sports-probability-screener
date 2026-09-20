#!/bin/bash

set -e

cleanup() {
  echo ""
  echo "Stopping frontend and backend..."
  kill 0
}

trap cleanup EXIT INT TERM

echo "Starting FastAPI backend on http://127.0.0.1:8000..."
(
  cd backend
  .venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8000
) &

echo "Starting Next.js frontend on http://localhost:3000..."
(
  cd frontend
  npm run dev
) &

wait
