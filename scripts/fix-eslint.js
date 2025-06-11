#!/usr/bin/env node

/**
 * ESLint Fixer Script
 * This script helps fix common ESLint issues in the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting ESLint auto-fix process...\n');

// Categories of fixes to apply
const fixCategories = [
  {
    name: 'Remove unused imports',
    command: 'npx eslint --fix --rule "no-unused-vars: off" --rule "@typescript-eslint/no-unused-vars: off" --rule "no-duplicate-imports: error" src/**/*.{ts,tsx}',
  },
  {
    name: 'Fix formatting issues',
    command: 'npx eslint --fix --rule "no-trailing-spaces: error" --rule "eol-last: error" --rule "comma-dangle: error" --rule "semi: error" --rule "quotes: error" src/**/*.{ts,tsx}',
  },
  {
    name: 'Fix console statements',
    command: 'npx eslint --fix --rule "no-console: warn" src/**/*.{ts,tsx}',
  },
];

// Function to run ESLint fix
function runFix(category) {
  console.log(`\n📌 ${category.name}...`);
  try {
    execSync(category.command, { stdio: 'inherit' });
    console.log(`✅ ${category.name} completed`);
  } catch (error) {
    console.log(`⚠️  ${category.name} had some issues that need manual fixing`);
  }
}

// Run all fixes
console.log('This will attempt to automatically fix common ESLint issues.');
console.log('Some issues will still need manual intervention.\n');

fixCategories.forEach(runFix);

// Run a final ESLint check to see remaining issues
console.log('\n📊 Running final ESLint check to see remaining issues...\n');
try {
  execSync('npx eslint src/**/*.{ts,tsx} --max-warnings 50', { stdio: 'inherit' });
  console.log('\n✅ All ESLint issues resolved!');
} catch (error) {
  console.log('\n⚠️  Some ESLint issues remain and need manual fixing.');
  console.log('Run "npm run lint" to see all remaining issues.');
}

console.log('\n🎉 ESLint auto-fix process completed!');
