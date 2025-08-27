#!/bin/bash

echo "🚀 Starting Audit Framework..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Start backend
echo "🔧 Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Start backend server
echo "🚀 Starting backend server..."
python main.py &
BACKEND_PID=$!

cd ..

# Start frontend
echo "🎨 Setting up frontend..."
cd frontend

# Install dependencies
echo "📥 Installing Node.js dependencies..."
npm install

# Start frontend server
echo "🚀 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "🎉 Audit Framework is starting up!"
echo ""
echo "📊 Backend API: http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
