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
import { MultiStepLoader } from '@/components/ui/multi-step-loader';

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
        // Step 1: Get essential profile data
        const response = await fetch(`${API_URL}/api/auth/linkedin-scrape`, {
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
        
        // Step 2: Get raw LinkedIn data
        const rawDataResponse = await fetch(`${API_URL}/api/auth/linkedin-data/${data.dataId}`);
        if (!rawDataResponse.ok) {
          setError('Failed to load complete profile data');
          return;
        }
        
        const rawData = await rawDataResponse.json();
        
        // Use session name if available and LinkedIn name is empty
        const name = data.name || session?.user?.name || '';
        
        // Combine the data
        setProfileData({
          ...data,
          name,
          raw_data: rawData
        });
      } finally {
        setIsScraping(false);
      }
    };

    loadProfileData();
  }, [linkedinUrl, session]);

  const handleSubmit = async () => {
    if (!session?.user?.email || !profileData) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/auth/complete-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          name: profileData.name || session?.user?.name || '', // Use session name as fallback
          location: profileData.location,
          company: profileData.company,
          role: profileData.role,
          summary: profileData.summary,
          linkedinUrl: linkedinUrl,
          raw_data: profileData.raw_data,
          photoUrl: profileData.photoUrl
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create profile');
      }

      // First navigate to home page
      await router.replace('/');
      // Then force a client-side navigation refresh
      window.location.href = '/';
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isScraping) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <MultiStepLoader 
            loadingStates={[
              {
                text: "Analyzing your work experience..."
              },
              {
                text: "Processing your skills and achievements..."
              },
              {
                text: "Extracting relevant qualifications..."
              },
              {
                text: "Organizing your professional data..."
              },
              {
                text: "Finalizing your profile review..."
              }
            ]}
            loop={false}
            duration={5000}
            loading={isScraping}
        />  
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
            <label className="block text-sm font-medium mb-2">Name</label>
            <Input
              value={profileData.name}
              onChange={(e) =>
                setProfileData((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
              placeholder="Your name"
              className="bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <Input
              value={profileData.location}
              onChange={(e) =>
                setProfileData((prev) =>
                  prev ? { ...prev, location: e.target.value } : null
                )
              }
              className="bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Company</label>
            <Input
              value={profileData.company}
              onChange={(e) =>
                setProfileData((prev) =>
                  prev ? { ...prev, company: e.target.value } : null
                )
              }
              className="bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <Input
              value={profileData.role}
              onChange={(e) =>
                setProfileData((prev) =>
                  prev ? { ...prev, role: e.target.value } : null
                )
              }
              className="bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Summary</label>
            <Textarea
              value={profileData.summary}
              onChange={(e) =>
                setProfileData((prev) =>
                  prev ? { ...prev, summary: e.target.value } : null
                )
              }
              className="bg-white min-h-[100px]"
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
