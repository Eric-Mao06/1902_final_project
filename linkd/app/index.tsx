import React, { useState } from 'react';
import { StyleSheet, TextInput, View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { API_URL } from '@/constants/Config';

interface Profile {
  _id: string;
  name?: string;
  role?: string;
  company?: string;
  location?: string;
  linkedin_url?: string;
  skills?: string[];
  experience?: string[];
  education?: string;
  summary?: string;
  score?: number;
}

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Response status:', response.status);
        console.error('Response text:', errorData);
        throw new Error(`Search failed: ${errorData}`);
      }
      
      const data = await response.json();
      setSearchResults(data.results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to fetch results: ${errorMessage}`);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Linkd' }} />
      
      <ThemedView style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search alumni (e.g., 'alumni in tech')"
          placeholderTextColor="#666"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isLoading}
        >
          <Text style={styles.searchButtonText}>
            {isLoading ? 'Searching...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </ThemedView>

      {error ? (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      ) : null}

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <ScrollView style={styles.resultsContainer}>
          {searchResults.map((profile) => (
            <View key={profile._id} style={styles.profileCard}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.role}>{profile.role}</Text>
              <Text style={styles.company}>{profile.company}</Text>
              <Text style={styles.location}>{profile.location}</Text>
              
              {profile.summary && (
                <>
                  <Text style={styles.sectionTitle}>Summary</Text>
                  <Text style={styles.summaryText}>{profile.summary}</Text>
                </>
              )}
              
              {profile.experience && profile.experience.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Experience</Text>
                  {profile.experience.map((exp, index) => (
                    <Text key={index} style={styles.experienceItem}>{exp}</Text>
                  ))}
                </>
              )}
              
              {profile.linkedin_url && (
                <TouchableOpacity 
                  style={styles.linkedinButton}
                  onPress={() => Linking.openURL(profile.linkedin_url!)}
                >
                  <Text style={styles.linkedinButtonText}>View on LinkedIn</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  role: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  company: {
    fontSize: 16,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  linkedinButton: {
    backgroundColor: '#0077B5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  linkedinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  experienceItem: {
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 8,
  },
  loader: {
    marginTop: 20,
  },
  resultsContainer: {
    flex: 1,
  },
});
