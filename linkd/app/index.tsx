import { useState } from 'react';
import { router } from 'expo-router';
import { XStack, YStack, Text, TextArea, Button, H1, Stack } from 'tamagui';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <YStack flex={1} width="100%" paddingHorizontal="$4" paddingVertical="$4">
      <YStack flex={1} alignItems="center" justifyContent="center" space="$4" paddingHorizontal="$4">
        <YStack space="$4" maxWidth={800} width="100%" alignItems="center">
          <H1 
            textAlign="center" 
            size="$10"
            marginBottom="$2"
          >
            Where Ambition Meets{' '}
            <Text 
              backgroundColor="$blue4" 
              paddingHorizontal="$2" 
              borderRadius="$4"
            >
              Experience.
            </Text>
          </H1>

          <Stack width="100%" maxWidth={800}>
            <TextArea
              size="$4"
              borderWidth={2}
              placeholder="Alumni who studied abroad and now work internationally"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              borderRadius="$4"
              style={{ padding: 16, paddingRight: 48 }}
              minHeight={140}
            />
            <Button
              size="$3"
              theme="active"
              backgroundColor="$black10"
              onPress={handleSearch}
              borderRadius="$10"
              position="absolute"
              right="$3"
              bottom="$3"
              width="$10"
              height="$4"
            >
              Search →
            </Button>
          </Stack>

          <XStack flexWrap="wrap" justifyContent="center" space="$2" marginTop="$4">
            <Button 
              size="$3" 
              variant="outlined" 
              borderRadius="$4"
              onPress={() => setSearchQuery("Alumni working on tech startups")}
            >
              Alumni working on tech startups →
            </Button>
            <Button 
              size="$3" 
              variant="outlined" 
              borderRadius="$4"
              onPress={() => setSearchQuery("Alumni mentors in data science")}
            >
              Alumni mentors in data science →
            </Button>
            <Button 
              size="$3" 
              variant="outlined" 
              borderRadius="$4"
              onPress={() => setSearchQuery("Alumni who changed careers")}
            >
              Alumni who changed careers →
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </YStack>
  );
}
