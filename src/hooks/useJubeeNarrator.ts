import { useCallback, useEffect } from "react";

// Shared singleton controller to prevent overlapping Jubee narration.
// Keeps the currently active utterance in module scope so every consumer
// talks to the same speech instance.
let activeUtterance: SpeechSynthesisUtterance | null = null;

const stopActiveNarration = () => {
  if (activeUtterance) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
};

export interface JubeeSpeakOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  lang?: string;
}

export const useJubeeNarrator = () => {
  const stop = useCallback(() => {
    stopActiveNarration();
  }, []);

  const speak = useCallback((text: string, options?: JubeeSpeakOptions) => {
    // Always stop any current narration before starting a new one to avoid overlap.
    stopActiveNarration();

    const utterance = new SpeechSynthesisUtterance(text);

    if (options?.voice) utterance.voice = options.voice;
    if (options?.rate) utterance.rate = options.rate;
    if (options?.pitch) utterance.pitch = options.pitch;
    if (options?.lang) utterance.lang = options.lang;

    utterance.onend = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
    };

    utterance.onerror = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
    };

    activeUtterance = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  // Clean up any dangling narration when the component using the hook unmounts.
  useEffect(() => stop, [stop]);

  return { speak, stop } as const;
};

// Helper for non-hook consumers (e.g., navigation guard) that need to
// synchronously stop Jubee's narration.
export const stopJubeeNarration = () => stopActiveNarration();

