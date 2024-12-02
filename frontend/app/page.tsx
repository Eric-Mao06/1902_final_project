'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 space-y-8">
      <div className="flex flex-col items-center space-y-4 max-w-3xl w-full text-center">
        <h1 className="text-4xl md:text-6xl font-bold">
          ambition × experience
        </h1>

        <Card className="w-full p-4">
          <Textarea
            className="min-h-[140px] text-lg p-4"
            placeholder="Alumni who studied abroad and now work internationally"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          <Button 
            className="mt-4 w-full md:w-auto float-right"
            onClick={handleSearch}
          >
            Search →
          </Button>
        </Card>

        <div className="flex flex-col md:flex-row gap-2 flex-wrap justify-center mt-8">
          <Button 
            variant="outline"
            onClick={() => setSearchQuery("Alumni working on tech startups")}
          >
            Alumni working on tech startups →
          </Button>
          <Button 
            variant="outline"
            onClick={() => setSearchQuery("Alumni mentors in data science")}
          >
            Alumni mentors in data science →
          </Button>
          <Button 
            variant="outline"
            onClick={() => setSearchQuery("Alumni in investment banking")}
          >
            Alumni in investment banking →
          </Button>
        </div>
      </div>
    </main>
  );
}
