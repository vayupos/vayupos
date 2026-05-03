#!/bin/bash
# VayuPos — Redeploy script
# Run this every time you push new code to main and want to update the server.
# Usage: bash redeploy.sh
#
# Assumes:
#   - Repo is at ~/vayupos  (adjust APP_DIR below if different)
#   - Venv is at ~/vayupos/backend/venv
#   - .env is at ~/vayupos/backend/.env
#   - Service is managed by systemd: vayupos-backend
#   - If still using nohup (old setup): set USE_SYSTEMD=false below
# ------------------------------------------------------------------

set -e

APP_DIR=~/vayupos/backend     # change this if your path is different
USE_SYSTEMD=true               # false = use nohup (old-style)

echo ""
echo "====== VayuPos Redeploy ======"
echo ""

# 1. Pull latest code
echo "[1/5] Pulling latest code..."
cd "$APP_DIR/.."
git fetch origin
git reset --hard origin/main
echo "      Done."

# 2. Activate venv and install any new dependencies
echo "[2/5] Installing dependencies..."
cd "$APP_DIR"
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "      Done."

# 3. Run migrations — handles multiple heads automatically
echo "[3/5] Running migrations..."
HEADS=$(alembic heads 2>/dev/null | wc -l)
if [ "$HEADS" -gt 1 ]; then
    echo "      WARNING: $HEADS heads detected — merging..."
    HEAD_IDS=$(alembic heads 2>/dev/null | awk '{print $1}' | tr '\n' ' ')
    echo "      Heads: $HEAD_IDS"
    alembic merge $HEAD_IDS -m "auto merge heads on deploy"
fi
alembic upgrade head
echo "      Migrations applied."

# 4. Restart server
echo "[4/5] Restarting server..."
if [ "$USE_SYSTEMD" = true ]; then
    sudo systemctl restart vayupos-backend
    sleep 2
    sudo systemctl status vayupos-backend --no-pager
else
    pkill -f uvicorn || true
    sleep 1
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > ~/vayupos-output.log 2>&1 &
    sleep 2
    ps aux | grep uvicorn | grep -v grep
fi
echo "      Server restarted."

# 5. Health check
echo "[5/5] Health check..."
sleep 2
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "      OK — backend is healthy (HTTP 200)"
else
    echo "      WARNING — health check returned HTTP $HTTP_STATUS"
    echo "      Check logs:"
    if [ "$USE_SYSTEMD" = true ]; then
        echo "        sudo journalctl -u vayupos-backend -n 50"
    else
        echo "        tail -50 ~/vayupos-output.log"
    fi
fi

echo ""
echo "====== Redeploy complete ======"
echo ""
