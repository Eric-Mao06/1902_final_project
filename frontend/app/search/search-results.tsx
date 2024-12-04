'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { API_URL } from '../constants';
import { useSession } from 'next-auth/react';

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

interface SearchResultsProps {
  query: string;
}

export default function SearchResults({ query }: SearchResultsProps) {
  const router = useRouter();
  const { status } = useSession();
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
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

    if (status === 'authenticated') {
      fetchResults();
    }
  }, [query, status]);

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
        <Button variant="outline" onClick={() => router.push('/')}>
          New Search
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {searchResults.map((profile) => (
          <Card key={profile._id} className="p-4 flex flex-col">
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            {profile.role && (
              <p className="text-gray-600 dark:text-gray-400">{profile.role}</p>
            )}
            {profile.company && (
              <p className="text-gray-600 dark:text-gray-400">{profile.company}</p>
            )}
            {profile.location && (
              <p className="text-gray-500 dark:text-gray-500 text-sm">{profile.location}</p>
            )}
            {profile.summary && (
              <p className="mt-2 text-sm">{profile.summary}</p>
            )}
            {profile.experience && profile.experience.length > 0 && (
              <div className="mt-2">
                <h3 className="text-sm font-semibold mb-1">Experience</h3>
                <ul className="text-sm list-disc list-inside">
                  {profile.experience.slice(0, 3).map((exp, index) => (
                    <li key={index} className="text-gray-600 dark:text-gray-400">{exp}</li>
                  ))}
                </ul>
              </div>
            )}
            {profile.linkedin_url && (
              <Button
                variant="outline"
                className="mt-auto"
                onClick={() => window.open(profile.linkedin_url, '_blank')}
              >
                View LinkedIn Profile →
              </Button>
            )}
          </Card>
        ))}
      </div>
    </main>
  );
}
