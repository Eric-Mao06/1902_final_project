'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ComparisonTool } from '../../components/ComparisonTool';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '../constants';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export interface Profile {
    _id: string;
    name: string;
    photoUrl: string;
    summary: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw_linkedin_data: ProfileRawLinkedinData;
    location: string;
    role: string;
    elo: number;
    linkedinUrl: string;
}

interface ProfileRawLinkedinData {
    fullPositions: {
        companyName: string;
        title: string;
        companyLogo: string;
    }[];
    educations: {
        fieldOfStudy: string;
        schoolName: string;
        degree: string;
    }[];
}

export default function Elo() {
  const [profileLeft, setProfileLeft] = useState<Profile | null>(null);
  const [profileRight, setProfileRight] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showElo, setShowElo] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [eloChanges, setEloChanges] = useState<{ left: number; right: number } | undefined>();
  const [newRatings, setNewRatings] = useState<{ left: number; right: number } | undefined>();
  const { toast } = useToast();
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if(session.status === 'unauthenticated') {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Only users who are logged in can access alumni ranking',
      });
      router.replace('/leaderboard?from=elo');
    } else if(session.status === 'loading') {
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
  }, [session.status, router, toast]);

  const fetchNewPair = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/elo/pair`);
      if (!response.ok) throw new Error('Failed to fetch profiles');
      const data = await response.json();
      const [profile1, profile2] = data.profiles;
      setProfileLeft(profile1);
      setProfileRight(profile2);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: 'Error',
          description: `Failed to load profiles: ${error.message}`,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleVote = async (vote: 'left' | 'right' | 'equal') => {
    if (!profileLeft?._id || !profileRight?._id) return;

    try {
      setShowElo(true);

      const response = await fetch(`${API_URL}/api/elo/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_id_a: profileLeft._id,
          profile_id_b: profileRight._id,
          result: vote,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit vote');

      const data = await response.json();
      setNewRatings({
        left: data.new_ratings.profile_a,
        right: data.new_ratings.profile_b,
      });
      setEloChanges({
        left: data.elo_changes.profile_a,
        right: data.elo_changes.profile_b,
      });

    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: 'Error',
          description: `Failed to submit vote. Error: ${error.message}`,
          variant: 'destructive',
        });
      }
    }
  };

  const handleNextPair = async () => {
    setShowElo(false);
    setEloChanges(undefined);
    setNewRatings(undefined);
    await fetchNewPair();
  };

  useEffect(() => {
    fetchNewPair();
  }, [fetchNewPair]);

  return (
    <main className="min-h-screen w-full">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : isAuthenticated && profileLeft && profileRight ? (
        <ComparisonTool
          profileLeft={profileLeft}
          profileRight={profileRight}
          onVote={handleVote}
          showElo={showElo}
          eloChanges={eloChanges}
          newElo={newRatings}
          onNextPair={handleNextPair}
        />
      ) : null}
    </main>
  );
}
