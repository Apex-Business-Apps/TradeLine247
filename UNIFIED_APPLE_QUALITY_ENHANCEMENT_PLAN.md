# 🍎 Unified Apple-Level Quality Enhancement Plan
**TradeLine 24/7 - Homepage & Dashboard**  
**Date:** 2025-11-01  
**Target:** Match/Exceed Apple's Native App Quality Standards

---

## 📊 Executive Summary

### Current State Assessment
- **Homepage Performance:** Good (LCP: 2.2s ✅, CLS: 0.03 ✅, FCP: 1.5s ⚠️)
- **Dashboard Performance:** Excellent (FCP: 544ms ✅, Interactive: 142ms ✅)
- **Codebase Quality:** Modern stack (React 18, TypeScript, Tailwind, Supabase)
- **User Experience:** Functional but lacks Apple-level polish

### Enhancement Goals
1. **Performance:** Achieve sub-1s load times across all pages
2. **Animations:** Implement smooth, purposeful micro-interactions
3. **Visual Polish:** iOS-style depth, shadows, and blur effects
4. **Accessibility:** 100% WCAG AA compliance
5. **PWA:** Native app-like experience with offline support

---

## 🏠 HOMEPAGE ENHANCEMENTS

### 1. Micro-Interactions & Animations ⭐⭐⭐

#### A. Button Interactions (iOS-Style Ripple)
```tsx
// src/components/ui/button-enhanced.tsx
import { useState, useRef } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
}

export const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  className,
  onClick,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);

    onClick?.(e);
  };

  return (
    <Button
      ref={buttonRef}
      onClick={handleClick}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/50 pointer-events-none"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${Math.max(document.documentElement.clientWidth, document.documentElement.clientHeight)}px`,
            height: `${Math.max(document.documentElement.clientWidth, document.documentElement.clientHeight)}px`,
            transform: 'scale(0)',
            animation: 'ripple 0.6s ease-out',
          }}
        />
      ))}
      <span className="relative z-10">{children}</span>
    </Button>
  );
};

// Add to global CSS
const rippleAnimation = `
@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
`;
```

#### B. Smooth Scroll Animations (Intersection Observer)
```tsx
// src/hooks/useScrollAnimation.ts
import { useEffect, useRef, useState } from 'react';

export const useScrollAnimation = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

// Usage in components
const { ref, isVisible } = useScrollAnimation();
<div
  ref={ref}
  className={`transition-all duration-700 ${
    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
  }`}
>
  {/* Content */}
</div>
```

#### C. Animated Number Counters (ROI Calculator)
```tsx
// src/components/ui/animated-counter.tsx
import { useEffect, useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
}) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true });
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!inView) return;

    const startValue = 0;
    const endValue = value;
    const startTime = performance.now();
    startTimeRef.current = startTime;

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) return;

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (endValue - startValue) * eased;
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      startTimeRef.current = null;
    };
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      {suffix}
    </span>
  );
};

// Usage in ROI Calculator
<AnimatedCounter value={4763} prefix="$" suffix="" />
```

#### D. Floating Label Inputs (iOS-Style)
```tsx
// src/components/ui/floating-label-input.tsx
import { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  error,
  className,
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasValue(!!value || !!inputRef.current?.value);
  }, [value]);

  return (
    <div className="relative">
      <Label
        htmlFor={props.id}
        className={cn(
          'absolute left-3 transition-all duration-200 pointer-events-none',
          isFocused || hasValue
            ? '-top-3 text-xs text-primary bg-background px-1'
            : 'top-3 text-sm text-muted-foreground'
        )}
      >
        {label}
      </Label>
      <Input
        ref={inputRef}
        {...props}
        value={value}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        onChange={(e) => {
          setHasValue(!!e.target.value);
          props.onChange?.(e);
        }}
        className={cn(
          'pt-4 pb-2',
          error && 'border-red-500 focus:border-red-500',
          className
        )}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};
