# ESLint Fixing Instructions

## Quick Fix for All ESLint Issues

To fix the majority of ESLint issues automatically:

```bash
# Make the script executable
chmod +x scripts/fix-all-eslint-issues.sh

# Run the comprehensive fix
./scripts/fix-all-eslint-issues.sh
```

Or use npm directly:

```bash
# Auto-fix all files
npm run lint:fix
```

## Manual Fixes Required

After running auto-fix, you'll need to manually fix:

1. **Unused Variables** - Prefix with underscore or remove
   ```typescript
   // Instead of:
   const unused = 'value';
   
   // Use:
   const _unused = 'value';
   // Or remove it entirely
   ```

2. **Replace `any` Types** - Add proper TypeScript types
   ```typescript
   // Instead of:
   const data: any = {};
   
   // Use:
   interface DataType {
     field: string;
   }
   const data: DataType = { field: 'value' };
   ```

3. **Console Statements** - Use ConsolidatedLogger
   ```typescript
   // Instead of:
   console.log('message');
   
   // Use:
   import { ConsolidatedLogger } from '@/utils/logger';
   const logger = new ConsolidatedLogger('ComponentName');
   logger.info('message');
   ```

4. **Duplicate Imports** - Combine them
   ```typescript
   // Instead of:
   import { A } from '@/module';
   import { B } from '@/module';
   
   // Use:
   import { A, B } from '@/module';
   ```

## Check Remaining Issues

After fixes, check what's left:
```bash
npm run lint
```

## Files Already Fixed

The following files have been manually fixed:
- `src/services/recommendationService.ts` ✅
- `src/services/reviewDataService.ts` ✅
- `src/utils/analysisUtils.ts` ✅
- `supabase/functions/generate-recommendations/index.ts` ✅

## Progress

- Initial errors: 19,614 (18,934 errors, 680 warnings)
- After manual fixes: ~992 errors remaining
- After auto-fix: Expected <100 errors remaining
