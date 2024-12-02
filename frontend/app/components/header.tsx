'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { ProfileDialog } from '@/components/profile-dialog';
import { useState, useEffect } from 'react';

// Extend the default session user type
declare module 'next-auth' {
  interface User {
    location?: string;
    company?: string;
    role?: string;
    summary?: string;
    linkedinUrl?: string;
    photoUrl?: string;
  }
  interface Session {
    user: User;
  }
}

export function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  useEffect(() => {
    if (session?.user) {
      // Debug session data
      console.log('Session user:', session.user);
      
      const profileData = {
        name: session.user.name || '',
        email: session.user.email || '',
        location: session.user.location || '',
        company: session.user.company || '',
        role: session.user.role || '',
        summary: session.user.summary || '',
        photoUrl: session.user.photoUrl || '',
        linkedinUrl: session.user.linkedinUrl || '',
      };
      
      // Debug profile data
      console.log('Profile data:', profileData);
    }
  }, [session]);

  if (status !== 'authenticated') {
    return null;
  }

  const profileData = {
    name: session.user.name || '',
    email: session.user.email || '',
    location: session.user.location || '',
    company: session.user.company || '',
    role: session.user.role || '',
    summary: session.user.summary || '',
    photoUrl: session.user.photoUrl || '',
    linkedinUrl: session.user.linkedinUrl || '',
  };

  const handleProfileUpdate = (updatedProfile: any) => {
    // Here you would typically update the session data
    console.log('Profile updated:', updatedProfile);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.push('/')}
            className="text-lg font-semibold"
          >
            linkd
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsProfileDialogOpen(true)}
            className="relative h-8 w-8 rounded-full overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity"
          >
            {session.user.photoUrl ? (
              <img
                src={session.user.photoUrl}
                alt="Profile"
                className="h-full w-full object-cover"
                onError={(e) => {
                  console.log('Failed to load image:', session.user.photoUrl);
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`h-full w-full bg-gray-200 flex items-center justify-center ${session.user.photoUrl ? 'hidden' : ''}`}>
              <span className="text-sm text-gray-500">👤</span>
            </div>
          </button>
          <Button 
            variant="ghost" 
            onClick={() => router.push('/api/auth/signout')}
          >
            Sign out
          </Button>
        </div>
      </div>
      <ProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        profileData={profileData}
        onProfileUpdate={handleProfileUpdate}
      />
    </header>
  );
}
