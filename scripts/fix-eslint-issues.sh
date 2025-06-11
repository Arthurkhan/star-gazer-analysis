#!/bin/bash

# Fix all ESLint issues automatically
echo "🔧 Running ESLint auto-fix on all files..."

# Fix src directory
echo "📁 Fixing src directory..."
npx eslint src --ext .js,.jsx,.ts,.tsx --fix

# Fix supabase functions
echo "📁 Fixing supabase functions..."
npx eslint supabase/functions --ext .ts --fix

# Fix root files
echo "📁 Fixing root configuration files..."
npx eslint . --ext .js,.ts --fix --ignore-pattern "src/**" --ignore-pattern "supabase/**" --ignore-pattern "dist/**" --ignore-pattern "node_modules/**"

echo "✅ ESLint auto-fix complete!"
echo ""
echo "📊 Running final lint check to see remaining issues..."
npm run lint

echo ""
echo "🎯 Auto-fix complete! Any remaining issues need manual intervention."
