# Star-Gazer-Analysis

A simple, powerful Google Maps review analysis tool with AI-powered recommendations for businesses.

## ✨ Features

- **Real-time Review Analysis** - Comprehensive analysis of Google Maps reviews
- **AI-Powered Recommendations** - Generate actionable business insights using OpenAI
- **Multi-Business Support** - Analyze multiple businesses from a single dashboard
- **Visual Analytics** - Charts, sentiment analysis, and trend identification
- **Export Functionality** - Export recommendations and analysis results

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key (for AI recommendations)

### Installation

1. **Clone and install**
   ```bash
   git clone https://github.com/Arthurkhan/star-gazer-analysis.git
   cd star-gazer-analysis
   npm install
   ```

2. **Environment setup**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   **Where to find these:**
   - Go to your [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Navigate to Settings → API
   - Copy the "Project URL" → `VITE_SUPABASE_URL`
   - Copy the "anon public" key → `VITE_SUPABASE_ANON_KEY`

3. **Database setup**
   ```bash
   # Run the migrations (if using Supabase CLI)
   supabase db reset
   ```

4. **Deploy edge functions** (optional, for AI features)
   ```bash
   supabase functions deploy generate-recommendations
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5173](http://localhost:5173)

6. **Add OpenAI API key** (for AI recommendations)
   - Open browser DevTools console (F12)
   - Run: `localStorage.setItem('OPENAI_API_KEY', 'your-key-here')`

## 🏗️ Architecture

Simple and clean architecture optimized for 3 businesses:

```
Frontend (React + TypeScript + Tailwind)
├── Dashboard with tabs (Overview, Reviews, Recommendations, etc.)
├── Business selector (simple dropdown)
└── Real-time charts and analytics

Backend (Supabase)
├── PostgreSQL database (normalized schema)
├── Edge Functions (AI recommendations)
└── Real-time subscriptions

External Services
├── OpenAI GPT-4o-mini (AI recommendations)  
└── n8n automation (daily review collection)
```

## 📊 Database Schema

Core tables:
```sql
businesses (id, name, business_type, created_at)
reviews (id, business_id, stars, text, publishedatdate, ...)
saved_recommendations (id, business_id, recommendations, created_at)
```

## 🎯 Usage

1. Select a business from the dropdown
2. View analytics in the Overview tab
3. Browse reviews in the Reviews tab
4. Generate AI recommendations in the Recommendations tab
5. Export results using the export buttons

## ⚙️ Configuration

### Environment Variables
```bash
# Required - Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional - Set in browser localStorage
# OPENAI_API_KEY=your_openai_api_key
```

### Troubleshooting Environment Variables

If you see the error: **"supabaseKey is required"**

1. Make sure you've created `.env.local` (not `.env`)
2. Ensure the file is in the project root directory
3. Double-check your credentials from Supabase dashboard
4. Restart the development server after adding the variables

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run preview  # Test production build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🧪 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run test         # Run tests
npm run format       # Format code with Prettier
```

### Key Development Commands
```bash
# Supabase
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy generate-recommendations

# Git workflow  
git add .
git commit -m "feat: your feature"
git push origin main
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── dashboard/      # Dashboard-specific components
│   └── ...
├── hooks/              # Custom React hooks  
├── services/           # API services
├── types/              # TypeScript definitions
├── utils/              # Utility functions
└── pages/              # Main pages

supabase/
├── functions/          # Edge functions
└── migrations/         # Database migrations
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: GitHub Issues tab
- **Documentation**: This README
- **Update Logs**: Check the `/update-logs` directory

---

Built with ❤️ for business owners who want to understand their customers better.
