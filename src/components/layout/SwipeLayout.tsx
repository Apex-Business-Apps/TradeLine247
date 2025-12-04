import React, { useMemo, useRef } from "react";
import { useSwipeable } from "react-swipeable";
import { cn } from "@/lib/utils";

interface SwipeLayoutProps {
  children: React.ReactNode;
  className?: string;
  sectionClassName?: string;
}

export const SwipeLayout: React.FC<SwipeLayoutProps> = ({
  children,
  className,
  sectionClassName,
}) => {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const sections = useMemo(() => React.Children.toArray(children), [children]);

  const scrollToSection = (index: number) => {
    const target = sectionRefs.current[index];

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const getCurrentSectionIndex = () => {
    const viewportMidpoint = window.innerHeight / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    sectionRefs.current.forEach((section, index) => {
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const sectionMidpoint = rect.top + rect.height / 2;
      const distance = Math.abs(sectionMidpoint - viewportMidpoint);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  const handlers = useSwipeable({
    onSwipedUp: () => {
      const currentIndex = getCurrentSectionIndex();

      if (currentIndex < sections.length - 1) {
        scrollToSection(currentIndex + 1);
      }
    },
    onSwipedDown: () => {
      const currentIndex = getCurrentSectionIndex();

      if (currentIndex > 0) {
        scrollToSection(currentIndex - 1);
      }
    },
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: false,
  });

  return (
    <div
      className={cn("relative w-full touch-pan-y", className)}
      {...handlers}
      aria-label="Swipe layout container"
    >
      {sections.map((child, index) => (
        <section
          key={index}
          ref={(element) => {
            sectionRefs.current[index] = element;
          }}
          className={cn("swipe-section", sectionClassName)}
        >
          {child}
        </section>
      ))}
    </div>
  );
};

export default SwipeLayout;
