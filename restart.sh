#!/bin/bash
# Restart semua dev server (web + api). Jalankan: bash restart.sh

echo "⏹  Stopping all dev processes..."
pkill -f "vite" 2>/dev/null
pkill -f "node --watch" 2>/dev/null
pkill -f "concurrently" 2>/dev/null
sleep 2

# Paksa kill sisa proses di port yang dipakai
for PORT in 5173 5174 3000; do
  PID=$(lsof -ti ":$PORT" 2>/dev/null)
  if [ -n "$PID" ]; then
    echo "  Kill PID $PID on :$PORT"
    kill -9 $PID 2>/dev/null
  fi
done

sleep 1
echo "🚀 Starting dev server..."
cd "$(dirname "$0")"
npm run dev > /tmp/horizons-dev.log 2>&1 &
DEV_PID=$!

echo "   PID: $DEV_PID  |  Log: /tmp/horizons-dev.log"
echo "   Waiting for Vite..."
sleep 5

# Tampilkan URL yang aktif
grep -E 'Local:|error|Error' /tmp/horizons-dev.log | head -10
echo ""
echo "✅ Done. Buka: http://localhost:5173"
