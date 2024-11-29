import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Redirect } from 'expo-router';

export default function HomePage() {
  const { user } = useAuth();

  // If no user is logged in, redirect to auth page
  if (!user) {
    return <Redirect href="/auth" />;
  }

  // If user hasn't set up LinkedIn URL, redirect to LinkedIn setup
  if (!user.linkedin_url) {
    return <Redirect href="/linkedin" />;
  }

  return <Redirect href="/" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
