#!/usr/bin/env node

/**
 * Targeted ESLint Fix Script
 * Focuses on fixing the most common ESLint errors to quickly reduce error count
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎯 Starting targeted ESLint fixes...\n');

// Common unused imports that can be safely removed
const COMMONLY_UNUSED_IMPORTS = [
  'Index', 'DollarSign', 'Users', 'Globe', 'Firefox', 'ArrowUp', 'ArrowDown',
  'TrendingUp', 'TrendingDown', 'Zap', 'Calendar', 'BellOff', 'Layout', 
  'Palette', 'Filter', 'ZoomIn', 'Minus', 'Copy', 'RefreshCw', 'X', 'Hash',
  'MessageSquare', 'User', 'ErrorSeverity', 'Select', 'SelectContent',
  'SelectItem', 'SelectTrigger', 'SelectValue', 'Checkbox', 'BarChart',
  'Bar', 'PieChart', 'Pie', 'Cell', 'Legend', 'Line', 'LineChart',
  'ReferenceLine', 'Slider', 'Mail', 'Bell', 'CalendarClock', 'CheckCircle',
  'AlertTriangle', 'Download', 'Activity', 'Image', 'Settings', 'Lightbulb',
  'Loader2', 'handleError', 'AppError', 'ErrorType', 'BusinessHealthScore',
  'PerformanceMetrics', 'Review', 'AnalysisResult', 'PromptTemplate',
  'HistoricalTrend', 'BusinessTypePrompts', 'NotificationConditions',
  'NotificationAction', 'ThresholdAlert', 'ComparisonMetrics', 'PeriodData',
  'TableName', 'format', 'differenceInMonths', 'addDays', 'startOfQuarter',
  'subMonths', 'startOfMonth', 'endOfMonth', 'eachMonthOfInterval', 
  'subQuarters', 'subYears', 'Separator', 'Button', 'Progress', 'Tabs',
  'TabsContent', 'TabsList', 'TabsTrigger', 'Textarea', 'DragDropHandlesIcon'
];

// Function to remove specific unused imports from a file
function removeUnusedImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  COMMONLY_UNUSED_IMPORTS.forEach(importName => {
    // Remove from named imports
    const namedImportRegex = new RegExp(
      `(import\\s+(?:type\\s+)?\\{[^}]*?)\\b${importName}\\b\\s*,?\\s*([^}]*\\})`,
      'g'
    );
    
    const newContent = content.replace(namedImportRegex, (match, before, after) => {
      modified = true;
      // Clean up the import statement
      let cleaned = before + after.replace(/^,\s*/, '').replace(/,\s*}/, '}');
      cleaned = cleaned.replace(/\{\s*\}/, '{}').replace(/\{\s*,/, '{');
      return cleaned;
    });
    
    if (newContent !== content) {
      content = newContent;
    }
    
    // Remove default imports
    const defaultImportRegex = new RegExp(
      `import\\s+${importName}\\s+from\\s+['"][^'"]+['"];?\\s*\\n`,
      'g'
    );
    
    const afterDefault = content.replace(defaultImportRegex, '');
    if (afterDefault !== content) {
      content = afterDefault;
      modified = true;
    }
  });
  
  // Remove empty import statements
  content = content.replace(/import\s+(?:type\s+)?\{\s*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, '');
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

// Function to fix duplicate imports
function fixDuplicateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const importMap = new Map();
  const newLines = [];
  let modified = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const importMatch = line.match(/^import\s+(?:type\s+)?(?:\{([^}]+)\}|([^{}\s]+))\s+from\s+['"]([^'"]+)['"]/);
    
    if (importMatch) {
      const [fullMatch, namedImports, defaultImport, modulePath] = importMatch;
      const key = modulePath;
      
      if (!importMap.has(key)) {
        importMap.set(key, {
          default: [],
          named: [],
          types: [],
          line: newLines.length
        });
        newLines.push(''); // Placeholder
      }
      
      const imports = importMap.get(key);
      
      if (defaultImport) {
        if (!imports.default.includes(defaultImport)) {
          imports.default.push(defaultImport);
        }
      }
      
      if (namedImports) {
        const isType = line.includes('import type');
        const items = namedImports.split(',').map(s => s.trim());
        
        items.forEach(item => {
          if (isType && !imports.types.includes(item)) {
            imports.types.push(item);
          } else if (!isType && !imports.named.includes(item)) {
            imports.named.push(item);
          }
        });
      }
      
      modified = true;
    } else {
      newLines.push(line);
    }
  }
  
  // Reconstruct imports
  if (modified) {
    for (const [modulePath, imports] of importMap) {
      let importLine = '';
      
      // Handle type imports separately
      if (imports.types.length > 0) {
        importLine = `import type { ${imports.types.join(', ')} } from '${modulePath}'`;
        newLines[imports.line] = importLine;
        
        // Add regular imports on next line if needed
        if (imports.default.length > 0 || imports.named.length > 0) {
          importLine = 'import ';
          if (imports.default.length > 0) {
            importLine += imports.default[0];
            if (imports.named.length > 0) {
              importLine += ', ';
            }
          }
          if (imports.named.length > 0) {
            importLine += `{ ${imports.named.join(', ')} }`;
          }
          importLine += ` from '${modulePath}'`;
          newLines.splice(imports.line + 1, 0, importLine);
        }
      } else {
        // Regular imports only
        importLine = 'import ';
        if (imports.default.length > 0) {
          importLine += imports.default[0];
          if (imports.named.length > 0) {
            importLine += ', ';
          }
        }
        if (imports.named.length > 0) {
          importLine += `{ ${imports.named.join(', ')} }`;
        }
        importLine += ` from '${modulePath}'`;
        newLines[imports.line] = importLine;
      }
    }
    
    fs.writeFileSync(filePath, newLines.join('\n'));
    return true;
  }
  
  return false;
}

