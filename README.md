# Star-Gazer Analysis

A sophisticated Google Maps review analysis tool with AI-powered recommendations for businesses. This application helps business owners gain insights from their customer reviews, identify trends, and receive actionable recommendations.

## Features

### Core Features
- 📊 Review analytics dashboard with visualizations
- 🤖 AI-powered recommendations using OpenAI GPT-4 or browser-based models
- 📈 Detailed trend analysis and pattern recognition
- 🌟 Staff performance tracking
- 🔍 Sentiment analysis and theme extraction

### Enhanced Features (New)
- 📧 **Email Notification System** - Receive weekly summaries, monthly reports, and urgent alerts
- 📱 **Advanced PDF/CSV Exports** - Generate professional reports with custom branding
- 📆 **Period Comparison** - Compare metrics across different time periods
- 📊 **Enhanced Analysis Display** - Advanced visualization of review clusters, trends, and patterns
- 🔄 **Improved UI Components** - Better user experience across all features

## Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: Transformers.js (browser) + OpenAI API (cloud)
- **Data Visualization**: Recharts
- **PDF Generation**: jsPDF
- **Email Service**: Resend API

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or bun
- Supabase account (for database and edge functions)
- OpenAI API key (optional, for cloud AI)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Arthurkhan/star-gazer-analysis.git
cd star-gazer-analysis
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Create a `.env.local` file with your API keys:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key (optional)
RESEND_API_KEY=your_resend_key (for email notifications)
```

4. Start the development server:
```bash
npm run dev
# or
bun run dev
```

## Project Structure

- `/src/components` - React components
- `/src/hooks` - Custom React hooks
- `/src/services` - API and service layers
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions
- `/supabase/functions` - Supabase Edge Functions

## Key Components

### Analysis Dashboard
The main dashboard displays review analytics with filters and visualizations for different metrics.

### Enhanced Analysis
Advanced data analysis including:
- Review clusters (grouped by sentiment and themes)
- Historical trends (with forecasting)
- Temporal patterns (daily, weekly, monthly)
- Seasonal analysis

### Period Comparison
Compare metrics across different time periods to identify trends, improvements, and areas of concern.

### Email Notifications
Configure and manage email notifications with different schedules:
- Weekly summaries
- Monthly comprehensive reports
- Urgent alerts for critical issues

### Export System
Generate custom reports in PDF or CSV format with:
- Business branding
- Customizable content sections
- Interactive charts and visualizations
- Data tables for deeper analysis

## Deployment

Build the project for production:
```bash
npm run build
# or
bun run build
```

The build artifacts will be stored in the `dist/` directory, ready to be deployed to any static hosting service.

## Upcoming Features

- Mobile application
- Multi-user support with role-based access
- Custom AI provider integration
- Advanced competitor tracking
- API integration with other business tools

## License

This project is licensed under the MIT License - see the LICENSE file for details.
