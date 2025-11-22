#!/bin/bash

echo "🚀 Starting Grab The Beyond..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Creating .env file..."
    cp .env.example .env
    echo "✅ .env created (please edit with your API keys)"
    echo ""
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
    echo ""
fi

# Create uploads directory
mkdir -p uploads/incidents

echo "✅ All set! Starting application..."
echo ""
echo "Frontend will be available at: http://localhost:3000"
echo "Backend will be available at: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers
npm run dev:all
