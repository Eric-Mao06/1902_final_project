"use client";

import React from "react";
import { ComparisonTool } from "../components/comparisonTool";

export default function Elo() {
    const handleVote = (vote: "left" | "right" | "equal") => {
        console.log(`User voted: ${vote}`);
    };

    const profile1 = {
        name: "Alice Johnson",
        headline: "Senior Software Engineer",
        image: "https://png.pngtree.com/png-vector/20191101/ourmid/pngtree-cartoon-color-simple-male-avatar-png-image_1934459.jpg", // Mock image URL
        url: "https://linkedin.com/in/alicejohnson",
        location: "San Francisco, CA",
        currentPosition: "Tech Lead at Innovatech",
        elo: 1500,
    };

    const profile2 = {
        name: "Bob Smith",
        headline: "Product Manager",
        image: "https://png.pngtree.com/png-vector/20191101/ourmid/pngtree-cartoon-color-simple-male-avatar-png-image_1934459.jpg",
        url: "https://linkedin.com/in/bobsmith",
        location: "New York, NY",
        currentPosition: "Product Lead at Creatify",
        elo: 1450,
    };

    return (
        <div className="-mt-16 flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
            <ComparisonTool profileLeft={profile1} profileRight={profile2} onVote={handleVote} />
        </div>
    );
};