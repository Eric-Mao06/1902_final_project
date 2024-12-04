'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { API_URL } from '../constants';
import { StreamingTextBlock } from '../components/streaming-text-block';

interface Profile {
  _id: string;
  name?: string;
  role?: string;
  company?: string;
  location?: string;
  linkedinUrl?: string;
  experience?: string[];
  summary?: string;
  score?: number;
}

interface SearchResultsProps {
  query: string;
}

export default function SearchResults({ query }: SearchResultsProps) {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_URL}/search?query=${encodeURIComponent(query)}`, {
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="p-6 max-w-lg w-full text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>
            Try Another Search
          </Button>
        </Card>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="p-6 max-w-lg w-full text-center">
          <p className="text-xl mb-4">No results found for &quot;{query}&quot;</p>
          <Button onClick={() => router.push('/')}>
            Try Another Search
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Results for &quot;{query}&quot;</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {searchResults.map((profile) => (
          <Card key={profile._id} className="p-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{profile.name}</h3>
                  {profile.role && <p className="text-sm text-muted-foreground">{profile.role}</p>}
                  {profile.company && <p className="text-sm text-muted-foreground">{profile.company}</p>}
                  {profile.location && <p className="text-sm text-muted-foreground">{profile.location}</p>}
                </div>
                {profile.linkedinUrl && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      View Profile
                    </a>
                  </Button>
                )}
              </div>
              <StreamingTextBlock query={query} profile={profile} />
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
