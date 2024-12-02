'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

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

interface ProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileData;
  onProfileUpdate: (updatedProfile: ProfileData) => void;
}

export function ProfileDialog({ isOpen, onClose, profileData, onProfileUpdate }: ProfileDialogProps) {
  const [editedProfile, setEditedProfile] = useState<ProfileData>(profileData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile?email=${encodeURIComponent(profileData.email)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      onProfileUpdate(updatedProfile);
      onClose();
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex justify-center mb-3">
            {editedProfile.photoUrl ? (
              <Image
                src={editedProfile.photoUrl}
                alt="Profile"
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl text-gray-500">👤</span>
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editedProfile.name}
                onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                value={editedProfile.email}
                disabled
                className="w-full bg-gray-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium">LinkedIn URL</label>
              <Input
                value={editedProfile.linkedinUrl}
                disabled
                className="w-full bg-gray-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                value={editedProfile.location}
                onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Company</label>
              <Input
                value={editedProfile.company}
                onChange={(e) => setEditedProfile({ ...editedProfile, company: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <Input
                value={editedProfile.role}
                onChange={(e) => setEditedProfile({ ...editedProfile, role: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Summary</label>
              <Textarea
                value={editedProfile.summary}
                onChange={(e) => setEditedProfile({ ...editedProfile, summary: e.target.value })}
                className="w-full min-h-[100px]"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
