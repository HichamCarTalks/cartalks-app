# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

CarTalks is a cross-platform mobile chat application (React Native with Expo) that connects car owners through their license plates. This is currently a **prototype with mock data only** - there is no backend server, real authentication, or persistent data storage.

## Development Commands

### Running the App
- `npm install` - Install dependencies
- `npm start` - Start Expo development server (shows QR code and menu)
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device (macOS only)
- `npm run web` - Run in web browser

### Expo Development Server
When running `npm start`, you can press keys in the terminal:
- `a` - Open on Android
- `i` - Open on iOS
- `w` - Open in web browser
- `r` - Reload app
- `m` - Toggle menu

## Architecture

### Navigation Structure
The app uses a nested navigation structure that is important to understand:

```
Stack Navigator (root)
├── Login Screen (initial route, no header)
├── Main (Tab Navigator, no header)
│   ├── Search Tab → LicensePlateSearchScreen
│   └── Chats Tab → ChatListScreen
└── Chat Screen (pushed on stack, has header)
```

**Key points:**
- Login screen uses `navigation.replace('Main')` to prevent going back to login
- Chat screen is in the root Stack Navigator, not nested in tabs
- This allows navigating to Chat from either Search or Chat List tabs
- Tab bar remains hidden when viewing individual Chat screen

### Mock Data Pattern
All screens currently use mock data defined directly in components:
- `LicensePlateSearchScreen.js` - `mockCars` array for search results
- `ChatListScreen.js` - `mockChats` array for conversation list
- `ChatScreen.js` - `mockMessages` array initialized in `useEffect`

**When implementing backend integration:**
- Replace mock arrays with API calls or state management
- Keep the same data structure for minimal refactoring
- Authentication context/state needs to be added at App.js level

### Screen Organization
All screens are in `src/screens/`:
- `LoginScreen.js` - Entry point, uses LinearGradient
- `LicensePlateSearchScreen.js` - Search and initiate chats
- `ChatListScreen.js` - View all conversations
- `ChatScreen.js` - Individual chat interface

Each screen is self-contained with its own styles (StyleSheet.create at bottom of file).

### Navigation Parameters
Screens pass data via route params:
- Chat screen expects: `{ recipientName: string, licensePlate: string }`
- These params come from either Search or Chat List screens
- Access via `route.params` destructuring

## Key Technical Constraints

### Platform-Specific Behavior
- `KeyboardAvoidingView` behavior differs: iOS uses 'padding', Android/Web use 'height'
- Always test keyboard interactions on both iOS and Android

### React Native Styling
- No CSS files - all styling via StyleSheet API
- Flexbox is the default layout (flex direction is 'column' by default)
- Colors use hex values or named colors
- Shadows differ between platforms (shadowColor/shadowOffset/etc for iOS, elevation for Android)

## Future Development Roadmap

Per README.md, to make this production-ready you need to:
1. Backend server (Node.js, Firebase, etc.)
2. Real authentication system
3. Database for users and license plates
4. Real-time messaging (WebSockets, Firebase, etc.)
5. License plate verification/validation
6. Privacy and security measures
7. Image uploads for cars
8. Push notifications

## Project-Specific Conventions

- Component file names use PascalCase (e.g., `LoginScreen.js`)
- Styles object is always named `styles` and defined at bottom of file
- Color scheme: Primary purple (#667eea, #764ba2 for gradients), Green (#4CAF50 for CTAs)
- All screens use functional components with hooks (no class components)
