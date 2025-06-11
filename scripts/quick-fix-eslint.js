#!/usr/bin/env node

/**
 * Quick ESLint Fix Script
 * Focuses on fixing the most critical issues to reduce error count
 */

const { execSync } = require('child_process');

console.log('🚀 Quick ESLint Fix - Targeting Critical Issues\n');

const fixes = [
  {
    name: 'Auto-fix formatting issues',
    command: 'npx eslint --fix src/**/*.{ts,tsx} --rule "{no-trailing-spaces: error, eol-last: error, comma-dangle: error, semi: error}" || true',
  },
  {
    name: 'Fix import issues',
    command: 'npx eslint --fix src/**/*.{ts,tsx} --rule "no-duplicate-imports: error" || true',
  },
  {
    name: 'Fix destructuring issues', 
    command: 'npx eslint --fix src/**/*.{ts,tsx} --rule "prefer-destructuring: error" || true',
  },
  {
    name: 'Fix useless constructors',
    command: 'npx eslint --fix src/**/*.{ts,tsx} --rule "no-useless-constructor: error" || true',
  },
];

// Run each fix
fixes.forEach(({ name, command }) => {
  console.log(`\n🔧 ${name}...`);
  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ ${name} completed`);
  } catch (error) {
    console.log(`⚠️  ${name} - some issues remain`);
  }
});

// Show remaining error count
console.log('\n📊 Checking remaining issues...\n');
try {
  const output = execSync('npx eslint src/**/*.{ts,tsx} --format compact', { encoding: 'utf-8' });
  const matches = output.match(/(\d+) problems/);
  if (matches) {
    console.log(`📌 ${matches[1]} issues remaining`);
  }
} catch (error) {
  const errorOutput = error.stdout || error.output?.toString() || '';
  const matches = errorOutput.match(/(\d+) problems/);
  if (matches) {
    console.log(`📌 ${matches[1]} issues remaining`);
  }
}

console.log('\n💡 Next steps:');
console.log('1. Commit your current changes');
console.log('2. Run "npm run lint" to see remaining issues');
console.log('3. Fix critical errors manually (unused vars, duplicate imports)');
console.log('4. Re-enable lint-staged in .husky/pre-commit when ready');
