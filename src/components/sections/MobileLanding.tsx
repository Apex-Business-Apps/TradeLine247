import React from 'react';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock } from 'lucide-react';

export const MobileLanding = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white md:hidden">
      {/* Orange Header Bar */}
      <div className="bg-[#FF6B35] text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">11:36</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-white"></div>
          <div className="w-1 h-1 rounded-full bg-white"></div>
          <div className="w-1 h-1 rounded-full bg-white"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8 space-y-8">
        {/* Tagline */}
        <h1 className="text-3xl font-bold text-center text-[#1e556b] mb-8">
          Grow your business, not your payroll.
        </h1>

        {/* Video Player */}
        <div className="mb-8">
          <VideoPlayer
            src="/assets/TradeLine247_Teaser.mp4"
            title="TradeLine 24/7 Demo"
            className="w-full aspect-video rounded-lg"
          />
        </div>

        {/* Feature Cards */}
        <div className="space-y-4">
          {/* More booked work card */}
          <Card className="bg-white rounded-xl shadow-md border-0">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-[#FF6B35]" />
              </div>
              <CardTitle className="text-xl font-bold text-[#1e556b]">
                More booked work
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-600 text-sm">
                Fewer voicemails means more conversations and more wins.
              </p>
            </CardContent>
          </Card>

          {/* Time back card */}
          <Card className="bg-white rounded-xl shadow-md border-0">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-[#FF6B35]" />
              </div>
              <CardTitle className="text-xl font-bold text-[#1e556b]">
                Time back
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-600 text-sm">
                Focus on what matters while we handle your calls 24/7.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Orange FAB */}
      <div className="fixed bottom-20 right-4 z-50 md:hidden">
        <button
          className="w-14 h-14 bg-[#FF6B35] rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Chat support"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black text-white px-4 py-3 flex items-center justify-between md:hidden">
        <div className="w-6 h-6 flex flex-col gap-1">
          <div className="h-0.5 bg-white"></div>
          <div className="h-0.5 bg-white"></div>
          <div className="h-0.5 bg-white"></div>
        </div>
        <div className="w-6 h-6 border-2 border-white rounded-full"></div>
        <div className="w-6 h-6">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

