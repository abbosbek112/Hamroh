# Hamroh AI

Professional productivity and community platform built with React, TypeScript, and Supabase.

## 🚀 Features

- **Intizom (Discipline)**: Todo lists, daily journal, focus timer, routines, and statistics
- **Community**: Groups, direct messages, challenges with leaderboards, and ratings
- **Market**: XP-based store with inventory system
- **Admin Dashboard**: User management, analytics, and system monitoring
- **Multi-language**: Uzbek, Russian, and English support
- **PWA**: Progressive Web App with offline support

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **UI**: Lucide React icons, Recharts for analytics
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

## 🔧 Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd hamroh-ai
npm install
```

### 2. Environment Variables

Create `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_POSTHOG_KEY=your_posthog_key  # Optional: analytics
VITE_SENTRY_DSN=your_sentry_dsn   # Optional: error tracking (sentry.io)
VITE_SKIP_EMAIL_VERIFICATION=false
VITE_DEBUG=false
```

### 3. Database Setup

Run the complete database setup script in Supabase SQL Editor:

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `COMPLETE_DATABASE_SETUP.sql`
3. Paste and run in SQL Editor

This will create:
- All tables (users, todos, challenges, groups, messages, etc.)
- Row Level Security (RLS) policies
- Triggers and functions
- `check_in_challenge` RPC function
- Admin user setup (if admin@hamroh.ai exists in auth.users)

### 4. Development

```bash
npm run dev
```

App runs on `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
```

Output: `dist/` directory

## 📜 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - TypeScript type checking

## 🔒 Security

- **No hardcoded credentials**: Admin backdoor removed, all auth through Supabase
- **RLS enabled**: Row Level Security on all tables
- **Production-safe logger**: Sensitive data not logged in production
- **Input validation**: User inputs validated and sanitized
- **Environment variables**: All secrets in `.env` (not committed)

## 📁 Project Structure

```
hamroh-ai/
├── components/          # React components
│   ├── intizom/        # Discipline features
│   ├── community/      # Community features
│   └── ...
├── pages/              # Page components
├── contexts/           # React contexts (Auth, Language, Toast)
├── services/           # API and service layers
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
├── types.ts            # TypeScript type definitions
├── constants.ts        # Constants and translations
├── supabase/           # Database migrations
└── COMPLETE_DATABASE_SETUP.sql  # Complete DB setup
```

## 🌍 Internationalization

Supported languages: Uzbek (`uz`), Russian (`ru`), English (`en`)

Translations in `constants.ts` under `TRANSLATIONS` object.

## 🧪 Code Quality

- **ESLint**: Configured with TypeScript and React rules
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Git hooks**: Recommended to add pre-commit hooks for lint/format

## 📊 Database Schema

Key tables:
- `users` - User profiles and XP
- `todos` - Todo items
- `challenges` - Community challenges
- `challenge_participants` - Challenge participation and check-ins
- `groups` - Community groups
- `messages` - Group messages
- `dm_messages` - Direct messages
- `store_items` - Market items
- `user_inventory` - User purchased items

See `COMPLETE_DATABASE_SETUP.sql` for full schema.

## 🚀 Deployment

### Vercel / Netlify

1. Connect repository
2. Set environment variables
3. Build command: `npm run build`
4. Output directory: `dist`

### Self-hosted

1. Build: `npm run build`
2. Serve `dist/` with nginx/apache
3. Configure environment variables on server

## 📝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Run `npm run lint` and `npm run format`
5. Submit pull request

## 📄 License

[Your License Here]

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Contact: [Your Contact Info]

---

**Built with ❤️ for productivity and community**
