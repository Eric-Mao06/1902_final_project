'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { API_URL } from '../constants';
import { StreamingTextBlock } from '../../components/streaming-text-block';

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
  explanation?: string;
}

interface SearchResultsProps {
  query: string;
}

export default function SearchResults({ query }: SearchResultsProps) {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchResults = useCallback(async (currentOffset: number, append: boolean = false) => {
    try {
      const baseUrl = API_URL.replace(/\/$/, ''); // Remove trailing slash if it exists
      const response = await fetch(`${baseUrl}/api/search?query=${encodeURIComponent(query)}&offset=${currentOffset}`, {
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
      const newResults = data.results;

      if (newResults.length === 0) {
        setHasMore(false);
      } else {
        if (append) {
          setSearchResults((prevResults) => [...prevResults, ...newResults]);
        } else {
          setSearchResults(newResults);
        }
        setOffset(currentOffset + newResults.length);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to fetch results: ${errorMessage}`);
    }
  }, [query]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await fetchResults(offset, true);
    setIsLoadingMore(false);
  };

  useEffect(() => {
    const initialFetch = async () => {
      setIsLoading(true);
      setError('');
      setOffset(0);
      setHasMore(true);
      await fetchResults(0);
      setIsLoading(false);
    };

    initialFetch();
  }, [query, fetchResults]);

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
        {searchResults.map((profile, index) => (
          <Card key={`${profile._id}-${index}`} className="p-4 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">{profile.name}</h2>
              {profile.role && <p className="text-gray-600 mb-1">{profile.role}</p>}
              {profile.company && <p className="text-gray-600 mb-1">{profile.company}</p>}
              {profile.location && <p className="text-gray-600 mb-3">{profile.location}</p>}
              {profile.summary && (
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {index < searchResults.length - 6 ? (
                    // For older results, just show the text without streaming
                    <p>{profile.explanation}</p>
                  ) : (
                    // For new results (last 6), use StreamingTextBlock
                    <StreamingTextBlock
                      query={query}
                      profile={profile}
                    />
                  )}
                </div>
              )}
            </div>
            {profile.linkedinUrl && (
              <Button
                className="w-full mt-4"
                onClick={() => window.open(profile.linkedinUrl, '_blank')}
              >
                View LinkedIn Profile
              </Button>
            )}
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="min-w-[200px]"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Results'
            )}
          </Button>
        </div>
      )}
    </main>
  );
}
