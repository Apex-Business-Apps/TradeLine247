import type { HTMLAttributes } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { paths } from '@/routes/paths';
import { Link, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, ArrowLeft } from 'lucide-react';
import { toGithubBlobUrl } from '@/utils/github';

import projectOverviewContent from '../../README.md?raw';
import twilioVoiceGuideContent from '../../docs/archive/telephony/TWILIO_VOICE_README.md?raw';

type DocLink = {
  id: string;
  title: string;
  description: string;
  url: string;
  content: string;
};

const docsLinks: DocLink[] = [
  {
    id: 'project-overview',
    title: 'Project Overview',
    description: 'Primary README covering TradeLine 24/7 setup, scripts, and contribution notes.',
    url: toGithubBlobUrl('README.md'),
    content: projectOverviewContent,
  },
  {
    id: 'telephony-voice-guide',
    title: 'Telephony (Twilio Voice) Guide',
    description: 'Archived telephony integration notes for voice flows and configuration.',
    url: toGithubBlobUrl('docs/archive/telephony/TWILIO_VOICE_README.md'),
    content: twilioVoiceGuideContent,
  },
];

const markdownComponents = {
  h1: ({ ...props }) => <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mt-8 mb-4" {...props} />,
  h2: ({ ...props }) => <h2 className="text-2xl md:text-3xl font-semibold text-foreground mt-6 mb-3" {...props} />,
  h3: ({ ...props }) => <h3 className="text-xl md:text-2xl font-semibold text-foreground mt-5 mb-3" {...props} />,
  p: ({ ...props }) => <p className="text-base leading-7 text-foreground/90 mb-4" {...props} />,
  ul: ({ ...props }) => <ul className="list-disc pl-6 space-y-2 mb-4 text-foreground/90" {...props} />,
  ol: ({ ...props }) => <ol className="list-decimal pl-6 space-y-2 mb-4 text-foreground/90" {...props} />,
  li: ({ ...props }) => <li className="leading-7" {...props} />,
  a: ({ ...props }) => <a className="text-primary underline-offset-4 underline" target="_blank" rel="noreferrer" {...props} />,
  blockquote: ({ ...props }) => (
    <blockquote
      className="border-l-4 border-primary/60 bg-muted/50 text-foreground/90 px-4 py-3 rounded-lg italic mb-4"
      {...props}
    />
  ),
  code: ({ inline, ...props }: { inline?: boolean } & HTMLAttributes<HTMLElement>) => {
    if (inline) {
      return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />;
    }

    return (
      <code
        className="block overflow-x-auto rounded-lg bg-muted px-4 py-3 text-sm font-mono text-foreground"
        {...props}
      />
    );
  },
  pre: ({ ...props }) => <pre className="mb-4" {...props} />,
  table: ({ ...props }) => <table className="w-full border-collapse text-sm md:text-base mb-6" {...props} />,
  thead: ({ ...props }) => <thead className="bg-muted" {...props} />,
  th: ({ ...props }) => <th className="border border-border px-3 py-2 text-left font-semibold" {...props} />,
  td: ({ ...props }) => <td className="border border-border px-3 py-2 align-top" {...props} />,
};

const DocsHub = () => {
  const [searchParams] = useSearchParams();
  const activeDocId = searchParams.get('doc');
  const activeDoc = docsLinks.find((doc) => doc.id === activeDocId);

  if (activeDoc) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-10 space-y-8">
          <div className="flex flex-col gap-4">
            <Button asChild variant="ghost" className="w-fit rounded-full">
              <Link to={paths.docs} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Docs
              </Link>
            </Button>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">Docs Hub</p>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">{activeDoc.title}</h1>
              <p className="text-muted-foreground max-w-3xl">{activeDoc.description}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary" className="rounded-full">
                <Link to={paths.docs}>Back to list</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <a href={activeDoc.url} target="_blank" rel="noreferrer">
                  Open on GitHub
                </a>
              </Button>
            </div>
          </div>

          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-6 md:p-8">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
                className="space-y-4"
              >
                {activeDoc.content}
              </ReactMarkdown>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">Docs Hub</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Documentation & Guides</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access the latest project guides from a single place. Open each document in the in-app viewer to keep your workflow intact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {docsLinks.map((doc) => (
            <Card key={doc.id} className="relative overflow-hidden border-border/70 shadow-sm hover:shadow-lg transition-shadow">
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
                <span className="text-sm text-muted-foreground">Opens in the in-app viewer</span>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to={`${paths.docs}?doc=${doc.id}`} className="flex items-center gap-2">
                    View document
                  </Link>
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
