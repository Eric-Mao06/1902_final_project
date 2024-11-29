import React, { useState } from 'react';
import { StyleSheet, TextInput, View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { API_URL } from '@/constants/Config';

interface Profile {
  _id: string;
  name?: string;
  title?: string;
  company?: string;
  location?: string;
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

  const renderProfileCard = (profile: Profile) => {
    const excludedFields = ['_id', 'id', 'createdAt', 'updatedAt'];
    const name = profile.name || 'Unknown';

    return (
      <ThemedView style={styles.card} key={profile._id}>
        <ThemedText style={styles.cardTitle}>{name}</ThemedText>
        {Object.entries(profile)
          .filter(([key]) => !excludedFields.includes(key) && key !== 'name' && profile[key as keyof Profile])
          .map(([key, value]) => (
            <ThemedText key={key} style={styles.cardText}>
              {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
            </ThemedText>
          ))
        }
      </ThemedView>
    );
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
          {searchResults.map(renderProfileCard)}
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
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
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
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
