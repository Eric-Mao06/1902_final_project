'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { API_URL } from '@/app/constants';

export default function SetupPage() {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // If not authenticated, redirect to signin
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
      return;
    }

    // If authenticated, check for profile
    if (status === 'authenticated' && session?.user?.email) {
      setIsLoading(true);
      fetch(`${API_URL}/api/profile?email=${encodeURIComponent(session.user.email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          if (response.ok) {
            // If profile exists, redirect to home
            router.replace('/');
          } else if (response.status === 404) {
            // If no profile, stay on this page
            setIsLoading(false);
          } else {
            // If error, log it and stay on page
            console.error('Error checking profile:', response.statusText);
            setIsLoading(false);
          }
        })
        .catch(error => {
          console.error('Error checking profile:', error);
          setIsLoading(false);
        });
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinUrl.includes('linkedin.com/')) {
      alert('Please enter a valid LinkedIn URL');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Scraping LinkedIn URL:', linkedinUrl);
      
      // First, scrape the LinkedIn profile
      const scrapeResponse = await fetch(`${API_URL}/api/linkedin-scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkedinUrl }),
      });

      const responseText = await scrapeResponse.text();
      console.log('Raw response:', responseText);

      if (!scrapeResponse.ok) {
        console.error('Scraping error:', responseText);
        throw new Error(`Failed to scrape LinkedIn profile: ${responseText}`);
      }

      let profileData;
      try {
        profileData = JSON.parse(responseText);
      } catch (error) {
        console.error('Error parsing response:', error);
        throw new Error('Invalid response from server');
      }
      
      // After successful scraping, go to review page with the data
      router.push(`/auth/review?linkedinUrl=${encodeURIComponent(linkedinUrl)}&data=${encodeURIComponent(JSON.stringify(profileData))}`);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to process LinkedIn URL. Please try again.');
      setIsLoading(false);
    }
  };

  // Show loading state
  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show nothing while redirecting
  if (status === 'unauthenticated') {
    return null;
  }

  // Show LinkedIn URL input
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-gray-500">Please enter your LinkedIn profile URL to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="https://www.linkedin.com/in/your-profile"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              required
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Your profile will be created using information from your LinkedIn profile
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      </Card>
    </main>
  );
}
