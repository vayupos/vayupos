#!/bin/bash
# VayuPos EC2 Setup Script
# Run once on a fresh Ubuntu 22.04 instance as the ubuntu user.
# Usage: bash setup_ec2.sh
# -------------------------------------------------------------------

set -e  # exit on any error

echo "=== [1/7] System update ==="
sudo apt-get update -y
sudo apt-get upgrade -y

echo "=== [2/7] Install Python 3.11, git, nginx ==="
sudo apt-get install -y python3.11 python3.11-venv python3-pip git nginx certbot python3-certbot-nginx

echo "=== [3/7] Clone repository ==="
cd ~
git clone https://github.com/vayupos/vayupos.git vayupos
# If repo already exists: cd ~/vayupos && git fetch origin && git reset --hard origin/main

echo "=== [4/7] Python virtual environment + dependencies ==="
cd ~/vayupos/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "=== [5/7] Create .env (you must fill this in manually) ==="
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo ">>> .env created from .env.example"
    echo ">>> EDIT IT NOW before continuing: nano ~/vayupos/backend/.env"
    echo ">>> Required: DATABASE_URL, SECRET_KEY, ADMIN_SECRET_KEY, ALLOWED_ORIGINS"
    echo ""
fi

echo "=== [6/7] Nginx config ==="
sudo cp ~/vayupos/backend/deploy/nginx.conf /etc/nginx/sites-available/vayupos-api
sudo ln -sf /etc/nginx/sites-available/vayupos-api /etc/nginx/sites-enabled/vayupos-api
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "=== [7/7] Systemd service ==="
sudo cp ~/vayupos/backend/deploy/vayupos-backend.service /etc/systemd/system/vayupos-backend.service
sudo systemctl daemon-reload
sudo systemctl enable vayupos-backend

echo ""
echo "======================================================"
echo "Setup complete. Before starting the service:"
echo ""
echo "  1. Fill in .env:"
echo "     nano ~/vayupos/backend/.env"
echo ""
echo "  2. Run migrations:"
echo "     cd ~/vayupos/backend"
echo "     source venv/bin/activate"
echo "     alembic upgrade head"
echo ""
echo "  3. Start service:"
echo "     sudo systemctl start vayupos-backend"
echo "     sudo systemctl status vayupos-backend"
echo ""
echo "  4. Set up SSL (after DNS is pointed to this IP):"
echo "     sudo certbot --nginx -d api.vayupos.com"
echo ""
echo "  5. Watch logs:"
echo "     sudo journalctl -u vayupos-backend -f"
echo "======================================================"
