#!/bin/bash

# =============================================================
# AI Mental Health Companion - Start Script
# =============================================================
# This script:
# 1. Cleans up used ports (3001, 5173)
# 2. Sets up PostgreSQL database
# 3. Seeds data for all 15 features
# 4. Starts backend with hot-reload (nodemon)
# 5. Starts frontend with hot-reload (vite)
# =============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${PURPLE}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}${BOLD}║     🧠 AI Mental Health Companion                    ║${NC}"
echo -e "${PURPLE}${BOLD}║     Starting Application...                          ║${NC}"
echo -e "${PURPLE}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ----------------------------------------------------------
# Step 1: Check .env file
# ----------------------------------------------------------
echo -e "${BLUE}[1/6]${NC} Checking environment configuration..."
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}ERROR: .env file not found at $ENV_FILE${NC}"
    echo "Please create a .env file with the following variables:"
    echo "  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mental_health_companion"
    echo "  OPENROUTER_API_KEY=your_key_here"
    echo "  OPENROUTER_MODEL=anthropic/claude-haiku-4.5"
    echo "  JWT_SECRET=your_secret_here"
    echo "  BACKEND_PORT=3001"
    echo "  FRONTEND_PORT=5173"
    exit 1
fi
echo -e "${GREEN}  ✓ .env file found${NC}"

# Load environment variables
source "$ENV_FILE" 2>/dev/null || true
BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

# ----------------------------------------------------------
# Step 2: Clean up used ports
# ----------------------------------------------------------
echo -e "${BLUE}[2/6]${NC} Cleaning up ports ${BACKEND_PORT} and ${FRONTEND_PORT}..."

cleanup_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}  Killing processes on port $port: $pids${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    else
        echo -e "${GREEN}  ✓ Port $port is available${NC}"
    fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

# ----------------------------------------------------------
# Step 3: Install dependencies
# ----------------------------------------------------------
echo -e "${BLUE}[3/6]${NC} Installing dependencies..."

echo -e "${CYAN}  Installing server dependencies...${NC}"
cd "$PROJECT_DIR/server"
if [ ! -d "node_modules" ]; then
    npm install --silent 2>&1 | tail -1
else
    echo -e "${GREEN}  ✓ Server dependencies already installed${NC}"
fi

echo -e "${CYAN}  Installing client dependencies...${NC}"
cd "$PROJECT_DIR/client"
if [ ! -d "node_modules" ]; then
    npm install --silent 2>&1 | tail -1
else
    echo -e "${GREEN}  ✓ Client dependencies already installed${NC}"
fi

# ----------------------------------------------------------
# Step 4: Setup PostgreSQL Database
# ----------------------------------------------------------
echo -e "${BLUE}[4/6]${NC} Setting up PostgreSQL database..."

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
    echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    sleep 2
fi

# Create database if it doesn't exist
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw mental_health_companion; then
    echo -e "${YELLOW}  Database exists. Dropping and recreating...${NC}"
    dropdb mental_health_companion 2>/dev/null || true
fi

createdb mental_health_companion 2>/dev/null || true
echo -e "${GREEN}  ✓ Database 'mental_health_companion' created${NC}"

# ----------------------------------------------------------
# Step 5: Run schema and seed data
# ----------------------------------------------------------
echo -e "${BLUE}[5/6]${NC} Running database schema and seeding data..."

cd "$PROJECT_DIR/server"
psql -d mental_health_companion -f schema.sql -q 2>/dev/null
echo -e "${GREEN}  ✓ Schema created (17 tables)${NC}"

psql -d mental_health_companion -f seed.sql -q 2>/dev/null
echo -e "${GREEN}  ✓ Seed data loaded for all 15 features${NC}"

# Print seed data summary
echo ""
echo -e "${CYAN}  Seed Data Summary:${NC}"
echo -e "${CYAN}  ┌─────────────────────────────┬───────┐${NC}"

declare -a tables=("users" "moods" "journal_entries" "meditation_sessions" "breathing_exercises" "self_care_activities" "coping_strategies" "assessments" "goals" "support_groups" "crisis_resources" "affirmations" "sleep_logs" "gratitude_entries" "therapists")
declare -a labels=("Users" "Moods" "Journal Entries" "Meditation Sessions" "Breathing Exercises" "Self-Care Activities" "Coping Strategies" "Assessments" "Goals" "Support Groups" "Crisis Resources" "Affirmations" "Sleep Logs" "Gratitude Entries" "Therapists")

for i in "${!tables[@]}"; do
    count=$(psql -d mental_health_companion -t -c "SELECT COUNT(*) FROM ${tables[$i]};" 2>/dev/null | tr -d ' ')
    printf "  ${CYAN}│${NC} %-27s ${CYAN}│${NC} %5s ${CYAN}│${NC}\n" "${labels[$i]}" "$count"
done
echo -e "${CYAN}  └─────────────────────────────┴───────┘${NC}"
echo ""

# ----------------------------------------------------------
# Step 6: Start application with hot-reload
# ----------------------------------------------------------
echo -e "${BLUE}[6/6]${NC} Starting application with hot-reload..."
echo ""

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    cleanup_port $BACKEND_PORT
    cleanup_port $FRONTEND_PORT
    kill $(jobs -p) 2>/dev/null || true
    echo -e "${GREEN}Goodbye!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend with nodemon (hot-reload)
cd "$PROJECT_DIR/server"
echo -e "${GREEN}  Starting backend on port ${BACKEND_PORT} (with hot-reload)...${NC}"
npx nodemon index.js &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 3

# Start frontend with Vite (hot-reload built-in)
cd "$PROJECT_DIR/client"
echo -e "${GREEN}  Starting frontend on port ${FRONTEND_PORT} (with hot-reload)...${NC}"
npx vite --port $FRONTEND_PORT &
FRONTEND_PID=$!

sleep 3

echo ""
echo -e "${PURPLE}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}${BOLD}║  Application is running!                             ║${NC}"
echo -e "${PURPLE}${BOLD}║                                                      ║${NC}"
echo -e "${PURPLE}${BOLD}║  Frontend:  http://localhost:${FRONTEND_PORT}                    ║${NC}"
echo -e "${PURPLE}${BOLD}║  Backend:   http://localhost:${BACKEND_PORT}/api                 ║${NC}"
echo -e "${PURPLE}${BOLD}║                                                      ║${NC}"
echo -e "${PURPLE}${BOLD}║  Demo Login:                                         ║${NC}"
echo -e "${PURPLE}${BOLD}║    Email:    demo@mentalhealth.com                    ║${NC}"
echo -e "${PURPLE}${BOLD}║    Password: password123                             ║${NC}"
echo -e "${PURPLE}${BOLD}║                                                      ║${NC}"
echo -e "${PURPLE}${BOLD}║  Press Ctrl+C to stop                                ║${NC}"
echo -e "${PURPLE}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Wait for both processes
wait
