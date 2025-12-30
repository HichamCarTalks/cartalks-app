import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
// Note: In Expo 50, NetInfo is usually installed via @react-native-community/netinfo
// If not installed, we should gracefully fallback or assume online.
// Since we can't run 'npm install', we check if it's available or mock it.
// Ideally, the user needs to install this package.
import NetInfo from '@react-native-community/netinfo';

const { width } = Dimensions.get('window');

export default function OfflineNotice() {
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (connected) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>No Internet Connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#b52424',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width,
    position: 'absolute',
    top: 50, // Below status bar
    zIndex: 9999,
  },
  text: { 
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  }
});