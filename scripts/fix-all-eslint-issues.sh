#!/bin/bash

# Script to fix all ESLint issues in the star-gazer-analysis project

echo "🔧 Starting comprehensive ESLint fix process..."
echo "================================================"

# Create a backup list of files that need manual intervention
MANUAL_FIX_LOG="eslint-manual-fixes-needed.log"
> "$MANUAL_FIX_LOG"

# Function to run ESLint fix on a directory
fix_directory() {
    local dir=$1
    local ext=$2
    echo ""
    echo "📁 Fixing $dir with extensions: $ext"
    
    # Run auto-fix
    npx eslint "$dir" --ext "$ext" --fix --quiet
    
    # Check for remaining issues
    if npx eslint "$dir" --ext "$ext" --quiet 2>/dev/null | grep -E "(error|warning)" > /dev/null; then
        echo "⚠️  Some issues remain in $dir that need manual fixing:"
        npx eslint "$dir" --ext "$ext" --quiet | grep -E "(error|warning)" | head -20 >> "$MANUAL_FIX_LOG"
    else
        echo "✅ All issues fixed in $dir!"
    fi
}

# Fix src directory
fix_directory "src" ".js,.jsx,.ts,.tsx"

# Fix supabase functions
fix_directory "supabase/functions" ".ts"

# Fix root config files
echo ""
echo "📁 Fixing root configuration files..."
npx eslint . --ext .js,.ts --fix --quiet \
    --ignore-pattern "src/**" \
    --ignore-pattern "supabase/**" \
    --ignore-pattern "dist/**" \
    --ignore-pattern "node_modules/**" \
    --ignore-pattern "coverage/**" \
    --ignore-pattern "build/**"

echo ""
echo "================================================"
echo "✅ Auto-fix complete!"
echo ""

# Check for specific error patterns that need manual intervention
echo "🔍 Checking for issues that need manual fixing..."
echo ""

# Check for unused variables
echo "📌 Unused variables found:"
npx eslint . --quiet 2>/dev/null | grep "@typescript-eslint/no-unused-vars" | wc -l | xargs echo "   Count:"

# Check for any types
echo "📌 'any' types found:"
npx eslint . --quiet 2>/dev/null | grep "@typescript-eslint/no-explicit-any" | wc -l | xargs echo "   Count:"

# Check for console statements
echo "📌 Console statements found:"
npx eslint . --quiet 2>/dev/null | grep "no-console" | wc -l | xargs echo "   Count:"

# Check for duplicate imports
echo "📌 Duplicate imports found:"
npx eslint . --quiet 2>/dev/null | grep "no-duplicate-imports" | wc -l | xargs echo "   Count:"

echo ""
echo "================================================"
echo "📊 Final ESLint check..."
echo ""

# Run final lint to show remaining issues
npm run lint 2>&1 | tail -50

echo ""
echo "================================================"
echo "📝 Manual fixes needed have been logged to: $MANUAL_FIX_LOG"
echo ""
echo "🎯 Next steps:"
echo "1. Review the remaining errors above"
echo "2. Fix unused variables by prefixing with underscore or removing them"
echo "3. Replace 'any' types with proper TypeScript types"
echo "4. Replace console.log with the ConsolidatedLogger"
echo "5. Combine duplicate imports"
echo ""
echo "✨ Most style issues (quotes, semicolons, etc.) have been auto-fixed!"
