# Star-Gazer-Analysis

A Google Maps review analysis tool with AI-powered recommendations for businesses.

## 🚀 Recent Fixes (May 16, 2025)

We've implemented several fixes to resolve the white screen issue and improve the application's stability:

### 1. Build Script Fix
- Added the missing `build:dev` script to package.json that was required by the build system

### 2. Authentication Improvements
- Enhanced error handling in the authentication flow
- Added a dedicated error UI for authentication failures
- Implemented proper error logging and display

### 3. Toast System Fixes
- Fixed the toast implementation to prevent circular dependencies
- Properly integrated Sonner toast library
- Added consistent error notification system

### 4. AI Service Enhancements
- Improved error handling in the recommendation service
- Added defensive coding patterns for data access
- Implemented fallback mechanisms for AI processing failures

### 5. Debugging Utilities
- Added a comprehensive debugging system
- Implemented global error catching
- Added a debug mode toggle (Ctrl+Shift+D) for development assistance

### 6. Safe Data Access Patterns
- Created utility functions for safely accessing potentially undefined data
- Implemented safeguards against common "Cannot read properties of undefined" errors

## 🔧 Development Setup

```bash
git clone https://github.com/Arthurkhan/star-gazer-analysis
cd star-gazer-analysis
npm install

# Environment Variables (.env.local)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key (for testing)

# Run Development Server
npm run dev

# Build for Production
npm run build

# Build for Development (newly added)
npm run build:dev
```

## 🛠️ Troubleshooting 

If you encounter issues:

1. **Check the console for errors**
   - Press F12 to open developer tools
   - Look at the console tab for error messages

2. **Enable Debug Mode**
   - Press Ctrl+Shift+D to toggle debug mode
   - Check the console for detailed logs

3. **Authentication Issues**
   - Verify your Supabase environment variables are correctly set
   - Check browser console for authentication errors

4. **AI Processing Problems**
   - Verify your OpenAI API key is correctly set in local storage
   - The system will automatically fall back to browser-based AI if cloud AI fails

5. **Data Loading Issues**
   - The application uses defensive data loading patterns
   - If data appears missing, check the database connection

## 📋 Project Structure

- `/src/components` - React components
- `/src/hooks` - Custom React hooks
- `/src/services` - API and service layers
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions including new debugging tools

## 📊 Features

- Review analysis with sentiment detection
- Theme extraction from reviews
- Staff performance tracking
- Trend identification
- AI recommendations for business improvements
- Support for multiple business types
