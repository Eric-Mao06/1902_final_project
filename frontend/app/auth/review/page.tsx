'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
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

export default function ReviewPage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
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
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load profile data');
      } finally {
        setIsScraping(false);
      }
    };

    loadProfileData();
  }, [linkedinUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/complete-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profileData,
          email: session?.user?.email,
          name: session?.user?.name,
          linkedinUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to complete signup');
      }

      router.push('/');
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || !linkedinUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isScraping) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
          <h2 className="text-lg font-semibold mb-2">Generating Your Profile</h2>
          <p className="text-gray-500">Please wait while we analyze your LinkedIn profile and generate your professional summary...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => router.push('/auth/setup')}>Try Again</Button>
        </Card>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md p-6 text-center">
          <p className="text-gray-500">No profile data available</p>
          <Button onClick={() => router.push('/auth/setup')} className="mt-4">Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl space-y-6 p-6">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            {profileData.photoUrl ? (
              <Image
                src={profileData.photoUrl}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                width={48}
                height={48}
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl text-gray-500">👤</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Review Your Profile</h1>
            <p className="text-gray-500">Please review and edit your profile information before finalizing</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <Input
              value={profileData.location}
              onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Company</label>
            <Input
              value={profileData.company}
              onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Input
              value={profileData.role}
              onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Professional Summary</label>
            <Textarea
              value={profileData.summary}
              onChange={(e) => setProfileData({ ...profileData, summary: e.target.value })}
              className="min-h-[200px] w-full"
            />
          </div>
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push('/auth/setup')}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
