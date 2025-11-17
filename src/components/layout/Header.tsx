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
import builtCanadianBadge from '@/assets/badges/built-canadian.svg';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// CSS import removed in main branch - keeping defensive approach

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
  // Defensive hook calls with fallbacks for enterprise-grade resilience
  const {
    user = null,
    userRole = null,
    signOut = async () => ({ error: null }),
    isAdmin = () => false
  } = useAuth() || {};

  const { goToWithFeedback = async (path: string) => { window.location.href = path; } } = useSafeNavigation() || {};

  const location = useLocation();
  const mobileMenuId = 'mobile-menu';
  const isUserAdmin = typeof isAdmin === 'function' ? isAdmin() : false;
  const isMarketingHome = location?.pathname === paths.home;

  // Streamlined navigation handler - single source of truth with enterprise error handling
  const handleNavigation = React.useCallback(async (href: string, label: string, closeMenu = false) => {
    if (closeMenu) setIsMobileMenuOpen(false);
    try {
      if (goToWithFeedback && typeof goToWithFeedback === 'function') {
        await goToWithFeedback(href, label);
      } else {
        // Fallback to direct navigation if hook unavailable
        window.location.href = href;
      }
    } catch (error) {
      console.error(`[Header] Navigation failed for ${label}:`, error);
      // Ultimate fallback
      window.location.href = href;
    }
  }, [goToWithFeedback]);

  // Safe signOut handler with fallback
  const handleSignOut = React.useCallback(async () => {
    try {
      if (signOut && typeof signOut === 'function') {
        await signOut();
      }
      // Fallback: clear session and redirect
      window.location.href = paths.home;
    } catch (error) {
      console.error('[Header] Sign out failed:', error);
      // Force redirect on error
      window.location.href = paths.home;
    }
  }, [signOut]);

  // Optimized scroll handler
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
  }, [location?.pathname]);

  // Active path check
  const isActivePath = useCallback((href: string) => {
    const [path] = href.split('#');
    return location?.pathname === path;
  }, [location?.pathname]);

  // User display name with defensive checks
  const userDisplayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <header
      id="app-header"
      data-site-header
      data-testid="app-header"
      className={cn(
        'sticky top-0 z-[9999] w-full border-b bg-background/95 backdrop-blur',
        'supports-[backdrop-filter]:bg-background/60 transition-all duration-300 isolate',
        isScrolled ? 'shadow-lg py-2' : 'py-4'
      )}
      style={{ isolation: 'isolate' }}
    >
      <div 
        data-header-inner 
        className="flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 items-center gap-4"
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
          <img
            id="app-badge-ca"
            src={builtCanadianBadge}
            alt="Built in Canada"
            className="h-[45px] sm:h-[60px] lg:h-[65px] w-auto"
            width="156"
            height="65"
            loading="eager"
          />
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

        {/* Center: Desktop Admin Navigation (Admin Only, NOT on marketing home) */}
        {isUserAdmin && !isMarketingHome && (
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
                        'text-sm font-semibold text-foreground transition-all duration-300',
                        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                        'focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                        'data-[active]:bg-accent data-[state=open]:bg-accent hover-scale'
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

        {/* Right: Language Switcher, Burger, User Menu */}
        <div
          data-slot="right"
          className="flex items-center gap-2 ml-auto"
        >
          <LanguageSwitcher />

          {/* Burger Menu Button - Always visible */}
          <button
            id="burger-menu-button"
            data-testid="burger-menu-button"
            className="flex items-center justify-center p-2 rounded-md bg-background hover:bg-accent transition-all duration-300 hover-scale min-w-[44px] min-h-[44px]"
            style={{ border: '2px solid #FF6B35' }}
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            type="button"
          >
            {isMobileMenuOpen ? (
              <X size={20} strokeWidth={2} style={{ color: '#FF6B35' }} />
            ) : (
              <Menu size={20} strokeWidth={2} style={{ color: '#FF6B35' }} />
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
                          isUserAdmin ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
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
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  {isUserAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Application
                        </p>
                      </div>
                      <DropdownMenuItem
                        onClick={() => handleNavigation(paths.dashboard, 'Dashboard')}
                        className="cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleNavigation(paths.calls, 'Calls')}
                        className="cursor-pointer"
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Calls
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleNavigation(paths.phoneApps, 'Phone Apps')}
                        className="cursor-pointer"
                      >
                        <Smartphone className="mr-2 h-4 w-4" />
                        Phone Apps
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleNavigation(paths.voiceSettings, 'Settings')}
                        className="cursor-pointer"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:text-red-400 dark:focus:bg-red-950/20"
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
                onClick={handleSignOut}
                className="lg:hidden hover:bg-accent transition-all duration-300"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button
              variant="success"
              size={isScrolled ? 'sm' : 'default'}
              onClick={() => handleNavigation(paths.auth, 'Login')}
              className="hover-scale transition-all duration-300 shadow-lg hover:shadow-xl min-h-[44px]"
            >
              Login
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer - Conditionally rendered to avoid aria-hidden-focus violations */}
      {isMobileMenuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Mobile navigation"
          aria-hidden="false"
          className="border-t bg-background/95 backdrop-blur transition-all duration-300 overflow-hidden"
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

            {/* Admin Links (Admin Only, NOT on marketing home) */}
            {isUserAdmin && !isMarketingHome && (
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
                      className="block px-4 py-2.5 text-sm font-semibold rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                      aria-label={`Navigate to ${item.name}`}
                      aria-current={isActivePath(item.href) ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </>
            )}
            <div className="border-t border-border" />
            <div className="space-y-3">
              {isMobileMenuOpen && <LanguageSwitcher className="w-full" />}
              {user ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold text-red-600 transition-all duration-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                <Button
                  variant="success"
                  onClick={() => handleNavigation(paths.auth, 'Login', true)}
                  className="w-full justify-center px-4 py-2.5 text-sm font-semibold"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};
