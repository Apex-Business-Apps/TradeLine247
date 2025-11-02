import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, UserPlus, PhoneCall, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/routes/paths';

const actions = [
  {
    label: 'View Calls',
    icon: Phone,
    to: paths.calls,
    variant: 'default' as const,
  },
  {
    label: 'Add Number',
    icon: PhoneCall,
    to: paths.addNumber,
    variant: 'outline' as const,
  },
  {
    label: 'Invite Staff',
    icon: UserPlus,
    to: paths.teamInvite,
    variant: 'outline' as const,
  },
  {
    label: 'Integrations',
    icon: LinkIcon,
    to: paths.integrations,
    variant: 'outline' as const,
  },
];

export const QuickActionsCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant={action.variant}
              onClick={() => navigate(action.to)}
              className="w-full justify-start gap-2"
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};
