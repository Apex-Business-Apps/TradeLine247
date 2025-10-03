import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface IntegrationCardProps {
  title: string;
  description: string;
  connected?: boolean;
  onConfigure: () => void;
}

export function IntegrationCard({
  title,
  description,
  connected = false,
  onConfigure,
}: IntegrationCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{title}</h4>
          {connected && (
            <Badge variant="default" className="bg-green-600">
              Connected
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button variant="outline" onClick={onConfigure}>
        {connected ? 'Manage' : 'Configure'}
      </Button>
    </div>
  );
}
