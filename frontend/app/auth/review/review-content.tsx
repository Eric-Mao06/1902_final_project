'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  name: string;
}

interface ReviewContentProps {
  linkedinUrl: string;
}

export default function ReviewContent({ linkedinUrl }: ReviewContentProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsScraping(true);
        const response = await fetch(`${API_URL}/api/linkedin-scrape`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ linkedinUrl }),
        });

        if (!response.ok) {
          setError('Failed to load profile data');
          return;
        }

        const data = await response.json();
        setProfileData(data);
      } finally {
        setIsScraping(false);
      }
    };

    loadProfileData();
  }, [linkedinUrl]);

  const handleSubmit = async () => {
    if (!session?.user?.email || !profileData) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/profile/new`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          location: profileData.location,
          company: profileData.company,
          role: profileData.role,
          summary: profileData.summary,
          linkedin_url: linkedinUrl,
          raw_data: profileData.raw_data,
          name: profileData.name
        }),
      });

      if (!response.ok) {
        setError('Failed to create profile');
        return;
      }

      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isScraping) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-lg">Fetching your LinkedIn profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="p-6 max-w-lg w-full text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push('/auth/setup')}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="p-6 max-w-lg w-full text-center">
          <p className="text-lg mb-4">No profile data found. Please try again.</p>
          <Button onClick={() => router.push('/auth/setup')}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Review Your Profile</h1>
      <Card className="p-6">
        <div className="grid gap-6">
          {profileData.photoUrl && (
            <div className="relative h-32 w-32 mx-auto">
              <Image
                src={profileData.photoUrl}
                alt="Profile"
                fill
                className="rounded-full object-cover"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <Input
              value={profileData.location}
              readOnly
              className="bg-muted"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Company</label>
            <Input
              value={profileData.company}
              readOnly
              className="bg-muted"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <Input
              value={profileData.role}
              readOnly
              className="bg-muted"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Summary</label>
            <Textarea
              value={profileData.summary}
              readOnly
              className="bg-muted h-32"
            />
          </div>
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/auth/setup')}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                'Confirm & Create Profile'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
