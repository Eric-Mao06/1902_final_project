import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { API_URL } from '@/constants/Config';

interface Profile {
  _id: string;
  name?: string;
  role?: string;
  company?: string;
  location?: string;
  linkedin_url?: string;
  experience?: string[];
  summary?: string;
  score?: number;
}

export default function SearchScreen() {
  const { query } = useLocalSearchParams<{ query: string }>();
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        router.replace('/');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(query)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Search failed: ${errorData}`);
        }
        
        const data = await response.json();
        setSearchResults(data.results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to fetch results: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: `Results for "${query}"`,
          headerStyle: {
            backgroundColor: '#fff',
          },
        }} 
      />

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      {isLoading ? (
        <ActivityIndicator size="large" color="#0077B5" style={styles.loader} />
      ) : (
        <ScrollView style={styles.resultsContainer}>
          {searchResults.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No results found for "{query}"</Text>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace('/')}
              >
                <Text style={styles.backButtonText}>Try Another Search</Text>
              </TouchableOpacity>
            </View>
          ) : (
            searchResults.map((profile) => (
              <View key={profile._id} style={styles.profileCard}>
                <Text style={styles.name}>{profile.name}</Text>
                {profile.role && (
                  <Text style={styles.role}>{profile.role}</Text>
                )}
                {profile.company && (
                  <Text style={styles.company}>{profile.company}</Text>
                )}
                {profile.location && (
                  <Text style={styles.location}>{profile.location}</Text>
                )}
                
                {profile.summary && (
                  <>
                    <Text style={styles.sectionTitle}>Summary</Text>
                    <Text style={styles.summaryText}>{profile.summary}</Text>
                  </>
                )}
                
                {profile.experience && profile.experience.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Experience</Text>
                    <View style={styles.experienceContainer}>
                      {profile.experience.map((exp, index) => (
                        <Text key={index} style={styles.experienceItem}>{exp}</Text>
                      ))}
                    </View>
                  </>
                )}
                
                {profile.linkedin_url && (
                  <TouchableOpacity 
                    style={styles.linkedinButton}
                    onPress={() => profile.linkedin_url && Linking.openURL(profile.linkedin_url)}
                  >
                    <Text style={styles.linkedinButtonText}>View on LinkedIn</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  resultsContainer: {
    flex: 1,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#0077B5',
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Platform.OS === 'ios' ? '#000' : '#000',
    shadowOffset: { 
      width: 0, 
      height: Platform.OS === 'ios' ? 2 : 1 
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.2,
    shadowRadius: Platform.OS === 'ios' ? 8 : 1,
    elevation: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  role: {
    fontSize: 18,
    color: '#4a4a4a',
    marginBottom: 4,
    fontWeight: '500',
  },
  company: {
    fontSize: 17,
    color: '#2a2a2a',
    marginBottom: 4,
    fontWeight: '500',
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  summaryText: {
    fontSize: 16,
    color: '#4a4a4a',
    marginBottom: 16,
    lineHeight: 24,
  },
  experienceContainer: {
    marginBottom: 16,
  },
  experienceItem: {
    fontSize: 16,
    color: '#4a4a4a',
    marginBottom: 12,
    lineHeight: 24,
    paddingLeft: 4,
  },
  linkedinButton: {
    backgroundColor: '#0077B5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  linkedinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  loader: {
    marginTop: 32,
  },
});
