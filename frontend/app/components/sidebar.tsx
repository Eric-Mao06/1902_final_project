'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ProfileDialog } from '@/components/profile-dialog';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSidebar } from '@/app/context/sidebar-context';

export function Sidebar() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const { isExpanded, setIsExpanded } = useSidebar();

  if (!session) {
    return null;
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
              >
                <div className="relative h-8 w-8 overflow-hidden rounded-lg border-0 bg-gradient-to-br from-green-300 to-blue-300 flex-shrink-0">
                  {session.user.photoUrl ? (
                    <Image
                      src={session.user.photoUrl}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {session.user.name?.charAt(0).toUpperCase() || '👤'}
                      </span>
                    </div>
                  )}
                </div>
                {isExpanded && (
                  <div className="flex flex-1 flex-col justify-center min-w-0">
                    <p className="truncate text-sm font-medium text-left">
                      {session.user.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground text-left">
                      {session.user.name}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)}>
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ProfileDialog 
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        profileData={{
          name: session.user.name || '',
          email: session.user.email || '',
          location: session.user.location || '',
          company: session.user.company || '',
          role: session.user.role || '',
          summary: session.user.summary || '',
          photoUrl: session.user.photoUrl || '',
          linkedinUrl: session.user.linkedinUrl || '',
        }}
        onProfileUpdate={() => setIsProfileDialogOpen(false)}
      />
    </div>
  );
}
