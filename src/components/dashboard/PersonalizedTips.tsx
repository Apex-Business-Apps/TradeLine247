/**
 * Personalized Tips Component
 *
 * Displays contextual tips and recommendations based on:
 * - User activity
 * - Dashboard metrics
 * - Time of day
 * - Recent actions
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';

interface PersonalizedTipsProps {
  kpisData?: Array<{
    id: string;
    value: number;
    deltaPct?: number;
  }>;
  nextItemsCount?: number;
  transcriptsCount?: number;
}

export const PersonalizedTips: React.FC<PersonalizedTipsProps> = ({
  kpisData = [],
  nextItemsCount = 0,
  transcriptsCount = 0,
}) => {
  const { recentActions, addRecentAction } = useUserPreferencesStore();

  // Generate contextual tips based on user data
  const generateTips = () => {
    const tips = [];
    const currentHour = new Date().getHours();

    // Time-based tips
    if (currentHour >= 9 && currentHour < 12) {
      tips.push({
        id: 'morning-check',
        icon: Calendar,
        title: 'Morning Routine',
        description: 'Review your upcoming appointments for today to stay prepared.',
        action: 'View Calendar',
        color: 'text-blue-700 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      });
    }

    // KPI-based tips
    const answerRateKpi = kpisData.find((k) => k.id === 'answerRate');
    if (answerRateKpi && answerRateKpi.value < 80) {
      tips.push({
        id: 'improve-answer-rate',
        icon: Phone,
        title: 'Boost Your Answer Rate',
        description: `Your answer rate is at ${answerRateKpi.value}%. Consider adjusting your AI settings to catch more calls.`,
        action: 'Optimize Settings',
        color: 'text-orange-700 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      });
    }

    // Activity-based tips
    if (nextItemsCount > 5) {
      tips.push({
        id: 'manage-appointments',
        icon: Calendar,
        title: 'Busy Schedule Ahead',
        description: `You have ${nextItemsCount} upcoming items. Review and prioritize to stay on track.`,
        action: 'Review Schedule',
        color: 'text-purple-700 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      });
    }

    // Trend-based tips
    const bookingsKpi = kpisData.find((k) => k.id === 'bookings');
    if (bookingsKpi && bookingsKpi.deltaPct && bookingsKpi.deltaPct > 20) {
      tips.push({
        id: 'trending-up',
        icon: TrendingUp,
        title: 'Great Momentum!',
        description: `Bookings are up ${bookingsKpi.deltaPct}% this week. Keep up the excellent work!`,
        action: 'View Insights',
        color: 'text-green-700 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
      });
    }

    // New user tip
    if (recentActions.length < 5) {
      tips.push({
        id: 'getting-started',
        icon: Lightbulb,
        title: 'Getting Started',
        description: 'Explore the Quick Actions menu to see what your AI receptionist can do.',
        action: 'Explore Features',
        color: 'text-amber-800 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      });
    }

    // Default tip if no contextual tips
    if (tips.length === 0) {
      tips.push({
        id: 'general-tip',
        icon: Lightbulb,
        title: 'Pro Tip',
        description: 'Review your recent call transcripts to identify common questions and improve your responses.',
        action: 'View Transcripts',
        color: 'text-blue-700 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      });
    }

    // Return up to 2 most relevant tips
    return tips.slice(0, 2);
  };

  const tips = generateTips();

  const handleTipAction = (tipId: string) => {
    addRecentAction(`Clicked tip: ${tipId}`);
    // In a real implementation, this would navigate or trigger the appropriate action
    console.log(`[PersonalizedTips] Action clicked for tip: ${tipId}`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-700" />
          <CardTitle className="text-lg">Tips for You</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tips.map((tip) => {
          const Icon = tip.icon;
          return (
            <div
              key={tip.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
            >
              <div className={`p-2 rounded-lg ${tip.bgColor} shrink-0`}>
                <Icon className={`h-4 w-4 ${tip.color}`} />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <h4 className="font-medium text-sm">{tip.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {tip.description}
                  </p>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => handleTipAction(tip.id)}
                >
                  {tip.action} →
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
