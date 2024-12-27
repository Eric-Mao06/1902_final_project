"use client";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProfileProps {
    name: string;
    headline: string;
    image: string;
    url: string;
    location: string;
    currentPosition: string;
    elo: number; // Elo rating
}

interface ComparisonProps {
    profileLeft: ProfileProps;
    profileRight: ProfileProps;
    onVote: (vote: "left" | "right" | "equal") => void;
}

const ProfileCard: React.FC<{ profile: ProfileProps; onClick: () => void }> = ({ profile, onClick }) => {
    if (!profile) {
        return <div className="text-red-500">Profile data is missing</div>;
    }

    return (
        <Card className="w-64 shadow-lg cursor-pointer hover:animate-shake" onClick={onClick}>
            <CardHeader className="flex flex-col items-center bg-gray-100 p-4">
                <img
                    src={profile.image || "https://placehold.co/100x100"} // Fallback image
                    alt={`${profile.name || "Unknown"}'s profile`}
                    className="w-20 h-20 rounded-full object-cover mb-4"
                />
                <CardTitle className="text-lg font-semibold">{profile.name || "Unknown"}</CardTitle>
                <p className="text-sm text-gray-500">Elo: {profile.elo}</p> {/* Display Elo rating */}
            </CardHeader>
            <CardContent className="p-4">
                <p className="text-sm text-gray-600 text-center">{profile.headline || "No headline available"}</p>
                <p className="text-sm text-gray-600 text-center">{profile.location || "Location not available"}</p>
                <p className="text-sm text-gray-600 text-center">{profile.currentPosition || "Position not available"}</p>
            </CardContent>
            <CardFooter className="flex justify-center bg-gray-100 p-4">
                <a
                    href={profile.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                >
                    View LinkedIn Profile
                </a>
            </CardFooter>
        </Card>
    );
};

const ComparisonTool: React.FC<ComparisonProps> = ({ profileLeft, profileRight, onVote }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
            <h1 className="text-2xl font-bold mb-8">LinkedIn Profile Comparison</h1>
            <div className="flex flex-row gap-8 items-center">
                {/* Left Profile */}
                <ProfileCard profile={profileLeft} onClick={() => onVote("left")} />

                {/* VS and Equal Button */}
                <div className="flex flex-col items-center gap-2">
                    <div className="text-xl font-bold">VS</div>
                    <Button className="w-20" onClick={() => onVote("equal")}>
                        Equal
                    </Button>
                </div>

                {/* Right Profile */}
                <ProfileCard profile={profileRight} onClick={() => onVote("right")} />
            </div>
        </div>
    );
};

export { ComparisonTool };