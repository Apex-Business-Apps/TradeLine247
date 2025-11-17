import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useJubeeNarrator } from "@/hooks/useJubeeNarrator";

const storyPages = [
  "Hi! I'm Jubee, your reading buddy. Let's go on a cozy adventure together!",
  "We wander through a rainbow forest where every tree hums a gentle tune.",
  "A friendly cloud swoops low to give us a ride across the cotton-candy sky.",
  "When the sun yawns, we whisper thank you and glide back home for a hug.",
];

const JubeeAvatar = () => (
  <div className="pointer-events-none absolute bottom-4 right-4 z-20">
    <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-orange-200 via-pink-200 to-sky-200 shadow-lg shadow-orange-200/60">
      <div className="absolute inset-2 rounded-full bg-white/70 backdrop-blur-sm border-4 border-white flex items-center justify-center text-2xl font-semibold text-orange-500">
        Jubee
      </div>
    </div>
  </div>
);

const PageDots = ({ index }: { index: number }) => (
  <div className="mt-6 flex justify-center gap-2" aria-label="Story page position">
    {storyPages.map((_, i) => (
      <span
        key={i}
        className={`h-2 w-2 rounded-full transition-all duration-200 ${
          i === index ? "bg-orange-500 w-4" : "bg-orange-200"
        }`}
      />
    ))}
  </div>
);

const KidsStory = () => {
  const { speak, stop } = useJubeeNarrator();
  const [pageIndex, setPageIndex] = useState(0);

  const pageText = useMemo(() => storyPages[pageIndex], [pageIndex]);

  useEffect(() => {
    speak(pageText, { rate: 1, pitch: 1.05 });

    return () => {
      stop();
    };
  }, [pageText, speak, stop]);

  const goNext = () => setPageIndex(index => Math.min(storyPages.length - 1, index + 1));
  const goPrev = () => setPageIndex(index => Math.max(0, index - 1));

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-50 via-pink-50 to-sky-50">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(255,200,120,0.25),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(120,200,255,0.2),transparent_35%),radial-gradient(circle_at_60%_80%,rgba(255,182,193,0.28),transparent_35%)]" />
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">Story Time</p>
          <h1 className="text-3xl font-bold text-rose-500 drop-shadow-sm">Adventure with Jubee</h1>
        </div>

        <Card className="rounded-3xl border-none bg-white/80 shadow-xl shadow-rose-100/60">
          <CardContent className="flex flex-col gap-6 p-6">
            <p className="text-lg leading-relaxed text-rose-800">{pageText}</p>

            <div className="flex justify-between gap-3">
              <Button variant="secondary" onClick={goPrev} disabled={pageIndex === 0} className="rounded-full px-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={goNext} disabled={pageIndex === storyPages.length - 1} className="rounded-full px-4">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <PageDots index={pageIndex} />
          </CardContent>
        </Card>
      </div>
      <JubeeAvatar />
    </div>
  );
};

export default KidsStory;