```

### 2. Performance Optimizations ⭐⭐⭐

#### A. Image Optimization with Next-Gen Formats
```tsx
// src/components/ui/optimized-image.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallback,
  priority = false,
  className,
  ...props
}) => {
  const [error, setError] = useState(false);

  // Generate WebP and AVIF variants (server-side or CDN)
  const webpSrc = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const avifSrc = src.replace(/\.(png|jpg|jpeg)$/i, '.avif');

  return (
    <picture>
      <source srcSet={avifSrc} type="image/avif" />
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={error ? fallback || src : src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        onError={() => setError(true)}
        className={cn('transition-opacity duration-300', className)}
        {...props}
      />
    </picture>
  );
};
```

#### B. Font Preloading Strategy
```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="preload"
  href="/fonts/inter-var.woff2"
  as="font"
  type="font/woff2"
  crossorigin="anonymous"
/>
```

#### C. Resource Hints
```html
<!-- index.html -->
<link rel="dns-prefetch" href="https://api.supabase.co" />
<link rel="preconnect" href="https://api.supabase.co" crossorigin="anonymous" />
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
<link rel="dns-prefetch" href="https://fonts.gstatic.com" />
```

#### D. Component-Level Code Splitting
```tsx
// src/pages/Index.tsx
import { lazy, Suspense } from 'react';

const RoiCalculator = lazy(() => import('@/components/RoiCalculator'));
const LeadCaptureCard = lazy(() => import('@/components/sections/LeadCaptureCard'));

// With skeleton fallback
<Suspense fallback={<RoiCalculatorSkeleton />}>
  <RoiCalculator />
</Suspense>
```

### 3. Visual Design Polish ⭐⭐⭐

#### A. iOS-Style Depth & Shadows
```css
/* src/styles/apple-shadows.css */
:root {
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  --shadow-md: 0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.15), 0 6px 6px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 15px 30px rgba(0, 0, 0, 0.2), 0 10px 10px rgba(0, 0, 0, 0.15);
}

