# 🚗 CarTalks

CarTalks is a cross-platform mobile chat application that connects car owners through their license plates. Built with React Native and Expo.

## Features

- 🔐 **Simple Authentication**: Login with your name and license plate
- 🔍 **License Plate Search**: Find and connect with other car owners
- 💬 **Real-time Chat**: Message other users directly through the app
- 📱 **Cross-Platform**: Works on iOS, Android, and Web

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your platform of choice:
   - **iOS**: Press `i` in the terminal or run `npm run ios`
   - **Android**: Press `a` in the terminal or run `npm run android`
   - **Web**: Press `w` in the terminal or run `npm run web`

## Project Structure

```
cartalks-app/
├── src/
│   └── screens/
│       ├── LoginScreen.js          # Authentication screen
│       ├── LicensePlateSearchScreen.js  # Search for cars
│       ├── ChatListScreen.js       # View all chats
│       └── ChatScreen.js           # Individual chat interface
├── App.js                          # Main app navigation
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
└── README.md                       # This file
```

## Screens

### Login Screen
- Enter your name and license plate to get started
- Beautiful gradient design

### Search Screen
- Search for cars by license plate
- View car details and owner information
- Start conversations with car owners

### Chat List Screen
- View all your active conversations
- See unread message indicators
- Quick access to recent chats

### Chat Screen
- Real-time messaging interface
- View conversation history
- Send and receive messages

## Technology Stack

- **React Native**: Cross-platform mobile framework
- **Expo**: Development toolchain and services
- **React Navigation**: Navigation library
- **Expo Linear Gradient**: Beautiful UI gradients

## Development

This is a prototype with mock data. To build a production-ready app, you'll need to:

1. Set up a backend server (Node.js, Firebase, etc.)
2. Implement real authentication
3. Add a database for user profiles and license plates
4. Implement real-time messaging (WebSockets, Firebase, etc.)
5. Add license plate verification/validation
6. Implement proper privacy and security measures
7. Add image uploads for car photos
8. Implement push notifications

## Future Enhancements

- [ ] User profiles with car photos
- [ ] License plate verification
- [ ] Location-based discovery
- [ ] Push notifications for new messages
- [ ] Image sharing in chats
- [ ] Block/report functionality
- [ ] Dark mode support

## License

This project is a prototype for development purposes.

## Contributing

This is a prototype project. Feel free to fork and extend it for your own use.
