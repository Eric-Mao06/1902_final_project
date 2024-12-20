'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { API_URL } from '@/app/constants';

interface ProfileData {
  location: string;
  company: string;
  role: string;
  summary: string;
  photoUrl: string;
  dataId?: string;  // ID to fetch full data
  raw_data?: any;   // Full LinkedIn data
  linkedinUrl: string;
  name: string;
  email?: string;
}

export default function CompleteProfile() {
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState<ProfileData>({
    location: '',
    company: '',
    role: '',
    summary: '',
    photoUrl: '',
    linkedinUrl: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const loadProfileData = async () => {
      const savedData = localStorage.getItem('profileData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setProfileData(parsedData);

        // If we have a dataId but no raw_data, fetch the full data
        if (parsedData.dataId && !parsedData.raw_data) {
          try {
            const response = await fetch(`${API_URL}/api/auth/linkedin-data/${parsedData.dataId}`);
            if (response.ok) {
              const fullData = await response.json();
              setProfileData(prev => ({
                ...prev,
                raw_data: fullData
              }));
              // Update localStorage with full data
              localStorage.setItem('profileData', JSON.stringify({
                ...parsedData,
                raw_data: fullData
              }));
            }
          } catch (err) {
            console.error('Error fetching full LinkedIn data:', err);
          }
        }
      } else {
        router.push('/auth/signup');
      }
    };

    loadProfileData();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) {
      setError('You must be logged in to complete signup');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Update the requestData to include the user's name from Google session
      const requestData = {
        ...profileData,
        email: session.user.email,
        name: session.user.name || profileData.name, // Use Google name if available
        raw_data: profileData.raw_data || {}
      };
      console.log('Sending profile data:', JSON.stringify(requestData, null, 2));
      
      const response = await fetch(`${API_URL}/api/auth/complete-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to create profile');
      }

      // Clear the stored profile data
      localStorage.removeItem('profileData');
      router.push('/');
    } catch (err) {
      console.error('Profile creation error:', err);
      console.error('Full error object:', JSON.stringify(err, null, 2));
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please review and edit your information
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={profileData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                required
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={profileData.location}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700">
                LinkedIn URL
              </label>
              <input
                id="linkedinUrl"
                name="linkedinUrl"
                type="url"
                required
                disabled
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-500 focus:outline-none sm:text-sm"
                value={profileData.linkedinUrl}
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <input
                id="company"
                name="company"
                type="text"
                required
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={profileData.company}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <input
                id="role"
                name="role"
                type="text"
                required
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={profileData.role}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                Summary
              </label>
              <textarea
                id="summary"
                name="summary"
                required
                rows={4}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={profileData.summary}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Complete Signup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
