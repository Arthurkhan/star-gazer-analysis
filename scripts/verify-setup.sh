#!/bin/bash

# Star-Gazer Analysis - Environment Setup Verification Script
# This script helps verify and fix common environment setup issues

echo "🔍 Star-Gazer Analysis - Environment Setup Verification"
echo "========================================================"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file found"
    
    # Check if environment variables are set
    if grep -q "VITE_SUPABASE_URL=https://" .env.local && grep -q "VITE_SUPABASE_ANON_KEY=eyJ" .env.local; then
        echo "✅ Environment variables appear to be set correctly"
    else
        echo "❌ Environment variables may not be set correctly"
        echo "   Please ensure your .env.local contains:"
        echo "   VITE_SUPABASE_URL=your_supabase_url"
        echo "   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
    fi
else
    echo "❌ .env.local file not found!"
    
    # Check if .env.example exists
    if [ -f ".env.example" ]; then
        echo "📝 Creating .env.local from .env.example..."
        cp .env.example .env.local
        echo "✅ .env.local created. Please edit it with your Supabase credentials."
    else
        echo "📝 Creating new .env.local file..."
        cat > .env.local << EOF
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Get these values from your Supabase project dashboard:
# Settings → API → Project URL & anon key
EOF
        echo "✅ .env.local created. Please edit it with your Supabase credentials."
    fi
fi

echo ""
echo "📦 Checking node_modules..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules directory exists"
else
    echo "❌ node_modules not found. Running npm install..."
    npm install
fi

echo ""
echo "🧹 Cleaning Vite cache..."
rm -rf node_modules/.vite
echo "✅ Vite cache cleared"

echo ""
echo "🚀 Next steps:"
echo "1. Ensure your .env.local file contains valid Supabase credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. If you still see CORS errors, try:"
echo "   - Clear your browser cache"
echo "   - Open the app in an incognito/private window"
echo "   - Check that your Supabase project is not paused"
echo ""
echo "✨ Setup verification complete!"
