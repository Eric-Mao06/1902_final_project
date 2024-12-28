"use client";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Profile } from "@/app/elo/page";
import Image from "next/image";

interface ComparisonProps {
    profileLeft: Profile;
    profileRight: Profile;
    onVote: (vote: "left" | "right" | "equal") => void;
}

const ProfileCard: React.FC<{ profile: Profile; onClick: () => void }> = ({ profile, onClick }) => {
    if (!profile) {
        return <div className="text-red-500">Profile data is missing</div>;
    }

    return (
        <Card className="h-full w-full shadow-none rounded-none cursor-pointer hover:bg-gray-50" onClick={onClick}>
            <CardHeader className="flex flex-col items-center p-6 pt-16">
                <Image
                    src={profile.photoUrl || "https://placehold.co/100x100"}
                    alt={`${profile.name || "Unknown"}'s profile`}
                    width={800}
                    height={800}
                    className="w-32 h-32 rounded-full object-cover mb-6"
                />
                <CardTitle className="text-2xl font-semibold">{profile.name || "Unknown"}</CardTitle>
                <p className="text-lg text-gray-500">Elo: {profile.elo}</p>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <p className="text-lg text-gray-600 text-center">{profile.role || "No headline available"}</p>
                    <p className="text-lg text-gray-600 text-center">{profile.location || "Location not available"}</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-center p-6">
                <a
                    href={profile.linkedinUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-lg"
                    onClick={(e) => e.stopPropagation()}
                >
                    View LinkedIn Profile
                </a>
            </CardFooter>
        </Card>
    );
};

const ComparisonTool: React.FC<ComparisonProps> = ({ profileLeft, profileRight, onVote }) => {
    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden">

            
            {/* Split Screen Layout */}
            <div className="flex flex-1">
                {/* Left Profile */}
                <div className="w-1/2">
                    <ProfileCard profile={profileLeft} onClick={() => onVote("left")} />
                </div>

                {/* Right Profile */}
                <div className="w-1/2">
                    <ProfileCard profile={profileRight} onClick={() => onVote("right")} />
                </div>
            </div>

            {/* Centered Equal Button */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <Button 
                    className="w-28 h-28 rounded-lg text-lg font-semibold"
                    onClick={() => onVote("equal")}
                >
                    Equal
                </Button>
            </div>
        </div>
    );
};

export { ComparisonTool };