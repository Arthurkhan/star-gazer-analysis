#!/bin/bash

# Script to clean exposed API keys from git history
# IMPORTANT: This will rewrite git history!

echo "Git History Cleaner - Remove Exposed API Keys"
echo "============================================="
echo ""
echo "⚠️  WARNING: This will rewrite your git history!"
echo "⚠️  Make sure you have a backup of your repository"
echo ""

# Check if BFG is installed
if ! command -v bfg &> /dev/null; then
    echo "BFG Repo-Cleaner is not installed."
    echo ""
    echo "To install on macOS with Homebrew:"
    echo "  brew install bfg"
    echo ""
    echo "Or download from: https://rtyley.github.io/bfg-repo-cleaner/"
    exit 1
fi

# Confirm with user
read -p "Do you want to proceed with cleaning the git history? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

# Create backup
echo "Creating backup of .git directory..."
cp -r .git .git-backup-$(date +%Y%m%d-%H%M%S)

# Create a file with patterns to remove
echo "Creating patterns file..."
cat > ../git-clean-patterns.txt << 'EOF'
YOUR_OPENAI_API_KEY_HERE
sk-[a-zA-Z0-9]{48}
sk-proj-[a-zA-Z0-9]{48}
EOF

echo "Running BFG to clean repository..."
# Run BFG to replace text
bfg --replace-text ../git-clean-patterns.txt --no-blob-protection

echo "Cleaning up repository..."
# Clean up the repository
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Git history cleaned!"
echo ""
echo "Next steps:"
echo "1. Review the changes: git log"
echo "2. Force push to remote: git push --force-with-lease"
echo ""
echo "⚠️  IMPORTANT:"
echo "- Anyone who has cloned this repository will need to re-clone it"
echo "- The exposed API key should be revoked immediately in your OpenAI dashboard"
echo "- Generate a new API key and store it securely (never commit it)"

# Clean up
rm -f ../git-clean-patterns.txt
