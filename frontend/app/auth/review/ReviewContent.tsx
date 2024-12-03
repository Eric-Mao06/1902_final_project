'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { API_URL } from '@/app/constants';
import Image from 'next/image';

interface ProfileData {
  location: string;
  company: string;
  role: string;
  summary: string;
  photoUrl: string;
  raw_data: Record<string, unknown>;
}

export default function ReviewContent() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const linkedinUrl = searchParams.get('linkedinUrl');

  useEffect(() => {
    if (!linkedinUrl) {
      router.push('/auth/setup');
      return;
    }
    
    const loadProfileData = async () => {
      try {
        setIsScraping(true);
        const response = await fetch(`${API_URL}/api/auth/linkedin-scrape`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ linkedinUrl }),
        });

        if (!response.ok) {
          throw new Error('Failed to load profile data');
        }

        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsScraping(false);
      }
    };

    loadProfileData();
  }, [linkedinUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkedinUrl,
          ...profileData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      router.push('/auth/complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => router.push('/auth/setup')}>Go Back</Button>
      </div>
    );
  }

  if (isScraping) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Fetching your LinkedIn profile...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p>No profile data available</p>
        <Button onClick={() => router.push('/auth/setup')}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Review Your Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-4">
            {profileData.photoUrl && (
              <div className="relative w-20 h-20">
                <Image
                  src={profileData.photoUrl}
                  alt="Profile"
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Company</label>
                <Input
                  value={profileData.company}
                  onChange={(e) =>
                    setProfileData({ ...profileData, company: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Role</label>
            <Input
              value={profileData.role}
              onChange={(e) =>
                setProfileData({ ...profileData, role: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Location</label>
            <Input
              value={profileData.location}
              onChange={(e) =>
                setProfileData({ ...profileData, location: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Summary</label>
            <Textarea
              value={profileData.summary}
              onChange={(e) =>
                setProfileData({ ...profileData, summary: e.target.value })
              }
              rows={4}
            />
          </div>
        </Card>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/auth/setup')}
          >
            Back
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
