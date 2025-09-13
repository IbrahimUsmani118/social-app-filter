#!/bin/bash

# Filter System Deployment Script
set -e

echo "🚀 Deploying Bluesky Filter System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Test the configuration
echo "🧪 Testing configuration..."
node test.js

# Start the server
echo "🚀 Starting filter system server..."
echo "   Server will be available at: http://localhost:4000"
echo "   Health check: http://localhost:4000/health"
echo "   Presigned URL endpoint: http://localhost:4000/presigned-url"
echo ""
echo "Press Ctrl+C to stop the server"

# Start the server
npm start
