'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Profile } from '@/app/elo/page';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface ComparisonProps {
  profileLeft: Profile;
  profileRight: Profile;
  onVote: (vote: 'left' | 'right' | 'equal') => void;
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

const AnimatedNumber = ({ value, prevValue }: { value: number, prevValue: number }) => {
  const motionValue = useMotionValue(prevValue);
  const springValue = useSpring(motionValue, {
    stiffness: 150,
    damping: 15,
    duration: 0.4,
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  const displayValue = useTransform(springValue, (latest) => Math.round(latest));

  return (
    <motion.span>
      {displayValue}
    </motion.span>
  );
};

const ProfileCard: React.FC<{
  profile: Profile;
  onClick: () => void;
  showElo: boolean;
  eloChange?: number;
  newElo?: number;
  isClickable: boolean;
}> = ({ profile, onClick, showElo, eloChange, newElo, isClickable }) => {
  const [prevElo, setPrevElo] = useState(profile?.elo || 0);

  useEffect(() => {
    if (newElo === undefined) {
      setPrevElo(profile?.elo || 0);
    }
  }, [profile?.elo, newElo]);

  useEffect(() => {
    if (newElo !== undefined) {
      const timer = setTimeout(() => {
        setPrevElo(newElo);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [newElo]);

  if (!profile) {
    return <div className="text-red-500">Profile data is missing</div>;
  }

  const positionData = profile.raw_linkedin_data?.fullPositions || [];
  const educationData = profile.raw_linkedin_data?.educations || [];

  const cardVariants = {
    hover: {
      y: isClickable ? -4 : 0,
      transition: { duration: 0.2 },
    },
    tap: {
      y: isClickable ? 2 : 0,
      transition: { duration: 0.1 },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  const imageVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      className={`h-full w-full shadow-none rounded-none ${isClickable ? 'cursor-pointer' : ''}`}
      onClick={isClickable ? onClick : undefined}
    >
      <Card className="h-full border-none">
        {/* Profile Header */}
        <CardHeader className="flex flex-col items-center p-6 pb-6">
          <AnimatePresence mode="wait">
            {showElo ? (
              <motion.div
                key="profile"
                initial="hidden"
                animate="visible"
                variants={contentVariants}
                className="flex flex-col items-center"
              >
                <motion.div variants={imageVariants}>
                  <Image
                    src={profile.photoUrl || 'https://media.istockphoto.com/id/1288129985/vector/missing-image-of-a-person-placeholder.jpg?s=612x612&w=0&k=20&c=9kE777krx5mrFHsxx02v60ideRWvIgI1RWzR1X4MG2Y='}
                    alt={`${profile.name || 'Unknown'}'s profile`}
                    width={800}
                    height={800}
                    className="w-24 h-24 rounded-full object-cover mb-4"
                  />
                </motion.div>
                <motion.div
                  variants={contentVariants}
                  className="flex flex-col items-center"
                >
                  <CardTitle className="text-2xl font-semibold mb-2">{profile.name}</CardTitle>
                  <div className="flex flex-col items-center gap-1 h-6">
                    <div className="flex items-center gap-2">
                      <p className="text-lg text-gray-600 flex items-center gap-1">
                        Elo:{' '}
                        <AnimatedNumber
                          value={newElo || profile.elo}
                          prevValue={prevElo}
                        />
                      </p>
                      {eloChange !== undefined && (
                        <motion.span
                          className={`text-base ${eloChange >= 0 ? 'text-green-500' : 'text-red-500'}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          ({eloChange >= 0 ? '+' : ''}{eloChange})
                        </motion.span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial="hidden"
                animate="visible"
                variants={contentVariants}
                className="flex flex-col items-center"
              >
                <motion.div
                  className="w-24 h-24 rounded-full mb-4 bg-gradient-to-br from-blue-500 to-purple-500"
                  animate={{
                    background: [
                      'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
                      'linear-gradient(to bottom right, #8b5cf6, #3b82f6)',
                      'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
                <div className="h-8 w-56 bg-gray-300 rounded mb-2" />
                <div className="h-6 w-24 bg-gray-200 rounded" />
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>

        {/* Profile Content */}
        <CardContent className="px-8 py-2">
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            {/* Experience Section */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-center mb-4">Experience</h3>
              <div className="space-y-4 mx-auto max-w-[320px]">
                {positionData.slice(0, 3).map((position, index) => (
                  position?.title && position?.companyName && (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start gap-3 px-2"
                    >
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
                    </motion.div>
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
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (0.1 * index) }}
                      className="px-2 text-center"
                    >
                      <p className="text-base text-gray-700 break-words font-medium">
                        {education.schoolName}
                      </p>
                      <p className="text-sm text-gray-500 break-words">
                        {education.degree} {education.fieldOfStudy && `in ${education.fieldOfStudy}`}
                      </p>
                    </motion.div>
                  )
                ))}
              </div>
            </div>
          </motion.div>
        </CardContent>

        {/* Profile Footer */}
        {showElo && (
          <CardFooter className="flex justify-center p-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2"
              >
                <a
                  href={profile.linkedinUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View LinkedIn Profile
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </motion.div>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};

const ComparisonTool: React.FC<ComparisonProps> = ({
  profileLeft,
  profileRight,
  onVote,
  showElo,
  eloChanges,
  newElo,
  onNextPair,
}) => {
  return (
    <div className="min-h-screen flex relative">
      {/* Left Profile */}
      <div className="w-1/2 relative">
        <motion.div
          variants={{
            hover: {
              y: !showElo ? -4 : 0,
              transition: { duration: 0.2 },
            },
            tap: {
              y: !showElo ? 2 : 0,
              transition: { duration: 0.1 },
            },
          }}
          whileHover="hover"
          whileTap="tap"
          className="h-full"
        >
          <ProfileCard
            profile={profileLeft}
            onClick={() => onVote('left')}
            showElo={showElo}
            eloChange={eloChanges?.left}
            newElo={newElo?.left}
            isClickable={!showElo}
          />
        </motion.div>
      </div>

      {/* Right Profile */}
      <div className="w-1/2 relative">
        <motion.div
          variants={{
            hover: {
              y: !showElo ? -4 : 0,
              transition: { duration: 0.2 },
            },
            tap: {
              y: !showElo ? 2 : 0,
              transition: { duration: 0.1 },
            },
          }}
          whileHover="hover"
          whileTap="tap"
          className="h-full"
        >
          <ProfileCard
            profile={profileRight}
            onClick={() => onVote('right')}
            showElo={showElo}
            eloChange={eloChanges?.right}
            newElo={newElo?.right}
            isClickable={!showElo}
          />
        </motion.div>
      </div>

      {/* Equal Button */}
      {!showElo && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <Button
            className="w-20 h-20 rounded-full text-base font-medium bg-white hover:bg-gray-100 text-gray-900 border shadow-lg pointer-events-auto"
            onClick={() => onVote('equal')}
          >
            Equal
          </Button>
        </div>
      )}

      {/* Next Button */}
      {showElo && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <Button
            className="w-20 h-20 rounded-full text-base font-medium bg-white hover:bg-gray-100 text-gray-900 border shadow-lg flex items-center justify-center whitespace-normal text-center pointer-events-auto"
            onClick={onNextPair}
          >
            Next Pair
          </Button>
        </div>
      )}
    </div>
  );
};

export { ComparisonTool };
