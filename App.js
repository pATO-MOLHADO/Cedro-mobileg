import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import Navigation from './src/navigation';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#1a6b47" />
      <Navigation />
    </AuthProvider>
  );
}
