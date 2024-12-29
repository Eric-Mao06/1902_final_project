"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "../constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface LeaderboardEntry {
    _id: string;
    name: string;
    rating: number;
    role?: string;
    company?: string;
    photoUrl?: string;
    linkedinUrl?: string;
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAuthAlert, setShowAuthAlert] = useState(false);
    const { toast } = useToast();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('from') === 'elo') {
            setShowAuthAlert(true);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch(`${API_URL}/api/leaderboard`);
                if (!response.ok) throw new Error('Failed to fetch leaderboard');
                const data = await response.json();
                setLeaderboard(data.leaderboard);
            } catch (error) {
                toast({
                    title: "Error",
                    description: `Failed to load leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [toast]);

    const handleCardClick = (linkedinUrl?: string) => {
        if (linkedinUrl) {
            window.open(linkedinUrl, '_blank');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {showAuthAlert && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Authentication Required</AlertTitle>
                    <AlertDescription>
                        Only users who are logged in can access alumni ranking
                    </AlertDescription>
                </Alert>
            )}
            <h1 className="text-3xl font-bold mb-8 text-center">Alumni Leaderboard</h1>
            <div className="grid gap-4 max-w-3xl mx-auto">
                {leaderboard.map((entry, index) => (
                    <Card 
                        key={entry._id} 
                        className={`p-4 ${entry.linkedinUrl ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
                        onClick={() => handleCardClick(entry.linkedinUrl)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 text-2xl font-bold text-gray-500">
                                #{index + 1}
                            </div>
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={entry.photoUrl} alt={entry.name} />
                                <AvatarFallback>{entry.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <h3 className="font-semibold">{entry.name}</h3>
                                <p className="text-sm text-gray-500">
                                    {entry.role}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-lg">{Math.round(entry.rating)}</div>
                                <div className="text-sm text-gray-500">ELO</div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}