.card {
  box-shadow: var(--shadow-md);
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

#### B. Glassmorphism (Blur Backdrop)
```tsx
// src/components/ui/glass-card.tsx
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'backdrop-blur-xl bg-white/80 dark:bg-gray-900/80',
        'border border-white/20 dark:border-gray-700/20',
        'shadow-xl',
        className
      )}
      style={{
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
      {...props}
    >
      {children}
    </div>
  );
};
```

#### C. Enhanced Typography System
```css
/* src/styles/typography.css */
.text-display {
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.text-headline {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.text-body {
  font-size: clamp(1rem, 2vw, 1.125rem);
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0;
}
```

### 4. Success/Error Feedback ⭐⭐

#### A. Confetti Animation (Form Success)
```tsx
// src/lib/confetti.ts
import confetti from 'canvas-confetti';

export const celebrateSuccess = () => {
  const duration = 3000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#FFB347', '#34C759', '#007AFF'],
    });

    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#FFB347', '#34C759', '#007AFF'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
};
```

#### B. Checkmark Animation
```tsx
// src/components/ui/checkmark-animation.tsx
import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckmarkAnimationProps {
  className?: string;
}

export const CheckmarkAnimation: React.FC<CheckmarkAnimationProps> = ({ className }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const path = svgRef.current?.querySelector('path');
    if (!path) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    path.style.animation = 'draw-check 0.6s ease-out forwards';
  }, []);

  return (
    <Check
      ref={svgRef}
      className={cn('w-16 h-16 text-green-500', className)}
      strokeWidth={3}
      style={{
        animation: 'scale-in 0.3s ease-out',
      }}
    />
  );
};

// Add to CSS
const checkmarkAnimations = `
@keyframes draw-check {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes scale-in {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}
`;
```

---

## 📊 DASHBOARD ENHANCEMENTS

### 1. Real-Time Data Visualization ⭐⭐⭐

#### A. Animated KPI Cards with Sparklines
```tsx
// Enhanced KpiCard with sparkline chart
import { SparklineChart } from './SparklineChart';

export const EnhancedKpiCard: React.FC<KpiCardProps> = ({
  kpi,
  sparklineData, // Array of historical values
  ...props
}) => {
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4">
        {/* Icon and trend */}
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          {trend && (
            <Badge variant={trend.startsWith('+') ? 'success' : 'destructive'}>
              {trend}
            </Badge>
          )}
        </div>

        {/* Animated counter value */}
        <div className="space-y-1 mb-3">
          <div className="text-2xl font-bold">
            <AnimatedCounter value={kpi.value} prefix={kpi.currency ? '$' : ''} />
          </div>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>

        {/* Sparkline chart */}
        {sparklineData && (
          <div className="h-12 mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
            <SparklineChart data={sparklineData} color={color} />
          </div>
        )}
      </CardContent>

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Card>
  );
};
```

#### B. Real-Time Updates with Optimistic UI
```tsx
// src/hooks/useOptimisticDashboard.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useOptimisticDashboard = () => {
  const queryClient = useQueryClient();

  const updateKpi = useMutation({
    mutationFn: async (newValue: number) => {
      // API call
      return await updateDashboardKpi(newValue);
    },
    onMutate: async (newValue) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['dashboard-summary'] });

      // Snapshot previous value
      const previous = queryClient.getQueryData(['dashboard-summary']);

      // Optimistically update
      queryClient.setQueryData(['dashboard-summary'], (old: any) => ({
        ...old,
        kpis: old.kpis.map((kpi: Kpi) =>
          kpi.id === 'bookings' ? { ...kpi, value: newValue } : kpi
        ),
      }));

      return { previous };
    },
    onError: (err, newValue, context) => {
      // Rollback on error
      queryClient.setQueryData(['dashboard-summary'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  return { updateKpi };
};
```

### 2. Interactive Dashboard Components ⭐⭐⭐

#### A. Draggable Dashboard Layout
```tsx
// src/components/dashboard/DraggableDashboard.tsx
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const DraggableDashboard: React.FC = () => {
  const [cards, setCards] = useState(['kpi', 'appointments', 'activity', 'wins']);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setCards((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={cards}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {cards.map((id) => (
            <SortableCard key={id} id={id} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
```

#### B. Pull-to-Refresh
```tsx
// src/hooks/usePullToRefresh.ts
import { useEffect, useState } from 'react';

export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.touches[0].clientY);
  };

  const handleTouchEnd = async () => {
    if (window.scrollY === 0 && touchEnd - touchStart > 100) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, touchEnd]);

  return { isRefreshing };
};
```

### 3. Enhanced Loading States ⭐⭐⭐

#### A. Skeleton Loaders (iOS-Style)
```tsx
// src/components/ui/skeleton-enhanced.tsx
export const SkeletonCard: React.FC = () => {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        
        <div className="space-y-3">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
};

// CSS animation
const shimmerAnimation = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;
```

#### B. Progressive Loading (Staggered)
```tsx
// src/components/dashboard/StaggeredLoader.tsx
export const StaggeredLoader: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-fade-in"
          style={{
            animationDelay: `${i * 100}ms`,
            animationFillMode: 'both',
          }}
        >
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
};
```

### 4. Dashboard Analytics & Insights ⭐⭐

#### A. Trend Indicators
```tsx
// src/components/dashboard/TrendIndicator.tsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendIndicatorProps {
  value: number;
  label?: string;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({ value, label }) => {
  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <div className="flex items-center gap-2">
      {isPositive && <TrendingUp className="h-4 w-4 text-green-500" />}
      {isNegative && <TrendingDown className="h-4 w-4 text-red-500" />}
      {!isPositive && !isNegative && <Minus className="h-4 w-4 text-muted-foreground" />}
      
      <span
        className={cn(
          'text-sm font-medium',
          isPositive && 'text-green-600 dark:text-green-400',
          isNegative && 'text-red-600 dark:text-red-400',
          !isPositive && !isNegative && 'text-muted-foreground'
        )}
      >
        {isPositive ? '+' : ''}
        {value}%
        {label && ` ${label}`}
      </span>
    </div>
  );
};
```

#### B. Performance Insights Card
```tsx
// src/components/dashboard/PerformanceInsights.tsx
export const PerformanceInsights: React.FC = () => {
  const { kpis } = useDashboardData();

  const insights = useMemo(() => {
    // Analyze KPIs and generate insights
    const lowAnswerRate = kpis.find(k => k.id === 'answerRate' && k.value < 50);
    const highBookings = kpis.find(k => k.id === 'bookings' && k.value > 10);

    return [
      lowAnswerRate && {
        type: 'warning',
        title: 'Low Answer Rate',
        message: 'Consider adjusting AI settings to catch more calls.',
        action: 'Optimize Settings',
      },
      highBookings && {
        type: 'success',
        title: 'Great Week!',
        message: `You've booked ${highBookings.value} appointments this week.`,
        action: null,
      },
    ].filter(Boolean);
  }, [kpis]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={cn(
              'p-3 rounded-lg border-l-4',
              insight.type === 'warning' && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
              insight.type === 'success' && 'border-green-500 bg-green-50 dark:bg-green-900/20'
            )}
          >
            <h4 className="font-semibold mb-1">{insight.title}</h4>
            <p className="text-sm text-muted-foreground mb-2">{insight.message}</p>
            {insight.action && (
              <Button size="sm" variant="outline">
                {insight.action} →
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
```

---

## 🔄 UNIFIED IMPROVEMENTS (Both Pages)

### 1. Accessibility Enhancements ⭐⭐⭐

#### A. Keyboard Navigation
```tsx
// src/hooks/useKeyboardNavigation.ts
import { useEffect, useRef } from 'react';

export const useKeyboardNavigation = () => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+K or CTRL+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Open search dialog
      }

      // ESC to close modals
      if (e.key === 'Escape') {
        // Close active modal/dialog
      }

      // Arrow keys for navigation (when focus is on navigable elements)
      // Implementation depends on specific UI
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { containerRef };
};
```

#### B. Screen Reader Announcements
```tsx
// src/components/ui/live-region.tsx
import { useEffect } from 'react';

