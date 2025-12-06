/**
 * Hermes 3 Demo Page
 * Simple demo page showcasing the Hermes 3 chat interface
 */

import { Hermes3Chat } from '@/components/ui/Hermes3Chat';

export default function Hermes3Demo() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Hermes 3 Chat Demo</h1>
          <p className="text-muted-foreground">
            Interactive chat interface powered by Hermes 3 3B from Nous Research
          </p>
        </div>
        <Hermes3Chat />
      </div>
    </div>
  );
}

