#!/bin/bash

# Test Supabase Edge Function - AI Recommendations
# This script helps test if the edge function is working correctly

echo "Testing AI Recommendations Edge Function..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${RED}Error: OPENAI_API_KEY environment variable is not set${NC}"
    echo "Please set it before running this script:"
    echo "export OPENAI_API_KEY='your-api-key'"
    exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${YELLOW}Warning: SUPABASE_ANON_KEY environment variable is not set${NC}"
    echo "Using placeholder value. Set it for production testing:"
    echo "export SUPABASE_ANON_KEY='your-supabase-anon-key'"
    SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
fi

# Check if the edge function is deployed
echo -e "${YELLOW}Checking function deployment...${NC}"
supabase functions list

echo -e "\n${YELLOW}Testing function with curl...${NC}"

# Get the function URL
FUNCTION_URL="https://nmlrvkcvzzeewhamjxgj.supabase.co/functions/v1/generate-recommendations"

# Test payload - using environment variable for API key
read -r -d '' TEST_PAYLOAD << EOM
{
  "businessData": {
    "businessName": "Test Business",
    "businessType": "CAFE",
    "reviews": [
      {
        "stars": 5,
        "text": "Great coffee and service!",
        "publishedAtDate": "2025-06-01"
      },
      {
        "stars": 4,
        "text": "Nice atmosphere but a bit pricey",
        "publishedAtDate": "2025-06-02"
      }
    ]
  },
  "apiKey": "$OPENAI_API_KEY"
}
EOM

echo -e "${YELLOW}Sending test request...${NC}"
echo "URL: $FUNCTION_URL"
echo "Payload: (API key hidden for security)"

# Send the request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d "$TEST_PAYLOAD")

# Extract HTTP status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "\n${YELLOW}Response:${NC}"
echo "HTTP Status: $HTTP_CODE"
echo "Body: $BODY"

# Check status
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "\n${GREEN}✓ Function is working correctly!${NC}"
else
    echo -e "\n${RED}✗ Function returned an error. Status: $HTTP_CODE${NC}"
    echo -e "${YELLOW}To view logs, run: npm run functions:logs${NC}"
fi

echo -e "\n${YELLOW}Note: To view function logs, use:${NC}"
echo "npm run functions:logs"
echo "or"
echo "supabase functions logs generate-recommendations"