export const LiveRegion: React.FC<{ message: string; priority?: 'polite' | 'assertive' }> = ({
  message,
  priority = 'polite',
}) => {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};

// Usage
<LiveRegion message="Dashboard updated successfully" priority="polite" />
```

### 2. PWA Enhancements ⭐⭐

#### A. Service Worker Updates
```typescript
// public/sw.js (Enhanced)
const CACHE_NAME = 'tradeline247-v2';
const RUNTIME_CACHE = 'tradeline247-runtime';

// Cache critical assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/assets/official-logo.svg',
        '/fonts/inter-var.woff2',
        '/manifest.json',
      ]);
    })
  );
  self.skipWaiting();
});

// Network-first strategy for API calls
// Cache-first for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
```

#### B. Install Prompt
```tsx
// src/hooks/useInstallPrompt.ts
import { useEffect, useState } from 'react';

export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show custom install banner after 30 seconds
      setTimeout(() => setShowPrompt(true), 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  return { showPrompt, installApp };
};
```

### 3. Performance Monitoring ⭐⭐

#### A. Web Vitals Tracking
```tsx
// src/lib/analytics/web-vitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

export const reportWebVital = (metric: any) => {
  // Send to analytics
  if (import.meta.env.PROD) {
    fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        url: window.location.href,
      }),
    });
  }
};

