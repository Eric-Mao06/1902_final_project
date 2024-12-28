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
    showElo: boolean;
    eloChanges?: {
        left: number;
        right: number;
    };
    newElo?: {
        left: number;
        right: number;
    };
    onNextPair: () => void;
}

const ProfileCard: React.FC<{ 
    profile: Profile; 
    onClick: () => void; 
    showElo: boolean;
    eloChange?: number;
    newElo?: number;
    isClickable: boolean;
}> = ({ profile, onClick, showElo, eloChange, newElo, isClickable }) => {
    if (!profile) {
        return <div className="text-red-500">Profile data is missing</div>;
    }

    console.log(profile);

    const positionData = profile.raw_linkedin_data.fullPositions;
    const educationData = profile.raw_linkedin_data.educations;

    return (
        <Card 
            className={`h-full w-full shadow-none rounded-none ${isClickable ? 'cursor-pointer hover:bg-gray-50' : ''}`} 
            onClick={isClickable ? onClick : undefined}
        >
            <CardHeader className="flex flex-col items-center p-6 pt-16">
                <Image
                    src={profile.photoUrl || "https://media.istockphoto.com/id/1288129985/vector/missing-image-of-a-person-placeholder.jpg?s=612x612&w=0&k=20&c=9kE777krx5mrFHsxx02v60ideRWvIgI1RWzR1X4MG2Y="}
                    alt={`${profile.name || "Unknown"}'s profile`}
                    width={800}
                    height={800}
                    className="w-32 h-32 rounded-full object-cover mb-6"
                />
                <CardTitle className="text-2xl font-semibold">{profile.name || "Unknown"}</CardTitle>
                {showElo && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                            <p className="text-lg text-gray-500">Elo: {newElo}</p>
                            {eloChange !== undefined && (
                                <span className={`text-sm ${eloChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    ({eloChange >= 0 ? '+' : ''}{eloChange.toFixed(1)})
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-blue-500">Click again to continue</p>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-center mb-2">Experience</h3>
                        {positionData.slice(0, 5).map((position, index) => (
                            position?.title && position?.companyName && (
                                <div key={index} className="flex items-center justify-center gap-2 mb-2">
                                    {position.companyLogo && (
                                        <Image
                                            src={position.companyLogo}
                                            alt={`${position.companyName} logo`}
                                            width={24}
                                            height={24}
                                            className="rounded-sm object-contain"
                                        />
                                    )}
                                    <p className="text-lg text-gray-600 text-center">
                                        {position.title} at {position.companyName}
                                    </p>
                                </div>
                            )
                        ))}
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-center mb-2">Education</h3>
                        {educationData.slice(0, 2).map((education, index) => (
                            education?.schoolName && (
                                <p key={index} className="text-lg text-gray-600 text-center">
                                    {education.degree && `${education.degree} in `}
                                    {education.fieldOfStudy && `${education.fieldOfStudy} at `}
                                    {education.schoolName}
                                </p>
                            )
                        ))}
                    </div>
                </div>
            </CardContent>
            {showElo && (
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
            )}
        </Card>
    );
};

const ComparisonTool: React.FC<ComparisonProps> = ({ 
    profileLeft, 
    profileRight, 
    onVote,
    showElo,
    eloChanges,
    newElo,
    onNextPair
}) => {
    const handleClick = (side: "left" | "right") => {
        if (showElo) {
            onNextPair();
        } else {
            onVote(side);
        }
    };

    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden">
            <div className="flex flex-1">
                <div className="w-1/2">
                    <ProfileCard 
                        profile={profileLeft} 
                        onClick={() => handleClick("left")} 
                        showElo={showElo}
                        eloChange={eloChanges?.left}
                        newElo={newElo?.left}
                        isClickable={true}
                    />
                </div>
                <div className="w-1/2">
                    <ProfileCard 
                        profile={profileRight} 
                        onClick={() => handleClick("right")} 
                        showElo={showElo}
                        eloChange={eloChanges?.right}
                        newElo={newElo?.right}
                        isClickable={true}
                    />
                </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <Button 
                    className="w-28 h-28 rounded-lg text-lg font-semibold"
                    onClick={() => showElo ? onNextPair() : onVote("equal")}
                >
                    {showElo ? "Next" : "Equal"}
                </Button>
            </div>
        </div>
    );
};

export { ComparisonTool };