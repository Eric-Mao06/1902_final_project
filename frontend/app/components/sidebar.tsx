'use client';

import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ProfileDialog } from '@/components/profile-dialog';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSidebar } from '@/app/context/sidebar-context';
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

export function Sidebar() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const { isExpanded, setIsExpanded } = useSidebar();
  const [profileData, setProfileData] = useState<ProfileData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (sessionStatus === 'loading') return;
      
      if (!session?.user?.email) {
        setIsLoading(false);
        return;
      }

      // Check if we're in the signup flow
      const isSignupFlow = window.location.pathname.includes('/signup');
      if (isSignupFlow) {
        setIsLoading(false);
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
        // Silently handle errors during signup flow
        console.debug('Profile fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [session, sessionStatus]);

  const handleProfileUpdate = (updatedProfile: ProfileData) => {
    setProfileData(updatedProfile);
  };

  const handleProfileClick = () => {
    if (session) {
      setIsProfileDialogOpen(true);
    } else {
      router.push('/auth/signin');
    }
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

  if (!session) {
    return (
      <div 
        className={`fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-[200px]' : 'w-16'
        }`}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm"
        >
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <div className="flex h-full flex-col px-3 py-4">
          <div className="space-y-6">
            {/* Top section with logo */}
            <div className="flex items-center h-8 px-2">
              <button 
                onClick={() => router.push('/')}
                className="w-8 transition-opacity duration-200"
              >
                <div className="relative w-full aspect-square">
                  <Image
                    src="/Heading.png"
                    alt="Linkd Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </button>
            </div>
            
            {/* New Chat button */}
            <div className="px-2">
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className={`w-full justify-center rounded-lg border-[1.5px] bg-white py-2 text-sm font-medium hover:bg-gray-50 ${
                  isExpanded ? 'opacity-100' : 'opacity-0'
                }`}
              >
                New Search
              </Button>
            </div>
          </div>

          {/* Bottom section with user profile */}
          <div className="mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full">
                  <div className="flex items-center gap-3 rounded-lg px-2 py-2 justify-center">
                    <div className="relative h-8 w-8 overflow-hidden rounded-lg border-0 bg-gradient-to-br from-green-300 to-blue-300 flex-shrink-0">
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-sm font-medium text-white">G</span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">Guest User</span>
                      </div>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onClick={() => signIn('google')}>
                  Sign in with Google
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className={`fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-[200px]' : 'w-16'
        }`}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm"
        >
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <div className="flex h-full flex-col px-3 py-4">
          <div className="space-y-6">
            {/* Top section with logo */}
            <div className="flex items-center h-8 px-2">
              <button 
                onClick={() => router.push('/')}
                className="w-8 transition-opacity duration-200"
              >
                <div className="relative w-full aspect-square">
                  <Image
                    src="/Heading.png"
                    alt="Linkd Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </button>
            </div>
            
            {/* New Chat button */}
            <div className="px-2">
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className={`w-full justify-center rounded-lg border-[1.5px] bg-white py-2 text-sm font-medium hover:bg-gray-50 ${
                  isExpanded ? 'opacity-100' : 'opacity-0'
                }`}
              >
                New Search
              </Button>
            </div>
          </div>

          {/* Bottom section with user profile */}
          <div className="mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full">
                  <div className="flex items-center gap-3 rounded-lg px-2 py-2 justify-center">
                    <div className="relative h-8 w-8 overflow-hidden rounded-lg border-0 bg-gradient-to-br from-green-300 to-blue-300 flex-shrink-0">
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-sm font-medium text-white">L</span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">Loading...</span>
                      </div>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-[200px]' : 'w-16'
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm"
      >
        {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      <div className="flex h-full flex-col px-3 py-4">
        <div className="space-y-6">
          {/* Top section with logo */}
          <div className="flex items-center h-8 px-2">
            <button 
              onClick={() => router.push('/')}
              className="w-8 transition-opacity duration-200"
            >
              <div className="relative w-full aspect-square">
                <Image
                  src="/Heading.png"
                  alt="Linkd Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </button>
          </div>
          
          {/* New Chat button */}
          <div className="px-2">
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className={`w-full justify-center rounded-lg border-[1.5px] bg-white py-2 text-sm font-medium hover:bg-gray-50 ${
                isExpanded ? 'opacity-100' : 'opacity-0'
              }`}
            >
              New Search
            </Button>
          </div>
        </div>

        {/* Bottom section with user profile */}
        <div className="mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 ${
                  !isExpanded && 'justify-center'
                }`}
                onClick={handleProfileClick}
              >
                <div className="relative h-8 w-8 overflow-hidden rounded-lg border-0 bg-gradient-to-br from-green-300 to-blue-300 flex-shrink-0">
                  {profileData?.photoUrl ? (
                    <Image
                      src={profileData.photoUrl}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {profileData?.name?.[0] || session?.user?.name?.[0] || '👤'}
                      </span>
                    </div>
                  )}
                </div>
                {isExpanded && (
                  <div className="flex flex-1 flex-col justify-center min-w-0">
                    <p className="truncate text-sm font-medium text-left">
                      {profileData?.name || session?.user?.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground text-left">
                      {profileData?.email || session?.user?.email}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)}>
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                Sign Out
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteAccount}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                Delete Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ProfileDialog 
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        profileData={profileData}
        onProfileUpdate={handleProfileUpdate}
        session={session}
      />
    </div>
  );
}
