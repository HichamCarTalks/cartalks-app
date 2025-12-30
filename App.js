import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Alert, Platform } from 'react-native';
import { Auth, api } from './src/config/api';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import OfflineNotice from './src/components/OfflineNotice';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { navigationRef, navigate } from './src/navigation/navigationRef';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import LicensePlateSearchScreen from './src/screens/LicensePlateSearchScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ route }) {
  // Pass user params down to screens if needed
  const user = route.params?.user;
  
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Search" 
        component={LicensePlateSearchScreen}
        options={{ title: 'Find Cars' }}
      />
      <Tab.Screen 
        name="Chats" 
        component={ChatListScreen}
        options={{ title: 'My Chats' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        initialParams={{ user }}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkSession();
    registerForPushNotificationsAsync();
    
    // Handle notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { conversationId, recipientName, licensePlate } = response.notification.request.content.data;
      
      console.log('Notification tapped:', conversationId);
      navigate('Chat', {
        recipientName: recipientName || 'Driver',
        licensePlate: licensePlate || 'Unknown' // Ideally passed in data
      });
    });

    return () => subscription.remove();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'web') return;

    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      
      // Save token to backend if user is logged in, or save to state to send later
      // For now, we'll try to save it after login or if session exists
      const user = await Auth.getUser();
      if (user && token) {
         await api.put('/users', { id: user.id, pushToken: token });
      }
    }
  };

  const checkSession = async () => {
    const session = await Auth.getUser();
    if (session) {
      setUser(session);
      setInitialRoute('Main');
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
      <OfflineNotice />
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="auto" />
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Main" 
            component={MainTabs}
            initialParams={{ user }}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ title: 'Chat' }}
          />
          <Stack.Screen 
            name="AdminDashboard" 
            component={AdminDashboardScreen}
            options={{ title: 'Admin Dashboard' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      </View>
    </ErrorBoundary>
  );
}
