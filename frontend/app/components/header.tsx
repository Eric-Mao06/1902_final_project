'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import { ProfileDialog } from '@/components/profile-dialog';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { API_URL } from '@/app/constants';

interface ProfileData {
  name: string;
  email: string;
  location: string;
  company: string;
  role: string;
  summary: string;
  photoUrl: string;
  linkedinUrl: string;
}

export default function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | undefined>(undefined);

  useEffect(() => {
    const fetchProfile = async () => {
      if (status === 'loading') return;
      
      if (!session?.user?.email) {
        return;
      }

      try {
        console.log('Fetching profile for email:', session.user.email);
        const response = await fetch(
          `${API_URL}/api/users/profile?email=${encodeURIComponent(session.user.email)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            console.log('Received profile data:', data.profile);
            // If name is empty in profile but exists in session, use session name
            if (!data.profile.name && session.user.name) {
              data.profile.name = session.user.name;
              // Update the profile with the session name
              const updateResponse = await fetch(
                `${API_URL}/api/users/profile?email=${encodeURIComponent(session.user.email)}`,
                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    name: session.user.name,
                  }),
                }
              );
              if (!updateResponse.ok) {
                console.error('Failed to update profile with session name');
              }
            }
            setProfileData(data.profile);
          }
        } else if (response.status === 404) {
          // Silently handle 404 during normal operation
          if (session.user.name) {
            setProfileData({
              name: session.user.name,
              email: session.user.email || '',
              location: '',
              company: '',
              role: '',
              summary: '',
              photoUrl: session.user.image || '',
              linkedinUrl: ''
            });
          }
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
      }
    };

    fetchProfile();
  }, [session, status]);

  const handleProfileUpdate = (updatedProfile: ProfileData) => {
    setProfileData(updatedProfile);
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.email) return;
    
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const response = await fetch(
          `${API_URL}/api/users/profile?email=${encodeURIComponent(session.user.email)}`,
          {
            method: 'DELETE',
          }
        );
        
        if (response.ok) {
          await signOut();
          router.push('/');
        } else {
          console.error('Failed to delete account');
          alert('Failed to delete account. Please try again later.');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('An error occurred while deleting your account. Please try again later.');
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="px-2 text-base hover:bg-transparent hover:text-primary"
            onClick={() => router.push('/')}
          >
            <Image
              src="/Heading.png"
              alt="Linkd Logo"
              width={480}
              height={160}
              className="h-8 w-auto"
              priority
              quality={100}
            />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {status === 'authenticated' && session?.user ? (
            <>
              <Button
                variant="outline"
                onClick={() => router.push('/elo')}
                className="px-4 py-2"
              >
                Rank Alumni
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/leaderboard')}
                className="px-4 py-2"
              >
                Alumni Leaderboard
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profileData?.photoUrl ?? session.user.image ?? undefined} alt={profileData?.name || 'User'} />
                      <AvatarFallback>
                        {profileData?.name ? profileData.name[0].toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)}>
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    Sign out
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteAccount}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    Delete Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => signIn('google')} variant="outline">
              Sign in
            </Button>
          )}
        </div>
      </div>
      {status === 'authenticated' && (
        <ProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          profileData={profileData}
          onProfileUpdate={handleProfileUpdate}
          session={session}
        />
      )}
    </header>
  );
}
