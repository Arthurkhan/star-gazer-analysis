#!/usr/bin/env node

/**
 * Comprehensive ESLint Auto-Fix Script
 * This script systematically fixes common ESLint issues in the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

console.log('🚀 Starting comprehensive ESLint fixes...\n');

// Function to get all TypeScript files
function getAllTsFiles() {
  return glob.sync('src/**/*.{ts,tsx}', { 
    ignore: ['**/node_modules/**', '**/dist/**']
  });
}

// Function to count ESLint errors
function getErrorCount() {
  try {
    execSync('npx eslint src/**/*.{ts,tsx} --format compact', { 
      encoding: 'utf-8',
      stdio: 'pipe' 
    });
    return 0;
  } catch (error) {
    const output = error.stdout || error.output?.toString() || '';
    const match = output.match(/(\d+) problems/);
    return match ? parseInt(match[1]) : 0;
  }
}

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Track imports to detect duplicates
  const imports = new Map();
  const lines = content.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const importMatch = line.match(/^import\s+(?:type\s+)?(?:\{([^}]+)\}|([^{}\s]+))\s+from\s+['"]([^'"]+)['"]/);
    
    if (importMatch) {
      const [, namedImports, defaultImport, modulePath] = importMatch;
      
      if (!imports.has(modulePath)) {
        imports.set(modulePath, {
          default: defaultImport || '',
          named: namedImports ? namedImports.split(',').map(s => s.trim()) : [],
          line: i,
          isType: line.includes('import type')
        });
        newLines.push(line);
      } else {
        // Merge with existing import
        const existing = imports.get(modulePath);
        if (defaultImport && !existing.default) {
          existing.default = defaultImport;
        }
        if (namedImports) {
          const newNamed = namedImports.split(',').map(s => s.trim());
          existing.named = [...new Set([...existing.named, ...newNamed])];
        }
        modified = true;
        // Skip this line, we'll update the original import
        continue;
      }
    } else {
      newLines.push(line);
    }
  }

  // Update original imports with merged values
  if (modified) {
    for (const [modulePath, importData] of imports) {
      if (importData.named.length > 0 || importData.default) {
        let importLine = 'import ';
        if (importData.isType) importLine += 'type ';
        
        if (importData.default && importData.named.length > 0) {
          importLine += `${importData.default}, { ${importData.named.join(', ')} }`;
        } else if (importData.default) {
          importLine += importData.default;
        } else {
          importLine += `{ ${importData.named.join(', ')} }`;
        }
        
        importLine += ` from '${modulePath}'`;
        newLines[importData.line] = importLine;
      }
    }
    
    fs.writeFileSync(filePath, newLines.join('\n'));
    console.log(`  ✅ Fixed duplicate imports in ${path.basename(filePath)}`);
  }
  
  return modified;
}

// Function to remove unused imports and variables
function removeUnusedInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Run ESLint on this specific file to get unused vars
  try {
    execSync(`npx eslint ${filePath} --format json`, { encoding: 'utf-8', stdio: 'pipe' });
  } catch (error) {
    const output = error.stdout || '';
    if (!output) return false;
    
    try {
      const results = JSON.parse(output);
      const fileResult = results[0];
      if (!fileResult || !fileResult.messages) return false;
      
      const unusedVars = fileResult.messages
        .filter(msg => msg.ruleId === '@typescript-eslint/no-unused-vars' || msg.ruleId === 'no-unused-vars')
        .map(msg => {
          const match = msg.message.match(/'([^']+)'/);
          return match ? match[1] : null;
        })
        .filter(Boolean);
      
      if (unusedVars.length > 0) {
        let newContent = content;
        
        // Remove unused imports
        unusedVars.forEach(varName => {
          // Remove from named imports
          newContent = newContent.replace(
            new RegExp(`(import\\s+(?:type\\s+)?\\{[^}]*?)\\b${varName}\\b\\s*,?\\s*([^}]*\\})`, 'g'),
            (match, before, after) => {
              const cleaned = before + after.replace(/^,\s*/, '').replace(/,\s*}/, '}');
              return cleaned.replace(/\{\s*\}/, '{}').replace(/\{\s*,/, '{');
            }
          );
          
          // Remove entire import if it was the only import
          newContent = newContent.replace(
            new RegExp(`import\\s+(?:type\\s+)?\\{\\s*\\}\\s+from\\s+['"][^'"]+['"];?\\s*\n`, 'g'),
            ''
          );
          
          // Remove default imports
          newContent = newContent.replace(
            new RegExp(`import\\s+${varName}\\s+from\\s+['"][^'"]+['"];?\\s*\n`, 'g'),
            ''
          );
        });
        
        if (newContent !== content) {
          fs.writeFileSync(filePath, newContent);
          console.log(`  ✅ Removed unused imports/vars in ${path.basename(filePath)}`);
          return true;
        }
      }
    } catch (e) {
      // JSON parse error, skip
    }
  }
  
  return false;
}

// Main execution
async function main() {
  console.log(`Initial error count: ${getErrorCount()}\n`);
  
  // Step 1: Fix formatting issues with ESLint
  console.log('📝 Step 1: Auto-fixing formatting issues...');
  try {
    execSync('npx eslint --fix src/**/*.{ts,tsx} --rule "semi: error" --rule "comma-dangle: error" --rule "quotes: error" --rule "no-trailing-spaces: error" --rule "eol-last: error" --rule "prefer-const: error" --rule "prefer-template: error" --rule "object-shorthand: error" --rule "prefer-arrow-callback: error" --rule "no-var: error"', { 
      stdio: 'inherit' 
    });
  } catch (e) {
    console.log('  ⚠️  Some formatting issues remain');
  }
  
  // Step 2: Fix duplicate imports
  console.log('\n📦 Step 2: Fixing duplicate imports...');
  const files = getAllTsFiles();
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixImportsInFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`  Fixed ${fixedCount} files with duplicate imports`);
  
  // Step 3: Remove unused imports and variables
  console.log('\n🧹 Step 3: Removing unused imports and variables...');
  fixedCount = 0;
  
  for (const file of files) {
    if (removeUnusedInFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`  Fixed ${fixedCount} files with unused imports/vars`);
  
  // Step 4: Fix other auto-fixable issues
  console.log('\n🔧 Step 4: Running final ESLint auto-fix...');
  try {
    execSync('npx eslint --fix src/**/*.{ts,tsx}', { stdio: 'inherit' });
  } catch (e) {
    console.log('  ⚠️  Some issues require manual fixing');
  }
  
  // Final report
  const finalCount = getErrorCount();
  console.log(`\n📊 Final Results:`);
  console.log(`  Remaining issues: ${finalCount}`);
  console.log(`\n✨ Auto-fix complete! Run 'npm run lint' to see remaining issues.`);
}

// Check if glob is installed
try {
  require.resolve('glob');
  main();
} catch (e) {
  console.log('Installing required dependency...');
  execSync('npm install --save-dev glob', { stdio: 'inherit' });
  console.log('Dependency installed. Please run this script again.');
}
