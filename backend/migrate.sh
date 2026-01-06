#!/bin/bash
# Script to run database migrations on Render

echo "Running database migrations..."

# Run Alembic migrations
alembic upgrade head

echo "Migrations completed!"

# Optional: Seed initial data
# python scripts/seed_data.py
