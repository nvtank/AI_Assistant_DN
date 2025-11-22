#!/bin/bash

# Grab The Beyond - Quick Setup Script
# This script helps you quickly set up the project

echo "🚗 Grab The Beyond - Quick Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file and add your API keys:"
    echo "   - Firebase credentials"
    echo "   - Puter AI keys"
    echo "   - OpenWeatherMap API key"
    echo ""
    echo "Run 'nano .env' to edit the file"
    echo ""
else
    echo "✅ .env file exists"
    echo ""
fi

# Create uploads directory
mkdir -p uploads/incidents
echo "✅ Created uploads directory"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Run 'npm run dev:all' to start the application"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Happy coding! 🚀"
