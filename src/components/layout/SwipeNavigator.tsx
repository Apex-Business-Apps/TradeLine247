import React, { useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { paths } from '@/routes/paths';

const SWIPE_SCREENS = [
  { path: paths.home, label: 'Home' },
  { path: paths.features, label: 'Features' },
  { path: paths.dashboard, label: 'Dashboard' }
];

const SWIPE_THRESHOLD = 64;

interface SwipeNavigatorProps {
  children: React.ReactNode;
  className?: string;
}

export const SwipeNavigator: React.FC<SwipeNavigatorProps> = ({ children, className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  const currentIndex = useMemo(() => {
    const normalizedPath = location.pathname;

    return SWIPE_SCREENS.findIndex((screen) => {
      if (screen.path === paths.home) {
        return normalizedPath === screen.path;
      }
      return normalizedPath === screen.path || normalizedPath.startsWith(`${screen.path}/`);
    });
  }, [location.pathname]);

  const goToIndex = (nextIndex: number) => {
    const screen = SWIPE_SCREENS[nextIndex];
    if (screen && screen.path !== location.pathname) {
      navigate(screen.path);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    startPoint.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startPoint.current == null || currentIndex === -1) return;

    const deltaX = event.clientX - startPoint.current.x;
    const deltaY = event.clientY - startPoint.current.y;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0 && currentIndex < SWIPE_SCREENS.length - 1) {
        goToIndex(currentIndex + 1);
      } else if (deltaX > 0 && currentIndex > 0) {
        goToIndex(currentIndex - 1);
      }
    }

    startPoint.current = null;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (currentIndex === -1) return;

    if (event.key === 'ArrowLeft' && currentIndex > 0) {
      event.preventDefault();
      goToIndex(currentIndex - 1);
    }
    if (event.key === 'ArrowRight' && currentIndex < SWIPE_SCREENS.length - 1) {
      event.preventDefault();
      goToIndex(currentIndex + 1);
    }
  };

  return (
    <div
      className={cn('relative isolate', className)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        startPoint.current = null;
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="group"
      aria-label="Swipe navigation container"
    >
      {children}

      {currentIndex !== -1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-2 shadow-lg backdrop-blur">
            {SWIPE_SCREENS.map((screen, index) => (
              <Button
                key={screen.path}
                variant={index === currentIndex ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition-all',
                  index === currentIndex
                    ? 'shadow-md bg-gradient-to-r from-[#FF6B35] to-[#ff8a4c] text-white'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => goToIndex(index)}
              >
                {screen.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipeNavigator;
