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
   git checkout phase-2-state-simplification  # Use the stable branch
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Database setup**
   ```bash
   # Run the final migration (if not already done)
   supabase db reset
   ```

4. **Deploy edge functions**
   ```bash
   supabase functions deploy generate-recommendations
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Add OpenAI API key**
   - Open browser console
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
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional Settings
- **OpenAI API Key**: Add in browser for AI recommendations
- **Email notifications**: Configure in dashboard settings

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
git push origin phase-2-state-simplification
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
2. Create a feature branch from `phase-2-state-simplification`
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: GitHub Issues tab
- **Documentation**: This README
- **Updates**: Check the updateLog.md file

---

Built with ❤️ for business owners who want to understand their customers better.