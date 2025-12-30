# CarTalks App

CarTalks is a mobile application that allows drivers to connect with each other using their license plates. It includes a web dashboard for administration and a mobile app for users.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Azure Account (for Backend)
- Expo Go (on your phone) or Android Studio/Xcode (for building)

### 1. Installation
```bash
npm install
cd api && npm install
```

### 2. Running Locally (Web)
```bash
# Start the Expo app
npx expo start --web
```
*Note: The API will not work locally unless you run the Azure Functions separately or connect to a deployed instance.*

### 3. Running Locally (Mobile)
```bash
# 1. Update src/config/api.js
# Change the IP address in getBaseUrl() to your computer's local IP.

# 2. Start Expo
npx expo start

# 3. Scan the QR code with Expo Go on your phone.
```

## 📱 Building for Mobile (Android APK)

To generate an installable APK file for Android:

1.  **Install EAS CLI**: `npm install -g eas-cli`
2.  **Login**: `eas login`
3.  **Build**:
    ```bash
    eas build -p android --profile preview
    ```
4.  Download the APK from the link provided.

## ☁️ Deployment (Azure)

### Backend & Web Hosting
The app is configured for **Azure Static Web Apps**.

1.  Push code to GitHub.
2.  Create a Static Web App in Azure Portal connected to your repo.
    - App Location: `/`
    - Output Location: `dist`
    - API Location: `api`
3.  **Environment Variables**: Go to your Static Web App -> Configuration -> Application Settings and add:
    - `COSMOS_DB_ENDPOINT`: Your Cosmos DB URI.
    - `COSMOS_DB_KEY`: Your Cosmos DB Key.
    - `AZURE_STORAGE_CONNECTION_STRING`: Connection string for Blob Storage.

### Mobile App Configuration
Once deployed to Azure, update `src/config/api.js`:
```javascript
const PROD_API_URL = 'https://your-app-name.azurestaticapps.net';
```
Then rebuild your mobile app using EAS.

## 🛡️ Features
- **License Plate Search**: Find owners by plate.
- **Chat**: Connect with other drivers.
- **Verification**: Upload "Kentekenkaart" to verify ownership.
- **Admin Dashboard**: Manage users and disputes.
- **Strict Validation**: Checks for valid Dutch license plate formats.
