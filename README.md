# AI Asset Accelerator - Frontend

A React Native (Expo) mobile application for scanning and identifying various assets using AI-powered image recognition.

## 🚀 Features

- **AI-Powered Scanning**: Upload images to identify assets using GPT-4o Vision API
- **Theme-Agnostic Design**: Easily switch between different asset types (coins, cards, birds, stamps)
- **Glassmorphic UI**: Modern, beautiful interface with light/dark mode support
- **Offline Support**: Queue scans when offline and sync when back online
- **Device-Based Auth**: No user accounts required - uses device ID for authentication
- **Premium Features**: In-app purchases via RevenueCat
- **Haptic Feedback**: Enhanced user experience with tactile responses

## 🏗️ Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6 (Bottom Tabs)
- **Styling**: Styled Components with glassmorphic design
- **State Management**: React Context
- **Storage**: AsyncStorage for local persistence
- **Networking**: Axios with offline queue support
- **Camera**: Expo Camera with custom overlay
- **Permissions**: Expo Permissions API
- **Theming**: Automatic dark/light mode detection

## 📱 Screens

1. **Home Screen**
   - App logo and headline
   - Identify button to start scanning
   - Recent scans list with total value counter
   - Pull-to-refresh functionality

2. **Scanner Screen**
   - Camera view with circular overlay
   - Gallery, flash, and help controls
   - Real-time image processing
   - Loading states and error handling

3. **Collections Screen**
   - Two tabs: "Top Value" and "All Scans"
   - Statistics header (total items, value, average)
   - Glassmorphic cards with scan details
   - Confidence indicators

4. **Settings Screen**
   - Premium membership management
   - Theme and personalization options
   - Device settings and cache management
   - Support and feedback options

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- Yarn package manager
- Expo CLI
- iOS Simulator or Android Emulator
- Backend API running (see backend README)

### Installation

1. **Install dependencies**:
   ```bash
   yarn install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your actual values:
   ```
   BACKEND_URL=http://localhost:3000
   OPENAI_API_KEY=your_openai_api_key_here
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   REVENUECAT_API_KEY=your_revenuecat_api_key
   ```

3. **Start the development server**:
   ```bash
   yarn start
   ```

4. **Run on device/simulator**:
   ```bash
   # iOS
   yarn ios
   
   # Android
   yarn android
   
   # Web (for testing)
   yarn web
   ```

## 📁 Project Structure

```
src/
├── api/                 # API client and endpoints
│   ├── client.ts       # Axios configuration and interceptors
│   └── index.ts        # Exported API functions
├── components/         # Reusable UI components
│   ├── GlassCard.tsx   # Glassmorphic card component
│   ├── HapticButton.tsx # Button with haptic feedback
│   └── Header.tsx      # Screen header component
├── contexts/           # React Context providers
│   ├── ThemeContext.tsx      # Theme management
│   └── PreferencesContext.tsx # User preferences
├── navigation/         # Navigation configuration
│   └── BottomTabs.tsx  # Bottom tab navigator
├── screens/           # Screen components
│   ├── HomeScreen.tsx
│   ├── ScanScreen.tsx
│   ├── CollectionsScreen.tsx
│   └── SettingsScreen.tsx
├── theme/             # Theme configuration
│   ├── colors.ts      # Color schemes
│   └── fonts.ts       # Typography
└── utils/             # Utility functions
    ├── storage.ts     # AsyncStorage helpers
    └── strings.ts     # Localized strings
```

## 🎨 Theming

The app supports automatic light/dark mode switching and is designed to be theme-agnostic:

- **Colors**: Defined in `src/theme/colors.ts` with light/dark variants
- **Fonts**: Typography system in `src/theme/fonts.ts`
- **Glassmorphic Effects**: Translucent cards with blur effects
- **Asset Types**: Configurable via `scanType` preference

### Supported Asset Types

- **Coins** (default) - 🪙
- **Trading Cards** - 🃏
- **Birds** - 🐦
- **Stamps** - 📮

## 🔧 Configuration

### App Configuration (`app.json`)

- **Bundle ID**: `com.zephryx.aiassetaccelerator`
- **Deep Linking**: `zephryx://` scheme
- **Permissions**: Camera, Photo Library
- **Expo Plugins**: Camera configuration

### TypeScript Configuration

- Path aliases for clean imports (`@/components/*`)
- Strict mode disabled for easier development
- React Native JSX support

## 🧪 Development

### Available Scripts

```bash
# Start development server
yarn start

# Run on iOS simulator
yarn ios

# Run on Android emulator
yarn android

# Run on web (for testing)
yarn web

# Type checking
yarn tsc

# Linting
yarn lint

# Build for production
yarn build
```

### Code Style

- **File Naming**: camelCase for files and components
- **Imports**: Absolute imports using path aliases
- **Styling**: Styled Components with TypeScript
- **State**: React hooks with TypeScript interfaces

## 🔐 Security

- **Device Authentication**: No user accounts, uses generated device ID
- **API Keys**: Environment variables, not committed to git
- **Permissions**: Granular camera and storage permissions
- **Data Storage**: Local AsyncStorage with encryption consideration

## 📊 Analytics

The app includes hooks for analytics tracking:

- Screen views
- Scan events (started, completed)
- Premium interactions
- Error tracking

## 🚀 Deployment

### Building for Production

1. **Update version** in `app.json`
2. **Build for stores**:
   ```bash
   # iOS
   expo build:ios
   
   # Android
   expo build:android
   ```

### Environment Considerations

- **Development**: Uses localhost backend
- **Production**: Configure production API URLs
- **Testing**: Supports web builds for rapid testing

## 🤝 Contributing

1. Follow the existing code style
2. Add TypeScript types for new components
3. Test on both iOS and Android
4. Update documentation for new features

## 📄 License

This project is part of the AI Asset Accelerator suite. See main project LICENSE for details. 