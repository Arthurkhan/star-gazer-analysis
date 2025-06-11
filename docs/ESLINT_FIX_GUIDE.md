# ESLint Fix Guide for Star-Gazer-Analysis

This document provides guidance on fixing the ESLint issues in the project.

## Current Status
- **Total Issues**: 961 (303 errors, 658 warnings)
- **Pre-commit Hook**: Temporarily disabled lint-staged

## Quick Start

### 1. Commit Your Current Changes
Since lint-staged is temporarily disabled, you can now commit:
```bash
git add .
git commit -m "Your commit message"
```

### 2. Run Auto-Fix Scripts
After committing, run these commands to fix common issues:

```bash
# Fix critical formatting issues
npm run lint:fix-critical

# Or try to fix all auto-fixable issues
npm run lint:fix-all
```

### 3. Check Remaining Issues
```bash
npm run lint
```

## Common Issue Categories and Fixes

### 1. Unused Variables/Imports (Most Common)
**Example Error**: `'Index' is defined but never used`

**Fix Options**:
- Remove the unused import/variable
- Prefix with underscore: `_Index` (if intentionally unused)
- Actually use the variable in your code

### 2. Duplicate Imports
**Example Error**: `'@/utils/businessContext' import is duplicated`

**Fix**: Combine imports from the same module:
```typescript
// Bad
import { BusinessContext } from '@/utils/businessContext';
import { useBusinessContext } from '@/utils/businessContext';

// Good
import { BusinessContext, useBusinessContext } from '@/utils/businessContext';
```

### 3. Type Safety Issues
**Example Error**: `Unexpected any. Specify a different type`

**Fix**: Replace `any` with specific types:
```typescript
// Bad
const handleData = (data: any) => { ... }

// Good
const handleData = (data: ReviewData) => { ... }
// Or if truly unknown
const handleData = (data: unknown) => { ... }
```

### 4. Console Statements
**Example Warning**: `Unexpected console statement`

**Fix Options**:
- Remove console.log statements
- Use a proper logging service
- Keep only console.warn and console.error (allowed by config)

### 5. React Hooks Dependencies
**Example Warning**: `React Hook useEffect has missing dependencies`

**Fix**: Add missing dependencies or use eslint-disable comment if intentional:
```typescript
// Add dependencies
useEffect(() => {
  fetchData();
}, [fetchData]); // Add missing dependency

// Or disable if intentional
useEffect(() => {
  fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

## Manual Fix Priority

1. **Fix Errors First** (303 total) - These prevent compilation
   - Unused variables
   - Duplicate imports
   - No-alert/no-prompt violations

2. **Fix Critical Warnings** - These affect code quality
   - Missing hook dependencies
   - Type safety issues
   - Non-null assertions

3. **Fix Style Warnings** - These are less critical
   - Fast refresh warnings
   - Console statements

## Re-enabling Pre-commit Hooks

Once you've fixed the critical issues:

1. Edit `.husky/pre-commit`
2. Uncomment the `npx lint-staged` line
3. Remove the "TEMPORARILY DISABLED" comment block

## Need Help?

- Run `npm run lint -- --help` for ESLint options
- Check individual files with: `npx eslint src/path/to/file.tsx`
- Use `--fix` flag for auto-fixable issues
