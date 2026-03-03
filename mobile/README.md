# Hamroh AI - Mobile App

React Native + Expo mobile application for Hamroh AI - a personal development companion for Uzbek users.

## Tech Stack

- **Expo** ~52.0.0 with Expo Router
- **React Native** 0.76.5
- **TypeScript**
- **Supabase** (same backend as web app)
- **expo-secure-store** for secure token storage
- **AsyncStorage** for preferences
- **lucide-react-native** for icons

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your device (for development)

### Installation

```bash
cd mobile
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Running

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout with providers
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx       # Login screen
│   ├── (tabs)/
│   │   ├── _layout.tsx     # Tab navigator
│   │   ├── index.tsx       # Home tab
│   │   ├── intizom.tsx     # Intizom tab
│   │   ├── community.tsx   # Community tab
│   │   └── market.tsx      # Market tab
│   ├── settings.tsx
│   ├── support.tsx
│   ├── about.tsx
│   └── admin.tsx
├── contexts/               # React contexts (adapted from web)
├── services/               # API services
├── types/                  # TypeScript types
├── constants/              # Translations
├── utils/                  # Utilities
├── app.json                # Expo config
├── eas.json                # EAS Build config
└── package.json
```

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## Notes

- Uses the same Supabase backend as the web app
- Authentication uses `expo-secure-store` instead of `localStorage`
- Language preference stored with `AsyncStorage`
- All translations from web app `constants.ts` are preserved
