'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { API_URL } from '@/app/constants';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    async function checkUserProfile() {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          const response = await fetch(`${API_URL}/api/users/check?email=${encodeURIComponent(session.user.email)}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          
          if (!data.exists) {
            router.push('/auth/setup');
          }
        } catch (error) {
          console.error('Error checking user profile:', error);
        } finally {
          setIsCheckingProfile(false);
        }
      }
    }

    if (status === 'authenticated') {
      checkUserProfile();
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, session, router]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Show loading state
  if (status === 'loading' || isCheckingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Don't render anything while redirecting
  if (status === 'unauthenticated') {
    return null;
  }

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
