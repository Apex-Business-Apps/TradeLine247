import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '@/components/ui/navigation-menu';
import { Menu, X, LogOut, User, Settings, ChevronDown, Phone, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { errorReporter } from '@/lib/errorReporter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Navigation configuration
const MARKETING_NAV = [
  { name: 'Features', href: paths.features },
  { name: 'Pricing', href: `${paths.pricing}#no-monthly` },
  { name: 'Compare', href: paths.compare },
  { name: 'Security', href: paths.security },
  { name: 'FAQ', href: paths.faq },
  { name: 'Contact', href: paths.contact },
] as const;

const ADMIN_NAV = [
  { name: 'Dashboard', href: paths.dashboard, icon: User },
  { name: 'Calls', href: paths.calls, icon: Phone },
  { name: 'Phone Apps', href: paths.phoneApps, icon: Smartphone },
  { name: 'Settings', href: paths.voiceSettings, icon: Settings },
] as const;

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, userRole, signOut, isAdmin } = useAuth();
  const { goToWithFeedback } = useSafeNavigation();
  const location = useLocation();
  const isUserAdmin = isAdmin();

  // Navigation handler
  const handleNavigation = useCallback(async (href: string, label: string, closeMenu = false) => {
    if (closeMenu) setIsMobileMenuOpen(false);
    try {
      await goToWithFeedback(href, label);
    } catch (error) {
      errorReporter.report({
        type: 'error',
        message: `Header navigation failed: ${label} to ${href}`,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment'](),
        metadata: { label, href, error }
      });
    }
  }, [goToWithFeedback]);

  // Scroll detection with throttling to prevent excessive re-renders
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Only update if scroll threshold actually changed
      const wasScrolled = lastScrollY > 10;
      const isNowScrolled = currentScrollY > 10;

      if (wasScrolled !== isNowScrolled) {
        // Throttle: batch updates using requestAnimationFrame
        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            setIsScrolled(currentScrollY > 10);
            lastScrollY = currentScrollY;
            timeoutId = null;
          }, 100); // 100ms throttle
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Active path check
  const isActivePath = useCallback((href: string) => {
    const [path] = href.split('#');
    return location.pathname === path;
  }, [location.pathname]);

  // User display name
  const userDisplayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <header 
      data-site-header 
      className={cn(
        'sticky top-0 z-[9999] w-full border-b bg-background/95 backdrop-blur',
        'supports-[backdrop-filter]:bg-background/60 transition-all duration-300 isolate',
        isScrolled ? 'shadow-lg py-2' : 'py-4'
      )}
      style={{ isolation: 'isolate' }}
    >
      <div 
        data-header-inner 
        className="container h-14 items-center gap-4"
        style={{ 
          maxWidth: '100%'
          /* Padding handled by header-align.css for consistency */
        }}
      >
        {/* Left: Home Button & Badge */}
        <div 
          id="app-header-left" 
          data-slot="left" 
          className="flex items-center gap-3"
        >
          <Button
            variant="default"
            size={isScrolled ? 'sm' : 'default'}
            onClick={() => handleNavigation(paths.home, 'Home')}
            className="hover-scale transition-all duration-300"
            aria-label="Go to homepage"
          >
            Home
          </Button>
          <picture>
            <source
              srcSet="/assets/brand/badges/built-in-canada-badge.webp"
              type="image/webp"
            />
            <img
              id="app-badge-ca"
              src="/assets/brand/badges/built-in-canada-badge.png"
              alt="Built in Canada"
              className="h-[45px] sm:h-[60px] lg:h-[65px] w-auto"
              width="156"
              height="65"
              loading="eager"
            />
          </picture>
        </div>

        {/* Center: Desktop Marketing Navigation */}
        <nav 
          data-slot="center" 
          aria-label="Primary" 
          className="hidden lg:flex items-center gap-1"
        >
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              {MARKETING_NAV.map((item) => (
                <NavigationMenuItem key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        'inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2',
                        'text-sm font-medium text-muted-foreground transition-all duration-300',
                        'hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground',
                        'focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                        'data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 hover-scale'
                      )}
                      aria-current={isActivePath(item.href) ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        {/* Center: Desktop Admin Navigation (Admin Only) */}
        {isUserAdmin && (
          <nav 
            data-slot="app-nav" 
            aria-label="Application" 
            className="hidden lg:flex items-center gap-1 ml-4 pl-4 border-l border-border"
          >
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                {ADMIN_NAV.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavigationMenuItem key={item.name}>
                      <NavigationMenuLink asChild>
                        <Link
                          to={item.href}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigation(item.href, item.name);
                          }}
                          className={cn(
                            'inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2',
                            'text-sm font-semibold text-primary transition-all duration-300',
                            'hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary',
                            'focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                            'data-[active]:bg-primary/20 data-[state=open]:bg-primary/20 hover-scale'
                          )}
                          aria-label={`Navigate to ${item.name}`}
                        >
                          {item.name}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>
        )}

        {/* Right: Language Switcher, User Menu, Burger */}
        <div 
          data-slot="right" 
          className="flex items-center gap-2"
        >
          <LanguageSwitcher />

          {/* Burger Menu Button (Mobile Only) */}
          <button
            id="burger-menu-button"
            data-testid="burger-menu-button"
            className="flex items-center justify-center p-2 rounded-md border border-border bg-background hover:bg-accent transition-all duration-300 hover-scale min-w-[44px] min-h-[44px]"
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            type="button"
          >
            {isMobileMenuOpen ? (
              <X size={20} className="text-foreground" strokeWidth={2} />
            ) : (
              <Menu size={20} className="text-foreground" strokeWidth={2} />
            )}
          </button>

          {/* User Menu */}
          {user ? (
            <>
              {/* Desktop: User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size={isScrolled ? 'sm' : 'default'}
                    className="hidden lg:flex items-center gap-2 hover:bg-accent transition-all duration-300"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-foreground leading-tight">
                        {userDisplayName}
                      </span>
                      {userRole && (
                        <span className={cn(
                          'text-xs font-medium leading-tight',
                          isUserAdmin ? 'text-primary' : 'text-muted-foreground'
                        )}>
                          {userRole.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{userDisplayName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isUserAdmin && (
                    <>
                      {ADMIN_NAV.map((item) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem 
                            key={item.name}
                            onClick={() => handleNavigation(item.href, item.name)}
                            className="cursor-pointer"
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {item.name}
                          </DropdownMenuItem>
                        );
                      })}
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="cursor-pointer text-primary focus:text-primary focus:bg-primary/10 dark:focus:bg-primary/20"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile: Sign Out Icon */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => signOut()} 
                className="lg:hidden hover:bg-accent transition-all duration-300"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button 
              variant="default" 
              size={isScrolled ? 'sm' : 'default'} 
              onClick={() => handleNavigation(paths.auth, 'Login')}
              className="hover-scale transition-all duration-300 shadow-lg hover:shadow-xl min-h-[44px]"
            >
              Login
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <nav
        id="mobile-menu"
        aria-label="Mobile"
        aria-hidden={!isMobileMenuOpen}
        className={cn(
          'lg:hidden border-t bg-background/95 backdrop-blur transition-all duration-300 overflow-hidden',
          isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        )}
      >
        <div className="container py-4 space-y-1">
          {/* Marketing Links */}
          <div className="px-2 py-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Information
            </p>
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="block px-4 py-2.5 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                onClick={() => handleNavigation(item.href, item.name, true)}
                aria-current={isActivePath(item.href) ? 'page' : undefined}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Admin Links (Admin Only) */}
          {isUserAdmin && (
            <>
              <div className="border-t border-border my-2" />
              <div className="px-2 py-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 px-2">
                  Application
                </p>
                {ADMIN_NAV.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation(item.href, item.name, true);
                    }}
                    className="block px-4 py-2.5 text-sm font-semibold rounded-md bg-primary/5 hover:bg-primary/10 text-primary transition-all duration-300"
                    aria-label={`Navigate to ${item.name}`}
                    aria-current={isActivePath(item.href) ? 'page' : undefined}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
