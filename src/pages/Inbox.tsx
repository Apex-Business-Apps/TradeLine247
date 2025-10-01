import { AppLayout } from '@/components/Layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Phone, Mail, MessageCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Inbox() {
  const mockMessages = [
    {
      id: '1',
      type: 'chat',
      from: 'John Smith',
      subject: 'Question about 2024 Camry',
      preview: 'Hi, I saw the listing for the 2024 Camry...',
      unread: true,
      timestamp: '2025-10-01T10:30:00Z',
    },
    {
      id: '2',
      type: 'email',
      from: 'Sarah Johnson',
      subject: 'Test Drive Request',
      preview: 'I would like to schedule a test drive...',
      unread: false,
      timestamp: '2025-10-01T09:15:00Z',
    },
  ];

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      chat: MessageSquare,
      email: Mail,
      sms: MessageCircle,
      phone: Phone,
    };
    return icons[type] || MessageSquare;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground mt-2">
            Manage all customer communications in one place
          </p>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Messages</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="ai">AI Handled</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {mockMessages.map((message) => {
              const Icon = getTypeIcon(message.type);
              return (
                <Card key={message.id} className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold">{message.from}</h3>
                        {message.unread && (
                          <Badge variant="default" className="h-5">New</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {message.subject}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {message.preview}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      <Button size="sm">Reply</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="unread" className="mt-6">
            <p className="text-center text-muted-foreground py-8">
              No unread messages
            </p>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <p className="text-center text-muted-foreground py-8">
              AI-handled conversations will appear here
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