// Initialize tracking
onCLS(reportWebVital);
onFID(reportWebVital);
onFCP(reportWebVital);
onLCP(reportWebVital);
onTTFB(reportWebVital);
```

---

## 📋 IMPLEMENTATION ROADMAP

### Phase 1: Quick Wins (Week 1) - 8 hours
1. ✅ Button ripple effects (2h)
2. ✅ Floating label inputs (2h)
3. ✅ Skeleton loaders (2h)
4. ✅ Resource hints & font preloading (2h)

### Phase 2: Core Enhancements (Week 2) - 16 hours
1. ✅ Animated counters (3h)
2. ✅ Scroll animations (3h)
3. ✅ Image optimization (2h)
4. ✅ iOS-style shadows & glassmorphism (3h)
5. ✅ Success/error feedback animations (3h)
6. ✅ Enhanced KPI cards with sparklines (2h)

### Phase 3: Advanced Features (Week 3) - 16 hours
1. ✅ Real-time dashboard updates (4h)
2. ✅ Draggable dashboard layout (4h)
3. ✅ Pull-to-refresh (2h)
4. ✅ Performance insights (3h)
5. ✅ PWA enhancements (3h)

### Phase 4: Polish & Testing (Week 4) - 12 hours
1. ✅ Accessibility audit & fixes (4h)
2. ✅ Performance optimization pass (4h)
3. ✅ Cross-browser testing (2h)
4. ✅ User acceptance testing (2h)

**Total Estimated Time:** 52 hours (~1.5 developer weeks)

---

## 🎯 Success Metrics

### Performance Targets
- **Homepage FCP:** 1.5s → 0.8s (47% improvement)
- **Dashboard FCP:** 544ms → 300ms (45% improvement)
- **LCP:** Maintain ≤2.5s (already good)
- **CLS:** Maintain ≤0.05 (already excellent)
- **Interactive Time:** <1s on all pages

### User Experience Targets
- **Engagement:** +30% (via micro-interactions)
- **Conversion:** +15% (via better form UX)
- **Bounce Rate:** -20% (via performance + polish)
- **Accessibility Score:** 90% → 100%

### Technical Targets
- **Lighthouse Performance:** 85+ → 95+
- **Accessibility Score:** 90 → 100
- **Best Practices Score:** 95 → 100
- **SEO Score:** Maintain 100

---

## ✅ Quality Checklist

### Homepage
- [ ] Ripple effects on all buttons
- [ ] Floating label inputs in forms
- [ ] Animated ROI calculator values
- [ ] Scroll-triggered animations
- [ ] Optimized images (WebP/AVIF)
- [ ] Preloaded fonts
- [ ] Success confetti animation
- [ ] iOS-style card shadows
- [ ] Glassmorphism navbar

### Dashboard
- [ ] Animated KPI counters
- [ ] Sparkline charts on KPI cards
- [ ] Real-time updates with optimistic UI
- [ ] Draggable dashboard layout
- [ ] Pull-to-refresh support
- [ ] Enhanced skeleton loaders
- [ ] Performance insights card
- [ ] Trend indicators
- [ ] Smooth transitions between states

### Both Pages
- [ ] Keyboard navigation (CMD+K, ESC)
- [ ] Screen reader announcements
- [ ] PWA install prompt
- [ ] Offline support
- [ ] Web Vitals tracking
- [ ] Error boundaries
- [ ] Loading states for all async operations
- [ ] Dark mode support
- [ ] Reduced motion support

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install canvas-confetti @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-intersection-observer web-vitals
```

### 2. Start with Quick Wins
Begin with Phase 1 items (ripple effects, floating labels, skeletons) for immediate UX improvement.

### 3. Test Incrementally
After each phase, run Lighthouse and test across devices (iPhone, iPad, Desktop).

### 4. Monitor Metrics
Set up Web Vitals tracking to measure real-world performance improvements.

---

**Status:** Ready for implementation  
**Priority:** High (Competitive Advantage)  
**Estimated ROI:** 20-30% improvement in engagement metrics

