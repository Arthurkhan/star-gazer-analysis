# 2025-06-28: Fix "Has Response" Filter

## Summary

This update fixes a critical bug where the "Has Response" filter in the Detailed Reviews section was not returning any reviews. The issue was caused by an incorrect property being used in the filter logic.

## Changes

- Fixed the "Has Response" filter logic in `src/components/ReviewsTable.tsx` to use the `reviewFieldAccessor.getResponseText(review)` function to correctly identify reviews with responses.

## Impact

The "Has Response" filter in the Detailed Reviews section will now work as expected, allowing users to filter reviews based on whether they have a response from the owner.