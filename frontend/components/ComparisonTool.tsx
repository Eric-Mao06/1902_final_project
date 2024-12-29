"use client";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Profile } from "@/app/elo/page";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

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

    const positionData = profile.raw_linkedin_data?.fullPositions || [];
    const educationData = profile.raw_linkedin_data?.educations || [];

    return (
        <Card 
            className={`h-full w-full shadow-none rounded-none ${isClickable ? 'cursor-pointer hover:bg-gray-50' : ''}`} 
            onClick={isClickable ? onClick : undefined}
        >
            {/* Profile Header */}
            <CardHeader className="flex flex-col items-center p-6 pt-20 pb-6 mt-8">
                {showElo ? (
                    <>
                        <Image
                            src={profile.photoUrl || "https://media.istockphoto.com/id/1288129985/vector/missing-image-of-a-person-placeholder.jpg?s=612x612&w=0&k=20&c=9kE777krx5mrFHsxx02v60ideRWvIgI1RWzR1X4MG2Y="}
                            alt={`${profile.name || "Unknown"}'s profile`}
                            width={800}
                            height={800}
                            className="w-24 h-24 rounded-full object-cover mb-4"
                        />
                        <CardTitle className="text-2xl font-semibold mb-2">{profile.name}</CardTitle>
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2">
                                <p className="text-lg text-gray-600">Elo: {newElo}</p>
                                {eloChange !== undefined && (
                                    <span className={`text-base ${eloChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        ({eloChange >= 0 ? '+' : ''}{eloChange})
                                    </span>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-24 h-24 rounded-full mb-4 bg-gradient-to-br from-blue-500 to-purple-500" />
                        <div className="h-8 w-56 bg-gray-300 rounded mb-2" />
                    </>
                )}
            </CardHeader>

            {/* Profile Content */}
            <CardContent className="px-8 py-2">
                {/* Experience Section */}
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-center mb-4">Experience</h3>
                    <div className="space-y-4 mx-auto max-w-[320px]">
                        {positionData.slice(0, 3).map((position, index) => (
                            position?.title && position?.companyName && (
                                <div key={index} className="flex items-start gap-3 px-2">
                                    <div className="flex-shrink-0 mt-1">
                                        {position.companyLogo ? (
                                            <Image
                                                src={position.companyLogo}
                                                alt={`${position.companyName} logo`}
                                                width={24}
                                                height={24}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <div 
                                                className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"
                                                aria-label={`${position.companyName} placeholder logo`}
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-base text-gray-700 break-words font-medium">
                                            {position.title}
                                        </p>
                                        <p className="text-sm text-gray-500 break-words">
                                            {position.companyName}
                                        </p>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>

                {/* Education Section */}
                <div>
                    <h3 className="text-xl font-semibold text-center mb-4">Education</h3>
                    <div className="space-y-3 mx-auto max-w-[320px]">
                        {educationData.slice(0, 2).map((education, index) => (
                            education?.schoolName && (
                                <div key={index} className="px-2 text-center">
                                    <p className="text-base text-gray-700 break-words font-medium">
                                        {education.schoolName}
                                    </p>
                                    <p className="text-sm text-gray-500 break-words">
                                        {education.degree} {education.fieldOfStudy && `in ${education.fieldOfStudy}`}
                                    </p>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </CardContent>

            {/* Profile Footer */}
            {showElo && (
                <CardFooter className="flex justify-center p-6">
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-2"
                    >
                        <a
                            href={profile.linkedinUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View LinkedIn Profile
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
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
    return (
        <div className="fixed inset-0 flex">
            {/* Left Profile */}
            <div className="w-1/2 h-full">
                <ProfileCard 
                    profile={profileLeft} 
                    onClick={() => onVote("left")} 
                    showElo={showElo}
                    eloChange={eloChanges?.left}
                    newElo={newElo?.left}
                    isClickable={!showElo}
                />
            </div>

            {/* Right Profile */}
            <div className="w-1/2 h-full">
                <ProfileCard 
                    profile={profileRight} 
                    onClick={() => onVote("right")} 
                    showElo={showElo}
                    eloChange={eloChanges?.right}
                    newElo={newElo?.right}
                    isClickable={!showElo}
                />
            </div>

            {/* Equal Button */}
            {!showElo && (
                <Button 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full text-base font-medium bg-white hover:bg-gray-100 text-gray-900 border shadow-lg"
                    onClick={() => onVote("equal")}
                >
                    Equal
                </Button>
            )}

            {/* Next Button */}
            {showElo && (
                <Button 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full text-base font-medium bg-white hover:bg-gray-100 text-gray-900 border shadow-lg flex items-center justify-center whitespace-normal text-center"
                    onClick={onNextPair}
                >
                    Next Pair
                </Button>
            )}
        </div>
    );
};

export { ComparisonTool };