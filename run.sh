#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Agroverse Vision LLM...${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3 and try again.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js and try again.${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}.env file not found. Creating a template...${NC}"
    echo "SUPABASE_URL=your_supabase_url" > .env
    echo "SUPABASE_KEY=your_supabase_key" >> .env
    echo "OPENAI_API_KEY=your_openai_api_key" >> .env
    echo -e "${YELLOW}Please edit the .env file with your credentials.${NC}"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d .venv ]; then
    echo -e "${YELLOW}Virtual environment not found. Creating one...${NC}"
    python3 -m venv .venv
fi

# Activate virtual environment
echo -e "${GREEN}Activating virtual environment...${NC}"
source .venv/bin/activate

# Install Python dependencies
echo -e "${GREEN}Installing Python dependencies...${NC}"
pip install -r requirements.txt

# Check if frontend/node_modules exists
if [ ! -d frontend/node_modules ]; then
    echo -e "${YELLOW}Frontend dependencies not found. Installing...${NC}"
    cd frontend
    npm install
    cd ..
fi

# Start the backend API
echo -e "${GREEN}Starting backend API...${NC}"
python scripts/api.py &
API_PID=$!

# Start the frontend
echo -e "${GREEN}Starting frontend...${NC}"
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Function to handle cleanup on exit
cleanup() {
    echo -e "${YELLOW}Shutting down...${NC}"
    kill $API_PID
    kill $FRONTEND_PID
    deactivate
    exit 0
}

# Set up trap to catch SIGINT (Ctrl+C)
trap cleanup SIGINT

echo -e "${GREEN}Agroverse Vision LLM is running!${NC}"
echo -e "${GREEN}Backend API: http://localhost:8000${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the application.${NC}"

# Wait for both processes to finish
wait 