#!/bin/bash

# =============================================================================
# PHASE 0 CLEANUP SCRIPT
# Star-Gazer Analysis Project Optimization
# =============================================================================
# This script removes unused files and directories as specified in 
# OPTIMIZATION_ROADMAP.md Phase 0
#
# Usage: chmod +x cleanup-phase-0.sh && ./cleanup-phase-0.sh
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}                    PHASE 0 CLEANUP SCRIPT${NC}"
echo -e "${BLUE}                   Star-Gazer Analysis Project${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""

# Verify we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo -e "${RED}❌ Error: This script must be run from the project root directory${NC}"
    echo -e "${RED}   Please ensure you're in the directory containing package.json${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 This script will delete the following files and directories:${NC}"
echo ""
echo "   📁 src/services/ai/ (entire directory)"
echo "   📄 src/utils/mockData.ts"
echo "   📄 src/utils/mockDataGenerator.ts"
echo "   📁 src/workers/ (entire directory)"
echo "   📁 src/utils/worker/ (entire directory)"
echo "   📁 src/utils/validation/ (entire directory)"
echo "   📄 src/utils/testingUtils.ts"
echo "   📄 src/utils/dataMigration.ts"
echo ""

# Ask for confirmation
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Operation cancelled by user${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🚀 Starting Phase 0 cleanup...${NC}"
echo ""

# Function to safely delete a file or directory
safe_delete() {
    local path="$1"
    local type="$2"  # "file" or "directory"
    
    if [ -e "$path" ]; then
        if [ "$type" = "directory" ]; then
            echo -e "   📁 Deleting directory: ${YELLOW}$path${NC}"
            rm -rf "$path"
        else
            echo -e "   📄 Deleting file: ${YELLOW}$path${NC}"
            rm "$path"
        fi
        echo -e "   ${GREEN}✅ Successfully deleted: $path${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Not found (already deleted?): $path${NC}"
    fi
}

# 1. Delete entire AI service directory
echo -e "${BLUE}1. Deleting AI service directory...${NC}"
safe_delete "src/services/ai" "directory"
echo ""

# 2. Delete mock data files
echo -e "${BLUE}2. Deleting mock data files...${NC}"
safe_delete "src/utils/mockData.ts" "file"
safe_delete "src/utils/mockDataGenerator.ts" "file"
echo ""

# 3. Delete unused utility directories
echo -e "${BLUE}3. Deleting unused utility directories...${NC}"
safe_delete "src/workers" "directory"
safe_delete "src/utils/worker" "directory"
safe_delete "src/utils/validation" "directory"
echo ""

# 4. Delete obsolete utilities
echo -e "${BLUE}4. Deleting obsolete utility files...${NC}"
safe_delete "src/utils/testingUtils.ts" "file"
safe_delete "src/utils/dataMigration.ts" "file"
echo ""

echo -e "${GREEN}🎉 Phase 0 cleanup completed successfully!${NC}"
echo ""

# Verification
echo -e "${BLUE}📝 Verification steps:${NC}"
echo ""
echo "1. Check for broken imports:"
echo -e "   ${YELLOW}npm run build${NC}"
echo ""
echo "2. If build fails, search for any remaining imports of deleted files:"
echo -e "   ${YELLOW}grep -r \"services/ai\" src/ || echo 'No AI service imports found'${NC}"
echo -e "   ${YELLOW}grep -r \"mockData\" src/ || echo 'No mock data imports found'${NC}"
echo -e "   ${YELLOW}grep -r \"testingUtils\" src/ || echo 'No testing utils imports found'${NC}"
echo ""
echo "3. Run the application to ensure it still works:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""

echo -e "${GREEN}Next steps:${NC}"
echo "• Update OPTIMIZATION_ROADMAP.md to mark Phase 0 as completed"
echo "• Create update log for Phase 0 completion"
echo "• Continue with Phase 1: Code Consolidation"
echo ""
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}                         CLEANUP COMPLETED${NC}"
echo -e "${BLUE}==============================================================================${NC}"
