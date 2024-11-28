'use client';

import React, { useState } from 'react';

interface Profile {
  _id: string;
  name?: string;
  title?: string;
  company?: string;
  location?: string;
  // Add other profile fields as needed
}

export default function Page() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:8000/api/search?query=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
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
    <div className="min-h-screen bg-background flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-foreground">Linkd</h1>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="w-full mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alumni (e.g., 'alumni in tech')"
              className="w-full px-4 py-3 rounded-lg border bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent shadow-sm text-lg"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="text-destructive text-center mb-4">
            {error}
          </div>
        )}

        {/* Search Results */}
        {isLoading ? (
          <div className="mt-4">Loading...</div>
        ) : error ? (
          <div className="mt-4 text-red-500">{error}</div>
        ) : searchResults.length > 0 ? (
          <div className="mt-4 space-y-8">
            {searchResults.map((result, index) => {
              const excludedFields = ['_id', 'id', 'createdAt', 'updatedAt'];
              const name = result.name || 'Unknown';
              
              return (
                <div key={index} className="p-6 bg-white shadow-lg rounded-lg">
                  <h2 className="text-xl font-bold mb-4">{name}</h2>
                  <div className="grid gap-2">
                    {Object.entries(result)
                      .filter(([key]) => !excludedFields.includes(key) && key !== 'name')
                      .map(([key, value]) => (
                        <div key={key} className="mb-1">
                          <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}: </span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : searchQuery ? (
          <div className="mt-4">No results found</div>
        ) : null}
      </div>
    </div>
  );
}