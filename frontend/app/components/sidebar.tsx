'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSidebar } from '@/app/context/sidebar-context';
import { API_URL } from '@/app/constants';

interface ProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl?: string;
  headline?: string;
}

export default function Sidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const { isOpen, toggle } = useSidebar();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch(`${API_URL}/profile?email=${session.user.email}`);
          if (response.ok) {
            const data = await response.json();
            setProfile(data);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };

    fetchProfile();
  }, [session?.user?.email]);

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className={`fixed top-4 ${
          isOpen ? 'left-64' : 'left-4'
        } z-50 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-all duration-300`}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-xl transition-all duration-300 ${
          isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {profile?.imageUrl ? (
              <Image
                src={profile.imageUrl}
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl text-gray-500">
                  {profile?.firstName?.[0]}
                  {profile?.lastName?.[0]}
                </span>
              </div>
            )}
            {profile && (
              <div className="text-center">
                <h2 className="font-semibold">
                  {profile.firstName} {profile.lastName}
                </h2>
                {profile.headline && (
                  <p className="text-sm text-gray-600 mt-1">{profile.headline}</p>
                )}
              </div>
            )}
          </div>

          <nav className="mt-8">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => router.push('/')}
                  className="w-full text-left px-4 py-2 rounded hover:bg-gray-100 transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full text-left px-4 py-2 rounded hover:bg-gray-100 transition-colors"
                >
                  Profile
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    </div>
  );
}
