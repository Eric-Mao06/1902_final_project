import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, Linking } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import { API_URL } from '../constants/Config';
import { Colors } from '../constants/Colors';

export default function LinkedInPage() {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [error, setError] = useState('');
  const { user, setUser } = useAuth();

  // Add debugging logs
  useEffect(() => {
    console.log('Current user state:', user);
  }, [user]);

  const handleSubmit = async () => {
    try {
      // Basic URL validation
      if (!linkedinUrl.includes('linkedin.com/')) {
        setError('Please enter a valid LinkedIn URL');
        return;
      }

      // Add null check before making the request
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const response = await fetch(`${API_URL}/users/update_linkedin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          linkedin_url: linkedinUrl,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser({ ...user, ...updatedUser });
        
        // Redirect to LinkedIn page if URL not set, otherwise to main app
        if (!user.linkedin_url) {
          await Linking.openURL('/linkedin');
        } else {
          router.replace('/');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update LinkedIn URL');
      }
    } catch (error) {
      console.error('Error updating LinkedIn URL:', error);
      setError('An error occurred while updating your LinkedIn URL');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Your LinkedIn Profile</Text>
      <Text style={styles.subtitle}>
        Please enter your LinkedIn profile URL to complete your registration
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="https://www.linkedin.com/in/your-profile"
        value={linkedinUrl}
        onChangeText={setLinkedinUrl}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <Text
        style={styles.button}
        onPress={handleSubmit}
      >
        Continue
      </Text>
      

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: Colors.light.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: Colors.light.background,
  },
  error: {
    color: Colors.light.tint,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.light.icon,
    padding: 15,
    borderRadius: 8,
    textAlign: 'center',
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    marginTop: 15,
    padding: 15,
    textAlign: 'center',
    color: Colors.light.text,
    fontSize: 16,
  },
});