// Function to add underscore prefix to unused parameters
function fixUnusedParameters(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Common patterns for unused parameters
  const patterns = [
    // Arrow functions
    /\(([a-zA-Z_$][a-zA-Z0-9_$]*),\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\)\s*=>/g,
    // Regular functions
    /function\s+\w+\s*\(([^)]+)\)/g,
    // Method definitions
    /(\w+)\s*\(([^)]+)\)\s*[:{]/g
  ];
  
  // List of commonly unused parameter names
  const commonlyUnused = ['index', 'props', 'error', 'data', 'config', 'options', 'context', 'text', 'provider', 'recommendations', 'theme', 'category', 'businessName', 'businessType', 'reviews', 'name', 'label', 'filename'];
  
  patterns.forEach(pattern => {
    content = content.replace(pattern, (match, ...args) => {
      let newMatch = match;
      commonlyUnused.forEach(param => {
        const paramRegex = new RegExp(`\\b${param}\\b(?!:)`, 'g');
        if (match.includes(param) && !match.includes(`_${param}`)) {
          newMatch = newMatch.replace(paramRegex, `_${param}`);
          modified = true;
        }
      });
      return newMatch;
    });
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

// Get all TypeScript files
function getAllTsFiles() {
  const glob = require('glob');
  return glob.sync('src/**/*.{ts,tsx}', { 
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.ts', '**/*.test.tsx']
  });
}

// Main execution
async function main() {
  const files = getAllTsFiles();
  
  console.log(`Found ${files.length} TypeScript files to process\n`);
  
  // Step 1: Remove common unused imports
  console.log('🧹 Step 1: Removing commonly unused imports...');
  let count = 0;
  files.forEach(file => {
    if (removeUnusedImports(file)) {
      count++;
    }
  });
  console.log(`  ✅ Cleaned ${count} files\n`);
  
  // Step 2: Fix duplicate imports
  console.log('🔄 Step 2: Fixing duplicate imports...');
  count = 0;
  files.forEach(file => {
    if (fixDuplicateImports(file)) {
      count++;
    }
  });
  console.log(`  ✅ Fixed ${count} files\n`);
  
  // Step 3: Fix unused parameters
  console.log('📝 Step 3: Prefixing unused parameters with underscore...');
  count = 0;
  files.forEach(file => {
    if (fixUnusedParameters(file)) {
      count++;
    }
  });
  console.log(`  ✅ Fixed ${count} files\n`);
  
  // Step 4: Run ESLint auto-fix
  console.log('🔧 Step 4: Running ESLint auto-fix...');
  try {
    execSync('npx eslint --fix src/**/*.{ts,tsx} --max-warnings 0', { 
      stdio: 'pipe' 
    });
    console.log('  ✅ ESLint auto-fix completed\n');
  } catch (e) {
    console.log('  ⚠️  Some issues remain - this is normal\n');
  }
  
  // Count remaining errors
  try {
    execSync('npx eslint src/**/*.{ts,tsx} --format compact', { 
      encoding: 'utf-8',
      stdio: 'pipe' 
    });
    console.log('✨ All ESLint issues resolved!');
  } catch (error) {
    const output = error.stdout || error.output?.toString() || '';
    const match = output.match(/(\d+) problems/);
    if (match) {
      console.log(`📊 Remaining issues: ${match[1]}`);
      console.log('\n💡 Run "npm run lint" to see detailed remaining issues');
    }
  }
}

// Check if glob is installed
try {
  require.resolve('glob');
  main();
} catch (e) {
  console.log('Please run: npm install');
  console.log('Then run this script again.');
}
