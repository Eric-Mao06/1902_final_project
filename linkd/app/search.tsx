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
            <View style={styles.profileGrid}>
              {searchResults.map((profile) => (
                <View key={profile._id} style={styles.profileCard}>
                  <Text style={styles.name}>{profile.name}</Text>
                  {profile.role && (
                    <Text style={styles.role}>{profile.role}</Text>
                  )}
                  {profile.company && (
                    <Text style={styles.role}>{profile.company}</Text>
                  )}
                  {profile.location && (
                    <Text style={styles.location}>{profile.location}</Text>
                  )}
                  <Text style={styles.matchScore}>Match score: {profile.score?.toFixed(2)}</Text>
                  
                  {profile.summary && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Summary</Text>
                      <Text style={styles.sectionText}>{profile.summary}</Text>
                    </View>
                  )}
                  
                  {profile.experience && profile.experience.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Experience</Text>
                      <View style={styles.experienceContainer}>
                        {profile.experience.map((exp, index) => (
                          <Text key={index} style={styles.sectionText}>{exp}</Text>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {profile.linkedin_url && (
                    <TouchableOpacity 
                      style={styles.linkedinButton}
                      onPress={() => profile.linkedin_url && Linking.openURL(profile.linkedin_url)}
                    >
                      <Text style={styles.linkedinButtonText}>View LinkedIn Profile</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
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
    paddingTop: 80,
    backgroundColor: '#f5f5f5',
  },
  resultsContainer: {
    flex: 1,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: '32%', // Slightly less than 33.33% to account for spacing
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  matchScore: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  section: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    lineHeight: 20,
  },
  experienceContainer: {
    marginTop: 4,
  },
  linkedinButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  linkedinButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
  },
  noResultsText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#0077B5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff0000',
    textAlign: 'center',
    marginTop: 24,
  },
});
