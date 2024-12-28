"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ComparisonTool } from "../../components/ComparisonTool";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "../constants";

export interface Profile {
    _id: string;
    name: string;
    photoUrl: string;
    summary: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw_linkedin_data: any;
    location: string;
    role: string;
    elo: number;
    linkedinUrl: string;
}

export default function Elo() {
    const [profileLeft, setProfileLeft] = useState<Profile | null>(null);
    const [profileRight, setProfileRight] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

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
                    title: "Error",
                    description: `Failed to load profiles: ${error.message}`,
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const handleVote = async (vote: "left" | "right" | "equal") => {
        if (!profileLeft?._id || !profileRight?._id) return;

        try {
            toast({
                title: "Success",
                description: "Your vote has been recorded",
            });

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

            await fetchNewPair();
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast({
                    title: "Error",
                    description: `Failed to submit vote. Error: ${error.message}`,
                    variant: "destructive",
                });
            }
        }
    };

    useEffect(() => {
        fetchNewPair();
    }, [fetchNewPair]);

    if (isLoading || !profileLeft || !profileRight) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold mb-8">Profile Comparison</h1>
            <ComparisonTool 
                profileLeft={profileLeft} 
                profileRight={profileRight} 
                onVote={handleVote} 
            />
        </div>
    );
}