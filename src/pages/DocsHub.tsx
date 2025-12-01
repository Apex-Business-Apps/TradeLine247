import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { paths } from '@/routes/paths';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

const docsLinks = [
  {
    title: 'Project Overview',
    description: 'Primary README covering TradeLine 24/7 setup, scripts, and contribution notes.',
    href: new URL('../../README.md', import.meta.url).href
  },
  {
    title: 'Telephony (Twilio Voice) Guide',
    description: 'Archived telephony integration notes for voice flows and configuration.',
    href: new URL('../../docs/archive/telephony/TWILIO_VOICE_README.md', import.meta.url).href
  }
];

const DocsHub = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">Docs Hub</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Documentation & Guides</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access the latest project guides from a single place. Open each document in a new tab to keep your current workflow intact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {docsLinks.map((doc) => (
            <Card key={doc.title} className="relative overflow-hidden border-border/70 shadow-sm hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#ff8a4c] flex items-center justify-center text-white shadow">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{doc.title}</CardTitle>
                    <CardDescription>{doc.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm text-muted-foreground">Opens in a new tab</span>
                <Button asChild variant="outline" className="rounded-full">
                  <a href={doc.href} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                    View document
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button asChild variant="secondary" className="rounded-full shadow-sm">
            <Link to={paths.home}>Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocsHub;
